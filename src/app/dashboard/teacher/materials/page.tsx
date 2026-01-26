
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
import { Trash2, Users, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateStudyGuide } from '@/ai/flows/study-guide-generator';


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

    // AI Generator state
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiSubject, setAiSubject] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);


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

    const handleGenerateMaterial = async (e: FormEvent) => {
        e.preventDefault();
        if (!aiTopic.trim() || !aiSubject.trim()) return;

        setIsGenerating(true);
        try {
            const result = await generateStudyGuide({ topic: aiTopic, subject: aiSubject });
            
            // Populate the main form
            setTitle(aiTopic);
            setSubject(aiSubject);
            setDescription(result.guide); // The generated HTML goes here
            setType('Notes'); // Set type to Notes
            
            setIsAiDialogOpen(false); // Close dialog on success
            setAiTopic('');
            setAiSubject('');

        } catch (error) {
            console.error("AI material generation failed:", error);
            alert("An error occurred while generating the material. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !firestore || !storage || !type) return;

        setIsSubmitting(true);

        const selectedClass = classes?.find(c => c.id === classId);
        
        const createMaterialData = (url: string) => ({
            teacherId: user!.uid,
            teacherName: userProfile!.name,
            title,
            subject,
            chapter,
            type,
            description,
            fileUrl: url,
            classId: classId === 'general' ? null : classId,
            className: selectedClass?.title || null,
            createdAt: serverTimestamp(),
        });

        const showFileInput = ['Notes', 'PDF', 'Homework'].includes(type);

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
                        const newMaterial = createMaterialData(downloadURL);
                        const materialsColRef = collection(firestore, 'studyMaterials');
                        addDocumentNonBlocking(materialsColRef, newMaterial);

                        resetForm();
                        setIsSubmitting(false);
                    });
                }
            );
        } else {
             const newMaterial = createMaterialData(type === 'Video' ? fileUrl : '');
             const materialsColRef = collection(firestore, 'studyMaterials');
             addDocumentNonBlocking(materialsColRef, newMaterial);
             
             resetForm();
             setIsSubmitting(false);
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
                                    <CardTitle>Add New Material</CardTitle>
                                    <CardDescription>Fill the form to add a new resource, or generate one with AI.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                         <Button type="button" variant="outline" className="w-full" onClick={() => setIsAiDialogOpen(true)}>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            Generate Notes with AI
                                        </Button>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-card px-2 text-muted-foreground">
                                                Or fill manually
                                                </span>
                                            </div>
                                        </div>

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
                                            <Label htmlFor="material-description">Description / Notes Content</Label>
                                            <Textarea id="material-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief description, or paste generated notes here." rows={5} />
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
                                            {isSubmitting ? (uploadProgress > 0 ? `Uploading... ${Math.round(uploadProgress)}%` : 'Saving...') : 'Save Material'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            
            <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>AI Notes Generator</DialogTitle>
                        <DialogDescription>
                            Provide a topic and subject, and the AI will generate study notes for you.
                            The generated content will populate the main form.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGenerateMaterial} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="ai-topic">Topic</Label>
                            <Input
                                id="ai-topic"
                                placeholder="e.g., The Indian Rebellion of 1857"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai-subject">Subject</Label>
                            <Input
                                id="ai-subject"
                                placeholder="e.g., History"
                                value={aiSubject}
                                onChange={(e) => setAiSubject(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsAiDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isGenerating}>
                                {isGenerating ? 'Generating...' : 'Generate & Use'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
