
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, CalendarDays, Video, MapPin, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { teacherData } from '@/lib/data';

type ScheduleItem = {
    id: string;
    topic: string;
    subject: string;
    date: Date;
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
};

export default function SchedulePage() {
    const { toast } = useToast();
    const [isAddClassOpen, setAddClassOpen] = useState(false);
    
    // Form state
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('');
    const [classType, setClassType] = useState<'Online' | 'Offline' | ''>('');
    const [locationOrLink, setLocationOrLink] = useState('');

    // Data state
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const teacherSubjects = teacherData.subjects;

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
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
            setIsLoading(false);
        }, 500);
    }, []);

    const handleAddClass = async () => {
        if (!topic || !subject || !date || !time || !classType) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all class details.' });
            return;
        }

        const newClass: ScheduleItem = {
            id: `sch-${Date.now()}`,
            topic,
            subject,
            date,
            time,
            type: classType,
            locationOrLink,
        };

        setSchedule(prev => [...prev, newClass].sort((a,b) => a.date.getTime() - b.date.getTime()));

        toast({ title: 'Class Scheduled', description: `${topic} on ${format(date, "PPP")} has been added to your schedule.`});
        
        // Reset form and close dialog
        setTopic('');
        setSubject('');
        setDate(new Date());
        setTime('');
        setClassType('');
        setLocationOrLink('');
        setAddClassOpen(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <CalendarDays className="h-8 w-8"/>
                        Class Schedule
                    </h1>
                    <p className="text-muted-foreground">Manage your upcoming classes and events.</p>
                </div>
                 <Dialog open={isAddClassOpen} onOpenChange={setAddClassOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Class</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Schedule a New Class</DialogTitle>
                            <DialogDescription>Fill in the details for your new class session.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="topic" className="text-right">Topic*</Label>
                                <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} className="col-span-3" placeholder="e.g., Quantum Physics" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">Subject*</Label>
                                <Select onValueChange={setSubject} value={subject}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="text-right">Date*</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("col-span-3 justify-start text-left font-normal", !date && "text-muted-foreground")}
                                        >
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                             </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="time" className="text-right">Time*</Label>
                                <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type*</Label>
                                <Select onValueChange={(v) => setClassType(v as any)} value={classType}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select class type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Online">Online</SelectItem>
                                        <SelectItem value="Offline">Offline</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="location" className="text-right">{classType === 'Online' ? 'Meet Link' : 'Location'}</Label>
                                <Input id="location" value={locationOrLink} onChange={e => setLocationOrLink(e.target.value)} className="col-span-3" placeholder={classType === 'Online' ? 'https://meet.google.com/...' : 'e.g. Classroom #5'} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddClass}>Schedule Class</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                                <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5"/></Button>
                            </div>
                        ))
                     ) : !isLoading && (
                        <p className="text-sm text-center text-muted-foreground py-8">You haven't scheduled any classes yet.</p>
                     )}
                </CardContent>
            </Card>

        </div>
    );
}
