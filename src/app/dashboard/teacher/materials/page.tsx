
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, MoreVertical, BookOpenCheck } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

type Teacher = { id: string; userId: string; subjects: string; };
type Batch = { id: string; name: string; teacherId: string; };
type StudyMaterial = {
    id: string;
    title: string;
    description: string;
    subject: string;
    chapter: string;
    type: string;
    batchId?: string;
    uploadDate: any;
};

const materialTypes = ["Notes", "DPP", "Homework", "Question Bank", "Test Paper", "Solution"];

export default function MaterialsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddMaterialOpen, setAddMaterialOpen] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [batch, setBatch] = useState('');
    const [chapter, setChapter] = useState('');
    const [materialType, setMaterialType] = useState('');

    const teacherQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'teachers'), where('userId', '==', user.uid)) : null
    , [firestore, user]);

    const { data: teacherDocs, isLoading: isLoadingTeacher } = useCollection<Teacher>(teacherQuery);
    const teacher = teacherDocs?.[0];
    const teacherSubjects = teacher?.subjects.split(',').map(s => s.trim()) || [];

    const batchesQuery = useMemoFirebase(() => {
        if(!teacher) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', teacher.id));
    }, [firestore, teacher]);

    const materialsQuery = useMemoFirebase(() => {
        if(!teacher) return null;
        return query(collection(firestore, 'study_materials'), where('teacherId', '==', teacher.id), where('archived', '!=', true));
    }, [firestore, teacher]);

    const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);
    const { data: materials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(materialsQuery);

    const handleAddMaterial = async () => {
        if (!firestore || !teacher || !title || !subject || !materialType) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.' });
            return;
        }

        const materialId = uuidv4();
        const materialRef = doc(firestore, 'study_materials', materialId);
        
        const materialData = {
            id: materialId,
            teacherId: teacher.id,
            title,
            description,
            subject,
            batchId: batch || null,
            chapter,
            type: materialType,
            fileUrl: 'https://example.com/placeholder.pdf', // Placeholder
            uploadDate: serverTimestamp(),
            archived: false
        };

        setDocumentNonBlocking(materialRef, materialData, { merge: false });

        toast({ title: 'Material Added', description: `${title} has been successfully uploaded.`});
        
        // Reset form and close dialog
        setTitle('');
        setDescription('');
        setSubject('');
        setBatch('');
        setChapter('');
        setMaterialType('');
        setAddMaterialOpen(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <BookOpenCheck className="h-8 w-8"/>
                        Study Materials
                    </h1>
                    <p className="text-muted-foreground">Manage and upload learning resources for your students.</p>
                </div>
                <Dialog open={isAddMaterialOpen} onOpenChange={setAddMaterialOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Material</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Add New Study Material</DialogTitle>
                            <DialogDescription>Fill in the details below to upload a new resource.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">Title*</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-3" placeholder="e.g. Chapter 1 Notes" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" placeholder="A brief summary of the material." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">Subject*</Label>
                                <Select onValueChange={setSubject} value={subject}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                    <SelectContent>
                                        {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="batch" className="text-right">Batch</Label>
                                <Select onValueChange={setBatch} value={batch}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="All Students" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Students</SelectItem>
                                        {batches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="chapter" className="text-right">Chapter</Label>
                                <Input id="chapter" value={chapter} onChange={e => setChapter(e.target.value)} className="col-span-3" placeholder="e.g. Chapter 5" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type*</Label>
                                <Select onValueChange={setMaterialType} value={materialType}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select material type" /></SelectTrigger>
                                    <SelectContent>
                                        {materialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="file" className="text-right">File*</Label>
                                <Input id="file" type="file" className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddMaterial}>Upload Material</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Uploaded Materials</CardTitle>
                    <CardDescription>A list of all the resources you have uploaded.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingMaterials && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
                    {materials && materials.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Chapter</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.map((material) => (
                                    <TableRow key={material.id}>
                                        <TableCell className="font-medium">{material.title}</TableCell>
                                        <TableCell><Badge variant="outline">{material.type}</Badge></TableCell>
                                        <TableCell>{material.subject}</TableCell>
                                        <TableCell>{material.chapter || 'N/A'}</TableCell>
                                        <TableCell>{material.uploadDate?.toDate().toLocaleDateString() || 'Just now'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem>Archive</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : !isLoadingMaterials && (
                        <p className="text-sm text-center text-muted-foreground py-8">You haven't uploaded any materials yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    