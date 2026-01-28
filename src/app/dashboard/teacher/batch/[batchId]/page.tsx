
'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { doc, updateDoc, deleteDoc, collection, query, where, arrayUnion, arrayRemove, addDoc, writeBatch, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Link from 'next/link';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Trash2, Edit, Clipboard, ArrowLeft, User as UserIcon, Upload, FileText, Download, Trash, Send, Wallet, ClipboardCheck, Pencil, PlusCircle, BookOpen, Notebook, Users, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeeManagementDialog } from '@/components/fee-management-dialog';
import { TestMarksDialog } from '@/components/test-marks-dialog';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
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
    teacherId: string;
    batchId: string;
    status: 'pending' | 'approved';
    createdAt: string;
    approvedAt?: string;
}

interface StudyMaterial {
    id: string;
    title: string;
    description?: string;
    fileURL: string;
    fileName: string; // Store fileName to delete from storage
    fileType: string;
    createdAt: string;
}

interface Activity {
    id: string;
    message: string;
    createdAt: string;
}

interface Test {
    id: string;
    title: string;
    subject: string;
    testDate: string;
    maxMarks: number;
    batchId: string;
    teacherId: string;
    createdAt: string;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

export default function BatchManagementPage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const batchId = params.batchId as string;
    const defaultTab = searchParams.get('tab') || 'students';

    // Dialog states
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [studentForFees, setStudentForFees] = useState<Enrollment | null>(null);
    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    
    // Batch form state
    const [batchName, setBatchName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Material form state
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Announcement form state
    const [announcement, setAnnouncement] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Test form state
    const [testTitle, setTestTitle] = useState('');
    const [testSubject, setTestSubject] = useState('');
    const [testDate, setTestDate] = useState('');
    const [maxMarks, setMaxMarks] = useState('');
    const [isCreatingTest, setIsCreatingTest] = useState(false);


    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const batchRef = useMemoFirebase(() => {
        if (!firestore || !batchId || !user) return null;
        return doc(firestore, 'batches', batchId);
    }, [firestore, batchId, user]);
    const { data: batch, isLoading: isBatchLoading } = useDoc<Batch>(batchRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'enrollments'), where('batchId', '==', batchId));
    }, [firestore, batchId]);
    const { data: enrollmentsData, isLoading: areStudentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const [pendingStudents, enrolledStudents] = useMemo(() => {
        const pending: Enrollment[] = [];
        const enrolled: Enrollment[] = [];
        enrollmentsData?.forEach(e => {
            if (e.status === 'pending') {
                pending.push(e);
            } else if (e.status === 'approved') {
                enrolled.push(e);
            }
        });
        return [pending, enrolled];
    }, [enrollmentsData]);
    
    const materialsRef = useMemoFirebase(() => {
        if (!firestore || !batchId || !user) return null;
        return query(collection(firestore, 'batches', batchId, 'materials'), orderBy('createdAt', 'desc'));
    }, [firestore, batchId, user]);
    const { data: materials, isLoading: materialsLoading } = useCollection<StudyMaterial>(materialsRef);
    
    const activityQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user) return null;
        return query(collection(firestore, 'batches', batchId, 'activity'), orderBy('createdAt', 'desc'));
    }, [firestore, batchId, user]);
    const { data: activities, isLoading: activitiesLoading } = useCollection<Activity>(activityQuery);
    
    const testsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'batches', batchId, 'tests'), orderBy('testDate', 'desc'));
    }, [firestore, batchId]);
    const { data: tests, isLoading: testsLoading } = useCollection<Test>(testsQuery);


    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.replace('/login');
        }
    }, [isAuthLoading, user, router]);
    
    useEffect(() => {
        if (batch) {
            setBatchName(batch.name);
            if (user && batch.teacherId !== user.uid) {
                router.replace('/dashboard/teacher');
            }
        }
    }, [batch, user, router]);

    const handleUpdateBatch = async () => {
        if (!batchRef || !batchName.trim() || !firestore || !batchId) return;
        setIsSaving(true);
        try {
            const firestoreBatch = writeBatch(firestore);

            // Update batch name
            firestoreBatch.update(batchRef, { name: batchName.trim() });

            // Create activity log
            const activityColRef = collection(firestore, 'batches', batchId, 'activity');
            firestoreBatch.set(doc(activityColRef), {
                message: `The batch name was updated to "${batchName.trim()}".`,
                createdAt: new Date().toISOString(),
            });

            await firestoreBatch.commit();
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
            await deleteDoc(batchRef);
            router.push('/dashboard/teacher');
        } catch (error) {
            console.error("Error deleting batch:", error);
            setIsSaving(false);
        }
    };
    
    const handleRemoveStudent = async (enrollment: Enrollment) => {
        if (!firestore || !batchId) return;
        
        const firestoreBatch = writeBatch(firestore);

        const currentBatchRef = doc(firestore, 'batches', enrollment.batchId);
        firestoreBatch.update(currentBatchRef, {
            approvedStudents: arrayRemove(enrollment.studentId)
        });

        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        firestoreBatch.delete(enrollmentRef);

        const activityColRef = collection(firestore, 'batches', batchId, 'activity');
        firestoreBatch.set(doc(activityColRef), {
            message: `Student "${enrollment.studentName}" was removed from the batch.`,
            createdAt: new Date().toISOString(),
        });

        await firestoreBatch.commit();
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFile || !materialTitle.trim() || !storage || !batchId || !user) return;

        setIsUploading(true);
        const fileName = `${Date.now()}_${materialFile.name}`;
        const fileRef = ref(storage, `materials/${batchId}/${fileName}`);

        try {
            await uploadBytes(fileRef, materialFile);
            const downloadURL = await getDownloadURL(fileRef);

            const activityColRef = collection(firestore, 'batches', batchId, 'activity');
            const materialsColRef = collection(firestore, 'batches', batchId, 'materials');
            
            const firestoreBatch = writeBatch(firestore);

            firestoreBatch.set(doc(materialsColRef), {
                title: materialTitle.trim(),
                description: materialDescription.trim(),
                fileURL: downloadURL,
                fileName: fileName,
                fileType: materialFile.type,
                batchId: batchId,
                teacherId: user.uid,
                createdAt: new Date().toISOString(),
            });

            firestoreBatch.set(doc(activityColRef), {
                message: `New material uploaded: "${materialTitle.trim()}"`,
                createdAt: new Date().toISOString(),
            });

            await firestoreBatch.commit();

            setMaterialTitle('');
            setMaterialDescription('');
            setMaterialFile(null);
            if (document.getElementById('material-file')) {
                (document.getElementById('material-file') as HTMLInputElement).value = '';
            }
        } catch (error) {
            console.error("Error uploading material: ", error);
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleDeleteMaterial = async (material: StudyMaterial) => {
        if (!firestore || !storage || !batchId) return;
        const fileRef = ref(storage, `materials/${batchId}/${material.fileName}`);
        const materialDocRef = doc(firestore, 'batches', batchId, 'materials', material.id);
        const activityColRef = collection(firestore, 'batches', batchId, 'activity');
        
        try {
            await deleteObject(fileRef);
            
            const firestoreBatch = writeBatch(firestore);
            firestoreBatch.delete(materialDocRef);
            firestoreBatch.set(doc(activityColRef), {
                message: `Material "${material.title}" was deleted.`,
                createdAt: new Date().toISOString(),
            });
            await firestoreBatch.commit();

        } catch (error) {
            console.error("Error deleting material: ", error);
        }
    };

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcement.trim() || !firestore || !batchId) return;
    
        setIsPosting(true);
        try {
            const activityColRef = collection(firestore, 'batches', batchId, 'activity');
            await addDoc(activityColRef, {
                message: announcement.trim(),
                createdAt: new Date().toISOString(),
            });
            setAnnouncement('');
        } catch (error) {
            console.error("Error posting announcement:", error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testTitle.trim() || !testSubject.trim() || !testDate || !maxMarks || !firestore || !batchId || !user) return;
        
        setIsCreatingTest(true);
        try {
            const testsColRef = collection(firestore, 'batches', batchId, 'tests');
            const activityColRef = collection(firestore, 'batches', batchId, 'activity');
            
            const firestoreBatch = writeBatch(firestore);

            firestoreBatch.set(doc(testsColRef), {
                title: testTitle.trim(),
                subject: testSubject.trim(),
                testDate: new Date(testDate).toISOString(),
                maxMarks: Number(maxMarks),
                batchId,
                teacherId: user.uid,
                createdAt: new Date().toISOString(),
            });

            firestoreBatch.set(doc(activityColRef), {
                message: `New test scheduled: "${testTitle.trim()}" on ${new Date(testDate).toLocaleDateString()}`,
                createdAt: new Date().toISOString(),
            });

            await firestoreBatch.commit();

            setTestTitle('');
            setTestSubject('');
            setTestDate('');
            setMaxMarks('');
        } catch (error) {
            console.error("Error creating test:", error);
        } finally {
            setIsCreatingTest(false);
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

        const currentBatchRef = doc(firestore, 'batches', enrollment.batchId);
        batch.update(currentBatchRef, {
            approvedStudents: arrayUnion(enrollment.studentId)
        });

        await batch.commit();
    };

    const handleDecline = async (enrollmentId: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, 'enrollments', enrollmentId));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const isLoading = isAuthLoading || isBatchLoading || areStudentsLoading || materialsLoading || activitiesLoading || testsLoading;

    if (isLoading || !batch) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/teacher')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <Card className="rounded-2xl shadow-lg">
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

                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                            <TabsTrigger value="students">Students ({enrolledStudents?.length || 0})</TabsTrigger>
                            <TabsTrigger value="tests">Tests ({tests?.length || 0})</TabsTrigger>
                            <TabsTrigger value="materials">Materials ({materials?.length || 0})</TabsTrigger>
                            <TabsTrigger value="announcements">Announcements</TabsTrigger>
                        </TabsList>

                        <TabsContent value="students" className="mt-4 grid gap-6">
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Pending Requests ({pendingStudents.length})</CardTitle>
                                    <CardDescription>Approve or decline requests from students to join this batch.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {pendingStudents.length > 0 ? (
                                        <div className="grid gap-4">
                                            {pendingStudents.map(student => (
                                                <div key={student.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border bg-background">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <Avatar><AvatarFallback>{getInitials(student.studentName)}</AvatarFallback></Avatar>
                                                        <p className="font-semibold break-words">{student.studentName}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 self-end sm:self-center mt-4 sm:mt-0">
                                                        <Button size="sm" onClick={() => handleApprove(student)}>Approve</Button>
                                                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDecline(student.id)}>Decline</Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Pending Requests</h3>
                                            <p className="text-muted-foreground mt-1">There are no pending requests for this batch.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                             <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Enrolled Students ({enrolledStudents.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {enrolledStudents.length > 0 ? (
                                        <div className="grid gap-4">
                                            {enrolledStudents.map(student => (
                                                <div key={student.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border bg-background">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <Avatar><AvatarFallback>{getInitials(student.studentName)}</AvatarFallback></Avatar>
                                                        <p className="font-semibold break-words">{student.studentName}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 self-end sm:self-center mt-4 sm:mt-0">
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={`/students/${student.studentId}`}><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                                                        </Button>
                                                         <Button variant="outline" size="sm" onClick={() => setStudentForFees(student)}>
                                                            <Wallet className="mr-2 h-4 w-4" /> Fees
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveStudent(student)}>Remove</Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Students Enrolled</h3>
                                            <p className="text-muted-foreground mt-1">Share the batch code to get students to join!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="tests" className="mt-4 grid gap-6">
                             <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Create a New Test</CardTitle>
                                    <CardDescription>Schedule a new test for the students in this batch.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateTest} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                                        <div className="grid gap-2">
                                            <Label htmlFor="test-title">Test Title</Label>
                                            <Input id="test-title" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="e.g., Mid-Term Exam" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="test-subject">Subject</Label>
                                            <Input id="test-subject" value={testSubject} onChange={(e) => setTestSubject(e.target.value)} placeholder="e.g., Physics" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="test-date">Test Date</Label>
                                            <Input id="test-date" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="max-marks">Max Marks</Label>
                                            <Input id="max-marks" type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} placeholder="e.g., 100" required />
                                        </div>
                                        <Button type="submit" disabled={isCreatingTest} className="w-full lg:w-auto sm:col-span-2 lg:col-span-1 lg:col-start-4">
                                            {isCreatingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />} Create Test
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader><CardTitle>Conducted Tests</CardTitle></CardHeader>
                                <CardContent>
                                    {tests && tests.length > 0 ? (
                                        <div className="grid gap-4">
                                            {tests.map(test => (
                                                <div key={test.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border bg-background gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold break-words">{test.title} <span className="font-normal text-muted-foreground">- {test.subject}</span></p>
                                                        <p className="text-sm text-muted-foreground mt-1">Date: {new Date(test.testDate).toLocaleDateString()}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Max Marks: {test.maxMarks}</p>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedTest(test)} className="self-end sm:self-center">
                                                        <Pencil className="mr-2 h-4 w-4" /> Manage Marks
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <Notebook className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Tests Scheduled</h3>
                                            <p className="text-muted-foreground mt-1">Create a test above to get started.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="materials" className="mt-4 grid gap-6">
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Upload Study Material</CardTitle>
                                    <CardDescription>Share notes, documents, and other files with your students.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleFileUpload} className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="material-title">Material Title</Label>
                                            <Input id="material-title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="e.g., Chapter 1 Notes" required />
                                        </div>
                                         <div className="grid gap-2">
                                            <Label htmlFor="material-description">Description (Optional)</Label>
                                            <Textarea id="material-description" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} placeholder="A short description of the material." />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="material-file">File</Label>
                                            <Input id="material-file" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setMaterialFile(e.target.files ? e.target.files[0] : null)} required />
                                        </div>
                                        <Button type="submit" disabled={isUploading || !materialFile || !materialTitle.trim()} className="w-fit">
                                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl shadow-lg">
                                 <CardHeader><CardTitle>Uploaded Materials</CardTitle></CardHeader>
                                 <CardContent>
                                     {materials && materials.length > 0 ? (
                                        <div className="grid gap-4">
                                            {materials.map(material => (
                                                <div key={material.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border bg-background gap-4">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <FileText className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold break-words">{material.title}</p>
                                                            <p className="text-sm text-muted-foreground mt-1 break-words">{material.description}</p>
                                                            <p className="text-xs text-muted-foreground mt-2">Uploaded: {formatDate(material.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                                                         <Button asChild variant="outline" size="sm">
                                                            <a href={material.fileURL} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" /> View</a>
                                                        </Button>
                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Materials Uploaded</h3>
                                            <p className="text-muted-foreground mt-1">Upload a file to share it with your students.</p>
                                        </div>
                                     )}
                                 </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="announcements" className="mt-4 grid gap-6">
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Post an Announcement</CardTitle>
                                    <CardDescription>Send a notification to all students in this batch.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handlePostAnnouncement} className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="announcement-text">Notification Message</Label>
                                            <Textarea 
                                                id="announcement-text"
                                                value={announcement} 
                                                onChange={(e) => setAnnouncement(e.target.value)}
                                                placeholder="e.g., The test for Chapter 5 will be on Friday. or Today's class is cancelled."
                                                required 
                                            />
                                        </div>
                                        <Button type="submit" disabled={isPosting || !announcement.trim()} className="w-fit">
                                            {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Post Notification
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader><CardTitle>Announcement History</CardTitle></CardHeader>
                                <CardContent>
                                    {activities && activities.length > 0 ? (
                                        <div className="grid gap-4">
                                            {activities.map(activity => (
                                                <div key={activity.id} className="p-3 rounded-lg border bg-background">
                                                    <p className="font-medium">{activity.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <Send className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Announcements Posted</h3>
                                            <p className="text-muted-foreground mt-1">Share an update with your students!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            {studentForFees && (
                <FeeManagementDialog 
                    isOpen={!!studentForFees} 
                    onClose={() => setStudentForFees(null)} 
                    student={studentForFees} 
                />
            )}

            {selectedTest && (
                <TestMarksDialog
                    isOpen={!!selectedTest}
                    onClose={() => setSelectedTest(null)}
                    test={selectedTest}
                    students={enrolledStudents || []}
                />
            )}

            {/* Edit Batch Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Batch</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="batch-name">Batch Name</Label>
                        <Input id="batch-name" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateBatch} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Batch Confirmation Dialog */}
            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>This will permanently delete the "{batch?.name}" batch. This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleDeleteBatch} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Yes, delete it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

