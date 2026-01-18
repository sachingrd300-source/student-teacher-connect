'use client';

import React, { useMemo } from 'react';
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
import { MoreVertical, Users2, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, orderBy, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type Batch = {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  classCode: string;
  createdAt?: { toDate: () => Date };
};

export default function BatchesPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  // 📌 Firestore query
  const batchesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;

    return query(
      collection(firestore, 'classes'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid]);

  const { data: batches, isLoading } = useCollection<Batch>(batchesQuery);

  // 🗑 Delete batch
  const handleDeleteBatch = (batchId: string) => {
    if (!firestore) return;

    const batchRef = doc(firestore, 'classes', batchId);
    deleteDoc(batchRef)
        .then(() => {
            toast({
                title: 'Batch Deleted',
                description: 'The selected batch has been removed.',
            });
        })
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: batchRef.path,
                operation: 'delete',
            }));
        });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code Copied!',
      description: `The batch code ${code} has been copied to your clipboard.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Users2 className="h-8 w-8" />
            Manage Batches
          </h1>
          <p className="text-muted-foreground">
            View and manage your student batches.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher">Create Batch</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Batches</CardTitle>
          <CardDescription>
            A list of all the student batches you have created.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 mb-2 w-full" />
            ))}

          {!isLoading && batches && batches.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-8">
              You haven't created any batches yet.
            </p>
          )}

          {!isLoading && batches && batches.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead>Batch Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      {batch.title || `${batch.subject} - ${batch.classLevel}`}
                    </TableCell>

                    <TableCell>
                      {batch.createdAt
                        ? batch.createdAt.toDate().toLocaleDateString()
                        : '—'}
                    </TableCell>

                    <TableCell>
                        <div className="flex items-center justify-start gap-2">
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded-md">{batch.classCode}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyCode(batch.classCode)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                              View Students
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              Edit Name
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 !cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Batch
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone and will permanently delete this batch.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
