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
import { Button } from '@/components/ui/button';
import { MoreVertical, Users2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Batch = {
    id: string;
    subject: string;
    classLevel: string;
    createdAt: { toDate: () => Date };
};

export default function BatchesPage() {
    const { toast } = useToast();
    
    const { user } = useUser();
    const firestore = useFirestore();

    const batchesQuery = useMemoFirebase(() => {
        if(!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);
    const { data: batches, isLoading } = useCollection<Batch>(batchesQuery);


    const handleDeleteBatch = (batchId: string) => {
        if(!firestore) return;
        const batchRef = doc(firestore, 'classes', batchId);
        deleteDocumentNonBlocking(batchRef);
        toast({ title: 'Class Deleted', description: 'The selected class has been removed.' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Users2 className="h-8 w-8"/>
                        Manage Classes
                    </h1>
                    <p className="text-muted-foreground">View, and manage your student classes.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/teacher">Create Class</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Classes</CardTitle>
                    <CardDescription>A list of all the student classes you have created.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 mb-2 w-full" />)}
                    {batches && batches.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Class Name</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batches.map((batch) => (
                                    <TableRow key={batch.id}>
                                        <TableCell className="font-medium">{batch.subject} - {batch.classLevel}</TableCell>
                                        <TableCell>{batch.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem disabled>Edit Name</DropdownMenuItem>
                                                        <DropdownMenuItem disabled>Assign Students</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 !cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Class
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the class.
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
                        <p className="text-sm text-center text-muted-foreground py-8">You haven't created any classes yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
