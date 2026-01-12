
'use client';

import { useState, useMemo } from 'react';
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
    DropdownMenuSeparator,
  } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { PlusCircle, MoreVertical, BookOpenCheck, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';


type StudyMaterial = {
    id: string;
    title: string;
    description?: string;
    subject: string;
    chapter?: string;
    type: string;
    classLevel?: string;
    createdAt: { toDate: () => Date };
    isFree: boolean;
    price?: number;
};

type UserProfile = {
  name: string;
  subjects?: string[];
  classLevels?: string[];
}

type Class = {
    id: string;
    subject: string;
    classLevel: string;
}

const materialTypes = ["Notes", "Books", "PYQs", "Formulas", "DPP", "Homework", "Test Paper", "Solution"];
const classLevelOptions = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate", "Postgraduate"];


function MaterialsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-72" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function MaterialsPage() {
    const { toast } = useToast();
    const [isAddMaterialOpen, setAddMaterialOpen] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [materialType, setMaterialType] = useState('');
    const [classId, setClassId] = useState<string | null>(null);
    const [classLevel, setClassLevel] = useState<string | null>(null);
    const [isFree, setIsFree] = useState(false);
    const [isOfficial, setIsOfficial] = useState(false);
    const [price, setPrice] = useState<number | ''>('');


    const userProfileQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileQuery);
    const teacherSubjects = useMemo(() => userProfile?.subjects || [], [userProfile]);

    const materialsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'studyMaterials'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const classesQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    
    const { data: materials, isLoading } = useCollection<StudyMaterial>(materialsQuery);
    const { data: classes } = useCollection<Class>(classesQuery);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSubject('');
        setChapter('');
        setMaterialType('');
        setClassId(null);
        setClassLevel(null);
        setIsFree(false);
        setIsOfficial(false);
        setPrice('');
        setAddMaterialOpen(false);
    }

    const handleAddMaterial = async () => {
        if (!title || !subject || !materialType || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.' });
            return;
        }
        if (!isFree && (price === '' || price <= 0)) {
            toast({ variant: 'destructive', title: 'Invalid Price', description: 'Please enter a valid price for premium content.' });
            return;
        }

        const newMaterial = {
            title,
            description,
            subject,
            chapter,
            type: materialType,
            classId,
            classLevel,
            teacherId: user.uid,
            teacherName: userProfile?.name,
            isFree: isFree,
            isOfficial: isOfficial,
            price: isFree ? null : Number(price),
            createdAt: serverTimestamp(),
            // In a real app, you would handle file uploads and store a URL
            fileUrl: 'https://example.com/placeholder.pdf'
        };
        
        const materialsCollection = collection(firestore, 'studyMaterials');
        addDocumentNonBlocking(materialsCollection, newMaterial);

        toast({ title: 'Material Added', description: `${title} has been successfully uploaded.`});
        
        resetForm();
    }
    
    const handleDeleteMaterial = (materialId: string) => {
        if(!firestore) return;
        const materialRef = doc(firestore, 'studyMaterials', materialId);
        deleteDocumentNonBlocking(materialRef);
        toast({ title: 'Material Deleted', description: 'The selected material has been removed.' });
    };

    if (isLoading) {
        return <MaterialsPageSkeleton />;
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
                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">Title*</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-3" placeholder="e.g. Chapter 1 Notes" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" placeholder="A brief summary of the material." />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="class" className="text-right">Private Class</Label>
                                <Select onValueChange={(val) => setClassId(val === 'none' ? null : val)} value={classId || 'none'}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Assign to a class (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (General Material)</SelectItem>
                                        {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.subject} - {c.classLevel}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="classLevel" className="text-right">Public Class Level</Label>
                                <Select onValueChange={(val) => setClassLevel(val === 'none' ? null : val)} value={classLevel || 'none'}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="For public filtering (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="none">None</SelectItem>
                                        {classLevelOptions.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">Subject*</Label>
                                <Select onValueChange={setSubject} value={subject}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select material type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {materialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="file" className="text-right">File*</Label>
                                <Input id="file" type="file" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Access</Label>
                                <div className="col-span-3 space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="isFree" checked={isFree} onCheckedChange={setIsFree} />
                                        <Label htmlFor="isFree">Free (Public)</Label>
                                    </div>
                                     <div className="flex items-center space-x-2">
                                        <Switch id="isOfficial" checked={isOfficial} onCheckedChange={setIsOfficial} />
                                        <Label htmlFor="isOfficial">Official (App Creator)</Label>
                                    </div>
                                </div>
                            </div>
                            {!isFree && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="price" className="text-right">Price (INR)*</Label>
                                    <Input id="price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="col-span-3" placeholder="e.g. 199" />
                                </div>
                            )}
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
                    {materials && materials.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Access</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.map((material) => (
                                    <TableRow key={material.id}>
                                        <TableCell className="font-medium">{material.title}</TableCell>
                                        <TableCell><Badge variant="outline">{material.type}</Badge></TableCell>
                                        <TableCell>{material.subject}</TableCell>
                                        <TableCell>{material.classLevel || 'N/A'}</TableCell>
                                        <TableCell><Badge variant={material.isFree ? 'default' : 'secondary'}>{material.isFree ? 'Public' : 'Private'}</Badge></TableCell>
                                        <TableCell>{material.isFree ? 'Free' : `₹${material.price}`}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                         <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 !cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                 <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the material "{material.title}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteMaterial(material.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-8">You haven't uploaded any materials yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
