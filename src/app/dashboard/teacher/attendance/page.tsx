
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ClipboardCheck, CalendarIcon } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { format, startOfDay } from 'date-fns';

type Teacher = { id: string; userId: string; };
type Student = { id: string; name: string; batch: string; };
type Batch = { id: string; name: string; teacherId: string; };

export default function AttendancePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // Filters
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedBatchId, setSelectedBatchId] = useState('');

    // Attendance state
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});

    // Fetch Teacher
    const teacherQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'teachers'), where('userId', '==', user.uid)) : null
    , [firestore, user]);
    const { data: teacherDocs } = useCollection<Teacher>(teacherQuery);
    const teacher = teacherDocs?.[0];

    // Fetch Batches for Teacher
    const batchesQuery = useMemoFirebase(() => {
        if(!teacher) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', teacher.id));
    }, [firestore, teacher]);
    const { data: batches } = useCollection<Batch>(batchesQuery);
    
    // Fetch Students for the selected Batch
    const studentsQuery = useMemoFirebase(() => {
        if(!teacher || !selectedBatchId) return null;
        return query(
            collection(firestore, 'users'), 
            where('teacherId', '==', teacher.id),
            where('batch', '==', batches?.find(b => b.id === selectedBatchId)?.name)
        );
    }, [firestore, teacher, selectedBatchId, batches]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

    // Update local attendance state when students are loaded
    useMemo(() => {
        const initialAttendance: Record<string, boolean> = {};
        students?.forEach(student => {
            initialAttendance[student.id] = true; // Default to present
        });
        setAttendance(initialAttendance);
    }, [students]);

    const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
        setAttendance(prev => ({ ...prev, [studentId]: isPresent }));
    };

    const handleSaveAttendance = async () => {
        if (!firestore || !teacher || !selectedBatchId || !selectedDate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a date and batch.' });
            return;
        }

        const presentStudentIds = Object.keys(attendance).filter(id => attendance[id]);
        const absentStudentIds = Object.keys(attendance).filter(id => !attendance[id]);
        
        // Use a consistent ID for the date to allow overwriting
        const dateString = format(startOfDay(selectedDate), 'yyyy-MM-dd');
        const attendanceId = `${dateString}-${selectedBatchId}`;
        const attendanceRef = doc(firestore, 'attendances', attendanceId);

        const attendanceData = {
            id: attendanceId,
            teacherId: teacher.id,
            batchId: selectedBatchId,
            date: startOfDay(selectedDate),
            presentStudentIds,
            absentStudentIds,
        };

        setDocumentNonBlocking(attendanceRef, attendanceData, { merge: true });

        toast({ title: 'Attendance Saved', description: `Attendance for ${format(selectedDate, 'PPP')} has been recorded.` });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <ClipboardCheck className="h-8 w-8"/>
                    Mark Attendance
                </h1>
                <p className="text-muted-foreground">Select a batch and date to mark student attendance.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Batch and Date</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Select a batch" />
                            </SelectTrigger>
                            <SelectContent>
                                {batches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {selectedBatchId ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead className="text-right">Status (Present / Absent)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStudents && <TableRow><TableCell colSpan={2}>Loading students...</TableCell></TableRow>}
                                    {students?.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Switch
                                                    checked={attendance[student.id] ?? true}
                                                    onCheckedChange={(checked) => handleAttendanceChange(student.id, checked)}
                                                    aria-label={`Mark ${student.name} attendance`}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {students && students.length > 0 && (
                                <div className="flex justify-end mt-6">
                                    <Button onClick={handleSaveAttendance}>Save Attendance</Button>
                                </div>
                            )}
                             {students?.length === 0 && !isLoadingStudents && <p className="text-center text-muted-foreground py-4">No students found in this batch.</p>}
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Please select a batch to view students.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
