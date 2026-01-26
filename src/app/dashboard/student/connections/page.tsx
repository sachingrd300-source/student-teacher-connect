
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, UserCheck, Clock, Check, Users, X, Send } from 'lucide-react';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'tutor';
}

interface Connection {
    id: string;
    requesterId: string;
    requesterName: string;
    receiverId: string;
    receiverName: string;
    status: 'pending' | 'accepted';
    userIds: string[];
}

export default function ConnectionsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

    const allStudentsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'student')) : null, [firestore]);
    const { data: allStudents, isLoading: usersLoading } = useCollection<AppUser>(allStudentsQuery);
    
    const connectionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'connections'), where('userIds', 'array-contains', user.uid)) : null, [firestore, user]);
    const { data: connections, isLoading: connectionsLoading } = useCollection<Connection>(connectionsQuery);

    const otherStudents = useMemo(() => allStudents?.filter(u => u.id !== user?.uid) || [], [allStudents, user]);

    const { pendingSent, pendingReceived, acceptedConnections, acceptedUserIds } = useMemo(() => {
        if (!connections || !user) {
            return { pendingSent: new Set(), pendingReceived: [], acceptedConnections: [], acceptedUserIds: new Set() };
        }
        
        const pendingSent = new Set<string>();
        const pendingReceived: Connection[] = [];
        const acceptedConnections: Connection[] = [];
        const acceptedUserIds = new Set<string>();

        connections.forEach(conn => {
            if (conn.status === 'pending') {
                if (conn.requesterId === user.uid) {
                    pendingSent.add(conn.receiverId);
                } else {
                    pendingReceived.push(conn);
                }
            } else if (conn.status === 'accepted') {
                acceptedConnections.push(conn);
                conn.userIds.forEach(id => acceptedUserIds.add(id));
            }
        });
        return { pendingSent, pendingReceived, acceptedConnections, acceptedUserIds };

    }, [connections, user]);
    
    const handleSendRequest = async (receiver: AppUser) => {
        if (!user || !userProfile || !firestore) return;
        const connectionId = [user.uid, receiver.id].sort().join('_');
        const connectionRef = doc(firestore, 'connections', connectionId);

        const newConnection = {
            id: connectionId,
            userIds: [user.uid, receiver.id],
            requesterId: user.uid,
            requesterName: userProfile.name,
            receiverId: receiver.id,
            receiverName: receiver.name,
            status: 'pending' as 'pending',
            createdAt: serverTimestamp(),
        };

        await setDoc(connectionRef, newConnection);
    };

    const handleAcceptRequest = (connection: Connection) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'connections', connection.id), { status: 'accepted' });
    };

    const handleDeclineOrRemove = (connectionId: string) => {
        if (!firestore) return;
        if (confirm('Are you sure you want to remove this connection or decline this request?')) {
            deleteDocumentNonBlocking(doc(firestore, 'connections', connectionId));
        }
    };
    
    const isLoading = isUserLoading || isProfileLoading || usersLoading || connectionsLoading;

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">My Connections</h1>
                     <Tabs defaultValue="find" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="find"><UserPlus className="mr-2 h-4 w-4" />Find Students</TabsTrigger>
                            <TabsTrigger value="requests"><Clock className="mr-2 h-4 w-4" />Requests ({pendingReceived.length})</TabsTrigger>
                            <TabsTrigger value="connections"><UserCheck className="mr-2 h-4 w-4" />Connections ({acceptedConnections.length})</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="find" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Discover Other Students</CardTitle>
                                    <CardDescription>Send a connection request to start a conversation.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? <p>Loading...</p> : 
                                     otherStudents.length > 0 ? (
                                        <div className="space-y-4">
                                            {otherStudents.map(otherUser => {
                                                const isConnected = acceptedUserIds.has(otherUser.id);
                                                const isPending = pendingSent.has(otherUser.id);
                                                return (
                                                    <div key={otherUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <div>
                                                            <p className="font-semibold">{otherUser.name}</p>
                                                            <p className="text-sm text-muted-foreground">{otherUser.email}</p>
                                                        </div>
                                                        <Button 
                                                            onClick={() => handleSendRequest(otherUser)}
                                                            disabled={isConnected || isPending}
                                                        >
                                                            {isConnected ? <><Check className="h-4 w-4 mr-2"/>Connected</> : 
                                                             isPending ? <><Clock className="h-4 w-4 mr-2"/>Pending</> :
                                                             <><Send className="h-4 w-4 mr-2"/>Connect</>}
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground p-8">No other students have joined yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="requests" className="mt-6">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Pending Requests</CardTitle>
                                    <CardDescription>Accept or decline requests from other students.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? <p>Loading...</p> : 
                                     pendingReceived.length > 0 ? (
                                        <div className="space-y-4">
                                            {pendingReceived.map(conn => (
                                                <div key={conn.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div>
                                                        <p className="font-semibold">{conn.requesterName}</p>
                                                        <p className="text-sm text-muted-foreground">Wants to connect with you.</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" className="bg-success/10 text-success hover:bg-success/20 hover:text-success" onClick={() => handleAcceptRequest(conn)}>
                                                            <Check className="h-4 w-4 mr-2" />Accept
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleDeclineOrRemove(conn.id)}>
                                                            <X className="h-4 w-4 mr-2" />Decline
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground p-8">You have no pending connection requests.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="connections" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>My Connections</CardTitle>
                                    <CardDescription>Here is a list of your accepted connections.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                      {isLoading ? <p>Loading...</p> : 
                                     acceptedConnections.length > 0 ? (
                                        <div className="space-y-4">
                                            {acceptedConnections.map(conn => {
                                                const friendName = conn.requesterId === user?.uid ? conn.receiverName : conn.requesterName;
                                                return (
                                                    <div key={conn.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <p className="font-semibold">{friendName}</p>
                                                        <Button size="sm" variant="destructive" onClick={() => handleDeclineOrRemove(conn.id)}>
                                                            <X className="h-4 w-4 mr-2" />Remove
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground p-8">You haven't made any connections yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
