'use client';

import { useState, FormEvent, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useDoc, useStorage } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface StudyMaterial {
    id: string;
    title: string;
    subject: string;
    type: string;
    chapter?: string;
    fileUrl?: string;
    createdAt: Timestamp;
    className?: string;
}

interface Class {
    id: string;
    title: string;
}

export default function TeacherMaterialsPage() {
    const firestore = useFirestore();
    const storage = useStorage();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    // Form state
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [type, setType] = useState('');
    const [description, setDescription] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [classId, setClassId] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const materialsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'studyMaterials'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: materials, isLoading } = useCollection<StudyMaterial>(materialsQuery);

     const classesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: classes } = useCollection<Class>(classesQuery);

    const resetForm = () => {
        setTitle('');
        setSubject('');
        setChapter('');
        setType('');
        setDescription('');
        setFileUrl('');
        setClassId('');
        setFile(null);
        setUploadProgress(0);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !firestore || !storage || !type) return;

        setIsSubmitting(true);

        const selectedClass = classes?.find(c => c.id === classId);

        const saveToFirestore = (finalFileUrl: string) => {
            const newMaterial = {
                teacherId: user!.uid,
                teacherName: userProfile!.name,
                title,
                subject,
                chapter,
                type,
                description,
                fileUrl: finalFileUrl,
                classId: classId === 'general' ? null : classId,
                className: selectedClass?.title || null,
                createdAt: serverTimestamp(),
            };
            const materialsColRef = collection(firestore, 'studyMaterials');
            addDocumentNonBlocking(materialsColRef, newMaterial)
                .then(() => {
                    resetForm();
                })
                .finally(() => {
                    setIsSubmitting(false);
                });
        };

        const showFileInput = type === 'Notes' || type === 'PDF' || type === 'Homework';

        if (showFileInput && file) {
            const storageRef = ref(storage, `study-materials/${user.uid}/${Date.now()}-${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload failed:", error);
                    alert("File upload failed. Please try again.");
                    setIsSubmitting(false);
                },
                () => { // On successful completion
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        saveToFirestore(downloadURL);
                    });
                }
            );
        } else {
             saveToFirestore(type === 'Video' ? fileUrl : '');
        }
    };

    const handleDelete = (materialId: string) => {
        if (!firestore) return;
        if (window.confirm('Are you sure you want to delete this material?')) {
            deleteDocumentNonBlocking(doc(firestore, 'studyMaterials', materialId));
        }
    };
    
    const showFileInput = useMemo(() => ['Notes', 'PDF', 'Homework'].includes(type), [type]);
    const showUrlInput = useMemo(() => type === 'Video', [type]);
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">Manage Study Materials</h1>
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Uploaded Materials</CardTitle>
                                    <CardDescription>The list of materials you have uploaded.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading && <p>Loading your materials...</p>}
                                    {materials && materials.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                                            {materials.map(material => (
                                                <Card key={material.id}>
                                                    <CardHeader>
                                                        <CardTitle className="text-lg">{material.title}</CardTitle>
                                                        <CardDescription>{material.subject} - {material.chapter}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-sm space-y-2">
                                                             <p><span className="font-semibold">Type:</span> {material.type}</p>
                                                             <div className="flex items-center gap-2">
                                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-semibold">{material.className || 'General (All Students)'}</span>
                                                            </div>
                                                            {material.fileUrl && <p><span className="font-semibold">Link:</span> <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Material</a></p>}
                                                        </div>
                                                    </CardContent>
                                                    <CardFooter className="justify-end">
                                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(material.id)}>
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        !isLoading && <p className="text-center text-muted-foreground py-8">You haven't uploaded any materials yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Upload New Material</CardTitle>
                                    <CardDescription>Fill the form to add a new resource.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="material-title">Title</Label>
                                            <Input id="material-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Chapter 5: Thermodynamics" required />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="class-select">Assign to Class (Optional)</Label>
                                             <Select onValueChange={(value) => setClassId(value)} value={classId}>
                                                <SelectTrigger id="class-select">
                                                    <SelectValue placeholder="General (visible to all)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">General (visible to all)</SelectItem>
                                                    {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="material-subject">Subject</Label>
                                            <Input id="material-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Physics" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="material-chapter">Chapter</Label>
                                            <Input id="material-chapter" value={chapter} onChange={e => setChapter(e.target.value)} placeholder="e.g., Chapter 5" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="material-type">Type</Label>
                                            <Select onValueChange={setType} value={type}>
                                                <SelectTrigger id="material-type">
                                                    <SelectValue placeholder="Select material type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Notes">Notes</SelectItem>
                                                    <SelectItem value="PDF">PDF</SelectItem>
                                                    <SelectItem value="Video">Video</SelectItem>
                                                    <SelectItem value="Homework">Homework</SelectItem>
                                                    <SelectItem value="Test">Test</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="material-description">Description</Label>
                                            <Textarea id="material-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief description of the material." />
                                        </div>

                                        {showUrlInput && (
                                            <div className="space-y-2">
                                                <Label htmlFor="material-url">Video Link</Label>
                                                <Input id="material-url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
                                            </div>
                                        )}

                                        {showFileInput && (
                                            <div className="space-y-2">
                                                <Label htmlFor="material-file">Upload File</Label>
                                                <Input id="material-file" type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required={!fileUrl} />
                                            </div>
                                        )}

                                        {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                                            <div className="space-y-2 pt-2">
                                                <Label>Uploading...</Label>
                                                <div className="w-full bg-muted rounded-full h-2.5">
                                                    <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                                                </div>
                                            </div>
                                        )}

                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? (uploadProgress > 0 ? `Uploading... ${Math.round(uploadProgress)}%` : 'Saving...') : 'Upload Material'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
