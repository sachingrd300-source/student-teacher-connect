
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, PlusCircle, Trash2, MoreVertical, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type Batch = { id: string; subject: string; classLevel: string, title: string };
type Schedule = {
    id: string;
    topic: string;
    subject: string;
    date: { toDate: () => Date };
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
    classId: string;
};

export default function SchedulePage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState<'Online' | 'Offline'>('Online');
    const [locationOrLink, setLocationOrLink] = useState('');

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);

    const schedulesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classSchedules'), where('teacherId', '==', user.uid), orderBy('date', 'desc'));
    }, [firestore, user]);
    const { data: schedules, isLoading: isLoadingSchedules } = useCollection<Schedule>(schedulesQuery);

    const resetForm = () => {
        setSelectedBatchId('');
        setTopic('');
        setDate('');
        setTime('');
        setType('Online');
        setLocationOrLink('');
        setIsDialogOpen(false);
    };

    const handleScheduleClass = () => {
        if (!selectedBatchId || !topic || !date || !time || !locationOrLink || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return;
        }
        
        const selectedBatch = batches?.find(b => b.id === selectedBatchId);
        if (!selectedBatch) return;

        const newSchedule = {
            teacherId: user.uid,
            classId: selectedBatchId,
            classTitle: selectedBatch.title,
            subject: selectedBatch.subject,
            topic,
            date: new Date(date),
            time,
            type,
            locationOrLink,
            status: 'Scheduled'
        };

        addDoc(collection(firestore, 'classSchedules'), newSchedule)
            .then(() => {
                toast({ title: 'Class Scheduled!', description: 'Your class has been added to the schedule.' });
                resetForm();
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: collection(firestore, 'classSchedules').path,
                    operation: 'create',
                    requestResourceData: newSchedule,
                }));
            });
    };
    
    const handleDeleteSchedule = (scheduleId: string) => {
        if(!firestore) return;
        const scheduleRef = doc(firestore, 'classSchedules', scheduleId);
        deleteDoc(scheduleRef)
            .then(() => toast({ title: 'Schedule Deleted', description: 'The class has been removed from the schedule.' }))
            .catch(error => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({ path: scheduleRef.path, operation: 'delete' }));
            });
    };
    
    const isLoading = isLoadingBatches || isLoadingSchedules;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <CalendarDays className="h-8 w-8"/>
                        My Schedule
                    </h1>
                    <p className="text-muted-foreground">Manage your upcoming class schedule.</p>
                </div>
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Schedule a Class</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule a New Class</DialogTitle>
                            <DialogDescription>Fill in the details to add a new class to your schedule.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="batch">Batch*</Label>
                                <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
                                    <SelectTrigger id="batch"><SelectValue placeholder="Select a batch" /></SelectTrigger>
                                    <SelectContent>{batches?.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="topic">Topic*</Label>
                                <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date*</Label>
                                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time">Time*</Label>
                                    <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type*</Label>
                                <Select onValueChange={(v) => setType(v as 'Online' | 'Offline')} value={type}>
                                    <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Online">Online</SelectItem><SelectItem value="Offline">Offline</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">{type === 'Online' ? 'Meeting Link*' : 'Location*'}</Label>
                                <Input id="location" value={locationOrLink} onChange={e => setLocationOrLink(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleScheduleClass}>Schedule Class</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-soft-shadow">
                <CardHeader><CardTitle>Upcoming Classes</CardTitle></CardHeader>
                <CardContent>
                    {isLoading && <div className="space-y-2"><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-full"/></div>}
                    {!isLoading && schedules && schedules.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow><TableHead>Topic</TableHead><TableHead>Batch</TableHead><TableHead>Date & Time</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {schedules.map(s => {
                                    const batch = batches?.find(b => b.id === s.classId);
                                    return (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.topic}</TableCell>
                                            <TableCell><Badge variant="outline">{batch?.title || 'N/A'}</Badge></TableCell>
                                            <TableCell>{format(s.date.toDate(), 'PPP')} at {s.time}</TableCell>
                                            <TableCell>{s.type}</TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical/></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem disabled><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-500 focus:bg-red-50 focus:text-red-600 !cursor-pointer"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem></AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the scheduled class "{s.topic}".</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSchedule(s.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : !isLoading && <p className="text-center text-muted-foreground py-8">No classes scheduled yet.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
