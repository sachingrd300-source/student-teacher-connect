
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, Timestamp, doc, getDocs, getDoc } from 'firebase/firestore';


type StudentEnrollment = { id: string; studentName: string; studentId: string; };
type Class = { id: string; subject: string; classLevel: string; };
type UserProfile = { name: string; };

export default function AttendancePage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    // Filters
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedClassId, setSelectedClassId] = useState('');

    // State
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [students, setStudents] = useState<StudentEnrollment[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const classesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);
    
    useEffect(() => {
        const fetchStudentsForClass = async () => {
            if (!firestore || !user || !selectedClassId) {
                setStudents([]);
                return;
            }
            setIsLoadingStudents(true);
            try {
                // Securely query enrollments for the selected class and teacher
                const enrollmentsQuery = query(
                    collection(firestore, 'enrollments'), 
                    where('teacherId', '==', user.uid), 
                    where('classId', '==', selectedClassId), 
                    where('status', '==', 'approved')
                );

                const querySnapshot = await getDocs(enrollmentsQuery);
                const studentEnrollmentsData = querySnapshot.docs.map(d => ({...d.data(), id: d.id} as {studentId: string, id: string}));

                const studentPromises = studentEnrollmentsData.map(async (enrollment) => {
                    const studentDocRef = doc(firestore, 'users', enrollment.studentId);
                    const studentDoc = await getDoc(studentDocRef);

                    if (studentDoc.exists()) {
                        const studentData = studentDoc.data() as UserProfile;
                        return { id: enrollment.id, studentId: enrollment.studentId, studentName: studentData.name };
                    }
                    return null;
                });

                const resolvedStudents = (await Promise.all(studentPromises)).filter(Boolean) as StudentEnrollment[];
                setStudents(resolvedStudents);

                 const initialAttendance = resolvedStudents.reduce((acc, student) => {
                    acc[student.studentId] = true;
                    return acc;
                }, {} as Record<string, boolean>);
                setAttendance(initialAttendance);

            } catch (error) {
                console.error("Error fetching students for class:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch students for this class.' });
            } finally {
                setIsLoadingStudents(false);
            }
        };

        fetchStudentsForClass();
    }, [firestore, user, selectedClassId, toast]);


    const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
        setAttendance(prev => ({ ...prev, [studentId]: isPresent }));
    };

    const handleSaveAttendance = async () => {
        if (!selectedClassId || !selectedDate || !firestore || !user || !students) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a date and class.' });
            return;
        }
        setIsSaving(true);

        const batch = writeBatch(firestore);
        
        students.forEach(student => {
            const isPresent = attendance[student.studentId] ?? false;
            const attendanceRef = doc(collection(firestore, 'attendances'));
            batch.set(attendanceRef, {
                studentId: student.studentId,
                teacherId: user.uid,
                classId: selectedClassId,
                date: Timestamp.fromDate(selectedDate),
                isPresent: isPresent,
            });
        });
        
        try {
            await batch.commit();
            toast({ title: 'Attendance Saved', description: `Attendance for ${format(selectedDate, 'PPP')} has been recorded (${Object.values(attendance).filter(Boolean).length}/${students.length} present).` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error Saving Attendance', description: 'There was a problem saving the attendance records.' });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <ClipboardCheck className="h-8 w-8"/>
                    Mark Attendance
                </h1>
                <p className="text-muted-foreground">Select a class and date to mark student attendance.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Class and Date</CardTitle>
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
                        <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingClasses && <SelectItem value="" disabled>Loading classes...</SelectItem>}
                                {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.subject} - {c.classLevel}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {selectedClassId ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead className="text-right">Status (Present / Absent)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStudents && <TableRow><TableCell colSpan={2}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                                    {students?.map((student) => (
                                        <TableRow key={student.studentId}>
                                            <TableCell className="font-medium">{student.studentName}</TableCell>
                                            <TableCell className="text-right">
                                                <Switch
                                                    checked={attendance[student.studentId] ?? true}
                                                    onCheckedChange={(checked) => handleAttendanceChange(student.studentId, checked)}
                                                    aria-label={`Mark ${student.studentName} attendance`}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {students && students.length > 0 && (
                                <div className="flex justify-end mt-6">
                                    <Button onClick={handleSaveAttendance} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save Attendance'}
                                    </Button>
                                </div>
                            )}
                             {students?.length === 0 && !isLoadingStudents && <p className="text-center text-muted-foreground py-4">No approved students found in this class.</p>}
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Please select a class to view students.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
