
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { MainHeader } from '@/components/main-header';
import { BookUser, Briefcase, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface TutorProfile {
    id: string;
    name: string;
    subjects?: string[];
    address?: string;
    coachingName?: string;
    status: 'pending_verification' | 'approved' | 'denied';
}

export default function TutorsPage() {
    const firestore = useFirestore();
    const [tutorSearch, setTutorSearch] = useState('');

    const tutorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Only show approved tutors on the public page
        return query(collection(firestore, 'users'), where('role', '==', 'tutor'), where('status', '==', 'approved'));
    }, [firestore]);

    const { data: tutors, isLoading: tutorsLoading } = useCollection<TutorProfile>(tutorsQuery);

    const filteredTutors = useMemo(() => {
        if (!tutors) return [];
        if (!tutorSearch) return tutors;

        const searchTerm = tutorSearch.toLowerCase();
        return tutors.filter(tutor => 
            tutor.name.toLowerCase().includes(searchTerm) ||
            (tutor.address && tutor.address.toLowerCase().includes(searchTerm)) ||
            (tutor.coachingName && tutor.coachingName.toLowerCase().includes(searchTerm)) ||
            (tutor.subjects && tutor.subjects.join(', ').toLowerCase().includes(searchTerm))
        );
    }, [tutors, tutorSearch]);

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <MainHeader />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">Find a Teacher</CardTitle>
                            <CardDescription>Browse available tutors on the platform or search by name, subject, or location.</CardDescription>
                            <div className="pt-4">
                                <Label htmlFor="tutor-search" className="sr-only">Search Tutors</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="tutor-search"
                                        placeholder="Search by name, subject, location..."
                                        className="pl-10"
                                        value={tutorSearch}
                                        onChange={e => setTutorSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {tutorsLoading && <p className="text-center py-8">Loading tutors...</p>}
                            {filteredTutors && filteredTutors.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredTutors.map((tutor) => (
                                        <Card key={tutor.id} className="flex flex-col">
                                            <CardHeader className="flex-1">
                                                <CardTitle>{tutor.name}</CardTitle>
                                                {tutor.coachingName && 
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                        <CardDescription>{tutor.coachingName}</CardDescription>
                                                    </div>
                                                }
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm flex-1">
                                                {tutor.subjects && tutor.subjects.length > 0 && (
                                                    <div className="flex items-start gap-2">
                                                        <BookUser className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                        <span>{tutor.subjects.join(', ')}</span>
                                                    </div>
                                                )}
                                                {tutor.address && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                        <span>{tutor.address}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                            <CardFooter>
                                               <Link href={`/dashboard/profile/${tutor.id}`} className="w-full">
                                                  <Button className="w-full" variant="secondary">View Profile & Enroll</Button>
                                               </Link>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !tutorsLoading && <p className="text-center text-muted-foreground py-8">No tutors found matching your search.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
