
'use client';

import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, PlusCircle, MoreVertical, BookUser, Clock, Megaphone, Users, UserPlus, Wand2, Send, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { generateAnnouncement } from '@/ai/flows/announcement-generator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';


interface Class {
    id: string;
    title: string;
    subject: string;
    batchTime: string;
    classCode: string;
    createdAt?: Timestamp;
    fee?: number;
}

interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    classTitle: string;
    classId: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: Timestamp;
}

interface Announcement {
    id: string;
    content: string;
    classTitle: string;
    classId: string;
    createdAt: Timestamp;
}

type ActivityItem = (Enrollment & { type: 'enrollment' }) | (Announcement & { type: 'announcement' });


const StatCard = ({ title, value, icon, isLoading }: { title: string, value: string | number, icon: React.ReactNode, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="h-8 w-1/2 bg-muted rounded-md animate-pulse" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
    </Card>
);

export default function TeacherDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();

    // Class form state
    const [classTitle, setClassTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [batchTime, setBatchTime] = useState('');
    const [fee, setFee] = useState('');
    const [isProcessingClass, setIsProcessingClass] = useState(false);
    const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);

    // Announcement state
    const [announcementContent, setAnnouncementContent] = useState('');
    const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
    const [selectedClassIds, setSelectedClassIds] = useState<Record<string, boolean>>({});
    
    // AI Dialog state
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [aiKeyPoints, setAiKeyPoints] = useState('');
    const [aiTone, setAiTone] = useState<'Formal' | 'Casual'>('Casual');
    const [isGenerating, setIsGenerating] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string, status: 'pending_verification' | 'approved' | 'denied'}>(userProfileRef);

    const isTutor = userProfile?.role === 'tutor';

    // Redirect logic
    useEffect(() => {
        if (isAuthLoading || isProfileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile) {
             if (!isTutor) {
                router.replace('/dashboard/student');
            } else if (userProfile.status !== 'approved') {
                router.replace('/dashboard/teacher/status');
            }
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, isTutor, router]);
    
    // --- Data Fetching ---
    const classesQuery = useMemoFirebase(() => {
        if (!isTutor || !firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user, isTutor]);
    const { data: classes, isLoading: classesLoading } = useCollection<Class>(classesQuery);
    
    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid), where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(10));
    }, [firestore, user]);
    const { data: pendingEnrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const announcementsQuery = useMemoFirebase(() => {
        if(!firestore || !user) return null;
        return query(collection(firestore, 'announcements'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
    }, [firestore, user]);
    const { data: recentAnnouncements, isLoading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);


    // --- Stat & Combined Feed Calculations ---
    const approvedStudentsCount = useMemo(() => {
        // This would need another query to be accurate without listing all enrollments.
        // For this dashboard, we'll keep it simple and maybe add it back later if needed.
        return '...'; // Placeholder to avoid fetching all students
    }, []);

    const activityFeed: ActivityItem[] = useMemo(() => {
        const enrollments = (pendingEnrollments || []).map(e => ({...e, type: 'enrollment' as const}));
        const announcements = (recentAnnouncements || []).map(a => ({...a, type: 'announcement' as const}));
        
        const combined = [...enrollments, ...announcements];
        combined.sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);
        
        return combined;
    }, [pendingEnrollments, recentAnnouncements]);


    // --- Form Handlers ---
    const resetClassForm = () => {
        setClassTitle('');
        setSubject('');
        setBatchTime('');
        setFee('');
        setEditingClass(null);
    };

    const handleOpenCreateDialog = () => {
        resetClassForm();
        setIsCreateClassOpen(true);
    };

    const handleOpenEditDialog = (classData: Class) => {
        setEditingClass(classData);
        setClassTitle(classData.title);
        setSubject(classData.subject);
        setBatchTime(classData.batchTime);
        setFee(classData.fee?.toString() || '');
        setIsCreateClassOpen(true);
    };
    
    const handleCloseDialog = () => {
        setIsCreateClassOpen(false);
        setEditingClass(null);
        resetClassForm();
    };

    const handleSaveClass = (e: FormEvent) => {
        e.preventDefault();
        if (editingClass) {
            handleUpdateClass();
        } else {
            handleCreateClass();
        }
    };
    
    const handleCreateClass = () => {
        if (!user || !userProfile || !firestore) return;
        setIsProcessingClass(true);
        
        const newClassData = {
            teacherId: user.uid,
            teacherName: userProfile.name,
            title: classTitle,
            subject,
            batchTime,
            fee: Number(fee) || 0,
            classCode: nanoid(6).toUpperCase(),
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(collection(firestore, 'classes'), newClassData)
          .finally(() => {
              setIsProcessingClass(false);
              handleCloseDialog();
          });
    };

    const handleUpdateClass = () => {
        if (!firestore || !editingClass) return;
        setIsProcessingClass(true);

        const classRef = doc(firestore, 'classes', editingClass.id);
        const updatedData = { title: classTitle, subject, batchTime, fee: Number(fee) || 0 };

        updateDocumentNonBlocking(classRef, updatedData)
            .finally(() => {
                setIsProcessingClass(false);
                handleCloseDialog();
            });
    };

    const handleDeleteClass = (classId: string) => {
        if (!firestore) return;
        if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            deleteDocumentNonBlocking(doc(firestore, 'classes', classId));
        }
    };
    
    const handleGenerateAnnouncement = async () => {
        if (!aiKeyPoints.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateAnnouncement({ keyPoints: aiKeyPoints, tone: aiTone });
            setAnnouncementContent(result.content);
            setIsAiDialogOpen(false);
        } catch (error) {
            console.error("AI generation failed:", error);
            alert("Failed to generate announcement.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePostAnnouncement = async () => {
        if (!user || !userProfile || !firestore || !announcementContent.trim()) return;

        const targetClassIds = Object.keys(selectedClassIds).filter(id => selectedClassIds[id]);
        if (targetClassIds.length === 0) {
            alert("Please select at least one class to post the announcement to.");
            return;
        }

        setIsPostingAnnouncement(true);

        const batch = targetClassIds.map(classId => {
            const targetClass = classes?.find(c => c.id === classId);
            if (!targetClass) return null;

            const newAnnouncement = {
                classId: classId,
                teacherId: user.uid,
                teacherName: userProfile.name,
                classTitle: targetClass.title,
                content: announcementContent,
                createdAt: serverTimestamp(),
            };
            return addDocumentNonBlocking(collection(firestore, 'announcements'), newAnnouncement);
        }).filter(Boolean);

        await Promise.all(batch);

        setAnnouncementContent('');
        setSelectedClassIds({});
        setIsPostingAnnouncement(false);
        alert(`Announcement posted to ${targetClassIds.length} class(es).`);
    };

    if (isAuthLoading || isProfileLoading || !userProfile || userProfile.status !== 'approved') {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading teacher dashboard...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                         <StatCard title="Total Classes" value={classes?.length ?? 0} icon={<BookUser className="h-4 w-4" />} isLoading={classesLoading} />
                         <StatCard title="Pending Requests" value={pendingEnrollments?.length ?? 0} icon={<Clock className="h-4 w-4" />} isLoading={enrollmentsLoading} />
                         <StatCard title="Recent Announcements" value={recentAnnouncements?.length ?? 0} icon={<Megaphone className="h-4 w-4" />} isLoading={announcementsLoading} />
                    </div>
                    
                    <div className="grid gap-8 lg:grid-cols-3 animate-fade-in-down">
                        <div className="lg:col-span-2 space-y-8">
                             <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className='mb-4 sm:mb-0'>
                                            <CardTitle>Your Classes</CardTitle>
                                            <CardDescription>Select a class to manage students and view details.</CardDescription>
                                        </div>
                                        <Button onClick={handleOpenCreateDialog}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Create New Class
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {classesLoading && <p>Loading classes...</p>}
                                    {classes && classes.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                                            {classes.map((c) => (
                                                <Card key={c.id} className="flex flex-col">
                                                    <CardHeader className="flex-grow">
                                                        <CardTitle className="text-lg">{c.title}</CardTitle>
                                                        <CardDescription>{c.subject} ({c.batchTime})</CardDescription>
                                                        <div className="pt-2">
                                                            <div className="text-sm text-muted-foreground">Class Code:</div>
                                                            <div className="font-mono text-base font-bold text-foreground">{c.classCode}</div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground pt-2">Created on: {c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                                    </CardHeader>
                                                    <CardFooter className="flex justify-between items-center">
                                                        <Link href={`/dashboard/teacher/class/${c.id}`} passHref className="flex-grow">
                                                            <Button className="w-full">Manage</Button>
                                                        </Link>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="ml-2 flex-shrink-0">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                    <span className="sr-only">More options</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleOpenEditDialog(c)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    <span>Edit</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDeleteClass(c.id)} className="text-destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>Delete</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        !classesLoading && <p className="text-center text-muted-foreground py-8">You haven't created any classes yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Announcement</CardTitle>
                                    <CardDescription>Post a message to multiple classes at once.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <Textarea 
                                        placeholder="Type your announcement..."
                                        value={announcementContent}
                                        onChange={(e) => setAnnouncementContent(e.target.value)}
                                        rows={4}
                                     />
                                     <Button variant="outline" className="w-full" onClick={() => setIsAiDialogOpen(true)}>
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generate with AI
                                     </Button>
                                     <div className="flex gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full">
                                                    Select Classes ({Object.values(selectedClassIds).filter(Boolean).length})
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-56">
                                                <DropdownMenuLabel>Your Classes</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {classes?.map(c => (
                                                    <DropdownMenuCheckboxItem
                                                        key={c.id}
                                                        checked={selectedClassIds[c.id] || false}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedClassIds(prev => ({...prev, [c.id]: !!checked}))
                                                        }}
                                                    >
                                                        {c.title}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button 
                                            className="flex-shrink-0"
                                            onClick={handlePostAnnouncement}
                                            disabled={isPostingAnnouncement || announcementContent.trim().length === 0}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                     </div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     {(enrollmentsLoading || announcementsLoading) ? <p>Loading activity...</p> : activityFeed.length > 0 ? (
                                        <div className="space-y-4">
                                            {activityFeed.map(item => (
                                                <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 text-sm">
                                                    <div className={cn("mt-1 h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full",
                                                        item.type === 'enrollment' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                                    )}>
                                                        {item.type === 'enrollment' ? <UserPlus className="h-3 w-3"/> : <Megaphone className="h-3 w-3"/>}
                                                    </div>
                                                    <div className="flex-1">
                                                        {item.type === 'enrollment' ? (
                                                            <p>
                                                                <span className="font-semibold">{item.studentName}</span> requested to join <span className="font-semibold text-primary">{item.classTitle}</span>.
                                                                <Link href={`/dashboard/teacher/class/${item.classId}`} className="ml-2 text-xs text-primary hover:underline">View</Link>
                                                            </p>
                                                        ) : (
                                                            <p>You posted in <span className="font-semibold text-primary">{item.classTitle}</span>: <span className="text-muted-foreground line-clamp-1">"{item.content}"</span></p>
                                                        )}
                                                         <p className="text-xs text-muted-foreground">{new Date(item.createdAt.seconds * 1000).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-center text-muted-foreground py-4">No recent activity.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Class Create/Edit Dialog */}
                    <Dialog open={isCreateClassOpen} onOpenChange={handleCloseDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingClass ? 'Edit Class' : 'Create a New Class'}</DialogTitle>
                                <DialogDescription>
                                    {editingClass ? `Make changes to your class details.` : `Fill in the details to create a new class batch.`}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveClass} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Class Title</Label>
                                    <Input id="title" placeholder="e.g., Grade 10 Physics" value={classTitle} onChange={(e) => setClassTitle(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="e.g., Physics" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="batch-time">Batch Timing</Label>
                                    <Input id="batch-time" placeholder="e.g., 10:00 AM - 11:30 AM" value={batchTime} onChange={(e) => setBatchTime(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fee">Fee (Optional)</Label>
                                    <Input id="fee" type="number" placeholder="e.g., 500" value={fee} onChange={(e) => setFee(e.target.value)} />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="secondary" onClick={handleCloseDialog}>Cancel</Button>
                                    <Button type="submit" disabled={isProcessingClass}>
                                        {isProcessingClass ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                     {/* AI Announcement Dialog */}
                     <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>AI Announcement Assistant</DialogTitle>
                                <DialogDescription>Provide key points and let AI write the full announcement.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ai-key-points">Key Points</Label>
                                    <Textarea id="ai-key-points" placeholder="e.g., Test on Friday, Chapter 5. Bring calculator." value={aiKeyPoints} onChange={(e) => setAiKeyPoints(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tone</Label>
                                    <RadioGroup value={aiTone} onValueChange={(v: 'Formal' | 'Casual') => setAiTone(v)} className="flex gap-4">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="Casual" id="t-casual" /><Label htmlFor="t-casual">Casual</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="Formal" id="t-formal" /><Label htmlFor="t-formal">Formal</Label></div>
                                    </RadioGroup>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setIsAiDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleGenerateAnnouncement} disabled={isGenerating}>
                                    {isGenerating ? 'Generating...' : 'Generate & Use'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
        </div>
    );
}
