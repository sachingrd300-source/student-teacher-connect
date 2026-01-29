
'use client';

import { useState, ChangeEvent, useMemo } from 'react';
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
import { Loader2, Upload, FileText, Trash, School, ShoppingBag, DollarSign, Home, PackageOpen } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface UserProfile {
    name: string;
    role: 'admin';
}

type MaterialCategory = 'notes' | 'books' | 'pyqs' | 'dpps';

interface FreeMaterial {
    id: string;
    title: string;
    description?: string;
    fileURL: string;
    fileName: string; 
    fileType: string;
    category: MaterialCategory;
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

interface HomeBooking {
    id: string;
    studentName: string;
    fatherName?: string;
    mobileNumber: string;
    address: string;
    studentClass: string;
    status: 'Pending' | 'Assigned' | 'Completed' | 'Cancelled';
    createdAt: string;
    assignedTeacherId?: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
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
    const [materialCategory, setMaterialCategory] = useState<MaterialCategory | ''>('');
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

    const homeBookingsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'homeBookings'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);

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
        if (!materialFile || !materialTitle.trim() || !materialCategory || !storage || !user) return;

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
                category: materialCategory,
                createdAt: new Date().toISOString(),
            });
            setMaterialTitle('');
            setMaterialDescription('');
            setMaterialFile(null);
            setMaterialCategory('');
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
    
    const handleDeleteBooking = async (bookingId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'homeBookings', bookingId));
        } catch (error) {
            console.error("Error deleting home booking:", error);
        }
    };
    
    const renderMaterialList = (materialList: FreeMaterial[]) => {
        if (materialList.length === 0) {
            return (
                <div className="text-center py-12 flex flex-col items-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Materials in this Category</h3>
                    <p className="text-muted-foreground mt-1">Upload materials to see them here.</p>
                </div>
            );
        }
        return (
            <div className="grid gap-4">
                {materialList.map(material => (
                    <div key={material.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-background">
                        <div className="flex items-start gap-3 w-full">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1 sm:mt-0" />
                            <div className="w-full">
                                <p className="font-semibold">{material.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">Uploaded: {formatDate(material.createdAt)}</p>
                            </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material)} className="self-end sm:self-center flex-shrink-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
                    </div>
                ))}
            </div>
        );
    };

    const filteredMaterials = useMemo(() => {
        if (!materials) return { notes: [], books: [], pyqs: [], dpps: [] };
        return {
            notes: materials.filter(m => m.category === 'notes'),
            books: materials.filter(m => m.category === 'books'),
            pyqs: materials.filter(m => m.category === 'pyqs'),
            dpps: materials.filter(m => m.category === 'dpps'),
        }
    }, [materials]);


    const isLoading = isUserLoading || profileLoading || materialsLoading || shopItemsLoading || bookingsLoading;

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
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Manage global settings, content, and the shop.</p>
                    </div>

                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Home className="mr-3 h-6 w-6 text-primary"/> Home Teacher Bookings</CardTitle>
                            <CardDescription>Review and manage home teacher requests from students.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid gap-4">
                                {homeBookings && homeBookings.length > 0 ? (
                                    homeBookings.map(booking => (
                                        <div key={booking.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-lg border bg-background">
                                            <div className="grid gap-2 w-full">
                                                <p className="font-semibold">{booking.studentName} - <span className="font-normal text-muted-foreground">{booking.studentClass}</span></p>
                                                <p className="text-sm text-muted-foreground">Father: {booking.fatherName || 'N/A'}</p>
                                                <p className="text-sm text-muted-foreground">Contact: {booking.mobileNumber}</p>
                                                <p className="text-sm text-muted-foreground">Address: {booking.address}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                                    <span>Status:</span>
                                                    <span className={`font-semibold ${booking.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'}`}>{booking.status}</span>
                                                    <span>|</span>
                                                    <span>Created: {formatDate(booking.createdAt)}</span>
                                                </div>
                                            </div>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteBooking(booking.id)} className="self-end sm:self-center flex-shrink-0 mt-2 sm:mt-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center">
                                        <Home className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">No Home Teacher Bookings</h3>
                                        <p className="text-muted-foreground mt-1">New student requests for home tutors will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

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

                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><FileText className="mr-3 h-6 w-6 text-primary"/> Manage Free Study Materials</CardTitle>
                            <CardDescription>Upload and manage materials that will be visible to all students.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 p-6 mb-8 border rounded-lg bg-background">
                                <h3 className="text-lg font-semibold">Upload New Material</h3>
                                <form onSubmit={handleMaterialUpload} className="grid gap-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="material-title">Material Title</Label>
                                            <Input id="material-title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="material-category">Category</Label>
                                            <Select value={materialCategory} onValueChange={(value) => setMaterialCategory(value as any)} required>
                                                <SelectTrigger id="material-category">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="notes">Notes</SelectItem>
                                                    <SelectItem value="books">Books</SelectItem>
                                                    <SelectItem value="pyqs">PYQs (Previous Year Questions)</SelectItem>
                                                    <SelectItem value="dpps">DPPs (Daily Practice Problems)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                     <div className="grid gap-2">
                                        <Label htmlFor="material-file">File</Label>
                                        <Input id="material-file" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setMaterialFile(e.target.files ? e.target.files[0] : null)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="material-description">Description (Optional)</Label>
                                        <Textarea id="material-description" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} />
                                    </div>
                                    <Button type="submit" disabled={isUploadingMaterial} className="w-fit">
                                        {isUploadingMaterial ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload Material
                                    </Button>
                                </form>
                            </div>
                            
                            <h3 className="text-lg font-semibold mb-4">Uploaded Free Materials</h3>
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="notes">Notes</TabsTrigger>
                                    <TabsTrigger value="books">Books</TabsTrigger>
                                    <TabsTrigger value="pyqs">PYQs</TabsTrigger>
                                    <TabsTrigger value="dpps">DPPs</TabsTrigger>
                                </TabsList>
                                <TabsContent value="all" className="mt-4">
                                    {renderMaterialList(materials || [])}
                                </TabsContent>
                                <TabsContent value="notes" className="mt-4">
                                    {renderMaterialList(filteredMaterials.notes)}
                                </TabsContent>
                                <TabsContent value="books" className="mt-4">
                                    {renderMaterialList(filteredMaterials.books)}
                                </TabsContent>
                                <TabsContent value="pyqs" className="mt-4">
                                    {renderMaterialList(filteredMaterials.pyqs)}
                                </TabsContent>
                                <TabsContent value="dpps" className="mt-4">
                                    {renderMaterialList(filteredMaterials.dpps)}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

    

    

    
