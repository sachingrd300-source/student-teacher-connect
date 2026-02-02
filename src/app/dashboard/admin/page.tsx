'use client';

import { useState, useMemo, useEffect, ChangeEvent, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';


// Icons
import { 
    Loader2, School, Users, FileText, ShoppingBag, Home, Briefcase, Trash, Upload,
    Check, X, Eye, PackageOpen, DollarSign, UserCheck, Gift, ArrowRight, Menu, Search, GraduationCap,
    LayoutDashboard, Bell, BarChart2, TrendingUp, Users2, Send, History, Bullhorn
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
interface Advertisement { id: string; title: string; message: string; imageUrl: string; imageName: string; ctaLink?: string; targetAudience: 'all' | 'students' | 'teachers'; targetTeacherType?: 'all' | 'coaching' | 'school'; createdAt: string; }
interface AdminActivity { id: string; adminId: string; adminName: string; action: string; targetId?: string; createdAt: string; }
type AdminView = 'dashboard' | 'users' | 'applications' | 'bookings' | 'materials' | 'shop' | 'notifications' | 'advertisements' | 'activity';


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
    
    const [activeView, setActiveView] = useState<AdminView>('dashboard');

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

    const [adTitle, setAdTitle] = useState('');
    const [adMessage, setAdMessage] = useState('');
    const [adCtaLink, setAdCtaLink] = useState('');
    const [adImage, setAdImage] = useState<File | null>(null);
    const [adTarget, setAdTarget] = useState<'all' | 'students' | 'teachers'>('all');
    const [adTeacherType, setAdTeacherType] = useState<'all' | 'coaching' | 'school'>('all');
    const [isUploadingAd, setIsUploadingAd] = useState(false);


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
    const allBatchesQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'batches')) : null, [firestore, userRole]);
    const allEnrollmentsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'enrollments')) : null, [firestore, userRole]);
    const announcementsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const advertisementsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'advertisements'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const adminActivitiesQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'adminActivities'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);

    // Data from hooks
    const { data: allUsersData, isLoading: usersLoading } = useCollection<UserProfile>(allUsersQuery);
    const { data: homeTutorApplications, isLoading: applicationsLoading } = useCollection<HomeTutorApplication>(homeTutorApplicationsQuery);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);
    const { data: batchesData, isLoading: batchesLoading } = useCollection<Batch>(allBatchesQuery);
    const { data: enrollmentsData, isLoading: enrollmentsLoading } = useCollection<Enrollment>(allEnrollmentsQuery);
    const { data: announcements, isLoading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);
    const { data: advertisements, isLoading: advertisementsLoading } = useCollection<Advertisement>(advertisementsQuery);
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


    // --- Memoized Data Filtering & Computations ---
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

    const dailyActiveUsers = useMemo(() => {
        if (!allUsersData) return 0;
        const today = new Date().toISOString().split('T')[0];
        return allUsersData.filter(u => u.lastLoginDate === today).length;
    }, [allUsersData]);

    const topBatches = useMemo(() => {
        if (!enrollmentsData || !batchesData) return [];
        const studentCounts = enrollmentsData.reduce((acc, enrollment) => {
            if (enrollment.status === 'approved') {
                acc[enrollment.batchId] = (acc[enrollment.batchId] || 0) + 1;
            }
            return acc;
        }, {} as { [key: string]: number });

        return batchesData
            .map(batch => ({ name: batch.name, students: studentCounts[batch.id] || 0 }))
            .sort((a, b) => b.students - a.students)
            .slice(0, 5);
    }, [enrollmentsData, batchesData]);

    const topTeachers = useMemo(() => {
        if (!enrollmentsData || !allUsersData) return [];
        const studentCounts = enrollmentsData.reduce((acc, enrollment) => {
            if (enrollment.status === 'approved') {
                acc[enrollment.teacherId] = (acc[enrollment.teacherId] || 0) + 1;
            }
            return acc;
        }, {} as { [key: string]: number });
        
        return allUsersData
            .filter(u => u.role === 'teacher')
            .map(teacher => ({ name: teacher.name, students: studentCounts[teacher.id] || 0 }))
            .sort((a, b) => b.students - a.students)
            .slice(0, 5);
    }, [enrollmentsData, allUsersData]);

    const userSignupsByDate = useMemo(() => {
        if (!allUsersData) return [];
        const counts = allUsersData.reduce((acc, user) => {
            const date = new Date(user.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        
        const sortedDates = Object.entries(counts)
            .map(([date, count]) => ({ date, 'new users': count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (sortedDates.length < 2) return sortedDates;
        
        const filledDates: {date: string, 'new users': number}[] = [];
        let currentDate = new Date(sortedDates[0].date);
        const endDate = new Date(sortedDates[sortedDates.length - 1].date);
        
        while(currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const existingEntry = sortedDates.find(d => d.date === dateStr);
            filledDates.push({ date: dateStr, 'new users': existingEntry ? existingEntry['new users'] : 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return filledDates;
    }, [allUsersData]);


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

    const handleAdvertisementUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adImage || !adTitle.trim() || !adMessage.trim() || !storage || !firestore) return;
        
        setIsUploadingAd(true);
        const imageName = `${Date.now()}_${adImage.name}`;
        const imageRef = ref(storage, `advertisements/${imageName}`);
        
        try {
            const uploadTask = await uploadBytes(imageRef, adImage);
            const downloadURL = await getDownloadURL(uploadTask.ref);
            
            const adData = {
                title: adTitle.trim(),
                message: adMessage.trim(),
                ctaLink: adCtaLink.trim(),
                imageUrl: downloadURL,
                imageName,
                targetAudience: adTarget,
                ...(adTarget === 'teachers' && { targetTeacherType: adTeacherType }),
                createdAt: new Date().toISOString(),
            };
            
            addDoc(collection(firestore, 'advertisements'), adData)
                .then(docRef => {
                    logAdminAction(`Created advertisement: "${adData.title}"`, docRef.id);
                })
                .catch(error => {
                    console.error("Error adding advertisement to Firestore:", error);
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'create', path: 'advertisements', requestResourceData: adData }));
                });
            
            setAdTitle(''); setAdMessage(''); setAdCtaLink(''); setAdImage(null); setAdTarget('all');
            if (document.getElementById('ad-image')) {
                (document.getElementById('ad-image') as HTMLInputElement).value = '';
            }

        } catch (error) {
            console.error("Error uploading ad image:", error);
        } finally {
            setIsUploadingAd(false);
        }
    };

    const handleDeleteAdvertisement = (ad: Advertisement) => {
        if (!firestore || !storage) return;

        const adDocRef = doc(firestore, 'advertisements', ad.id);
        const imageRef = ref(storage, `advertisements/${ad.imageName}`);

        deleteDoc(adDocRef).then(() => {
            logAdminAction(`Deleted advertisement: "${ad.title}"`, ad.id);
            deleteObject(imageRef).catch(error => {
                console.warn("Could not delete ad image from storage:", error);
            });
        }).catch(error => {
            console.error("Error deleting advertisement from Firestore:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: adDocRef.path }));
        });
    };

    // --- Loading State ---
    const isLoading = isUserLoading || profileLoading || usersLoading || applicationsLoading || bookingsLoading || materialsLoading || shopItemsLoading || batchesLoading || enrollmentsLoading || announcementsLoading || advertisementsLoading || activitiesLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Admin Portal...</p>
            </div>
        );
    }
    
    const navItems = [
        { id: 'dashboard' as AdminView, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users' as AdminView, label: 'Users', icon: Users, count: allUsers.length },
        { id: 'applications' as AdminView, label: 'Applications', icon: Briefcase, count: filteredApplications.pending.length },
        { id: 'bookings' as AdminView, label: 'Bookings', icon: Home, count: homeBookings?.length || 0 },
        { id: 'materials' as AdminView, label: 'Materials', icon: FileText, count: materials?.length || 0 },
        { id: 'shop' as AdminView, label: 'Shop', icon: ShoppingBag, count: shopItems?.length || 0 },
        { id: 'notifications' as AdminView, label: 'Notifications', icon: Bell },
        { id: 'advertisements' as AdminView, label: 'Advertisements', icon: Bullhorn, count: advertisements?.length || 0 },
        { id: 'activity' as AdminView, label: 'Activity Log', icon: History },
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
                    {item.count !== undefined && <span className="ml-auto bg-muted text-muted-foreground text-xs font-mono rounded-full px-2 py-0.5">{item.count}</span>}
                </Button>
            ))}
        </nav>
    );

    // --- Render Functions ---
    
    const renderDashboardView = () => (
        <div className="grid gap-8">
             <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">A high-level overview of your platform's activity.</p>
            </div>

            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={itemFadeInUp}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                            <Users2 className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-3xl font-bold">{dailyActiveUsers}</div></CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemFadeInUp}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-3xl font-bold">₹0</div><p className="text-xs text-muted-foreground">Feature in development</p></CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemFadeInUp}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Top Teacher</CardTitle>
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-3xl font-bold truncate">{topTeachers[0]?.name || 'N/A'}</div><p className="text-xs text-muted-foreground">{topTeachers[0]?.students || 0} students</p></CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemFadeInUp}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <UserCheck className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-3xl font-bold">{filteredApplications.pending.length}</div></CardContent>
                    </Card>
                </motion.div>
            </motion.div>

             <div className="grid lg:grid-cols-5 gap-8">
                <motion.div variants={itemFadeInUp} className="lg:col-span-3">
                    <Card className="h-96">
                        <CardHeader>
                            <CardTitle>New User Signups</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={userSignupsByDate}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--border))' }} />
                                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--border))' }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                    <Legend />
                                    <Line type="monotone" dataKey="new users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemFadeInUp} className="lg:col-span-2">
                     <Card className="h-96">
                        <CardHeader>
                            <CardTitle>Top 5 Batches by Enrollment</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topBatches} layout="vertical" margin={{ left: 10, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                    <YAxis type="category" width={80} dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                    <Bar dataKey="students" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );

    const renderUsersView = () => {
        const renderUserList = (userList: UserProfile[]) => {
            if (!userList || userList.length === 0) {
                if (userSearchQuery) {
                    return (
                        <div className="text-center py-16 flex flex-col items-center">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Users Found</h3>
                            <p className="text-muted-foreground mt-1">Your search for "{userSearchQuery}" did not match any users.</p>
                        </div>
                    );
                }
                return <div className="text-center py-16 flex flex-col items-center"><Users className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Users Found</h3><p className="text-muted-foreground mt-1">No users in this category yet.</p></div>;
            }
            return (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userList.map(u => (
                        <motion.div variants={itemFadeInUp} key={u.id}>
                            <Card className="flex flex-col h-full shadow-md transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-1">
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
                    <p className="text-muted-foreground mt-2">View, search, and manage all students and teachers on the platform.</p>
                </div>
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
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or email..."
                                className="pl-10 max-w-sm"
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Tabs defaultValue="all">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All ({usersForDisplay.all.length})</TabsTrigger>
                                <TabsTrigger value="teachers">Teachers ({usersForDisplay.teachers.length})</TabsTrigger>
                                <TabsTrigger value="students">Students ({usersForDisplay.students.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="all" className="mt-6">{renderUserList(usersForDisplay.all)}</TabsContent>
                            <TabsContent value="teachers" className="mt-6">{renderUserList(usersForDisplay.teachers)}</TabsContent>
                            <TabsContent value="students" className="mt-6">{renderUserList(usersForDisplay.students)}</TabsContent>
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
            <Card>
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
                                        <motion.div variants={itemFadeInUp} key={app.id} className="flex flex-col sm:flex-row items-start justify-between gap-3 p-4 rounded-lg border bg-background/50">
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
                            {filteredApplications.approved.length > 0 ? (<motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">{filteredApplications.approved.map(app => (<motion.div variants={itemFadeInUp} key={app.id} className="p-4 rounded-lg border bg-background/50 flex flex-col sm:flex-row justify-between sm:items-center"><div><p className="font-semibold">{app.teacherName}</p>{app.processedAt && <p className="text-xs text-muted-foreground">Approved: {formatDate(app.processedAt)}</p>}</div><span className="text-sm font-medium text-success self-end sm:self-center">Approved</span></motion.div>))} </motion.div>) : (<div className="text-center py-12 flex flex-col items-center"><UserCheck className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Approved Applications</h3></div>)}
                        </TabsContent>
                        <TabsContent value="rejected" className="mt-6">
                            {filteredApplications.rejected.length > 0 ? (<motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">{filteredApplications.rejected.map(app => (<motion.div variants={itemFadeInUp} key={app.id} className="p-4 rounded-lg border bg-background/50 flex flex-col sm:flex-row justify-between sm:items-center"><div><p className="font-semibold">{app.teacherName}</p>{app.processedAt && <p className="text-xs text-muted-foreground">Rejected: {formatDate(app.processedAt)}</p>}</div><span className="text-sm font-medium text-destructive self-end sm:self-center">Rejected</span></motion.div>))} </motion.div>) : (<div className="text-center py-12 flex flex-col items-center"><UserCheck className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Rejected Applications</h3></div>)}
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
            <Card>
                <CardContent className="p-4">
                    {homeBookings && homeBookings.length > 0 ? (
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                            {homeBookings.map(booking => (
                                <motion.div variants={itemFadeInUp} key={booking.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-lg border bg-background/50">
                                    <div className="grid gap-2 w-full"><p className="font-semibold">{booking.studentName} - <span className="font-normal text-muted-foreground">{booking.studentClass}</span></p><p className="text-sm text-muted-foreground">Father: {booking.fatherName || 'N/A'}</p><p className="text-sm text-muted-foreground">Contact: {booking.mobileNumber}</p><p className="text-sm text-muted-foreground">Address: {booking.address}</p><div className="flex items-center gap-2 text-xs text-muted-foreground mt-2"><span>Status:</span><span className={`font-semibold ${booking.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'}`}>{booking.status}</span><span>|</span><span>Created: {formatDate(booking.createdAt, true)}</span></div></div>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteBooking(booking)} className="self-end sm:self-center flex-shrink-0 mt-2 sm:mt-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
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
                        <motion.div variants={itemFadeInUp} key={material.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border bg-background/50">
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
                    <Card className="lg:col-span-1">
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
                     <Card className="lg:col-span-2">
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
                <Card className="lg:col-span-1">
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
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Existing Shop Items</CardTitle></CardHeader>
                    <CardContent>
                        {shopItems && shopItems.length > 0 ? (
                            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                                {shopItems.map(item => (
                                    <motion.div variants={itemFadeInUp} key={item.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-lg border bg-background/50">
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
    
    const renderNotificationsView = () => (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Notifications & Announcements</h1>
                <p className="text-muted-foreground mt-2">Send targeted messages to your users.</p>
            </div>
             <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Send Announcement</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendAnnouncement} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="announcement-message">Message</Label>
                                <Textarea id="announcement-message" value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} required placeholder="Your message here..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="announcement-target">Target Audience</Label>
                                <Select value={announcementTarget} onValueChange={(v) => setAnnouncementTarget(v as any)} required>
                                    <SelectTrigger id="announcement-target"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="teachers">All Teachers</SelectItem>
                                        <SelectItem value="students">All Students</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <Button type="submit" disabled={isSendingAnnouncement} className="w-fit">
                                {isSendingAnnouncement ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />} Send
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Announcement History</CardTitle></CardHeader>
                    <CardContent>
                        {announcements && announcements.length > 0 ? (
                            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                                {announcements.map(ann => (
                                    <motion.div variants={itemFadeInUp} key={ann.id} className="p-4 rounded-lg border bg-background/50">
                                        <p className="text-sm">{ann.message}</p>
                                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                            <span>Target: <span className="font-semibold capitalize">{ann.target}</span></span>
                                            <span>{formatDate(ann.createdAt, true)}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center"><Bell className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Announcements Sent</h3><p className="text-muted-foreground mt-1">Send your first announcement to engage with users.</p></div>
                        )}
                    </CardContent>
                </Card>
             </div>
        </div>
    );

    const renderAdvertisementsView = () => (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Advertisements</h1>
                <p className="text-muted-foreground mt-2">Create and manage targeted advertisements.</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Create Advertisement</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdvertisementUpload} className="grid gap-4">
                            <div className="grid gap-2"><Label htmlFor="ad-title">Title</Label><Input id="ad-title" value={adTitle} onChange={e => setAdTitle(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="ad-message">Message</Label><Textarea id="ad-message" value={adMessage} onChange={e => setAdMessage(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="ad-cta-link">Call-to-Action Link (Optional)</Label><Input id="ad-cta-link" type="url" value={adCtaLink} onChange={e => setAdCtaLink(e.target.value)} /></div>
                            <div className="grid gap-2"><Label htmlFor="ad-image">Image</Label><Input id="ad-image" type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setAdImage(e.target.files ? e.target.files[0] : null)} required /></div>
                            <div className="grid gap-2">
                                <Label>Target Audience</Label>
                                <Select value={adTarget} onValueChange={v => setAdTarget(v as any)} required>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="students">Students</SelectItem>
                                        <SelectItem value="teachers">Teachers</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {adTarget === 'teachers' && (
                                <div className="grid gap-2">
                                    <Label>Target Teacher Type</Label>
                                    <Select value={adTeacherType} onValueChange={v => setAdTeacherType(v as any)} required>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Teachers</SelectItem>
                                            <SelectItem value="coaching">Coaching Teachers</SelectItem>
                                            <SelectItem value="school">School Teachers</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button type="submit" disabled={isUploadingAd} className="w-fit">{isUploadingAd ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Create Ad</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Active Advertisements</CardTitle></CardHeader>
                    <CardContent>
                        {advertisements && advertisements.length > 0 ? (
                            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                                {advertisements.map(ad => (
                                    <motion.div variants={itemFadeInUp} key={ad.id} className="flex items-start gap-4 p-4 rounded-lg border bg-background/50">
                                        <Image src={ad.imageUrl} alt={ad.title} width={100} height={100} className="rounded-md object-cover flex-shrink-0" />
                                        <div className="w-full flex flex-col h-full">
                                            <div className="flex-grow">
                                                <p className="font-semibold">{ad.title}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{ad.message}</p>
                                                <p className="text-xs text-muted-foreground mt-2">Target: <span className="font-medium capitalize">{ad.targetAudience}{ad.targetAudience === 'teachers' && ` (${ad.targetTeacherType})`}</span></p>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                {ad.ctaLink && <Button asChild size="sm" variant="outline"><a href={ad.ctaLink} target="_blank" rel="noopener noreferrer">View Link</a></Button>}
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteAdvertisement(ad)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (<div className="text-center py-12 flex flex-col items-center"><Bullhorn className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Advertisements Running</h3><p className="text-muted-foreground mt-1">Create an advertisement to get started.</p></div>)}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
    
    const renderActivityLogView = () => (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif">Admin Activity Log</h1>
                <p className="text-muted-foreground mt-2">A chronological record of all actions performed by administrators.</p>
            </div>
             <Card>
                <CardContent className="p-4">
                    {adminActivities && adminActivities.length > 0 ? (
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
                            {adminActivities.map(activity => (
                                <motion.div variants={itemFadeInUp} key={activity.id} className="flex flex-col sm:flex-row items-start justify-between gap-3 p-4 rounded-lg border bg-background/50">
                                    <div>
                                        <p className="font-medium"><span className="font-bold text-primary">{activity.adminName}</span> {activity.action}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground self-end sm:self-center flex-shrink-0">
                                        {formatDate(activity.createdAt, true)}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                         <div className="text-center py-16 flex flex-col items-center">
                            <History className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Activity Recorded Yet</h3>
                            <p className="text-muted-foreground mt-1">Admin actions will be logged here as they happen.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return renderDashboardView();
            case 'users': return renderUsersView();
            case 'applications': return renderApplicationsView();
            case 'bookings': return renderBookingsView();
            case 'materials': return renderMaterialsView();
            case 'shop': return renderShopView();
            case 'notifications': return renderNotificationsView();
            case 'advertisements': return renderAdvertisementsView();
            case 'activity': return renderActivityLogView();
            default: return renderDashboardView();
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-secondary">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8">
                 <div className="max-w-8xl mx-auto">
                    {/* Mobile Menu */}
                    <div className="md:hidden mb-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Menu className="h-5 w-5" />
                                    <span>Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[320px]">
                                <SheetHeader>
                                    <SheetTitle>Admin Menu</SheetTitle>
                                    <SheetDescription>
                                        Select a section to manage.
                                    </SheetDescription>
                                </SheetHeader>
                                <nav className="grid gap-2 py-4">
                                    {navItems.map(item => (
                                        <SheetClose asChild key={item.id}>
                                            <Button 
                                                variant={activeView === item.id ? 'default' : 'ghost'}
                                                onClick={() => setActiveView(item.id)}
                                                className="justify-start gap-3 text-base h-12"
                                            >
                                                <item.icon className="h-5 w-5" />
                                                <span>{item.label}</span>
                                                 {item.count !== undefined && <span className="ml-auto bg-muted text-muted-foreground text-xs font-mono rounded-full px-2 py-0.5">{item.count}</span>}
                                            </Button>
                                        </SheetClose>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="grid md:grid-cols-[250px_1fr] lg:grid-cols-[280px_1fr] gap-8">
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
                </div>
            </main>
        </div>
    );
}

    