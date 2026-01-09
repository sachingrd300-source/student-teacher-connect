
'use client';

import { useMemo, useEffect, useState } from 'react';
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
  CalendarDays,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { teacherData, tutorsData } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};


export default function TeacherUpdatesPage() {
  const params = useParams();
  const teacherId = params.teacherId as string;

  const [teacher, setTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data for this specific teacher
    setTimeout(() => {
      const foundTeacher = tutorsData.find(t => t.id === teacherId);
      if (foundTeacher) {
        setTeacher(foundTeacher);
      }
      setIsLoading(false);
    }, 500);
  }, [teacherId]);

  const studyMaterials = teacherData.studyMaterials;
  const schedule = teacherData.schedule;
  const performance = teacherData.performance;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return notFound();
  }

  return (
    <div className="space-y-6">
        <div>
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/dashboard/student">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Teachers
                </Link>
            </Button>
            <div className="flex items-center gap-4">
                 <Avatar className="h-20 w-20 border">
                    <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                    <AvatarFallback className="text-2xl">{teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm text-muted-foreground">Viewing updates from</p>
                    <h1 className="text-3xl font-bold font-headline">{teacher.name}</h1>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookOpenCheck className="w-5 h-5"/> Latest Materials</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {studyMaterials.slice(0,3).map((material) => (
                            <TableRow key={material.id}>
                                <TableCell>
                                    <div className="font-medium">{material.title}</div>
                                    <div className="text-sm text-muted-foreground">{material.type}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                    <Download className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Upcoming Classes</CardTitle>
                </CardHeader>
                <CardContent>
                    {schedule.slice(0,3).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                            <div>
                                <h3 className="font-semibold">{item.topic}</h3>
                                <p className="text-sm text-muted-foreground">{item.subject} &bull; {new Date(item.date).toLocaleDateString()}</p>
                            </div>
                            <Badge>{item.time}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Recent Scores</CardTitle>
                </CardHeader>
                 <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Test</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {performance.slice(0,3).map((p) => (
                            <TableRow key={p.name}>
                                <TableCell className="font-medium">{p.name}</TableCell>
                                <TableCell className="text-right font-semibold">{p.score}/100</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
