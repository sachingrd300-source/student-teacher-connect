'use client';

import { useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Users2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Batch = {
  id: string;
  title?: string;
  subject?: string;
  classLevel?: string;
  classCode?: string;
  batchTime?: string;
};

export default function BatchesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const batchesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) {
      return null;
    }
    // This query now includes the required 'where' clause to satisfy security rules.
    return query(
      collection(firestore, 'classes'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: batches, isLoading } = useCollection<Batch>(batchesQuery);
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Class code copied to clipboard.' });
  };


  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <Users2 className="h-8 w-8"/>
                Manage Classes
            </h1>
            <p className="text-muted-foreground">View and manage all your created classes.</p>
        </div>

        {isLoading && (
            <div className="grid md:grid-cols-2 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )}

      {!isLoading && batches && batches.length === 0 && (
         <Card className="shadow-soft-shadow">
            <CardContent className="py-12 text-center text-muted-foreground">
                <p className="font-semibold text-lg">No Classes Found</p>
                <p>You haven't created any classes yet.</p>
            </CardContent>
        </Card>
      )}

      {!isLoading && batches && batches.length > 0 && (
         <div className="grid md:grid-cols-2 gap-6">
            {batches.map((b) => (
            <Card
                key={b.id}
                className="shadow-soft-shadow"
            >
                <CardHeader>
                    <CardTitle>{b.title || 'Untitled Class'}</CardTitle>
                    <CardDescription>{b.batchTime ? `Batch time: ${b.batchTime}` : `Subject: ${b.subject}`}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between items-center">
                   <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Join Code:</p>
                        <div className="flex items-center gap-2">
                             <p className="font-mono text-lg text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-md">{b.classCode}</p>
                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => b.classCode && handleCopyCode(b.classCode)}>
                                <Copy className="h-4 w-4"/>
                             </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}
