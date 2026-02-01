'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, School, Users, FileText, ShoppingBag, Home, Briefcase, ArrowRight } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { motion } from 'framer-motion';

// --- Interfaces ---
interface UserProfileForHeader { name: string; role: 'admin'; }
interface UserProfile { id: string; role: 'admin' | 'student' | 'teacher'; }
interface FreeMaterial { id: string; }
interface ShopItem { id: string; }
interface HomeBooking { id: string; }
interface HomeTutorApplication { id: string; status: 'pending' | 'approved' | 'rejected'; }

// --- Main Component ---
export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // --- Firestore Data Hooks ---
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    // Fetch collections for counts
    const allUsersQuery = useMemoFirebase(() => (firestore && userProfile?.role === 'admin') ? query(collection(firestore, 'users')) : null, [firestore, userProfile?.role]);
    const { data: allUsersData, isLoading: usersLoading } = useCollection<UserProfile>(allUsersQuery);

    const freeMaterialsQuery = useMemoFirebase(() => (firestore && userProfile?.role === 'admin') ? query(collection(firestore, 'freeMaterials')) : null, [firestore, userProfile?.role]);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);

    const shopItemsQuery = useMemoFirebase(() => (firestore && userProfile?.role === 'admin') ? query(collection(firestore, 'shopItems')) : null, [firestore, userProfile?.role]);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);
    
    const homeBookingsQuery = useMemoFirebase(() => (firestore && userProfile?.role === 'admin') ? query(collection(firestore, 'homeBookings')) : null, [firestore, userProfile?.role]);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);
    
    const homeTutorApplicationsQuery = useMemoFirebase(() => (firestore && userProfile?.role === 'admin') ? query(collection(firestore, 'homeTutorApplications')) : null, [firestore, userProfile?.role]);
    const { data: homeTutorApplications, isLoading: applicationsLoading } = useCollection<HomeTutorApplication>(homeTutorApplicationsQuery);
    
    const userRole = userProfile?.role;
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user || userRole !== 'admin') {
            router.replace('/login');
        }
    }, [user, userRole, isUserLoading, profileLoading, router]);

    const stats = useMemo(() => {
        const studentCount = allUsersData?.filter(u => u.role === 'student').length || 0;
        const teacherCount = allUsersData?.filter(u => u.role === 'teacher').length || 0;
        const pendingApplicationsCount = homeTutorApplications?.filter(a => a.status === 'pending').length || 0;

        return {
            users: {
                title: "Manage Users",
                description: `View and manage ${studentCount} students and ${teacherCount} teachers on the platform.`,
                count: studentCount + teacherCount,
                icon: <Users className="h-8 w-8 text-primary" />,
                href: "/dashboard/admin/users"
            },
            materials: {
                title: "Manage Materials",
                description: `Upload and organize free study materials for students. Currently ${materials?.length || 0} items available.`,
                count: materials?.length || 0,
                icon: <FileText className="h-8 w-8 text-primary" />,
                href: "/dashboard/admin/materials"
            },
            shop: {
                title: "Manage Shop",
                description: `Add or remove products from the student-facing shop. There are ${shopItems?.length || 0} items listed.`,
                count: shopItems?.length || 0,
                icon: <ShoppingBag className="h-8 w-8 text-primary" />,
                href: "/dashboard/admin/shop"
            },
            bookings: {
                title: "Manage Bookings",
                description: `Review and manage ${homeBookings?.length || 0} home teacher requests from students.`,
                count: homeBookings?.length || 0,
                icon: <Home className="h-8 w-8 text-primary" />,
                href: "/dashboard/admin/bookings"
            },
            applications: {
                title: "Manage Applications",
                description: `Review ${pendingApplicationsCount} pending home tutor applications from teachers.`,
                count: homeTutorApplications?.length || 0,
                icon: <Briefcase className="h-8 w-8 text-primary" />,
                href: "/dashboard/admin/applications"
            }
        }
    }, [allUsersData, materials, shopItems, homeBookings, homeTutorApplications]);

    const isLoading = isUserLoading || profileLoading || usersLoading || materialsLoading || shopItemsLoading || bookingsLoading || applicationsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Admin Portal...</p>
            </div>
        );
    }
    
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

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto grid gap-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Platform management and overview.</p>
                    </div>
                    
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                    >
                        {Object.values(stats).map((stat, i) => (
                           <motion.div key={stat.title} variants={cardVariants} custom={i} className="h-full">
                             <Link href={stat.href} className="block h-full">
                                <Card className="h-full flex flex-col rounded-2xl shadow-lg hover:shadow-primary/10 hover:border-primary/50 transition-all duration-300 group">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="p-3 bg-primary/10 rounded-full">
                                                {stat.icon}
                                            </div>
                                            <div className="text-3xl font-bold text-right">{stat.count}</div>
                                        </div>
                                        <CardTitle className="pt-2">{stat.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <CardDescription>{stat.description}</CardDescription>
                                    </CardContent>
                                    <div className="p-6 pt-0">
                                         <p className="text-sm font-semibold text-primary flex items-center gap-2 group-hover:gap-3 transition-all">
                                            Go to Section <ArrowRight className="h-4 w-4" />
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                           </motion.div>
                        ))}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
