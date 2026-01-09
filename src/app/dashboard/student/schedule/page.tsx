'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CalendarDays, Video, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

type ScheduleItem = {
    id: string;
    topic: string;
    subject: string;
    date: { toDate: () => Date };
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
    status: 'Scheduled' | 'Canceled';
    teacherId: string;
};

export default function StudentSchedulePage() {
    const { user } = useUser();
    const firestore = useFirestore();

    // In a multi-teacher setup, we would need to know which teacher's schedule to fetch,
    // or fetch from all connected teachers. For now, we'll fetch all.
    const scheduleQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // This is a simplified query. A real app would query based on student's enrollments.
        return query(collection(firestore, 'classSchedules'), orderBy('date', 'asc'));
    }, [firestore]);

    const { data: schedule, isLoading } = useCollection<ScheduleItem>(scheduleQuery);
    
    const sortedSchedule = useMemo(() => {
        return schedule?.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
    }, [schedule]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <CalendarDays className="h-8 w-8"/>
                        My Schedule
                    </h1>
                    <p className="text-muted-foreground">Your upcoming classes from your teacher.</p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Classes</CardTitle>
                    <CardDescription>Here is your schedule for the upcoming days.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading && (
                        <div className="space-y-4">
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                        </div>
                     )}
                     {sortedSchedule && sortedSchedule.length > 0 ? (
                        sortedSchedule.map(item => (
                            <div key={item.id} className={cn("flex items-center justify-between p-4 border rounded-lg", item.status === 'Canceled' && 'bg-muted/50 opacity-70')}>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center p-3 text-sm font-semibold text-center rounded-md w-20 bg-primary/10 text-primary">
                                        <span>{item.date.toDate().toLocaleDateString('en-US', { day: '2-digit' })}</span>
                                        <span>{item.date.toDate().toLocaleDateString('en-US', { month: 'short' })}</span>
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
                                {item.status === 'Canceled' ? (
                                    <Badge variant="destructive">Canceled</Badge>
                                ) : (
                                    <Badge variant="default">Scheduled</Badge>
                                )}
                            </div>
                        ))
                     ) : !isLoading && (
                        <p className="text-sm text-center text-muted-foreground py-8">Your teacher hasn't scheduled any classes yet.</p>
                     )}
                </CardContent>
            </Card>

        </div>
    );
}
