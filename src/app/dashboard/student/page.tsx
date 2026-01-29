
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
import { Loader2, CheckCircle, Clock, Search, School, Gift, ShoppingBag, Home, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';


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

const getMotivation = () => {
    const motivations = [
        "Consistency beats intensity 💪",
        "The secret of getting ahead is getting started. 🚀",
        "Don't wish for it. Work for it. 💡",
        "The future depends on what you do today. ✨",
        "Believe you can and you're halfway there. 🎯"
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
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

    const approvedEnrollments = useMemo(() => {
        return enrollments
            ?.filter(e => e.status === 'approved' && e.approvedAt)
            .sort((a, b) => new Date(b.approvedAt!).getTime() - new Date(a.approvedAt!).getTime()) 
            || [];
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
    
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
            },
        }),
    };
    
    const actionCards = [
        { title: "Discover Teachers", description: "Find the right teacher for you.", href: "/dashboard/student/find-teachers", icon: <Search className="h-6 w-6 text-primary" /> },
        { title: "Book Home Teacher", description: "Request a personalized home tutor.", href: "/dashboard/student/book-home-teacher", icon: <Home className="h-6 w-6 text-primary" /> },
        { title: "Free Study Material", description: "Access free notes and resources.", href: "/dashboard/student/free-materials", icon: <Gift className="h-6 w-6 text-primary" /> },
        { title: "Shop", description: "Exclusive merchandise and kits.", href: "/dashboard/student/shop", icon: <ShoppingBag className="h-6 w-6 text-primary" /> },
    ];
    
    const todaysTasks = [
        { id: 'task1', label: 'Watch 1 video lesson' },
        { id: 'task2', label: 'Attempt 5 MCQ questions' },
        { id: 'task3', label: 'Read 1 short note' },
        { id: 'task4', label: 'Post a doubt (optional)' },
    ];


    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-3 md:p-8 bg-muted/20">
                <div className="max-w-7xl mx-auto grid gap-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Welcome back, {userProfile?.name}!</h1>
                        <p className="text-muted-foreground mt-2">{getMotivation()}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                        {actionCards.map((card, i) => (
                            <motion.div
                                key={card.title}
                                custom={i}
                                initial="hidden"
                                animate="visible"
                                variants={cardVariants}
                                whileHover={{ y: -5, scale: 1.05, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                                whileTap={{ scale: 0.95 }}
                                className="h-full"
                            >
                                <Link href={card.href} className="block h-full">
                                    <Card className="flex flex-col items-center justify-start text-center p-3 sm:p-4 h-full rounded-2xl shadow-lg hover:shadow-primary/10 transition-all duration-300">
                                        <div className="p-3 bg-primary/10 rounded-full mb-3">
                                            {card.icon}
                                        </div>
                                        <h3 className="font-semibold text-sm sm:text-base">{card.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 flex-grow">{card.description}</p>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        <div className="md:col-span-2 grid gap-8">
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Join a New Batch</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                                    <form onSubmit={handleJoinBatch} className="flex flex-col sm:flex-row sm:items-end gap-4">
                                        <div className="grid gap-2 flex-1">
                                            <Label htmlFor="batch-code">Enter Batch Code</Label>
                                            <Input 
                                                id="batch-code" 
                                                placeholder="e.g., A1B2C3" 
                                                value={batchCode}
                                                onChange={(e) => setBatchCode(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full sm:w-auto" disabled={isJoining || !batchCode.trim()}>
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

                             <div>
                                <h2 className="text-2xl font-bold tracking-tight mb-4">My Enrollments</h2>
                                {enrollments && enrollments.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {enrollments.map((enrollment, i) => (
                                            <motion.div
                                                key={enrollment.id}
                                                custom={i}
                                                initial="hidden"
                                                animate="visible"
                                                variants={cardVariants}
                                                whileHover={{ scale: 1.03, boxShadow: "0px 8px 25px -5px rgba(0,0,0,0.1), 0px 10px 10px -5px rgba(0,0,0,0.04)" }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Card className="p-4 flex flex-col h-full transition-shadow duration-300 rounded-2xl shadow-lg">
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
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-full bg-background border rounded-2xl p-12 text-center flex flex-col items-center">
                                        <School className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">You haven't joined any batches yet.</h3>
                                        <p className="text-muted-foreground mt-1">Find a teacher or enter a batch code to begin! 🚀</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-1 grid gap-8">
                             <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Today's Tasks</CardTitle>
                                    <CardDescription>Complete tasks to earn extra coins!</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-3 p-4 pt-0">
                                    {todaysTasks.map(task => (
                                        <div key={task.id} className="flex items-center space-x-3">
                                            <Checkbox id={task.id} disabled />
                                            <label
                                                htmlFor={task.id}
                                                className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {task.label}
                                            </label>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

