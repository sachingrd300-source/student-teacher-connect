
'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, deleteDoc, writeBatch, arrayUnion, orderBy, limit, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, PlusCircle, Clipboard, Settings, School, UserCheck, ArrowLeft, Check, X, Users, BookCopy, Home, Briefcase, CheckCircle, Award, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Interfaces can be copied
interface UserProfile {
    name: string;
    email: string;
    role: 'teacher' | 'student' | 'admin' | 'parent';
    isHomeTutor?: boolean;
    teacherWorkStatus?: 'own_coaching' | 'achievers_associate' | 'both';
}

interface Batch {
    id: string;
    name: string;
    code: string;
    createdAt: string;
}

interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    teacherId: string;
    batchId: string;
    batchName: string;
    status: 'pending' | 'approved';
    createdAt: string;
    approvedAt?: string;
}

interface HomeBooking {
    id: string;
    studentId: string;
    studentName: string;
    subject?: string;
    status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
    createdAt: string;
    bookingType: 'homeTutor' | 'coachingCenter' | 'demoClass';
}

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
};

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


export default function CoachingManagementPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    
    const [isCreateBatchOpen, setCreateBatchOpen] = useState(false);
    const [newBatchName, setNewBatchName] = useState('');
    const [isCreatingBatch, setIsCreatingBatch] = useState(false);
    const [greeting, setGreeting] = useState('');

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: batches, isLoading: batchesLoading } = useCollection<Batch>(batchesQuery);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const assignedBookingsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid || profileLoading) return null;
        if (userProfile?.teacherWorkStatus === 'achievers_associate') return null; // Community associates don't manage their own bookings
        return query(collection(firestore, 'homeBookings'), where('assignedTeacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user?.uid, userProfile, profileLoading]);
    const { data: assignedBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(assignedBookingsQuery);

    const demoRequests = useMemo(() => assignedBookings?.filter(b => b.bookingType === 'demoClass') || [], [assignedBookings]);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good Morning');
        } else if (hour < 17) {
            setGreeting('Good Afternoon');
        } else {
            setGreeting('Good Evening');
        }
    }, []);

    const [pendingRequests, approvedStudents] = useMemo(() => {
        if (!enrollments) return [[], []];
        const pending: Enrollment[] = [];
        const approved: Enrollment[] = [];
        enrollments.forEach(e => {
            if (e.status === 'pending') {
                pending.push(e);
            } else {
                approved.push(e);
            }
        });
        return [pending, approved];
    }, [enrollments]);

    const studentCountsByBatch = useMemo(() => {
        const counts: { [key: string]: number } = {};
        approvedStudents.forEach(enrollment => {
            if (counts[enrollment.batchId]) {
                counts[enrollment.batchId]++;
            } else {
                counts[enrollment.batchId] = 1;
            }
        });
        return counts;
    }, [approvedStudents]);

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

    const handleCreateBatch = async () => {
        if (!firestore || !user || !userProfile || !newBatchName.trim()) return;
        setIsCreatingBatch(true);
        const batchCode = nanoid(6).toUpperCase();
        
        try {
            await addDoc(collection(firestore, 'batches'), {
                name: newBatchName.trim(),
                teacherId: user.uid,
                teacherName: userProfile.name,
                code: batchCode,
                createdAt: new Date().toISOString(),
                approvedStudents: [],
            });
            setNewBatchName('');
            setCreateBatchOpen(false);
        } catch (error) {
            console.error("Error creating batch:", error);
        } finally {
            setIsCreatingBatch(false);
        }
    };
    
    const handleApproveRequest = async (enrollment: Enrollment) => {
        if (!firestore) return;
        
        const firestoreBatch = writeBatch(firestore);

        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        firestoreBatch.update(enrollmentRef, { 
            status: 'approved',
            approvedAt: new Date().toISOString()
        });

        const currentBatchRef = doc(firestore, 'batches', enrollment.batchId);
        firestoreBatch.update(currentBatchRef, {
            approvedStudents: arrayUnion(enrollment.studentId)
        });

        const activityColRef = collection(firestore, 'batches', enrollment.batchId, 'activity');
        firestoreBatch.set(doc(activityColRef), {
            message: `Student "${enrollment.studentName}" has been approved and added to the batch.`,
            createdAt: new Date().toISOString(),
        });

        await firestoreBatch.commit();
    };

    const handleDeclineRequest = async (enrollment: Enrollment) => {
        if (!firestore) return;
        
        const firestoreBatch = writeBatch(firestore);

        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        firestoreBatch.delete(enrollmentRef);

        const activityColRef = collection(firestore, 'batches', enrollment.batchId, 'activity');
        firestoreBatch.set(doc(activityColRef), {
            message: `The enrollment request for "${enrollment.studentName}" was declined.`,
            createdAt: new Date().toISOString(),
        });

        await firestoreBatch.commit();
    };

    const handleUpdateBookingStatus = (bookingId: string, status: 'Confirmed' | 'Completed' | 'Cancelled') => {
        if (!firestore) return;
        const bookingRef = doc(firestore, 'homeBookings', bookingId);
        updateDoc(bookingRef, { status })
            .catch(error => console.error("Error updating booking status:", error));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const isLoading = isUserLoading || profileLoading || enrollmentsLoading || batchesLoading || bookingsLoading;

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-full items-center justify-center flex-col gap-4 py-16">
                <School className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Coaching Management...</p>
            </div>
        );
    }
    
    const isCommunityAssociate = userProfile?.teacherWorkStatus === 'achievers_associate' || userProfile?.teacherWorkStatus === 'both';

    return (
        <>
            <motion.div 
                className="mb-8"
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold font-serif">{greeting && `${greeting}, ${userProfile?.name}!`}</h1>
                        {isCommunityAssociate && (
                        <div className="flex items-center gap-2 text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 px-3 py-1.5 rounded-full">
                            <CheckCircle className="h-5 w-5" />
                            <span>Verified Community Associate</span>
                        </div>
                    )}
                </div>
                <p className="text-muted-foreground mt-2">Here's your overview for today. Manage your batches and student requests.</p>
            </motion.div>

            <motion.div
                    className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer(0.1, 0.2)}
            >
                <motion.div variants={fadeInUp}>
                <Card className='rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvedStudents.length}</div>
                         <p className="text-xs text-muted-foreground">in your batches</p>
                    </CardContent>
                </Card>
                </motion.div>
                <motion.div variants={fadeInUp}>
                <Card className='rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                        <BookCopy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{batches?.length || 0}</div>
                    </CardContent>
                </Card>
                </motion.div>
                <motion.div variants={fadeInUp}>
                <Card className='rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingRequests.length}</div>
                        {pendingRequests.length > 0 && <p className="text-xs text-muted-foreground">Review requests below.</p>}
                    </CardContent>
                </Card>
                </motion.div>
                <motion.div variants={fadeInUp}>
                <Card className='rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Home Tutor Program</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {userProfile.isHomeTutor ? (
                            <>
                                <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span>Verified Home Tutor</span>
                                </div>
                                    <p className="text-xs text-muted-foreground mt-2">You can now be assigned to home tuitions.</p>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-muted-foreground">Join to get students for home tuition.</p>
                                <Button asChild className="mt-3 w-full" size="sm">
                                    <Link href="/dashboard/teacher/apply-home-tutor">Apply Now</Link>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
                </motion.div>
            </motion.div>
            
            <motion.div 
                className="grid gap-8 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={staggerContainer(0.1, 0.4)}
            >
                <motion.div variants={fadeInUp} className="lg:col-span-2 grid gap-8 content-start">
                    <Card className='rounded-2xl shadow-lg'>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>My Batches ({batches?.length || 0})</CardTitle>
                            <Button size="sm" onClick={() => setCreateBatchOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create Batch
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {batches && batches.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {batches.map(batch => (
                                        <Card key={batch.id} className="flex flex-col rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                                            <CardHeader>
                                                <CardTitle className="font-serif">{batch.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <div className="flex items-center gap-2 pt-1">
                                                    <p className="text-sm text-muted-foreground">Code:</p>
                                                    <span className="font-mono bg-muted px-2 py-1 rounded-md text-sm">{batch.code}</span>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(batch.code)}>
                                                        <Clipboard className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">{studentCountsByBatch[batch.id] || 0} Students</p>
                                            </CardContent>
                                            <div className="p-4 pt-0">
                                                <Button asChild className="w-full">
                                                    <Link href={`/dashboard/teacher/batch/${batch.id}`}>
                                                        <Settings className="mr-2 h-4 w-4" /> Manage
                                                    </Link>
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <h3 className="text-lg font-semibold">You haven't created any batches yet.</h3>
                                    <p className="text-muted-foreground mt-1 mb-4">Let's create your first one to get started! 🎉</p>
                                    <Button size="sm" onClick={() => setCreateBatchOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Batch
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {userProfile?.teacherWorkStatus !== 'achievers_associate' && (
                        <Card className='rounded-2xl shadow-lg'>
                            <CardHeader>
                                <CardTitle>Assigned Bookings & Demos ({demoRequests.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {demoRequests.length > 0 ? (
                                    <div className="grid gap-4">
                                        {demoRequests.map(booking => (
                                            <div key={booking.id} className="p-4 rounded-lg border transition-all duration-300 hover:shadow-xl">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold">{booking.studentName}</p>
                                                        <p className="text-sm text-muted-foreground">Subject: {booking.subject || 'N/A'}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Received: {formatDate(booking.createdAt)}</p>
                                                    </div>
                                                    <span className={`text-xs font-bold py-1 px-2 rounded-full ${
                                                        booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        booking.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                        booking.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 justify-end mt-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm">Manage</Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking.id, 'Confirmed')}>Confirm</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking.id, 'Completed')}>Mark as Completed</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateBookingStatus(booking.id, 'Cancelled')}>Cancel</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <h3 className="text-lg font-semibold">No Demo Requests</h3>
                                        <p className="text-muted-foreground mt-1">New demo class requests will appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </motion.div>

                <motion.div variants={fadeInUp} className="lg:col-span-1 grid gap-8 content-start">
                    
                    <Card className='rounded-2xl shadow-lg'>
                        <CardHeader>
                            <CardTitle>Pending Enrollment Requests ({pendingRequests?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingRequests && pendingRequests.length > 0 ? (
                                <div className="grid gap-4">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="p-4 rounded-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/50">
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(req.studentName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold break-words">{req.studentName}</p>
                                                    <p className="text-sm text-muted-foreground break-words">Wants to join: <span className="font-medium">{req.batchName}</span></p>
                                                    <p className="text-xs text-muted-foreground mt-1">Requested: {formatDate(req.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end mt-4">
                                                <Button size="sm" onClick={() => handleApproveRequest(req)}>
                                                    <Check className="mr-2 h-4 w-4" /> Approve
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDeclineRequest(req)}>
                                                    <X className="mr-2 h-4 w-4" /> Decline
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <h3 className="text-lg font-semibold">All Caught Up!</h3>
                                    <p className="text-muted-foreground mt-1">There are no new student requests right now. 👍</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className='rounded-2xl shadow-lg'>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Award className="mr-2 h-5 w-5 text-primary"/> Achievers Community Program</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isCommunityAssociate ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Verified Community Associate</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">You have a verified badge on your profile.</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        हमसे जुड़ें और अपनी कोचिंग को और बेहतरीन बनाएं। या आप सिर्फ एक शिक्षक के रूप में भी जुड़ सकते हैं और कम्युनिटी आपको पढ़ाने के लिए केंद्र प्रदान करेगी।
                                    </p>
                                    <Button asChild className="mt-3 w-full" size="sm">
                                        <Link href="/dashboard/teacher/apply-verified-coaching">Apply Now</Link>
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    
                </motion.div>
            </motion.div>

            <Dialog open={isCreateBatchOpen} onOpenChange={setCreateBatchOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Batch</DialogTitle>
                        <DialogDescription>
                            Enter a name for your new batch. A unique 6-character code will be generated for students to join.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="batch-name" className="text-right">Batch Name</Label>
                            <Input 
                                id="batch-name" 
                                className="col-span-3" 
                                value={newBatchName} 
                                onChange={(e) => setNewBatchName(e.target.value)}
                                placeholder="e.g., Morning Physics Class"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleCreateBatch} disabled={isCreatingBatch || !newBatchName.trim()}>
                            {isCreatingBatch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Batch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
