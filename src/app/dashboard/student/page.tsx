'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, deleteDoc, getDocs, orderBy, limit } from 'firebase/firestore';
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Clock, Megaphone, School, BookOpen, Search, Home, Trophy, ShoppingBag, Gift, ArrowRight, UserCheck, CreditCard, Wallet, BookCheck } from 'lucide-react';
import Link from 'next/link';
import { BookingPaymentDialog } from '@/components/booking-payment-dialog';
import { motion } from 'framer-motion';

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

interface HomeBooking {
    id: string;
    studentId: string;
    status: 'Pending' | 'Awaiting Payment' | 'Confirmed' | 'Completed' | 'Cancelled';
    assignedTeacherName?: string;
    createdAt: string;
}

interface Announcement {
    id: string;
    message: string;
    target: 'all' | 'teachers' | 'students';
    createdAt: string;
}


interface Fee {
    id: string;
    batchId: string;
    batchName: string;
    feeMonth: number;
    feeYear: number;
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

const ActionCard = ({ title, icon, href }: { title: string, icon: React.ReactNode, href: string }) => (
    <Link href={href} className="block hover:scale-105 transition-transform duration-200">
        <Card className="h-full shadow-md hover:shadow-lg">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-3 bg-primary/10 rounded-full">
                    {icon && React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6 text-primary" })}
                </div>
                <p className="text-sm font-semibold">{title}</p>
            </CardContent>
        </Card>
    </Link>
);

const staggerContainer = (staggerChildren: number, delayChildren: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerChildren,
      delayChildren: delayChildren,
    },
  },
});

const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};


export default function StudentDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [batchCode, setBatchCode] = useState('');
    const [joinMessage, setJoinMessage] = useState({ type: '', text: '' });
    const [isJoining, setIsJoining] = useState(false);
    const [bookingToPay, setBookingToPay] = useState<HomeBooking | null>(null);
    
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
            where("target", "in", ["all", "students"]),
            orderBy("createdAt", "desc"),
            limit(3)
        );
    }, [firestore, user]);
    const { data: announcements, isLoading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);

    const homeBookingsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "homeBookings"),
            where("studentId", "==", user.uid)
        );
    }, [firestore, user]);
    const { data: homeBookings, isLoading: homeBookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);
    const lastBooking = useMemo(() => homeBookings?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0], [homeBookings]);

    const unpaidFeesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'fees'),
            where('studentId', '==', user.uid),
            where('status', '==', 'unpaid')
        );
    }, [firestore, user?.uid]);
    const { data: unpaidFees, isLoading: feesLoading } = useCollection<Fee>(unpaidFeesQuery);

    const enrolledBatchIds = useMemo(() => {
        return enrollments?.map(e => e.batchId) || [];
    }, [enrollments]);

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

    const isLoading = isUserLoading || profileLoading || enrollmentsLoading || announcementsLoading || homeBookingsLoading || feesLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
        );
    }

    const renderStatusIcon = (status: 'pending' | 'approved') => {
        if (status === 'approved') {
            return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
        }
        return <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
    };

    const actionItems = [
        { title: 'Find Teachers', icon: <Search />, href: '/dashboard/student/find-teachers' },
        { title: 'Book a Seat', icon: <BookCheck />, href: '/dashboard/student/book-coaching-seat' },
        { title: 'Free Materials', icon: <BookOpen />, href: '/dashboard/student/free-materials' },
        { title: 'Book Home Tutor', icon: <Home />, href: '/dashboard/student/book-home-teacher' },
        { title: 'My Rewards', icon: <Gift />, href: '/dashboard/student/rewards' },
        { title: 'Leaderboard', icon: <Trophy />, href: '/dashboard/student/leaderboard' },
        { title: 'Shop', icon: <ShoppingBag />, href: '/dashboard/student/shop' },
    ];


    return (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Welcome, {userProfile?.name}!</h1>
                <p className="text-muted-foreground mt-2">Manage your batches, explore resources, and track your progress.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {actionItems.map(item => <ActionCard key={item.href} {...item} />)}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Join a New Batch by Code</CardTitle>
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

                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">My Enrollments</h2>
                        </CardHeader>
                        <CardContent>
                        {enrollments && enrollments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {enrollments.map((enrollment) => (
                                    <Card key={enrollment.id} className="p-4 flex flex-col justify-between shadow-md">
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
                                        <CardFooter className="p-0 pt-4 flex gap-2 self-end">
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
                                                           <ArrowRight className="mr-2 h-4 w-4"/> View Batch
                                                        </Link>
                                                    </Button>
                                                </>
                                            )}
                                        </CardFooter>
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
                
                <div className="lg:col-span-1 grid gap-8 content-start">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Wallet className="mr-3 h-5 w-5 text-primary"/> Pending Fees</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {feesLoading ? (
                                 <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : unpaidFees && unpaidFees.length > 0 ? (
                                unpaidFees.map(fee => (
                                    <div key={fee.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                        <div>
                                            <p className="font-semibold">{fee.batchName}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(fee.feeYear, fee.feeMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                                        </div>
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/dashboard/student/batch/${fee.batchId}?tab=fees`}>
                                                View
                                            </Link>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-8">No pending fees. Great job! 🎉</p>
                            )}
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Megaphone className="mr-3 h-5 w-5 text-primary"/> Announcements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {announcements && announcements.length > 0 ? (
                                <motion.div 
                                    className="grid gap-4"
                                    variants={staggerContainer(0.2, 0)}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {announcements.map((ann, index) => (
                                        <motion.div
                                            key={ann.id}
                                            variants={fadeInUp}
                                            className={`p-4 rounded-lg border flex gap-4 items-start ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}
                                        >
                                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                <Megaphone className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{ann.message}</p>
                                                <p className="text-xs text-muted-foreground mt-2">{formatDate(ann.createdAt)}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-8">No new announcements from admin.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Home className="mr-3 h-5 w-5 text-primary"/> Home Tutor Request Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                           {lastBooking ? (
                                <div className="p-4 rounded-lg border bg-background">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">Your Latest Request</p>
                                            <p className="text-xs text-muted-foreground">Requested on {formatDate(lastBooking.createdAt)}</p>
                                        </div>
                                         <span className={`text-xs font-bold py-1 px-2 rounded-full ${
                                            lastBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            lastBooking.status === 'Awaiting Payment' ? 'bg-orange-100 text-orange-800' :
                                            lastBooking.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                            lastBooking.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {lastBooking.status}
                                        </span>
                                    </div>
                                    {lastBooking.status === 'Awaiting Payment' ? (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm font-medium mb-2">Your booking is ready! Please pay the platform fee to confirm.</p>
                                            <Button size="sm" className="w-full" onClick={() => setBookingToPay(lastBooking)}>
                                                <CreditCard className="mr-2 h-4 w-4"/> Pay Now
                                            </Button>
                                        </div>
                                    ) : (lastBooking.status === 'Confirmed' || lastBooking.status === 'Completed') && lastBooking.assignedTeacherName ? (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm text-muted-foreground">Assigned Teacher:</p>
                                            <p className="font-semibold text-primary">{lastBooking.assignedTeacherName}</p>
                                        </div>
                                    ) : null}
                                </div>
                           ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground mb-3">You haven't requested a home tutor yet.</p>
                                    <Button asChild>
                                        <Link href="/dashboard/student/book-home-teacher">Book a Tutor</Link>
                                    </Button>
                                </div>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {bookingToPay && (
                <BookingPaymentDialog
                    isOpen={!!bookingToPay}
                    onClose={() => setBookingToPay(null)}
                    booking={bookingToPay}
                    onPaymentSuccess={() => { /* Real-time listener will update UI */ }}
                />
            )}
        </div>
    );
}
