'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp }from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookCopy, Search, Users, FileText, Video, PenSquare, ClipboardList, X } from 'lucide-react';

interface Enrollment {
    id: string;
    classId: string;
    teacherName: string;
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

const categories = [
    { name: 'Notes', icon: <FileText className="h-6 w-6" /> },
    { name: 'PDF', icon: <FileText className="h-6 w-6" /> },
    { name: 'Video', icon: <Video className="h-6 w-6" /> },
    { name: 'Homework', icon: <PenSquare className="h-6 w-6" /> },
    { name: 'Test', icon: <ClipboardList className="h-6 w-6" /> },
];


export default function StudentMaterialsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

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

    const availableClasses = useMemo(() => {
        if (!materials) return [];
        const visibleMaterials = materials.filter(material => !material.classId || enrolledClassIds.includes(material.classId));
        const classNames = new Set(visibleMaterials.map(m => m.className).filter(Boolean as any));
        return Array.from(classNames);
    }, [materials, enrolledClassIds]);

    const availableSubjects = useMemo(() => {
        if (!materials) return [];
        const visibleMaterials = materials.filter(material => !material.classId || enrolledClassIds.includes(material.classId));
        const subjects = new Set(visibleMaterials.map(m => m.subject));
        return Array.from(subjects);
    }, [materials, enrolledClassIds]);
    
    const availableTeachers = useMemo(() => {
        if (!enrollments && !materials) return [];
        // Get teachers from classes the student is enrolled in
        const enrolledTeacherNames = new Set(enrollments?.map(e => e.teacherName) || []);
        // Also get teachers who have posted general materials visible to everyone
        const generalMaterialTeacherNames = new Set(materials?.filter(m => !m.classId).map(m => m.teacherName) || []);
        
        const allTeacherNames = new Set([...enrolledTeacherNames, ...generalMaterialTeacherNames]);
        return Array.from(allTeacherNames);
    }, [enrollments, materials]);

    const filteredMaterials = useMemo(() => {
        if (!materials) return [];

        let results = materials.filter(material => 
            !material.classId || enrolledClassIds.includes(material.classId)
        );

        if (selectedCategory) {
            results = results.filter(material => material.type === selectedCategory);
        }

        if (selectedClass) {
            results = results.filter(material => material.className === selectedClass);
        }
        
        if (selectedTeacher) {
            results = results.filter(material => material.teacherName === selectedTeacher);
        }

        if (selectedSubject) {
            results = results.filter(material => material.subject === selectedSubject);
        }

        if (searchTerm) {
            results = results.filter(material => 
                material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                material.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                material.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return results.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

    }, [materials, searchTerm, enrolledClassIds, selectedCategory, selectedClass, selectedSubject, selectedTeacher]);


    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">Study Materials</h1>
                    
                    {/* Category Cards Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {categories.map((category) => (
                                <Card 
                                    key={category.name}
                                    className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary ${selectedCategory === category.name ? 'border-primary bg-primary/10' : ''}`}
                                    onClick={() => setSelectedCategory(prev => prev === category.name ? null : category.name)}
                                >
                                    <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                                        <div className="bg-primary/10 p-3 rounded-full text-primary">
                                            {category.icon}
                                        </div>
                                        <p className="font-semibold text-center">{category.name}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resource Library</CardTitle>
                            <CardDescription>Browse materials from your classes or from the general library.</CardDescription>
                            
                            {/* Search and Filters */}
                            <div className="space-y-4 pt-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by title, subject, or description..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Select onValueChange={(value) => setSelectedClass(value === 'all' ? null : value)} value={selectedClass || 'all'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Classes</SelectItem>
                                            {availableClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select onValueChange={(value) => setSelectedSubject(value === 'all' ? null : value)} value={selectedSubject || 'all'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Subjects</SelectItem>
                                            {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                     <Select onValueChange={(value) => setSelectedTeacher(value === 'all' ? null : value)} value={selectedTeacher || 'all'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by Teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Teachers</SelectItem>
                                            {availableTeachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Active Filters */}
                            {(selectedCategory || selectedClass || selectedSubject || selectedTeacher) && (
                                <div className="pt-4 flex gap-2 flex-wrap">
                                    {selectedCategory && (
                                        <Button variant="secondary" size="sm" onClick={() => setSelectedCategory(null)}>
                                            Type: {selectedCategory} <X className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                    {selectedClass && (
                                        <Button variant="secondary" size="sm" onClick={() => setSelectedClass(null)}>
                                            Class: {selectedClass} <X className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                    {selectedSubject && (
                                        <Button variant="secondary" size="sm" onClick={() => setSelectedSubject(null)}>
                                            Subject: {selectedSubject} <X className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                    {selectedTeacher && (
                                        <Button variant="secondary" size="sm" onClick={() => setSelectedTeacher(null)}>
                                            Teacher: {selectedTeacher} <X className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            )}
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
                                !isLoading && <p className="text-center text-muted-foreground py-8">No study materials found for the selected criteria.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
