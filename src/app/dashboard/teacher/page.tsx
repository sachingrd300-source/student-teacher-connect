
'use client';

import { FormEvent, useState } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp, addDoc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';


interface Class {
    id: string;
    title: string;
    subject: string;
    batchTime: string;
    classCode: string;
    createdAt?: Timestamp;
}

interface EnrolledStudent {
    id: string;
    studentId: string;
    studentName: string;
    mobileNumber: string;
    createdAt?: Timestamp;
}

function StudentListForClass({ classId }: { classId: string }) {
    const firestore = useFirestore();

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'enrollments'), where('classId', '==', classId));
    }, [firestore, classId]);

    const { data: students, isLoading } = useCollection<EnrolledStudent>(enrollmentsQuery);

    if (isLoading) {
        return <p>Loading students...</p>;
    }

    if (!students || students.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No students are enrolled in this class yet.</p>;
    }

    return (
        <div className="mt-4 border rounded-lg">
            <table className="w-full text-sm">
                <thead className="text-left bg-muted">
                    <tr className="border-b">
                        <th className="p-3 font-medium">Student Name</th>
                        <th className="p-3 font-medium">Mobile Number</th>
                        <th className="p-3 font-medium">Student ID</th>
                        <th className="p-3 font-medium">Enrolled On</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.id} className="border-b last:border-0">
                            <td className="p-3">{student.studentName}</td>
                            <td className="p-3">{student.mobileNumber}</td>
                            <td className="p-3 font-mono">{student.studentId}</td>
                            <td className="p-3">
                                {student.createdAt ? student.createdAt.toDate().toLocaleString() : '...'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
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
    const [studentDateOfBirth, setStudentDateOfBirth] = useState('');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [studentCreationError, setStudentCreationError] = useState<string | null>(null);
    const [newlyAddedStudent, setNewlyAddedStudent] = useState<{name: string, id: string, pass: string} | null>(null);

    // State for editing a class
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    
    // State for viewing students in a class
    const [viewingStudentsForClass, setViewingStudentsForClass] = useState<Class | null>(null);


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

    const handleCreateStudentLogin = (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !selectedClass || !studentName.trim() || !firestore || !studentDateOfBirth) return;
        
        setIsAddingStudent(true);
        setNewlyAddedStudent(null);
        setStudentCreationError(null);

        const classData = classes?.find(c => c.id === selectedClass);
        if (!classData) {
            setStudentCreationError("Selected class not found.");
            setIsAddingStudent(false);
            return;
        }

        const studentLoginId = nanoid(8);
        const email = `${studentLoginId}@educonnect.pro`; // This is a "hidden" email for Firebase Auth
        const password = studentDateOfBirth; // The student's date of birth is their password

        // We use a secondary Firebase App instance to create a new user.
        // This is crucial to avoid logging out the currently signed-in teacher.
        let secondaryApp;
        try {
            secondaryApp = initializeApp(firebaseConfig, 'student-creator');
        } catch (error) {
            secondaryApp = getApp('student-creator'); // Get existing instance if already initialized
        }
        const secondaryAuth = getAuth(secondaryApp);

        createUserWithEmailAndPassword(secondaryAuth, email, password)
            .then(userCredential => {
                const newUser = userCredential.user;

                // 2. Create the User document in Firestore
                const userRef = doc(firestore, `users/${newUser.uid}`);
                const userProfileData = {
                    id: newUser.uid,
                    studentLoginId: studentLoginId, // The ID the student uses to log in
                    name: studentName.trim(),
                    fatherName: studentFatherName.trim(),
                    mobileNumber: studentMobileNumber.trim(),
                    address: studentAddress.trim(),
                    email: email, // Store the internal-facing email
                    role: 'student',
                    dateOfBirth: studentDateOfBirth,
                    createdAt: serverTimestamp(),
                    status: 'approved',
                };
                setDocumentNonBlocking(userRef, userProfileData, {});

                // 3. Create the Enrollment document
                const enrollmentData = {
                    studentId: newUser.uid,
                    studentName: studentName.trim(),
                    mobileNumber: studentMobileNumber.trim(),
                    classId: selectedClass,
                    teacherId: user.uid,
                    classTitle: classData.title,
                    classSubject: classData.subject,
                    teacherName: userProfile.name,
                    status: 'approved',
                    createdAt: serverTimestamp(),
                };
                const enrollmentsColRef = collection(firestore, 'enrollments');
                addDocumentNonBlocking(enrollmentsColRef, enrollmentData);
                
                // 4. Show the credentials to the teacher
                setNewlyAddedStudent({ name: studentName.trim(), id: studentLoginId, pass: studentDateOfBirth });
                setStudentName('');
                setStudentFatherName('');
                setStudentMobileNumber('');
                setStudentAddress('');
                setStudentDateOfBirth('');
                setSelectedClass('');
            })
            .catch(error => {
                console.error("Error creating student auth user:", error);
                setStudentCreationError(`Failed to create student login: ${error.message}`);
            })
            .finally(() => {
                setIsAddingStudent(false);
            });
    };

    const handleUpdateClass = (e: FormEvent) => {
        e.preventDefault();
        if (!firestore || !editingClass) return;

        const classRef = doc(firestore, 'classes', editingClass.id);
        const updatedData = {
            title: editingClass.title,
            subject: editingClass.subject,
            batchTime: editingClass.batchTime,
        };

        updateDocumentNonBlocking(classRef, updatedData);
        setEditingClass(null);
    };

    const handleDeleteClass = (classId: string) => {
        if (!firestore) return;
        if (window.confirm('Are you sure you want to delete this class? This will not delete the students, but it will remove the class itself. This action cannot be undone.')) {
            const classRef = doc(firestore, 'classes', classId);
            deleteDocumentNonBlocking(classRef);
        }
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
                                                {c.createdAt && (
                                                    <CardDescription className="text-xs pt-2">
                                                        Created: {c.createdAt.toDate().toLocaleString()}
                                                    </CardDescription>
                                                )}
                                            </CardHeader>
                                            <CardFooter className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Class Code:</div>
                                                    <div className="font-mono text-base font-bold text-foreground">{c.classCode}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                     <Button variant="outline" size="sm" onClick={() => setViewingStudentsForClass(c)}>
                                                        <Users className="h-4 w-4 mr-1" />
                                                        Students
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => setEditingClass(c)}>
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(c.id)}>
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
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
                            <form onSubmit={handleCreateStudentLogin} className="space-y-4 p-4 border rounded-lg">
                                <h3 className="text-lg font-medium">Create Student Login</h3>
                                <div className="space-y-2">
                                    <Label>Select Class</Label>
                                    <Select onValueChange={setSelectedClass} value={selectedClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a class to enroll the student in" />
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
                                 <div className="space-y-2">
                                    <Label htmlFor="student-dob">Student's Date of Birth (Password)</Label>
                                    <Input
                                        id="student-dob"
                                        type="date"
                                        value={studentDateOfBirth}
                                        onChange={(e) => setStudentDateOfBirth(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">The student will use this as their password to log in. Format: YYYY-MM-DD.</p>
                                </div>
                                <Button type="submit" disabled={isAddingStudent || !selectedClass} className="w-full">
                                    {isAddingStudent ? 'Creating Login...' : 'Create Student Login'}
                                </Button>
                                {studentCreationError && (
                                     <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded-lg">
                                        <p className="font-bold">Error</p>
                                        <p>{studentCreationError}</p>
                                    </div>
                                )}
                                {newlyAddedStudent && (
                                    <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded-lg">
                                        <p className="font-bold">Student Login Created!</p>
                                        <p>Share these credentials with <span className="font-semibold">{newlyAddedStudent.name}</span>.</p>
                                        <div className="mt-2 space-y-1">
                                            <p>Student ID: <span className="font-mono text-base font-bold">{newlyAddedStudent.id}</span></p>
                                            <p>Password: <span className="font-mono text-base font-bold">{newlyAddedStudent.pass}</span></p>
                                        </div>
                                    </div>
                                )}
                            </form>
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

            {editingClass && (
                <Dialog open={!!editingClass} onOpenChange={(isOpen) => !isOpen && setEditingClass(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Class: {editingClass.title}</DialogTitle>
                            <DialogDescription>
                                Make changes to your class details here. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateClass} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Class Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editingClass.title}
                                    onChange={(e) => setEditingClass({ ...editingClass, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-subject">Subject</Label>
                                <Input
                                    id="edit-subject"
                                    value={editingClass.subject}
                                    onChange={(e) => setEditingClass({ ...editingClass, subject: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-batch-time">Batch Timing</Label>
                                <Input
                                    id="edit-batch-time"
                                    value={editingClass.batchTime}
                                    onChange={(e) => setEditingClass({ ...editingClass, batchTime: e.target.value })}
                                    required
                                />
                            </div>
                             <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setEditingClass(null)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {viewingStudentsForClass && (
                <Dialog open={!!viewingStudentsForClass} onOpenChange={(isOpen) => !isOpen && setViewingStudentsForClass(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Students in {viewingStudentsForClass.title}</DialogTitle>
                            <DialogDescription>
                                Here is a list of all students enrolled in this class.
                            </DialogDescription>
                        </DialogHeader>
                        <StudentListForClass classId={viewingStudentsForClass.id} />
                         <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setViewingStudentsForClass(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}

    