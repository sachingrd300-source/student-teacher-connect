
'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Clock, Search, School, Megaphone, BookOpen, User, ShoppingBag, Trophy, Home } from 'lucide-react';
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

interface Announcement {
    id: string;
    message: string;
    target: 'all' | 'teachers' | 'students';
    createdAt: string;
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
    
    const announcementsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "announcements"),
            where("target", "in", ["all", "students"])
        );
    }, [firestore, user]);
    const { data: announcements, isLoading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);

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

    const isLoading = isUserLoading || profileLoading || enrollmentsLoading || announcementsLoading;

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
                <div className="max-w-6xl mx-auto grid gap-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Welcome, {userProfile?.name}!</h1>
                        <p className="text-muted-foreground mt-2">Manage your batches, explore resources, and track your progress.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Join a New Batch</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleJoinBatch} className="flex items-end gap-2">
                                    <div className="grid gap-1.5 flex-1">
                                        <Label htmlFor="batch-code" className="sr-only">Batch Code</Label>
                                        <Input 
                                            id="batch-code" 
                                            placeholder="e.g., A1B2C3" 
                                            value={batchCode}
                                            onChange={(e) => setBatchCode(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" disabled={isJoining || !batchCode.trim()}>
                                        {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
                                    </Button>
                                </form>
                                {joinMessage.text && (
                                    <p className={`mt-3 text-xs font-medium ${
                                        joinMessage.type === 'error' ? 'text-destructive' : 
                                        joinMessage.type === 'success' ? 'text-green-600' : 'text-muted-foreground'
                                    }`}>
                                        {joinMessage.text}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                        
                        <ActionCard title="Find Teachers" icon={<Search/>} href="/dashboard/student/find-teachers" />
                        <ActionCard title="Free Materials" icon={<BookOpen/>} href="/dashboard/student/free-materials" />
                        <ActionCard title="Book Home Tutor" icon={<Home/>} href="/dashboard/student/book-home-tutor" />
                        <ActionCard title="My Rewards" icon={<Trophy/>} href="/dashboard/student/rewards" />
                        <ActionCard title="Leaderboard" icon={<Trophy/>} href="/dashboard/student/leaderboard" />
                        <ActionCard title="Shop" icon={<ShoppingBag/>} href="/dashboard/student/shop" />

                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <h2 className="text-xl font-semibold">My Enrollments</h2>
                                </CardHeader>
                                <CardContent>
                                {enrollments && enrollments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {enrollments.map((enrollment) => (
                                            <Card key={enrollment.id} className="p-4 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-start gap-4 mb-4">
                                                        {renderStatusIcon(enrollment.status)}
                                                        <div className="flex-grow min-w-0">
                                                            <p className="font-semibold text-lg break-words">{enrollment.batchName}</p>
                                                            <p className="text-sm text-muted-foreground break-words">by {enrollment.teacherName}</p>
                                                        </div>
                                                    </div>
                                                     <p className="text-xs text-muted-foreground mt-1">
                                                        {enrollment.status === 'pending' 
                                                            ? `Requested: ${formatDate(enrollment.createdAt)}` 
                                                            : `Approved: ${formatDate(enrollment.approvedAt)}`}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 self-end mt-4">
                                                    {enrollment.status === 'pending' ? (
                                                        <Button variant="outline" size="sm" onClick={() => handleCancelRequest(enrollment.id)}>
                                                            Cancel Request
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button asChild variant="ghost" size="sm">
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
                                    <div className="w-full bg-background border-2 border-dashed rounded-lg p-12 text-center">
                                        <h3 className="text-lg font-semibold">You haven't joined any batches yet.</h3>
                                        <p className="text-muted-foreground mt-1">Find a teacher or enter a batch code to begin! 🚀</p>
                                    </div>
                                )}
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="lg:col-span-1">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center"><Megaphone className="mr-3 h-5 w-5 text-primary"/> Announcements</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    {announcements && announcements.length > 0 ? announcements.slice(0, 3).map((ann) => (
                                        <div key={ann.id} className="p-4 rounded-lg border bg-background">
                                            <p className="text-sm">{ann.message}</p>
                                            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                                <span>Target: <span className="font-semibold capitalize">{ann.target}</span></span>
                                                <span>{formatDate(ann.createdAt)}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-center text-muted-foreground py-8">No new announcements from admin.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const ActionCard = ({ title, icon, href }: { title: string, icon: React.ReactNode, href: string }) => (
    <Link href={href}>
        <Card className="h-full hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-3 bg-primary/10 rounded-full">
                    {icon && React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6 text-primary" })}
                </div>
                <p className="text-sm font-semibold">{title}</p>
            </CardContent>
        </Card>
    </Link>
);
