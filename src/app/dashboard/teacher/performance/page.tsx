
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
import { useSearchParams } from 'next/navigation';
import { teacherData } from '@/lib/data';

type Student = { id: string; name: string; };
type TestResult = { 
    id: string; 
    studentId: string; 
    testName: string;
    subject: string;
    marks: number;
    maxMarks: number;
    date: Date;
};

export default function PerformancePage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    
    // Form state
    const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '');
    const [testName, setTestName] = useState('');
    const [subject, setSubject] = useState('');
    const [marks, setMarks] = useState<number | ''>('');
    const [maxMarks, setMaxMarks] = useState<number | ''>('');

    // Data state
    const [students, setStudents] = useState<Student[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const teacherSubjects = teacherData.subjects;

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            setStudents(teacherData.enrolledStudents);
            setIsLoading(false);
        }, 500);
    }, []);

    const handleAddResult = async () => {
        if (!selectedStudentId || !testName || !subject || marks === '' || maxMarks === '') {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return;
        }

        const newResult: TestResult = {
            id: `res-${Date.now()}`,
            studentId: selectedStudentId,
            testName,
            subject,
            marks: Number(marks),
            maxMarks: Number(maxMarks),
            date: new Date(),
        };

        setTestResults(prev => [newResult, ...prev]);

        toast({ title: 'Result Added', description: `Marks for ${testName} have been recorded.`});
        
        // Reset form
        setTestName('');
        setSubject('');
        setMarks('');
        setMaxMarks('');
    }
    
    const displayedResults = useMemo(() => {
        return testResults.filter(r => r.studentId === selectedStudentId);
    }, [testResults, selectedStudentId]);

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
                                    {isLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
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
                    {isLoading && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
                        {displayedResults.length > 0 ? (
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
                                    {displayedResults.map((result) => (
                                        <TableRow key={result.id}>
                                            <TableCell className="font-medium">{result.testName}</TableCell>
                                            <TableCell>{result.subject}</TableCell>
                                            <TableCell className="font-semibold">{result.marks} / {result.maxMarks}</TableCell>
                                            <TableCell className="text-right">{result.date.toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : !isLoading && selectedStudentId && (
                            <p className="text-sm text-center text-muted-foreground py-8">No test results found for this student.</p>
                        )}
                         {!selectedStudentId && !isLoading && (
                            <p className="text-sm text-center text-muted-foreground py-8">Please select a student to view their test history.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
