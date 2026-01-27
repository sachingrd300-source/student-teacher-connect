'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, updateDoc, deleteDoc, addDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Check, X, PlusCircle, Clipboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { nanoid } from 'nanoid';


interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher';
}

interface Batch {
    id: string;
    name: string;
    code: string;
}

interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    teacherId: string;
    batchId: string;
    batchName: string;
    status: 'pending' | 'approved';
}

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
};

export default function TeacherDashboardPage() {
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
                createdAt: serverTimestamp(),
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
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        await updateDoc(enrollmentRef, { status: 'approved' });

        const batchRef = doc(firestore, 'batches', enrollment.batchId);
        await updateDoc(batchRef, {
            approvedStudents: arrayUnion(enrollment.studentId)
        });
    };

    const handleRemoveStudent = async (enrollment: Enrollment) => {
        if (!firestore) return;
        
        // Remove from batch's approved list
        const batchRef = doc(firestore, 'batches', enrollment.batchId);
        await updateDoc(batchRef, {
            approvedStudents: arrayRemove(enrollment.studentId)
        });

        // Delete the enrollment document
        await deleteDoc(doc(firestore, 'enrollments', enrollment.id));
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

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-screen items-center justify-center flex-col gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying access...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold font-serif mb-6">Teacher Dashboard</h1>
                    
                    <Tabs defaultValue="requests" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="batches">My Batches ({batches?.length || 0})</TabsTrigger>
                            <TabsTrigger value="requests">Enrollment Requests ({pendingRequests.length})</TabsTrigger>
                            <TabsTrigger value="students">My Students ({approvedStudents.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="batches" className="mt-4">
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>My Batches</CardTitle>
                                    <Button size="sm" onClick={() => setCreateBatchOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Create Batch
                                    </Button>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                     {batches && batches.length > 0 ? (
                                        batches.map(batch => (
                                             <div key={batch.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                 <div>
                                                    <p className="font-semibold text-lg">{batch.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-sm text-muted-foreground">Code:</p>
                                                        <span className="font-mono bg-muted px-2 py-1 rounded-md text-sm">{batch.code}</span>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(batch.code)}>
                                                            <Clipboard className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">You haven't created any batches yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="requests" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pending Enrollment Requests</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    {pendingRequests.length > 0 ? (
                                        pendingRequests.map(req => (
                                            <div key={req.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                                <div className="flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(req.studentName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{req.studentName}</p>
                                                        <p className="text-sm text-muted-foreground">Wants to join: <span className="font-medium">{req.batchName}</span></p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="icon" variant="outline" className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50" onClick={() => handleApprove(req)}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50" onClick={() => handleDeclineRequest(req.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No pending requests.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="students" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Approved Students</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    {approvedStudents.length > 0 ? (
                                        approvedStudents.map(student => (
                                             <div key={student.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                                 <div className="flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(student.studentName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{student.studentName}</p>
                                                         <p className="text-sm text-muted-foreground">Batch: <span className="font-medium">{student.batchName}</span></p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveStudent(student)}>Remove</Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">You have no students yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
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
