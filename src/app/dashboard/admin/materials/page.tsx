'use client';

import { useState, useMemo, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
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
import { Loader2, ArrowLeft, Upload, Trash, FileText } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Interfaces ---
interface UserProfileForHeader { name: string; role: 'admin'; }
type MaterialCategory = 'notes' | 'books' | 'pyqs' | 'dpps';
interface FreeMaterial { id: string; title: string; description?: string; fileURL: string; fileName: string; fileType: string; category: MaterialCategory; createdAt: string; }

// --- Helper Functions ---
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// --- Main Component ---
export default function ManageMaterialsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();

    // --- State for Forms ---
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [materialCategory, setMaterialCategory] = useState<MaterialCategory | ''>('');
    const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
    
    // --- Firestore Data Hooks ---
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    const userRole = userProfile?.role;

    // Materials
    const freeMaterialsQuery = useMemoFirebase(() => (firestore && userRole === 'admin') ? query(collection(firestore, 'freeMaterials'), orderBy('createdAt', 'desc')) : null, [firestore, userRole]);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);
    
    // --- Auth & Role Check ---
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user || userRole !== 'admin') {
            router.replace('/login');
        }
    }, [user, userRole, isUserLoading, profileLoading, router]);

    // --- Memoized Data Filtering ---
    const filteredMaterials = useMemo(() => {
        if (!materials) return { notes: [], books: [], pyqs: [], dpps: [] };
        return {
            notes: materials.filter(m => m.category === 'notes'),
            books: materials.filter(m => m.category === 'books'),
            pyqs: materials.filter(m => m.category === 'pyqs'),
            dpps: materials.filter(m => m.category === 'dpps'),
        };
    }, [materials]);


    // --- Event Handlers ---
    const handleMaterialUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFile || !materialTitle.trim() || !materialCategory || !storage || !firestore || !user) return;
        setIsUploadingMaterial(true);
        const fileName = `${Date.now()}_${materialFile.name}`;
        const fileRef = ref(storage, `freeMaterials/${fileName}`);
        try {
            await uploadBytes(fileRef, materialFile);
            const downloadURL = await getDownloadURL(fileRef);
            const materialData = { title: materialTitle.trim(), description: materialDescription.trim(), fileURL: downloadURL, fileName, fileType: materialFile.type, category: materialCategory, createdAt: new Date().toISOString() };
            addDoc(collection(firestore, 'freeMaterials'), materialData)
                .catch((error) => errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'create', path: 'freeMaterials', requestResourceData: materialData })));
            setMaterialTitle(''); setMaterialDescription(''); setMaterialFile(null); setMaterialCategory('');
            if (document.getElementById('material-file')) (document.getElementById('material-file') as HTMLInputElement).value = '';
        } catch (error) { console.error("Error uploading file:", error); } 
        finally { setIsUploadingMaterial(false); }
    };
    
    const handleDeleteMaterial = async (material: FreeMaterial) => {
        if (!firestore || !storage) return;
        const fileRef = ref(storage, `freeMaterials/${material.fileName}`);
        const materialDocRef = doc(firestore, 'freeMaterials', material.id);
        try {
            await deleteObject(fileRef);
            deleteDoc(materialDocRef).catch(error => errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: materialDocRef.path })));
        } catch (error) { console.error("Error deleting material:", error); }
    };

    const isLoading = isUserLoading || profileLoading || materialsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <FileText className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Materials Management...</p>
            </div>
        );
    }
    
    const renderMaterialList = (materialList: FreeMaterial[]) => {
        if (!materialList || materialList.length === 0) {
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
                                <CardTitle>Upload New Material</CardTitle>
                                <CardDescription>Add free resources for all students.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <form onSubmit={handleMaterialUpload} className="grid gap-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2"><Label htmlFor="material-title">Material Title</Label><Input id="material-title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} required /></div>
                                        <div className="grid gap-2"><Label htmlFor="material-category">Category</Label><Select value={materialCategory} onValueChange={(value) => setMaterialCategory(value as any)} required><SelectTrigger id="material-category"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent><SelectItem value="notes">Notes</SelectItem><SelectItem value="books">Books</SelectItem><SelectItem value="pyqs">PYQs</SelectItem><SelectItem value="dpps">DPPs</SelectItem></SelectContent></Select></div>
                                    </div>
                                    <div className="grid gap-2"><Label htmlFor="material-file">File</Label><Input id="material-file" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setMaterialFile(e.target.files ? e.target.files[0] : null)} required /></div>
                                    <div className="grid gap-2"><Label htmlFor="material-description">Description (Optional)</Label><Textarea id="material-description" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} /></div>
                                    <Button type="submit" disabled={isUploadingMaterial} className="w-fit">{isUploadingMaterial ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload Material</Button>
                                </form>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl shadow-lg">
                            <CardHeader>
                                <CardTitle>Uploaded Free Materials</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="all" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="books">Books</TabsTrigger><TabsTrigger value="pyqs">PYQs</TabsTrigger><TabsTrigger value="dpps">DPPs</TabsTrigger></TabsList>
                                    <TabsContent value="all" className="mt-4">{renderMaterialList(materials || [])}</TabsContent>
                                    <TabsContent value="notes" className="mt-4">{renderMaterialList(filteredMaterials.notes)}</TabsContent>
                                    <TabsContent value="books" className="mt-4">{renderMaterialList(filteredMaterials.books)}</TabsContent>
                                    <TabsContent value="pyqs" className="mt-4">{renderMaterialList(filteredMaterials.pyqs)}</TabsContent>
                                    <TabsContent value="dpps" className="mt-4">{renderMaterialList(filteredMaterials.dpps)}</TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
