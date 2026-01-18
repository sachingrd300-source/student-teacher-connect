
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
import { BarChart3, BookCopy, Filter } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type PerformanceRecord = {
  id: string;
  studentId: string;
  testName: string;
  subject: string;
  marks: number;
  maxMarks: number;
  date: Timestamp;
};

const chartConfig = {
  percentage: {
    label: 'Percentage',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const getPerformanceEmoji = (percentage: number): string => {
    if (percentage >= 80) return '😄';
    if (percentage >= 60) return '😐';
    return '😟';
}

export default function StudentPerformancePage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const [subjectFilter, setSubjectFilter] = useState('all');

  const performanceQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(
      collection(firestore, 'performances'),
      where('studentId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [firestore, user, isUserLoading]);

  const { data: performanceData, isLoading: isLoadingPerformances } = useCollection<PerformanceRecord>(performanceQuery);

  const isLoading = isUserLoading || isLoadingPerformances;

  const subjects = useMemo(() => {
    if (!performanceData) return [];
    return [...new Set(performanceData.map(p => p.subject))];
  }, [performanceData]);

  const filteredData = useMemo(() => {
    if (!performanceData) return [];
    if (subjectFilter === 'all') return performanceData;
    return performanceData.filter(p => p.subject === subjectFilter);
  }, [performanceData, subjectFilter]);
  
  const chartData = useMemo(() => {
    if (!filteredData) return [];
    return filteredData.map(p => ({
        name: p.testName,
        percentage: (p.marks / p.maxMarks) * 100,
    })).reverse(); // Reverse for chronological order in chart
  }, [filteredData]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Keep Up the Great Work!
        </h1>
        <p className="text-muted-foreground">
          Track your academic progress and view your test results.
        </p>
      </div>

      <Card className="shadow-soft-shadow">
        <CardHeader>
          <CardTitle>Performance Overview 🎉</CardTitle>
          <CardDescription>
            Your test scores over time. {subjectFilter !== 'all' && `Showing results for ${subjectFilter}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <Skeleton className="h-[350px] w-full" />}
            {!isLoading && chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis unit="%" />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="percentage" fill="var(--color-percentage)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            ) : !isLoading && (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    No performance data available to display a chart.
                </div>
            )}
        </CardContent>
      </Card>


      <Card className="shadow-soft-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detailed Test History</CardTitle>
              <CardDescription>A complete record of all your test scores.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && filteredData.map((result) => {
                const percentage = (result.marks / result.maxMarks) * 100;
                return (
                    <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.testName}</TableCell>
                        <TableCell>{result.subject}</TableCell>
                        <TableCell className="font-semibold">{result.marks} / {result.maxMarks}</TableCell>
                        <TableCell>
                            <span className="mr-2">{percentage.toFixed(1)}%</span>
                            <span>{getPerformanceEmoji(percentage)}</span>
                        </TableCell>
                        <TableCell className="text-right">{result.date?.toDate().toLocaleDateString()}</TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {!isLoading && filteredData.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <BookCopy className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Results Found</h3>
              <p>Your teacher has not entered any test scores yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
