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
import { Download, ClipboardList, CheckBadge } from 'lucide-react';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

type StudyMaterial = {
    id: string;
    title: string;
    subject: string;
    type: string;
    teacherId: string;
    teacherName?: string;
    isOfficial?: boolean;
    createdAt: { toDate: () => Date };
}

function MaterialRow({ paper }: { paper: StudyMaterial}) {
    return (
        <TableRow>
            <TableCell>
              <div className="font-medium">{paper.title}</div>
              <div className="text-sm text-muted-foreground">
                by {paper.teacherName || 'EduConnect Pro'}
                {paper.isOfficial && <Badge variant="secondary" className="ml-2">Official</Badge>}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{paper.subject}</Badge>
            </TableCell>
            <TableCell>{paper.createdAt.toDate().toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
                <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </TableCell>
          </TableRow>
    )
}

export default function DailyPracticePage() {
  const firestore = useFirestore();
  const { user, isLoading: isUserLoading } = useUser();

  const dppQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    // Query for all public DPPs, ensuring 'isFree' is the first filter
    return query(
      collection(firestore, 'studyMaterials'), 
      where('isFree', '==', true),
      where('type', '==', 'DPP'), 
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid]);
  
  const { data: dailyPracticePapers, isLoading: isLoadingPapers } = useCollection<StudyMaterial>(dppQuery);
  const isLoading = isUserLoading || isLoadingPapers;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <ClipboardList className="w-8 h-8"/>
        Daily Practice
      </h1>

      <Card className="shadow-soft-shadow">
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
                        <TableCell colSpan={4}><Skeleton className="h-12 w-full"/></TableCell>
                    </TableRow>
                ))}
                {!isLoading && dailyPracticePapers?.map((paper) => (
                    <MaterialRow key={paper.id} paper={paper} />
                ))}
              </TableBody>
            </Table>
            {!isLoading && dailyPracticePapers?.length === 0 && <p className="text-center text-muted-foreground py-8">No practice papers available yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
