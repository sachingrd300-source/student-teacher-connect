'use client';

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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ClipboardList } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type StudyMaterial = {
    id: string;
    title: string;
    subject: string;
    type: string;
    teacherId: string;
    createdAt: { toDate: () => Date };
}

export default function DailyPracticePage() {
  const firestore = useFirestore();

  const dppQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for all public DPPs
    return query(
      collection(firestore, 'studyMaterials'), 
      where('type', '==', 'DPP'), 
      where('isFree', '==', true),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);
  
  const { data: dailyPracticePapers, isLoading } = useCollection<StudyMaterial>(dppQuery);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <ClipboardList className="w-8 h-8"/>
        Daily Practice
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Daily Practice Papers (DPPs)</CardTitle>
          <CardDescription>Stay sharp with these daily exercises from our tutors.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-10 w-full"/></TableCell>
                    </TableRow>
                ))}
                {dailyPracticePapers?.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell>
                      <div className="font-medium">{paper.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{paper.subject}</Badge>
                    </TableCell>
                    <TableCell>{paper.createdAt.toDate().toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!isLoading && dailyPracticePapers?.length === 0 && <p className="text-center text-muted-foreground py-8">No practice papers available yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
