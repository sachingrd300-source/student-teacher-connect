'use client';

import { useState, useMemo, useEffect, ChangeEvent, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// UI Components
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import { 
    Loader2, School, Users, FileText, ShoppingBag, Home, Briefcase, Trash, Upload,
    Check, X, Eye, PackageOpen, DollarSign, UserCheck, Gift, ArrowRight, Menu, Search, GraduationCap,
    LayoutDashboard, Bell, BarChart2, TrendingUp, Users2, Send, History 
} from 'lucide-react';

// --- Interfaces ---
interface UserProfile { id: string; name: string; email: string; role: 'admin' | 'student' | 'teacher'; createdAt: string; lastLoginDate?: string; }
interface HomeTutorApplication { id: string; teacherId: string; teacherName: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; processedAt?: string; }
interface HomeBooking { id: string; studentName: string; fatherName?: string; mobileNumber: string; address: string; studentClass: string; status: 'Pending' | 'Assigned' | 'Completed' | 'Cancelled'; createdAt: string; assignedTeacherId?: string; }
type MaterialCategory = 'notes' | 'books' | 'pyqs' | 'dpps';
interface FreeMaterial { id: string; title: string; description?: string; fileURL: string; fileName: string; fileType: string; category: MaterialCategory; createdAt: string; }
interface ShopItem { id: string; name: string; description?: string; price: number; imageUrl: string; imageName: string; purchaseUrl: string; createdAt: string; }
interface Batch { id: string; name: string; teacherId: string; }
interface Enrollment { id: string; studentId: string; teacherId: string; batchId: string; status: 'approved' | 'pending'; }
interface Announcement { id: string; message: string; target: 'all' | 'teachers' | 'students'; createdAt: string; }
interface AdminActivity { id: string; adminId: string; adminName: string; action: string; targetId?: string; createdAt: string; }
interface SchoolData { id: string; name: string; principalName: string; }

// --- Main Component ---
export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();

    // --- Form States ---
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [materialCategory, setMaterialCategory] = useState<MaterialCategory | ''>('');
    const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
    
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemPurchaseUrl, setItemPurchaseUrl] = useState('');
    const [itemImage, setItemImage] = useState<File | null>(null);
    const [isUploadingItem, setIsUploadingItem] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [announcementTarget, setAnnouncementTarget] = useState<'all' | 'teachers' | 'students'>('all');
    const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

    // --- Firestore Data Hooks ---
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const userRole = userProfile?.role;

    // Queries
    const allUsersQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const homeTutorApplicationsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'homeTutorApplications'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const homeBookingsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'homeBookings'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const freeMaterialsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'freeMaterials'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const shopItemsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'shopItems'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const announcementsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const adminActivitiesQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'adminActivities'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    
    // Data from hooks
    const { data: allUsersData, isLoading: usersLoading } = useCollection<UserProfile>(allUsersQuery);
    const { data: homeTutorApplications, isLoading: applicationsLoading } = useCollection<HomeTutorApplication>(homeTutorApplicationsQuery);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);
    const { data: announcements, isLoading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);
    const { data: adminActivities, isLoading: activitiesLoading } = useCollection<AdminActivity>(adminActivitiesQuery);

    
    // --- Auth & Role Check ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
        } else if (userProfile && userRole !== 'admin') {
            router.replace('/dashboard');
        }
    }, [user, userRole, isUserLoading, profileLoading, router, userProfile]);
    
    // --- Admin Action Logger ---
    const logAdminAction = (action: string, targetId?: string) => {
        if (!firestore || !userProfile || userProfile.role !== 'admin') return;
        
        const logData = {
            adminId: userProfile.id,
            adminName: userProfile.name,
            action,
            targetId: targetId || '',
            createdAt: new Date().toISOString()
        };
        
        addDoc(collection(firestore, 'adminActivities'), logData)
            .catch(err => console.error("Failed to log admin action:", err));
    };

    // --- Memoized Data Filtering ---
    const allUsers = useMemo(() => allUsersData?.filter(u => u.role !== 'admin') || [], [allUsersData]);
    
    const userStats = useMemo(() => ({
        teacherCount: allUsers.filter(u => u.role === 'teacher').length,
        studentCount: allUsers.filter(u => u.role === 'student').length,
    }), [allUsers]);

    const searchedUsers = useMemo(() => {
        if (!userSearchQuery) return allUsers;
        const lowercasedQuery = userSearchQuery.toLowerCase();
        return allUsers.filter(user => 
            user.name.toLowerCase().includes(lowercasedQuery) ||
            user.email.toLowerCase().includes(lowercasedQuery)
        );
    }, [allUsers, userSearchQuery]);

    const usersForDisplay = useMemo(() => ({
        all: searchedUsers,
        teachers: searchedUsers.filter(u => u.role === 'teacher'),
        students: searchedUsers.filter(u => u.role === 'student'),
    }), [searchedUsers]);


    const filteredApplications = useMemo(() => {
        if (!homeTutorApplications) return { pending: [], approved: [], rejected: [] };
        return {
            pending: homeTutorApplications.filter(a => a.status === 'pending'),
            approved: homeTutorApplications.filter(a => a.status === 'approved'),
            rejected: homeTutorApplications.filter(a => a.status === 'rejected'),
        };
    }, [homeTutorApplications]);
    
    const filteredMaterials = useMemo(() => {
        if (!materials) return { notes: [], books: [], pyqs: [], dpps: [] };
        return {
            notes: materials.filter(m => m.category === 'notes'),
            books: materials.filter(m => m.category === 'books'),
            pyqs: materials.filter(m => m.category === 'pyqs'),
            dpps: materials.filter(m => m.category === 'dpps'),
        };
    }, [materials]);


    // --- Event Handlers ---
    const handleApplication = (application: HomeTutorApplication, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        
        const applicationRef = doc(firestore, 'homeTutorApplications', application.id);
        const applicationUpdate = { status: newStatus, processedAt: new Date().toISOString() };
        batch.update(applicationRef, applicationUpdate);
        
        const teacherRef = doc(firestore, 'users', application.teacherId);
        const teacherUpdate = { isHomeTutor: newStatus === 'approved' };
        batch.update(teacherRef, teacherUpdate);
        
        batch.commit()
            .then(() => {
                logAdminAction(`Application for '${application.teacherName}' ${newStatus}`, application.id);
            })
            .catch(error => {
                console.error(`Error handling application:`, error);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    operation: 'write',
                    path: `batch update for application ${application.id}`,
                    requestResourceData: { applicationUpdate, teacherUpdate }
                }));
            });
    };
    
    const handleDeleteBooking = (booking: HomeBooking) => {
        if (!firestore) return;
        const bookingDocRef = doc(firestore, 'homeBookings', booking.id);
        deleteDoc(bookingDocRef)
            .then(() => {
                logAdminAction(`Deleted booking for '${booking.studentName}'`, booking.id);
            })
            .catch(error => {
                console.error(`Error deleting booking:`, error);
                errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: bookingDocRef.path }));
            });
    };

    const handleMaterialUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFile || !materialTitle.trim() || !materialCategory || !storage || !firestore) return;
        
        setIsUploadingMaterial(true);
        const fileName = `${Date.now()}_${materialFile.name}`;
        const fileRef = ref(storage, `freeMaterials/${fileName}`);

        try {
            const uploadTask = await uploadBytes(fileRef, materialFile);
            const downloadURL = await getDownloadURL(uploadTask.ref);

            const materialData = { 
                title: materialTitle.trim(), 
                description: materialDescription.trim(), 
                fileURL: downloadURL, 
                fileName, 
                fileType: materialFile.type, 
                category: materialCategory, 
                createdAt: new Date().toISOString() 
            };
            
            addDoc(collection(firestore, 'freeMaterials'), materialData)
                .then(docRef => {
                    logAdminAction(`Uploaded free material: "${materialData.title}"`, docRef.id);
                })
                .catch((error) => {
                    console.error("Error adding material to Firestore:", error);
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'create', path: 'freeMaterials', requestResourceData: materialData }));
                });

            setMaterialTitle(''); 
            setMaterialDescription(''); 
            setMaterialFile(null); 
            setMaterialCategory('');
            if (document.getElementById('material-file')) {
                (document.getElementById('material-file') as HTMLInputElement).value = '';
            }

        } catch (error) {
            console.error("Error uploading file to storage:", error);
        } finally {
            setIsUploadingMaterial(false);
        }
    };
    
    const handleDeleteMaterial = (material: FreeMaterial) => {
        if (!firestore || !storage) return;

        const materialDocRef = doc(firestore, 'freeMaterials', material.id);
        const fileRef = ref(storage, `freeMaterials/${material.fileName}`);

        deleteDoc(materialDocRef).then(() => {
            logAdminAction(`Deleted free material: "${material.title}"`, material.id);
            // Delete file from storage after doc is deleted from firestore
            deleteObject(fileRef).catch(error => {
                console.warn("Could not delete file from storage:", error);
            });
        }).catch(error => {
            console.error("Error deleting material from Firestore:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: materialDocRef.path }));
        });
    };

    const handleShopItemUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemImage || !itemName.trim() || !itemPrice || !itemPurchaseUrl.trim() || !storage || !firestore) return;
        
        setIsUploadingItem(true);
        const imageName = `${Date.now()}_${itemImage.name}`;
        const imageRef = ref(storage, `shopItems/${imageName}`);
        
        try {
            const uploadTask = await uploadBytes(imageRef, itemImage);
            const downloadURL = await getDownloadURL(uploadTask.ref);
            
            const itemData = { 
                name: itemName.trim(), 
                description: itemDescription.trim(), 
                price: parseFloat(itemPrice), 
                imageUrl: downloadURL, 
                imageName, 
                purchaseUrl: itemPurchaseUrl.trim(), 
                createdAt: new Date().toISOString() 
            };
            
            addDoc(collection(firestore, 'shopItems'), itemData)
                .then(docRef => {
                    logAdminAction(`Uploaded shop item: "${itemData.name}"`, docRef.id);
                })
                .catch((error) => {
                    console.error("Error adding shop item to Firestore:", error);
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'create', path: 'shopItems', requestResourceData: itemData }));
                });
            
            setItemName(''); setItemDescription(''); setItemPrice(''); setItemPurchaseUrl(''); setItemImage(null);
            if (document.getElementById('item-image')) {
                (document.getElementById('item-image') as HTMLInputElement).value = '';
            }
        } catch (error) { 
            console.error("Error uploading shop item image:", error); 
        } finally { 
            setIsUploadingItem(false); 
        }
    };
    
    const handleDeleteShopItem = (item: ShopItem) => {
        if (!firestore || !storage) return;
        
        const itemDocRef = doc(firestore, 'shopItems', item.id);
        const imageRef = ref(storage, `shopItems/${item.imageName}`);

        deleteDoc(itemDocRef).then(() => {
            logAdminAction(`Deleted shop item: "${item.name}"`, item.id);
            deleteObject(imageRef).catch(error => {
                console.warn("Could not delete shop item image from storage:", error);
            });
        }).catch(error => {
            console.error("Error deleting shop item from Firestore:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: itemDocRef.path }));
        });
    };

    const handleSendAnnouncement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementMessage.trim() || !firestore) return;
        
        setIsSendingAnnouncement(true);

        const announcementData = {
            message: announcementMessage.trim(),
            target: announcementTarget,
            createdAt: new Date().toISOString(),
        };

        addDoc(collection(firestore, 'announcements'), announcementData)
            .then((docRef) => {
                logAdminAction(`Sent announcement to ${announcementTarget}`, docRef.id);
                setAnnouncementMessage('');
            })
            .catch((error) => {
                console.error("Error sending announcement:", error);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    operation: 'create',
                    path: 'announcements',
                    requestResourceData: announcementData
                }));
            })
            .finally(() => {
                setIsSendingAnnouncement(false);
            });
    };

    // --- Loading State ---
    const isLoading = isUserLoading || profileLoading || usersLoading || applicationsLoading || bookingsLoading || materialsLoading || shopItemsLoading || announcementsLoading || activitiesLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Admin Portal...</p>
            </div>
        );
    }
    
    const getInitials = (name = '') => name ? name.split(' ').map((n) => n[0]).join('') : '';

    const formatDate = (dateString: string, withTime: boolean = false) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        if (withTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return date.toLocaleString('en-US', options);
    };

    // --- Render Functions ---
    
    const renderUsersView = () => {
        const renderUserList = (userList: UserProfile[]) => {
            if (!userList || userList.length === 0) {
                if (userSearchQuery) {
                    return <div className="text-center py-12">No users found for "{userSearchQuery}".</div>;
                }
                return <div className="text-center py-12">No users in this category yet.</div>;
            }
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userList.map(u => (
                        <Card key={u.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Avatar className="w-12 h-12 text-lg"><AvatarFallback>{getInitials(u.name)}</AvatarFallback></Avatar>
                                <div>
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
            <div className="grid gap-8">
                <h1 className="text-3xl font-bold">Manage Users</h1>
                
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{allUsers.length}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{userStats.teacherCount}</div></CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Students</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{userStats.studentCount}</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                         <Input 
                            placeholder="Search by name or email..."
                            className="max-w-sm"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="all">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All ({usersForDisplay.all.length})</TabsTrigger>
                                <TabsTrigger value="teachers">Teachers ({usersForDisplay.teachers.length})</TabsTrigger>
                                <TabsTrigger value="students">Students ({usersForDisplay.students.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="all" className="mt-4">{renderUserList(usersForDisplay.all)}</TabsContent>
                            <TabsContent value="teachers" className="mt-4">{renderUserList(usersForDisplay.teachers)}</TabsContent>
                            <TabsContent value="students" className="mt-4">{renderUserList(usersForDisplay.students)}</TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderApplicationsView = () => (
        <div className="grid gap-8">
            <h1 className="text-3xl font-bold">Teacher Applications</h1>
            <Card>
                <CardContent className="p-4">
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="pending">Pending ({filteredApplications.pending.length})</TabsTrigger>
                            <TabsTrigger value="approved">Approved ({filteredApplications.approved.length})</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected ({filteredApplications.rejected.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending" className="mt-4">
                            {filteredApplications.pending.length > 0 ? (
                                <div className="grid gap-4">{filteredApplications.pending.map(app => (<div key={app.id} className="flex items-center justify-between p-4 rounded-lg border"><div><p className="font-semibold">{app.teacherName}</p><p className="text-xs text-muted-foreground mt-1">Applied: {formatDate(app.createdAt)}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => handleApplication(app, 'approved')}><Check className="mr-2 h-4 w-4" />Approve</Button><Button size="sm" variant="destructive" onClick={() => handleApplication(app, 'rejected')}><X className="mr-2 h-4 w-4" />Reject</Button></div></div>))}</div>
                            ) : (<div className="text-center py-12">No pending applications.</div>)}
                        </TabsContent>
                        <TabsContent value="approved" className="mt-4">
                            {filteredApplications.approved.length > 0 ? (<div className="grid gap-4">{filteredApplications.approved.map(app => (<div key={app.id} className="p-4 rounded-lg border flex justify-between items-center"><div><p className="font-semibold">{app.teacherName}</p>{app.processedAt && <p className="text-xs text-muted-foreground">Approved: {formatDate(app.processedAt)}</p>}</div><span className="text-sm font-medium text-success">Approved</span></div>))}</div>) : (<div className="text-center py-12">No approved applications.</div>)}
                        </TabsContent>
                        <TabsContent value="rejected" className="mt-4">
                            {filteredApplications.rejected.length > 0 ? (<div className="grid gap-4">{filteredApplications.rejected.map(app => (<div key={app.id} className="p-4 rounded-lg border flex justify-between items-center"><div><p className="font-semibold">{app.teacherName}</p>{app.processedAt && <p className="text-xs text-muted-foreground">Rejected: {formatDate(app.processedAt)}</p>}</div><span className="text-sm font-medium text-destructive">Rejected</span></div>))}</div>) : (<div className="text-center py-12">No rejected applications.</div>)}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );

    const renderBookingsView = () => (
        <div className="grid gap-8">
            <h1 className="text-3xl font-bold">Home Teacher Bookings</h1>
            <Card>
                <CardContent className="p-4">
                    {homeBookings && homeBookings.length > 0 ? (
                        <div className="grid gap-4">
                            {homeBookings.map(booking => (
                                <div key={booking.id} className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                                    <div className="grid gap-2"><p className="font-semibold">{booking.studentName} - <span className="font-normal text-muted-foreground">{booking.studentClass}</span></p><p className="text-sm text-muted-foreground">Father: {booking.fatherName || 'N/A'}</p><p className="text-sm text-muted-foreground">Contact: {booking.mobileNumber}</p><p className="text-sm text-muted-foreground">Address: {booking.address}</p><div className="flex items-center gap-2 text-xs text-muted-foreground mt-2"><span>Status:</span><span className={`font-semibold ${booking.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'}`}>{booking.status}</span><span>|</span><span>Created: {formatDate(booking.createdAt, true)}</span></div></div>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteBooking(booking)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                </div>
                            ))}
                        </div>
                    ) : (<div className="text-center py-12">No home teacher bookings.</div>)}
                </CardContent>
            </Card>
        </div>
    );
    
    const renderMaterialsView = () => {
         const renderMaterialList = (materialList: FreeMaterial[]) => {
            if (!materialList || materialList.length === 0) {
                return <div className="text-center py-12">No materials in this category.</div>;
            }
            return (
                <div className="grid gap-4">
                    {materialList.map(material => (
                        <div key={material.id} className="flex items-center justify-between gap-3 p-4 rounded-lg border">
                            <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-primary flex-shrink-0" /><div><p className="font-semibold">{material.title}</p><p className="text-sm text-muted-foreground">{material.description}</p></div></div>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                        </div>
                    ))}
                </div>
            );
        };
        
        return (
            <div className="grid gap-8">
                <h1 className="text-3xl font-bold">Free Materials</h1>
                <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-1">
                        <CardHeader><CardTitle>Upload New Material</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleMaterialUpload} className="grid gap-4">
                                <div className="grid gap-2"><Label htmlFor="material-title">Material Title</Label><Input id="material-title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} required /></div>
                                <div className="grid gap-2"><Label htmlFor="material-category">Category</Label><Select value={materialCategory} onValueChange={(value) => setMaterialCategory(value as any)} required><SelectTrigger id="material-category"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent><SelectItem value="notes">Notes</SelectItem><SelectItem value="books">Books</SelectItem><SelectItem value="pyqs">PYQs</SelectItem><SelectItem value="dpps">DPPs</SelectItem></SelectContent></Select></div>
                                <div className="grid gap-2"><Label htmlFor="material-file">File</Label><Input id="material-file" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setMaterialFile(e.target.files ? e.target.files[0] : null)} required /></div>
                                <div className="grid gap-2"><Label htmlFor="material-description">Description (Optional)</Label><Textarea id="material-description" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} /></div>
                                <Button type="submit" disabled={isUploadingMaterial}>{isUploadingMaterial ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload Material</Button>
                            </form>
                        </CardContent>
                    </Card>
                     <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Uploaded Materials</CardTitle></CardHeader>
                        <CardContent>
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="books">Books</TabsTrigger><TabsTrigger value="pyqs">PYQs</TabsTrigger><TabsTrigger value="dpps">DPPs</TabsTrigger></TabsList>
                                <TabsContent value="all" className="mt-4">{renderMaterialList(materials || [])}</TabsContent>
                                <TabsContent value="notes" className="mt-4">{renderMaterialList(filteredMaterials.notes)}</TabsContent>
                                <TabsContent value="books" className="mt-4">{renderMaterialList(filteredMaterials.books)}</TabsContent>
                                <TabsContent value="pyqs" className="mt-4">{renderMaterialList(filteredMaterials.pyqs)}</TabsContent>
                                <TabsContent value="dpps" className="mt-4">{renderMaterialList(filteredMaterials.dpps)}</TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    };

    const renderShopView = () => (
        <div className="grid gap-8">
            <h1 className="text-3xl font-bold">Shop Management</h1>
            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Add New Item</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleShopItemUpload} className="grid gap-4">
                            <div className="grid gap-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="item-price">Price (INR)</Label><Input id="item-price" type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} /></div>
                            <div className="grid gap-2"><Label htmlFor="item-purchase-url">Purchase URL</Label><Input id="item-purchase-url" type="url" value={itemPurchaseUrl} onChange={(e) => setItemPurchaseUrl(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="item-image">Item Image</Label><Input id="item-image" type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setItemImage(e.target.files ? e.target.files[0] : null)} required /></div>
                            <Button type="submit" disabled={isUploadingItem}>{isUploadingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Add Item</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Existing Shop Items</CardTitle></CardHeader>
                    <CardContent>
                        {shopItems && shopItems.length > 0 ? (
                            <div className="grid gap-4">
                                {shopItems.map(item => (
                                    <div key={item.id} className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                                        <div className="flex items-start gap-4"><Image src={item.imageUrl} alt={item.name} width={80} height={80} className="rounded-lg object-cover" /><div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground">{item.description}</p><p className="font-semibold text-primary mt-2 flex items-center"><DollarSign className="h-4 w-4 mr-1" />{item.price.toFixed(2)}</p></div></div>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteShopItem(item)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                    </div>
                                ))}
                            </div>
                        ) : (<div className="text-center py-12">The shop is empty.</div>)}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
    
    const renderNotificationsView = () => (
        <div className="grid gap-8">
            <h1 className="text-3xl font-bold">Notifications & Announcements</h1>
             <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Send Announcement</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendAnnouncement} className="grid gap-4">
                            <div className="grid gap-2"><Label htmlFor="announcement-message">Message</Label><Textarea id="announcement-message" value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} required placeholder="Your message here..." /></div>
                            <div className="grid gap-2"><Label htmlFor="announcement-target">Target Audience</Label><Select value={announcementTarget} onValueChange={(v) => setAnnouncementTarget(v as any)} required><SelectTrigger id="announcement-target"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="teachers">All Teachers</SelectItem><SelectItem value="students">All Students</SelectItem></SelectContent></Select></div>
                             <Button type="submit" disabled={isSendingAnnouncement}>
                                {isSendingAnnouncement ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Send
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Announcement History</CardTitle></CardHeader>
                    <CardContent>
                        {announcements && announcements.length > 0 ? (
                            <div className="grid gap-4">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="p-4 rounded-lg border">
                                        <p className="text-sm">{ann.message}</p>
                                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground"><span>Target: <span className="font-semibold capitalize">{ann.target}</span></span><span>{formatDate(ann.createdAt, true)}</span></div>
                                    </div>
                                ))}
                            </div>
                        ) : (<div className="text-center py-12">No announcements sent yet.</div>)}
                    </CardContent>
                </Card>
             </div>
        </div>
    );
    
    const renderActivityLogView = () => (
        <div className="grid gap-8">
            <h1 className="text-3xl font-bold">Admin Activity Log</h1>
             <Card>
                <CardContent className="p-4">
                    {adminActivities && adminActivities.length > 0 ? (
                        <div className="grid gap-4">
                            {adminActivities.map(activity => (
                                <div key={activity.id} className="flex justify-between items-center p-4 rounded-lg border">
                                    <div><p className="font-medium"><span className="font-bold text-primary">{activity.adminName}</span> {activity.action}</p></div>
                                    <div className="text-xs text-muted-foreground">{formatDate(activity.createdAt, true)}</div>
                                </div>
                            ))}
                        </div>
                    ) : (<div className="text-center py-12">No activity recorded yet.</div>)}
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8">
                 <div className="max-w-6xl mx-auto">
                    <Tabs defaultValue="users" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 mb-4">
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="applications">Applications</TabsTrigger>
                            <TabsTrigger value="bookings">Bookings</TabsTrigger>
                            <TabsTrigger value="materials">Materials</TabsTrigger>
                            <TabsTrigger value="shop">Shop</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                        </TabsList>
                        <TabsContent value="users">{renderUsersView()}</TabsContent>
                        <TabsContent value="applications">{renderApplicationsView()}</TabsContent>
                        <TabsContent value="bookings">{renderBookingsView()}</TabsContent>
                        <TabsContent value="materials">{renderMaterialsView()}</TabsContent>
                        <TabsContent value="shop">{renderShopView()}</TabsContent>
                        <TabsContent value="notifications">{renderNotificationsView()}</TabsContent>
                        <TabsContent value="activity">{renderActivityLogView()}</TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
