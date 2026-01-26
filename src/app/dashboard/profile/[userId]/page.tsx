'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserCircle, Mail, MapPin, Book, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    role: 'tutor' | 'student';
    address?: string;
    subjects?: string[];
}

interface Connection {
    studentId: string;
    teacherId: string;
    status: 'pending' | 'approved' | 'denied';
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
    const params = useParams();
    const profileUserId = params.userId as string;

    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: currentUserProfile } = useDoc<{name: string, role: 'student' | 'tutor'}>(currentUserProfileRef);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !profileUserId) return null;
        return doc(firestore, 'users', profileUserId);
    }, [firestore, profileUserId]);
    
    const { data: teacherProfile, isLoading: isProfileLoading } = useDoc<TeacherProfile>(userProfileRef);
    
    // Fetch connection status between current user and this teacher
    const connectionQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid || !profileUserId) return null;
        return query(collection(firestore, 'connections'), where('studentId', '==', user.uid), where('teacherId', '==', profileUserId));
    }, [firestore, user?.uid, profileUserId]);
    const { data: connections } = useCollection<Connection>(connectionQuery);
    const connectionStatus = useMemo(() => connections?.[0]?.status, [connections]);

    const handleConnect = () => {
        if (!user || !currentUserProfile || !teacherProfile || !firestore || currentUserProfile.role !== 'student') {
            alert("You must be logged in as a student to connect.");
            return;
        }

        const connectionData = {
            studentId: user.uid,
            studentName: currentUserProfile.name,
            teacherId: teacherProfile.id,
            teacherName: teacherProfile.name,
            status: 'pending',
            createdAt: serverTimestamp(),
        };
        
        const connectionsColRef = collection(firestore, 'connections');
        addDocumentNonBlocking(connectionsColRef, connectionData);
        alert(`Connection request sent to ${teacherProfile.name}!`);
    };

    const isLoading = isAuthLoading || isProfileLoading || !currentUserProfile;

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="student" />
                <div className="flex-1 flex items-center justify-center"><p>Loading profile...</p></div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={currentUserProfile?.name} userRole={currentUserProfile?.role} />
            <main className="flex-1">
                 <div className="container mx-auto p-4 md:p-8">
                     <div className="max-w-3xl mx-auto space-y-6">
                        <Button variant="outline" asChild className="mb-4">
                            <Link href="/dashboard/student">
                                &larr; Back to Dashboard
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
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <UserCircle className="h-8 w-8 text-primary" />
                                        {teacherProfile.name}
                                    </CardTitle>
                                    <CardDescription>
                                        Professional teacher profile on EduConnect Pro.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <ProfileItem icon={<Mail className="h-5 w-5" />} label="Email" value={teacherProfile.email} />
                                        <ProfileItem icon={<MapPin className="h-5 w-5" />} label="Address / Location" value={teacherProfile.address} />
                                        <ProfileItem icon={<Book className="h-5 w-5" />} label="Subjects Taught" value={teacherProfile.subjects} />
                                    </div>
                                    {currentUserProfile?.role === 'student' && user?.uid !== profileUserId && (
                                        <div className="border-t pt-6">
                                             <Button 
                                                className="w-full"
                                                onClick={handleConnect} 
                                                disabled={!!connectionStatus}
                                            >
                                                {connectionStatus === 'approved' ? (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 mr-2" /> Connected
                                                    </>
                                                ) : connectionStatus === 'pending' ? (
                                                     <>
                                                        <Clock className="h-4 w-4 mr-2" /> Request Pending
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlusCircle className="h-4 w-4 mr-2" /> Request to Connect
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                         )}
                    </div>
                </div>
            </main>
        </div>
    );
}
