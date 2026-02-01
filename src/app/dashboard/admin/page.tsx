'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, School, Users, FileText, ShoppingBag, Home, Briefcase, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

// --- Interfaces ---
interface UserProfileForHeader { name: string; role: 'admin'; }
interface UserProfile { id: string; role: string; }
interface HomeTutorApplication { status: 'pending' | 'approved' | 'rejected'; }

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    const userRole = userProfile?.role;

    // --- Data fetching for counts ---
    const usersQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'users')) : null, [firestore, userRole]);
    const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const materialsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'freeMaterials')) : null, [firestore, userRole]);
    const { data: materials, isLoading: materialsLoading } = useCollection(materialsQuery);

    const shopItemsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'shopItems')) : null, [firestore, userRole]);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection(shopItemsQuery);

    const bookingsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'homeBookings')) : null, [firestore, userRole]);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);

    const applicationsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'homeTutorApplications')) : null, [firestore, userRole]);
    const { data: applications, isLoading: applicationsLoading } = useCollection<HomeTutorApplication>(applicationsQuery);

    // --- Auth Check ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user || userRole !== 'admin') {
            router.replace('/login');
        }
    }, [user, userRole, isUserLoading, profileLoading, router]);

    const totalUsers = useMemo(() => usersData?.filter(u => u.role !== 'admin').length || 0, [usersData]);
    const pendingApplications = useMemo(() => applications?.filter(a => a.status === 'pending').length || 0, [applications]);
    const pendingBookings = useMemo(() => homeBookings?.length || 0, [homeBookings]); // Assuming all bookings are initially pending viewing by admin

    const isLoading = isUserLoading || profileLoading || usersLoading || materialsLoading || shopItemsLoading || bookingsLoading || applicationsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Admin Portal...</p>
            </div>
        );
    }
    
    const overviewCards = [
      {
        title: "Manage Users",
        value: totalUsers,
        description: "Teachers & Students",
        icon: <Users className="h-6 w-6 text-muted-foreground" />,
        href: "/dashboard/admin/users",
        color: "text-blue-500",
      },
      {
        title: "Manage Materials",
        value: materials?.length || 0,
        description: "Free Resources",
        icon: <FileText className="h-6 w-6 text-muted-foreground" />,
        href: "/dashboard/admin/materials",
        color: "text-green-500",
      },
      {
        title: "Manage Shop",
        value: shopItems?.length || 0,
        description: "Store Items",
        icon: <ShoppingBag className="h-6 w-6 text-muted-foreground" />,
        href: "/dashboard/admin/shop",
        color: "text-orange-500",
      },
      {
        title: "Manage Bookings",
        value: pendingBookings,
        description: "Home Tutor Requests",
        icon: <Home className="h-6 w-6 text-muted-foreground" />,
        href: "/dashboard/admin/bookings",
        color: "text-purple-500",
      },
      {
        title: "Manage Applications",
        value: pendingApplications,
        description: "Pending Teacher Apps",
        icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
        href: "/dashboard/admin/applications",
        color: "text-red-500",
      },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto grid gap-8">
                    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Platform management and overview.</p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {overviewCards.map((card, index) => (
                            <motion.div
                                key={card.title}
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: (i: number) => ({
                                        opacity: 1,
                                        y: 0,
                                        transition: { delay: i * 0.1 },
                                    }),
                                }}
                                whileHover={{ y: -5, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                            >
                                <Link href={card.href} className="block h-full">
                                    <Card className="rounded-2xl shadow-lg h-full transition-all duration-300 hover:shadow-primary/20 hover:border-primary/50">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                            {card.icon}
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                                            <p className="text-xs text-muted-foreground">{card.description}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
