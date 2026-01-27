'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher';
}

interface Connection {
    id: string;
    studentId: string;
    teacherId: string;
    studentName: string;
    status: 'pending' | 'approved';
}

// Helper to get initials from a name
const getInitials = (name: string) => {
    if (!name) return '';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('');
};

export default function TeacherDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    // --- Data Fetching ---
    // Get all connections for the current teacher
    const connectionsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'connections'), where('teacherId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: connections, isLoading: connectionsLoading } = useCollection<Connection>(connectionsQuery);

    // --- Memos for derived state ---
    const [pendingRequests, approvedStudents] = useMemo(() => {
        if (!connections) return [[], []];
        const pending: Connection[] = [];
        const approved: Connection[] = [];
        connections.forEach(c => {
            if (c.status === 'pending') {
                pending.push(c);
            } else {
                approved.push(c);
            }
        });
        return [pending, approved];
    }, [connections]);

    // --- Auth & Role Check Effect ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && userProfile.role !== 'teacher') {
            router.replace('/dashboard');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);

    // --- Event Handlers ---
    const handleApprove = async (connectionId: string) => {
        if (!firestore) return;
        const connectionRef = doc(firestore, 'connections', connectionId);
        await updateDoc(connectionRef, { status: 'approved' });
    };

    const handleDecline = async (connectionId: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, 'connections', connectionId));
    };


    // --- Render Logic ---
    const isLoading = isUserLoading || profileLoading || connectionsLoading;

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold font-serif mb-6">Teacher Dashboard</h1>
                    
                    <Tabs defaultValue="requests" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="requests">Connection Requests ({pendingRequests.length})</TabsTrigger>
                            <TabsTrigger value="students">My Students ({approvedStudents.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="requests" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pending Requests</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    {pendingRequests.length > 0 ? (
                                        pendingRequests.map(req => (
                                            <div key={req.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                                <div className="flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(req.studentName)}</AvatarFallback>
                                                    </Avatar>
                                                    <p className="font-semibold">{req.studentName}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="icon" variant="outline" className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50" onClick={() => handleApprove(req.id)}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50" onClick={() => handleDecline(req.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No pending requests.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="students" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Approved Students</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    {approvedStudents.length > 0 ? (
                                        approvedStudents.map(student => (
                                             <div key={student.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                                 <div className="flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(student.studentName)}</AvatarFallback>
                                                    </Avatar>
                                                    <p className="font-semibold">{student.studentName}</p>
                                                </div>
                                                <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDecline(student.id)}>Remove</Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">You have no students yet.</p>
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
