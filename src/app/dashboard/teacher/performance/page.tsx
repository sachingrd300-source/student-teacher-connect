
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

type Teacher = { id: string; userId: string; subjects: string; };
type Student = { id: string; name: string; teacherId: string };
type TestResult = { 
    id: string; 
    studentId: string; 
    testName: string;
    subject: string;
    marks: number;
    maxMarks: number;
    date: any;
};

export default function PerformancePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    
    // Form state
    const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '');
    const [testName, setTestName] = useState('');
    const [subject, setSubject] = useState('');
    const [marks, setMarks] = useState<number | ''>('');
    const [maxMarks, setMaxMarks] = useState<number | ''>('');

    const teacherQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'teachers'), where('userId', '==', user.uid)) : null
    , [firestore, user]);

    const { data: teacherDocs, isLoading: isLoadingTeacher } = useCollection<Teacher>(teacherQuery);
    const teacher = teacherDocs?.[0];
    const teacherSubjects = teacher?.subjects.split(',').map(s => s.trim()) || [];
    
    const studentsQuery = useMemoFirebase(() => {
        if(!teacher) return null;
        return query(collection(firestore, 'users'), where('teacherId', '==', teacher.id), where('isApproved', '==', true));
    }, [firestore, teacher]);

    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

    const resultsQuery = useMemoFirebase(() => {
        if(!teacher || !selectedStudentId) return null;
        return query(
            collection(firestore, 'test_results'), 
            where('teacherId', '==', teacher.id),
            where('studentId', '==', selectedStudentId)
        );
    }, [firestore, teacher, selectedStudentId]);

    const { data: testResults, isLoading: isLoadingResults } = useCollection<TestResult>(resultsQuery);

    const handleAddResult = async () => {
        if (!firestore || !teacher || !selectedStudentId || !testName || !subject || marks === '' || maxMarks === '') {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return;
        }

        const resultId = uuidv4();
        const resultRef = doc(firestore, 'test_results', resultId);
        
        const resultData = {
            id: resultId,
            teacherId: teacher.id,
            studentId: selectedStudentId,
            testName,
            subject,
            marks: Number(marks),
            maxMarks: Number(maxMarks),
            date: serverTimestamp()
        };

        setDocumentNonBlocking(resultRef, resultData, { merge: false });

        toast({ title: 'Result Added', description: `Marks for ${testName} have been recorded.`});
        
        // Reset form
        setTestName('');
        setSubject('');
        setMarks('');
        setMaxMarks('');
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <BarChart3 className="h-8 w-8"/>
                        Student Performance
                    </h1>
                    <p className="text-muted-foreground">Enter and track test results for your students.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Enter Test Marks</CardTitle>
                        <CardDescription>Select a student and enter their latest test score.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="student">Student*</Label>
                            <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                                <SelectTrigger id="student"><SelectValue placeholder="Select a student" /></SelectTrigger>
                                <SelectContent>
                                    {isLoadingStudents && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                    {students?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="testName">Test Name*</Label>
                            <Input id="testName" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Unit Test 1" />
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject*</Label>
                             <Select onValueChange={setSubject} value={subject}>
                                <SelectTrigger id="subject"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                <SelectContent>
                                    {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label htmlFor="marks">Marks Obtained*</Label>
                                <Input id="marks" type="number" value={marks} onChange={e => setMarks(Number(e.target.value))} placeholder="e.g. 85" />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="maxMarks">Max Marks*</Label>
                                <Input id="maxMarks" type="number" value={maxMarks} onChange={e => setMaxMarks(Number(e.target.value))} placeholder="e.g. 100" />
                            </div>
                        </div>
                        <Button onClick={handleAddResult} className="w-full" disabled={!selectedStudentId}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Result
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Test History</CardTitle>
                        <CardDescription>Showing results for {students?.find(s => s.id === selectedStudentId)?.name || 'the selected student'}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isLoadingResults && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
                        {testResults && testResults.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Test Name</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {testResults.map((result) => (
                                        <TableRow key={result.id}>
                                            <TableCell className="font-medium">{result.testName}</TableCell>
                                            <TableCell>{result.subject}</TableCell>
                                            <TableCell className="font-semibold">{result.marks} / {result.maxMarks}</TableCell>
                                            <TableCell className="text-right">{result.date?.toDate().toLocaleDateString() || 'Just now'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : !isLoadingResults && selectedStudentId && (
                            <p className="text-sm text-center text-muted-foreground py-8">No test results found for this student.</p>
                        )}
                         {!selectedStudentId && !isLoadingResults && (
                            <p className="text-sm text-center text-muted-foreground py-8">Please select a student to view their test history.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
