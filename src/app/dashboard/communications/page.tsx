'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

interface ChatRoom {
    id: string;
    participants: string[];
    teacherId: string;
    studentId: string;
    teacherName: string;
    studentName: string;
    lastMessage?: string;
    lastMessageAt?: string;
    lastMessageSenderId?: string;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

    return date.toLocaleDateString();
};

export default function CommunicationsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const chatRoomsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'chatRooms'),
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageAt', 'desc')
        );
    }, [firestore, user]);

    const { data: chatRooms, isLoading: chatRoomsLoading } = useCollection<ChatRoom>(chatRoomsQuery);

    const isLoading = isUserLoading || profileLoading || chatRoomsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <MessageSquare className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Communications...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
             <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-2xl mx-auto grid gap-8">
                     <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl font-serif">My Communications</CardTitle>
                            <CardDescription>All your private conversations with students and teachers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chatRooms && chatRooms.length > 0 ? (
                                <div className="grid gap-4">
                                    {chatRooms.map(room => {
                                        const otherParticipantName = userProfile.role === 'teacher' ? room.studentName : room.teacherName;
                                        const isLastMessageFromMe = room.lastMessageSenderId === user?.uid;

                                        return (
                                            <Link href={`/dashboard/communications/${room.id}`} key={room.id} className="block">
                                                <div className="p-4 rounded-lg border bg-background transition-all hover:bg-accent hover:shadow-md">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <Avatar>
                                                                <AvatarFallback>{getInitials(otherParticipantName)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold truncate">{otherParticipantName}</p>
                                                                <p className="text-sm text-muted-foreground truncate">
                                                                    {isLastMessageFromMe && 'You: '}{room.lastMessage}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground self-start">{formatDate(room.lastMessageAt)}</div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No Conversations Yet</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        When you are assigned to a student or teacher, a chat will appear here.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
