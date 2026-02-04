'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { cn } from '@/lib/utils';


interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

interface ChatRoom {
    id: string;
    participants: string[];
    teacherName: string;
    studentName: string;
}

interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: any; // Can be Date or FieldValue
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatRoomPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const chatRoomId = params.chatRoomId as string;
    
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const chatRoomRef = useMemoFirebase(() => {
        if (!firestore || !chatRoomId) return null;
        return doc(firestore, 'chatRooms', chatRoomId);
    }, [firestore, chatRoomId]);
    const { data: chatRoom, isLoading: chatRoomLoading } = useDoc<ChatRoom>(chatRoomRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !chatRoomId) return null;
        return query(
            collection(firestore, 'chatRooms', chatRoomId, 'messages'),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, chatRoomId]);
    const { data: messages, isLoading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
    
    // Security check
    useEffect(() => {
        if (isUserLoading || chatRoomLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (chatRoom && !chatRoom.participants.includes(user.uid)) {
            router.replace('/dashboard/communications');
        }
    }, [isUserLoading, chatRoomLoading, user, chatRoom, router]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !userProfile || !chatRoomRef || !newMessage.trim()) return;

        setIsSending(true);
        const text = newMessage.trim();
        setNewMessage('');

        try {
            const messagesColRef = collection(firestore, 'chatRooms', chatRoomId, 'messages');
            await addDoc(messagesColRef, {
                text,
                senderId: user.uid,
                senderName: userProfile.name,
                createdAt: serverTimestamp(),
            });
            
            await updateDoc(chatRoomRef, {
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
                lastMessageSenderId: user.uid,
            });

        } catch (error) {
            console.error("Error sending message:", error);
            setNewMessage(text); // Put message back on error
        } finally {
            setIsSending(false);
        }
    };
    
    const otherParticipantName = useMemo(() => {
        if (!chatRoom || !userProfile) return '';
        return userProfile.role === 'teacher' ? chatRoom.studentName : chatRoom.teacherName;
    }, [chatRoom, userProfile]);

    const isLoading = isUserLoading || profileLoading || chatRoomLoading;

    if (isLoading || !chatRoom || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <MessageSquare className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Chat...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-screen">
             <DashboardHeader userProfile={userProfile} />
             <header className="flex items-center gap-4 border-b bg-background p-4">
                 <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/communications')}>
                    <ArrowLeft className="h-5 w-5" />
                 </Button>
                 <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback>{getInitials(otherParticipantName)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{otherParticipantName}</p>
                 </div>
             </header>
             <main className="flex-1 overflow-y-auto p-4 bg-muted/40">
                {messagesLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {messages?.map(msg => (
                             <div key={msg.id} className={cn(
                                'flex items-end gap-2',
                                msg.senderId === user?.uid ? 'justify-end' : 'justify-start'
                            )}>
                                {msg.senderId !== user?.uid && (
                                     <Avatar className="w-8 h-8">
                                        <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    'max-w-xs md:max-w-md rounded-2xl px-4 py-2',
                                    msg.senderId === user?.uid 
                                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                                        : 'bg-background rounded-bl-none border'
                                )}>
                                    <p className="text-sm">{msg.text}</p>
                                     <p className="text-xs opacity-70 mt-1 text-right">{formatDate(msg.createdAt)}</p>
                                </div>
                                {msg.senderId === user?.uid && (
                                     <Avatar className="w-8 h-8">
                                        <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                )}
             </main>
             <footer className="border-t bg-background p-4">
                 <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                    </Button>
                 </form>
             </footer>
        </div>
    )
}
