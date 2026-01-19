
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDays, Clock, MapPin, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type Enrollment = { id: string; classId: string; status: 'approved' | 'pending' | 'denied'; };
type Schedule = {
    id: string;
    topic: string;
    subject: string;
    date: Timestamp;
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
    classId: string;
    teacherName?: string; // Assume denormalized
};
type ClassInfo = { id: string; title: string; };

export default function MySchedulePage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('status', '==', 'approved'));
    }, [firestore, user]);

    const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

    useEffect(() => {
        if (isLoadingEnrollments) {
            setIsLoading(true);
            return;
        }
        if (!enrollments || !firestore) {
            setIsLoading(false);
            return;
        }

        const fetchSchedules = async () => {
            setIsLoading(true);
            if (enrollments.length === 0) {
                setSchedules([]);
                setIsLoading(false);
                return;
            }

            const classIds = enrollments.map(e => e.classId);
            const allSchedules: Schedule[] = [];

            // Firestore 'in' query is limited to 30 values.
            // For larger numbers of enrollments, we'd need to batch this.
            // We fetch one by one to stay within security rule constraints.
            const promises = classIds.map(classId => {
                const schedulesQuery = query(
                    collection(firestore, 'classSchedules'), 
                    where('classId', '==', classId),
                    where('date', '>=', new Date()),
                    orderBy('date', 'asc')
                );
                return getDocs(schedulesQuery);
            });
            
            try {
                const snapshots = await Promise.all(promises);
                const fetchedSchedules = snapshots.flatMap(snapshot => 
                    snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule))
                );
                fetchedSchedules.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
                setSchedules(fetchedSchedules);
            } catch (e) {
                console.error("Error fetching schedules:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchedules();

    }, [enrollments, isLoadingEnrollments, firestore]);
    
    const groupedSchedules = useMemo(() => {
        return schedules.reduce((acc, schedule) => {
            const dateStr = format(schedule.date.toDate(), 'PPPP'); // e.g., "Saturday, June 8th, 2024"
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(schedule);
            return acc;
        }, {} as Record<string, Schedule[]>);
    }, [schedules]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <CalendarDays className="h-8 w-8"/>
                    My Schedule
                </h1>
                <p className="text-muted-foreground">Your upcoming classes at a glance.</p>
            </div>
            
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            )}

            {!isLoading && schedules.length === 0 && (
                <Card className="text-center py-16">
                     <CardHeader>
                        <CardTitle>No Upcoming Classes</CardTitle>
                        <CardDescription>Your schedule is clear. Check back later!</CardDescription>
                     </CardHeader>
                </Card>
            )}
            
            {!isLoading && Object.keys(groupedSchedules).length > 0 && Object.keys(groupedSchedules).map(dateStr => (
                <div key={dateStr}>
                    <h2 className="font-semibold text-lg mb-2">{dateStr}</h2>
                    <div className="space-y-4">
                        {groupedSchedules[dateStr].map(schedule => (
                             <Card key={schedule.id} className="shadow-soft-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{schedule.topic}</CardTitle>
                                            <CardDescription>Subject: {schedule.subject}</CardDescription>
                                        </div>
                                        <Badge variant="secondary">{schedule.time}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        {schedule.type === 'Online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                        <span className="truncate">{schedule.locationOrLink}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
