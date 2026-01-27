'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher';
}

interface Connection {
    id: string;
    studentId: string;
    teacherId: string;
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

export default function StudentDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    // --- Data Fetching ---
    // 1. Get all teachers
    const teachersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'teacher'));
    }, [firestore]);
    const { data: teachers, isLoading: teachersLoading } = useCollection<UserProfile>(teachersQuery);

    // 2. Get all connections for the current student
    const connectionsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'connections'), where('studentId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: connections, isLoading: connectionsLoading } = useCollection<Connection>(connectionsQuery);

    // --- Memos for derived state ---
    const connectionsMap = useMemo(() => {
        if (!connections) return new Map();
        return new Map(connections.map(c => [c.teacherId, c]));
    }, [connections]);
    
    // --- Auth & Role Check Effect ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && userProfile.role !== 'student') {
            router.replace('/dashboard');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);

    // --- Event Handlers ---
    const handleSendRequest = async (teacherId: string, teacherName: string) => {
        if (!firestore || !user || !userProfile) return;
        
        await addDoc(collection(firestore, 'connections'), {
            studentId: user.uid,
            teacherId: teacherId,
            studentName: userProfile.name,
            teacherName: teacherName,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
    };

    const handleCancelRequest = async (teacherId: string) => {
        if(!firestore) return;
        const connection = connectionsMap.get(teacherId);
        if (connection && connection.id) {
            await deleteDoc(doc(firestore, 'connections', connection.id));
        }
    };


    // --- Render Logic ---
    const isLoading = isUserLoading || profileLoading || teachersLoading || connectionsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const renderConnectionButton = (teacher: UserProfile & { id: string }) => {
        const connection = connectionsMap.get(teacher.id);
        
        if (connection) {
            if (connection.status === 'approved') {
                return <Button variant="secondary" disabled>Connected</Button>;
            }
            if (connection.status === 'pending') {
                return <Button variant="outline" onClick={() => handleCancelRequest(teacher.id)}>Request Sent</Button>;
            }
        }
        
        return <Button onClick={() => handleSendRequest(teacher.id, teacher.name)}>Send Request</Button>;
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold font-serif mb-6">Find a Teacher</h1>
                    <div className="grid gap-4">
                        {teachers && teachers.length > 0 ? (
                             teachers.map((teacher) => (
                                <Card key={teacher.id}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                             <Avatar>
                                                <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
                                             </Avatar>
                                            <div>
                                                <p className="font-semibold text-lg">{teacher.name}</p>
                                                <p className="text-sm text-muted-foreground">{teacher.email}</p>
                                            </div>
                                        </div>
                                        {renderConnectionButton(teacher)}
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="p-8">
                                    <p className="text-muted-foreground text-center">No teachers available at the moment.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
