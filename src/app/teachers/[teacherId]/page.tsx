'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Building, MapPin, Phone, Wallet, Briefcase, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface TeacherProfile {
    name: string;
    email: string;
    role: 'teacher';
    subject?: string;
    bio?: string;
    coachingCenterName?: string;
    address?: string;
    whatsappNumber?: string;
    fee?: string;
}

interface UserProfile {
    name?: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
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
    
    // Redirect if user is not logged in
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    const isLoading = isUserLoading || profileLoading;

    if (isLoading || !teacherProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Briefcase className="h-16 w-16 animate-pulse text-primary" />
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
                        </CardHeader>
                        <CardContent className="mt-6 grid gap-6">
                            {teacherProfile.bio && (
                                <div className="text-center border-b pb-6">
                                    <p className="text-muted-foreground">{teacherProfile.bio}</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                                <InfoItem icon={<Building className="w-5 h-5 text-primary" />} label="Coaching Center" value={teacherProfile.coachingCenterName} />
                                <InfoItem icon={<Wallet className="w-5 h-5 text-primary" />} label="Fee Structure" value={teacherProfile.fee} />
                                <InfoItem icon={<MapPin className="w-5 h-5 text-primary" />} label="Tuition Address" value={teacherProfile.address} />
                                <InfoItem icon={<Phone className="w-5 h-5 text-primary" />} label="WhatsApp" value={teacherProfile.whatsappNumber} />
                            </div>

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
