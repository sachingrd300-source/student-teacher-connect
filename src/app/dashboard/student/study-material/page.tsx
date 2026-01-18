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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  BookOpenCheck,
  Book,
  Calculator,
} from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  Books: <Book className="h-5 w-5 text-amber-500" />,
  PYQs: <ClipboardList className="h-5 w-5 text-indigo-500" />,
  Formulas: <Calculator className="h-5 w-5 text-purple-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Homework: <Pencil className="h-5 w-5 text-yellow-500" />,
  "Test Paper": <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

type StudyMaterial = {
    id: string;
    title: string;
    subject: string;
    type: string;
    classLevel?: string;
    createdAt: { toDate: () => Date };
    isFree: boolean;
    isOfficial?: boolean;
    teacherId: string;
    teacherName?: string;
}

const classLevelOptions = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate", "Postgraduate"];
const materialTypes = ["Notes", "Books", "PYQs", "Formulas", "DPP", "Homework", "Test Paper", "Solution"];

export default function StudyMaterialPage() {
  const firestore = useFirestore();
  const { user, isLoading: isUserLoading } = useUser();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const freeMaterialsQuery = useMemo(() => {
    if(!firestore || isUserLoading || !user) return null;
    return query(
        collection(firestore, 'studyMaterials'), 
        where('isFree', '==', true), 
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user, isUserLoading]);

  const { data: studyMaterials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(freeMaterialsQuery);
  const isLoading = isUserLoading || isLoadingMaterials;
  
  const subjects = useMemo(() => {
    if (!studyMaterials) return [];
    return [...new Set(studyMaterials.map(m => m.subject))];
  }, [studyMaterials]);

  const filteredMaterials = useMemo(() => {
    if (!studyMaterials) return [];
    return studyMaterials.filter(material => {
        const classMatch = selectedClass === 'all' || material.classLevel === selectedClass;
        const subjectMatch = selectedSubject === 'all' || material.subject === selectedSubject;
        const typeMatch = selectedType === 'all' || material.type === selectedType;
        return classMatch && subjectMatch && typeMatch;
    });
  }, [studyMaterials, selectedClass, selectedSubject, selectedType]);

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <BookOpenCheck className="w-8 h-8"/>
            Study Materials
        </h1>
        <Card className="shadow-soft-shadow">
        <CardHeader>
            <CardTitle>All Public Study Materials</CardTitle>
            <CardDescription>Browse materials from all our tutors and official content. Use the filters to find what you need.</CardDescription>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                 <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classLevelOptions.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(subject => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {materialTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Source</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && filteredMaterials.map((material) => (
                    <TableRow key={material.id}>
                    <TableCell className="font-medium">{materialIcons[material.type] || <FileText className="h-5 w-5 text-gray-500" />}</TableCell>
                    <TableCell>
                        <div className="font-medium">{material.title}</div>
                        <div className="text-sm text-muted-foreground">{material.createdAt.toDate().toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell><Badge variant={"outline"}>{material.subject}</Badge></TableCell>
                    <TableCell>
                        {material.isOfficial 
                            ? <Badge>Official</Badge>
                            : <span className="text-sm text-muted-foreground">{material.teacherName || 'Tutor'}</span>
                        }
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {!isLoading && filteredMaterials?.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                    No study materials found for the selected filters.
                </p>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
