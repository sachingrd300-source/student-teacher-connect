'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Clock, Search } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher';
}

interface Batch {
    id: string;
    name: string;
    teacherId: string;
    teacherName: string;
    code: string;
}

interface Enrollment {
    id: string;
    studentId: string;
    teacherId: string;
    batchId: string;
    batchName: string;
    teacherName: string;
    status: 'pending' | 'approved';
    createdAt: string;
    approvedAt?: string;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function StudentDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [batchCode, setBatchCode] = useState('');
    const [joinMessage, setJoinMessage] = useState({ type: '', text: '' });
    const [isJoining, setIsJoining] = useState(false);
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const enrolledBatchIds = useMemo(() => {
        return enrollments?.map(e => e.batchId) || [];
    }, [enrollments]);

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

    const handleJoinBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !userProfile || !batchCode.trim()) return;

        setIsJoining(true);
        setJoinMessage({ type: '', text: '' });

        const trimmedCode = batchCode.trim();

        const batchesRef = collection(firestore, 'batches');
        const q = query(batchesRef, where('code', '==', trimmedCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setJoinMessage({ type: 'error', text: 'No batch found with this code.' });
            setIsJoining(false);
            return;
        }

        const batchDoc = querySnapshot.docs[0];
        const batchData = { ...batchDoc.data(), id: batchDoc.id } as Batch;

        if (enrolledBatchIds.includes(batchData.id)) {
            setJoinMessage({ type: 'info', text: 'You have already sent a request to join this batch.' });
            setIsJoining(false);
            return;
        }

        try {
            await addDoc(collection(firestore, 'enrollments'), {
                studentId: user.uid,
                studentName: userProfile.name,
                teacherId: batchData.teacherId,
                batchId: batchData.id,
                batchName: batchData.name,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
            setJoinMessage({ type: 'success', text: `Request sent to join "${batchData.name}"!` });
            setBatchCode('');
        } catch (error) {
            console.error("Error creating enrollment request:", error);
            setJoinMessage({ type: 'error', text: 'Failed to send request. Please try again.' });
        } finally {
            setIsJoining(false);
        }
    };
    
    const handleCancelRequest = async (enrollmentId: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, 'enrollments', enrollmentId));
    };

    const isLoading = isUserLoading || profileLoading || enrollmentsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying access...</p>
            </div>
        );
    }

    const renderStatusIcon = (status: 'pending' | 'approved') => {
        if (status === 'approved') {
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        }
        return <Clock className="h-5 w-5 text-yellow-500" />;
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Discover New Teachers</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground mb-4">Browse profiles and find the right teacher for you.</p>
                           <Button asChild>
                                <Link href="/dashboard/student/find-teachers">
                                    <Search className="mr-2 h-4 w-4" />
                                    Find Teachers
                                </Link>
                           </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Join a New Batch</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleJoinBatch} className="flex flex-col sm:flex-row items-end gap-4">
                                <div className="grid gap-2 flex-1 w-full">
                                    <Label htmlFor="batch-code">Enter Batch Code</Label>
                                    <Input 
                                        id="batch-code" 
                                        placeholder="e.g., A1B2C3" 
                                        value={batchCode}
                                        onChange={(e) => setBatchCode(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={isJoining || !batchCode.trim()}>
                                    {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Send Request
                                </Button>
                            </form>
                             {joinMessage.text && (
                                <p className={`mt-4 text-sm font-medium ${
                                    joinMessage.type === 'error' ? 'text-destructive' : 
                                    joinMessage.type === 'success' ? 'text-green-600' : 'text-muted-foreground'
                                }`}>
                                    {joinMessage.text}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Enrollments</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {enrollments && enrollments.length > 0 ? (
                                enrollments.map((enrollment) => (
                                    <div key={enrollment.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-background">
                                        <div className="flex items-center gap-4">
                                            {renderStatusIcon(enrollment.status)}
                                            <div>
                                                <p className="font-semibold text-lg">{enrollment.batchName}</p>
                                                <p className="text-sm text-muted-foreground">Teacher: {enrollment.teacherName}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {enrollment.status === 'pending' 
                                                        ? `Requested: ${formatDate(enrollment.createdAt)}` 
                                                        : `Approved: ${formatDate(enrollment.approvedAt)}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 self-end sm:self-center mt-4 sm:mt-0">
                                            {enrollment.status === 'pending' ? (
                                                <Button variant="outline" size="sm" onClick={() => handleCancelRequest(enrollment.id)}>
                                                    Cancel Request
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/teachers/${enrollment.teacherId}`}>View Teacher</Link>
                                                    </Button>
                                                    <Button asChild size="sm">
                                                        <Link href={`/dashboard/student/batch/${enrollment.batchId}`}>
                                                            View Batch
                                                        </Link>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-center py-8">You are not enrolled in any batches yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
