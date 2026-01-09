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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

type StudyMaterial = {
    id: string;
    title: string;
    subject: string;
    type: string;
    teacherId: string;
    createdAt: { toDate: () => Date };
}

type Enrollment = {
  teacherId: string;
}

export default function DailyPracticePage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('status', '==', 'approved'));
  }, [firestore, user]);

  const { data: enrollments } = useCollection<Enrollment>(enrollmentsQuery);

  const teacherIds = useMemo(() => enrollments?.map(e => e.teacherId) || [], [enrollments]);

  const dppQuery = useMemoFirebase(() => {
    if (!firestore || teacherIds.length === 0) return null;
    return query(
      collection(firestore, 'studyMaterials'), 
      where('type', '==', 'DPP'), 
      where('teacherId', 'in', teacherIds),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, teacherIds]);
  
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
          <CardDescription>Stay sharp with these daily exercises from your teachers.</CardDescription>
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
            {!isLoading && dailyPracticePapers?.length === 0 && <p className="text-center text-muted-foreground py-8">No practice papers available yet from your enrolled teachers.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
