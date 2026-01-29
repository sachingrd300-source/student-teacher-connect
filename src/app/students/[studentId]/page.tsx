'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, User as UserIcon, ArrowLeft, Phone, MapPin, GraduationCap } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface StudentProfile {
    name: string;
    email: string;
    role: 'student';
    bio?: string;
    mobileNumber?: string;
    address?: string;
    fatherName?: string;
    class?: string;
}

interface UserProfile {
    name?: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}


const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

export default function StudentProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const studentId = params.studentId as string;

    const studentProfileRef = useMemoFirebase(() => {
        if (!firestore || !studentId) return null;
        return doc(firestore, 'users', studentId);
    }, [firestore, studentId]);
    const { data: studentProfile, isLoading: profileLoading } = useDoc<StudentProfile>(studentProfileRef);
    
    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    const isLoading = isUserLoading || profileLoading;

    if (isLoading || !studentProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <GraduationCap className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Student Profile...</p>
            </div>
        );
    }
    
    if (studentProfile.role !== 'student') {
        return (
             <div className="flex h-screen flex-col items-center justify-center">
                <p className="text-2xl font-semibold mb-4">User Not Found</p>
                <p className="text-muted-foreground">This user is not a student.</p>
                 <Button variant="outline" onClick={() => router.back()} className="mt-8">Go Back</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={currentUserProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-2xl mx-auto">
                     <Button variant="ghost" onClick={() => router.push('/dashboard/teacher')} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader className="text-center">
                             <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                                <AvatarFallback className="text-4xl">{getInitials(studentProfile.name)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-3xl font-serif">{studentProfile.name}</CardTitle>
                            <CardDescription className="text-lg text-primary">Student</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 grid gap-4">
                            <InfoItem icon={<Mail className="w-5 h-5 text-primary" />} label="Email" value={studentProfile.email} />
                            <InfoItem icon={<Phone className="w-5 h-5 text-primary" />} label="Mobile Number" value={studentProfile.mobileNumber} />
                            <InfoItem icon={<UserIcon className="w-5 h-5 text-primary" />} label="Father's Name" value={studentProfile.fatherName} />
                            <InfoItem icon={<GraduationCap className="w-5 h-5 text-primary" />} label="Class" value={studentProfile.class} />
                            <InfoItem icon={<MapPin className="w-5 h-5 text-primary" />} label="Home Address" value={studentProfile.address} />
                            
                            {studentProfile.bio && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-2">Bio</h4>
                                    <p className="text-muted-foreground text-sm">{studentProfile.bio}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
                <p className="font-semibold break-words">{value}</p>
            </div>
        </div>
    );
};
