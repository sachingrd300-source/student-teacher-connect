
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PerformanceChart } from '@/components/performance-chart';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  XCircle,
  Download,
  BookOpen,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  Video,
  MapPin,
  ShoppingCart,
  BookCopy,
} from 'lucide-react';
import { studentData, teacherData, shopItemsData } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { ConnectTeacherForm } from '@/components/connect-teacher-form';
import Image from 'next/image';

const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

type Schedule = {
    id: string;
    topic: string;
    subject: string;
    date: Date;
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
};


export default function StudentDashboardPage() {
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate checking connection status and fetching data
    setTimeout(() => {
        if (isConnected) {
            const scheduleData = Object.entries(teacherData.schedule).map(([date, item], index) => ({
                id: `sch-${index}`,
                topic: item.topic,
                subject: 'Mathematics', // Assuming a default for demo
                date: new Date(date),
                time: '10:00 AM', // Assuming a default for demo
                type: (item.topic === 'Holiday' ? 'Offline' : 'Online') as 'Online' | 'Offline',
                locationOrLink: item.topic === 'Holiday' ? 'N/A' : 'https://meet.google.com/xyz-abc-pqr'
            }));
          setSchedule(scheduleData);
        }
      setIsLoading(false);
    }, 1000);
  }, [isConnected]);

  const handleConnectionSuccess = () => {
    setIsConnected(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">
            <Skeleton className="h-9 w-64" />
        </h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!isConnected) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
            <ConnectTeacherForm onConnectionSuccess={handleConnectionSuccess} />
        </div>
    );
  }

  const dailyPracticePapers = studentData.studyMaterials.filter(m => m.type === 'DPP');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Welcome back, {studentData.name}!</h1>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <CalendarCheck2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.stats.attendance}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New DPPs</CardTitle>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{studentData.stats.newDpps}</div>
            <p className="text-xs text-muted-foreground">Ready for practice</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Pencil className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials"><BookOpen className="w-4 h-4 mr-2" />Study Materials</TabsTrigger>
          <TabsTrigger value="practice"><ClipboardList className="w-4 h-4 mr-2" />Daily Practice</TabsTrigger>
          <TabsTrigger value="shop"><ShoppingCart className="w-4 h-4 mr-2" />Shop</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="w-4 h-4 mr-2" />Performance</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck2 className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
          <TabsTrigger value="schedule"><CalendarDays className="w-4 h-4 mr-2" />Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>All Study Materials</CardTitle>
              <CardDescription>Browse and download notes, DPPs, tests, and more from your teacher.</CardDescription>
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
                    {studentData.studyMaterials.map((material) => (
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
        </TabsContent>

        <TabsContent value="practice">
          <Card>
            <CardHeader>
              <CardTitle>Daily Practice Papers (DPPs)</CardTitle>
              <CardDescription>Stay sharp with these daily exercises from your teacher.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyPracticePapers.map((paper) => (
                      <TableRow key={paper.id}>
                        <TableCell>
                          <div className="font-medium">{paper.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{paper.subject}</Badge>
                        </TableCell>
                        <TableCell>{paper.date}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {dailyPracticePapers.length === 0 && <p className="text-center text-muted-foreground py-8">No practice papers available yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop">
          <Card>
            <CardHeader>
              <CardTitle>EduConnect Shop</CardTitle>
              <CardDescription>Browse recommended books, courses, and other educational materials.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {shopItemsData.map((item) => (
                <Card key={item.id} className="overflow-hidden flex flex-col">
                  <div className="relative h-48 w-full">
                    <Image src={item.imageUrl} alt={item.title} fill objectFit="cover" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-1"><BookCopy className="h-4 w-4" />{item.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-lg font-bold">{item.price}</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
           <PerformanceChart data={studentData.performance} />
        </TabsContent>
        <TabsContent value="attendance">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Your attendance for the last few classes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentData.attendanceRecords.map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={record.status === 'Present' ? 'default' : 'destructive'} className="bg-opacity-80">
                            {record.status === 'Present' ? <CheckCircle className="h-4 w-4 mr-2"/> : <XCircle className="h-4 w-4 mr-2"/>}
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule">
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Classes</CardTitle>
                    <CardDescription>Here is your schedule for the upcoming days from your teacher.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {schedule && schedule.length > 0 ? (
                        schedule.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center p-3 text-sm font-semibold text-center rounded-md w-20 bg-primary/10 text-primary">
                                        <span>{item.date.toLocaleDateString('en-US', { day: '2-digit' })}</span>
                                        <span>{item.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{item.topic}</h3>
                                        <p className="text-sm text-muted-foreground">{item.subject} • {item.time}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            {item.type === 'Online' ? <Video className="h-4 w-4"/> : <MapPin className="h-4 w-4"/>}
                                            {item.locationOrLink || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                     ) : (
                        <p className="text-sm text-center text-muted-foreground py-8">Your teacher hasn't scheduled any classes yet.</p>
                     )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    