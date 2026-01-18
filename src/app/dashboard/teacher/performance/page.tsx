'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc, Timestamp, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


type StudentEnrollment = { id: string; studentName: string; studentId: string; classId: string; status: 'pending' | 'approved' | 'denied'; };
type TestResult = { 
    id: string; 
    studentId: string;
    studentName: string;
    testName: string;
    subject: string;
    marks: number;
    maxMarks: number;
    date: Timestamp;
    classId?: string;
};
type UserProfile = {
  name: string;
  subjects?: string[];
}
type Batch = { id: string; subject: string; classLevel: string; };


export default function PerformancePage() {
    const { toast } = useToast();
    
    const { user } = useUser();
    const firestore = useFirestore();

    // Form state
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [testName, setTestName] = useState('');
    const [subject, setSubject] = useState('');
    const [marks, setMarks] = useState<number | ''>('');
    const [maxMarks, setMaxMarks] = useState<number | ''>('');
    
    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);
    const teacherSubjects = useMemo(() => userProfile?.subjects || [], [userProfile]);

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'enrollments'), 
            where('teacherId', '==', user.uid)
        );
    }, [firestore, user]);
    const { data: allEnrollments, isLoading: isLoadingEnrollments } = useCollection<StudentEnrollment>(enrollmentsQuery);

    const students = useMemo(() => {
        if (!allEnrollments || !selectedBatchId) return [];
        return allEnrollments.filter(e => e.classId === selectedBatchId && e.status === 'approved');
    }, [allEnrollments, selectedBatchId]);

     useEffect(() => {
        const selectedBatch = batches?.find(c => c.id === selectedBatchId);
        // If the selected batch's subject is one of the teacher's main subjects, pre-select it.
        // Otherwise, clear the selection, forcing the teacher to choose.
        if (selectedBatch && teacherSubjects.includes(selectedBatch.subject)) {
            setSubject(selectedBatch.subject);
        } else {
            setSubject('');
        }
        setSelectedStudentId('');
    }, [selectedBatchId, batches, teacherSubjects]);


    const performanceQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'performances'), where('teacherId', '==', user.uid), orderBy('date', 'desc'));
    }, [firestore, user]);
    const { data: testResults, isLoading: isLoadingResults } = useCollection<TestResult>(performanceQuery);


    const handleAddResult = () => {
        if (!selectedStudentId || !testName || !subject || marks === '' || maxMarks === '' || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return;
        }
        
        const student = students?.find(s => s.studentId === selectedStudentId);
        if (!student) {
            toast({ variant: 'destructive', title: 'Student not found', description: 'Could not find the selected student.' });
            return;
        }

        const newResult = {
            studentId: student.studentId,
            studentName: student.studentName,
            teacherId: user.uid,
            classId: selectedBatchId,
            testName,
            subject,
            marks: Number(marks),
            maxMarks: Number(maxMarks),
            date: serverTimestamp(),
        };
        
        const performancesCollection = collection(firestore, 'performances');
        addDoc(performancesCollection, newResult)
            .then(() => {
                toast({ title: 'Result Added', description: `Marks for ${testName} have been recorded.`});
                // Reset form but keep batch and subject
                setSelectedStudentId('');
                setTestName('');
                setMarks('');
                setMaxMarks('');
            })
            .catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: performancesCollection.path,
                        operation: 'create',
                        requestResourceData: newResult,
                    })
                );
            });
    }
    
    const displayedResults = useMemo(() => {
        if (!testResults) return [];
        if (!selectedBatchId) return testResults;
        if (!selectedStudentId) return testResults.filter(r => r.classId === selectedBatchId);
        const student = students?.find(s => s.studentId === selectedStudentId);
        return testResults.filter(r => r.studentId === student?.studentId && r.classId === selectedBatchId);
    }, [testResults, selectedStudentId, selectedBatchId, students]);

    const isLoading = isLoadingBatches || isLoadingResults || isLoadingEnrollments || isLoadingProfile;

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
                <Card className="lg:col-span-1 shadow-soft-shadow">
                    <CardHeader>
                        <CardTitle>Enter Test Marks</CardTitle>
                        <CardDescription>Select a batch and student to enter their score.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="batch">Batch*</Label>
                            <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
                                <SelectTrigger id="batch"><SelectValue placeholder="Select a batch" /></SelectTrigger>
                                <SelectContent>
                                    {isLoadingBatches && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                    {batches?.map(c => <SelectItem key={c.id} value={c.id}>{c.subject} - {c.classLevel}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="student">Student*</Label>
                            <Select onValueChange={setSelectedStudentId} value={selectedStudentId} disabled={!selectedBatchId || isLoadingEnrollments}>
                                <SelectTrigger id="student"><SelectValue placeholder="Select a student" /></SelectTrigger>
                                <SelectContent>
                                    {isLoadingEnrollments && <SelectItem value="loading" disabled>Loading students...</SelectItem>}
                                    {students?.map(s => <SelectItem key={s.id} value={s.studentId}>{s.studentName}</SelectItem>)}
                                     {!isLoadingEnrollments && students?.length === 0 && selectedBatchId && <SelectItem value="no-students" disabled>No approved students in this batch.</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="testName">Test Name*</Label>
                            <Input id="testName" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Unit Test 1" />
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject*</Label>
                            <Select onValueChange={setSubject} value={subject} disabled={!selectedBatchId}>
                                <SelectTrigger id="subject">
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    {teacherSubjects.length === 0 && !isLoadingProfile && <SelectItem value="no-subjects" disabled>No subjects in profile</SelectItem>}
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
                 <Card className="lg:col-span-2 shadow-soft-shadow">
                    <CardHeader>
                        <CardTitle>Test History</CardTitle>
                        <CardDescription>Showing results for {students?.find(s => s.studentId === selectedStudentId)?.studentName || batches?.find(c => c.id === selectedBatchId)?.subject || 'all students'}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isLoadingResults && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
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
                                            <TableCell className="text-right">{result.date?.toDate().toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : !isLoadingResults && (
                            <p className="text-sm text-center text-muted-foreground py-8">No test results found for the selected filter.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
