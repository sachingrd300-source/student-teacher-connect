
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, addDoc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Building, MapPin, Phone, Wallet, Briefcase, ArrowLeft, BookCopy, Send, Check, Home, Award } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface TeacherProfile {
    name: string;
    email: string;
    role: 'teacher';
    subject?: string;
    experience?: string;
    bio?: string;
    coachingCenterName?: string;
    coachingAddress?: string;
    googleMapsLink?: string;
    whatsappNumber?: string;
    fee?: string;
    isHomeTutor?: boolean;
    teacherWorkStatus?: 'own_coaching' | 'achievers_associate' | 'both';
}

interface UserProfile {
    name?: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

interface Batch {
    id: string;
    name: string;
    teacherId: string;
    teacherName: string;
}

interface Enrollment {
    id: string;
    batchId: string;
    status: 'pending' | 'approved';
}

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
};

export default function TeacherProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const teacherId = params.teacherId as string;

    const [joiningState, setJoiningState] = useState<{[batchId: string]: boolean}>({});

    // Memoize the ref for the teacher being viewed
    const teacherProfileRef = useMemoFirebase(() => {
        if (!firestore || !teacherId) return null;
        return doc(firestore, 'users', teacherId);
    }, [firestore, teacherId]);

    const { data: teacherProfile, isLoading: profileLoading } = useDoc<TeacherProfile>(teacherProfileRef);

    // Memoize the ref for the current logged-in user
    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);

    // New queries for batches and enrollments
    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !teacherId) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', teacherId));
    }, [firestore, teacherId]);
    const { data: batches, isLoading: batchesLoading } = useCollection<Batch>(batchesQuery);

    const studentEnrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid || currentUserProfile?.role !== 'student') return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user?.uid, currentUserProfile?.role]);
    const { data: studentEnrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(studentEnrollmentsQuery);

    const enrolledBatchIds = useMemo(() => {
        return new Set(studentEnrollments?.map(e => e.batchId));
    }, [studentEnrollments]);

    // Redirect if user is not logged in
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    const handleJoinRequest = async (batch: Batch) => {
        if (!firestore || !user || !currentUserProfile || currentUserProfile.role !== 'student' || !teacherProfile) return;

        setJoiningState(prev => ({ ...prev, [batch.id]: true }));

        try {
            await addDoc(collection(firestore, 'enrollments'), {
                studentId: user.uid,
                studentName: currentUserProfile.name,
                teacherId: teacherId,
                teacherName: teacherProfile.name,
                batchId: batch.id,
                batchName: batch.name,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
            // The real-time hook for studentEnrollments will update the UI.
        } catch (error) {
            console.error("Error sending join request:", error);
            setJoiningState(prev => ({ ...prev, [batch.id]: false }));
        }
    };


    const isLoading = isUserLoading || profileLoading || batchesLoading || (currentUserProfile?.role === 'student' && enrollmentsLoading);

    if (isLoading || !teacherProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Image src="/logo.png" alt="Achiever's Community Logo" width={80} height={80} className="animate-pulse" />
                <p className="text-muted-foreground">Loading Teacher Profile...</p>
            </div>
        );
    }
    
    if (teacherProfile.role !== 'teacher') {
        return (
             <div className="flex h-screen items-center justify-center">
                <p>This user is not a teacher.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={currentUserProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-2xl mx-auto">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader className="text-center">
                             <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                                <AvatarFallback className="text-4xl">{getInitials(teacherProfile.name)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-3xl font-serif">{teacherProfile.name}</CardTitle>
                            <CardDescription className="text-lg text-primary">{teacherProfile.subject || 'Teacher'}</CardDescription>
                            <div className="flex justify-center gap-2 mt-4 flex-wrap">
                                {teacherProfile.isHomeTutor && (
                                    <div className="flex items-center gap-1.5 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-3 py-1 rounded-full">
                                        <Home className="h-4 w-4" />
                                        <span>Home Teacher</span>
                                    </div>
                                )}
                                {(teacherProfile.teacherWorkStatus === 'own_coaching' || teacherProfile.teacherWorkStatus === 'achievers_associate' || teacherProfile.teacherWorkStatus === 'both') && (
                                    <div className="flex items-center gap-1.5 text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 px-3 py-1 rounded-full">
                                        <Building className="h-4 w-4" />
                                        <span>Coaching Teacher</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="mt-6 grid gap-6">
                            {teacherProfile.bio && (
                                <div className="text-center border-b pb-6">
                                    <p className="text-muted-foreground">{teacherProfile.bio}</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                                <InfoItem icon={<Building className="w-5 h-5 text-primary" />} label="Coaching Center" value={teacherProfile.coachingCenterName} />
                                <InfoItem icon={<Award className="w-5 h-5 text-primary" />} label="Experience" value={teacherProfile.experience} />
                                <InfoItem icon={<Wallet className="w-5 h-5 text-primary" />} label="Fee Structure" value={teacherProfile.fee} />
                                <InfoItem icon={<MapPin className="w-5 h-5 text-primary" />} label="Coaching Address" value={teacherProfile.coachingAddress} />
                                <InfoItem icon={<Phone className="w-5 h-5 text-primary" />} label="WhatsApp" value={teacherProfile.whatsappNumber} />
                            </div>

                            {teacherProfile.googleMapsLink && (
                                <div className="mt-4 text-center">
                                    <Button asChild>
                                        <a href={teacherProfile.googleMapsLink} target="_blank" rel="noopener noreferrer">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            View on Google Maps
                                        </a>
                                    </Button>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    {currentUserProfile?.role === 'student' && batches && batches.length > 0 && (
                        <Card className="mt-8 rounded-2xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center"><BookCopy className="mr-3 h-5 w-5"/>Available Batches</CardTitle>
                                <CardDescription>Send a request to join any of the available batches.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {batches.map(batch => {
                                    const isEnrolled = enrolledBatchIds.has(batch.id);
                                    const isJoining = joiningState[batch.id];
                                    return (
                                        <div key={batch.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-background">
                                            <p className="font-semibold">{batch.name}</p>
                                            <Button 
                                                onClick={() => handleJoinRequest(batch)}
                                                disabled={isEnrolled || isJoining}
                                                variant={isEnrolled ? "outline" : "default"}
                                                className="mt-3 sm:mt-0"
                                            >
                                                {isJoining ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : isEnrolled ? (
                                                    <>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Request Sent
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Send Join Request
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1 flex-shrink-0">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={cn("font-semibold break-words", label === 'Coaching Center' && "text-primary font-bold")}>
                    {value}
                </p>
            </div>
        </div>
    );
};
