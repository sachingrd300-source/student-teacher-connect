
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
import { teacherData } from '@/lib/data'; // Using teacher data now
import { BarChart3 } from 'lucide-react';
import { PerformanceChart } from '@/components/performance-chart';

type TestResult = { id: string; date: Date; marks: number; maxMarks: number; subject: string, testName: string };

export default function PerformancePage() {

    // Data is now sourced from the teacher's data, simulating a connected state
    const testResults: TestResult[] = teacherData.performance.map((p, i) => ({
        id: `test-${i}`,
        date: new Date(new Date().setDate(new Date().getDate() - (i*7))),
        marks: p.score,
        maxMarks: 100,
        subject: 'Mathematics',
        testName: p.name,
    }));
    
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

        <PerformanceChart data={performanceChartData} />

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
                    {testResults?.map((result) => (
                        <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.testName}</TableCell>
                            <TableCell>{result.subject}</TableCell>
                            <TableCell className="text-right font-semibold">{result.marks} / {result.maxMarks}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {testResults.length === 0 && <p className="text-center text-muted-foreground py-4">No test results found.</p>}
          </CardContent>
        </Card>
    </div>
  );
}
