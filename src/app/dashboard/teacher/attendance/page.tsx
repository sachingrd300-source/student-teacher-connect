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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, UserCheck, CalendarIcon, User, X } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { format } from 'date-fns';

type Batch = {
  id: string;
  title: string;
};

type Enrollment = {
    id: string;
    studentId: string;
    studentName: string;
};

type AttendanceRecordMap = {
    [studentId: string]: boolean;
};

type AttendanceDoc = {
    id: string;
    records: AttendanceRecordMap;
    date: string;
};

function MarkAttendanceTab({ selectedBatchId, students, isLoadingStudents }: { selectedBatchId: string, students: Enrollment[] | null, isLoadingStudents: boolean }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [attendance, setAttendance] = useState<AttendanceRecordMap>({});

    useEffect(() => {
        if (students) {
            const initialAttendance: AttendanceRecordMap = {};
            students.forEach(student => {
                initialAttendance[student.studentId] = false; // Default all to absent
            });
            setAttendance(initialAttendance);
        } else {
            setAttendance({});
        }
    }, [students]);
    
    const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
        setAttendance(prev => ({ ...prev, [studentId]: isPresent }));
    };
    
    const handleSelectAll = (isPresent: boolean) => {
        if (!students) return;
        const newAttendance: AttendanceRecordMap = {};
        students.forEach(student => {
            newAttendance[student.studentId] = isPresent;
        });
        setAttendance(newAttendance);
    };

    const handleSubmitAttendance = () => {
        if (!firestore || !user || !selectedBatchId) {
            return;
        }

        if (!students || students.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Students',
                description: 'This batch has no students to mark attendance for.',
            });
            return;
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const attendanceId = `${selectedBatchId}_${today}`;
        const attendanceRef = doc(firestore, 'attendance', attendanceId);

        const attendanceRecord = {
            teacherId: user.uid,
            classId: selectedBatchId,
            date: today,
            records: attendance,
            createdAt: serverTimestamp(),
        };

        setDoc(attendanceRef, attendanceRecord, { merge: true }) // using merge is good practice
            .then(() => {
                toast({
                    title: 'Attendance Submitted',
                    description: `Attendance for ${today} has been successfully recorded.`,
                });
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: attendanceRef.path,
                    operation: 'write', // Set/merge is a write operation
                    requestResourceData: attendanceRecord,
                }));
            });
    };

    return (
        <CardContent>
            <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl"><UserCheck className="h-6 w-6" /> Today's Student List</CardTitle>
                <CardDescription>Check the box for each student who is present.</CardDescription>
            </CardHeader>
            {isLoadingStudents && (
                 <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            )}
            {!isLoadingStudents && students && students.length > 0 ? (
                <>
                <div className="flex justify-end gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={() => handleSelectAll(true)}>Mark All Present</Button>
                    <Button variant="outline" size="sm" onClick={() => handleSelectAll(false)}>Mark All Absent</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Present</TableHead>
                            <TableHead>Student Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map(student => (
                            <TableRow key={student.id}>
                                <TableCell>
                                    <Checkbox 
                                        id={`att-${student.id}`}
                                        checked={attendance[student.studentId] || false}
                                        onCheckedChange={(checked) => handleAttendanceChange(student.studentId, !!checked)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Label htmlFor={`att-${student.id}`} className="font-medium">{student.studentName}</Label>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <div className="flex justify-end mt-6">
                    <Button onClick={handleSubmitAttendance}>Submit Attendance</Button>
                </div>
                </>
            ) : !isLoadingStudents && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No approved students in this batch.</p>
                </div>
            )}
        </CardContent>
    );
}

function ViewRecordsTab({ selectedBatchId, students, isLoadingStudents }: { selectedBatchId: string, students: Enrollment[] | null, isLoadingStudents: boolean }) {
    const firestore = useFirestore();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [record, setRecord] = useState<AttendanceDoc | null | undefined>(undefined); // undefined: not loaded, null: not found
    const [isLoadingRecord, setIsLoadingRecord] = useState(false);

    useEffect(() => {
        if (!selectedDate || !firestore || !selectedBatchId) {
            setRecord(undefined);
            return;
        }

        const fetchRecord = async () => {
            setIsLoadingRecord(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const q = query(
                collection(firestore, 'attendance'),
                where('classId', '==', selectedBatchId),
                where('date', '==', dateStr)
            );

            try {
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    setRecord(null);
                } else {
                    const doc = querySnapshot.docs[0];
                    setRecord({ id: doc.id, ...doc.data() } as AttendanceDoc);
                }
            } catch (error) {
                console.error("Error fetching attendance record:", error);
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `attendance`,
                    operation: 'list',
                }));
                setRecord(null);
            } finally {
                setIsLoadingRecord(false);
            }
        };

        fetchRecord();
    }, [selectedDate, selectedBatchId, firestore]);

    return (
        <CardContent>
             <div className="space-y-4">
                 <div>
                    <Label htmlFor="date-picker">Select a Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date-picker"
                                variant={"outline"}
                                className={"w-full justify-start text-left font-normal"}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                
                {(isLoadingRecord || isLoadingStudents) && (
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}
                
                {!isLoadingRecord && !isLoadingStudents && record === null && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No attendance record found for {selectedDate ? format(selectedDate, "PPP") : 'the selected date'}.</p>
                    </div>
                )}
                
                {!isLoadingRecord && !isLoadingStudents && record && students && (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.studentName}</TableCell>
                                    <TableCell className="text-right">
                                        {record.records[student.studentId] ? (
                                            <span className="flex items-center justify-end gap-2 text-green-600"><User className="h-4 w-4" /> Present</span>
                                        ) : (
                                            <span className="flex items-center justify-end gap-2 text-red-600"><X className="h-4 w-4" /> Absent</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

             </div>
        </CardContent>
    );
}

export default function AttendancePage() {
    const { user, isLoading: isUserLoading } = useUser();
    const firestore = useFirestore();
    const [selectedBatchId, setSelectedBatchId] = useState('');

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !selectedBatchId) return null;
        return query(
            collection(firestore, 'enrollments'),
            where('classId', '==', selectedBatchId),
            where('status', '==', 'approved')
        );
    }, [firestore, user, selectedBatchId]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Enrollment>(studentsQuery);

    const isLoading = isUserLoading || isLoadingBatches;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <ClipboardCheck className="h-8 w-8"/>
                    Attendance
                </h1>
                <p className="text-muted-foreground">Mark student attendance for today or view past records.</p>
            </div>

            <Card className="shadow-soft-shadow">
                <CardHeader>
                    <CardTitle>Select a Batch</CardTitle>
                    <div className="pt-2">
                         <Select onValueChange={setSelectedBatchId} value={selectedBatchId} disabled={isLoading}>
                            <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                                <SelectValue placeholder="Select a batch..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingBatches && <SelectItem value="loading" disabled>Loading batches...</SelectItem>}
                                {batches?.map(batch => (
                                    <SelectItem key={batch.id} value={batch.id}>{batch.title}</SelectItem>
                                ))}
                                {!isLoadingBatches && batches?.length === 0 && <SelectItem value="no-batches" disabled>No batches found.</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                {selectedBatchId && (
                     <Tabs defaultValue="mark" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="mark">Mark Today's Attendance</TabsTrigger>
                            <TabsTrigger value="view">View Records</TabsTrigger>
                        </TabsList>
                        <TabsContent value="mark">
                            <MarkAttendanceTab selectedBatchId={selectedBatchId} students={students} isLoadingStudents={isLoadingStudents} />
                        </TabsContent>
                        <TabsContent value="view">
                            <ViewRecordsTab selectedBatchId={selectedBatchId} students={students} isLoadingStudents={isLoadingStudents} />
                        </TabsContent>
                    </Tabs>
                )}
            </Card>
        </div>
    );
}
