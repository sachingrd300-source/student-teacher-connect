'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where, addDoc, deleteDoc, getDocs, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Clock, Search, School, Gift, ShoppingBag, Home, Check, Trophy, Megaphone, Bullhorn } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';


interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

interface Batch {
    id: string;
    name: string;
    teacherId: string;
    teacherName: string;
    code: string;
}

interface Enrollment {
    id: string;
    studentId: string;
    teacherId: string;
    batchId: string;
    batchName: string;
    teacherName: string;
    status: 'pending' | 'approved';
    createdAt: string;
    approvedAt?: string;
}

interface Announcement {
    id: string;
    message: string;
    target: 'all' | 'teachers' | 'students';
    createdAt: string;
}

interface Advertisement {
    id: string;
    title: string;
    message: string;
    imageUrl: string;
    ctaLink?: string;
}


const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const getMotivation = () => {
    const motivations = [
        "Consistency beats intensity 💪",
        "The secret of getting ahead is getting started. 🚀",
        "Don't wish for it. Work for it. 💡",
        "The future depends on what you do today. ✨",
        "Believe you can and you're halfway there. 🎯"
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
};

export default function StudentDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [batchCode, setBatchCode] = useState('');
    const [joinMessage, setJoinMessage] = useState({ type: '', text: '' });
    const [isJoining, setIsJoining] = useState(false);
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const announcementsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'announcements'), 
            where('target', 'in', ['all', 'students']),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [firestore]);
    const { data: announcements, isLoading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);

    const advertisementsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'advertisements'),
            where('targetAudience', 'in', ['all', 'students']),
            orderBy('createdAt', 'desc'),
            limit(3)
        );
    }, [firestore]);
    const { data: advertisements, isLoading: advertisementsLoading } = useCollection<Advertisement>(advertisementsQuery);


    const enrolledBatchIds = useMemo(() => {
        return enrollments?.map(e => e.batchId) || [];
    }, [enrollments]);

    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && userProfile.role !== 'student') {
            router.replace('/dashboard');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);

    const handleJoinBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !userProfile || !batchCode.trim()) return;

        setIsJoining(true);
        setJoinMessage({ type: '', text: '' });

        const trimmedCode = batchCode.trim();

        const batchesRef = collection(firestore, 'batches');
        const q = query(batchesRef, where('code', '==', trimmedCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setJoinMessage({ type: 'error', text: 'No batch found with this code.' });
            setIsJoining(false);
            return;
        }

        const batchDoc = querySnapshot.docs[0];
        const batchData = { ...batchDoc.data(), id: batchDoc.id } as Batch;

        if (enrolledBatchIds.includes(batchData.id)) {
            setJoinMessage({ type: 'info', text: 'You have already sent a request to join this batch.' });
            setIsJoining(false);
            return;
        }

        try {
            await addDoc(collection(firestore, 'enrollments'), {
                studentId: user.uid,
                studentName: userProfile.name,
                teacherId: batchData.teacherId,
                teacherName: batchData.teacherName,
                batchId: batchData.id,
                batchName: batchData.name,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
            setJoinMessage({ type: 'success', text: `Request sent to join "${batchData.name}"! 🎉` });
            setBatchCode('');
        } catch (error) {
            console.error("Error creating enrollment request:", error);
            setJoinMessage({ type: 'error', text: 'Failed to send request. Please try again.' });
        } finally {
            setIsJoining(false);
        }
    };
    
    const handleCancelRequest = async (enrollmentId: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, 'enrollments', enrollmentId));
    };

    const isLoading = isUserLoading || profileLoading || enrollmentsLoading || announcementsLoading || advertisementsLoading;
    

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading your courses...</p>
            </div>
        );
    }

    const renderStatusIcon = (status: 'pending' | 'approved') => {
        if (status === 'approved') {
            return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
        }
        return <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
    };
    
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
    
    const actionCards = [
        { title: "Discover Teachers", description: "Find the right teacher for you.", href: "/dashboard/student/find-teachers", icon: <Search className="h-6 w-6 text-primary" /> },
        { title: "Leaderboard", description: "See top student rankings.", href: "/dashboard/student/leaderboard", icon: <Trophy className="h-6 w-6 text-primary" /> },
        { title: "Book Home Teacher", description: "Request a personalized home tutor.", href: "/dashboard/student/book-home-teacher", icon: <Home className="h-6 w-6 text-primary" /> },
        { title: "Free Study Material", description: "Access free notes and resources.", href: "/dashboard/student/free-materials", icon: <Gift className="h-6 w-6 text-primary" /> },
        { title: "Shop", description: "Exclusive merchandise and kits.", href: "/dashboard/student/shop", icon: <ShoppingBag className="h-6 w-6 text-primary" /> },
    ];


    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <motion.main 
                className="flex-1 p-3 md:p-8 bg-muted/20"
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            >
                <div className="max-w-7xl mx-auto grid gap-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Welcome back, {userProfile?.name}!</h1>
                        <p className="text-muted-foreground mt-2">{getMotivation()}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6">
                        {actionCards.map((card, i) => (
                            <motion.div
                                key={card.title}
                                custom={i}
                                initial="hidden"
                                animate="visible"
                                variants={cardVariants}
                                whileHover={{ y: -5, scale: 1.02, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                                whileTap={{ scale: 0.98 }}
                                className="h-full"
                            >
                                <Link href={card.href} className="block h-full">
                                    <Card className="flex flex-col items-center justify-start text-center p-3 sm:p-4 h-full rounded-lg shadow-lg hover:shadow-primary/10 transition-all duration-300">
                                        <div className="p-3 bg-primary/10 rounded-full mb-3">
                                            {card.icon}
                                        </div>
                                        <h3 className="font-semibold text-sm sm:text-base">{card.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 flex-grow">{card.description}</p>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid gap-8">
                        {advertisements && advertisements.length > 0 && (
                             <Card className="rounded-lg shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Bullhorn className="mr-3 h-6 w-6 text-primary"/>
                                        For You
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {advertisements.map(ad => (
                                            <motion.div
                                                key={ad.id}
                                                variants={cardVariants}
                                                initial="hidden"
                                                animate="visible"
                                                whileHover={{ y: -5, scale: 1.02, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                                            >
                                                <Card className="overflow-hidden h-full flex flex-col">
                                                    <Image src={ad.imageUrl} alt={ad.title} width={400} height={200} className="w-full h-32 object-cover"/>
                                                    <div className="p-4 flex flex-col flex-grow">
                                                        <h3 className="font-semibold">{ad.title}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1 flex-grow">{ad.message}</p>
                                                        {ad.ctaLink && (
                                                            <Button asChild size="sm" className="mt-4 w-full">
                                                                <a href={ad.ctaLink} target="_blank" rel="noopener noreferrer">Learn More</a>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        <Card className="rounded-lg shadow-lg">
                            <CardHeader>
                                <CardTitle>Join a New Batch</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                                <form onSubmit={handleJoinBatch} className="flex flex-col sm:flex-row sm:items-end gap-4">
                                    <div className="grid gap-2 flex-1">
                                        <Label htmlFor="batch-code">Enter Batch Code</Label>
                                        <Input 
                                            id="batch-code" 
                                            placeholder="e.g., A1B2C3" 
                                            value={batchCode}
                                            onChange={(e) => setBatchCode(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full sm:w-auto" disabled={isJoining || !batchCode.trim()}>
                                        {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Send Request
                                    </Button>
                                </form>
                                {joinMessage.text && (
                                    <p className={`mt-4 text-sm font-medium ${
                                        joinMessage.type === 'error' ? 'text-destructive' : 
                                        joinMessage.type === 'success' ? 'text-green-600' : 'text-muted-foreground'
                                    }`}>
                                        {joinMessage.text}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Megaphone className="mr-3 h-6 w-6 text-primary"/>
                                    Announcements
                                </CardTitle>
                                <CardDescription>
                                    Important updates and announcements from the admin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {announcements && announcements.length > 0 ? (
                                    <div className="grid gap-4">
                                        {announcements.map(ann => (
                                            <div key={ann.id} className="p-4 rounded-lg border bg-background">
                                                <p className="text-sm font-medium">{ann.message}</p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Posted: {formatDate(ann.createdAt)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 flex flex-col items-center">
                                        <Megaphone className="h-10 w-10 text-muted-foreground mb-4" />
                                        <h3 className="font-semibold">No new announcements right now.</h3>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                         <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-4">My Enrollments</h2>
                            {enrollments && enrollments.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {enrollments.map((enrollment, i) => (
                                        <motion.div
                                            key={enrollment.id}
                                            custom={i}
                                            initial="hidden"
                                            animate="visible"
                                            variants={cardVariants}
                                            whileHover={{ scale: 1.02, boxShadow: "0px 8px 25px -5px rgba(0,0,0,0.1), 0px 10px 10px -5px rgba(0,0,0,0.04)" }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Card className="p-4 flex flex-col h-full transition-shadow duration-300 rounded-lg shadow-lg">
                                                <div className="flex items-start gap-4 flex-grow">
                                                    {renderStatusIcon(enrollment.status)}
                                                    <div className="flex-grow min-w-0">
                                                        <p className="font-semibold text-lg break-words">{enrollment.batchName}</p>
                                                        <p className="text-sm text-muted-foreground break-words">Teacher: {enrollment.teacherName}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {enrollment.status === 'pending' 
                                                                ? `Requested: ${formatDate(enrollment.createdAt)}` 
                                                                : `Approved: ${formatDate(enrollment.approvedAt)}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 self-end mt-4">
                                                    {enrollment.status === 'pending' ? (
                                                        <Button variant="outline" size="sm" onClick={() => handleCancelRequest(enrollment.id)}>
                                                            Cancel Request
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link href={`/teachers/${enrollment.teacherId}`}>View Teacher</Link>
                                                            </Button>
                                                            <Button asChild size="sm">
                                                                <Link href={`/dashboard/student/batch/${enrollment.batchId}`}>
                                                                    View Batch
                                                                </Link>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full bg-background border rounded-lg p-12 text-center flex flex-col items-center">
                                    <School className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold">You haven't joined any batches yet.</h3>
                                    <p className="text-muted-foreground mt-1">Find a teacher or enter a batch code to begin! 🚀</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.main>
        </div>
    );
}

    