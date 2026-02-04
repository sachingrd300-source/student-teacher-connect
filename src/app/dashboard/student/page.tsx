
'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, deleteDoc, getDocs, orderBy, limit } from 'firebase/firestore';
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Clock, School, BookOpen, Search, Home, Trophy, ShoppingBag, Gift, ArrowRight, UserCheck, Wallet, BookCheck } from 'lucide-react';
import Link from 'next/link';
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
    assignedTeacherMobile?: string;
    assignedTeacherAddress?: string;
    createdAt: string;
    bookingType: 'homeTutor' | 'coachingCenter';
    assignedCoachingCenterName?: string;
    assignedCoachingAddress?: string;
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

const ActionCard = ({ title, icon, href }: { title: string, icon: React.ReactNode, href: string }) => (
    <motion.div variants={fadeInUp}>
      <Link href={href} className="block group">
        <Card className="h-full rounded-2xl shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-primary/20 group-hover:shadow-2xl">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 bg-primary/10 rounded-full transition-colors duration-300 group-hover:bg-primary/20">
              {icon && React.cloneElement(icon as React.ReactElement, { className: "h-8 w-8 text-primary" })}
            </div>
            <p className="text-sm font-semibold">{title}</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );


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
    
    const homeBookingsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "homeBookings"),
            where("studentId", "==", user.uid)
        );
    }, [firestore, user]);
    const { data: homeBookings, isLoading: homeBookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);

    const activeBookings = useMemo(() => {
        return homeBookings?.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
    }, [homeBookings]);

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

    const isLoading = isUserLoading || profileLoading || enrollmentsLoading || homeBookingsLoading || feesLoading;

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
        { title: 'Book Coaching Seat', icon: <BookCheck />, href: '/dashboard/student/book-coaching-seat' },
        { title: 'Book Home Tutor', icon: <Home />, href: '/dashboard/student/book-home-teacher' },
        { title: 'Free Materials', icon: <BookOpen />, href: '/dashboard/student/free-materials' },
        { title: 'My Rewards', icon: <Gift />, href: '/dashboard/student/rewards' },
        { title: 'Shop', icon: <ShoppingBag />, href: '/dashboard/student/shop' },
    ];


    return (
        <motion.div 
            className="grid gap-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1, 0)}
        >
            <motion.div variants={fadeInUp}>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Welcome, {userProfile?.name}!</h1>
                <p className="text-muted-foreground mt-2">Manage your batches, explore resources, and track your progress.</p>
            </motion.div>

             <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
                variants={staggerContainer(0.05, 0.2)}
            >
                {actionItems.map(item => <ActionCard key={item.href} {...item} />)}
            </motion.div>

            <motion.div variants={fadeInUp} className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid gap-8">
                    <Card className="rounded-2xl shadow-lg">
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

                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">My Enrollments</h2>
                        </CardHeader>
                        <CardContent>
                        {enrollments && enrollments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {enrollments.map((enrollment) => (
                                    <Card key={enrollment.id} className="p-4 flex flex-col justify-between shadow-md rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
                     <Card className="rounded-2xl shadow-lg">
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
                                    <div key={fee.id} className="flex items-center justify-between p-3 rounded-lg border bg-background transition-all duration-300 hover:shadow-md hover:border-primary/50">
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

                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Home className="mr-3 h-5 w-5 text-primary"/> My Active Bookings</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {homeBookingsLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : activeBookings.length > 0 ? (
                                activeBookings.map(booking => (
                                    <div key={booking.id} className="p-4 rounded-lg border bg-background transition-all duration-300 hover:shadow-md hover:border-primary/50">
                                        <p className="font-semibold text-sm">{booking.bookingType === 'homeTutor' ? 'Home Tutor Request' : 'Coaching Center Request'}</p>
                                        <div className="flex justify-between items-start mt-1">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Requested on {formatDate(booking.createdAt)}</p>
                                            </div>
                                            <span className={`text-xs font-bold py-1 px-2 rounded-full ${
                                                booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                booking.status === 'Awaiting Payment' ? 'bg-orange-100 text-orange-800' :
                                                booking.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        {(booking.status === 'Confirmed' || booking.status === 'Awaiting Payment') && (
                                            booking.bookingType === 'homeTutor' ? (
                                                booking.assignedTeacherName && (
                                                    <div className="mt-3 pt-3 border-t grid gap-1">
                                                        <p className="text-sm text-muted-foreground">Assigned Teacher:</p>
                                                        <p className="font-semibold text-primary">{booking.assignedTeacherName}</p>
                                                        {booking.assignedTeacherMobile && <p className="text-xs text-muted-foreground">Mobile: {booking.assignedTeacherMobile}</p>}
                                                        {booking.assignedTeacherAddress && <p className="text-xs text-muted-foreground">Address: {booking.assignedTeacherAddress}</p>}
                                                    </div>
                                                )
                                            ) : ( // coachingCenter
                                                booking.assignedCoachingCenterName && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <p className="text-sm text-muted-foreground">Assigned Center:</p>
                                                        <p className="font-semibold text-primary">{booking.assignedCoachingCenterName}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Teacher: {booking.assignedTeacherName}</p>
                                                        <p className="text-xs text-muted-foreground">Address: {booking.assignedCoachingAddress}</p>
                                                    </div>
                                                )
                                            )
                                        )}
                                        {(booking.status === 'Confirmed' || booking.status === 'Awaiting Payment') && (
                                             <div className="mt-3 pt-3 border-t">
                                                <Button asChild size="sm" className="w-full">
                                                    <Link href={`/dashboard/communications`}>Go to Chat</Link>
                                                </Button>
                                             </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground mb-3">You have no active bookings.</p>
                                    <div className="flex gap-2 justify-center">
                                        <Button asChild size="sm">
                                            <Link href="/dashboard/student/book-home-teacher">Book Home Tutor</Link>
                                        </Button>
                                         <Button asChild size="sm" variant="outline">
                                            <Link href="/dashboard/student/book-coaching-seat">Book Coaching Seat</Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </motion.div>
    );
}
