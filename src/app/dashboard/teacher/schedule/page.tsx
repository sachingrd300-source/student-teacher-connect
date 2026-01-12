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
import { PlusCircle, CalendarDays, Video, MapPin, MoreVertical, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


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
    createdAt: Timestamp;
};

type UserProfile = {
    subjects?: string[];
}

export default function SchedulePage() {
    const { toast } = useToast();
    const [isAddClassOpen, setAddClassOpen] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();
    
    // Form state
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('');
    const [classType, setClassType] = useState<'Online' | 'Offline' | ''>('');
    const [locationOrLink, setLocationOrLink] = useState('');

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const q = doc(firestore, 'users', user.uid);
        (q as any).__memo = true;
        return q;
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileQuery);
    const teacherSubjects = useMemo(() => userProfile?.subjects || [], [userProfile]);

    const scheduleQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      const q = query(collection(firestore, 'classSchedules'), where('teacherId', '==', user.uid), orderBy('date', 'desc'));
      (q as any).__memo = true;
      return q;
    }, [firestore, user]);

    const { data: schedule, isLoading } = useCollection<ScheduleItem>(scheduleQuery);
    
    const sortedSchedule = useMemo(() => {
        if (!schedule) return [];
        return [...schedule].sort((a,b) => a.date.toMillis() - b.date.toMillis());
    }, [schedule]);


    const handleAddClass = async () => {
        if (!topic || !subject || !date || !time || !classType || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all class details.' });
            return;
        }

        const newClass = {
            topic,
            subject,
            date: Timestamp.fromDate(date),
            time,
            type: classType,
            locationOrLink,
            status: 'Scheduled',
            teacherId: user.uid,
            createdAt: serverTimestamp(),
        };

        const scheduleCollection = collection(firestore, 'classSchedules');
        addDocumentNonBlocking(scheduleCollection, newClass);
        
        toast({ title: 'Class Scheduled', description: `${topic} on ${format(date, "PPP")} has been added to your schedule.`});
        
        setTopic('');
        setSubject('');
        setDate(new Date());
        setTime('');
        setClassType('');
        setLocationOrLink('');
        setAddClassOpen(false);
    }

    const handleCancelClass = async (itemId: string) => {
        if (!firestore) return;
        const classRef = doc(firestore, 'classSchedules', itemId);
        await updateDoc(classRef, { status: 'Canceled' });
        toast({ title: 'Class Canceled', description: 'The class has been marked as canceled.'});
    };

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
                     {sortedSchedule && sortedSchedule.length > 0 ? (
                        sortedSchedule.map(item => (
                            <div key={item.id} className={cn("flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50", item.status === 'Canceled' && 'bg-muted/50 opacity-60')}>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center p-3 text-sm font-semibold text-center rounded-md w-20 bg-primary/10 text-primary">
                                        <span>{item.date.toDate().toLocaleDateString('en-US', { day: '2-digit' })}</span>
                                        <span>{item.date.toDate().toLocaleDateString('en-US', { month: 'short' })}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{item.topic}</h3>
                                            {item.status === 'Canceled' && <Badge variant="destructive">Canceled</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{item.subject} • {item.time}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            {item.type === 'Online' ? <Video className="h-4 w-4"/> : <MapPin className="h-4 w-4"/>}
                                            {item.locationOrLink || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                                {item.status === 'Scheduled' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleCancelClass(item.id)} className="text-red-600 focus:text-red-600 focus:bg-red-100 !cursor-pointer">
                                                <XCircle className="mr-2 h-4 w-4"/>
                                                Cancel Class
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
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
