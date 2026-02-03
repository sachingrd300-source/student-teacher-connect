'use client';

import { useState, useMemo, useEffect, ChangeEvent, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, deleteDoc, writeBatch, updateDoc, getCountFromServer, where, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// UI Components
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';


// Icons
import { 
    Loader2, School, Users, FileText, ShoppingBag, Home, Briefcase, Trash, Upload,
    Check, X, Eye, PackageOpen, DollarSign, UserCheck, Gift, ArrowRight, Menu, Search, GraduationCap,
    LayoutDashboard, Bell, TrendingUp, Users2, Send, History, Building2, Megaphone, Coins, MoreHorizontal,
    Award, Shield, Gem, Rocket, Star, UserX, CheckCircle, Pencil, Save
} from 'lucide-react';

// --- Interfaces ---
interface UserProfile { id: string; name: string; email: string; role: 'admin' | 'student' | 'teacher'; isHomeTutor?: boolean; teacherWorkStatus?: 'own_coaching' | 'achievers_associate' | 'both'; createdAt: string; lastLoginDate?: string; coachingCenterName?: string; fee?: string; address?: string; }
interface ApplicationBase { id: string; teacherId: string; teacherName: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; processedAt?: string; }
interface HomeTutorApplication extends ApplicationBase {}
interface VerifiedCoachingApplication extends ApplicationBase {}
interface HomeBooking { id: string; studentName: string; fatherName?: string; mobileNumber: string; address: string; studentClass: string; status: 'Pending' | 'Awaiting Payment' | 'Confirmed' | 'Completed' | 'Cancelled'; createdAt: string; assignedTeacherId?: string; assignedTeacherName?: string; bookingType: 'homeTutor' | 'coachingCenter'; }
type MaterialCategory = 'notes' | 'books' | 'pyqs' | 'dpps';
interface FreeMaterial { id: string; title: string; description?: string; fileURL: string; fileName: string; fileType: string; category: MaterialCategory; createdAt: string; }
type BadgeIconType = 'award' | 'shield' | 'gem' | 'rocket' | 'star';
interface ShopItem { id: string; name: string; description?: string; price: number; priceType: 'money' | 'coins'; itemType: 'item' | 'badge'; badgeIcon?: BadgeIconType; imageUrl?: string; imageName?: string; purchaseUrl?: string; createdAt: string; }
interface Announcement { id: string; message: string; target: 'all' | 'teachers' | 'students'; createdAt: string; expiresAt?: string; }
interface AdminActivity { id: string; adminId: string; adminName: string; action: string; targetId?: string; createdAt: string; }
interface SchoolData { id: string; name: string; principalName: string; teacherIds?: string[]; classes?: { students?: any[] }[]; }
interface Enrollment { id: string; studentId: string; studentName: string; teacherId: string; teacherName: string; batchId: string; batchName: string; status: 'pending' | 'approved'; createdAt: string; }

type AdminView = 'dashboard' | 'users' | 'applications' | 'bookings' | 'materials' | 'shop' | 'notifications' | 'activity' | 'schools' | 'achievers';
type ApplicationType = 'homeTutor' | 'communityAssociate';

const badgeIcons: Record<BadgeIconType, React.ReactNode> = {
    award: <Award className="h-5 w-5" />,
    shield: <Shield className="h-5 w-5" />,
    gem: <Gem className="h-5 w-5" />,
    rocket: <Rocket className="h-5 w-5" />,
    star: <Star className="h-5 w-5" />,
};

const staggerContainer = (staggerChildren: number, delayChildren: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerChildren,
      delayChildren: delayChildren,
    },
  },
});

const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// --- Main Component ---
export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialView = searchParams.get('view') as AdminView | null;
    const [view, setView] = useState<AdminView>(initialView || 'dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // --- Form States ---
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [materialCategory, setMaterialCategory] = useState<MaterialCategory | ''>('');
    const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
    
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemPriceType, setItemPriceType] = useState<'money' | 'coins'>('money');
    const [itemPurchaseUrl, setItemPurchaseUrl] = useState('');
    const [itemImage, setItemImage] = useState<File | null>(null);
    const [isUploadingItem, setIsUploadingItem] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [announcementTarget, setAnnouncementTarget] = useState<'all' | 'teachers' | 'students'>('all');
    const [announcementExpiry, setAnnouncementExpiry] = useState('');
    const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

    // Badge/Shop Item state
    const [itemType, setItemType] = useState<'item' | 'badge'>('item');
    const [badgeIcon, setBadgeIcon] = useState<BadgeIconType>('award');

    // Achievers Edit State
    const [editingAchiever, setEditingAchiever] = useState<UserProfile | null>(null);
    const [achieverFormState, setAchieverFormState] = useState({ fee: '', address: '', coachingCenterName: '' });
    const [isUpdatingAchiever, setIsUpdatingAchiever] = useState(false);


    useEffect(() => {
        if (itemType === 'badge') {
            setItemPriceType('coins');
        }
    }, [itemType]);
    
    const [stats, setStats] = useState({
        teacherCount: 0,
        studentCount: 0,
        schoolCount: 0,
        bookingCount: 0
    });


    // --- Firestore Data Hooks ---
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const userRole = userProfile?.role;

    // Queries
    const allUsersQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const homeTutorApplicationsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'homeTutorApplications'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const communityAssociateApplicationsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'verifiedCoachingApplications'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const homeBookingsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'homeBookings'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const freeMaterialsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'freeMaterials'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const shopItemsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'shopItems'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const announcementsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const adminActivitiesQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'adminActivities'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const schoolsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'schools'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const approvedTutorsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'users'), where('isHomeTutor', '==', true)) : null, [firestore, userRole]);
    const enrollmentsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'enrollments'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    
    // Data from hooks
    const { data: allUsersData, isLoading: usersLoading } = useCollection<UserProfile>(allUsersQuery);
    const { data: homeTutorApplications, isLoading: htAppsLoading } = useCollection<HomeTutorApplication>(homeTutorApplicationsQuery);
    const { data: communityAssociateApplications, isLoading: caAppsLoading } = useCollection<VerifiedCoachingApplication>(communityAssociateApplicationsQuery);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);
    const { data: announcements, isLoading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);
    const { data: adminActivities, isLoading: activitiesLoading } = useCollection<AdminActivity>(adminActivitiesQuery);
    const { data: schoolsData, isLoading: schoolsLoading } = useCollection<SchoolData>(schoolsQuery);
    const { data: approvedTutors, isLoading: tutorsLoading } = useCollection<UserProfile>(approvedTutorsQuery);
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);
    
    const homeTutorBookings = useMemo(() => homeBookings?.filter(b => b.bookingType === 'homeTutor' || !b.bookingType) || [], [homeBookings]);
    const coachingCenterBookings = useMemo(() => homeBookings?.filter(b => b.bookingType === 'coachingCenter') || [], [homeBookings]);


    // --- Auth & Role Check ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
        } else if (userProfile && userRole !== 'admin') {
            router.replace('/dashboard');
        }
    }, [user, userRole, isUserLoading, profileLoading, router, userProfile]);

    useEffect(() => {
        if (firestore && userRole === 'admin') {
            const fetchStats = async () => {
                const teachersQuery = query(collection(firestore, 'users'), where('role', '==', 'teacher'));
                const studentsQuery = query(collection(firestore, 'users'), where('role', '==', 'student'));
                const schoolsQuery = query(collection(firestore, 'schools'));
                const bookingsQuery = query(collection(firestore, 'homeBookings'));

                const [teacherSnapshot, studentSnapshot, schoolSnapshot, bookingSnapshot] = await Promise.all([
                    getCountFromServer(teachersQuery),
                    getCountFromServer(studentsQuery),
                    getCountFromServer(schoolsQuery),
                    getCountFromServer(bookingsQuery)
                ]);

                setStats({
                    teacherCount: teacherSnapshot.data().count,
                    studentCount: studentSnapshot.data().count,
                    schoolCount: schoolSnapshot.data().count,
                    bookingCount: bookingSnapshot.data().count
                });
            };
            fetchStats();
        }
    }, [firestore, userRole]);
    
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


    const filteredHomeTutorApps = useMemo(() => {
        if (!homeTutorApplications) return { pending: [], approved: [], rejected: [] };
        return {
            pending: homeTutorApplications.filter(a => a.status === 'pending'),
            approved: homeTutorApplications.filter(a => a.status === 'approved'),
            rejected: homeTutorApplications.filter(a => a.status === 'rejected'),
        };
    }, [homeTutorApplications]);

    const filteredCommunityApps = useMemo(() => {
        if (!communityAssociateApplications) return { pending: [], approved: [], rejected: [] };
        return {
            pending: communityAssociateApplications.filter(a => a.status === 'pending'),
            approved: communityAssociateApplications.filter(a => a.status === 'approved'),
            rejected: communityAssociateApplications.filter(a => a.status === 'rejected'),
        };
    }, [communityAssociateApplications]);
    
    const communityTeacherIds = useMemo(() => {
        if (!allUsersData) return new Set<string>();
        return new Set(
            allUsersData
                .filter(user => user.role === 'teacher' && (user.teacherWorkStatus === 'achievers_associate' || user.teacherWorkStatus === 'both'))
                .map(teacher => teacher.id)
        );
    }, [allUsersData]);

    const filteredEnrollments = useMemo(() => {
        if (!enrollments || communityTeacherIds.size === 0) return { pending: [], approved: [] };
    
        // Filter enrollments for community teachers only
        const relevantEnrollments = enrollments.filter(e => communityTeacherIds.has(e.teacherId));
    
        return {
            pending: relevantEnrollments.filter(e => e.status === 'pending'),
            approved: relevantEnrollments.filter(e => e.status === 'approved'),
        };
    }, [enrollments, communityTeacherIds]);


    const totalPendingApps = useMemo(() => 
        (filteredHomeTutorApps.pending.length || 0) + 
        (filteredCommunityApps.pending.length || 0) +
        (filteredEnrollments.pending.length || 0),
    [filteredHomeTutorApps, filteredCommunityApps, filteredEnrollments]);

    const filteredMaterials = useMemo(() => {
        if (!materials) return { notes: [], books: [], pyqs: [], dpps: [] };
        return {
            notes: materials.filter(m => m.category === 'notes'),
            books: materials.filter(m => m.category === 'books'),
            pyqs: materials.filter(m => m.category === 'pyqs'),
            dpps: materials.filter(m => m.category === 'dpps'),
        };
    }, [materials]);

    const achieverTeachers = useMemo(() => 
        allUsers?.filter(u => u.role === 'teacher' && (u.teacherWorkStatus === 'achievers_associate' || u.teacherWorkStatus === 'both')) || [],
    [allUsers]);

    // --- Event Handlers ---
    const handleApplication = (application: ApplicationBase, newStatus: 'approved' | 'rejected', type: ApplicationType) => {
        if (!firestore) return;
        const batch = writeBatch(firestore);

        const collectionName = type === 'homeTutor' ? 'homeTutorApplications' : 'verifiedCoachingApplications';
        const actionText = type === 'homeTutor' ? 'Home Tutor application' : 'Community Associate application';

        const applicationRef = doc(firestore, collectionName, application.id);
        const applicationUpdate = { status: newStatus, processedAt: new Date().toISOString() };
        batch.update(applicationRef, applicationUpdate);
        
        const teacherRef = doc(firestore, 'users', application.teacherId);
        let teacherUpdate: {[key: string]: any} = {};

        if (type === 'homeTutor') {
            teacherUpdate.isHomeTutor = newStatus === 'approved';
        } else { // communityAssociate
             if (newStatus === 'approved') {
                teacherUpdate.teacherWorkStatus = 'achievers_associate';
            } else { // 'rejected' means revoking membership
                teacherUpdate.teacherWorkStatus = 'own_coaching';
            }
        }
        
        batch.update(teacherRef, teacherUpdate);
        
        const logMessage = newStatus === 'approved' 
            ? `${actionText} for '${application.teacherName}' approved`
            : `Membership for '${application.teacherName}' in ${actionText} revoked`;

        batch.commit()
            .then(() => {
                logAdminAction(logMessage, application.id);
            })
            .catch(error => {
                console.error(`Error handling ${type} application:`, error);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    operation: 'write',
                    path: `batch update for ${type} application ${application.id}`,
                    requestResourceData: { applicationUpdate, teacherUpdate }
                }));
            });
    };

    const handleEnrollmentAction = (enrollment: Enrollment, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        
        if (newStatus === 'approved') {
            batch.update(enrollmentRef, { 
                status: 'approved',
                approvedAt: new Date().toISOString()
            });

            const currentBatchRef = doc(firestore, 'batches', enrollment.batchId);
            batch.update(currentBatchRef, {
                approvedStudents: arrayUnion(enrollment.studentId)
            });

            logAdminAction(`Approved ${enrollment.studentName} for batch "${enrollment.batchName}"`, enrollment.id);
        } else { // 'rejected'
            batch.delete(enrollmentRef);
            logAdminAction(`Declined enrollment for ${enrollment.studentName} from batch "${enrollment.batchName}"`, enrollment.id);
        }
        
        batch.commit()
            .catch(error => {
                console.error(`Error handling enrollment application:`, error);
                const updateData = newStatus === 'approved' ? { status: 'approved' } : {};
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    operation: 'write',
                    path: `batch update for enrollment ${enrollment.id}`,
                    requestResourceData: { enrollmentUpdate: updateData }
                }));
            });
    };
    
    const handleAssignTeacher = (booking: HomeBooking, teacherId: string) => {
        const teacher = approvedTutors?.find(t => t.id === teacherId);
        if (!firestore || !teacher) return;
        const bookingDocRef = doc(firestore, 'homeBookings', booking.id);
        
        updateDoc(bookingDocRef, {
            assignedTeacherId: teacher.id,
            assignedTeacherName: teacher.name,
            status: 'Awaiting Payment'
        })
        .then(() => {
            logAdminAction(`Assigned teacher ${teacher.name} to booking for ${booking.studentName}`, booking.id);
        })
        .catch(error => {
            console.error('Error assigning teacher:', error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                operation: 'update',
                path: bookingDocRef.path,
                requestResourceData: { assignedTeacherId: teacher.id, status: 'Awaiting Payment' }
            }));
        });
    };

    const handleUpdateBookingStatus = (booking: HomeBooking, status: 'Pending' | 'Awaiting Payment' | 'Confirmed' | 'Completed' | 'Cancelled') => {
        if (!firestore) return;
        const bookingDocRef = doc(firestore, 'homeBookings', booking.id);
        const updateData: { status: string; assignedTeacherId?: null; assignedTeacherName?: null } = { status };
        
        if (status === 'Pending') {
            updateData.assignedTeacherId = null;
            updateData.assignedTeacherName = null;
        }

        updateDoc(bookingDocRef, updateData)
            .then(() => {
                logAdminAction(`Updated booking for ${booking.studentName} to ${status}`, booking.id);
            })
            .catch(error => {
                console.error('Error updating booking status:', error);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    operation: 'update',
                    path: bookingDocRef.path,
                    requestResourceData: { status }
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

    const handleMaterialUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFile || !materialTitle.trim() || !materialCategory || !storage || !firestore) return;
    
        setIsUploadingMaterial(true);
        const fileName = `${Date.now()}_${materialFile.name}`;
        const fileRef = ref(storage, `freeMaterials/${fileName}`);
    
        const currentTitle = materialTitle.trim();
        const currentDescription = materialDescription.trim();
        const currentCategory = materialCategory;
        const currentFile = materialFile;
    
        uploadBytes(fileRef, currentFile)
            .then(uploadTask => getDownloadURL(uploadTask.ref))
            .then(downloadURL => {
                const materialData = {
                    title: currentTitle,
                    description: currentDescription,
                    fileURL: downloadURL,
                    fileName: fileName,
                    fileType: currentFile.type,
                    category: currentCategory,
                    createdAt: new Date().toISOString()
                };
    
                return addDoc(collection(firestore, 'freeMaterials'), materialData)
                    .then(docRef => {
                        logAdminAction(`Uploaded free material: "${materialData.title}"`, docRef.id);
                    });
            })
            .catch(error => {
                console.error("Error uploading free material:", error);
                const materialData = { title: currentTitle, category: currentCategory };
                errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'create', path: 'freeMaterials', requestResourceData: materialData }));
            })
            .finally(() => {
                setIsUploadingMaterial(false);
                setMaterialTitle('');
                setMaterialDescription('');
                setMaterialFile(null);
                setMaterialCategory('');
                if (document.getElementById('material-file')) {
                    (document.getElementById('material-file') as HTMLInputElement).value = '';
                }
            });
    };
    
    const handleDeleteMaterial = (material: FreeMaterial) => {
        if (!firestore || !storage) return;

        const materialDocRef = doc(firestore, 'freeMaterials', material.id);
        const fileRef = ref(storage, `freeMaterials/${material.fileName}`);

        deleteDoc(materialDocRef).then(() => {
            logAdminAction(`Deleted free material: "${material.title}"`, material.id);
            deleteObject(fileRef).catch(error => {
                console.warn("Could not delete file from storage:", error);
            });
        }).catch(error => {
            console.error("Error deleting material from Firestore:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: materialDocRef.path }));
        });
    };

    const handleShopItemUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemName.trim() || !itemPrice || !storage || !firestore) return;
        if (itemType === 'item' && !itemImage) {
            alert('Image is required for a regular item.');
            return;
        }
        if (itemType === 'item' && itemPriceType === 'money' && !itemPurchaseUrl.trim()) {
            alert('Purchase URL is required for money items.');
            return;
        }
    
        setIsUploadingItem(true);
    
        const baseItemData: Omit<ShopItem, 'id' | 'imageUrl' | 'imageName' | 'badgeIcon' | 'purchaseUrl' > = {
            name: itemName.trim(),
            description: itemDescription.trim(),
            priceType: itemPriceType,
            price: parseFloat(itemPrice),
            itemType: itemType,
            createdAt: new Date().toISOString()
        };
        
        const currentBadgeIcon = badgeIcon;
        const currentPurchaseUrl = itemPurchaseUrl.trim();
        const currentItemImage = itemImage;
        const currentItemType = itemType;
    
        const addItemToFirestore = (data: Omit<ShopItem, 'id'>) => {
            addDoc(collection(firestore, 'shopItems'), data)
                .then(docRef => {
                    logAdminAction(`Uploaded shop item: "${data.name}"`, docRef.id);
                })
                .catch((error) => {
                    console.error("Error adding shop item to Firestore:", error);
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'create', path: 'shopItems', requestResourceData: data }));
                })
                .finally(() => {
                    setIsUploadingItem(false);
                    setItemName(''); setItemDescription(''); setItemPrice(''); setItemPurchaseUrl(''); setItemImage(null); setItemPriceType('money'); setItemType('item'); setBadgeIcon('award');
                    if (document.getElementById('item-image')) {
                        (document.getElementById('item-image') as HTMLInputElement).value = '';
                    }
                });
        };
    
        if (currentItemType === 'item' && currentItemImage) {
            const imageName = `${Date.now()}_${currentItemImage.name}`;
            const imageRef = ref(storage, `shopItems/${imageName}`);
    
            uploadBytes(imageRef, currentItemImage)
                .then(uploadTask => getDownloadURL(uploadTask.ref))
                .then(downloadURL => {
                    const finalItemData: any = { ...baseItemData };
                    finalItemData.imageUrl = downloadURL;
                    finalItemData.imageName = imageName;
                    if (baseItemData.priceType === 'money') {
                        finalItemData.purchaseUrl = currentPurchaseUrl;
                    }
                    addItemToFirestore(finalItemData);
                })
                .catch(error => {
                    console.error("Error uploading shop item image:", error)
                    setIsUploadingItem(false);
                });
        } else if (currentItemType === 'badge') {
            const finalItemData: any = { ...baseItemData };
            finalItemData.badgeIcon = currentBadgeIcon;
            addItemToFirestore(finalItemData);
        } else {
             setIsUploadingItem(false);
        }
    };
    
    const handleDeleteShopItem = (item: ShopItem) => {
        if (!firestore || !storage) return;
        
        const itemDocRef = doc(firestore, 'shopItems', item.id);
        
        deleteDoc(itemDocRef).then(() => {
            logAdminAction(`Deleted shop item: "${item.name}"`, item.id);
            if (item.itemType === 'item' && item.imageName) {
                const imageRef = ref(storage, `shopItems/${item.imageName}`);
                deleteObject(imageRef).catch(error => {
                    console.warn("Could not delete shop item image from storage:", error);
                });
            }
        }).catch(error => {
            console.error("Error deleting shop item from Firestore:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: itemDocRef.path }));
        });
    };

    const handleSendAnnouncement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementMessage.trim() || !firestore) return;
        
        setIsSendingAnnouncement(true);

        const announcementData: { [key: string]: any } = {
            message: announcementMessage.trim(),
            target: announcementTarget,
            createdAt: new Date().toISOString(),
        };

        if (announcementExpiry) {
            announcementData.expiresAt = new Date(announcementExpiry).toISOString();
        }

        addDoc(collection(firestore, 'announcements'), announcementData)
            .then((docRef) => {
                logAdminAction(`Sent announcement to ${announcementTarget}`, docRef.id);
                setAnnouncementMessage('');
                setAnnouncementExpiry('');
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

    const handleOpenEditAchieverDialog = (teacher: UserProfile) => {
        setEditingAchiever(teacher);
        setAchieverFormState({
            fee: teacher.fee || '',
            address: teacher.address || '',
            coachingCenterName: teacher.coachingCenterName || ''
        });
    };

    const handleUpdateAchiever = async () => {
        if (!firestore || !editingAchiever) return;
        setIsUpdatingAchiever(true);
        const achieverRef = doc(firestore, 'users', editingAchiever.id);
        
        try {
            await updateDoc(achieverRef, achieverFormState);
            logAdminAction(`Updated profile for Achiever teacher: ${editingAchiever.name}`, editingAchiever.id);
            setEditingAchiever(null);
        } catch (error) {
            console.error("Error updating achiever teacher:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                operation: 'update',
                path: achieverRef.path,
                requestResourceData: achieverFormState
            }));
        } finally {
            setIsUpdatingAchiever(false);
        }
    };


    const isLoading = isUserLoading || profileLoading || usersLoading || htAppsLoading || caAppsLoading || bookingsLoading || materialsLoading || shopItemsLoading || announcementsLoading || activitiesLoading || schoolsLoading || tutorsLoading || enrollmentsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <LayoutDashboard className="h-16 w-16 animate-pulse text-primary" />
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
    
    const handleViewChange = (newView: AdminView) => {
        setView(newView);
        setSidebarOpen(false);
    };

    // --- Render Functions ---
    const renderSidebar = () => (
         <aside className="flex flex-col gap-2 p-4">
            <h2 className="px-4 text-lg font-semibold tracking-tight">Admin Menu</h2>
            <div className="flex flex-col gap-1">
                 <Button variant={view === 'dashboard' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('dashboard')}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Button>
                 <Button variant={view === 'users' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('users')}><Users className="mr-2 h-4 w-4" />Users</Button>
                 <Button variant={view === 'schools' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('schools')}><Building2 className="mr-2 h-4 w-4" />Schools</Button>
                 <Button variant={view === 'achievers' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('achievers')}><Award className="mr-2 h-4 w-4" />Achievers</Button>
                 <Button variant={view === 'applications' ? 'secondary' : 'ghost'} className="justify-start relative" onClick={() => handleViewChange('applications')}>
                    <Briefcase className="mr-2 h-4 w-4" />Applications
                    {totalPendingApps > 0 && <span className="absolute right-4 w-5 h-5 text-xs flex items-center justify-center rounded-full bg-primary text-primary-foreground">{totalPendingApps}</span>}
                 </Button>
                 <Button variant={view === 'bookings' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('bookings')}><Home className="mr-2 h-4 w-4" />Bookings</Button>
                 <Button variant={view === 'materials' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('materials')}><FileText className="mr-2 h-4 w-4" />Materials</Button>
                 <Button variant={view === 'shop' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('shop')}><ShoppingBag className="mr-2 h-4 w-4" />Shop</Button>
                 <Button variant={view === 'notifications' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('notifications')}><Megaphone className="mr-2 h-4 w-4" />Notifications</Button>
                 <Button variant={view === 'activity' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleViewChange('activity')}><History className="mr-2 h-4 w-4" />Activity</Button>
            </div>
        </aside>
    );
    
    const renderDashboardView = () => (
        <motion.div 
            className="grid gap-8"
            variants={staggerContainer(0.1, 0)}
            initial="hidden"
            animate="visible"
        >
            <motion.h1 variants={fadeInUp} className="text-3xl font-bold font-serif">Dashboard</motion.h1>
            
            <motion.div variants={staggerContainer(0.1, 0.2)} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={fadeInUp}>
                    <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-900/50 border-indigo-200 dark:border-indigo-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Total Teachers</CardTitle>
                            <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold text-indigo-950 dark:text-indigo-50">{stats.teacherCount}</div></CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={fadeInUp}>
                    <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-900/50 border-green-200 dark:border-green-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-200">Total Students</CardTitle>
                            <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold text-green-950 dark:text-green-50">{stats.studentCount}</div></CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={fadeInUp}>
                    <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-900/50 border-amber-200 dark:border-amber-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-200">Registered Schools</CardTitle>
                            <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold text-amber-950 dark:text-amber-50">{stats.schoolCount}</div></CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={fadeInUp}>
                    <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/10 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-900/50 border-rose-200 dark:border-rose-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-rose-900 dark:text-rose-200">Total Bookings</CardTitle>
                            <Home className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold text-rose-950 dark:text-rose-50">{stats.bookingCount}</div></CardContent>
                    </Card>
                </motion.div>
            </motion.div>
    
            <motion.div variants={staggerContainer(0.2, 0.4)} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={fadeInUp}>
                    <Card className="transition-all duration-300 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle>Recent Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {allUsers.slice(0, 5).map(u => (
                                <div key={u.id} className="flex items-center gap-4 mb-4">
                                    <Avatar><AvatarFallback>{getInitials(u.name)}</AvatarFallback></Avatar>
                                    <div>
                                        <p className="font-semibold">{u.name}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{u.role}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={fadeInUp}>
                    <Card className="transition-all duration-300 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle>Recent Admin Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                                {adminActivities && adminActivities.length > 0 ? (
                                <div className="grid gap-3">
                                    {adminActivities.slice(0, 5).map(activity => (
                                        <div key={activity.id} className="flex justify-between items-center text-sm">
                                            <p className="font-medium"><span className="font-bold text-primary">{activity.adminName}</span> {activity.action}</p>
                                            <div className="text-xs text-muted-foreground">{formatDate(activity.createdAt, true)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className="text-muted-foreground text-center py-4">No activity recorded yet.</p>)}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </motion.div>
    );
    
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
                                <Button asChild variant="secondary" size="sm" className="w-full">
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
                <h1 className="text-3xl font-bold font-serif">Manage Users</h1>
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

    const renderApplicationList = (
        applications: { pending: ApplicationBase[], approved: ApplicationBase[], rejected: ApplicationBase[] },
        type: ApplicationType
    ) => (
        <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending ({applications.pending.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({applications.approved.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({applications.rejected.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
                {applications.pending.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {applications.pending.map(app => (
                             <Card key={app.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg">{app.teacherName}</CardTitle>
                                    <CardDescription>Applied: {formatDate(app.createdAt)}</CardDescription>
                                </CardHeader>
                                <CardFooter className="mt-auto flex gap-2">
                                    <Button className="w-full bg-success text-success-foreground hover:bg-success/90" size="sm" onClick={() => handleApplication(app, 'approved', type)}><Check className="mr-2 h-4 w-4" />Approve</Button>
                                    <Button className="w-full" size="sm" variant="destructive" onClick={() => handleApplication(app, 'rejected', type)}><X className="mr-2 h-4 w-4" />Reject</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (<div className="text-center py-12">No pending applications.</div>)}
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
                {applications.approved.length > 0 ? (
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {applications.approved.map(app => (
                             <Card key={app.id} className="flex flex-col bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
                                <CardHeader>
                                    <CardTitle className="text-lg">{app.teacherName}</CardTitle>
                                    {app.processedAt && <CardDescription>Approved: {formatDate(app.processedAt)}</CardDescription>}
                                </CardHeader>
                                <CardContent className="flex-grow">
                                     <span className="text-sm font-medium text-green-600">Approved</span>
                                </CardContent>
                                <CardFooter className="mt-auto flex gap-2">
                                    <Button variant="destructive" className="w-full" size="sm" onClick={() => handleApplication(app, 'rejected', type)}>
                                        <UserX className="mr-2 h-4 w-4" /> Revoke
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (<div className="text-center py-12">No approved applications.</div>)}
            </TabsContent>
            <TabsContent value="rejected" className="mt-4">
                {applications.rejected.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {applications.rejected.map(app => (
                            <Card key={app.id} className="flex flex-col bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
                                <CardHeader>
                                    <CardTitle className="text-lg">{app.teacherName}</CardTitle>
                                    {app.processedAt && <CardDescription>Rejected: {formatDate(app.processedAt)}</CardDescription>}
                                </CardHeader>
                                <CardContent>
                                    <span className="text-sm font-medium text-destructive">Rejected</span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (<div className="text-center py-12">No rejected applications.</div>)}
            </TabsContent>
        </Tabs>
    );

    const renderEnrollmentList = () => {
        const { pending, approved } = filteredEnrollments;

        return (
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    {pending.length > 0 ? (
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pending.map(enrollment => (
                                <Card key={enrollment.id} className="flex flex-col">
                                    <CardHeader>
                                         <CardTitle className="text-lg">{enrollment.studentName}</CardTitle>
                                         <CardDescription>Requested: {formatDate(enrollment.createdAt)}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-sm text-muted-foreground">
                                            Wants to join <span className="font-medium text-foreground">"{enrollment.batchName}"</span> by {enrollment.teacherName}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="mt-auto flex gap-2">
                                        <Button className="w-full bg-success text-success-foreground hover:bg-success/90" size="sm" onClick={() => handleEnrollmentAction(enrollment, 'approved')}><Check className="mr-2 h-4 w-4" />Approve</Button>
                                        <Button className="w-full" size="sm" variant="destructive" onClick={() => handleEnrollmentAction(enrollment, 'rejected')}><X className="mr-2 h-4 w-4" />Decline</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (<div className="text-center py-12">No pending enrollments.</div>)}
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                    {approved.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {approved.map(enrollment => (
                                 <Card key={enrollment.id} className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
                                    <CardHeader>
                                         <CardTitle className="text-lg">{enrollment.studentName}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">in <span className="font-medium text-foreground">"{enrollment.batchName}"</span> by {enrollment.teacherName}</p>
                                    </CardContent>
                                     <CardFooter>
                                        <span className="text-sm font-medium text-green-600">Approved</span>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (<div className="text-center py-12">No approved enrollments.</div>)}
                </TabsContent>
            </Tabs>
        )
    };

    const renderApplicationsView = () => (
        <div className="grid gap-8">
            <h1 className="text-3xl font-bold font-serif">Applications</h1>
            <Card>
                <CardContent className="p-4">
                    <Tabs defaultValue="homeTutor" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="homeTutor">Home Tutor ({filteredHomeTutorApps.pending.length})</TabsTrigger>
                            <TabsTrigger value="communityAssociate">Community Associate ({filteredCommunityApps.pending.length})</TabsTrigger>
                            <TabsTrigger value="studentEnrollments">Student Enrollments ({filteredEnrollments.pending.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="homeTutor" className="mt-4">
                            {renderApplicationList(filteredHomeTutorApps, 'homeTutor')}
                        </TabsContent>
                        <TabsContent value="communityAssociate" className="mt-4">
                            {renderApplicationList(filteredCommunityApps, 'communityAssociate')}
                        </TabsContent>
                        <TabsContent value="studentEnrollments" className="mt-4">
                            {renderEnrollmentList()}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );

    const renderBookingsView = () => {
        const renderBookingList = (bookings: HomeBooking[], type: 'homeTutor' | 'coachingCenter') => {
            if (bookings.length === 0) {
                return <div className="text-center py-12">No {type === 'homeTutor' ? 'home tutor' : 'coaching center'} bookings.</div>;
            }

            return (
                <div className="grid gap-4">
                    {bookings.map(booking => (
                        <div key={booking.id} className="p-4 rounded-lg border">
                            <div className="flex items-start justify-between gap-4">
                                <div className="grid gap-1">
                                    <p className="font-semibold">{booking.studentName} - <span className="font-normal text-muted-foreground">{booking.studentClass}</span></p>
                                    <p className="text-sm text-muted-foreground">Contact: {booking.mobileNumber}</p>
                                    <p className="text-sm text-muted-foreground">Address: {booking.address}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold py-1 px-2 rounded-full ${
                                        booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        booking.status === 'Awaiting Payment' ? 'bg-orange-100 text-orange-800' :
                                        booking.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                        booking.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {booking.status}
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking, 'Pending')}>Set to Pending</DropdownMenuItem>
                                             {type === 'coachingCenter' && <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking, 'Confirmed')}>Set to Confirmed</DropdownMenuItem>}
                                            <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking, 'Completed')}>Set to Completed</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking, 'Cancelled')}>Set to Cancelled</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteBooking(booking)} className="text-destructive">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            {booking.status === 'Pending' && type === 'homeTutor' && (
                                <div className="mt-4 pt-4 border-t flex items-center gap-2">
                                    <Select onValueChange={(teacherId) => handleAssignTeacher(booking, teacherId)}>
                                        <SelectTrigger className="w-full sm:w-[250px]">
                                            <SelectValue placeholder="Assign a Teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {approvedTutors && approvedTutors.length > 0 ? approvedTutors.map(tutor => (
                                                <SelectItem key={tutor.id} value={tutor.id}>{tutor.name}</SelectItem>
                                            )) : <p className="p-2 text-sm text-muted-foreground">No approved tutors</p>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {(booking.status === 'Awaiting Payment' || booking.status === 'Confirmed' || booking.status === 'Completed') && type === 'homeTutor' && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">Assigned to: <span className="font-semibold text-foreground">{booking.assignedTeacherName}</span></p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
        };
        
        return (
            <div className="grid gap-8">
                <h1 className="text-3xl font-bold font-serif">Manage Bookings</h1>
                 <Card>
                    <CardContent className="p-4">
                         <Tabs defaultValue="homeTutor" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="homeTutor">Home Tutor Bookings</TabsTrigger>
                                <TabsTrigger value="coachingCenter">Coaching Center Bookings</TabsTrigger>
                            </TabsList>
                            <TabsContent value="homeTutor" className="mt-4">
                                {renderBookingList(homeTutorBookings, 'homeTutor')}
                            </TabsContent>
                            <TabsContent value="coachingCenter" className="mt-4">
                                {renderBookingList(coachingCenterBookings, 'coachingCenter')}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        );
    };
    
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
                <h1 className="text-3xl font-bold font-serif">Free Materials</h1>
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
            <h1 className="text-3xl font-bold font-serif">Shop Management</h1>
            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Add New Item</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleShopItemUpload} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Item Type</Label>
                                <RadioGroup value={itemType} onValueChange={(v) => setItemType(v as any)} className="flex gap-4 pt-1">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="item" id="type-item" /><Label htmlFor="type-item">Regular Item</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="badge" id="type-badge" /><Label htmlFor="type-badge">Badge</Label></div>
                                </RadioGroup>
                            </div>

                            <AnimatePresence>
                                {itemType === 'badge' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid gap-2 overflow-hidden">
                                        <Label htmlFor="badge-icon">Badge Icon</Label>
                                        <Select value={badgeIcon} onValueChange={(v) => setBadgeIcon(v as any)}>
                                            <SelectTrigger id="badge-icon">
                                                <SelectValue placeholder="Select an icon" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(badgeIcons).map(iconKey => (
                                                    <SelectItem key={iconKey} value={iconKey}>
                                                        <div className="flex items-center gap-2">
                                                            {badgeIcons[iconKey as BadgeIconType]}
                                                            <span className="capitalize">{iconKey}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid gap-2">
                                <Label htmlFor="item-price-type">Price Type</Label>
                                <RadioGroup id="item-price-type" value={itemPriceType} onValueChange={(v) => setItemPriceType(v as any)} className="flex gap-4" disabled={itemType === 'badge'}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="money" id="money" /><Label htmlFor="money">Money</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="coins" id="coins" /><Label htmlFor="coins">Coins</Label></div>
                                </RadioGroup>
                            </div>

                            <div className="grid gap-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="item-price">{itemPriceType === 'money' ? 'Price (INR)' : 'Price (Coins)'}</Label><Input id="item-price" type="number" step="1" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required /></div>
                            <div className="grid gap-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} /></div>
                            
                            <AnimatePresence>
                            {itemType === 'item' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid gap-4 overflow-hidden">
                                    {itemPriceType === 'money' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="item-purchase-url">Purchase URL</Label>
                                            <Input id="item-purchase-url" type="url" value={itemPurchaseUrl} onChange={(e) => setItemPurchaseUrl(e.target.value)} required={itemPriceType === 'money'} />
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="item-image">Item Image</Label>
                                        <Input id="item-image" type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setItemImage(e.target.files ? e.target.files[0] : null)} required={itemType === 'item'} />
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>

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
                                        <div className="flex items-start gap-4">
                                            {item.itemType === 'badge' ? (
                                                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-primary">
                                                    {React.cloneElement(badgeIcons[item.badgeIcon as BadgeIconType] as React.ReactElement, { className: "h-10 w-10" })}
                                                </div>
                                            ) : (
                                                <Image src={item.imageUrl!} alt={item.name} width={80} height={80} className="rounded-lg object-cover" />
                                            )}
                                            
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                                <p className="font-semibold text-primary mt-2 flex items-center">
                                                    {item.priceType === 'money' ? <DollarSign className="h-4 w-4 mr-1" /> : <Coins className="h-4 w-4 mr-1" />}
                                                    {item.priceType === 'money' ? item.price.toFixed(2) : `${item.price} Coins`}
                                                </p>
                                            </div>
                                        </div>
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
            <h1 className="text-3xl font-bold font-serif">Notifications & Announcements</h1>
             <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Send Announcement</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendAnnouncement} className="grid gap-4">
                            <div className="grid gap-2"><Label htmlFor="announcement-message">Message</Label><Textarea id="announcement-message" value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} required placeholder="Your message here..." /></div>
                            <div className="grid gap-2"><Label htmlFor="announcement-target">Target Audience</Label><Select value={announcementTarget} onValueChange={(v) => setAnnouncementTarget(v as any)} required><SelectTrigger id="announcement-target"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="teachers">All Teachers</SelectItem><SelectItem value="students">All Students</SelectItem></SelectContent></Select></div>
                            <div className="grid gap-2">
                                <Label htmlFor="announcement-expiry">Expiration Date (Optional)</Label>
                                <Input 
                                    id="announcement-expiry" 
                                    type="datetime-local"
                                    value={announcementExpiry}
                                    onChange={(e) => setAnnouncementExpiry(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Announcement will be hidden after this date.</p>
                            </div>
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
                                        {ann.expiresAt && (
                                            <p className="text-xs text-destructive mt-1">Expires: {formatDate(ann.expiresAt, true)}</p>
                                        )}
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
            <h1 className="text-3xl font-bold font-serif">Admin Activity Log</h1>
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
    
    const renderSchoolsView = () => (
        <div className="grid gap-8">
            <h1 className="text-3xl font-bold font-serif">School Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Registered Schools</CardTitle>
                    <CardDescription>An overview of all schools registered on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                     {schoolsData && schoolsData.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {schoolsData.map(school => {
                                const teacherCount = school.teacherIds?.length || 0;
                                const studentCount = school.classes?.reduce((acc, c) => acc + (c.students?.length || 0), 0) || 0;
                                return (
                                    <Card key={school.id}>
                                        <CardHeader>
                                            <CardTitle className="text-lg">{school.name}</CardTitle>
                                            <CardDescription>Principal: {school.principalName}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /> <span>{teacherCount} Teachers</span></div>
                                            <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /> <span>{studentCount} Students</span></div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/dashboard/teacher/school/${school.id}`}>View Details</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">No schools have been created yet.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderAchieversView = () => (
        <div className="grid gap-8">
            <h1 className="text-3xl font-bold font-serif">Achievers Community Teachers</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Teacher Profiles</CardTitle>
                    <CardDescription>Edit the fee, address, and coaching center name for verified community teachers.</CardDescription>
                </CardHeader>
                <CardContent>
                     {achieverTeachers.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {achieverTeachers.map(teacher => (
                                <Card key={teacher.id}>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{teacher.name}</CardTitle>
                                            <CardDescription>{teacher.email}</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenEditAchieverDialog(teacher)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="grid gap-2 text-sm">
                                        <p><strong>Fee:</strong> {teacher.fee || <span className="text-muted-foreground">Not set</span>}</p>
                                        <p><strong>Address:</strong> {teacher.address || <span className="text-muted-foreground">Not set</span>}</p>
                                        <p><strong>Center Name:</strong> {teacher.coachingCenterName || <span className="text-muted-foreground">Not set</span>}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No teachers have been approved for the Achievers Community program yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );


    const renderCurrentView = () => {
        const views: Record<AdminView, React.ReactNode> = {
            dashboard: renderDashboardView(),
            users: renderUsersView(),
            applications: renderApplicationsView(),
            bookings: renderBookingsView(),
            materials: renderMaterialsView(),
            shop: renderShopView(),
            notifications: renderNotificationsView(),
            activity: renderActivityLogView(),
            schools: renderSchoolsView(),
            achievers: renderAchieversView(),
        };

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {views[view]}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <div className="flex flex-1">
                <div className="hidden md:flex md:w-64 flex-col border-r">
                    {renderSidebar()}
                </div>
                <main className="flex-1 p-4 md:p-8">
                     <div className="max-w-6xl mx-auto">
                        <div className="md:hidden mb-4 flex items-center justify-between">
                            <h1 className="text-xl font-bold font-serif capitalize">{view}</h1>
                             <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-64 p-0">
                                    <SheetHeader>
                                        <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
                                        <SheetDescription className="sr-only">A list of links to navigate the admin dashboard.</SheetDescription>
                                    </SheetHeader>
                                    {renderSidebar()}
                                </SheetContent>
                            </Sheet>
                        </div>
                        {renderCurrentView()}
                    </div>
                </main>
            </div>
            <Dialog open={!!editingAchiever} onOpenChange={(isOpen) => !isOpen && setEditingAchiever(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Profile for {editingAchiever?.name}</DialogTitle>
                        <DialogDescription>
                            As this teacher is part of the Achievers Community, you can set their public-facing details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="achiever-fee">Fee Structure</Label>
                            <Input 
                                id="achiever-fee" 
                                value={achieverFormState.fee} 
                                onChange={(e) => setAchieverFormState(prev => ({ ...prev, fee: e.target.value }))}
                                placeholder="e.g., 500/month"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="achiever-address">Address</Label>
                            <Textarea 
                                id="achiever-address" 
                                value={achieverFormState.address}
                                onChange={(e) => setAchieverFormState(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Tuition address"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="achiever-center-name">Coaching Center Name</Label>
                            <Input 
                                id="achiever-center-name" 
                                value={achieverFormState.coachingCenterName}
                                onChange={(e) => setAchieverFormState(prev => ({ ...prev, coachingCenterName: e.target.value }))}
                                placeholder="e.g., Success Tutorials"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateAchiever} disabled={isUpdatingAchiever}>
                            {isUpdatingAchiever ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
