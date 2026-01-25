
'use client';

import { useState, FormEvent, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface StudyMaterial {
    id: string;
    title: string;
    subject: string;
    type: string;
    chapter?: string;
    fileUrl?: string;
    createdAt: Timestamp;
}

export default function TeacherMaterialsPage() {
    const firestore = useFirestore();
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const materialsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'studyMaterials'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: materials, isLoading } = useCollection<StudyMaterial>(materialsQuery);

    const resetForm = () => {
        setTitle('');
        setSubject('');
        setChapter('');
        setType('');
        setDescription('');
        setFileUrl('');
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !firestore || !type) return;

        setIsSubmitting(true);
        const newMaterial = {
            teacherId: user.uid,
            teacherName: userProfile.name,
            title,
            subject,
            chapter,
            type,
            description,
            fileUrl,
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

    const handleDelete = (materialId: string) => {
        if (!firestore) return;
        if (window.confirm('Are you sure you want to delete this material?')) {
            deleteDocumentNonBlocking(doc(firestore, 'studyMaterials', materialId));
        }
    };
    
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
                                                        <div className="text-sm space-y-1">
                                                             <p><span className="font-semibold">Type:</span> {material.type}</p>
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
                                        <div className="space-y-2">
                                            <Label htmlFor="material-url">File URL / Video Link</Label>
                                            <Input id="material-url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://example.com/file.pdf" />
                                            <p className="text-xs text-muted-foreground">For now, please paste a public link to the file.</p>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? 'Uploading...' : 'Upload Material'}
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
