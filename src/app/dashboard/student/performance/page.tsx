'use client';

import { useMemo } from 'react';
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
import { BarChart3 } from 'lucide-react';
import { PerformanceChart } from '@/components/performance-chart';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type TestResult = { id: string; date: { toDate: () => Date }; marks: number; maxMarks: number; subject: string, testName: string };

export default function PerformancePage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const performanceQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'performances'), where('studentId', '==', user.uid), orderBy('date', 'desc'));
    }, [firestore, user]);

    const { data: testResults, isLoading } = useCollection<TestResult>(performanceQuery);
    
    const performanceChartData = useMemo(() => 
        testResults?.map(p => ({ name: p.testName, score: p.marks })) || []
    , [testResults]);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <BarChart3 className="w-8 h-8"/>
                Performance
            </h1>
            <p className="text-muted-foreground">Your test results and progress.</p>
            </div>
        </div>

        {isLoading ? <Skeleton className="h-[350px] w-full" /> : <PerformanceChart data={performanceChartData} />}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Test Result History</CardTitle>
            <CardDescription>A log of all your test scores from your teacher.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && Array.from({length: 4}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={3}><Skeleton className="h-10 w-full"/></TableCell>
                        </TableRow>
                    ))}
                    {testResults?.map((result) => (
                        <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.testName}</TableCell>
                            <TableCell>{result.subject}</TableCell>
                            <TableCell className="text-right font-semibold">{result.marks} / {result.maxMarks}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {!isLoading && testResults?.length === 0 && <p className="text-center text-muted-foreground py-4">No test results found.</p>}
          </CardContent>
        </Card>
    </div>
  );
}
