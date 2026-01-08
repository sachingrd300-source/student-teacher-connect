
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { teacherData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { CalendarDays, Video, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ScheduleItem = {
    id: string;
    topic: string;
    subject: string;
    date: Date;
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
    status: 'Scheduled' | 'Canceled';
};

export default function StudentSchedulePage() {
    // Data state
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // In a real app, you would fetch this data after connecting to a teacher.
        // Here, we simulate it using the teacherData object.
        setTimeout(() => {
            const scheduleData = [...teacherData.schedule].sort((a,b) => a.date.getTime() - b.date.getTime());
            setSchedule(scheduleData);
            setIsLoading(false);
        }, 500);
    }, []);

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
                     {schedule && schedule.length > 0 ? (
                        schedule.map(item => (
                            <div key={item.id} className={cn("flex items-center justify-between p-4 border rounded-lg", item.status === 'Canceled' && 'bg-muted/50 opacity-70')}>
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
