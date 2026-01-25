'use client';

import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp, getDocs, limit } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Trash2 } from 'lucide-react';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import Link from 'next/link';

interface Class {
    id: string;
    title: string;
    subject: string;
    batchTime: string;
    classCode: string;
}

interface EnrolledStudent {
    id: string; // This is the enrollment doc id
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

function StudentListForClass({ classId, teacherId }: { classId: string, teacherId: string }) {
    const firestore = useFirestore();

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'enrollments'), where('classId', '==', classId), where('teacherId', '==', teacherId));
    }, [firestore, classId, teacherId]);

    const { data: enrolledStudents, isLoading } = useCollection<EnrolledStudent>(enrollmentsQuery);

    const studentUids = useMemo(() => enrolledStudents?.map(s => s.studentId) || [], [enrolledStudents]);

    const studentsProfileQuery = useMemoFirebase(() => {
        if (!firestore || studentUids.length === 0) return null;
        return query(collection(firestore, 'users'), where('__name__', 'in', studentUids));
    }, [firestore, studentUids]);

    const { data: studentProfiles } = useCollection<StudentProfile>(studentsProfileQuery);
    
    const studentProfileMap = useMemo(() => {
        const map = new Map<string, StudentProfile>();
        studentProfiles?.forEach(p => map.set(p.id, p));
        return map;
    }, [studentProfiles]);

    const handleRemoveStudent = (enrollmentId: string) => {
        if (!firestore) return;
        if(window.confirm("Are you sure you want to remove this student from the class? This will not delete their account.")) {
            deleteDocumentNonBlocking(doc(firestore, 'enrollments', enrollmentId));
        }
    };

    if (isLoading) {
        return <p>Loading students...</p>;
    }

    if (!enrolledStudents || enrolledStudents.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No students are enrolled in this class yet.</p>;
    }

    return (
        <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
                <thead className="text-left bg-muted">
                    <tr className="border-b">
                        <th className="p-3 font-medium">Student Name</th>
                        <th className="p-3 font-medium">Mobile Number</th>
                        <th className="p-3 font-medium">Student Login ID</th>
                        <th className="p-3 font-medium">Actions</th>
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
                                <td className="p-3">
                                    <Button variant="destructive" size="sm" onClick={() => handleRemoveStudent(student.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function ClassDetailsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;

    const { data: userProfile } = useDoc(doc(firestore, 'users', user?.uid || '---'));
    const { data: classData, isLoading: isClassLoading } = useDoc<Class>(doc(firestore, 'classes', classId));

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
    
    useEffect(() => {
        setFoundStudent(null);
        setSearchMessage(null);
        setSearchStudentId('');
        setEnrollMessage(null);
    }, [classId]);

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
        if (!firestore || !user || !userProfile || !foundStudent || !classId || !classData) return;

        setIsEnrolling(true);
        setEnrollMessage(null);

        const enrollmentsRef = collection(firestore, 'enrollments');
        const q = query(enrollmentsRef, where('studentId', '==', foundStudent.id), where('classId', '==', classId));
        const existingEnrollment = await getDocs(q);

        if (!existingEnrollment.empty) {
            setEnrollMessage('This student is already enrolled in this class.');
            setIsEnrolling(false);
            return;
        }

        const enrollmentData = {
            studentId: foundStudent.id,
            studentName: foundStudent.name,
            mobileNumber: foundStudent.mobileNumber,
            classId: classId,
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
        if (!user || !userProfile || !classId || !studentName.trim() || !firestore || !studentDateOfBirth || !classData) return;
        
        setIsAddingStudent(true);
        setNewlyAddedStudent(null);
        setStudentCreationError(null);

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
                    classId: classId,
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
    
    if (isClassLoading || !classData) {
         return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile?.name} userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading class details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
             <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="mb-6">
                        <Link href="/dashboard/teacher" className="text-sm text-primary hover:underline">
                            &larr; Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold">{classData.title}</h1>
                        <p className="text-muted-foreground">{classData.subject} ({classData.batchTime})</p>
                        <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Class Code: </span>
                            <span className="font-mono text-base font-bold text-foreground">{classData.classCode}</span>
                        </div>
                    </div>
                    
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Enrolled Students</CardTitle>
                                    <CardDescription>The list of students currently in this class.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {user && <StudentListForClass classId={classId} teacherId={user.uid} />}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add Students</CardTitle>
                                    <CardDescription>Enroll an existing student or create a new account.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div className="space-y-4">
                                        <h3 className='text-base font-semibold'>Enroll an Existing Student</h3>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter Student Login ID"
                                                value={searchStudentId}
                                                onChange={(e) => setSearchStudentId(e.target.value)}
                                            />
                                            <Button onClick={handleSearchStudent} disabled={isSearching}>
                                                <Search className="mr-2 h-4 w-4" /> {isSearching ? '...' : 'Find'}
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

                                    <div className="space-y-4">
                                        <h3 className='text-base font-semibold'>Create a New Student & Enroll</h3>
                                        <form onSubmit={handleCreateStudentLogin} className="space-y-4">
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
                                            <div className="space-y-2">
                                                <Label htmlFor="student-dob">Student's Date of Birth (Password)</Label>
                                                <Input id="student-dob" type="date" value={studentDateOfBirth} onChange={(e) => setStudentDateOfBirth(e.target.value)} required />
                                                <p className="text-xs text-muted-foreground">The student will use this as their password to log in. Format: YYYY-MM-DD.</p>
                                            </div>
                                            <Button type="submit" disabled={isAddingStudent} className="w-full">
                                                {isAddingStudent ? 'Creating Login...' : 'Create & Enroll'}
                                            </Button>
                                            {studentCreationError && (
                                                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                                                    <p className="font-bold">Error</p>
                                                    <p>{studentCreationError}</p>
                                                </div>
                                            )}
                                            {newlyAddedStudent && (
                                                <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                                                    <p className="font-bold text-success">Student Login Created & Enrolled!</p>
                                                    <p className="text-sm">Please share these credentials with <span className="font-semibold">{newlyAddedStudent.name}</span>.</p>
                                                    <div className="mt-3 space-y-2 bg-success/20 p-3 rounded-md">
                                                        <div>
                                                            <p className="text-xs font-semibold">Login ID:</p> 
                                                            <p className="font-mono text-base font-bold">{newlyAddedStudent.id}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold">Password:</p> 
                                                            <p className="font-mono text-base font-bold">{newlyAddedStudent.pass}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
             </main>
        </div>
    );
}