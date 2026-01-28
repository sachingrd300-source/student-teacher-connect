'use client';

import { useState, ChangeEvent } from 'react';
import { useUser, useFirestore, useStorage, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText, Trash, School } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';

interface UserProfile {
    name: string;
    role: 'admin';
}

interface FreeMaterial {
    id: string;
    title: string;
    description?: string;
    fileURL: string;
    fileName: string; // To delete from storage
    fileType: string;
    createdAt: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export default function AdminDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();

    const [materialTitle, setMaterialTitle] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const freeMaterialsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'freeMaterials'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(freeMaterialsQuery);

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

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFile || !materialTitle.trim() || !storage || !user) return;

        setIsUploading(true);
        const fileName = `${Date.now()}_${materialFile.name}`;
        const fileRef = ref(storage, `freeMaterials/${fileName}`);

        try {
            await uploadBytes(fileRef, materialFile);
            const downloadURL = await getDownloadURL(fileRef);

            await addDoc(collection(firestore, 'freeMaterials'), {
                title: materialTitle.trim(),
                description: materialDescription.trim(),
                fileURL: downloadURL,
                fileName: fileName, // Store for deletion
                fileType: materialFile.type,
                createdAt: new Date().toISOString(),
            });

            setMaterialTitle('');
            setMaterialDescription('');
            setMaterialFile(null);
            if (document.getElementById('material-file')) {
                (document.getElementById('material-file') as HTMLInputElement).value = '';
            }
        } catch (error) {
            console.error("Error uploading free material: ", error);
        } finally {
            setIsUploading(false);
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

    const isLoading = isUserLoading || profileLoading || materialsLoading;

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
                        <p className="text-muted-foreground mt-2">Manage global settings and content.</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Free Study Materials</CardTitle>
                            <p className="text-sm text-muted-foreground">Upload materials that will be visible to all students.</p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleFileUpload} className="grid gap-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="material-title">Material Title</Label>
                                        <Input id="material-title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="e.g., Complete Physics Notes" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="material-file">File</Label>
                                        <Input id="material-file" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setMaterialFile(e.target.files ? e.target.files[0] : null)} required />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="material-description">Description (Optional)</Label>
                                    <Textarea id="material-description" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} placeholder="A short description of the material." />
                                </div>
                                <Button type="submit" disabled={isUploading || !materialFile || !materialTitle.trim()} className="w-fit">
                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Upload Material
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
