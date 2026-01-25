'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserCircle, Mail, Phone, Award, Book, Briefcase, MapPin, MessageSquare, DollarSign, Percent, PlusCircle, CheckCircle } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    role: 'tutor' | 'student' | 'admin';
    mobileNumber?: string;
    coachingName?: string;
    address?: string;
    whatsappNumber?: string;
    subjects?: string[];
    qualification?: string;
    experience?: string;
    fee?: string;
    discount?: string;
}

interface ClassData {
    id: string;
    title: string;
    subject: string;
    batchTime: string;
    teacherId: string;
    teacherName: string;
}

interface Enrollment {
    classId: string;
}

const ProfileItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | string[] }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{Array.isArray(value) ? value.join(', ') : value}</p>
            </div>
        </div>
    );
};

export default function TeacherPublicProfilePage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const profileUserId = params.userId as string;

    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: currentUserProfile } = useDoc<{name: string, role: 'student' | 'tutor', mobileNumber?: string}>(currentUserProfileRef);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !profileUserId) return null;
        return doc(firestore, 'users', profileUserId);
    }, [firestore, profileUserId]);
    
    const { data: teacherProfile, isLoading: isProfileLoading } = useDoc<TeacherProfile>(userProfileRef);

    // Fetch the teacher's classes
    const classesQuery = useMemoFirebase(() => {
        if (!firestore || !profileUserId) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', profileUserId));
    }, [firestore, profileUserId]);
    const { data: teacherClasses, isLoading: classesLoading } = useCollection<ClassData>(classesQuery);
    
    // Fetch current student's enrollments to check if already enrolled
    const studentEnrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: studentEnrollments } = useCollection<Enrollment>(studentEnrollmentsQuery);
    const enrolledClassIds = useMemo(() => new Set(studentEnrollments?.map(e => e.classId) || []), [studentEnrollments]);

    const handleEnroll = (classData: ClassData) => {
        if (!user || !currentUserProfile) {
            alert("You must be logged in as a student to enroll.");
            return;
        }

        const enrollmentData = {
            studentId: user.uid,
            studentName: currentUserProfile.name,
            mobileNumber: currentUserProfile.mobileNumber ?? '',
            classId: classData.id,
            teacherId: classData.teacherId,
            classTitle: classData.title,
            classSubject: classData.subject,
            teacherName: classData.teacherName,
            batchTime: classData.batchTime,
            status: 'approved',
            createdAt: serverTimestamp(),
        };
        
        const enrollmentsColRef = collection(firestore, 'enrollments');
        addDocumentNonBlocking(enrollmentsColRef, enrollmentData);
        alert(`Successfully enrolled in ${classData.title}!`);
    };


    if (isAuthLoading || isProfileLoading || !currentUserProfile) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="student" />
                <div className="flex-1 flex items-center justify-center"><p>Loading profile...</p></div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={currentUserProfile.name} userRole={currentUserProfile.role} />
            <main className="flex-1">
                 <div className="container mx-auto p-4 md:p-8">
                     <div className="max-w-3xl mx-auto space-y-6">
                        <Button variant="outline" asChild className="mb-4">
                            <Link href="/dashboard/student">
                                &larr; Back to Find a Teacher
                            </Link>
                        </Button>
                        {!teacherProfile && !isProfileLoading && (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <p className="text-lg font-semibold">Teacher Not Found</p>
                                    <p className="text-muted-foreground">The profile you are looking for does not exist.</p>
                                </CardContent>
                            </Card>
                        )}
                        {teacherProfile && teacherProfile.role !== 'tutor' && (
                             <Card>
                                <CardContent className="p-8 text-center">
                                    <p className="text-lg font-semibold">Profile Not Available</p>
                                    <p className="text-muted-foreground">This user is not a teacher.</p>
                                </CardContent>
                            </Card>
                        )}
                         {teacherProfile && teacherProfile.role === 'tutor' && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-2xl">
                                            <UserCircle className="h-8 w-8 text-primary" />
                                            {teacherProfile.name}
                                        </CardTitle>
                                        <CardDescription>
                                            Professional profile on EduConnect Pro.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <h3 className="md:col-span-2 text-lg font-semibold border-b pb-2">Contact & Location</h3>
                                            <ProfileItem icon={<Mail className="h-5 w-5" />} label="Email" value={teacherProfile.email} />
                                            <ProfileItem icon={<Phone className="h-5 w-5" />} label="Mobile Number" value={teacherProfile.mobileNumber} />
                                            <ProfileItem icon={<MessageSquare className="h-5 w-5" />} label="WhatsApp Number" value={teacherProfile.whatsappNumber} />
                                            <ProfileItem icon={<MapPin className="h-5 w-5" />} label="Address / Location" value={teacherProfile.address} />
                                            
                                            <h3 className="md:col-span-2 text-lg font-semibold border-b pb-2 pt-4">Professional Details</h3>
                                            <ProfileItem icon={<Briefcase className="h-5 w-5" />} label="Coaching Name" value={teacherProfile.coachingName} />
                                            <ProfileItem icon={<Book className="h-5 w-5" />} label="Subjects Taught" value={teacherProfile.subjects} />
                                            <ProfileItem icon={<Award className="h-5 w-5" />} label="Highest Qualification" value={teacherProfile.qualification} />
                                            <ProfileItem icon={<UserCircle className="h-5 w-5" />} label="Experience" value={teacherProfile.experience} />
                                            <ProfileItem icon={<DollarSign className="h-5 w-5" />} label="Fee Structure" value={teacherProfile.fee} />
                                            <ProfileItem icon={<Percent className="h-5 w-5" />} label="Discounts Available" value={teacherProfile.discount} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Available Classes</CardTitle>
                                        <CardDescription>Enroll directly in any of the classes offered by {teacherProfile.name}.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {classesLoading ? <p>Loading classes...</p> : 
                                        teacherClasses && teacherClasses.length > 0 ? (
                                            <div className="space-y-4">
                                                {teacherClasses.map(c => {
                                                    const isEnrolled = enrolledClassIds.has(c.id);
                                                    return (
                                                        <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
                                                            <div>
                                                                <p className="font-semibold">{c.title}</p>
                                                                <p className="text-sm text-muted-foreground">{c.subject} - {c.batchTime}</p>
                                                            </div>
                                                            <Button 
                                                                className="mt-3 sm:mt-0"
                                                                onClick={() => handleEnroll(c)} 
                                                                disabled={isEnrolled}
                                                            >
                                                                {isEnrolled ? (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 mr-2" /> Already Enrolled
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <PlusCircle className="h-4 w-4 mr-2" /> Enroll Now
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">This teacher has not listed any classes yet.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                         )}
                    </div>
                </div>
            </main>
        </div>
    );
}
