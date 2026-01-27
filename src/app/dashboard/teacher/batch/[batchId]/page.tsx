'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { doc, updateDoc, deleteDoc, collection, query, where, arrayRemove, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Link from 'next/link';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Trash2, Edit, Clipboard, ArrowLeft, User as UserIcon, Upload, FileText, CalendarPlus, Clock, Download, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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

interface StudyMaterial {
    id: string;
    title: string;
    fileURL: string;
    fileName: string; // Store fileName to delete from storage
    createdAt: string;
}

interface ClassSchedule {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
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
    const batchId = params.batchId as string;

    // Dialog states
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Batch form state
    const [batchName, setBatchName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Material form state
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Class form state
    const [classTitle, setClassTitle] = useState('');
    const [classDescription, setClassDescription] = useState('');
    const [classStartTime, setClassStartTime] = useState('');
    const [classEndTime, setClassEndTime] = useState('');
    const [isCreatingClass, setIsCreatingClass] = useState(false);


    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const batchRef = useMemoFirebase(() => batchId ? doc(firestore, 'batches', batchId) : null, [firestore, batchId]);
    const { data: batch, isLoading: isBatchLoading } = useDoc<Batch>(batchRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'enrollments'), where('batchId', '==', batchId), where('status', '==', 'approved'));
    }, [firestore, batchId]);
    const { data: enrolledStudents, isLoading: areStudentsLoading } = useCollection<Enrollment>(enrollmentsQuery);
    
    const materialsRef = useMemoFirebase(() => collection(firestore, 'batches', batchId, 'materials'), [firestore, batchId]);
    const { data: materials, isLoading: materialsLoading } = useCollection<StudyMaterial>(materialsRef);
    
    const classesRef = useMemoFirebase(() => collection(firestore, 'batches', batchId, 'classes'), [firestore, batchId]);
    const { data: classes, isLoading: classesLoading } = useCollection<ClassSchedule>(classesRef);


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
            await deleteDoc(batchRef);
            router.push('/dashboard/teacher');
        } catch (error) {
            console.error("Error deleting batch:", error);
            setIsSaving(false);
        }
    };
    
    const handleRemoveStudent = async (enrollment: Enrollment) => {
        if (!firestore) return;
        
        const currentBatchRef = doc(firestore, 'batches', enrollment.batchId);
        await updateDoc(currentBatchRef, {
            approvedStudents: arrayRemove(enrollment.studentId)
        });

        await deleteDoc(doc(firestore, 'enrollments', enrollment.id));
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

            await addDoc(collection(firestore, 'batches', batchId, 'materials'), {
                title: materialTitle.trim(),
                fileURL: downloadURL,
                fileName: fileName,
                fileType: materialFile.type,
                batchId: batchId,
                teacherId: user.uid,
                createdAt: new Date().toISOString(),
            });

            setMaterialTitle('');
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
        if (!firestore || !storage) return;
        const fileRef = ref(storage, `materials/${batchId}/${material.fileName}`);
        try {
            await deleteObject(fileRef);
            await deleteDoc(doc(firestore, 'batches', batchId, 'materials', material.id));
        } catch (error) {
            console.error("Error deleting material: ", error);
        }
    };
    
    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classTitle.trim() || !classStartTime || !classEndTime || !firestore || !batchId || !user) return;

        setIsCreatingClass(true);
        try {
            await addDoc(collection(firestore, 'batches', batchId, 'classes'), {
                title: classTitle.trim(),
                description: classDescription.trim(),
                startTime: classStartTime,
                endTime: classEndTime,
                batchId: batchId,
                teacherId: user.uid,
                createdAt: new Date().toISOString(),
            });

            setClassTitle('');
            setClassDescription('');
            setClassStartTime('');
            setClassEndTime('');
        } catch (error) {
            console.error("Error creating class: ", error);
        } finally {
            setIsCreatingClass(false);
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, 'batches', batchId, 'classes', classId));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const isLoading = isAuthLoading || isBatchLoading || areStudentsLoading || materialsLoading || classesLoading;

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

                    <Tabs defaultValue="students" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="students">Students ({enrolledStudents?.length || 0})</TabsTrigger>
                            <TabsTrigger value="materials">Materials ({materials?.length || 0})</TabsTrigger>
                            <TabsTrigger value="classes">Classes ({classes?.length || 0})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="students" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Enrolled Students</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    {enrolledStudents && enrolledStudents.length > 0 ? (
                                        enrolledStudents.map(student => (
                                            <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                <div className="flex items-center gap-4">
                                                    <Avatar><AvatarFallback>{getInitials(student.studentName)}</AvatarFallback></Avatar>
                                                    <p className="font-semibold">{student.studentName}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/students/${student.studentId}`}><UserIcon className="mr-2 h-4 w-4" />View Profile</Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveStudent(student)}>Remove</Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : <p className="text-muted-foreground text-center py-8">No students are enrolled.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="materials" className="mt-4 grid gap-6">
                            <Card>
                                <CardHeader><CardTitle>Upload Study Material</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={handleFileUpload} className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="material-title">Material Title</Label>
                                            <Input id="material-title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="e.g., Chapter 1 Notes" required />
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
                            <Card>
                                 <CardHeader><CardTitle>Uploaded Materials</CardTitle></CardHeader>
                                 <CardContent className="grid gap-4">
                                     {materials && materials.length > 0 ? (
                                        materials.map(material => (
                                            <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-semibold">{material.title}</p>
                                                        <p className="text-xs text-muted-foreground">Uploaded: {formatDate(material.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                     <Button asChild variant="outline" size="sm">
                                                        <a href={material.fileURL} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" /> View</a>
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                                </div>
                                            </div>
                                        ))
                                     ) : <p className="text-muted-foreground text-center py-8">No materials uploaded yet.</p>}
                                 </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="classes" className="mt-4 grid gap-6">
                            <Card>
                                <CardHeader><CardTitle>Schedule a New Class</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateClass} className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="class-title">Class Title</Label>
                                            <Input id="class-title" value={classTitle} onChange={(e) => setClassTitle(e.target.value)} placeholder="e.g., Live Q&A Session" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="class-desc">Description (Optional)</Label>
                                            <Textarea id="class-desc" value={classDescription} onChange={(e) => setClassDescription(e.target.value)} placeholder="e.g., We will cover topics from Chapter 5." />
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="class-start">Start Time</Label>
                                                <Input id="class-start" type="datetime-local" value={classStartTime} onChange={(e) => setClassStartTime(e.target.value)} required />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="class-end">End Time</Label>
                                                <Input id="class-end" type="datetime-local" value={classEndTime} onChange={(e) => setClassEndTime(e.target.value)} required />
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={isCreatingClass || !classTitle.trim() || !classStartTime || !classEndTime} className="w-fit">
                                            {isCreatingClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CalendarPlus className="mr-2 h-4 w-4" />} Schedule Class
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Scheduled Classes</CardTitle></CardHeader>
                                <CardContent className="grid gap-4">
                                    {classes && classes.length > 0 ? (
                                        classes.map(c => (
                                            <div key={c.id} className="p-3 rounded-lg border bg-background">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">{c.title}</p>
                                                        {c.description && <p className="text-sm text-muted-foreground my-1">{c.description}</p>}
                                                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatDate(c.startTime)} to {formatDate(c.endTime)}</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(c.id)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : <p className="text-muted-foreground text-center py-8">No classes scheduled yet.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

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
                        <DialogDescription>This will permanently delete the "{batch.name}" batch. This action cannot be undone.</DialogDescription>
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
