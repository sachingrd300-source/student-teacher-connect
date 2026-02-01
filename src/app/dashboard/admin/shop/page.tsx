'use client';

import { useState, ChangeEvent } from 'react';
import { useUser, useFirestore, useStorage, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Trash, ShoppingBag, PackageOpen, DollarSign, ArrowLeft } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import Image from 'next/image';

interface UserProfileForHeader { name: string; role: 'admin'; }

interface ShopItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl: string;
    imageName: string;
    purchaseUrl: string;
    createdAt: string;
}

export default function AdminShopPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemPurchaseUrl, setItemPurchaseUrl] = useState('');
    const [itemImage, setItemImage] = useState<File | null>(null);
    const [isUploadingItem, setIsUploadingItem] = useState(false);

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    const shopItemsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'shopItems'), orderBy('createdAt', 'desc')) : null, [firestore, user]);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);

    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user || userProfile?.role !== 'admin') {
            router.replace('/login');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);

    const handleShopItemUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemImage || !itemName.trim() || !itemPrice || !itemPurchaseUrl.trim() || !storage || !firestore || !user) return;

        setIsUploadingItem(true);
        const imageName = `${Date.now()}_${itemImage.name}`;
        const imageRef = ref(storage, `shopItems/${imageName}`);

        try {
            await uploadBytes(imageRef, itemImage);
            const downloadURL = await getDownloadURL(imageRef);
            
            const itemData = {
                name: itemName.trim(),
                description: itemDescription.trim(),
                price: parseFloat(itemPrice),
                imageUrl: downloadURL,
                imageName: imageName,
                purchaseUrl: itemPurchaseUrl.trim(),
                createdAt: new Date().toISOString(),
            };

            const shopItemsCol = collection(firestore, 'shopItems');

            addDoc(shopItemsCol, itemData)
                .then(() => {
                    setItemName('');
                    setItemDescription('');
                    setItemPrice('');
                    setItemPurchaseUrl('');
                    setItemImage(null);
                    if (document.getElementById('item-image')) (document.getElementById('item-image') as HTMLInputElement).value = '';
                })
                .catch((error) => {
                    const contextualError = new FirestorePermissionError({
                        operation: 'create',
                        path: 'shopItems',
                        requestResourceData: itemData,
                    });
                    errorEmitter.emit('permission-error', contextualError);
                });

        } catch (error) {
            console.error("Error uploading shop item image: ", error);
        } finally {
            setIsUploadingItem(false);
        }
    };

    const handleDeleteShopItem = async (item: ShopItem) => {
        if (!firestore || !storage) return;
        const imageRef = ref(storage, `shopItems/${item.imageName}`);
        const itemDocRef = doc(firestore, 'shopItems', item.id);
        try {
            await deleteObject(imageRef);
            deleteDoc(itemDocRef).catch(error => {
                const contextualError = new FirestorePermissionError({
                    operation: 'delete',
                    path: itemDocRef.path,
                });
                errorEmitter.emit('permission-error', contextualError);
            });
        } catch (error) {
            console.error("Error deleting shop item image: ", error);
        }
    };
    
    const isLoading = isUserLoading || profileLoading || shopItemsLoading;

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <ShoppingBag className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Shop...</p>
            </div>
        );
    }

    return (
         <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <Button variant="ghost" onClick={() => router.push('/dashboard/admin')} className="justify-self-start">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Admin Dashboard
                    </Button>
                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><ShoppingBag className="mr-3 h-6 w-6 text-primary"/> Manage Shop</CardTitle>
                            <CardDescription>Add new products or remove existing ones from the student-facing shop.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 p-6 mb-8 border rounded-lg bg-background">
                                <h3 className="text-lg font-semibold">Add New Item</h3>
                                <form onSubmit={handleShopItemUpload} className="grid gap-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} required /></div>
                                        <div className="grid gap-2"><Label htmlFor="item-price">Price (INR)</Label><Input id="item-price" type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required /></div>
                                    </div>
                                    <div className="grid gap-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} /></div>
                                    <div className="grid gap-2"><Label htmlFor="item-purchase-url">Purchase URL</Label><Input id="item-purchase-url" type="url" value={itemPurchaseUrl} onChange={(e) => setItemPurchaseUrl(e.target.value)} required /></div>
                                    <div className="grid gap-2"><Label htmlFor="item-image">Item Image</Label><Input id="item-image" type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setItemImage(e.target.files ? e.target.files[0] : null)} required /></div>
                                    <Button type="submit" disabled={isUploadingItem} className="w-fit">
                                        {isUploadingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Add Item to Shop
                                    </Button>
                                </form>
                            </div>
                            
                            <h3 className="text-lg font-semibold mb-4">Existing Shop Items</h3>
                            <div>
                                {shopItems && shopItems.length > 0 ? (
                                    <div className="grid gap-4">
                                        {shopItems.map(item => (
                                            <div key={item.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-3 rounded-lg border bg-background">
                                                <div className="flex items-start gap-4 w-full">
                                                    <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="rounded-md object-cover flex-shrink-0" />
                                                    <div className="w-full">
                                                        <p className="font-semibold">{item.name}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                                        <p className="font-semibold text-primary mt-2 flex items-center"><DollarSign className="h-4 w-4 mr-1" />{item.price.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteShopItem(item)} className="self-end sm:self-center flex-shrink-0 mt-2 sm:mt-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center">
                                        <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">The Shop is Empty</h3>
                                        <p className="text-muted-foreground mt-1">Add a new item above to get started.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
