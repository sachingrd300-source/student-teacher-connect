'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, useStorage, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Upload, Trash, PackageOpen, DollarSign, ShoppingBag } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';

// --- Interfaces ---
interface UserProfileForHeader { name: string; role: 'admin'; }
interface ShopItem { id: string; name: string; description?: string; price: number; imageUrl: string; imageName: string; purchaseUrl: string; createdAt: string; }

// --- Main Component ---
export default function ManageShopPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();

    // --- State for Forms ---
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemPurchaseUrl, setItemPurchaseUrl] = useState('');
    const [itemImage, setItemImage] = useState<File | null>(null);
    const [isUploadingItem, setIsUploadingItem] = useState(false);

    // --- Firestore Data Hooks ---
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    const userRole = userProfile?.role;
    
    // Shop Items
    const shopItemsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'shopItems'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);
    
    // --- Auth & Role Check ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user || userRole !== 'admin') {
            router.replace('/login');
        }
    }, [user, userRole, isUserLoading, profileLoading, router]);

    // --- Event Handlers ---
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
    
    const isLoading = isUserLoading || profileLoading || shopItemsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <ShoppingBag className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Shop Management...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <Button asChild variant="ghost" className="w-fit">
                        <Link href="/dashboard/admin">
                           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Link>
                     </Button>
                    <div className="grid gap-6">
                        <Card className="rounded-2xl shadow-lg">
                            <CardHeader>
                                <CardTitle>Add New Shop Item</CardTitle>
                                <CardDescription>Add a new product to the public shop.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <form onSubmit={handleShopItemUpload} className="grid gap-4">
                                    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} required /></div><div className="grid gap-2"><Label htmlFor="item-price">Price (INR)</Label><Input id="item-price" type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required /></div></div>
                                    <div className="grid gap-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} /></div>
                                    <div className="grid gap-2"><Label htmlFor="item-purchase-url">Purchase URL</Label><Input id="item-purchase-url" type="url" value={itemPurchaseUrl} onChange={(e) => setItemPurchaseUrl(e.target.value)} required /></div>
                                    <div className="grid gap-2"><Label htmlFor="item-image">Item Image</Label><Input id="item-image" type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setItemImage(e.target.files ? e.target.files[0] : null)} required /></div>
                                    <Button type="submit" disabled={isUploadingItem} className="w-fit">{isUploadingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Add Item to Shop</Button>
                                </form>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl shadow-lg">
                             <CardHeader><CardTitle>Existing Shop Items</CardTitle></CardHeader>
                             <CardContent>
                                {shopItems && shopItems.length > 0 ? (
                                    <div className="grid gap-4">
                                        {shopItems.map(item => (
                                            <div key={item.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-3 rounded-lg border bg-background">
                                                <div className="flex items-start gap-4 w-full"><Image src={item.imageUrl} alt={item.name} width={80} height={80} className="rounded-md object-cover flex-shrink-0" /><div className="w-full"><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground mt-1">{item.description}</p><p className="font-semibold text-primary mt-2 flex items-center"><DollarSign className="h-4 w-4 mr-1" />{item.price.toFixed(2)}</p></div></div>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteShopItem(item)} className="self-end sm:self-center flex-shrink-0 mt-2 sm:mt-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (<div className="text-center py-12 flex flex-col items-center"><PackageOpen className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">The Shop is Empty</h3><p className="text-muted-foreground mt-1">Add a new item to get started.</p></div>)}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
