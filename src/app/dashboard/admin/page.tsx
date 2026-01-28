'use client';

import { useState, ChangeEvent } from 'react';
import { useUser, useFirestore, useStorage, useCollection, useMemoFirebase } from '@/firebase';
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
import { Loader2, Upload, FileText, Trash, School, ShoppingBag, DollarSign } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import Image from 'next/image';

interface UserProfile {
    name: string;
    role: 'admin';
}

interface FreeMaterial {
    id: string;
    title: string;
    description?: string;
    fileURL: string;
    fileName: string; 
    fileType: string;
    createdAt: string;
}

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

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();

    // State for free materials
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

    // State for shop items
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemPurchaseUrl, setItemPurchaseUrl] = useState('');
    const [itemImage, setItemImage] = useState<File | null>(null);
    const [isUploadingItem, setIsUploadingItem] = useState(false);

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const freeMaterialsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'freeMaterials'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);
    
    const shopItemsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'shopItems'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: shopItems, isLoading: shopItemsLoading } = useCollection<ShopItem>(shopItemsQuery);

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

    const handleMaterialUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFile || !materialTitle.trim() || !storage || !user) return;

        setIsUploadingMaterial(true);
        const fileName = `${Date.now()}_${materialFile.name}`;
        const fileRef = ref(storage, `freeMaterials/${fileName}`);

        try {
            await uploadBytes(fileRef, materialFile);
            const downloadURL = await getDownloadURL(fileRef);

            await addDoc(collection(firestore, 'freeMaterials'), {
                title: materialTitle.trim(),
                description: materialDescription.trim(),
                fileURL: downloadURL,
                fileName: fileName,
                fileType: materialFile.type,
                createdAt: new Date().toISOString(),
            });
            setMaterialTitle('');
            setMaterialDescription('');
            setMaterialFile(null);
            if (document.getElementById('material-file')) (document.getElementById('material-file') as HTMLInputElement).value = '';
        } catch (error) {
            console.error("Error uploading free material: ", error);
        } finally {
            setIsUploadingMaterial(false);
        }
    };

    const handleDeleteMaterial = async (material: FreeMaterial) => {
        if (!firestore || !storage) return;
        const fileRef = ref(storage, `freeMaterials/${material.fileName}`);
        const materialDocRef = doc(firestore, 'freeMaterials', material.id);
        try {
            await deleteObject(fileRef);
            await deleteDoc(materialDocRef);
        } catch (error) {
            console.error("Error deleting material: ", error);
        }
    };
    
    const handleShopItemUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemImage || !itemName.trim() || !itemPrice || !itemPurchaseUrl.trim() || !storage || !user) return;

        setIsUploadingItem(true);
        const imageName = `${Date.now()}_${itemImage.name}`;
        const imageRef = ref(storage, `shopItems/${imageName}`);

        try {
            await uploadBytes(imageRef, itemImage);
            const downloadURL = await getDownloadURL(imageRef);

            await addDoc(collection(firestore, 'shopItems'), {
                name: itemName.trim(),
                description: itemDescription.trim(),
                price: parseFloat(itemPrice),
                imageUrl: downloadURL,
                imageName: imageName,
                purchaseUrl: itemPurchaseUrl.trim(),
                createdAt: new Date().toISOString(),
            });
            setItemName('');
            setItemDescription('');
            setItemPrice('');
            setItemPurchaseUrl('');
            setItemImage(null);
            if (document.getElementById('item-image')) (document.getElementById('item-image') as HTMLInputElement).value = '';
        } catch (error) {
            console.error("Error uploading shop item: ", error);
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
            await deleteDoc(itemDocRef);
        } catch (error) {
            console.error("Error deleting shop item: ", error);
        }
    };


    const isLoading = isUserLoading || profileLoading || materialsLoading || shopItemsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Admin Portal...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Manage global settings, content, and the shop.</p>
                    </div>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center"><ShoppingBag className="mr-3 h-6 w-6 text-primary"/> Manage Shop</CardTitle></CardHeader>
                        <CardContent>
                             <form onSubmit={handleShopItemUpload} className="grid gap-6 p-6 mb-6 border rounded-lg">
                                <h3 className="text-lg font-semibold">Add New Item</h3>
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
                             
                            <h3 className="text-lg font-semibold mb-4">Existing Items</h3>
                             <div className="grid gap-4">
                                {shopItems && shopItems.length > 0 ? (
                                    shopItems.map(item => (
                                        <div key={item.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-background">
                                            <div className="flex items-start gap-4">
                                                <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="rounded-md object-cover" />
                                                <div>
                                                    <p className="font-semibold">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                                    <p className="font-semibold text-primary mt-2 flex items-center"><DollarSign className="h-4 w-4 mr-1" />{item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteShopItem(item)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                        </div>
                                    ))
                                ) : <p className="text-muted-foreground text-center py-8">No items in the shop yet.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><FileText className="mr-3 h-6 w-6 text-primary"/> Manage Free Study Materials</CardTitle>
                            <CardDescription>Upload materials that will be visible to all students.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleMaterialUpload} className="grid gap-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2"><Label htmlFor="material-title">Material Title</Label><Input id="material-title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} required /></div>
                                    <div className="grid gap-2"><Label htmlFor="material-file">File</Label><Input id="material-file" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setMaterialFile(e.target.files ? e.target.files[0] : null)} required /></div>
                                </div>
                                <div className="grid gap-2"><Label htmlFor="material-description">Description (Optional)</Label><Textarea id="material-description" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} /></div>
                                <Button type="submit" disabled={isUploadingMaterial} className="w-fit">
                                    {isUploadingMaterial ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload Material
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><CardTitle>Uploaded Free Materials</CardTitle></CardHeader>
                         <CardContent className="grid gap-4">
                             {materials && materials.length > 0 ? (
                                materials.map(material => (
                                    <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">{material.title}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                                                <p className="text-xs text-muted-foreground mt-2">Uploaded: {formatDate(material.createdAt)}</p>
                                            </div>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material)}><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                    </div>
                                ))
                             ) : <p className="text-muted-foreground text-center py-8">No free materials have been uploaded yet.</p>}
                         </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
