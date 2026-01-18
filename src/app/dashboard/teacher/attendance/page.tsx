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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ClipboardCheck, UserCheck } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type Batch = {
  id: string;
  subject: string;
  classLevel: string;
  title: string;
};

type Enrollment = {
    id: string;
    studentId: string;
    studentName: string;
};

type AttendanceRecord = {
    [studentId: string]: boolean;
};

export default function AttendancePage() {
    const { user, isLoading: isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [attendance, setAttendance] = useState<AttendanceRecord>({});

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid || !selectedBatchId) return null;
        return query(
            collection(firestore, 'enrollments'),
            where('teacherId', '==', user.uid),
            where('classId', '==', selectedBatchId),
            where('status', '==', 'approved')
        );
    }, [firestore, user?.uid, selectedBatchId]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<Enrollment>(studentsQuery);
    
    const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
        setAttendance(prev => ({ ...prev, [studentId]: isPresent }));
    };
    
    const handleSelectAll = (isPresent: boolean) => {
        if (!students) return;
        const newAttendance: AttendanceRecord = {};
        students.forEach(student => {
            newAttendance[student.studentId] = isPresent;
        });
        setAttendance(newAttendance);
    };

    const handleSubmitAttendance = () => {
        // In a real app, this would write to a 'attendance' collection in Firestore.
        console.log('Submitting Attendance:', attendance);
        toast({
            title: 'Attendance Submitted',
            description: 'The attendance has been recorded.',
        });
    };

    const isLoading = isUserLoading || isLoadingBatches;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <ClipboardCheck className="h-8 w-8"/>
                    Mark Attendance
                </h1>
                <p className="text-muted-foreground">Select a batch to mark student attendance for today.</p>
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
                     <CardContent>
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl"><UserCheck className="h-6 w-6" /> Student List</CardTitle>
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
                )}
            </Card>
        </div>
    );
}
