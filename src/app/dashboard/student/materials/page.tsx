
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp }from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookCopy, Search, Users } from 'lucide-react';

interface Enrollment {
    id: string;
    classId: string;
}
interface StudyMaterial {
    id: string;
    title: string;
    subject: string;
    description: string;
    type: string;
    chapter?: string;
    fileUrl?: string;
    teacherName: string;
    createdAt: Timestamp;
    classId?: string;
    className?: string;
}

export default function StudentMaterialsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);
    
    const [searchTerm, setSearchTerm] = useState('');

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user]);
    const { data: enrollments } = useCollection<Enrollment>(enrollmentsQuery);

    const enrolledClassIds = useMemo(() => {
        return enrollments?.map(e => e.classId) || [];
    }, [enrollments]);

    const materialsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'studyMaterials'));
    }, [firestore]);

    const { data: materials, isLoading } = useCollection<StudyMaterial>(materialsQuery);

    const filteredMaterials = useMemo(() => {
        if (!materials) return [];

        const classFiltered = materials.filter(material => 
            !material.classId || enrolledClassIds.includes(material.classId)
        );

        if (!searchTerm) {
            return classFiltered;
        }

        return classFiltered.filter(material => 
            material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            material.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            material.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [materials, searchTerm, enrolledClassIds]);

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">Study Materials</h1>
                    <Card>
                        <CardHeader>
                            <CardTitle>Resource Library</CardTitle>
                            <CardDescription>Browse materials from your classes or from the general library.</CardDescription>
                            <div className="relative pt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by title, subject, or description..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading && <p>Loading materials...</p>}
                            {filteredMaterials && filteredMaterials.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredMaterials.map(material => (
                                        <Card key={material.id} className="flex flex-col">
                                            <CardHeader className="flex-1">
                                                <CardTitle className="text-lg">{material.title}</CardTitle>
                                                <CardDescription>by {material.teacherName}</CardDescription>
                                                 {material.className && (
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-xs font-semibold text-primary">{material.className}</span>
                                                    </div>
                                                )}
                                            </CardHeader>
                                            <CardContent className="flex-1 space-y-3 text-sm">
                                                <div className="flex items-start gap-2">
                                                    <BookCopy className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                    <span>{material.subject} {material.chapter && `- ${material.chapter}`}</span>
                                                </div>
                                                <p className="text-muted-foreground line-clamp-3">{material.description}</p>
                                                <div className="text-xs font-semibold capitalize px-2 py-1 rounded-full bg-secondary text-secondary-foreground self-start">
                                                   {material.type}
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                {material.fileUrl ? (
                                                     <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full text-primary hover:underline font-semibold text-center">
                                                        View Material
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">No link available</p>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !isLoading && <p className="text-center text-muted-foreground py-8">No study materials found.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
