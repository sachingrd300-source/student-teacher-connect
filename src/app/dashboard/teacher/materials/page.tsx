
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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, MoreVertical, BookOpenCheck, Trash2, Info, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


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
  status: 'pending_verification' | 'approved' | 'denied';
}

type Batch = {
    id: string;
    subject: string;
    classLevel: string;
    title: string;
}

const materialTypes = ["Notes", "Books", "PYQs", "Formulas", "DPP", "Homework", "Test Paper", "Solution"];
const classLevelOptions = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate", "Postgraduate"];

function PendingVerificationCard() {
    return (
        <Card className="bg-amber-50 border-amber-200 shadow-soft-shadow">
            <CardHeader className="flex-row items-center gap-4">
                <Info className="h-8 w-8 text-amber-600"/>
                <div>
                    <CardTitle className="text-xl text-amber-800">Profile Approval Required</CardTitle>
                    <CardDescription className="text-amber-700">
                        Your tutor profile must be approved by an admin before you can upload materials.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    )
}

function DeniedVerificationCard() {
     return (
        <Card className="bg-destructive/10 border-destructive/20 shadow-soft-shadow">
            <CardHeader className="flex-row items-center gap-4">
                <XCircle className="h-8 w-8 text-destructive"/>
                <div>
                    <CardTitle className="text-xl text-destructive">Application Not Approved</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Unfortunately, your tutor application was not approved. You cannot upload materials.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
}

export default function MaterialsPage() {
    const { toast } = useToast();
    const [isAddMaterialOpen, setAddMaterialOpen] = useState(false);
    
    const { user, isLoading: isUserLoading } = useUser();
    const firestore = useFirestore();

    const ADMIN_USER_ID = 'YOUR_ADMIN_USER_ID_HERE';

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [materialType, setMaterialType] = useState('');
    const [batchId, setBatchId] = useState<string | null>(null);
    const [classLevel, setClassLevel] = useState<string | null>(null);
    const [isFree, setIsFree] = useState(true);
    const [isOfficial, setIsOfficial] = useState(false);
    const [price, setPrice] = useState<number | ''>('');


    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);
    const teacherSubjects = useMemo(() => userProfile?.subjects || [], [userProfile]);

    const materialsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'studyMaterials'), 
            where('teacherId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    
    const { data: materials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(materialsQuery);
    const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);

    useEffect(() => {
        const selectedBatch = batches?.find(c => c.id === batchId);
        if (selectedBatch) {
            setSubject(selectedBatch.subject);
        }
    }, [batchId, batches]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSubject('');
        setChapter('');
        setMaterialType('');
        setBatchId(null);
        setClassLevel(null);
        setIsFree(true);
        setIsOfficial(false);
        setPrice('');
        setAddMaterialOpen(false);
    }

    const handleAddMaterial = async () => {
        if (!title || !subject || !materialType || !firestore || !user || !userProfile) {
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
            classId: batchId,
            classLevel,
            teacherId: user.uid,
            teacherName: userProfile.name,
            isFree: isFree,
            isOfficial: user.uid === ADMIN_USER_ID ? isOfficial : false, // Only admin can set official status
            price: isFree ? 0 : Number(price),
            createdAt: serverTimestamp(),
            fileUrl: 'https://example.com/placeholder.pdf'
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

    if (isLoading) {
        return (
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-5 w-96 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>
                <Card className="shadow-soft-shadow">
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-72" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    const PageHeader = () => (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <BookOpenCheck className="h-8 w-8"/>
                    Study Materials
                </h1>
                <p className="text-muted-foreground">Manage and upload learning resources for your students.</p>
            </div>
            {userProfile?.status === 'approved' && (
                 <Dialog open={isAddMaterialOpen} onOpenChange={setAddMaterialOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Material</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add New Study Material</DialogTitle>
                            <DialogDescription>Fill in the details for your new resource. Fields marked with * are required.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            
                            <div className="space-y-2">
                                <Label htmlFor="title">Title*</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1: Motion in a Straight Line" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief summary of the material. What topics does it cover?" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject*</Label>
                                    <Select onValueChange={setSubject} value={subject}>
                                        <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                        <SelectContent>
                                            {isLoadingProfile && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                            {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            {teacherSubjects.length === 0 && !isLoadingProfile && <SelectItem value="no-subjects" disabled>No subjects in profile</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="chapter">Chapter</Label>
                                    <Input id="chapter" value={chapter} onChange={e => setChapter(e.target.value)} placeholder="e.g. Chapter 5" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type*</Label>
                                    <Select onValueChange={setMaterialType} value={materialType}>
                                        <SelectTrigger><SelectValue placeholder="Select material type" /></SelectTrigger>
                                        <SelectContent>
                                            {materialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="classLevel">Public Class Level</Label>
                                    <Select onValueChange={(val) => setClassLevel(val === 'none' ? null : val)} value={classLevel || 'none'}>
                                        <SelectTrigger><SelectValue placeholder="Select a level" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {classLevelOptions.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">For public filtering. Optional.</p>
                                </div>
                            </div>

                            <Card className="bg-muted/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base">Audience & Access</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="class">Assign to Private Batch (Optional)</Label>
                                        <Select onValueChange={(val) => setBatchId(val === 'none' ? null : val)} value={batchId || 'none'} disabled={isLoadingBatches || isUserLoading}>
                                            <SelectTrigger><SelectValue placeholder="Assign to a specific batch..." /></SelectTrigger>
                                            <SelectContent>
                                                {isLoadingBatches ? <SelectItem value="loading" disabled>Loading batches...</SelectItem> :
                                                    <>
                                                        <SelectItem value="none">None (General Material)</SelectItem>
                                                        {batches?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                                                    </>
                                                }
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">If assigned, only students in this batch can access it.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Access Level</Label>
                                        <div className="flex items-center space-x-2 pt-1">
                                            <Switch id="isFree" checked={isFree} onCheckedChange={setIsFree} />
                                            <Label htmlFor="isFree">{isFree ? 'Free (Public)' : 'Paid (Premium)'}</Label>
                                        </div>
                                    </div>
                                    {!isFree && (
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Price (INR)*</Label>
                                            <Input id="price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="e.g. 199" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                <Label htmlFor="file">Upload File*</Label>
                                <Input id="file" type="file" />
                                <p className="text-xs text-muted-foreground">File upload is for demonstration and not yet functional.</p>
                            </div>

                            {user?.uid === ADMIN_USER_ID && (
                                <div className="flex items-center space-x-2 rounded-md border p-4 bg-amber-500/10 border-amber-500/20">
                                    <Switch id="isOfficial" checked={isOfficial} onCheckedChange={setIsOfficial} />
                                    <Label htmlFor="isOfficial">Mark as Official Content (Admin Only)</Label>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddMaterial} disabled={isLoadingProfile || !userProfile || !title || !subject || !materialType || (!isFree && (price === '' || price <= 0))}>
                                {isLoadingProfile || !userProfile ? 'Loading...' : 'Upload Material'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
    
    if (userProfile?.status !== 'approved') {
        return (
            <div className="space-y-6">
                <PageHeader />
                {userProfile?.status === 'pending_verification' && <PendingVerificationCard />}
                {userProfile?.status === 'denied' && <DeniedVerificationCard />}
            </div>
        )
    }

    return (
        <div className="space-y-6">
           <PageHeader />
            <Card className="shadow-soft-shadow">
                <CardHeader>
                    <CardTitle>Uploaded Materials</CardTitle>
                    <CardDescription>A list of all the resources you have uploaded.</CardDescription>
                </CardHeader>
                <CardContent>
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
                            {isLoadingMaterials ? (
                                <>
                                    <TableRow><TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                                    <TableRow><TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                                    <TableRow><TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                                </>
                            ) : materials && materials.length > 0 ? (
                                materials.map((material) => (
                                    <TableRow key={material.id}>
                                        <TableCell className="font-medium">{material.title}</TableCell>
                                        <TableCell><Badge variant="outline">{material.type}</Badge></TableCell>
                                        <TableCell>{material.subject}</TableCell>
                                        <TableCell>{material.classLevel || 'N/A'}</TableCell>
                                        <TableCell><Badge variant={material.isFree ? 'default' : 'secondary'}>{material.isFree ? 'Public' : 'Premium'}</Badge></TableCell>
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
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        You haven't uploaded any materials yet.
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

    