'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, FileText, ShoppingBag, Home, Briefcase } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import Link from 'next/link';

// Interfaces can be simplified as we only need counts
interface UserProfileForHeader {
    name: string;
    role: 'admin';
}
interface UserProfile { id: string; role: 'admin' | 'student' | 'teacher'; }
interface FreeMaterial { id: string; }
interface ShopItem { id: string; }
interface HomeBooking { id: string; status: 'Pending' | 'Assigned' | 'Completed' | 'Cancelled'; }
interface HomeTutorApplication { id: string; status: 'pending' | 'approved' | 'rejected'; }

export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    const freeMaterialsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'freeMaterials')) : null, [firestore, user]);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);
    
    const shopItemsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'shopItems')) : null, [firestore, user]);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);

    const homeBookingsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'homeBookings')) : null, [firestore, user]);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);

    const homeTutorApplicationsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'homeTutorApplications')) : null, [firestore, user]);
    const { data: homeTutorApplications, isLoading: applicationsLoading } = useCollection<HomeTutorApplication>(homeTutorApplicationsQuery);
    
    const allUsersQuery = useMemoFirebase(() => (firestore && user && userProfile?.role === 'admin') ? query(collection(firestore, 'users')) : null, [firestore, user, userProfile]);
    const { data: allUsers, isLoading: usersLoading } = useCollection<UserProfile>(allUsersQuery);

    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && userProfile.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);

    const summaryData = useMemo(() => {
        return {
            totalUsers: allUsers?.length || 0,
            pendingApplications: homeTutorApplications?.filter(a => a.status === 'pending').length || 0,
            pendingBookings: homeBookings?.filter(b => b.status === 'Pending').length || 0,
            totalMaterials: materials?.length || 0,
            totalShopItems: shopItems?.length || 0,
        };
    }, [allUsers, homeTutorApplications, homeBookings, materials, shopItems]);

    const isLoading = isUserLoading || profileLoading || materialsLoading || shopItemsLoading || bookingsLoading || applicationsLoading || usersLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Admin Portal...</p>
            </div>
        );
    }
    
    const summaryCards = [
        { title: "Users", icon: Users, count: summaryData.totalUsers, description: "Total users", href: "/dashboard/admin/users" },
        { title: "Materials", icon: FileText, count: summaryData.totalMaterials, description: "Free materials", href: "/dashboard/admin/materials" },
        { title: "Shop", icon: ShoppingBag, count: summaryData.totalShopItems, description: "Shop items", href: "/dashboard/admin/shop" },
        { title: "Bookings", icon: Home, count: summaryData.pendingBookings, description: "Pending requests", href: "/dashboard/admin/bookings" },
        { title: "Applications", icon: Briefcase, count: summaryData.pendingApplications, description: "Pending requests", href: "/dashboard/admin/applications" },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto grid gap-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Overview and management tools for the platform.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {summaryCards.map((card) => (
                           <Link key={card.title} href={card.href} className="block">
                                <Card className="cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:bg-muted h-full">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                        <card.icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{card.count}</div>
                                        <p className="text-xs text-muted-foreground">{card.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
