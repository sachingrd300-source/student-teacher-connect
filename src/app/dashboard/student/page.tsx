'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Clock, Search, School } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
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
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
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
                teacherName: batchData.teacherName,
                batchId: batchData.id,
                batchName: batchData.name,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
            setJoinMessage({ type: 'success', text: `Request sent to join "${batchData.name}"! 🎉` });
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
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading your courses...</p>
            </div>
        );
    }

    const renderStatusIcon = (status: 'pending' | 'approved') => {
        if (status === 'approved') {
            return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
        }
        return <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold">Welcome, {userProfile?.name}!</h1>
                            <p className="text-muted-foreground mt-2">Manage your batches and find new teachers.</p>
                        </div>
                        <Button asChild>
                            <Link href="/dashboard/student/find-teachers">
                                <Search className="mr-2 h-4 w-4" /> Find Teachers
                            </Link>
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Join a New Batch</CardTitle>
                                <CardDescription>Enter the 6-character code from your teacher.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleJoinBatch} className="flex items-end gap-4">
                                    <div className="grid gap-2 flex-1">
                                        <Label htmlFor="batch-code">Batch Code</Label>
                                        <Input 
                                            id="batch-code" 
                                            placeholder="e.g., A1B2C3" 
                                            value={batchCode}
                                            onChange={(e) => setBatchCode(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" disabled={isJoining || !batchCode.trim()}>
                                        {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Join
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
                                <CardTitle>Explore</CardTitle>
                                <CardDescription>Check out free resources, your rewards, and our shop.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                               <Button asChild variant="outline">
                                    <Link href="/dashboard/student/free-materials">Free Materials</Link>
                               </Button>
                               <Button asChild variant="outline">
                                    <Link href="/dashboard/student/rewards">My Rewards</Link>
                               </Button>
                               <Button asChild variant="outline">
                                    <Link href="/dashboard/student/shop">Shop</Link>
                               </Button>
                                <Button asChild variant="outline">
                                    <Link href="/dashboard/student/book-home-teacher">Book Home Teacher</Link>
                               </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-4">My Enrollments</h2>
                        {enrollments && enrollments.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {enrollments.map((enrollment) => (
                                    <Card key={enrollment.id} className="p-4 flex flex-col">
                                        <div className="flex items-start gap-4 flex-grow">
                                            {renderStatusIcon(enrollment.status)}
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-lg break-words">{enrollment.batchName}</p>
                                                <p className="text-sm text-muted-foreground break-words">Teacher: {enrollment.teacherName}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {enrollment.status === 'pending' 
                                                        ? `Requested: ${formatDate(enrollment.createdAt)}` 
                                                        : `Approved: ${formatDate(enrollment.approvedAt)}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 self-end mt-4">
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
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full bg-background border rounded-lg p-12 text-center">
                                <h3 className="text-lg font-semibold">You haven't joined any batches yet.</h3>
                                <p className="text-muted-foreground mt-1">Find a teacher or enter a batch code to begin! 🚀</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
