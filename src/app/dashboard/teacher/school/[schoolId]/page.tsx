'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, where, query, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useEffect, useState, useMemo, Fragment } from 'react';
import { nanoid } from 'nanoid';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Clipboard, Users, Book, User as UserIcon, Building2, PlusCircle, Trash2, UserPlus, FilePlus, X, Pen, Save, UserX, GraduationCap, Wallet, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SchoolFeeManagementDialog } from '@/components/school-fee-management-dialog';


// Interfaces
interface UserProfile {
    name: string;
    role?: 'teacher';
}
interface FeeEntry {
    feeMonth: number;
    feeYear: number;
    status: 'paid' | 'unpaid';
    paidOn?: string;
}

interface StudentEntry {
    id: string;
    name:string;
    rollNumber?: string;
    fatherName?: string;
    mobileNumber?: string;
    address?: string;
    admissionDate?: string;
    fees?: FeeEntry[];
}

interface ClassEntry {
    id: string;
    name: string;
    section: string;
    students?: StudentEntry[];
    teacherId?: string;
    teacherName?: string;
}

interface School {
    id: string;
    name: string;
    address: string;
    code: string;
    principalId: string;
    teacherIds?: string[];
    classes?: ClassEntry[];
    academicYear?: string;
}

interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    role: 'teacher';
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

export default function SchoolDetailsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const schoolId = params.schoolId as string;

    // State
    const [isAddTeacherOpen, setAddTeacherOpen] = useState(false);
    const [newTeacherEmail, setNewTeacherEmail] = useState('');
    const [addTeacherError, setAddTeacherError] = useState('');
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
    
    const [isAddClassOpen, setAddClassOpen] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassSection, setNewClassSection] = useState('');
    const [newClassTeacherId, setNewClassTeacherId] = useState('');
    const [isAddingClass, setIsAddingClass] = useState(false);

    const [classToManage, setClassToManage] = useState<ClassEntry | null>(null);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentRoll, setNewStudentRoll] = useState('');
    const [newStudentFatherName, setNewStudentFatherName] = useState('');
    const [newStudentMobileNumber, setNewStudentMobileNumber] = useState('');
    const [newStudentAddress, setNewStudentAddress] = useState('');
    const [newStudentAdmissionDate, setNewStudentAdmissionDate] = useState('');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    
    const [isEditingSchool, setIsEditingSchool] = useState(false);
    const [schoolName, setSchoolName] = useState('');
    const [schoolAddress, setSchoolAddress] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [isSavingSchool, setIsSavingSchool] = useState(false);

    const [studentForFees, setStudentForFees] = useState<{student: StudentEntry, classId: string} | null>(null);

    const [classToEdit, setClassToEdit] = useState<ClassEntry | null>(null);
    const [editingClassName, setEditingClassName] = useState('');
    const [editingClassSection, setEditingClassSection] = useState('');
    const [editingClassTeacherId, setEditingClassTeacherId] = useState('');
    const [isUpdatingClass, setIsUpdatingClass] = useState(false);

    // Fetch current user's profile for header
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    // Fetch school data
    const schoolRef = useMemoFirebase(() => (user && schoolId) ? doc(firestore, 'schools', schoolId) : null, [firestore, schoolId, user]);
    const { data: school, isLoading: schoolLoading } = useDoc<School>(schoolRef);

    // Fetch profiles of teachers in the school
    const teachersQuery = useMemoFirebase(() => {
        if (!firestore || !school || !school.teacherIds || school.teacherIds.length === 0) return null;
        // Firestore 'in' query is limited to 30 elements. For larger schools, this would need pagination or a different data model.
        return query(collection(firestore, 'users'), where('__name__', 'in', (school.teacherIds || []).slice(0, 30)));
    }, [firestore, school]);
    const { data: teachers, isLoading: teachersLoading } = useCollection<TeacherProfile>(teachersQuery);

    const totalStudents = useMemo(() => {
        if (!school || !school.classes) return 0;
        return school.classes.reduce((acc, currentClass) => acc + (currentClass.students?.length || 0), 0);
    }, [school]);

    // Security check: ensure user is the principal
    useEffect(() => {
        if (school && user && school.principalId !== user.uid) {
            router.replace('/dashboard/teacher');
        }
    }, [school, user, router]);

    useEffect(() => {
        if (school) {
            setSchoolName(school.name || '');
            setSchoolAddress(school.address || '');
            setAcademicYear(school.academicYear || '');
        }
    }, [school]);

    useEffect(() => {
        if (classToEdit) {
            setEditingClassName(classToEdit.name);
            setEditingClassSection(classToEdit.section);
            setEditingClassTeacherId(classToEdit.teacherId || '');
        }
    }, [classToEdit]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // --- Handler Functions ---

     const handleUpdateSchool = async () => {
        if (!schoolName.trim() || !school) return;
        setIsSavingSchool(true);
        try {
            await updateDoc(schoolRef, {
                name: schoolName.trim(),
                address: schoolAddress.trim(),
                academicYear: academicYear.trim(),
            });
            setIsEditingSchool(false);
        } catch (error) {
            console.error("Error updating school details:", error);
        } finally {
            setIsSavingSchool(false);
        }
    };

    const handleAddTeacher = async () => {
        if (!newTeacherEmail.trim()) return;
        setIsAddingTeacher(true);
        setAddTeacherError('');

        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('email', '==', newTeacherEmail.trim()), where('role', '==', 'teacher'));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setAddTeacherError('No teacher found with this email or user is not a teacher.');
                return;
            }

            const teacherDoc = querySnapshot.docs[0];
            const teacherId = teacherDoc.id;

            if (school?.teacherIds?.includes(teacherId)) {
                setAddTeacherError('This teacher is already in the school.');
                return;
            }

            await updateDoc(schoolRef, { teacherIds: arrayUnion(teacherId) });
            setNewTeacherEmail('');
            setAddTeacherOpen(false);

        } catch (error) {
            setAddTeacherError('An error occurred. Please try again.');
            console.error("Error adding teacher: ", error);
        } finally {
            setIsAddingTeacher(false);
        }
    };
    
    const handleRemoveTeacher = async (teacherId: string) => {
        if (teacherId === school?.principalId) return; // Cannot remove the principal
        await updateDoc(schoolRef, { teacherIds: arrayRemove(teacherId) });
    };

    const handleAddClass = async () => {
        if (!newClassName.trim() || !newClassSection.trim() || !school) return;
        setIsAddingClass(true);

        const selectedTeacher = teachers?.find(t => t.id === newClassTeacherId);

        const newClass: ClassEntry = {
            id: nanoid(),
            name: newClassName.trim(),
            section: newClassSection.trim(),
            students: [],
            teacherId: selectedTeacher?.id,
            teacherName: selectedTeacher?.name
        };
        
        await updateDoc(schoolRef, { classes: arrayUnion(newClass) });
        
        setNewClassName('');
        setNewClassSection('');
        setNewClassTeacherId('');
        setIsAddingClass(false);
        setAddClassOpen(false);
    };

    const handleUpdateClass = async () => {
        if (!editingClassName.trim() || !editingClassSection.trim() || !school || !classToEdit) return;
        setIsUpdatingClass(true);

        const selectedTeacher = teachers?.find(t => t.id === editingClassTeacherId);

        const updatedClasses = (school.classes || []).map(c => {
            if (c.id === classToEdit.id) {
                return {
                    ...c,
                    name: editingClassName.trim(),
                    section: editingClassSection.trim(),
                    teacherId: selectedTeacher?.id || '',
                    teacherName: selectedTeacher?.name || '',
                };
            }
            return c;
        });
        
        try {
            await updateDoc(schoolRef, { classes: updatedClasses });
            setClassToEdit(null);
        } catch (error) {
            console.error("Error updating class:", error);
        } finally {
            setIsUpdatingClass(false);
        }
    };
    
    const handleDeleteClass = async (classId: string) => {
        if (!school || !school.classes) return;
        const updatedClasses = school.classes.filter(c => c.id !== classId);
        await updateDoc(schoolRef, { classes: updatedClasses });
    };

    const handleAddStudent = async () => {
        if (!newStudentName.trim() || !classToManage || !school) return;
        setIsAddingStudent(true);

        const newStudent: StudentEntry = {
            id: nanoid(),
            name: newStudentName.trim(),
            rollNumber: newStudentRoll.trim(),
            fatherName: newStudentFatherName.trim(),
            mobileNumber: newStudentMobileNumber.trim(),
            address: newStudentAddress.trim(),
            admissionDate: newStudentAdmissionDate ? new Date(newStudentAdmissionDate).toISOString() : new Date().toISOString(),
        };

        const updatedClasses = (school.classes || []).map(c => {
            if (c.id === classToManage.id) {
                return { ...c, students: [...(c.students || []), newStudent] };
            }
            return c;
        });

        await updateDoc(schoolRef, { classes: updatedClasses });
        
        // update local state to re-render dialog
        const updatedClass = updatedClasses.find(c => c.id === classToManage.id);
        if (updatedClass) setClassToManage(updatedClass);

        setNewStudentName('');
        setNewStudentRoll('');
        setNewStudentFatherName('');
        setNewStudentMobileNumber('');
        setNewStudentAddress('');
        setNewStudentAdmissionDate('');
        setIsAddingStudent(false);
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!classToManage || !school || !school.classes) return;

        const updatedClasses = school.classes.map(c => {
            if (c.id === classToManage.id) {
                const updatedStudents = (c.students || []).filter(s => s.id !== studentId);
                return { ...c, students: updatedStudents };
            }
            return c;
        });

        await updateDoc(schoolRef, { classes: updatedClasses });
        
        const updatedClass = updatedClasses.find(c => c.id === classToManage.id);
        if (updatedClass) setClassToManage(updatedClass);
    };

    // --- Loading and Render ---

    const isLoading = isUserLoading || schoolLoading;

    if (isLoading || !school) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Building2 className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading School Details...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto grid gap-8">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/teacher/school')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to My Sessions
                        </Button>
                        <Card className="rounded-2xl shadow-lg">
                             <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className='w-full'>
                                    <CardTitle className="text-2xl font-serif">{school.name}</CardTitle>
                                    <CardDescription>{school.address}</CardDescription>
                                </div>
                                <div className="self-end sm:self-start flex-shrink-0">
                                    <Button variant="outline" size="icon" onClick={() => setIsEditingSchool(true)}>
                                        <Pen className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    <Tabs defaultValue="dashboard" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
                            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                            <TabsTrigger value="teachers">Teachers ({school.teacherIds?.length || 0})</TabsTrigger>
                            <TabsTrigger value="classes">Classes ({school.classes?.length || 0})</TabsTrigger>
                            <TabsTrigger value="students">Students ({totalStudents})</TabsTrigger>
                            <TabsTrigger value="fees">Fees</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="mt-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{school.teacherIds?.length || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{totalStudents}</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="teachers" className="mt-6">
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Manage Teachers</CardTitle>
                                    <Button size="sm" onClick={() => setAddTeacherOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Add Teacher</Button>
                                </CardHeader>
                                <CardContent>
                                    {teachersLoading ? <Loader2 className="animate-spin" /> :
                                        teachers && teachers.length > 0 ? (
                                        <div className="grid gap-4">
                                            {teachers.map(teacher => (
                                                <div key={teacher.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-background">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <Avatar><AvatarFallback>{getInitials(teacher.name)}</AvatarFallback></Avatar>
                                                        <div>
                                                            <p className="font-semibold">{teacher.name}</p>
                                                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                                                        </div>
                                                    </div>
                                                    {teacher.id !== school.principalId ? (
                                                        <Button variant="destructive" size="sm" onClick={() => handleRemoveTeacher(teacher.id)} className="self-end sm:self-center mt-2 sm:mt-0"><UserX className="mr-2 h-4 w-4" />Remove</Button>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-primary px-3 self-end sm:self-center">PRINCIPAL</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                         <p className="text-muted-foreground text-center py-8">No teachers found. The principal is the only member.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="classes" className="mt-6">
                           <Card className="rounded-2xl shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Manage Classes</CardTitle>
                                    <Button size="sm" onClick={() => setAddClassOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Class</Button>
                                </CardHeader>
                                <CardContent>
                                    {school.classes && school.classes.length > 0 ? (
                                         <div className="grid gap-4">
                                            {school.classes.map(c => (
                                                <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-background">
                                                    <div className='w-full'>
                                                        <p className="font-semibold">{c.name} - Section {c.section}</p>
                                                        <p className="text-sm text-muted-foreground">{c.students?.length || 0} student(s)</p>
                                                         {c.teacherName ? (
                                                            <p className="text-sm text-muted-foreground mt-1">Teacher: {c.teacherName}</p>
                                                         ) : (
                                                            <p className="text-sm text-yellow-600 mt-1 font-semibold">No teacher assigned</p>
                                                         )}
                                                    </div>
                                                    <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                                                        <Button variant="outline" size="sm" onClick={() => setClassToManage(c)}><Users className="mr-2 h-4 w-4" />Students</Button>
                                                        <Button variant="outline" size="icon" onClick={() => setClassToEdit(c)}><Pen className="h-4 w-4" /></Button>
                                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteClass(c.id)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <Book className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Classes Created</h3>
                                            <p className="text-muted-foreground mt-1">Add a class to get started.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                         <TabsContent value="students" className="mt-6">
                             <Card className="rounded-2xl shadow-lg">
                                <CardHeader><CardTitle>All Students</CardTitle></CardHeader>
                                <CardContent>
                                    {school.classes && school.classes.some(c => c.students && c.students.length > 0) ? (
                                        <div className="space-y-6">
                                            {(school.classes || []).map(c => (c.students && c.students.length > 0) && (
                                                <div key={c.id}>
                                                    <h4 className="font-semibold text-lg mb-2 border-b pb-2">Class {c.name} - Section {c.section}</h4>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {c.students.map(s => (
                                                            <div key={s.id} className="p-3 rounded-lg border bg-background">
                                                                <p className="font-semibold">{s.name}</p>
                                                                <div className="mt-2 text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                                                                    <p><strong>Roll:</strong> {s.rollNumber || 'N/A'}</p>
                                                                    <p><strong>Father:</strong> {s.fatherName || 'N/A'}</p>
                                                                    <p><strong>Mobile:</strong> {s.mobileNumber || 'N/A'}</p>
                                                                    <p className="col-span-2"><strong>Address:</strong> {s.address || 'N/A'}</p>
                                                                    {s.admissionDate && (
                                                                        <p className="col-span-2"><strong>Admission:</strong> {formatDate(s.admissionDate)}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Students Enrolled</h3>
                                            <p className="text-muted-foreground mt-1">Add students to classes in the 'Classes' tab.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="fees" className="mt-6">
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Fee Management</CardTitle>
                                    <CardDescription>Track and update monthly fee payments for all students.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {school.classes && school.classes.length > 0 ? (
                                        <div className="space-y-6">
                                            {school.classes.map(c => (
                                                <div key={c.id}>
                                                    <h4 className="font-semibold text-lg mb-3 border-b pb-2">Class {c.name} - Section {c.section}</h4>
                                                    {c.students && c.students.length > 0 ? (
                                                        <div className="grid gap-3">
                                                            {c.students.map(s => {
                                                                const currentMonth = new Date().getMonth() + 1;
                                                                const currentYear = new Date().getFullYear();
                                                                const currentMonthFee = s.fees?.find(f => f.feeMonth === currentMonth && f.feeYear === currentYear);
                                                                const status = currentMonthFee?.status || 'unpaid';
                                                                
                                                                return (
                                                                    <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border bg-background">
                                                                        <div>
                                                                            <p className="font-semibold">{s.name}</p>
                                                                            <p className="text-sm text-muted-foreground">Roll No: {s.rollNumber || 'N/A'}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 self-end sm:self-center mt-2 sm:mt-0">
                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                {status === 'paid' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                                                                                <span className="font-medium">
                                                                                    {new Date().toLocaleString('default', { month: 'long' })} Fee: <span className={status === 'paid' ? 'text-green-600' : 'text-destructive'}>{status}</span>
                                                                                </span>
                                                                            </div>
                                                                            <Button variant="outline" size="sm" onClick={() => setStudentForFees({ student: s, classId: c.id })}>
                                                                                <Wallet className="mr-2 h-4 w-4" /> Manage Fees
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground px-2">No students in this class.</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <Book className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Classes Created</h3>
                                            <p className="text-muted-foreground mt-1">Add a class to manage student fees.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </div>

                {/* Dialogs */}
                <Dialog open={isEditingSchool} onOpenChange={setIsEditingSchool}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit School Details</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="school-name-edit">School Name</Label>
                                <Input id="school-name-edit" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="school-address-edit">School Address</Label>
                                <Textarea id="school-address-edit" value={schoolAddress} onChange={e => setSchoolAddress(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="school-year-edit">Academic Year</Label>
                                <Input id="school-year-edit" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="e.g., 2024-2025" />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleUpdateSchool} disabled={isSavingSchool}>
                                {isSavingSchool ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isAddTeacherOpen} onOpenChange={setAddTeacherOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Teacher</DialogTitle>
                            <DialogDescription>Enter the email address of the teacher you want to add. They must have a 'teacher' account on this platform.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Label htmlFor="teacher-email">Teacher's Email</Label>
                            <Input id="teacher-email" value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} placeholder="teacher@example.com"/>
                             {addTeacherError && <p className="text-sm text-destructive">{addTeacherError}</p>}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleAddTeacher} disabled={isAddingTeacher}>
                                {isAddingTeacher ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />} Add Teacher
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isAddClassOpen} onOpenChange={setAddClassOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add New Class</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2"><Label htmlFor="class-name">Class Name</Label><Input id="class-name" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="e.g., 10th"/></div>
                            <div className="grid gap-2"><Label htmlFor="class-section">Section</Label><Input id="class-section" value={newClassSection} onChange={e => setNewClassSection(e.target.value)} placeholder="e.g., A"/></div>
                             <div className="grid gap-2">
                                <Label htmlFor="class-teacher">Assign Teacher (Optional)</Label>
                                <Select value={newClassTeacherId} onValueChange={setNewClassTeacherId}>
                                    <SelectTrigger id="class-teacher">
                                        <SelectValue placeholder="Select a teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(teachers || []).map(teacher => (
                                            <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleAddClass} disabled={isAddingClass || !newClassName || !newClassSection}>
                                {isAddingClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FilePlus className="mr-2 h-4 w-4" />} Create Class
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                 <Dialog open={!!classToEdit} onOpenChange={(isOpen) => !isOpen && setClassToEdit(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Class</DialogTitle>
                            <DialogDescription>
                                Update the class details and assign a teacher.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-class-name">Class Name</Label>
                                <Input id="edit-class-name" value={editingClassName} onChange={e => setEditingClassName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-class-section">Section</Label>
                                <Input id="edit-class-section" value={editingClassSection} onChange={e => setEditingClassSection(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-class-teacher">Assign Teacher</Label>
                                <Select value={editingClassTeacherId} onValueChange={setEditingClassTeacherId}>
                                    <SelectTrigger id="edit-class-teacher">
                                        <SelectValue placeholder="Select a teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Teacher</SelectItem>
                                        {(teachers || []).map(teacher => (
                                            <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleUpdateClass} disabled={isUpdatingClass || !editingClassName || !editingClassSection}>
                                {isUpdatingClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!classToManage} onOpenChange={(isOpen) => { if (!isOpen) { setClassToManage(null); setStudentForFees(null); } }}>
                    <DialogContent className="max-w-2xl md:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Manage Students for {classToManage?.name} - Section {classToManage?.section}</DialogTitle>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-8 py-4 max-h-[70vh] md:max-h-[60vh] overflow-y-auto">
                             <div className="flex flex-col gap-4 md:pr-4 md:border-r border-b md:border-b-0 pb-8 md:pb-0 mb-8 md:mb-0">
                                <h4 className="font-semibold">Add New Student</h4>
                                <div className="grid gap-3 overflow-y-auto pr-2">
                                    <div className="grid gap-1.5"><Label htmlFor="student-name">Student Name</Label><Input id="student-name" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} required/></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1.5"><Label htmlFor="student-roll">Roll Number</Label><Input id="student-roll" value={newStudentRoll} onChange={e => setNewStudentRoll(e.target.value)} /></div>
                                        <div className="grid gap-1.5"><Label htmlFor="student-father">Father's Name</Label><Input id="student-father" value={newStudentFatherName} onChange={e => setNewStudentFatherName(e.target.value)} /></div>
                                    </div>
                                    <div className="grid gap-1.5"><Label htmlFor="student-mobile">Mobile Number</Label><Input id="student-mobile" value={newStudentMobileNumber} onChange={e => setNewStudentMobileNumber(e.target.value)} /></div>
                                    <div className="grid gap-1.5"><Label htmlFor="student-address">Address</Label><Textarea id="student-address" value={newStudentAddress} onChange={e => setNewStudentAddress(e.target.value)} rows={2} /></div>
                                    <div className="grid gap-1.5"><Label htmlFor="student-admission-date">Admission Date</Label><Input id="student-admission-date" type="date" value={newStudentAdmissionDate} onChange={e => setNewStudentAdmissionDate(e.target.value)} /></div>
                                </div>
                                <Button onClick={handleAddStudent} disabled={isAddingStudent || !newStudentName} className="mt-auto w-fit">
                                    {isAddingStudent ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>} Add Student
                                </Button>
                            </div>
                            <div className="flex flex-col gap-4 overflow-y-auto">
                                 <h4 className="font-semibold">Enrolled Students ({classToManage?.students?.length || 0})</h4>
                                 {classToManage?.students && classToManage.students.length > 0 ? (
                                    <div className="grid gap-3">
                                        {classToManage.students.map(s => (
                                             <div key={s.id} className="p-3 rounded-lg border bg-gray-50/50">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold">{s.name}</p>
                                                    <Button size="icon" variant="ghost" className="text-destructive h-7 w-7" onClick={() => handleRemoveStudent(s.id)}><Trash2 className="h-4 w-4"/></Button>
                                                </div>
                                                <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                                                    <p><strong>Roll:</strong> {s.rollNumber || 'N/A'}</p>
                                                    <p><strong>Father:</strong> {s.fatherName || 'N/A'}</p>
                                                    <p><strong>Mobile:</strong> {s.mobileNumber || 'N/A'}</p>
                                                    <p className="col-span-2"><strong>Address:</strong> {s.address || 'N/A'}</p>
                                                    {s.admissionDate && (
                                                        <p className="col-span-2"><strong>Admission:</strong> {new Date(s.admissionDate).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                 ) : <p className="text-sm text-muted-foreground text-center pt-8">No students in this class yet.</p>}
                            </div>
                        </div>
                         <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Done</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                {studentForFees && (
                    <SchoolFeeManagementDialog 
                        isOpen={!!studentForFees} 
                        onClose={() => setStudentForFees(null)}
                        school={school}
                        classId={studentForFees.classId}
                        student={studentForFees.student}
                    />
                )}

            </main>
        </div>
    );
}
