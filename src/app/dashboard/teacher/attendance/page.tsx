'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, CalendarCheck, MessageSquare } from 'lucide-react';

// Interfaces
interface UserProfile {
    id: string;
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    mobileNumber?: string;
    parentMobileNumber?: string;
}
interface Batch {
    id: string;
    name: string;
}
interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    status: 'approved';
}
interface AttendanceRecord {
    id: string; // Composite ID: `${studentId}_${date}`
    studentId: string;
    status: 'present' | 'absent';
    date: string;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const adjustedDate = new Date(today.getTime() - (offset*60*1000));
    return adjustedDate.toISOString().split('T')[0];
};

export default function AttendancePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    // State
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
    
    // --- Data Fetching ---
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: currentUserProfile } = useDoc<UserProfile>(userProfileRef);

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: batches, isLoading: batchesLoading } = useCollection<Batch>(batchesQuery);

    const enrolledStudentsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedBatchId) return null;
        return query(
            collection(firestore, 'enrollments'),
            where('batchId', '==', selectedBatchId),
            where('status', '==', 'approved')
        );
    }, [firestore, selectedBatchId]);
    const { data: enrolledStudents, isLoading: studentsLoading } = useCollection<Enrollment>(enrolledStudentsQuery);

    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore || !selectedBatchId || !selectedDate) return null;
        return query(
            collection(firestore, 'batches', selectedBatchId, 'attendance'),
            where('date', '==', selectedDate),
            where('teacherId', '==', user?.uid)
        );
    }, [firestore, selectedBatchId, selectedDate, user?.uid]);
    const { data: attendanceData, isLoading: attendanceLoading } = useCollection<AttendanceRecord>(attendanceQuery);

    const attendanceMap = useMemo(() => {
        const map = new Map<string, 'present' | 'absent'>();
        attendanceData?.forEach(record => {
            map.set(record.studentId, record.status);
        });
        return map;
    }, [attendanceData]);

    // --- Event Handlers ---
    const handleStatusChange = async (student: Enrollment, isPresent: boolean) => {
        if (!firestore || !selectedBatchId || !selectedDate || !user) return;

        const newStatus = isPresent ? 'present' : 'absent';
        const docId = `${student.studentId}_${selectedDate}`;
        const attendanceRef = doc(firestore, 'batches', selectedBatchId, 'attendance', docId);

        try {
            await setDoc(attendanceRef, {
                studentId: student.studentId,
                studentName: student.studentName,
                batchId: selectedBatchId,
                teacherId: user.uid,
                date: selectedDate,
                status: newStatus,
            });
        } catch (error) {
            console.error("Failed to update attendance:", error);
            // Show error to user
        }
    };

    const handleSendReminder = async (studentId: string, studentName: string) => {
        if(!firestore) return;
        
        try {
            const studentDocSnap = await getDoc(doc(firestore, 'users', studentId));
            if (!studentDocSnap.exists()) {
                 alert(`Could not find profile for ${studentName}.`);
                 return;
            }
            const studentData = studentDocSnap.data() as UserProfile | undefined;
            // Prioritize parent's number, fallback to student's
            const targetMobileNumber = studentData?.parentMobileNumber || studentData?.mobileNumber;

            if (!targetMobileNumber) {
                alert(`Cannot send reminder: Mobile number for ${studentName} or their parent is not available.`);
                return;
            }

            const batchName = batches?.find(b => b.id === selectedBatchId)?.name || 'your class';
            const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            
            // Construct a message suitable for a parent
            const message = `Hello, this is a reminder from Achievers Community regarding your child, ${studentName}. They were marked absent from the ${batchName} batch on ${formattedDate}. Please contact the teacher if you have any questions.`;
            
            const phoneNumber = targetMobileNumber.replace(/[^0-9]/g, '');
            const formattedPhoneNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
            const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } catch(error) {
            console.error("Error sending reminder:", error);
            alert("Could not fetch student details to send reminder.");
        }
    };

    const isLoading = isUserLoading || batchesLoading;

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={currentUserProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center text-2xl font-serif">
                                <CalendarCheck className="mr-3 h-6 w-6 text-primary"/>
                                Mark Attendance
                            </CardTitle>
                            <CardDescription>Select a batch and date to manage student attendance.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="batch-select">Batch</Label>
                                <Select value={selectedBatchId} onValueChange={setSelectedBatchId} disabled={batchesLoading}>
                                    <SelectTrigger id="batch-select">
                                        <SelectValue placeholder="Select a batch..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches && batches.map(batch => (
                                            <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date-select">Date</Label>
                                <Input
                                    id="date-select"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    disabled={!selectedBatchId}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {selectedBatchId && (
                        <Card className="rounded-2xl shadow-lg">
                            <CardHeader>
                                <CardTitle>Student List</CardTitle>
                                <CardDescription>Toggle the switch to mark a student as present or absent.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(studentsLoading || attendanceLoading) ? (
                                    <div className="flex justify-center items-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : enrolledStudents && enrolledStudents.length > 0 ? (
                                    <div className="grid gap-4">
                                        {enrolledStudents.map(student => {
                                            const status = attendanceMap.get(student.studentId) || 'present';
                                            const isPresent = status === 'present';

                                            return (
                                                <div key={student.studentId} className="flex items-center justify-between p-3 rounded-lg border bg-background transition-colors hover:bg-accent/50">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar>
                                                            <AvatarFallback>{getInitials(student.studentName)}</AvatarFallback>
                                                        </Avatar>
                                                        <p className="font-medium">{student.studentName}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Label htmlFor={`status-${student.studentId}`} className={`text-sm font-medium ${!isPresent ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                                {isPresent ? 'Present' : 'Absent'}
                                                            </Label>
                                                            <Switch
                                                                id={`status-${student.studentId}`}
                                                                checked={isPresent}
                                                                onCheckedChange={(checked) => handleStatusChange(student, checked)}
                                                            />
                                                        </div>
                                                        {!isPresent && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleSendReminder(student.studentId, student.studentName)}
                                                            >
                                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                                Reminder
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">No students enrolled in this batch.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
