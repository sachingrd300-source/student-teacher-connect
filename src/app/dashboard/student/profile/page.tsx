'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserCircle, Mail, Phone, GraduationCap, User, Home, KeyRound } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';

interface UserProfile {
    name: string;
    email: string;
    role: 'tutor' | 'student';
    mobileNumber?: string;
    fatherName?: string;
    address?: string;
    classLevel?: string;
    studentLoginId?: string;
}

const ProfileItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
};

export default function StudentProfilePage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
    
    useEffect(() => {
        if (!isAuthLoading && !isProfileLoading) {
            if (!user) {
                router.replace('/login');
            } else if (userProfile && userProfile.role !== 'student') {
                router.replace('/dashboard/teacher');
            }
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, router]);

    if (isAuthLoading || isProfileLoading || !userProfile) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="student" />
                <div className="flex-1 flex items-center justify-center"><p>Loading profile...</p></div>
            </div>
        );
    }
    
    if (userProfile.role !== 'student') {
        return (
            <div className="flex flex-col min-h-screen">
                 <DashboardHeader userName={userProfile.name} userRole="tutor" />
                <div className="flex-1 flex items-center justify-center"><p>Unauthorized. Redirecting...</p></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="student" />
            <main className="flex-1">
                 <div className="container mx-auto p-4 md:p-8">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <UserCircle className="h-8 w-8 text-primary" />
                                {userProfile.name}
                            </CardTitle>
                            <CardDescription>
                                Your personal details on EduConnect Pro.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <h3 className="md:col-span-2 text-lg font-semibold border-b pb-2">Account Details</h3>
                                <ProfileItem icon={<KeyRound className="h-5 w-5" />} label="Student Login ID" value={userProfile.studentLoginId} />
                                <ProfileItem icon={<Mail className="h-5 w-5" />} label="Email" value={userProfile.email} />

                                <h3 className="md:col-span-2 text-lg font-semibold border-b pb-2 pt-4">Personal Information</h3>
                                <ProfileItem icon={<User className="h-5 w-5" />} label="Father's Name" value={userProfile.fatherName} />
                                <ProfileItem icon={<Phone className="h-5 w-5" />} label="Mobile Number" value={userProfile.mobileNumber} />
                                <ProfileItem icon={<GraduationCap className="h-5 w-5" />} label="Class Level" value={userProfile.classLevel} />
                                <ProfileItem icon={<Home className="h-5 w-5" />} label="Address" value={userProfile.address} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
