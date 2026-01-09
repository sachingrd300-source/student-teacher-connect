
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
  ArrowLeft,
  Video,
  MapPin,
} from 'lucide-react';
import { teacherData, tutorsData } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { PerformanceChart } from '@/components/performance-chart';
import { cn } from '@/lib/utils';

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

  const performanceChartData = useMemo(() => 
    performance?.map(p => ({ name: p.name, score: p.score })) || []
  , [performance]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
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
                    Back to My Teachers
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Upcoming Classes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {schedule.map(item => (
                        <div key={item.id} className={cn("flex items-start justify-between p-4 border rounded-lg", item.status === 'Canceled' && 'bg-muted/50 opacity-70')}>
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center justify-center p-2 text-sm font-semibold text-center rounded-md w-16 bg-primary/10 text-primary">
                                    <span>{item.date.toLocaleDateString('en-US', { day: '2-digit' })}</span>
                                    <span>{item.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold">{item.topic}</h3>
                                    <p className="text-sm text-muted-foreground">{item.subject} • {item.time}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        {item.type === 'Online' ? <Video className="h-4 w-4"/> : <MapPin className="h-4 w-4"/>}
                                        {item.locationOrLink || 'Not specified'}
                                    </p>
                                </div>
                            </div>
                            {item.status === 'Canceled' ? (
                                <Badge variant="destructive">Canceled</Badge>
                            ) : (
                                <Badge variant="default">Scheduled</Badge>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
            <PerformanceChart data={performanceChartData} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpenCheck className="w-5 h-5"/> All Study Materials</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {studyMaterials.map((material) => (
                        <TableRow key={material.id}>
                        <TableCell className="font-medium">{materialIcons[material.type]}</TableCell>
                        <TableCell>
                            <div className="font-medium">{material.title}</div>
                            <div className="text-sm text-muted-foreground">{material.date}</div>
                        </TableCell>
                        <TableCell><Badge variant={material.isNew ? "default" : "secondary"} className={material.isNew ? "bg-accent text-accent-foreground" : ""}>{material.subject}</Badge></TableCell>
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
    </div>
  );
}
