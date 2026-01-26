'use client';

import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp, getDocs, limit, orderBy, addDoc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Trash2, BarChartHorizontal, Megaphone, Send, Wand2 } from 'lucide-react';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { generateAnnouncement } from '@/ai/flows/announcement-generator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';


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
    paymentStatus: 'paid' | 'unpaid';
}

interface StudentProfile {
    id: string; // Auth UID
    name: string;
    email: string;
    mobileNumber: string;
}

interface Announcement {
    id: string;
    content: string;
    createdAt: Timestamp;
}

function AnnouncementsForClass({ classId, teacherId, teacherName, classTitle }: { classId: string; teacherId: string; teacherName: string; classTitle: string }) {
    const firestore = useFirestore();
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // State for AI generator
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [aiKeyPoints, setAiKeyPoints] = useState('');
    const [aiTone, setAiTone] = useState<'Formal' | 'Casual'>('Casual');
    const [isGenerating, setIsGenerating] = useState(false);


    const announcementsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'announcements'), where('classId', '==', classId), orderBy('createdAt', 'desc'));
    }, [firestore, classId]);

    const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

    const handlePostAnnouncement = async (e: FormEvent) => {
        e.preventDefault();
        if (!newAnnouncement.trim() || !firestore) return;
        setIsPosting(true);

        const announcementsColRef = collection(firestore, 'announcements');
        await addDocumentNonBlocking(announcementsColRef, {
            classId,
            teacherId,
            teacherName,
            classTitle,
            content: newAnnouncement,
            createdAt: serverTimestamp(),
        });

        setNewAnnouncement('');
        setIsPosting(false);
    };

    const handleDeleteAnnouncement = (announcementId: string) => {
        if (!firestore) return;
        if (window.confirm("Are you sure you want to delete this announcement?")) {
            deleteDocumentNonBlocking(doc(firestore, 'announcements', announcementId));
        }
    };

    const handleGenerateAnnouncement = async (e: FormEvent) => {
        e.preventDefault();
        if (!aiKeyPoints.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateAnnouncement({ keyPoints: aiKeyPoints, tone: aiTone });
            setNewAnnouncement(result.content);
            setIsAiDialogOpen(false);
            setAiKeyPoints('');
        } catch (error) {
            console.error("Failed to generate announcement:", error);
            alert("An error occurred while generating the announcement.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Class Announcements</CardTitle>
                <CardDescription>Post updates and messages for your students here.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePostAnnouncement} className="space-y-2 mb-6">
                     <Label htmlFor="announcement-text">Your message</Label>
                    <div className="flex gap-2">
                        <Textarea
                            id="announcement-text"
                            placeholder="Type your announcement here, or generate one with AI."
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            required
                            rows={3}
                        />
                        <Button type="submit" disabled={isPosting}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                     <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setIsAiDialogOpen(true)}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate with AI
                    </Button>
                </form>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {isLoading && <p>Loading announcements...</p>}
                    {announcements && announcements.length > 0 ? (
                        announcements.map(announcement => (
                            <div key={announcement.id} className="text-sm p-3 rounded-lg bg-muted relative group">
                                <p>{announcement.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(announcement.createdAt?.seconds * 1000).toLocaleString()}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1 right-1 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        !isLoading && <p className="text-center text-muted-foreground py-4">No announcements yet.</p>
                    )}
                </div>
            </CardContent>

             <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>AI Announcement Assistant</DialogTitle>
                        <DialogDescription>
                            Provide a few key points and let the AI write the full announcement for you.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGenerateAnnouncement} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="ai-key-points">Key Points</Label>
                            <Textarea
                                id="ai-key-points"
                                placeholder="e.g., Test on Friday, Chapter 5. Bring calculator."
                                value={aiKeyPoints}
                                onChange={(e) => setAiKeyPoints(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tone</Label>
                            <RadioGroup
                                value={aiTone}
                                onValueChange={(value: 'Formal' | 'Casual') => setAiTone(value)}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Casual" id="tone-casual" />
                                    <Label htmlFor="tone-casual">Casual</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Formal" id="tone-formal" />
                                    <Label htmlFor="tone-formal">Formal</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsAiDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isGenerating}>
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}


function StudentListForClass({ classId, teacherId }: { classId: string, teacherId: string }) {
    const firestore = useFirestore();
    const [currentTab, setCurrentTab] = useState('all');

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'enrollments'), where('classId', '==', classId), where('teacherId', '==', teacherId), orderBy('createdAt', 'desc'));
    }, [firestore, classId, teacherId]);

    const { data: enrolledStudents, isLoading } = useCollection<EnrolledStudent>(enrollmentsQuery);

    const studentUids = useMemo(() => enrolledStudents?.map(s => s.studentId) || [], [enrolledStudents]);

    const studentsProfileQuery = useMemoFirebase(() => {
        if (!firestore || studentUids.length === 0) return null;
        return query(collection(firestore, 'users'), where('__name__', 'in', studentUids));
    }, [firestore, studentUids]);

    const { data: studentProfiles, isLoading: profilesLoading } = useCollection<StudentProfile>(studentsProfileQuery);
    
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
    
    const handlePaymentStatusChange = (enrollmentId: string, isPaid: boolean) => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
        updateDocumentNonBlocking(enrollmentRef, {
            paymentStatus: isPaid ? 'paid' : 'unpaid'
        });
    };

    const studentsToDisplay = useMemo(() => {
        if (!enrolledStudents) return [];
        if (currentTab === 'all') return enrolledStudents;
        return enrolledStudents.filter(s => s.paymentStatus === currentTab);
    }, [enrolledStudents, currentTab]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>Manage students and their payment status for this class.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">All ({enrolledStudents?.length || 0})</TabsTrigger>
                        <TabsTrigger value="paid">Paid ({enrolledStudents?.filter(s => s.paymentStatus === 'paid').length || 0})</TabsTrigger>
                        <TabsTrigger value="unpaid">Unpaid ({enrolledStudents?.filter(s => s.paymentStatus === 'unpaid').length || 0})</TabsTrigger>
                    </TabsList>
                </Tabs>
                
                {(isLoading || profilesLoading) ? <p className="text-center py-4">Loading students...</p> : 
                studentsToDisplay.length === 0 ? <p className="text-center text-muted-foreground py-8">No students found in this category.</p> :
                (
                    <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead className="text-left bg-muted">
                                <tr className="border-b">
                                    <th className="p-3 font-medium">Student Name</th>
                                    <th className="p-3 font-medium">Email</th>
                                    <th className="p-3 font-medium">Joined On</th>
                                    <th className="p-3 font-medium">Payment Status</th>
                                    <th className="p-3 font-medium text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentsToDisplay.map(student => {
                                    const profile = studentProfileMap.get(student.studentId);
                                    return (
                                        <tr key={student.id} className="border-b last:border-0">
                                            <td className="p-3 whitespace-nowrap font-medium">
                                                <Link href={`/dashboard/profile/${student.studentId}`} className="hover:underline text-primary">
                                                    {student.studentName}
                                                </Link>
                                            </td>
                                            <td className="p-3 text-muted-foreground">{profile?.email || '...'}</td>
                                            <td className="p-3 text-muted-foreground">{student.createdAt ? new Date(student.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-3">
                                                 <div className="flex items-center gap-2">
                                                    <Switch 
                                                        id={`payment-${student.id}`}
                                                        checked={student.paymentStatus === 'paid'} 
                                                        onCheckedChange={(isChecked) => handlePaymentStatusChange(student.id, isChecked)} 
                                                    />
                                                    <Label htmlFor={`payment-${student.id}`} className="capitalize font-medium">{student.paymentStatus}</Label>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveStudent(student.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function ClassDetailsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{name: string}>(userProfileRef);

    const classRef = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return doc(firestore, 'classes', classId);
    }, [firestore, classId]);
    const { data: classData, isLoading: isClassLoading } = useDoc<Class>(classRef);

    // State for creating a new student
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentPassword, setStudentPassword] = useState('');
    const [studentMobileNumber, setStudentMobileNumber] = useState('');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [studentCreationError, setStudentCreationError] = useState<string | null>(null);
    const [newlyAddedStudent, setNewlyAddedStudent] = useState<{name: string, email: string, pass: string} | null>(null);

    // State for enrolling an existing student
    const [searchStudentEmail, setSearchStudentEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundStudent, setFoundStudent] = useState<StudentProfile | null>(null);
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollMessage, setEnrollMessage] = useState<string | null>(null);
    
    useEffect(() => {
        setFoundStudent(null);
        setSearchMessage(null);
        setSearchStudentEmail('');
        setEnrollMessage(null);
    }, [classId]);

    const handleSearchStudent = async () => {
        if (!firestore || !searchStudentEmail.trim()) return;

        setIsSearching(true);
        setFoundStudent(null);
        setSearchMessage(null);
        setEnrollMessage(null);

        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', searchStudentEmail.trim()), where('role', '==', 'student'), limit(1));
        
        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setSearchMessage('No student found with this email address.');
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
            batchTime: classData.batchTime,
            status: 'approved',
            paymentStatus: 'unpaid',
            createdAt: serverTimestamp(),
        };

        await addDoc(enrollmentsRef, enrollmentData);
        setEnrollMessage(`Successfully enrolled ${foundStudent.name} in ${classData.title}.`);
        setIsEnrolling(false);
        setFoundStudent(null);
        setSearchStudentEmail('');
    };

    const handleCreateStudentLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !classId || !studentName.trim() || !studentEmail.trim() || !firestore || !studentPassword.trim() || !classData) return;
        
        setIsAddingStudent(true);
        setNewlyAddedStudent(null);
        setStudentCreationError(null);

        const email = studentEmail.trim(); 
        const password = studentPassword.trim(); 

        let secondaryApp;
        const appName = 'student-creator';
        
        try {
            secondaryApp = getApp(appName);
            await deleteApp(secondaryApp);
        } catch (error) {}

        secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;

            const userRef = doc(firestore, `users/${newUser.uid}`);
            const userProfileData = {
                id: newUser.uid,
                name: studentName.trim(),
                mobileNumber: studentMobileNumber.trim(),
                email: email, 
                role: 'student',
                createdAt: serverTimestamp(),
                status: 'approved',
            };
            await setDoc(userRef, userProfileData);

            const enrollmentData = {
                studentId: newUser.uid,
                studentName: studentName.trim(),
                mobileNumber: studentMobileNumber.trim(),
                classId: classId,
                teacherId: user.uid,
                classTitle: classData.title,
                classSubject: classData.subject,
                teacherName: userProfile.name,
                batchTime: classData.batchTime,
                status: 'approved',
                paymentStatus: 'unpaid',
                createdAt: serverTimestamp(),
            };
            const enrollmentsColRef = collection(firestore, 'enrollments');
            await addDoc(enrollmentsColRef, enrollmentData);
            
            setNewlyAddedStudent({ name: studentName.trim(), email: email, pass: password });
            setStudentName('');
            setStudentEmail('');
            setStudentMobileNumber('');
            setStudentPassword('');

        } catch (error: any) {
            console.error("Error creating student auth user:", error);
            if (error.code === 'auth/email-already-in-use') {
                setStudentCreationError(`This email is already in use by another account.`);
            } else if (error.code === 'auth/weak-password') {
                setStudentCreationError('Password is too weak. It must be at least 6 characters long.');
            }
             else {
                setStudentCreationError(`Failed to create student login: ${error.message}`);
            }
        } finally {
            setIsAddingStudent(false);
            await deleteApp(secondaryApp);
        }
    };
    
    if (isClassLoading || isProfileLoading) {
         return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile?.name} userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading class details...</p>
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile?.name} userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <Card>
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                            <CardDescription>Class not found.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button asChild>
                                <Link href="/dashboard/teacher">Go Back to Dashboard</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
             <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <Link href="/dashboard/teacher" className="text-sm text-primary hover:underline mb-2 inline-block">
                                &larr; Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold">{classData.title}</h1>
                            <p className="text-muted-foreground">{classData.subject} ({classData.batchTime})</p>
                            <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Class Code: </span>
                                <span className="font-mono text-base font-bold text-foreground">{classData.classCode}</span>
                            </div>
                        </div>
                         <div>
                            <Button asChild>
                                <Link href={`/dashboard/teacher/class/${classId}/performance`}>
                                    <BarChartHorizontal className="mr-2 h-4 w-4" />
                                    View Performance
                                </Link>
                            </Button>
                        </div>
                    </div>
                    
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                            {user && <StudentListForClass classId={classId} teacherId={user.uid} />}
                            {user && userProfile && classData && <AnnouncementsForClass classId={classId} teacherId={user.uid} teacherName={userProfile.name} classTitle={classData.title} />}
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
                                                placeholder="Enter Student Email"
                                                value={searchStudentEmail}
                                                onChange={(e) => setSearchStudentEmail(e.target.value)}
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
                                                <Label htmlFor="student-email">Student Email</Label>
                                                <Input id="student-email" type="email" placeholder="e.g., student@example.com" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="student-password">Set Password</Label>
                                                <Input id="student-password" type="text" placeholder="Set a temporary password" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="student-mobile">Mobile Number</Label>
                                                <Input id="student-mobile" placeholder="e.g., 9876543210" value={studentMobileNumber} onChange={(e) => setStudentMobileNumber(e.target.value)} />
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
                                                            <p className="text-xs font-semibold">Email:</p> 
                                                            <p className="font-mono text-base font-bold">{newlyAddedStudent.email}</p>
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
