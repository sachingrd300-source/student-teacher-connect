'use client';

import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp, orderBy } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, PlusCircle, MoreVertical, Check, X, BookUser, Users, Clock } from 'lucide-react';
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

interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    classTitle: string;
    classId: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: Timestamp;
}

const StatCard = ({ title, value, icon, isLoading }: { title: string, value: string | number, icon: React.ReactNode, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="h-8 w-1/2 bg-muted rounded-md animate-pulse" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
    </Card>
);


export default function TeacherDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();

    // Class form state
    const [classTitle, setClassTitle] = useState('');
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

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string, status: 'pending_verification' | 'approved' | 'denied'}>(userProfileRef);

    const isTutor = userProfile?.role === 'tutor';

    // Redirect logic
    useEffect(() => {
        if (isAuthLoading || isProfileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile) {
             if (!isTutor) {
                router.replace('/dashboard/student');
            } else if (userProfile.status !== 'approved') {
                router.replace('/dashboard/teacher/status');
            }
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, isTutor, router]);
    
    // --- Data Fetching ---
    const classesQuery = useMemoFirebase(() => {
        if (!isTutor || !firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user, isTutor]);
    const { data: classes, isLoading: classesLoading } = useCollection<Class>(classesQuery);
    
    // Fetch pending enrollments for stats and pending list
    const pendingEnrollmentsQuery = useMemoFirebase(() => {
        if (!isTutor || !firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    }, [firestore, user, isTutor]);
    const { data: pendingEnrollments, isLoading: pendingEnrollmentsLoading } = useCollection<Enrollment>(pendingEnrollmentsQuery);

    // Fetch approved enrollments for total student count
    const approvedEnrollmentsQuery = useMemoFirebase(() => {
        if (!isTutor || !firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid), where('status', '==', 'approved'));
    }, [firestore, user, isTutor]);
    const { data: approvedEnrollments, isLoading: approvedEnrollmentsLoading } = useCollection<Enrollment>(approvedEnrollmentsQuery);

    // --- Action Handlers ---
    const handleRequest = (enrollmentId: string, newStatus: 'approved' | 'denied') => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
        updateDocumentNonBlocking(enrollmentRef, { status: newStatus });
    };

    // --- Form Handlers ---
    const resetClassForm = () => {
        setClassTitle('');
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
        setClassTitle(classData.title);
        setSubject(classData.subject);
        setBatchTime(classData.batchTime);
        setFee(classData.fee?.toString() || '');
        setIsCreateClassOpen(true);
    };
    
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
            title: classTitle,
            subject,
            batchTime,
            fee: Number(fee) || 0,
            classCode: nanoid(6).toUpperCase(),
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(collection(firestore, 'classes'), newClassData)
          .finally(() => {
              setIsProcessingClass(false);
              handleCloseDialog();
          });
    };

    const handleUpdateClass = () => {
        if (!firestore || !editingClass) return;
        setIsProcessingClass(true);

        const classRef = doc(firestore, 'classes', editingClass.id);
        const updatedData = { title: classTitle, subject, batchTime, fee: Number(fee) || 0 };

        updateDocumentNonBlocking(classRef, updatedData)
            .finally(() => {
                setIsProcessingClass(false);
                handleCloseDialog();
            });
    };

    const handleDeleteClass = (classId: string) => {
        if (!firestore) return;
        if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            deleteDocumentNonBlocking(doc(firestore, 'classes', classId));
        }
    };
    
    if (isAuthLoading || isProfileLoading || !userProfile || userProfile.status !== 'approved') {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading teacher dashboard...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in-down">
                    <h1 className="text-3xl font-bold">Teacher Dashboard</h1>

                    {/* --- Stats Section --- */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard
                            title="My Classes"
                            value={classes?.length ?? 0}
                            icon={<BookUser className="h-4 w-4" />}
                            isLoading={classesLoading}
                        />
                        <StatCard
                            title="Total Students"
                            value={approvedEnrollments?.length ?? 0}
                            icon={<Users className="h-4 w-4" />}
                            isLoading={approvedEnrollmentsLoading}
                        />
                        <StatCard
                            title="Pending Requests"
                            value={pendingEnrollments?.length ?? 0}
                            icon={<Clock className="h-4 w-4" />}
                            isLoading={pendingEnrollmentsLoading}
                        />
                    </div>
                    
                    <div className="grid gap-8 lg:grid-cols-5">
                        <div className="lg:col-span-3 space-y-8">
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className='mb-4 sm:mb-0'>
                                            <CardTitle>My Classes</CardTitle>
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
                                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                                            {classes.map((c) => (
                                                <Card key={c.id} className="flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
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
                                        !classesLoading && <p className="text-center text-muted-foreground py-8">You haven't created any classes yet. Click "Create New Class" to get started.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2 space-y-8">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Student Enrollment Requests</CardTitle>
                                    <CardDescription>Approve or deny requests from students to join your classes.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {pendingEnrollmentsLoading ? <p className="text-center py-4">Loading requests...</p> : 
                                    pendingEnrollments && pendingEnrollments.length > 0 ?
                                    (
                                        <div className="space-y-4">
                                            {pendingEnrollments.map(req => (
                                                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
                                                    <div>
                                                        <p><span className="font-bold">{req.studentName}</span> wants to join</p>
                                                        <p className="text-sm font-semibold text-primary">{req.classTitle}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Requested on: {new Date(req.createdAt.seconds * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 mt-3 sm:mt-0">
                                                        <Button size="sm" className="bg-success/10 text-success hover:bg-success/20 hover:text-success" onClick={() => handleRequest(req.id, 'approved')}>
                                                            <Check className="h-4 w-4 mr-2" />Approve
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleRequest(req.id, 'denied')}>
                                                            <X className="h-4 w-4 mr-2" />Deny
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">No pending requests.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Class Create/Edit Dialog */}
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
                                    <Input id="title" placeholder="e.g., Grade 10 Physics" value={classTitle} onChange={(e) => setClassTitle(e.target.value)} required />
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
