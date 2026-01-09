
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


type StudentEnrollment = { id: string; studentName: string; studentId: string; };
type TestResult = { 
    id: string; 
    studentId: string;
    studentName: string;
    testName: string;
    subject: string;
    marks: number;
    maxMarks: number;
    date: { toDate: () => Date };
};
type UserProfile = {
  subjects?: string[];
}

export default function PerformancePage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    
    const { user } = useUser();
    const firestore = useFirestore();

    // Form state
    const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '');
    const [testName, setTestName] = useState('');
    const [subject, setSubject] = useState('');
    const [marks, setMarks] = useState<number | ''>('');
    const [maxMarks, setMaxMarks] = useState<number | ''>('');
    
    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileQuery);
    const teacherSubjects = useMemo(() => userProfile?.subjects || [], [userProfile]);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid), where('status', '==', 'approved'));
    }, [firestore, user]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<StudentEnrollment>(studentsQuery);

    const performanceQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'performances'), where('teacherId', '==', user.uid), orderBy('date', 'desc'));
    }, [firestore, user]);
    const { data: testResults, isLoading: isLoadingResults } = useCollection<TestResult>(performanceQuery);


    const handleAddResult = async () => {
        if (!selectedStudentId || !testName || !subject || marks === '' || maxMarks === '' || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return;
        }
        
        const student = students?.find(s => s.studentId === selectedStudentId);

        const newResult = {
            studentId: selectedStudentId,
            studentName: student?.studentName,
            teacherId: user.uid,
            testName,
            subject,
            marks: Number(marks),
            maxMarks: Number(maxMarks),
            date: serverTimestamp(),
        };
        
        const performanceCollection = collection(firestore, 'performances');
        addDocumentNonBlocking(performanceCollection, newResult);

        toast({ title: 'Result Added', description: `Marks for ${testName} have been recorded.`});
        
        // Reset form
        setTestName('');
        setSubject('');
        setMarks('');
        setMaxMarks('');
    }
    
    const displayedResults = useMemo(() => {
        if (!selectedStudentId) return testResults;
        return testResults?.filter(r => r.studentId === selectedStudentId);
    }, [testResults, selectedStudentId]);

    const isLoading = isLoadingStudents || isLoadingResults;

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
                                    {students?.map(s => <SelectItem key={s.id} value={s.studentId}>{s.studentName}</SelectItem>)}
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
                        <Button onClick={handleAddResult} className="w-full" disabled={!selectedStudentId || isLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Result
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Test History</CardTitle>
                        <CardDescription>Showing results for {students?.find(s => s.studentId === selectedStudentId)?.studentName || 'all students'}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isLoading && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
                        {displayedResults && displayedResults.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Test Name</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedResults.map((result) => (
                                        <TableRow key={result.id}>
                                            <TableCell className="font-medium">{result.studentName}</TableCell>
                                            <TableCell className="font-medium">{result.testName}</TableCell>
                                            <TableCell className="font-semibold">{result.marks} / {result.maxMarks}</TableCell>
                                            <TableCell className="text-right">{result.date.toDate().toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : !isLoading && (
                            <p className="text-sm text-center text-muted-foreground py-8">No test results found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

