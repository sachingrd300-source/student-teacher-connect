'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, deleteDoc, collection, query, where, arrayRemove } from 'firebase/firestore';
import Link from 'next/link';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Trash2, Edit, Clipboard, ArrowLeft, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface UserProfile {
    name: string;
}

interface Batch {
    id: string;
    name: string;
    code: string;
    teacherId: string;
}

interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    batchId: string;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

export default function BatchManagementPage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const batchId = params.batchId as string;

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [batchName, setBatchName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const batchRef = useMemoFirebase(() => batchId ? doc(firestore, 'batches', batchId) : null, [firestore, batchId]);
    const { data: batch, isLoading: isBatchLoading } = useDoc<Batch>(batchRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'enrollments'), where('batchId', '==', batchId), where('status', '==', 'approved'));
    }, [firestore, batchId]);
    const { data: enrolledStudents, isLoading: areStudentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.replace('/login');
        }
    }, [isAuthLoading, user, router]);
    
    useEffect(() => {
        if (batch) {
            setBatchName(batch.name);
            // Security check: ensure the current user is the owner of the batch
            if (user && batch.teacherId !== user.uid) {
                router.replace('/dashboard/teacher');
            }
        }
    }, [batch, user, router]);

    const handleUpdateBatch = async () => {
        if (!batchRef || !batchName.trim()) return;
        setIsSaving(true);
        try {
            await updateDoc(batchRef, { name: batchName.trim() });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating batch:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBatch = async () => {
        if (!batchRef) return;
        setIsSaving(true);
        try {
            // Note: In a real-world scenario, you might want to handle enrollments via a Cloud Function.
            // For now, we just delete the batch.
            await deleteDoc(batchRef);
            router.push('/dashboard/teacher');
        } catch (error) {
            console.error("Error deleting batch:", error);
            setIsSaving(false);
        }
    };
    
    const handleRemoveStudent = async (enrollment: Enrollment) => {
        if (!firestore) return;
        
        // Remove from batch's approved list
        const currentBatchRef = doc(firestore, 'batches', enrollment.batchId);
        await updateDoc(currentBatchRef, {
            approvedStudents: arrayRemove(enrollment.studentId)
        });

        // Delete the enrollment document
        await deleteDoc(doc(firestore, 'enrollments', enrollment.id));
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Optionally show a toast
    };

    const isLoading = isAuthLoading || isBatchLoading || areStudentsLoading;

    if (isLoading || !batch) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/teacher')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-serif">{batch.name}</CardTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            <p className="text-sm text-muted-foreground">Code:</p>
                                            <span className="font-mono bg-muted px-2 py-1 rounded-md text-sm">{batch.code}</span>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(batch.code)}>
                                                <Clipboard className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => setIsDeleting(true)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Enrolled Students ({enrolledStudents?.length || 0})</CardTitle>
                            <CardDescription>Manage the students in this batch.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {enrolledStudents && enrolledStudents.length > 0 ? (
                                enrolledStudents.map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(student.studentName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{student.studentName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/students/${student.studentId}`}>
                                                    <UserIcon className="mr-2 h-4 w-4" />
                                                    View Profile
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveStudent(student)}>
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No students are enrolled in this batch yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Edit Batch Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Batch</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="batch-name">Batch Name</Label>
                        <Input id="batch-name" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateBatch} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Batch Confirmation Dialog */}
            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the "{batch.name}" batch. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleDeleteBatch} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, delete it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}