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
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  Download,
  BookOpenCheck,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';


const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  "Question Bank": <FileText className="h-5 w-5 text-indigo-500" />,
  "Homework": <Pencil className="h-5 w-5 text-yellow-500" />,
  "Test Paper": <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

type StudyMaterial = {
    id: string;
    title: string;
    subject: string;
    type: string;
    createdAt: { toDate: () => Date };
    isFree: boolean;
    teacherId: string;
}

type Enrollment = {
  teacherId: string;
}

export default function StudyMaterialPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('status', '==', 'approved'));
  }, [firestore, user]);

  const { data: enrollments } = useCollection<Enrollment>(enrollmentsQuery);

  // IMPORTANT: We can only query for one teacher at a time to satisfy security rules.
  // We'll pick the first enrolled teacher for this page.
  const firstTeacherId = useMemo(() => enrollments?.[0]?.teacherId, [enrollments]);

  const materialsQuery = useMemoFirebase(() => {
    if(!firestore || !firstTeacherId) return null;
    return query(collection(firestore, 'studyMaterials'), where('teacherId', '==', firstTeacherId), orderBy('createdAt', 'desc'));
  }, [firestore, firstTeacherId]);

  const { data: studyMaterials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(materialsQuery);
  
  const freeMaterialsQuery = useMemoFirebase(() => {
    if(!firestore) return null;
    return query(collection(firestore, 'studyMaterials'), where('isFree', '==', true), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: freeStudyMaterials, isLoading: isLoadingFree } = useCollection<StudyMaterial>(freeMaterialsQuery);
  
  const allMaterials = useMemo(() => {
    const combined = [...(studyMaterials || []), ...(freeStudyMaterials || [])];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique.sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  }, [studyMaterials, freeStudyMaterials])

  const isLoading = isLoadingMaterials || isLoadingFree;

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <BookOpenCheck className="w-8 h-8"/>
            Study Materials
        </h1>
        <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>All Study Materials</CardTitle>
            <CardDescription>Browse materials from your teachers and public resources.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                ))}
                {allMaterials.map((material) => (
                    <TableRow key={material.id}>
                    <TableCell className="font-medium">{materialIcons[material.type] || <FileText className="h-5 w-5 text-gray-500" />}</TableCell>
                    <TableCell>
                        <div className="font-medium">{material.title}</div>
                        <div className="text-sm text-muted-foreground">{material.createdAt.toDate().toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell><Badge variant={"outline"}>{material.subject}</Badge></TableCell>
                    <TableCell><Badge variant={material.isFree ? "default" : "secondary"}>{material.isFree ? 'Public' : 'Private'}</Badge></TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {!isLoading && allMaterials.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No study materials found.</p>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
