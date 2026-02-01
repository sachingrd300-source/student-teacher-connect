
'use client';

import { useState, useMemo, useEffect, ChangeEvent, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

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
    Check, X, Eye, PackageOpen, DollarSign, UserCheck, Gift, ArrowRight
} from 'lucide-react';

// --- Interfaces ---
interface UserProfile { id: string; name: string; email: string; role: 'admin' | 'student' | 'teacher'; createdAt: string; }
interface HomeTutorApplication { id: string; teacherId: string; teacherName: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; processedAt?: string; }
interface HomeBooking { id: string; studentName: string; fatherName?: string; mobileNumber: string; address: string; studentClass: string; status: 'Pending' | 'Assigned' | 'Completed' | 'Cancelled'; createdAt: string; assignedTeacherId?: string; }
type MaterialCategory = 'notes' | 'books' | 'pyqs' | 'dpps';
interface FreeMaterial { id: string; title: string; description?: string; fileURL: string; fileName: string; fileType: string; category: MaterialCategory; createdAt: string; }
interface ShopItem { id: string; name: string; description?: string; price: number; imageUrl: string; imageName: string; purchaseUrl: string; createdAt: string; }
type AdminView = 'users' | 'applications' | 'bookings' | 'materials' | 'shop';

// --- Helper Functions ---
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
const getInitials = (name = '') => name ? name.split(' ').map((n) => n[0]).join('') : '';

// Animation Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};
const itemFadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// --- Main Component ---
export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    
    const [activeView, setActiveView] = useState<AdminView>('users');

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

    // Data from hooks
    const { data: allUsersData, isLoading: usersLoading } = useCollection<UserProfile>(allUsersQuery);
    const { data: homeTutorApplications, isLoading: applicationsLoading } = useCollection<HomeTutorApplication>(homeTutorApplicationsQuery);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);

    
    // --- Auth & Role Check ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
        } else if (userRole && userRole !== 'admin') {
            router.replace('/dashboard');
        }
    }, [user, userRole, isUserLoading, profileLoading, router]);

    // --- Memoized Data Filtering ---
    const allUsers = useMemo(() => allUsersData?.filter(u => u.role !== 'admin') || [], [allUsersData]);
    const filteredUsers = useMemo(() => ({
        teachers: allUsers.filter(u => u.role === 'teacher'),
        students: allUsers.filter(u => u.role === 'student'),
    }), [allUsers]);

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
    const handleApplication = async (application: HomeTutorApplication, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        const applicationRef = doc(firestore, 'homeTutorApplications', application.id);
        batch.update(applicationRef, { status: newStatus, processedAt: new Date().toISOString() });
        const teacherRef = doc(firestore, 'users', application.teacherId);
        batch.update(teacherRef, { isHomeTutor: newStatus === 'approved' });
        try { await batch.commit(); } catch (error) { console.error(`Error handling application:`, error); }
    };
    
    const handleDeleteBooking = (bookingId: string) => {
        if (!firestore) return;
        const bookingDocRef = doc(firestore, 'homeBookings', bookingId);
        deleteDoc(bookingDocRef).catch(error => errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: bookingDocRef.path })));
    };

    const handleMaterialUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFile || !materialTitle.trim() || !materialCategory || !storage || !firestore || !user) return;
        setIsUploadingMaterial(true);
        const fileName = `${Date.now()}_${materialFile.name}`;
        const fileRef = ref(storage, `freeMaterials/${fileName}`);
        try {
            await uploadBytes(fileRef, materialFile);
            const downloadURL = await getDownloadURL(fileRef);
            const materialData = { title: materialTitle.trim(), description: materialDescription.trim(), fileURL: downloadURL, fileName, fileType: materialFile.type, category: materialCategory, createdAt: new Date().toISOString() };
            addDoc(collection(firestore, 'freeMaterials'), materialData)
                .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'create', path: 'freeMaterials', requestResourceData: materialData })));
            setMaterialTitle(''); setMaterialDescription(''); setMaterialFile(null); setMaterialCategory('');
            if (document.getElementById('material-file')) (document.getElementById('material-file') as HTMLInputElement).value = '';
        } catch (error) { console.error("Error uploading file:", error); } 
        finally { setIsUploadingMaterial(false); }
    };
    
    const handleDeleteMaterial = async (material: FreeMaterial) => {
        if (!firestore || !storage) return;
        const fileRef = ref(storage, `freeMaterials/${material.fileName}`);
        const materialDocRef = doc(firestore, 'freeMaterials', material.id);
        try {
            await deleteObject(fileRef);
            deleteDoc(materialDocRef).catch(error => errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: materialDocRef.path })));
        } catch (error) { console.error("Error deleting material:", error); }
    };

    const handleShopItemUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemImage || !itemName.trim() || !itemPrice || !itemPurchaseUrl.trim() || !storage || !firestore) return;
        setIsUploadingItem(true);
        const imageName = `${Date.now()}_${itemImage.name}`;
        const imageRef = ref(storage, `shopItems/${imageName}`);
        try {
            await uploadBytes(imageRef, itemImage);
            const downloadURL = await getDownloadURL(imageRef);
            const itemData = { name: itemName.trim(), description: itemDescription.trim(), price: parseFloat(itemPrice), imageUrl: downloadURL, imageName, purchaseUrl: itemPurchaseUrl.trim(), createdAt: new Date().toISOString() };
            addDoc(collection(firestore, 'shopItems'), itemData)
                .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'create', path: 'shopItems', requestResourceData: itemData })));
            setItemName(''); setItemDescription(''); setItemPrice(''); setItemPurchaseUrl(''); setItemImage(null);
            if (document.getElementById('item-image')) (document.getElementById('item-image') as HTMLInputElement).value = '';
        } catch (error) { console.error("Error uploading shop item:", error); } 
        finally { setIsUploadingItem(false); }
    };
    
    const handleDeleteShopItem = async (item: ShopItem) => {
        if (!firestore || !storage) return;
        const imageRef = ref(storage, `shopItems/${item.imageName}`);
        const itemDocRef = doc(firestore, 'shopItems', item.id);
        try {
            await deleteObject(imageRef);
            deleteDoc(itemDocRef).catch(error => errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: itemDocRef.path })));
        } catch (error) { console.error("Error deleting shop item:", error); }
    };

    // --- Loading State ---
    const isLoading = isUserLoading || profileLoading || usersLoading || applicationsLoading || bookingsLoading || materialsLoading || shopItemsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Admin Portal...</p>
            </div>
        );
    }
    
    const navItems = [
        { id: 'users' as AdminView, label: 'Users', icon: Users, count: allUsers.length },
        { id: 'applications' as AdminView, label: 'Applications', icon: Briefcase, count: filteredApplications.pending.length },
        { id: 'bookings' as AdminView, label: 'Bookings', icon: Home, count: homeBookings?.length || 0 },
        { id: 'materials' as AdminView, label: 'Materials', icon: FileText, count: materials?.length || 0 },
        { id: 'shop' as AdminView, label: 'Shop', icon: ShoppingBag, count: shopItems?.length || 0 },
    ];
    
    const renderNavItems = () => (
        <nav className="grid gap-2">
            {navItems.map(item => (
                <Button 
                    key={item.id}
                    variant={activeView === item.id ? 'default' : 'ghost'}
                    onClick={() => setActiveView(item.id)}
                    className="justify-start gap-3 text-base h-12"
                >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    <span className="ml-auto bg-muted text-muted-foreground text-xs font-mono rounded-full px-2 py-0.5">{item.count}</span>
                </Button>
            ))}
        </nav>
    );

    // --- Render Functions ---
    const renderUsersView = () => {
        const renderUserList = (userList: UserProfile[]) => {
            if (!userList || userList.length === 0) {
                return <div className="text-center py-12 flex flex-col items-center"><Users className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Users Found</h3><p className="text-muted-foreground mt-1">No users in this category yet.</p></div>;
            }
            return (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userList.map(u => (
                        <motion.div variants={itemFadeInUp} key={u.id}>
                            <Card className="flex flex-col h-full rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                    <Avatar className="w-12 h-12 text-lg"><AvatarFallback>{getInitials(u.name)}</AvatarFallback></Avatar>
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
                        </motion.div>
                    ))}
                </motion.div>
            );
        };

        return (
            <div className="grid gap-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-serif">Manage Users</h1>
                    <p className="text-muted-foreground mt-2">View all students and teachers on the platform.</p>
                </div>
                <Card className="rounded-2xl shadow-lg">
                    <CardContent className="p-4">
                        <Tabs defaultValue="all">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All ({allUsers.length})</TabsTrigger>
                                <TabsTrigger value="teachers">Teachers ({filteredUsers.teachers.length})</TabsTrigger>
                                <TabsTrigger value="students">Students ({filteredUsers.students.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="all" className="mt-6">{renderUserList(allUsers)}</TabsContent>
                            <TabsContent value="teachers" className="mt-6">{renderUserList(filteredUsers.teachers)}</TabsContent>
                            <TabsContent value="students" className="mt-6">{renderUserList(filteredUsers.students)}</TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderApplicationsView = () => (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Teacher Applications</h1>
                <p className="text-muted-foreground mt-2">Review applications for the home tutor program.</p>
            </div>
            <Card className="rounded-2xl shadow-lg">
                <CardContent className="p-4">
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="pending">Pending ({filteredApplications.pending.length})</TabsTrigger>
                            <TabsTrigger value="approved">Approved ({filteredApplications.approved.length})</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected ({filteredApplications.rejected.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending" className="mt-6">
                            {filteredApplications.pending.length > 0 ? (
                                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                                    {filteredApplications.pending.map(app => (
                                        <motion.div variants={itemFadeInUp} key={app.id} className="flex flex-col sm:flex-row items-start justify-between gap-3 p-4 rounded-xl border bg-background/50">
                                            <div><p className="font-semibold">{app.teacherName}</p><p className="text-xs text-muted-foreground mt-1">Applied: {formatDate(app.createdAt)}</p></div>
                                            <div className="flex gap-2 self-end sm:self-center">
                                                <Button size="sm" variant="outline" onClick={() => handleApplication(app, 'approved')}><Check className="mr-2 h-4 w-4" />Approve</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleApplication(app, 'rejected')}><X className="mr-2 h-4 w-4" />Reject</Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (<div className="text-center py-12 flex flex-col items-center"><UserCheck className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Pending Applications</h3></div>)}
                        </TabsContent>
                        <TabsContent value="approved" className="mt-6">
                            {filteredApplications.approved.length > 0 ? (<motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">{filteredApplications.approved.map(app => (<motion.div variants={itemFadeInUp} key={app.id} className="p-4 rounded-xl border bg-background/50 flex flex-col sm:flex-row justify-between sm:items-center"><div><p className="font-semibold">{app.teacherName}</p>{app.processedAt && <p className="text-xs text-muted-foreground">Approved: {formatDate(app.processedAt)}</p>}</div><span className="text-sm font-medium text-green-600 self-end sm:self-center">Approved</span></motion.div>))} </motion.div>) : (<div className="text-center py-12 flex flex-col items-center"><UserCheck className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Approved Applications</h3></div>)}
                        </TabsContent>
                        <TabsContent value="rejected" className="mt-6">
                            {filteredApplications.rejected.length > 0 ? (<motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">{filteredApplications.rejected.map(app => (<motion.div variants={itemFadeInUp} key={app.id} className="p-4 rounded-xl border bg-background/50 flex flex-col sm:flex-row justify-between sm:items-center"><div><p className="font-semibold">{app.teacherName}</p>{app.processedAt && <p className="text-xs text-muted-foreground">Rejected: {formatDate(app.processedAt)}</p>}</div><span className="text-sm font-medium text-destructive self-end sm:self-center">Rejected</span></motion.div>))} </motion.div>) : (<div className="text-center py-12 flex flex-col items-center"><UserCheck className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Rejected Applications</h3></div>)}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );

    const renderBookingsView = () => (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Home Teacher Bookings</h1>
                <p className="text-muted-foreground mt-2">Review and manage all requests for home tutors.</p>
            </div>
            <Card className="rounded-2xl shadow-lg">
                <CardContent className="p-4">
                    {homeBookings && homeBookings.length > 0 ? (
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                            {homeBookings.map(booking => (
                                <motion.div variants={itemFadeInUp} key={booking.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-xl border bg-background/50">
                                    <div className="grid gap-2 w-full"><p className="font-semibold">{booking.studentName} - <span className="font-normal text-muted-foreground">{booking.studentClass}</span></p><p className="text-sm text-muted-foreground">Father: {booking.fatherName || 'N/A'}</p><p className="text-sm text-muted-foreground">Contact: {booking.mobileNumber}</p><p className="text-sm text-muted-foreground">Address: {booking.address}</p><div className="flex items-center gap-2 text-xs text-muted-foreground mt-2"><span>Status:</span><span className={`font-semibold ${booking.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'}`}>{booking.status}</span><span>|</span><span>Created: {formatDate(booking.createdAt, true)}</span></div></div>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteBooking(booking.id)} className="self-end sm:self-center flex-shrink-0 mt-2 sm:mt-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (<div className="text-center py-12 flex flex-col items-center"><Home className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Home Teacher Bookings</h3><p className="text-muted-foreground mt-1">New student requests will appear here.</p></div>)}
                </CardContent>
            </Card>
        </div>
    );
    
    const renderMaterialsView = () => {
         const renderMaterialList = (materialList: FreeMaterial[]) => {
            if (!materialList || materialList.length === 0) {
                return (
                    <div className="text-center py-12 flex flex-col items-center">
                        <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Materials Here</h3>
                        <p className="text-muted-foreground mt-1">Upload materials to this category.</p>
                    </div>
                );
            }
            return (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                    {materialList.map(material => (
                        <motion.div variants={itemFadeInUp} key={material.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border bg-background/50">
                            <div className="flex items-start gap-3 w-full">
                                <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-1 sm:mt-0" />
                                <div className="w-full">
                                    <p className="font-semibold">{material.title}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Uploaded: {formatDate(material.createdAt)}</p>
                                </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material)} className="self-end sm:self-center flex-shrink-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
                        </motion.div>
                    ))}
                </motion.div>
            );
        };
        
        return (
            <div className="grid gap-8">
                 <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-serif">Free Materials</h1>
                    <p className="text-muted-foreground mt-2">Manage free resources for all students.</p>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="rounded-2xl shadow-lg lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Upload New Material</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleMaterialUpload} className="grid gap-4">
                                <div className="grid gap-2"><Label htmlFor="material-title">Material Title</Label><Input id="material-title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} required /></div>
                                <div className="grid gap-2"><Label htmlFor="material-category">Category</Label><Select value={materialCategory} onValueChange={(value) => setMaterialCategory(value as any)} required><SelectTrigger id="material-category"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent><SelectItem value="notes">Notes</SelectItem><SelectItem value="books">Books</SelectItem><SelectItem value="pyqs">PYQs</SelectItem><SelectItem value="dpps">DPPs</SelectItem></SelectContent></Select></div>
                                <div className="grid gap-2"><Label htmlFor="material-file">File</Label><Input id="material-file" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setMaterialFile(e.target.files ? e.target.files[0] : null)} required /></div>
                                <div className="grid gap-2"><Label htmlFor="material-description">Description (Optional)</Label><Textarea id="material-description" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} /></div>
                                <Button type="submit" disabled={isUploadingMaterial} className="w-fit">{isUploadingMaterial ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload Material</Button>
                            </form>
                        </CardContent>
                    </Card>
                     <Card className="rounded-2xl shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Uploaded Materials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="books">Books</TabsTrigger><TabsTrigger value="pyqs">PYQs</TabsTrigger><TabsTrigger value="dpps">DPPs</TabsTrigger></TabsList>
                                <TabsContent value="all" className="mt-6">{renderMaterialList(materials || [])}</TabsContent>
                                <TabsContent value="notes" className="mt-6">{renderMaterialList(filteredMaterials.notes)}</TabsContent>
                                <TabsContent value="books" className="mt-6">{renderMaterialList(filteredMaterials.books)}</TabsContent>
                                <TabsContent value="pyqs" className="mt-6">{renderMaterialList(filteredMaterials.pyqs)}</TabsContent>
                                <TabsContent value="dpps" className="mt-6">{renderMaterialList(filteredMaterials.dpps)}</TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    };

    const renderShopView = () => (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Shop Management</h1>
                <p className="text-muted-foreground mt-2">Manage items available in the public shop.</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="rounded-2xl shadow-lg lg:col-span-1">
                    <CardHeader><CardTitle>Add New Item</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleShopItemUpload} className="grid gap-4">
                            <div className="grid gap-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="item-price">Price (INR)</Label><Input id="item-price" type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} /></div>
                            <div className="grid gap-2"><Label htmlFor="item-purchase-url">Purchase URL</Label><Input id="item-purchase-url" type="url" value={itemPurchaseUrl} onChange={(e) => setItemPurchaseUrl(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="item-image">Item Image</Label><Input id="item-image" type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setItemImage(e.target.files ? e.target.files[0] : null)} required /></div>
                            <Button type="submit" disabled={isUploadingItem} className="w-fit">{isUploadingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Add Item</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-lg lg:col-span-2">
                    <CardHeader><CardTitle>Existing Shop Items</CardTitle></CardHeader>
                    <CardContent>
                        {shopItems && shopItems.length > 0 ? (
                            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                                {shopItems.map(item => (
                                    <motion.div variants={itemFadeInUp} key={item.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-xl border bg-background/50">
                                        <div className="flex items-start gap-4 w-full"><Image src={item.imageUrl} alt={item.name} width={80} height={80} className="rounded-md object-cover flex-shrink-0" /><div className="w-full"><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground mt-1">{item.description}</p><p className="font-semibold text-primary mt-2 flex items-center"><DollarSign className="h-4 w-4 mr-1" />{item.price.toFixed(2)}</p></div></div>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteShopItem(item)} className="self-end sm:self-center flex-shrink-0 mt-2 sm:mt-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (<div className="text-center py-12 flex flex-col items-center"><PackageOpen className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">The Shop is Empty</h3><p className="text-muted-foreground mt-1">Add a new item to get started.</p></div>)}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch (activeView) {
            case 'users': return renderUsersView();
            case 'applications': return renderApplicationsView();
            case 'bookings': return renderBookingsView();
            case 'materials': return renderMaterialsView();
            case 'shop': return renderShopView();
            default: return renderUsersView();
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-8xl mx-auto grid md:grid-cols-[250px_1fr] lg:grid-cols-[280px_1fr] gap-8">
                    {/* Sidebar */}
                    <aside className="hidden md:flex flex-col gap-4">
                        <h2 className="text-lg font-semibold pl-4 font-serif tracking-tight">Management</h2>
                        {renderNavItems()}
                    </aside>

                    {/* Main Content */}
                    <div className="w-full">
                      <AnimatePresence mode="wait">
                          <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.25 }}
                          >
                            {renderContent()}
                          </motion.div>
                      </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}

    