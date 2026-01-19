'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, UserCheck, Check, X, PackageCheck, Store, Eye, Mail, Fingerprint, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type UserProfile = {
    id: string;
    name: string;
    email: string;
    status: 'pending_verification' | 'approved' | 'denied';
    role: 'tutor' | 'student';
    marketplaceStatus?: 'pending' | 'approved';
    aadharNumber?: string;
    address?: string;
    aadharPhotoUrl?: string;
    sellerPhotoUrl?: string;
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
    const [viewingSeller, setViewingSeller] = useState<UserProfile | null>(null);

    const pendingTutorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'users'),
            where('role', '==', 'tutor'),
            where('status', '==', 'pending_verification')
        );
    }, [firestore]);

    const pendingSellersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'users'),
            where('role', '==', 'student'),
            where('marketplaceStatus', '==', 'pending')
        );
    }, [firestore]);

    const pendingItemsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'marketplaceItems'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: pendingTutors, isLoading: isLoadingTutors } = useCollection<UserProfile>(pendingTutorsQuery);
    const { data: pendingSellers, isLoading: isLoadingSellers } = useCollection<UserProfile>(pendingSellersQuery);
    const { data: pendingItems, isLoading: isLoadingItems } = useCollection<MarketplaceItem>(pendingItemsQuery);
    
    const handleUserVerification = (userId: string, newStatus: 'approved' | 'denied', type: 'tutor' | 'seller') => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        const fieldToUpdate = type === 'tutor' ? 'status' : 'marketplaceStatus';
        const updateData = { [fieldToUpdate]: newStatus };

        updateDoc(userRef, updateData)
            .then(() => {
                toast({
                    title: `${type === 'tutor' ? 'Tutor' : 'Seller'} ${newStatus === 'approved' ? 'Approved' : 'Denied'}`,
                    description: `The user's status has been updated.`
                });
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                }));
            });
    };
    
    const handleItemApproval = (itemId: string, approve: boolean) => {
        if (!firestore) return;
        const itemRef = doc(firestore, 'marketplaceItems', itemId);
        
        if (approve) {
            const updateData = { status: 'available' as const };
            updateDoc(itemRef, updateData)
            .then(() => {
                toast({
                    title: `Item Approved`,
                    description: `The item is now available in the marketplace.`
                });
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: itemRef.path,
                    operation: 'update',
                    requestResourceData: updateData
                }));
            });
        } else {
            // Denying an item means deleting it
            deleteDoc(itemRef)
            .then(() => {
                 toast({
                    title: `Item Denied`,
                    description: `The pending item has been removed.`
                });
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: itemRef.path,
                    operation: 'delete'
                }));
            });
        }
    };

    return (
        <>
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <ShieldCheck className="h-8 w-8"/>
                Admin Control Panel
            </h1>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
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
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleUserVerification(tutor.id, 'approved', 'tutor')}>
                                                    <Check className="mr-2 h-4 w-4" /> Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleUserVerification(tutor.id, 'denied', 'tutor')}>
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
                        <CardTitle className="flex items-center gap-2"><Store className="h-6 w-6"/>Seller Approvals</CardTitle>
                        <CardDescription>Review student requests to become marketplace sellers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingSellers && <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                                {pendingSellers?.map(seller => (
                                    <TableRow key={seller.id}>
                                        <TableCell className="font-medium">{seller.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="ghost" onClick={() => setViewingSeller(seller)}>
                                                     <Eye className="mr-2 h-4 w-4" /> View
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleUserVerification(seller.id, 'approved', 'seller')}>
                                                    <Check className="mr-2 h-4 w-4" /> Approve
                                                </Button>
                                                 <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleUserVerification(seller.id, 'denied', 'seller')}>
                                                   <X className="mr-2 h-4 w-4" /> Deny
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {!isLoadingSellers && pendingSellers?.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No pending seller requests.</p>}
                    </CardContent>
                </Card>

                 <Card className="shadow-soft-shadow lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PackageCheck className="h-6 w-6"/>Marketplace Item Approvals</CardTitle>
                        <CardDescription>Review and approve new items listed by students.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingItems && <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                                {pendingItems?.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>{item.sellerName}</TableCell>
                                        <TableCell>₹{item.price}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleItemApproval(item.id, true)}>
                                                    <Check className="mr-2 h-4 w-4" /> Approve
                                                </Button>
                                                 <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleItemApproval(item.id, false)}>
                                                   <X className="mr-2 h-4 w-4" /> Deny
                                                </Button>
                                            </div>
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
        <Dialog open={!!viewingSeller} onOpenChange={(isOpen) => !isOpen && setViewingSeller(null)}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Seller Verification Details</DialogTitle>
                    <DialogDescription>Review the information and photos submitted by {viewingSeller?.name}.</DialogDescription>
                </DialogHeader>
                {viewingSeller && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                             <h3 className="font-semibold">Applicant Information</h3>
                             <div className="flex items-center gap-2 text-sm">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <span>{viewingSeller.name}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{viewingSeller.email}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm">
                                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                <span>{viewingSeller.aadharNumber || 'N/A'}</span>
                             </div>
                              <div className="flex items-start gap-2 text-sm">
                                <Home className="h-4 w-4 text-muted-foreground mt-1" />
                                <span className="flex-1">{viewingSeller.address || 'N/A'}</span>
                             </div>
                        </div>
                         <div className="space-y-4">
                            <h3 className="font-semibold">Submitted Photos</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Profile Photo</p>
                                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                                        {viewingSeller.sellerPhotoUrl ? (
                                            <Image src={viewingSeller.sellerPhotoUrl} alt="Seller photo" fill className="object-cover" />
                                        ) : <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <p className="text-sm font-medium">Aadhaar Card</p>
                                     <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                        {viewingSeller.aadharPhotoUrl ? (
                                            <Image src={viewingSeller.aadharPhotoUrl} alt="Aadhaar photo" fill className="object-cover" />
                                        ) : <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
     </>
    );
}
