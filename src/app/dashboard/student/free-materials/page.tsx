
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText, Gift, ArrowLeft, School, Search } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

type MaterialCategory = 'notes' | 'books' | 'pyqs' | 'dpps';

interface FreeMaterial {
    id: string;
    title: string;
    description?: string;
    fileURL: string;
    fileType: string;
    category: MaterialCategory;
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

export default function FreeMaterialsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

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
        }
    }, [user, isUserLoading, profileLoading, router]);

    const searchedMaterials = useMemo(() => {
        if (!materials) return [];
        if (!searchQuery.trim()) return materials;

        const lowercasedQuery = searchQuery.toLowerCase();
        return materials.filter(material => 
            material.title.toLowerCase().includes(lowercasedQuery) ||
            (material.description && material.description.toLowerCase().includes(lowercasedQuery))
        );
    }, [materials, searchQuery]);

    const filteredMaterials = useMemo(() => {
        if (!searchedMaterials) return { notes: [], books: [], pyqs: [], dpps: [] };
        return {
            notes: searchedMaterials.filter(m => m.category === 'notes'),
            books: searchedMaterials.filter(m => m.category === 'books'),
            pyqs: searchedMaterials.filter(m => m.category === 'pyqs'),
            dpps: searchedMaterials.filter(m => m.category === 'dpps'),
        }
    }, [searchedMaterials]);

    const renderMaterialList = (materialList: FreeMaterial[]) => {
        const isSearchActive = searchQuery.trim() !== '';

        if (materialList.length === 0) {
            if (isSearchActive) {
                return (
                     <div className="text-center py-16">
                        <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Materials Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Your search for "{searchQuery}" did not match any results.
                        </p>
                    </div>
                );
            }
            return (
                <div className="text-center py-16">
                    <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Materials in this Category</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Check back soon for new resources.
                    </p>
                </div>
            );
        }
        return (
            <div className="grid gap-4">
                {materialList.map(material => (
                    <div key={material.id} className="flex items-center justify-between p-4 rounded-lg border bg-background">
                        <div className="flex items-center gap-4">
                            <FileText className="h-6 w-6 text-primary/80 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">{material.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">Uploaded: {formatDate(material.createdAt)}</p>
                            </div>
                        </div>
                        <Button asChild size="sm">
                            <a href={material.fileURL} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" /> Download
                            </a>
                        </Button>
                    </div>
                ))}
            </div>
        );
    };

    const isLoading = isUserLoading || profileLoading || materialsLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Free Materials...</p>
            </div>
        );
    }
    
    const isOverallEmpty = !materials || materials.length === 0;

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/student')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <Card className="rounded-2xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center text-2xl font-serif">
                                    <Gift className="mr-3 h-6 w-6 text-primary"/> Free Study Materials
                                </CardTitle>
                                <p className="text-muted-foreground">Free resources and notes curated by our team to help you succeed.</p>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search materials by title or description..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        disabled={isOverallEmpty}
                                    />
                                </div>
                                <Tabs defaultValue="all" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="notes">Notes</TabsTrigger>
                                        <TabsTrigger value="books">Books</TabsTrigger>
                                        <TabsTrigger value="pyqs">PYQs</TabsTrigger>
                                        <TabsTrigger value="dpps">DPPs</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="all" className="mt-4">
                                        {isOverallEmpty ? (
                                            <div className="text-center py-16">
                                                <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <h3 className="mt-4 text-lg font-semibold">No Free Materials Available</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Our team is curating resources. Please check back later!
                                                </p>
                                            </div>
                                        ) : renderMaterialList(searchedMaterials)}
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
                </div>
            </main>
        </div>
    );
}

    