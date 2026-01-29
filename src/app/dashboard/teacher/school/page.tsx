'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Clipboard, Settings, School, ArrowLeft, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

// Interfaces
interface UserProfile {
    name: string;
    email: string;
    role: 'teacher';
}

interface School {
    id: string;
    name: string;
    address: string;
    code: string;
    createdAt: string;
    principalId: string;
    academicYear: string;
}

// Main component
export default function SchoolManagementPage() {
    // Hooks
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    
    // State for create dialog
    const [isCreateSchoolOpen, setCreateSchoolOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolAddress, setNewSchoolAddress] = useState('');
    const [academicYearDate, setAcademicYearDate] = useState('');
    const [isCreatingSchool, setIsCreatingSchool] = useState(false);

    // Fetch user profile
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    // Fetch schools where user is principal
    const schoolsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'schools'), where('principalId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: schools, isLoading: schoolsLoading } = useCollection<School>(schoolsQuery);

    // Effect for auth redirection
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) router.replace('/login');
        if (userProfile && userProfile.role !== 'teacher') router.replace('/dashboard');
    }, [user, userProfile, isUserLoading, profileLoading, router]);

    // Function to handle school creation
    const handleCreateSchool = async () => {
        if (!firestore || !user || !userProfile || !newSchoolName.trim() || !academicYearDate) return;
        setIsCreatingSchool(true);
        const schoolCode = nanoid(8).toUpperCase();
        
        const startDate = new Date(academicYearDate);
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth(); // 0-11

        // Academic year is typically April to March in India.
        // If month is before April (Jan, Feb, Mar), it belongs to the previous academic year.
        const academicYearStart = startMonth < 3 ? startYear - 1 : startYear;
        const academicYearString = `${academicYearStart}-${academicYearStart + 1}`;
    
        try {
            await addDoc(collection(firestore, 'schools'), {
                name: newSchoolName.trim(),
                address: newSchoolAddress.trim(),
                principalId: user.uid,
                principalName: userProfile.name,
                code: schoolCode,
                academicYear: academicYearString,
                teacherIds: [user.uid], // Principal is the first teacher
                classes: [],
                createdAt: new Date().toISOString(),
            });
            setNewSchoolName('');
            setNewSchoolAddress('');
            setAcademicYearDate('');
            setCreateSchoolOpen(false);
        } catch (error) {
            console.error("Error creating school:", error);
        } finally {
            setIsCreatingSchool(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // maybe show a toast later
        });
    };

    const isLoading = isUserLoading || profileLoading || schoolsLoading;

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-screen items-center justify-center flex-col gap-4">
                <Building2 className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading School Management...</p>
            </div>
        );
    }
    
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1 },
        }),
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                         <Button variant="ghost" onClick={() => router.push('/dashboard/teacher')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">School Management</h1>
                        <p className="text-muted-foreground mt-2">Create and manage your schools.</p>
                    </div>
                    
                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>My Schools ({schools?.length || 0})</CardTitle>
                            <Button size="sm" onClick={() => setCreateSchoolOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create School
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {schools && schools.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {schools.map((school, i) => (
                                        <motion.div
                                            key={school.id}
                                            custom={i}
                                            initial="hidden"
                                            animate="visible"
                                            variants={cardVariants}
                                        >
                                          <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-md">
                                            <CardHeader>
                                              <CardTitle className="font-serif text-xl">{school.name}</CardTitle>
                                              <CardDescription>{school.address}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                               <div className="flex items-center gap-2 pt-1">
                                                    <p className="text-sm text-muted-foreground">Join Code:</p>
                                                    <span className="font-mono bg-muted px-2 py-1 rounded-md text-sm">{school.code}</span>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(school.code)}>
                                                        <Clipboard className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">Session: {school.academicYear}</p>
                                            </CardContent>
                                            <CardFooter>
                                              <Button asChild className="w-full">
                                                  <Link href={`/dashboard/teacher/school/${school.id}`}>
                                                      <Settings className="mr-2 h-4 w-4" /> Manage School
                                                  </Link>
                                              </Button>
                                            </CardFooter>
                                          </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 flex flex-col items-center">
                                    <School className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold">You haven't created any schools yet.</h3>
                                    <p className="text-muted-foreground mt-2 mb-6 max-w-md">Create a school to manage classes, teachers, and students all in one place.</p>
                                    <Button onClick={() => setCreateSchoolOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Create Your First School
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Dialog open={isCreateSchoolOpen} onOpenChange={setCreateSchoolOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New School</DialogTitle>
                        <DialogDescription>
                            Enter the school details. An academic session will be created based on the start date.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="school-name">School Name</Label>
                            <Input 
                                id="school-name"
                                value={newSchoolName} 
                                onChange={(e) => setNewSchoolName(e.target.value)}
                                placeholder="e.g., Knowledge High School"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="school-address">School Address</Label>
                            <Textarea id="school-address" value={newSchoolAddress} onChange={(e) => setNewSchoolAddress(e.target.value)} placeholder="Enter the full address of the school" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="academic-year-date">Academic Session Start Date</Label>
                            <Input id="academic-year-date" type="date" value={academicYearDate} onChange={(e) => setAcademicYearDate(e.target.value)} />
                            <p className="text-xs text-muted-foreground">The academic year (e.g., 2024-2025) will be determined from this date.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                             <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleCreateSchool} disabled={isCreatingSchool || !newSchoolName.trim() || !academicYearDate}>
                            {isCreatingSchool && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create School
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
