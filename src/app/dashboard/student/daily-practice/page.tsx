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
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';


type StudyMaterial = {
    id: string;
    title: string;
    subject: string;
    type: string;
    teacherId: string;
    teacherName?: string;
    isOfficial?: boolean;
    fileUrl: string;
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
                <Button asChild variant="outline" size="sm">
                  <Link href={paper.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
            </TableCell>
          </TableRow>
    )
}

export default function DailyPracticePage() {
  const firestore = useFirestore();
  const { user, isLoading: isUserLoading } = useUser();

  const practiceMaterialsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query for all public DPPs and Homework, ensuring they are not assigned to a specific class
    return query(
      collection(firestore, 'studyMaterials'),
      where('isFree', '==', true),
      where('type', 'in', ['DPP', 'Homework']),
      where('classId', '==', null),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: practiceMaterials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(practiceMaterialsQuery);

  const isLoading = isUserLoading || isLoadingMaterials;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <ClipboardList className="w-8 h-8"/>
        Daily Practice & Homework
      </h1>

      <Card className="shadow-soft-shadow">
        <CardHeader>
          <CardTitle>Practice Materials</CardTitle>
          <CardDescription>Stay sharp with these daily exercises and homework assignments from our tutors.</CardDescription>
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
                {!isLoading && practiceMaterials?.map((paper) => (
                    <MaterialRow key={paper.id} paper={paper} />
                ))}
              </TableBody>
            </Table>
            {!isLoading && practiceMaterials?.length === 0 && <p className="text-center text-muted-foreground py-8">No practice materials available yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
