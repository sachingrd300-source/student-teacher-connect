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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, MoreVertical, Users2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';

type Batch = {
    id: string;
    name: string;
    teacherId: string;
    createdAt: { toDate: () => Date };
};

export default function BatchesPage() {
    const { toast } = useToast();
    const [isCreateBatchOpen, setCreateBatchOpen] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [newBatchName, setNewBatchName] = useState('');

    const batchesQuery = useMemoFirebase(() => {
        if(!firestore || !user) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);
    const { data: batches, isLoading } = useCollection<Batch>(batchesQuery);

    const handleCreateBatch = async () => {
        if (!newBatchName || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name for the batch.' });
            return;
        }

        const newBatch = {
            name: newBatchName,
            teacherId: user.uid,
            createdAt: serverTimestamp(),
        };

        const batchesCollection = collection(firestore, 'batches');
        addDocumentNonBlocking(batchesCollection, newBatch);

        toast({ title: 'Batch Created', description: `The batch "${newBatchName}" has been successfully created.`});
        
        setNewBatchName('');
        setCreateBatchOpen(false);
    }

    const handleDeleteBatch = (batchId: string) => {
        if(!firestore) return;
        const batchRef = doc(firestore, 'batches', batchId);
        deleteDocumentNonBlocking(batchRef);
        toast({ title: 'Batch Deleted', description: 'The selected batch has been removed.' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Users2 className="h-8 w-8"/>
                        Manage Batches
                    </h1>
                    <p className="text-muted-foreground">Create, view, and manage your student groups.</p>
                </div>
                <Dialog open={isCreateBatchOpen} onOpenChange={setCreateBatchOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Create Batch</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Batch</DialogTitle>
                            <DialogDescription>Enter a name for your new batch. You can assign students later.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name*</Label>
                                <Input id="name" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} className="col-span-3" placeholder="e.g. Weekend Maths 2025" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateBatch}>Create Batch</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Batches</CardTitle>
                    <CardDescription>A list of all the student batches you have created.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 mb-2 w-full" />)}
                    {batches && batches.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Batch Name</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batches.map((batch) => (
                                    <TableRow key={batch.id}>
                                        <TableCell className="font-medium">{batch.name}</TableCell>
                                        <TableCell>{batch.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>Edit Name</DropdownMenuItem>
                                                        <DropdownMenuItem>Assign Students</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 !cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Batch
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the batch.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteBatch(batch.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : !isLoading && (
                        <p className="text-sm text-center text-muted-foreground py-8">You haven't created any batches yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
