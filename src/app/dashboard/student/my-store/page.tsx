
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Store, PlusCircle, MoreVertical, Trash2, Tag, Info, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const itemConditions = ["New", "Like New", "Used", "Acceptable"];
const itemTypes = ["Book", "Notes", "Equipment", "Other"];

type MarketplaceItem = {
    id: string;
    title: string;
    price: number;
    subject: string;
    itemType: string;
    status: 'pending' | 'available' | 'sold';
    createdAt: { toDate: () => Date };
};

type UserProfile = {
    marketplaceStatus?: 'unverified' | 'pending' | 'approved';
}

function BecomeSellerCard({ onApply }: { onApply: () => void }) {
    return (
        <Card className="shadow-soft-shadow">
            <CardHeader className="items-center text-center">
                 <ShieldCheck className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Become a Verified Seller</CardTitle>
                <CardDescription>To ensure a safe marketplace, we require a quick verification.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-center text-muted-foreground">
                    Once you apply, an admin will review your request. You'll be able to list items after approval.
                </p>
            </CardContent>
            <CardFooter className="justify-center">
                <Button onClick={onApply}>Apply to Sell</Button>
            </CardFooter>
        </Card>
    )
}

function PendingVerificationCard() {
    return (
        <Card className="bg-amber-50 border-amber-200 shadow-soft-shadow">
            <CardHeader className="flex-row items-center gap-4">
                <Info className="h-8 w-8 text-amber-600"/>
                <div>
                    <CardTitle className="text-xl text-amber-800">Application Pending</CardTitle>
                    <CardDescription className="text-amber-700">
                        Your request to become a seller is under review. We'll notify you once it's approved.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
}


function MyStoreSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
}

export default function MyStorePage() {
    const { toast } = useToast();
    const [isAddItemOpen, setAddItemOpen] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);


    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number|''>('');
    const [subject, setSubject] = useState('');
    const [condition, setCondition] = useState('');
    const [itemType, setItemType] = useState('');

    const userListingsQuery = useMemoFirebase(() => {
        if(!firestore || !user) return null;
        return query(collection(firestore, 'marketplaceItems'), where('sellerId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: listings, isLoading: isLoadingListings } = useCollection<MarketplaceItem>(userListingsQuery);
    
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPrice('');
        setSubject('');
        setCondition('');
        setItemType('');
        setAddItemOpen(false);
    }

    const handleApplyToSell = async () => {
        if (!firestore || !user) return;
        setIsApplying(true);
        const userRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userRef, { marketplaceStatus: 'pending' });
            toast({ title: 'Application Submitted!', description: 'Your request to become a seller has been sent for review.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your application. Please try again.'});
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { marketplaceStatus: 'pending' }
            }));
        } finally {
            setIsApplying(false);
        }
    }


    const handleAddItem = async () => {
        if(!title || price === '' || !itemType || !firestore || !user) {
             toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out title, price, and type.' });
            return;
        }

        const newItem = {
            sellerId: user.uid,
            sellerName: user.displayName,
            title,
            description,
            price: Number(price),
            subject,
            condition,
            itemType,
            status: 'pending' as const, // New items are now pending
            createdAt: serverTimestamp(),
            imageUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
        };

        const marketplaceCollection = collection(firestore, 'marketplaceItems');
        addDoc(marketplaceCollection, newItem)
            .then(() => {
                 toast({ title: 'Item Submitted!', description: `${title} has been submitted for review.`});
                 resetForm();
            })
            .catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: marketplaceCollection.path,
                        operation: 'create',
                        requestResourceData: newItem,
                    })
                )
            });
    };

    const handleUpdateStatus = (itemId: string, status: 'available' | 'sold') => {
        if(!firestore) return;
        const itemRef = doc(firestore, 'marketplaceItems', itemId);
        updateDoc(itemRef, { status })
            .then(() => {
                toast({ title: 'Status Updated', description: `Item status changed to ${status}.` });
            })
            .catch(error => {
                 errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: itemRef.path,
                        operation: 'update',
                        requestResourceData: { status },
                    })
                )
            });
    };


    const handleDeleteItem = (itemId: string) => {
        if(!firestore) return;
        const itemRef = doc(firestore, 'marketplaceItems', itemId);
        deleteDoc(itemRef)
         .then(() => {
                toast({ title: 'Item Removed', description: 'Your listing has been removed from the marketplace.' });
            })
            .catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: itemRef.path,
                        operation: 'delete',
                    })
                )
            });
    }

    const getStatusBadge = (status: MarketplaceItem['status']) => {
        switch (status) {
            case 'available':
                return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Available</Badge>;
            case 'sold':
                return <Badge variant="secondary">Sold</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
            default:
                return <Badge variant="destructive">Unknown</Badge>;
        }
    }

    const isLoading = isLoadingProfile || isLoadingListings;
    
    if (isLoading) {
        return <MyStoreSkeleton />;
    }

    const renderContent = () => {
        if (userProfile?.marketplaceStatus === 'approved') {
            return (
                <>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                            <Store className="h-8 w-8"/>
                            My Store
                        </h1>
                        <p className="text-muted-foreground">Manage the items you're selling in the student marketplace.</p>
                    </div>
                    <Dialog open={isAddItemOpen} onOpenChange={setAddItemOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4"/> List a New Item</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>List a New Item for Sale</DialogTitle>
                                <DialogDescription>Fill in the details for the item you want to sell. It will be reviewed by an admin before it's public.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title*</Label>
                                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. HC Verma Physics Vol. 1" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe the item and its condition." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price (INR)*</Label>
                                        <Input id="price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="e.g. 250" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="itemType">Item Type*</Label>
                                        <Select onValueChange={setItemType} value={itemType}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>
                                                {itemTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="condition">Condition</Label>
                                        <Select onValueChange={setCondition} value={condition}>
                                            <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                                            <SelectContent>
                                                {itemConditions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="image">Image</Label>
                                    <Input id="image" type="file" />
                                    <p className="text-xs text-muted-foreground">Image upload is coming soon.</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddItem}>Submit for Review</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                 <Card className="shadow-soft-shadow">
                    <CardHeader>
                        <CardTitle>Your Listings</CardTitle>
                        <CardDescription>All items you have submitted for sale.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingListings && <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>}
                        {listings && listings.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listings.map(item => (
                                        <TableRow key={item.id} className={item.status === 'pending' ? 'opacity-70' : ''}>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell><Badge variant="outline">{item.itemType}</Badge></TableCell>
                                            <TableCell>₹{item.price}</TableCell>
                                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                         {item.status === 'available' && (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'sold')}>
                                                                <Tag className="mr-2 h-4 w-4" />
                                                                Mark as Sold
                                                            </DropdownMenuItem>
                                                         )}
                                                          {item.status === 'sold' && (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'available')}>
                                                                <Tag className="mr-2 h-4 w-4" />
                                                                Mark as Available
                                                            </DropdownMenuItem>
                                                         )}
                                                        <DropdownMenuItem className="text-red-500 focus:bg-red-50 focus:text-red-600" onClick={() => handleDeleteItem(item.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : !isLoadingListings && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>You haven't listed any items for sale yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </>
            );
        }

        if (userProfile?.marketplaceStatus === 'pending') {
            return <PendingVerificationCard />;
        }
        
        return <BecomeSellerCard onApply={handleApplyToSell} />;
    }


    return (
        <div className="space-y-6">
            {renderContent()}
        </div>
    );
}

    