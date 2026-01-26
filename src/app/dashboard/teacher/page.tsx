
'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp, orderBy } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, PlusCircle, MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


interface Class {
    id: string;
    title: string;
    subject: string;
    batchTime: string;
    classCode: string;
    createdAt?: Timestamp;
    fee?: number;
}

export default function TeacherDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();

    // State for Create/Edit Class form
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [batchTime, setBatchTime] = useState('');
    const [fee, setFee] = useState('');
    const [isProcessingClass, setIsProcessingClass] = useState(false);
    const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string}>(userProfileRef);

    const isTutor = userProfile?.role === 'tutor';

    // Redirect logic
    useEffect(() => {
        if (isAuthLoading || isProfileLoading) return;
        if (!user) {
            router.replace('/login');
        } else if (userProfile && !isTutor) {
            router.replace('/dashboard/student');
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, isTutor, router]);

    const classesQuery = useMemoFirebase(() => {
        if (!isTutor || !firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user, isTutor]);

    const { data: classes, isLoading: classesLoading } = useCollection<Class>(classesQuery);

    const resetClassForm = () => {
        setTitle('');
        setSubject('');
        setBatchTime('');
        setFee('');
        setEditingClass(null);
    };

    const handleOpenCreateDialog = () => {
        resetClassForm();
        setIsCreateClassOpen(true);
    };

    const handleOpenEditDialog = (classData: Class) => {
        setEditingClass(classData);
        setTitle(classData.title);
        setSubject(classData.subject);
        setBatchTime(classData.batchTime);
        setFee(classData.fee?.toString() || '');
        // Note: Do not open the 'create' dialog here, open the 'edit' one
    };
    
    // This will now open the edit dialog directly
    useEffect(() => {
        if (editingClass) {
            setIsCreateClassOpen(true); // Re-using the same dialog component for both create/edit
        }
    }, [editingClass]);


    const handleCloseDialog = () => {
        setIsCreateClassOpen(false);
        setEditingClass(null);
        resetClassForm();
    };

    const handleSaveClass = (e: FormEvent) => {
        e.preventDefault();
        if (editingClass) {
            handleUpdateClass();
        } else {
            handleCreateClass();
        }
    };
    
    const handleCreateClass = () => {
        if (!user || !userProfile || !firestore) return;

        setIsProcessingClass(true);
        
        const newClassData = {
            teacherId: user.uid,
            teacherName: userProfile.name,
            title,
            subject,
            batchTime,
            fee: Number(fee) || 0,
            classCode: nanoid(6).toUpperCase(),
            createdAt: serverTimestamp(),
        };

        const classesColRef = collection(firestore, 'classes');
        addDocumentNonBlocking(classesColRef, newClassData)
          .then(() => {
              handleCloseDialog();
          })
          .finally(() => {
              setIsProcessingClass(false);
          });
    };

    const handleUpdateClass = () => {
        if (!firestore || !editingClass) return;
        setIsProcessingClass(true);

        const classRef = doc(firestore, 'classes', editingClass.id);
        const updatedData = {
            title,
            subject,
            batchTime,
            fee: Number(fee) || 0,
        };

        updateDocumentNonBlocking(classRef, updatedData);
        handleCloseDialog();
        setIsProcessingClass(false);
    };

    const handleDeleteClass = (classId: string) => {
        if (!firestore) return;
        if (window.confirm('Are you sure you want to delete this class? This will not delete the students, but it will remove the class itself. This action cannot be undone.')) {
            const classRef = doc(firestore, 'classes', classId);
            deleteDocumentNonBlocking(classRef);
        }
    };

    if (isAuthLoading || isProfileLoading || !userProfile) {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading teacher dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isTutor) {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile.name} userRole="student" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Unauthorized. Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
                    <div className="grid gap-8 animate-fade-in-down">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div className='mb-4 sm:mb-0'>
                                        <CardTitle>Your Classes</CardTitle>
                                        <CardDescription>Select a class to manage students and view details.</CardDescription>
                                    </div>
                                    <Button onClick={handleOpenCreateDialog}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create New Class
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {classesLoading && <p>Loading classes...</p>}
                                {classes && classes.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {classes.map((c) => (
                                            <Card key={c.id} className="flex flex-col">
                                                <CardHeader className="flex-grow">
                                                    <CardTitle className="text-lg">{c.title}</CardTitle>
                                                    <CardDescription>{c.subject} ({c.batchTime})</CardDescription>
                                                    <div className="pt-2">
                                                        <div className="text-sm text-muted-foreground">Class Code:</div>
                                                        <div className="font-mono text-base font-bold text-foreground">{c.classCode}</div>
                                                    </div>
                                                     <p className="text-xs text-muted-foreground pt-2">Created on: {c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                                </CardHeader>
                                                <CardFooter className="flex justify-between items-center">
                                                    <Link href={`/dashboard/teacher/class/${c.id}`} passHref className="flex-grow">
                                                        <Button className="w-full">Manage</Button>
                                                    </Link>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="ml-2 flex-shrink-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">More options</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenEditDialog(c)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                <span>Edit</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDeleteClass(c.id)} className="text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Delete</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    !classesLoading && <p className="text-center text-muted-foreground py-8">You haven't created any classes yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Create/Edit Class Dialog */}
                    <Dialog open={isCreateClassOpen} onOpenChange={handleCloseDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingClass ? 'Edit Class' : 'Create a New Class'}</DialogTitle>
                                <DialogDescription>
                                    {editingClass ? `Make changes to your class details.` : `Fill in the details to create a new class batch.`}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveClass} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Class Title</Label>
                                    <Input id="title" placeholder="e.g., Grade 10 Physics" value={title} onChange={(e) => setTitle(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="e.g., Physics" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="batch-time">Batch Timing</Label>
                                    <Input id="batch-time" placeholder="e.g., 10:00 AM - 11:30 AM" value={batchTime} onChange={(e) => setBatchTime(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fee">Fee (Optional)</Label>
                                    <Input id="fee" type="number" placeholder="e.g., 500" value={fee} onChange={(e) => setFee(e.target.value)} />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="secondary" onClick={handleCloseDialog}>Cancel</Button>
                                    <Button type="submit" disabled={isProcessingClass}>
                                        {isProcessingClass ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
        </div>
    );
}
