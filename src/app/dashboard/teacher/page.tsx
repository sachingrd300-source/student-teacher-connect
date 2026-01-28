'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, updateDoc, deleteDoc, addDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Check, X, PlusCircle, Clipboard, Settings, Wallet, School } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { FeeManagementDialog } from '@/components/fee-management-dialog';
import { motion } from 'framer-motion';


interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher';
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

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

export default function TeacherDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    
    const [isCreateBatchOpen, setCreateBatchOpen] = useState(false);
    const [newBatchName, setNewBatchName] = useState('');
    const [isCreatingBatch, setIsCreatingBatch] = useState(false);
    const [studentForFees, setStudentForFees] = useState<Enrollment | null>(null);

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

    const handleApprove = async (enrollment: Enrollment) => {
        if (!firestore) return;
        
        const batch = writeBatch(firestore);

        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        batch.update(enrollmentRef, { 
            status: 'approved',
            approvedAt: new Date().toISOString()
        });

        const batchRef = doc(firestore, 'batches', enrollment.batchId);
        batch.update(batchRef, {
            approvedStudents: arrayUnion(enrollment.studentId)
        });

        await batch.commit();
    };

    const handleRemoveStudent = async (enrollment: Enrollment) => {
        if (!firestore) return;
        
        const batch = writeBatch(firestore);
        
        // Remove from batch's approved list
        const batchRef = doc(firestore, 'batches', enrollment.batchId);
        batch.update(batchRef, {
            approvedStudents: arrayRemove(enrollment.studentId)
        });

        // Delete the enrollment document
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        batch.delete(enrollmentRef);

        await batch.commit();
    };
    
    const handleDeclineRequest = async (enrollmentId: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, 'enrollments', enrollmentId));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Maybe show a toast notification here
    };

    const isLoading = isUserLoading || profileLoading || enrollmentsLoading || batchesLoading;
    const greeting = getGreeting();

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-screen items-center justify-center flex-col gap-4">
                <School className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Preparing your dashboard...</p>
            </div>
        );
    }
    
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

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">{greeting}, {userProfile?.name}! ☀️</h1>
                        <p className="text-muted-foreground mt-2">Manage your batches, students, and requests all in one place.</p>
                    </div>
                    
                    <div className="grid gap-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>My Batches ({batches?.length || 0})</CardTitle>
                                <Button size="sm" onClick={() => setCreateBatchOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Batch
                                </Button>
                            </CardHeader>
                            <CardContent>
                                 {batches && batches.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {batches.map((batch, i) => (
                                            <motion.div
                                                key={batch.id}
                                                custom={i}
                                                initial="hidden"
                                                animate="visible"
                                                variants={cardVariants}
                                                whileHover={{ scale: 1.03, boxShadow: "0px 8px 25px -5px rgba(0,0,0,0.1), 0px 10px 10px -5px rgba(0,0,0,0.04)" }}
                                                className="h-full"
                                            >
                                                <Card className="flex flex-col h-full transition-shadow duration-300">
                                                    <CardHeader>
                                                        <CardTitle className="text-xl">{batch.name}</CardTitle>
                                                         <div className="flex items-center gap-2 pt-2">
                                                            <p className="text-sm text-muted-foreground">Code:</p>
                                                            <span className="font-mono bg-muted px-2 py-1 rounded-md text-sm">{batch.code}</span>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(batch.code)}>
                                                                <Clipboard className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="flex-grow flex items-end justify-between">
                                                        <div className="text-left">
                                                            <p className="font-bold text-2xl">{studentCountsByBatch[batch.id] || 0}</p>
                                                            <p className="text-sm text-muted-foreground">Students</p>
                                                        </div>
                                                        <Button asChild>
                                                            <Link href={`/dashboard/teacher/batch/${batch.id}`}>
                                                                <Settings className="mr-2 h-4 w-4" /> Manage
                                                            </Link>
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))
                                    }
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">You haven't created any batches yet. Let's create your first one! 🎉</p>
                                         <Button size="sm" className="mt-4" onClick={() => setCreateBatchOpen(true)}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Batch
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Enrollment Requests ({pendingRequests.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {pendingRequests.length > 0 ? (
                                    pendingRequests.map((req, i) => (
                                        <motion.div
                                            key={req.id}
                                            custom={i}
                                            initial="hidden"
                                            animate="visible"
                                            variants={cardVariants}
                                            whileHover={{ scale: 1.01, x: 5, boxShadow: "0px 5px 15px rgba(0,0,0,0.05)" }}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-background transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(req.studentName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{req.studentName}</p>
                                                    <p className="text-sm text-muted-foreground">Wants to join: <span className="font-medium">{req.batchName}</span></p>
                                                    <p className="text-xs text-muted-foreground mt-1">Requested: {formatDate(req.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 self-end sm:self-center mt-4 sm:mt-0">
                                                <Button size="icon" variant="outline" className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50" onClick={() => handleApprove(req)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50" onClick={() => handleDeclineRequest(req.id)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-12">No new student requests right now. 👍</p>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Approved Students ({approvedStudents.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {approvedStudents.length > 0 ? (
                                    approvedStudents.map((student, i) => (
                                         <motion.div
                                            key={student.id}
                                            custom={i}
                                            initial="hidden"
                                            animate="visible"
                                            variants={cardVariants}
                                            whileHover={{ scale: 1.01, x: 5, boxShadow: "0px 5px 15px rgba(0,0,0,0.05)" }}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-background transition-all duration-300"
                                         >
                                             <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(student.studentName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{student.studentName}</p>
                                                     <p className="text-sm text-muted-foreground">Batch: <span className="font-medium">{student.batchName}</span></p>
                                                     <p className="text-xs text-muted-foreground mt-1">Approved: {formatDate(student.approvedAt)}</p>
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2 self-end sm:self-center mt-4 sm:mt-0'>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/students/${student.studentId}`}>Profile</Link>
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => setStudentForFees(student)}>
                                                    <Wallet className="mr-2 h-4 w-4" /> Fees
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveStudent(student)}>Remove</Button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-12">No students have joined yet. Share your batch codes to get them enrolled! 🚀</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
                 {studentForFees && (
                    <FeeManagementDialog 
                        isOpen={!!studentForFees} 
                        onClose={() => setStudentForFees(null)} 
                        student={studentForFees} 
                    />
                )}
            </main>

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
        </div>
    );
}
