
'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, deleteDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, PlusCircle, Clipboard, Settings, School, UserCheck, ArrowLeft, Check, X, Users, BookCopy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Interfaces can be copied
interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
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
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

export default function CoachingManagementPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    
    const [isCreateBatchOpen, setCreateBatchOpen] = useState(false);
    const [newBatchName, setNewBatchName] = useState('');
    const [isCreatingBatch, setIsCreatingBatch] = useState(false);

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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const isLoading = isUserLoading || profileLoading || enrollmentsLoading || batchesLoading;

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-screen items-center justify-center flex-col gap-4">
                <School className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Coaching Management...</p>
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
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Coaching Management</h1>
                        <p className="text-muted-foreground mt-2">Manage your batches and student enrollment requests.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{approvedStudents.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                                <BookCopy className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{batches?.length || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{pendingRequests.length}</div>
                                {pendingRequests.length > 0 && <p className="text-xs text-muted-foreground">Review requests below.</p>}
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="grid gap-8">
                        <Card className="rounded-2xl shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>My Batches ({batches?.length || 0})</CardTitle>
                                <Button size="sm" onClick={() => setCreateBatchOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Batch
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {batches && batches.length > 0 ? (
                                    <div className="grid gap-4">
                                        {batches.map((batch, i) => (
                                            <motion.div
                                                key={batch.id}
                                                custom={i}
                                                initial="hidden"
                                                animate="visible"
                                                variants={cardVariants}
                                                whileHover={{ scale: 1.01, x: 5, boxShadow: "0px 5px 15px rgba(0,0,0,0.05)" }}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-background transition-all duration-300"
                                            >
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-lg break-words">{batch.name}</p>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <p className="text-sm text-muted-foreground">Code:</p>
                                                        <span className="font-mono bg-muted px-2 py-1 rounded-md text-sm">{batch.code}</span>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(batch.code)}>
                                                            <Clipboard className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{studentCountsByBatch[batch.id] || 0} Students</p>
                                                </div>
                                                <div className="flex gap-2 self-end sm:self-center mt-4 sm:mt-0">
                                                    <Button asChild>
                                                        <Link href={`/dashboard/teacher/batch/${batch.id}`}>
                                                            <Settings className="mr-2 h-4 w-4" /> Manage
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center">
                                        <School className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">You haven't created any batches yet.</h3>
                                        <p className="text-muted-foreground mt-1 mb-4">Let's create your first one to get started! 🎉</p>
                                        <Button size="sm" onClick={() => setCreateBatchOpen(true)}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Batch
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-lg">
                            <CardHeader>
                                <CardTitle>Pending Enrollment Requests ({pendingRequests?.length || 0})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingRequests && pendingRequests.length > 0 ? (
                                    <div className="grid gap-4">
                                        {pendingRequests.map((req, i) => (
                                            <motion.div
                                                key={req.id}
                                                custom={i}
                                                initial="hidden"
                                                animate="visible"
                                                variants={cardVariants}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-background transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(req.studentName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold break-words">{req.studentName}</p>
                                                        <p className="text-sm text-muted-foreground break-words">Wants to join: <span className="font-medium">{req.batchName}</span></p>
                                                        <p className="text-xs text-muted-foreground mt-1">Requested: {formatDate(req.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 self-end sm:self-center mt-4 sm:mt-0">
                                                    <Button size="sm" onClick={() => handleApproveRequest(req)}>
                                                        <Check className="mr-2 h-4 w-4" /> Approve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDeclineRequest(req)}>
                                                        <X className="mr-2 h-4 w-4" /> Decline
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center">
                                        <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">All Caught Up!</h3>
                                        <p className="text-muted-foreground mt-1">There are no new student requests right now. 👍</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
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

