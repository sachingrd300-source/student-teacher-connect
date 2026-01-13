
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, UserCheck, Check, X, PackageCheck, Clock, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type UserProfile = {
    id: string;
    name: string;
    email: string;
    status: 'pending_verification' | 'approved';
    createdAt: { toDate: () => Date };
};

type MarketplaceItem = {
    id: string;
    title: string;
    sellerName: string;
    price: number;
    createdAt: { toDate: () => Date };
    status: 'pending' | 'available' | 'sold';
}

export default function AdminDashboardPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const pendingTutorsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'users'),
            where('role', '==', 'tutor'),
            where('status', '==', 'pending_verification')
        );
    }, [firestore]);

    const pendingItemsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'marketplaceItems'),
            where('status', '==', 'pending')
        );
    }, [firestore]);

    const { data: pendingTutors, isLoading: isLoadingTutors } = useCollection<UserProfile>(pendingTutorsQuery);
    const { data: pendingItems, isLoading: isLoadingItems } = useCollection<MarketplaceItem>(pendingItemsQuery);
    
    const handleTutorVerification = async (tutorId: string, newStatus: 'approved' | 'denied') => {
        if (!firestore) return;
        const tutorRef = doc(firestore, 'users', tutorId);
        try {
            await updateDoc(tutorRef, { status: newStatus });
            toast({
                title: `Tutor ${newStatus === 'approved' ? 'Approved' : 'Denied'}`,
                description: `The tutor's status has been updated.`
            });
        } catch (error) {
            console.error("Error updating tutor status:", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update tutor status.' });
        }
    };
    
    const handleItemApproval = async (itemId: string) => {
        if (!firestore) return;
        const itemRef = doc(firestore, 'marketplaceItems', itemId);
        try {
            await updateDoc(itemRef, { status: 'available' });
            toast({
                title: `Item Approved`,
                description: `The item is now available in the marketplace.`
            });
        } catch (error) {
            console.error("Error approving item:", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not approve the item.' });
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <ShieldCheck className="h-8 w-8"/>
                Admin Control Panel
            </h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-soft-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCheck className="h-6 w-6"/>Tutor Approvals</CardTitle>
                        <CardDescription>Review and approve new tutor applications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingTutors && <TableRow><TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                                {pendingTutors?.map(tutor => (
                                    <TableRow key={tutor.id}>
                                        <TableCell className="font-medium">{tutor.name}</TableCell>
                                        <TableCell>{tutor.email}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleTutorVerification(tutor.id, 'approved')}>
                                                    <Check className="mr-2 h-4 w-4" /> Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleTutorVerification(tutor.id, 'denied')}>
                                                   <X className="mr-2 h-4 w-4" /> Deny
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {!isLoadingTutors && pendingTutors?.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No pending tutor applications.</p>}
                    </CardContent>
                </Card>

                 <Card className="shadow-soft-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Store className="h-6 w-6"/>Marketplace Approvals</CardTitle>
                        <CardDescription>Review and approve new items listed by students.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingItems && <TableRow><TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                                {pendingItems?.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>{item.sellerName}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" onClick={() => handleItemApproval(item.id)}>
                                                <PackageCheck className="mr-2 h-4 w-4" /> Approve Item
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {!isLoadingItems && pendingItems?.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No pending items for approval.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
