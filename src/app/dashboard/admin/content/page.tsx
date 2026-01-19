'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, MoreVertical, BookOpenCheck, Trash2, BadgeCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type StudyMaterial = {
    id: string;
    title: string;
    teacherName: string;
    subject: string;
    type: string;
    createdAt: { toDate: () => Date };
    isFree: boolean;
    price?: number;
    classId?: string;
    isOfficial?: boolean;
};

type UserProfile = {
  name: string;
}

type Batch = {
    id: string;
    title: string;
}

const materialTypes = ["Notes", "Books", "PYQs", "Formulas", "DPP", "Homework", "Test Paper", "Solution"];
const classLevelOptions = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate", "Postgraduate"];

export default function AdminContentPage() {
    const { toast } = useToast();
    const [isAddMaterialOpen, setAddMaterialOpen] = useState(false);
    
    const { user, isLoading: isUserLoading } = useUser();
    const firestore = useFirestore();

    // Form state
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [materialType, setMaterialType] = useState('');
    const [batchId, setBatchId] = useState<string | null>(null);
    const [classLevel, setClassLevel] = useState<string | null>(null);
    const [isFree, setIsFree] = useState(true);
    const [price, setPrice] = useState<number | ''>('');
    const [isOfficial, setIsOfficial] = useState(false);

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);
    
    const materialsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'studyMaterials'), 
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), orderBy('createdAt', 'desc'));
    }, [firestore, user]);
    
    const { data: materials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(materialsQuery);
    const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);

    const resetForm = () => {
        setVisibility('public');
        setTitle('');
        setFileUrl('');
        setSubject('');
        setMaterialType('');
        setBatchId(null);
        setClassLevel(null);
        setIsFree(true);
        setPrice('');
        setIsOfficial(false);
        setAddMaterialOpen(false);
    }

    const handleAddMaterial = async () => {
        if (!title || !subject || !materialType || !fileUrl || !firestore || !user || !userProfile) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.' });
            return;
        }

        const newMaterial = {
            title,
            subject,
            type: materialType,
            classId: visibility === 'private' ? batchId : null,
            classLevel: visibility === 'public' ? classLevel : null,
            teacherId: user.uid,
            teacherName: userProfile.name,
            isFree: visibility === 'private' ? true : isFree,
            price: visibility === 'public' && !isFree ? Number(price) : 0,
            createdAt: serverTimestamp(),
            fileUrl,
            isOfficial,
        };
        
        const materialsCollection = collection(firestore, 'studyMaterials');
        addDoc(materialsCollection, newMaterial)
            .then(() => {
                 toast({ title: 'Material Added', description: `${title} has been successfully uploaded.`});
                 resetForm();
            })
            .catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: materialsCollection.path,
                        operation: 'create',
                        requestResourceData: newMaterial,
                    })
                )
            });
    }
    
    const handleDeleteMaterial = (materialId: string) => {
        if(!firestore) return;
        const materialRef = doc(firestore, 'studyMaterials', materialId);
        deleteDoc(materialRef)
         .then(() => {
                toast({ title: 'Material Deleted', description: 'The selected material has been removed.' });
            })
            .catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: materialRef.path,
                        operation: 'delete',
                    })
                )
            });
    };

    const isLoading = isUserLoading || isLoadingProfile || isLoadingMaterials || isLoadingBatches;

    return (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <BookOpenCheck className="h-8 w-8"/>
                        Content Management
                    </h1>
                    <p className="text-muted-foreground">Manage all study materials on the platform.</p>
                </div>
                <Dialog open={isAddMaterialOpen} onOpenChange={setAddMaterialOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isLoading}>
                            {isLoading ? 'Loading...' : <><PlusCircle className="mr-2 h-4 w-4"/> Add Material</>}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add New Study Material</DialogTitle>
                            <DialogDescription>Fill in the details for the new resource. Fields marked with * are required.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            
                            <div className="space-y-2">
                                <Label htmlFor="title">Title*</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1: Motion" />
                            </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject*</Label>
                                    <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type*</Label>
                                    <Select onValueChange={setMaterialType} value={materialType}>
                                        <SelectTrigger><SelectValue placeholder="Select material type" /></SelectTrigger>
                                        <SelectContent>
                                            {materialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Audience & Access</Label>
                                <RadioGroup defaultValue="public" value={visibility} onValueChange={(v) => setVisibility(v as 'public' | 'private')} className="flex space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="public" id="public" />
                                        <Label htmlFor="public">Public</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="private" id="private" />
                                        <Label htmlFor="private">Private (Batch-specific)</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            
                            {visibility === 'public' && (
                                <div className="space-y-4 pt-2 pl-4 border-l">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="isFree">Free for Everyone</Label>
                                        <Switch id="isFree" checked={isFree} onCheckedChange={setIsFree} />
                                    </div>
                                    {!isFree && (
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Price (INR)*</Label>
                                            <Input id="price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="e.g. 199" />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="classLevel">Target Class Level (Optional)</Label>
                                        <Select onValueChange={(val) => setClassLevel(val === 'none' ? null : val)} value={classLevel || 'none'}>
                                            <SelectTrigger><SelectValue placeholder="For filtering..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {classLevelOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                            {visibility === 'private' && (
                                <div className="space-y-2 pt-2 pl-4 border-l">
                                    <Label htmlFor="class">Assign to Batch*</Label>
                                    <Select onValueChange={(val) => setBatchId(val === 'none' ? null : val)} value={batchId || 'none'} disabled={isLoadingBatches}>
                                        <SelectTrigger><SelectValue placeholder="Select a private batch..." /></SelectTrigger>
                                        <SelectContent>
                                            {isLoadingBatches ? <SelectItem value="loading" disabled>Loading batches...</SelectItem> :
                                                <>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {batches?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                                                </>
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                             <div className="flex items-center justify-between">
                                <Label htmlFor="isOfficial">Mark as Official Content</Label>
                                <Switch id="isOfficial" checked={isOfficial} onCheckedChange={setIsOfficial} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fileUrl">File URL*</Label>
                                <Input id="fileUrl" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://example.com/document.pdf" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddMaterial} disabled={isLoading}>
                                {isLoading ? 'Uploading...' : 'Upload Material'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="shadow-soft-shadow">
                <CardHeader>
                    <CardTitle>All Platform Materials</CardTitle>
                    <CardDescription>A list of all resources uploaded by tutors and admins.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Uploader</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Access</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                                ))
                            ) : materials && materials.length > 0 ? (
                                materials.map((material) => (
                                    <TableRow key={material.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {material.title}
                                            {material.isOfficial && <BadgeCheck className="h-5 w-5 text-primary" title="Official Content"/>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{material.teacherName}</TableCell>
                                        <TableCell><Badge variant="outline">{material.type}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Badge variant={material.classId ? 'secondary' : 'default'} className="w-fit">{material.classId ? 'Private' : 'Public'}</Badge>
                                                <span className="text-xs text-muted-foreground">{material.isFree ? 'Free' : `₹${material.price}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600 !cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete "{material.title}".</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteMaterial(material.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No materials uploaded on the platform yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
