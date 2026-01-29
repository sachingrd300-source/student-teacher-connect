'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Clipboard, Users, Book, User, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface UserProfile {
    name: string;
    role?: 'teacher';
}

interface School {
    id: string;
    name: string;
    address: string;
    code: string;
    principalId: string;
}

export default function SchoolDetailsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const schoolId = params.schoolId as string;

    // Fetch current user's profile for header
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    // Fetch school data
    const schoolRef = useMemoFirebase(() => {
        if (!firestore || !schoolId) return null;
        return doc(firestore, 'schools', schoolId);
    }, [firestore, schoolId]);
    const { data: school, isLoading: schoolLoading } = useDoc<School>(schoolRef);

    // Security check: ensure user is the principal
    useEffect(() => {
        if (school && user && school.principalId !== user.uid) {
            router.replace('/dashboard/teacher');
        }
    }, [school, user, router]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const isLoading = isUserLoading || schoolLoading;

    if (isLoading || !school) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                            Back to My Schools
                        </Button>
                        <Card className="rounded-2xl shadow-lg">
                             <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-serif">{school?.name}</CardTitle>
                                        <CardDescription>{school?.address}</CardDescription>
                                        <div className="flex items-center gap-2 mt-2">
                                            <p className="text-sm text-muted-foreground">Join Code:</p>
                                            <span className="font-mono bg-muted px-2 py-1 rounded-md text-sm">{school.code}</span>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(school.code)}>
                                                <Clipboard className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    <Tabs defaultValue="dashboard" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                            <TabsTrigger value="teachers">Teachers</TabsTrigger>
                            <TabsTrigger value="classes">Classes</TabsTrigger>
                            <TabsTrigger value="students">Students</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="dashboard" className="mt-6">
                            <ComingSoon icon={<Building2 className="h-10 w-10" />} title="School Dashboard" description="An overview of school statistics and activity will be shown here." />
                        </TabsContent>
                        <TabsContent value="teachers" className="mt-6">
                             <ComingSoon icon={<Users className="h-10 w-10" />} title="Teacher Management" description="A section to invite and manage all teachers associated with your school." />
                        </TabsContent>
                        <TabsContent value="classes" className="mt-6">
                             <ComingSoon icon={<Book className="h-10 w-10" />} title="Class Management" description="A feature to create classes, assign class teachers, and manage subjects." />
                        </TabsContent>
                        <TabsContent value="students" className="mt-6">
                             <ComingSoon icon={<User className="h-10 w-10" />} title="Student Management" description="A comprehensive view of all students enrolled in your school, organized by class." />
                        </TabsContent>
                    </Tabs>

                </div>
            </main>
        </div>
    );
}

const ComingSoon = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Card className="rounded-2xl shadow-lg">
        <CardContent className="pt-6">
             <div className="text-center py-24 flex flex-col items-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                    {icon}
                </div>
                <h3 className="text-2xl font-semibold font-serif">{title}</h3>
                <p className="text-muted-foreground mt-2 max-w-md">{description}</p>
            </div>
        </CardContent>
    </Card>
)
