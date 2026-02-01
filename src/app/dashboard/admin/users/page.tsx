'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, School, Users, Eye, ArrowLeft } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


// --- Interfaces ---
interface UserProfileForHeader { name: string; role: 'admin'; }
interface UserProfile { id: string; name: string; email: string; role: 'admin' | 'student' | 'teacher'; createdAt: string; }

// --- Helper Functions ---
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};
const getInitials = (name = '') => name ? name.split(' ').map((n) => n[0]).join('') : '';


// --- Main Component ---
export default function ManageUsersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    const userRole = userProfile?.role;

    const allUsersQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const { data: allUsersData, isLoading: usersLoading } = useCollection<UserProfile>(allUsersQuery);
    
    // --- Auth & Role Check ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user || userRole !== 'admin') {
            router.replace('/login');
        }
    }, [user, userRole, isUserLoading, profileLoading, router]);

    // --- Memoized Data Filtering ---
    const allUsers = useMemo(() => allUsersData?.filter(u => u.role !== 'admin') || [], [allUsersData]);
    const filteredUsers = useMemo(() => ({
        teachers: allUsers.filter(u => u.role === 'teacher'),
        students: allUsers.filter(u => u.role === 'student'),
    }), [allUsers]);

    const isLoading = isUserLoading || profileLoading || usersLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Users className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading User Management...</p>
            </div>
        );
    }
    
    const renderUserList = (userList: UserProfile[]) => {
        if (!userList || userList.length === 0) {
            return <p className="text-center text-muted-foreground py-8">No users found in this category.</p>;
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userList.map(u => (
                    <Card key={u.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-4 pb-4">
                            <Avatar><AvatarFallback>{getInitials(u.name)}</AvatarFallback></Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-base">{u.name}</CardTitle>
                                <CardDescription className="capitalize">{u.role}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-1 text-sm flex-grow">
                           <p className="text-muted-foreground break-all">{u.email}</p>
                           <p className="text-xs text-muted-foreground pt-1">Joined: {formatDate(u.createdAt)}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="outline" size="sm" className="w-full">
                                <Link href={u.role === 'teacher' ? `/teachers/${u.id}` : `/students/${u.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />View Profile
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto grid gap-8">
                     <Button asChild variant="ghost" className="w-fit">
                        <Link href="/dashboard/admin">
                           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Link>
                     </Button>
                     
                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                           <CardTitle>Manage Users</CardTitle>
                           <CardDescription>View all students and teachers on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="all">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="all">All ({allUsers.length})</TabsTrigger>
                                    <TabsTrigger value="teachers">Teachers ({filteredUsers.teachers.length})</TabsTrigger>
                                    <TabsTrigger value="students">Students ({filteredUsers.students.length})</TabsTrigger>
                                </TabsList>
                                <TabsContent value="all" className="mt-4">{renderUserList(allUsers)}</TabsContent>
                                <TabsContent value="teachers" className="mt-4">{renderUserList(filteredUsers.teachers)}</TabsContent>
                                <TabsContent value="students" className="mt-4">{renderUserList(filteredUsers.students)}</TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
