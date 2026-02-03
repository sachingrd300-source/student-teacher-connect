
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, addDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Loader2, Send, Check, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    subject?: string;
    coachingCenterName?: string;
}

interface Batch {
    id: string;
    name: string;
}

interface Enrollment {
    id: string;
    batchId: string;
}

interface UserProfile {
    name: string;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

export default function BookCoachingSeatPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    // User profile
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    // Teachers
    const teachersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('isVerifiedCoachingTutor', '==', true));
    }, [firestore]);
    const { data: teachers, isLoading: teachersLoading } = useCollection<TeacherProfile>(teachersQuery);

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
    const [joiningState, setJoiningState] = useState<{[batchId: string]: boolean}>({});

    // Batches for selected teacher
    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !selectedTeacher) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', selectedTeacher.id));
    }, [firestore, selectedTeacher]);
    const { data: batches, isLoading: batchesLoading } = useCollection<Batch>(batchesQuery);

    // Student's current enrollments
    const studentEnrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user]);
    const { data: studentEnrollments } = useCollection<Enrollment>(studentEnrollmentsQuery);

    const enrolledBatchIds = useMemo(() => {
        return new Set(studentEnrollments?.map(e => e.batchId));
    }, [studentEnrollments]);

    // Filter teachers based on search
    const filteredTeachers = useMemo(() => {
        if (!teachers) return [];
        if (!searchQuery.trim()) return teachers;
        const lowercasedQuery = searchQuery.toLowerCase();
        return teachers.filter(teacher =>
            teacher.name.toLowerCase().includes(lowercasedQuery) ||
            teacher.subject?.toLowerCase().includes(lowercasedQuery) ||
            teacher.coachingCenterName?.toLowerCase().includes(lowercasedQuery)
        );
    }, [teachers, searchQuery]);

    const handleJoinRequest = async (batch: Batch) => {
        if (!firestore || !user || !userProfile || !selectedTeacher) return;

        setJoiningState(prev => ({ ...prev, [batch.id]: true }));

        try {
            await addDoc(collection(firestore, 'enrollments'), {
                studentId: user.uid,
                studentName: userProfile.name,
                teacherId: selectedTeacher.id,
                teacherName: selectedTeacher.name,
                batchId: batch.id,
                batchName: batch.name,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error sending join request:", error);
            setJoiningState(prev => ({ ...prev, [batch.id]: false }));
        }
    };
    
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="grid gap-8">
            <div className="mb-8 text-center">
                 <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-serif text-foreground">
                    Book a Coaching Seat
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                    Browse our verified coaching tutors and request to join their batches.
                </p>
            </div>
            
            <AnimatePresence mode="wait">
                {selectedTeacher ? (
                    <motion.div key="batches-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Card>
                             <CardHeader>
                                <Button variant="ghost" onClick={() => setSelectedTeacher(null)} className="mb-4 self-start">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Teachers
                                </Button>
                                <div className="flex items-center gap-4">
                                     <Avatar className="w-16 h-16">
                                        <AvatarFallback className="text-2xl">{getInitials(selectedTeacher.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle>{selectedTeacher.name}'s Batches</CardTitle>
                                        <CardDescription>{selectedTeacher.coachingCenterName}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {batchesLoading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> :
                                batches && batches.length > 0 ? (
                                    <div className="grid gap-4">
                                        {batches.map(batch => {
                                            const isEnrolled = enrolledBatchIds.has(batch.id);
                                            const isJoining = joiningState[batch.id];
                                            return (
                                                <div key={batch.id} className="flex items-center justify-between p-4 rounded-lg border">
                                                    <p className="font-semibold">{batch.name}</p>
                                                    <Button 
                                                        onClick={() => handleJoinRequest(batch)}
                                                        disabled={isEnrolled || isJoining}
                                                    >
                                                        {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                                                         isEnrolled ? <><Check className="mr-2 h-4 w-4" /> Request Sent</> : 
                                                         <><Send className="mr-2 h-4 w-4" /> Request to Join</>}
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">This teacher has not created any batches yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div key="teachers-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                         <div className="mb-8 max-w-lg mx-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by teacher name, subject, or center..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                         {teachersLoading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> :
                         filteredTeachers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTeachers.map((teacher, i) => (
                                    <motion.div key={teacher.id} variants={cardVariants} initial="hidden" animate="visible" custom={i} transition={{ delay: i * 0.05 }}>
                                        <Card className="flex flex-col h-full text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedTeacher(teacher)}>
                                            <CardHeader className="items-center">
                                                <Avatar className="w-20 h-20 mb-4">
                                                    <AvatarFallback className="text-3xl">{getInitials(teacher.name)}</AvatarFallback>
                                                </Avatar>
                                                <CardTitle className="font-serif">{teacher.name}</CardTitle>
                                                {teacher.subject && <CardDescription className="text-primary font-semibold">{teacher.subject}</CardDescription>}
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                {teacher.coachingCenterName && <p className="text-sm text-muted-foreground">{teacher.coachingCenterName}</p>}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No verified coaching tutors found.</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
