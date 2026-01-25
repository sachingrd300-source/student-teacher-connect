'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp, addDoc, setDoc, getDocs, limit } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Users, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';


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
    studentId: string; // This is the auth UID
    studentName: string;
    mobileNumber: string;
    createdAt?: Timestamp;
}

interface StudentProfile {
    id: string; // Auth UID
    name: string;
    studentLoginId: string; // The short ID for login
    mobileNumber: string;
}

function StudentListForClass({ classId }: { classId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();

    // This query gets enrollments, which link students to classes
    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('classId', '==', classId), where('teacherId', '==', user.uid));
    }, [firestore, classId, user]);

    const { data: enrolledStudents, isLoading } = useCollection<EnrolledStudent>(enrollmentsQuery);

    // We need another query to get the `studentLoginId` from the `users` collection
    const studentUids = useMemo(() => enrolledStudents?.map(s => s.studentId) || [], [enrolledStudents]);

    const studentsProfileQuery = useMemoFirebase(() => {
        if (!firestore || studentUids.length === 0) return null;
        return query(collection(firestore, 'users'), where('id', 'in', studentUids));
    }, [firestore, studentUids]);

    const { data: studentProfiles } = useCollection<StudentProfile>(studentsProfileQuery);
    
    // Create a map for easy lookup
    const studentProfileMap = useMemo(() => {
        const map = new Map<string, StudentProfile>();
        studentProfiles?.forEach(p => map.set(p.id, p));
        return map;
    }, [studentProfiles]);

    if (isLoading) {
        return <p>Loading students...</p>;
    }

    if (!enrolledStudents || enrolledStudents.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No students are enrolled in this class yet.</p>;
    }

    return (
        <div className="mt-4 border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
                <thead className="text-left bg-muted">
                    <tr className="border-b">
                        <th className="p-3 font-medium">Student Name</th>
                        <th className="p-3 font-medium">Mobile Number</th>
                        <th className="p-3 font-medium">Student Login ID</th>
                        <th className="p-3 font-medium">Enrolled On</th>
                    </tr>
                </thead>
                <tbody>
                    {enrolledStudents.map(student => {
                        const profile = studentProfileMap.get(student.studentId);
                        return (
                            <tr key={student.id} className="border-b last:border-0">
                                <td className="p-3 whitespace-nowrap">{student.studentName}</td>
                                <td className="p-3">{student.mobileNumber}</td>
                                <td className="p-3 font-mono">{profile?.studentLoginId || '...'}</td>
                                <td className="p-3 whitespace-nowrap">
                                    {student.createdAt ? student.createdAt.toDate().toLocaleString() : '...'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}


export default function TeacherDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();

    // State for Create Class form
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [batchTime, setBatchTime] = useState('');
    const [isCreatingClass, setIsCreatingClass] = useState(false);

    // State for Manage Students section
    const [selectedClass, setSelectedClass] = useState('');
    
    // State for creating a new student
    const [studentName, setStudentName] = useState('');
    const [studentFatherName, setStudentFatherName] = useState('');
    const [studentMobileNumber, setStudentMobileNumber] = useState('');
    const [studentAddress, setStudentAddress] = useState('');
    const [studentDateOfBirth, setStudentDateOfBirth] = useState('');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [studentCreationError, setStudentCreationError] = useState<string | null>(null);
    const [newlyAddedStudent, setNewlyAddedStudent] = useState<{name: string, id: string, pass: string} | null>(null);

    // State for enrolling an existing student
    const [searchStudentId, setSearchStudentId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundStudent, setFoundStudent] = useState<StudentProfile | null>(null);
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

    // State for editing a class
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    
    // State for viewing students in a class
    const [viewingStudentsForClass, setViewingStudentsForClass] = useState<Class | null>(null);


    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string}>(userProfileRef);

    const isTutor = userProfile?.role === 'tutor';

    useEffect(() => {
        if (isAuthLoading || isProfileLoading) {
            return;
        }
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && !isTutor) {
            router.replace('/dashboard/student');
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, isTutor, router]);

    const classesQuery = useMemoFirebase(() => {
        if (!isTutor || !firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user, isTutor]);

    const { data: classes, isLoading: classesLoading } = useCollection<Class>(classesQuery);
    
    // Reset search when selected class changes
    useEffect(() => {
        setFoundStudent(null);
        setSearchMessage(null);
        setSearchStudentId('');
        setEnrollMessage(null);
    }, [selectedClass]);

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

    const handleSearchStudent = async () => {
        if (!firestore || !searchStudentId.trim()) return;

        setIsSearching(true);
        setFoundStudent(null);
        setSearchMessage(null);
        setEnrollMessage(null);

        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('studentLoginId', '==', searchStudentId.trim()), limit(1));
        
        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setSearchMessage('No student found with this Login ID.');
            } else {
                const studentDoc = querySnapshot.docs[0];
                setFoundStudent({ id: studentDoc.id, ...studentDoc.data() } as StudentProfile);
            }
        } catch (error) {
            console.error('Error searching for student: ', error);
            setSearchMessage('An error occurred while searching.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleEnrollExistingStudent = async () => {
        if (!firestore || !user || !userProfile || !foundStudent || !selectedClass) return;

        setIsEnrolling(true);
        setEnrollMessage(null);

        const classData = classes?.find(c => c.id === selectedClass);
        if (!classData) {
            setEnrollMessage("Selected class not found.");
            setIsEnrolling(false);
            return;
        }
        
        // Check if student is already enrolled
        const enrollmentsRef = collection(firestore, 'enrollments');
        const q = query(enrollmentsRef, where('studentId', '==', foundStudent.id), where('classId', '==', selectedClass));
        const existingEnrollment = await getDocs(q);

        if (!existingEnrollment.empty) {
            setEnrollMessage('This student is already enrolled in this class.');
            setIsEnrolling(false);
            return;
        }

        // Create new enrollment
        const enrollmentData = {
            studentId: foundStudent.id,
            studentName: foundStudent.name,
            mobileNumber: foundStudent.mobileNumber,
            classId: selectedClass,
            teacherId: user.uid,
            classTitle: classData.title,
            classSubject: classData.subject,
            teacherName: userProfile.name,
            status: 'approved',
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(enrollmentsRef, enrollmentData);
        setEnrollMessage(`Successfully enrolled ${foundStudent.name} in ${classData.title}.`);
        setIsEnrolling(false);
        setFoundStudent(null);
        setSearchStudentId('');
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
        const email = `${studentLoginId}@educonnect.pro`; 
        const password = studentDateOfBirth; 

        let secondaryApp;
        try {
            secondaryApp = initializeApp(firebaseConfig, 'student-creator');
        } catch (error) {
            secondaryApp = getApp('student-creator'); 
        }
        const secondaryAuth = getAuth(secondaryApp);

        createUserWithEmailAndPassword(secondaryAuth, email, password)
            .then(userCredential => {
                const newUser = userCredential.user;

                const userRef = doc(firestore, `users/${newUser.uid}`);
                const userProfileData = {
                    id: newUser.uid,
                    studentLoginId: studentLoginId, 
                    name: studentName.trim(),
                    fatherName: studentFatherName.trim(),
                    mobileNumber: studentMobileNumber.trim(),
                    address: studentAddress.trim(),
                    email: email, 
                    role: 'student',
                    dateOfBirth: studentDateOfBirth,
                    createdAt: serverTimestamp(),
                    status: 'approved',
                };
                setDocumentNonBlocking(userRef, userProfileData, {});

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
                
                setNewlyAddedStudent({ name: studentName.trim(), id: studentLoginId, pass: studentDateOfBirth });
                setStudentName('');
                setStudentFatherName('');
                setStudentMobileNumber('');
                setStudentAddress('');
                setStudentDateOfBirth('');
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

    if (isAuthLoading || isProfileLoading || !userProfile) {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading teacher dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isTutor) {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile.name} userRole="student" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Unauthorized. Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
                    <div className="grid gap-8 lg:grid-cols-3 animate-fade-in-down">
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
                                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewingStudentsForClass(c)}>
                                                                <Users className="h-4 w-4" />
                                                                <span className="sr-only">View Students</span>
                                                            </Button>
                                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingClass(c)}>
                                                                <Edit className="h-4 w-4" />
                                                                 <span className="sr-only">Edit Class</span>
                                                            </Button>
                                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteClass(c.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Delete Class</span>
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
                                    <CardTitle>Manage Student Enrollment</CardTitle>
                                    <CardDescription>Enroll an existing student or create a new student account.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className='text-base font-semibold'>1. Select a Class</Label>
                                        <Select onValueChange={setSelectedClass} value={selectedClass}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a class to enroll a student in" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes && classes.map(c => <SelectItem key={c.id} value={c.id}>{c.title} - {c.subject} ({c.batchTime})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {selectedClass && (
                                    <>
                                        <div className="my-6 border-t"></div>

                                        {/* Enroll Existing Student */}
                                        <div className="space-y-4">
                                            <h3 className='text-base font-semibold'>2. Enroll an Existing Student</h3>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Enter Student Login ID"
                                                    value={searchStudentId}
                                                    onChange={(e) => setSearchStudentId(e.target.value)}
                                                />
                                                <Button onClick={handleSearchStudent} disabled={isSearching}>
                                                    <Search className="mr-2 h-4 w-4" /> {isSearching ? 'Searching...' : 'Find'}
                                                </Button>
                                            </div>
                                            {searchMessage && <p className="text-sm text-muted-foreground">{searchMessage}</p>}
                                            {foundStudent && (
                                                <Card className='bg-muted/50'>
                                                    <CardContent className="p-4 space-y-3">
                                                         <p>Found student: <span className="font-bold">{foundStudent.name}</span></p>
                                                        <Button className="w-full" onClick={handleEnrollExistingStudent} disabled={isEnrolling}>
                                                            {isEnrolling ? 'Enrolling...' : `Enroll ${foundStudent.name}`}
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            )}
                                             {enrollMessage && <p className="text-sm font-semibold text-success">{enrollMessage}</p>}
                                        </div>

                                        <div className="my-6 border-t"></div>

                                        {/* Create New Student */}
                                        <div className="space-y-4">
                                            <h3 className='text-base font-semibold'>Or, Create a New Student & Enroll</h3>
                                            <form onSubmit={handleCreateStudentLogin} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="student-name">Student Full Name</Label>
                                                        <Input id="student-name" placeholder="e.g., Jane Doe" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="student-father-name">Father's Name</Label>
                                                        <Input id="student-father-name" placeholder="e.g., John Doe" value={studentFatherName} onChange={(e) => setStudentFatherName(e.target.value)} required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="student-mobile">Mobile Number</Label>
                                                        <Input id="student-mobile" placeholder="e.g., 9876543210" value={studentMobileNumber} onChange={(e) => setStudentMobileNumber(e.target.value)} required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="student-address">Address</Label>
                                                        <Input id="student-address" placeholder="e.g., 123 Main St, Anytown" value={studentAddress} onChange={(e) => setStudentAddress(e.target.value)} required />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="student-dob">Student's Date of Birth (Password)</Label>
                                                    <Input id="student-dob" type="date" value={studentDateOfBirth} onChange={(e) => setStudentDateOfBirth(e.target.value)} required />
                                                    <p className="text-xs text-muted-foreground">The student will use this as their password to log in. Format: YYYY-MM-DD.</p>
                                                </div>
                                                <Button type="submit" disabled={isAddingStudent} className="w-full">
                                                    {isAddingStudent ? 'Creating Login...' : 'Create New Student Login & Enroll'}
                                                </Button>
                                                {studentCreationError && (
                                                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                                                        <p className="font-bold">Error</p>
                                                        <p>{studentCreationError}</p>
                                                    </div>
                                                )}
                                                {newlyAddedStudent && (
                                                    <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                                                        <p className="font-bold text-success">Student Login Created Successfully!</p>
                                                        <p className="text-sm text-success">Please share these credentials with <span className="font-semibold">{newlyAddedStudent.name}</span>.</p>
                                                        <div className="mt-3 space-y-2 bg-success/20 p-3 rounded-md">
                                                            <div>
                                                                <p className="text-xs font-semibold text-success">Student Login ID:</p> 
                                                                <p className="font-mono text-base font-bold">{newlyAddedStudent.id}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-success">Password:</p> 
                                                                <p className="font-mono text-base font-bold">{newlyAddedStudent.pass}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </form>
                                        </div>
                                    </>
                                    )}
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
                            <DialogContent className="max-w-3xl">
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
            </main>
        </div>
    );
}

    