
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Video, MapPin, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, Timestamp, getDocs } from 'firebase/firestore';


type ScheduleItem = {
    id: string;
    topic: string;
    subject: string;
    date: Timestamp;
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
    status: 'Scheduled' | 'Canceled';
    teacherId: string;
    classId?: string;
};

type Enrollment = {
    classId: string;
    teacherId: string;
};

export default function StudentSchedulePage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'enrollments'),
            where('studentId', '==', user.uid),
            where('status', '==', 'approved')
        );
    }, [firestore, user]);

    const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

    useEffect(() => {
        const fetchSchedules = async () => {
            if (!enrollments || enrollments.length === 0 || !firestore) {
                setSchedules([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            const teacherIds = [...new Set(enrollments.map(e => e.teacherId))];
            if (teacherIds.length === 0) {
                 setSchedules([]);
                 setIsLoading(false);
                 return;
            }
            
            try {
                // Query schedules from all teachers the student is enrolled with
                const scheduleQuery = query(
                    collection(firestore, 'classSchedules'),
                    where('teacherId', 'in', teacherIds),
                    where('status', '==', 'Scheduled'),
                    orderBy('date', 'asc')
                );

                const querySnapshot = await getDocs(scheduleQuery);
                const fetchedSchedules = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id } as ScheduleItem));
                
                // Further filter schedules to only those for classes the student is enrolled in
                const enrolledClassIds = new Set(enrollments.map(e => e.classId));
                const studentSchedules = fetchedSchedules.filter(schedule => 
                    schedule.classId && enrolledClassIds.has(schedule.classId)
                );
                
                setSchedules(studentSchedules);
            } catch (error) {
                console.error("Error fetching schedules:", error);
                toast({ variant: "destructive", title: "Failed to load schedule" });
            } finally {
                setIsLoading(false);
            }
        };

        if (!isLoadingEnrollments) {
            fetchSchedules();
        }

    }, [enrollments, isLoadingEnrollments, firestore, toast]);

    const finalIsLoading = isLoading || isLoadingEnrollments;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <CalendarDays className="h-8 w-8"/>
                        My Schedule
                    </h1>
                    <p className="text-muted-foreground">Your upcoming classes and events.</p>
                </div>
            </div>
            
            <Card className="shadow-soft-shadow">
                <CardHeader>
                    <CardTitle>Upcoming Classes</CardTitle>
                    <CardDescription>Here is your schedule for the upcoming days from all your teachers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {finalIsLoading && (
                        <div className="space-y-4">
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                        </div>
                     )}
                     {schedules && schedules.length > 0 ? (
                        schedules.map(item => (
                            <div key={item.id} className={cn("flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors")}>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center p-3 text-sm font-semibold text-center rounded-md w-20 bg-primary/10 text-primary">
                                        <span>{item.date.toDate().toLocaleDateString('en-US', { day: '2-digit' })}</span>
                                        <span>{item.date.toDate().toLocaleDateString('en-US', { month: 'short' })}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{item.topic}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{item.subject} • {item.time}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            {item.type === 'Online' ? <Video className="h-4 w-4"/> : <MapPin className="h-4 w-4"/>}
                                            {item.locationOrLink || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                     ) : !finalIsLoading && (
                        <p className="text-sm text-center text-muted-foreground py-8">You have no upcoming classes scheduled.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
