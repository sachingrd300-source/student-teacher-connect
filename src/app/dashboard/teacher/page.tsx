
'use client';

import { FormEvent, useState } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface Class {
    id: string;
    title: string;
    subject: string;
    batchTime: string;
    classCode: string;
}

interface PendingStudent {
    id: string;
    studentName: string;
    classTitle: string;
}

export default function TeacherDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();

    // State for Create Class form
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [batchTime, setBatchTime] = useState('');
    const [isCreatingClass, setIsCreatingClass] = useState(false);

    // State for Add Student form
    const [selectedClass, setSelectedClass] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentFatherName, setStudentFatherName] = useState('');
    const [studentMobileNumber, setStudentMobileNumber] = useState('');
    const [studentAddress, setStudentAddress] = useState('');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [newlyAddedStudent, setNewlyAddedStudent] = useState<{name: string, id: string} | null>(null);


    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const classesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: classes, isLoading: classesLoading } = useCollection<Class>(classesQuery);

    const pendingStudentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'pendingStudents'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: pendingStudents, isLoading: pendingStudentsLoading } = useCollection<PendingStudent>(pendingStudentsQuery);

    const handleCreateClass = (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !firestore) return;

        setIsCreatingClass(true);
        
        const newClassData = {
            teacherId: user.uid,
            teacherName: userProfile.name,
            title,
            subject,
            batchTime,
            classCode: nanoid(6).toUpperCase(),
            createdAt: serverTimestamp(),
        };

        const classesColRef = collection(firestore, 'classes');
        addDocumentNonBlocking(classesColRef, newClassData)
          .then(() => {
              setTitle('');
              setSubject('');
              setBatchTime('');
          })
          .finally(() => {
              setIsCreatingClass(false);
          });
    };

    const handleAddStudent = (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !selectedClass || !studentName.trim() || !firestore) return;
        setIsAddingStudent(true);
        setNewlyAddedStudent(null);

        const classData = classes?.find(c => c.id === selectedClass);
        if (!classData) {
            console.error("Selected class not found");
            setIsAddingStudent(false);
            return;
        }

        const studentId = nanoid(8);
        const pendingStudentRef = doc(firestore, 'pendingStudents', studentId);
        
        const newPendingStudent = {
            id: studentId,
            studentName: studentName.trim(),
            fatherName: studentFatherName.trim(),
            mobileNumber: studentMobileNumber.trim(),
            address: studentAddress.trim(),
            teacherId: user.uid,
            teacherName: userProfile.name,
            classId: selectedClass,
            classTitle: classData.title,
            createdAt: serverTimestamp()
        };

        setDocumentNonBlocking(pendingStudentRef, newPendingStudent, {});

        setNewlyAddedStudent({name: studentName.trim(), id: studentId});
        setStudentName('');
        setStudentFatherName('');
        setStudentMobileNumber('');
        setStudentAddress('');
        setSelectedClass('');
        setIsAddingStudent(false);
    };

    if (isAuthLoading || isProfileLoading) {
        return (
             <div className="flex items-center justify-center min-h-screen">
                <p>Loading teacher dashboard...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Classes</CardTitle>
                            <CardDescription>Here are the classes you've created.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {classesLoading && <p>Loading classes...</p>}
                            {classes && classes.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {classes.map((c) => (
                                        <Card key={c.id}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{c.title}</CardTitle>
                                                <CardDescription>{c.subject} ({c.batchTime})</CardDescription>
                                            </CardHeader>
                                            <CardFooter>
                                                 <div className="text-sm text-muted-foreground">Class Code: <span className="font-mono text-base font-bold text-foreground">{c.classCode}</span></div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !classesLoading && <p className="text-center text-muted-foreground py-8">You haven't created any classes yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddStudent} className="space-y-4 p-4 border rounded-lg">
                                <h3 className="text-lg font-medium">Add New Student</h3>
                                <div className="space-y-2">
                                    <Label>Select Class</Label>
                                    <Select onValueChange={setSelectedClass} value={selectedClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a class to add the student to" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes && classes.map(c => <SelectItem key={c.id} value={c.id}>{c.title} - {c.subject} ({c.batchTime})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="student-name">Student Full Name</Label>
                                        <Input
                                            id="student-name"
                                            placeholder="e.g., Jane Doe"
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="student-father-name">Father's Name</Label>
                                        <Input
                                            id="student-father-name"
                                            placeholder="e.g., John Doe"
                                            value={studentFatherName}
                                            onChange={(e) => setStudentFatherName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="student-mobile">Mobile Number</Label>
                                        <Input
                                            id="student-mobile"
                                            placeholder="e.g., 9876543210"
                                            value={studentMobileNumber}
                                            onChange={(e) => setStudentMobileNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="student-address">Address</Label>
                                        <Input
                                            id="student-address"
                                            placeholder="e.g., 123 Main St, Anytown"
                                            value={studentAddress}
                                            onChange={(e) => setStudentAddress(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isAddingStudent || !selectedClass} className="w-full">
                                    {isAddingStudent ? 'Generating ID...' : 'Generate Student ID'}
                                </Button>
                                {newlyAddedStudent && (
                                    <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded-lg">
                                        <p className="font-bold">Student ID Generated!</p>
                                        <p>Share this ID with <span className="font-semibold">{newlyAddedStudent.name}</span> to allow them to sign up.</p>
                                        <p className="mt-2">Student ID: <span className="font-mono text-base font-bold">{newlyAddedStudent.id}</span></p>
                                    </div>
                                )}
                            </form>

                            <div className="mt-6">
                                <h3 className="text-lg font-medium">Pending Student Signups</h3>
                                <CardDescription>Students who have been given an ID but have not yet created their account.</CardDescription>
                                {pendingStudentsLoading && <p className="mt-4">Loading pending students...</p>}
                                {pendingStudents && pendingStudents.length > 0 ? (
                                    <div className="mt-4 space-y-2">
                                        {pendingStudents.map(s => (
                                            <div key={s.id} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                                                <p><span className="font-semibold">{s.studentName}</span> (for class: {s.classTitle})</p>
                                                <p className="text-sm text-muted-foreground">ID: <span className="font-mono font-bold text-foreground">{s.id}</span></p>
                                            </div>
                                        ))}
                                    </div>
                                ): (
                                    !pendingStudentsLoading && <p className="text-center text-muted-foreground pt-4">No students are pending signup.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Create a New Class</CardTitle>
                            <CardDescription>Fill in the details to create a new class batch.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateClass} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Class Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Grade 10 Physics"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        placeholder="e.g., Physics"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="batch-time">Batch Timing</Label>
                                    <Input
                                        id="batch-time"
                                        placeholder="e.g., 10:00 AM - 11:30 AM"
                                        value={batchTime}
                                        onChange={(e) => setBatchTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={isCreatingClass} className="w-full">
                                    {isCreatingClass ? 'Creating...' : 'Create Class'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
