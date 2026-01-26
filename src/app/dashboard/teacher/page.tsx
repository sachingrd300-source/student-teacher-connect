'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Check, X, Users, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { useEffect } from 'react';


interface Connection {
    id: string;
    studentId: string;
    studentName: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: Timestamp;
}

const StatCard = ({ title, value, icon, isLoading }: { title: string, value: string | number, icon: React.ReactNode, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="h-8 w-1/2 bg-muted rounded-md animate-pulse" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
    </Card>
);

export default function TeacherDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string, status: 'pending_verification' | 'approved' | 'denied'}>(userProfileRef);

    const isTutor = userProfile?.role === 'tutor';

    useEffect(() => {
        if (isAuthLoading || isProfileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile) {
             if (!isTutor) {
                router.replace('/dashboard/student');
            } else if (userProfile.status !== 'approved') {
                router.replace('/dashboard/teacher/status');
            }
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, isTutor, router]);
    
    // --- Data Fetching ---
    const connectionsQuery = useMemoFirebase(() => {
        if (!isTutor || !firestore || !user) return null;
        return query(collection(firestore, 'connections'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user, isTutor]);
    const { data: connections, isLoading: connectionsLoading } = useCollection<Connection>(connectionsQuery);
    
    const pendingConnections = useMemo(() => connections?.filter(c => c.status === 'pending') || [], [connections]);
    const approvedConnections = useMemo(() => connections?.filter(c => c.status === 'approved') || [], [connections]);

    const handleRequest = (connectionId: string, newStatus: 'approved' | 'denied') => {
        if (!firestore) return;
        const connectionRef = doc(firestore, 'connections', connectionId);
        updateDocumentNonBlocking(connectionRef, { status: newStatus });
    };

    if (isAuthLoading || isProfileLoading || !userProfile || userProfile.status !== 'approved') {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading teacher dashboard...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in-down">
                    <h1 className="text-3xl font-bold">Teacher Dashboard</h1>

                    <div className="grid gap-4 md:grid-cols-2">
                        <StatCard
                            title="Total Students"
                            value={approvedConnections?.length ?? 0}
                            icon={<Users className="h-4 w-4" />}
                            isLoading={connectionsLoading}
                        />
                        <StatCard
                            title="Pending Requests"
                            value={pendingConnections?.length ?? 0}
                            icon={<Clock className="h-4 w-4" />}
                            isLoading={connectionsLoading}
                        />
                    </div>
                    
                    <div className="grid gap-8 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Connection Requests</CardTitle>
                                <CardDescription>Approve or deny requests from students.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {connectionsLoading ? <p className="text-center py-4">Loading requests...</p> : 
                                pendingConnections && pendingConnections.length > 0 ?
                                (
                                    <div className="space-y-4">
                                        {pendingConnections.map(req => (
                                            <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <p className="font-bold">{req.studentName}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Requested on: {new Date(req.createdAt.seconds * 1000).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 mt-3 sm:mt-0">
                                                    <Button size="sm" className="bg-success/10 text-success hover:bg-success/20 hover:text-success" onClick={() => handleRequest(req.id, 'approved')}>
                                                        <Check className="h-4 w-4 mr-2" />Approve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleRequest(req.id, 'denied')}>
                                                        <X className="h-4 w-4 mr-2" />Deny
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No pending requests.</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>My Students</CardTitle>
                                <CardDescription>A list of all your connected students.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {connectionsLoading ? <p className="text-center py-4">Loading students...</p> : 
                                approvedConnections && approvedConnections.length > 0 ?
                                (
                                    <div className="space-y-3">
                                        {approvedConnections.map(conn => (
                                            <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <p className="font-semibold">{conn.studentName}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No students have connected yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
