
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarCheck } from 'lucide-react';

interface Class {
    id: string;
    title: string;
    subject: string;
}

interface EnrolledStudent {
    id: string; // This is the enrollment doc id
    studentId: string;
    studentName: string;
}

interface AttendanceRecord {
    [studentId: string]: boolean;
}

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function TeacherAttendancePage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
    const [attendance, setAttendance] = useState<AttendanceRecord>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const classesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: classes } = useCollection<Class>(classesQuery);

    const enrolledStudentsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClassId || !user) return null;
        return query(collection(firestore, 'enrollments'), where('classId', '==', selectedClassId), where('teacherId', '==', user.uid));
    }, [firestore, selectedClassId, user]);
    const { data: enrolledStudents, isLoading: studentsLoading } = useCollection<EnrolledStudent>(enrolledStudentsQuery);

    // Effect to fetch existing attendance data and initialize state
    useEffect(() => {
        const fetchAttendance = async () => {
            if (!firestore || !selectedClassId || !selectedDate) return;
            setIsLoading(true);

            const attendanceDocId = `${selectedClassId}_${selectedDate}`;
            const attendanceRef = doc(firestore, 'attendance', attendanceDocId);
            const attendanceSnap = await getDoc(attendanceRef);

            const newAttendance: AttendanceRecord = {};
            if (attendanceSnap.exists()) {
                const existingRecords = attendanceSnap.data().records as AttendanceRecord;
                 enrolledStudents?.forEach(student => {
                    newAttendance[student.studentId] = existingRecords[student.studentId] ?? false;
                });
            } else {
                enrolledStudents?.forEach(student => {
                    newAttendance[student.studentId] = false; // Default to absent
                });
            }
            setAttendance(newAttendance);
            setIsLoading(false);
        };

        if(enrolledStudents) {
            fetchAttendance();
        }
    }, [selectedClassId, selectedDate, firestore, enrolledStudents]);

    const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
        setAttendance(prev => ({ ...prev, [studentId]: isPresent }));
    };

    const handleSaveAttendance = () => {
        if (!firestore || !user || !selectedClassId || !selectedDate) return;
        setIsSaving(true);
        const attendanceDocId = `${selectedClassId}_${selectedDate}`;
        const attendanceRef = doc(firestore, 'attendance', attendanceDocId);

        const data = {
            id: attendanceDocId,
            teacherId: user.uid,
            classId: selectedClassId,
            date: selectedDate,
            records: attendance,
            createdAt: serverTimestamp(), // For new docs
            updatedAt: serverTimestamp() // For updates
        };

        setDocumentNonBlocking(attendanceRef, data, { merge: true });
        
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <CalendarCheck className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Manage Attendance</h1>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Take Attendance</CardTitle>
                            <CardDescription>Select a class and date to take or update attendance.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="class-select">Class</Label>
                                    <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                                        <SelectTrigger id="class-select">
                                            <SelectValue placeholder="Select a class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.title} - {c.subject}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="date-select">Date</Label>
                                    <Input id="date-select" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                                </div>
                            </div>
                            
                            {selectedClassId && (studentsLoading || isLoading) && <p>Loading students...</p>}
                            
                            {selectedClassId && !studentsLoading && !isLoading && enrolledStudents && (
                                <div className="border rounded-lg">
                                    <div className="p-4 border-b">
                                        <h3 className="font-semibold">Student List</h3>
                                        <p className="text-sm text-muted-foreground">Toggle the switch to mark a student as present.</p>
                                    </div>
                                    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                                        {enrolledStudents.length > 0 ? enrolledStudents.map(student => (
                                            <div key={student.studentId} className="flex items-center justify-between">
                                                <Label htmlFor={`switch-${student.studentId}`} className="text-base">{student.studentName}</Label>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-medium ${attendance[student.studentId] ? 'text-primary' : 'text-muted-foreground'}`}>
                                                        {attendance[student.studentId] ? 'Present' : 'Absent'}
                                                    </span>
                                                    <Switch
                                                        id={`switch-${student.studentId}`}
                                                        checked={attendance[student.studentId] || false}
                                                        onCheckedChange={(checked) => handleAttendanceChange(student.studentId, checked)}
                                                    />
                                                </div>
                                            </div>
                                        )) : <p className="text-center text-muted-foreground py-4">No students are enrolled in this class.</p>}
                                    </div>
                                    {enrolledStudents.length > 0 && 
                                        <div className="p-4 border-t">
                                            <Button onClick={handleSaveAttendance} disabled={isSaving} className="w-full">
                                                {isSaving ? 'Saving...' : 'Save Attendance'}
                                            </Button>
                                        </div>
                                    }
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
