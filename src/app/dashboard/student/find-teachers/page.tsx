
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, BookUser, Search, Users, Home, Building2, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    role: 'teacher';
    subject?: string;
    coachingCenterName?: string;
    bio?: string;
    isHomeTutor?: boolean;
    teacherWorkStatus?: 'own_coaching' | 'achievers_associate' | 'both';
}

interface CurrentUserProfile {
    name: string;
    homeAddress?: string;
    mobileNumber?: string;
    class?: string;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

export default function FindTeachersPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useUser();
    const [bookingState, setBookingState] = useState<{ [teacherId: string]: 'idle' | 'booking' | 'booked' }>({});

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: userProfileLoading } = useDoc<CurrentUserProfile>(userProfileRef);

    const teachersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'teacher'));
    }, [firestore]);
    
    const { data: teachers, isLoading: teachersLoading } = useCollection<TeacherProfile>(teachersQuery);

    const { homeTutors, coachingTeachers } = useMemo(() => {
        if (!teachers) return { homeTutors: [], coachingTeachers: [] };

        const allFilteredBySearch = teachers.filter(teacher => {
            if (!searchQuery.trim()) return true;
            const searchLower = searchQuery.toLowerCase();
            const nameMatch = teacher.name.toLowerCase().includes(searchLower);
            const subjectMatch = teacher.subject?.toLowerCase().includes(searchLower) || false;
            const centerMatch = teacher.coachingCenterName?.toLowerCase().includes(searchLower) || false;
            return nameMatch || subjectMatch || centerMatch;
        });

        const homeTutors = allFilteredBySearch.filter(t => t.isHomeTutor);
        const coachingTeachersList = allFilteredBySearch.filter(t => t.teacherWorkStatus === 'own_coaching' || t.teacherWorkStatus === 'achievers_associate' || t.teacherWorkStatus === 'both');

        return { homeTutors, coachingTeachers: coachingTeachersList };
    }, [teachers, searchQuery]);

    const handleBookDemo = async (teacher: TeacherProfile) => {
        if (!firestore || !user || !userProfile) {
            alert("Please complete your profile to book a demo class.");
            return;
        }

        setBookingState(prev => ({ ...prev, [teacher.id]: 'booking' }));

        const isCommunityTeacher = teacher.teacherWorkStatus === 'achievers_associate' || teacher.teacherWorkStatus === 'both';

        try {
            await addDoc(collection(firestore, 'homeBookings'), {
                bookingType: 'demoClass',
                studentId: user.uid,
                studentName: userProfile.name,
                mobileNumber: userProfile.mobileNumber || '',
                studentAddress: userProfile.homeAddress || '',
                studentClass: userProfile.class || '',
                subject: teacher.subject || '',
                status: 'Pending',
                // Assign directly to teacher if they are independent, otherwise it's for admin to assign
                assignedTeacherId: isCommunityTeacher ? null : teacher.id,
                assignedTeacherName: isCommunityTeacher ? null : teacher.name,
                // We can add a field to explicitly know who the request was for, even if admin manages it
                requestedTeacherId: teacher.id, 
                requestedTeacherName: teacher.name,
                createdAt: new Date().toISOString(),
            });
            setBookingState(prev => ({ ...prev, [teacher.id]: 'booked' }));
        } catch (error) {
            console.error("Error booking demo class:", error);
            alert("Failed to send request. Please try again.");
            setBookingState(prev => ({ ...prev, [teacher.id]: 'idle' }));
        }
    };


    if (teachersLoading || userProfileLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
                <Users className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Finding Teachers...</p>
            </div>
        );
    }
    
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
            },
        }),
    };

    const renderTeacherList = (teacherList: TeacherProfile[], type: 'home' | 'coaching') => {
        if (teacherList.length === 0) {
            if (searchQuery.trim()) {
                 return (
                    <div className="text-center py-16">
                         <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Teachers Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Your search for "{searchQuery}" did not match any {type === 'home' ? 'home tutors' : 'coaching teachers'}.
                        </p>
                    </div>
                );
            }
             return (
                <div className="text-center py-16">
                     <BookUser className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No {type === 'home' ? 'Home Tutors' : 'Coaching Teachers'} Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        There are currently no {type === 'home' ? 'home tutors' : 'coaching teachers'} available. Please check back later.
                    </p>
                </div>
            );
        }
        return (
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
                {teacherList.map((teacher, i) => (
                    <motion.div
                        key={teacher.id}
                        custom={i}
                        variants={cardVariants}
                        whileHover={{ y: -5, boxShadow: "0px 8px 25px -5px hsl(var(--primary) / 0.1), 0px 10px 10px -5px hsl(var(--primary) / 0.04)" }}
                        className="h-full"
                    >
                        <Card className="flex flex-col h-full transition-shadow duration-300 rounded-2xl shadow-lg">
                            <CardHeader className="items-center text-center">
                                <Avatar className="w-20 h-20 mb-4">
                                    <AvatarFallback className="text-3xl">{getInitials(teacher.name)}</AvatarFallback>
                                </Avatar>
                                <CardTitle className="font-serif">{teacher.name}</CardTitle>
                                {teacher.subject && (
                                    <CardDescription className="text-primary font-semibold">{teacher.subject}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="flex-grow text-center">
                                 <div>
                                    {teacher.coachingCenterName && (
                                        <p className="text-sm font-bold text-primary mb-4">{teacher.coachingCenterName}</p>
                                    )}
                                    {teacher.bio && (
                                         <p className="text-sm text-muted-foreground line-clamp-3">{teacher.bio}</p>
                                    )}
                                </div>
                            </CardContent>
                             <CardFooter className="p-4 pt-0 flex flex-col items-stretch gap-2">
                                <Button asChild className="w-full">
                                    <Link href={`/teachers/${teacher.id}`}>
                                        <User className="mr-2 h-4 w-4" /> View Profile
                                    </Link>
                                </Button>
                                <Button
                                    onClick={() => handleBookDemo(teacher)}
                                    disabled={bookingState[teacher.id] === 'booking' || bookingState[teacher.id] === 'booked'}
                                    className="w-full"
                                    variant="secondary"
                                >
                                    {bookingState[teacher.id] === 'booking' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {bookingState[teacher.id] === 'booked' && <Check className="mr-2 h-4 w-4" />}
                                    {bookingState[teacher.id] === 'booked' ? 'Request Sent' : 'Book Demo Class'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        );
    };

    return (
        <motion.div 
            className="grid gap-8"
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
        >
            <div className="mb-8 text-center">
                 <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-serif text-foreground">
                    Find Your Teacher
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                    Browse our community of expert teachers to find the perfect match for your learning goals.
                </p>
            </div>

            <div className="mb-8 max-w-lg mx-auto">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, subject, or center..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="coaching" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
                    <TabsTrigger value="coaching"><Building2 className="mr-2 h-4 w-4" />Coaching Teachers</TabsTrigger>
                    <TabsTrigger value="home"><Home className="mr-2 h-4 w-4" />Home Tutors</TabsTrigger>
                </TabsList>
                <TabsContent value="coaching" className="mt-8">
                    {renderTeacherList(coachingTeachers, 'coaching')}
                </TabsContent>
                <TabsContent value="home" className="mt-8">
                    {renderTeacherList(homeTutors, 'home')}
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
