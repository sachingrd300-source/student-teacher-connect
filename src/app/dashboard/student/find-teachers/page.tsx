
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, BookUser, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';


interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    role: 'teacher';
    subject?: string;
    coachingCenterName?: string;
    bio?: string;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

export default function FindTeachersPage() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');

    const teachersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'teacher'));
    }, [firestore]);
    
    const { data: teachers, isLoading: teachersLoading } = useCollection<TeacherProfile>(teachersQuery);

    const filteredTeachers = useMemo(() => {
        if (!teachers) return [];
        if (!searchQuery.trim()) return teachers;

        return teachers.filter(teacher => {
            const searchLower = searchQuery.toLowerCase();
            const nameMatch = teacher.name.toLowerCase().includes(searchLower);
            const subjectMatch = teacher.subject?.toLowerCase().includes(searchLower) || false;
            const centerMatch = teacher.coachingCenterName?.toLowerCase().includes(searchLower) || false;
            return nameMatch || subjectMatch || centerMatch;
        });
    }, [teachers, searchQuery]);


    if (teachersLoading) {
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

            {teachers && teachers.length > 0 ? (
                 filteredTeachers.length > 0 ? (
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                    >
                        {filteredTeachers.map((teacher, i) => (
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
                                    <CardContent className="flex-grow flex flex-col justify-between text-center">
                                         <div>
                                            {teacher.coachingCenterName && (
                                                <p className="text-sm text-muted-foreground mb-4">{teacher.coachingCenterName}</p>
                                            )}
                                            {teacher.bio && (
                                                 <p className="text-sm text-muted-foreground line-clamp-3">{teacher.bio}</p>
                                            )}
                                        </div>
                                        <Button asChild className="mt-6 w-full">
                                            <Link href={`/teachers/${teacher.id}`}>
                                                <User className="mr-2 h-4 w-4" /> View Profile
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                     <div className="text-center py-16">
                         <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Teachers Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Your search for "{searchQuery}" did not match any teachers.
                        </p>
                    </div>
                )
            ) : (
                <div className="text-center py-16">
                     <BookUser className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Teachers Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        There are currently no teachers available on the platform. Please check back later.
                    </p>
                </div>
            )}
        </motion.div>
    );
}
