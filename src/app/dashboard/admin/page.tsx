'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    status: 'pending_verification' | 'approved' | 'denied';
    createdAt: Timestamp;
}

const TeacherRow = ({ teacher, onApprove, onDeny }: { teacher: TeacherProfile, onApprove: (id: string) => void, onDeny: (id: string) => void}) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b last:border-0">
        <div>
            <p className="font-semibold">{teacher.name}</p>
            <p className="text-sm text-muted-foreground">{teacher.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
                Registered: {new Date(teacher.createdAt.seconds * 1000).toLocaleDateString()}
            </p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
            <Button size="sm" variant="outline" className="bg-success/10 text-success hover:bg-success/20 hover:text-success" onClick={() => onApprove(teacher.id)}>
                <Check className="h-4 w-4 mr-2" />Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDeny(teacher.id)}>
                <X className="h-4 w-4 mr-2" />Deny
            </Button>
        </div>
    </div>
);

const StatusRow = ({ teacher }: { teacher: TeacherProfile }) => {
    const statusConfig = {
        approved: {
            className: "text-success",
            text: "Approved"
        },
        denied: {
            className: "text-destructive",
            text: "Denied"
        }
    }
    const config = teacher.status === 'approved' ? statusConfig.approved : statusConfig.denied;

    return (
        <div className="flex items-center justify-between p-3 border-b last:border-0">
            <div>
                <p className="font-medium">{teacher.name}</p>
                <p className="text-sm text-muted-foreground">{teacher.email}</p>
            </div>
            <p className={`font-semibold text-sm ${config.className}`}>{config.text}</p>
        </div>
    );
};


export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string}>(userProfileRef);

    const isAdmin = userProfile?.role === 'admin';

    const tutorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'tutor'));
    }, [firestore]);

    const { data: tutors, isLoading: tutorsLoading } = useCollection<TeacherProfile>(tutorsQuery);

    const pendingTutors = useMemo(() => tutors?.filter(t => t.status === 'pending_verification') || [], [tutors]);
    const approvedTutors = useMemo(() => tutors?.filter(t => t.status === 'approved') || [], [tutors]);
    const deniedTutors = useMemo(() => tutors?.filter(t => t.status === 'denied') || [], [tutors]);


    if (isUserLoading || isProfileLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }
    
    if (!user) {
        router.replace('/login');
        return null;
    }

    if (!isAdmin) {
        router.replace('/dashboard');
        return null;
    }

    const handleApprove = (teacherId: string) => {
        if (!firestore) return;
        const teacherRef = doc(firestore, 'users', teacherId);
        updateDocumentNonBlocking(teacherRef, { status: 'approved' });
    };

    const handleDeny = (teacherId: string) => {
        if (!firestore) return;
        if(confirm('Are you sure you want to deny this teacher?')) {
            const teacherRef = doc(firestore, 'users', teacherId);
            updateDocumentNonBlocking(teacherRef, { status: 'denied' });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="admin" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <div className="flex items-center gap-4 mb-6">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    </div>

                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="pending">Pending ({pendingTutors.length})</TabsTrigger>
                            <TabsTrigger value="approved">Approved ({approvedTutors.length})</TabsTrigger>
                            <TabsTrigger value="denied">Denied ({deniedTutors.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pending Teacher Verifications</CardTitle>
                                    <CardDescription>Review and approve or deny new teacher registrations.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {tutorsLoading ? <p className="p-6">Loading...</p> : 
                                    pendingTutors.length > 0 ? (
                                        <div>
                                            {pendingTutors.map(teacher => (
                                                <TeacherRow key={teacher.id} teacher={teacher} onApprove={handleApprove} onDeny={handleDeny} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="p-6 text-center text-muted-foreground">No pending verifications.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="approved">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Approved Teachers</CardTitle>
                                    <CardDescription>List of all active teachers on the platform.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                     {tutorsLoading ? <p className="p-6">Loading...</p> :
                                     approvedTutors.length > 0 ? (
                                        <div>
                                            {approvedTutors.map(teacher => <StatusRow key={teacher.id} teacher={teacher} />)}
                                        </div>
                                     ) : (
                                        <p className="p-6 text-center text-muted-foreground">No approved teachers yet.</p>
                                     )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="denied">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Denied Teachers</CardTitle>
                                    <CardDescription>List of teachers whose registration was denied.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                     {tutorsLoading ? <p className="p-6">Loading...</p> :
                                     deniedTutors.length > 0 ? (
                                        <div>
                                            {deniedTutors.map(teacher => <StatusRow key={teacher.id} teacher={teacher} />)}
                                        </div>
                                     ) : (
                                        <p className="p-6 text-center text-muted-foreground">No denied teachers.</p>
                                     )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
