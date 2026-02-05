'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, documentId, updateDoc, arrayRemove } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Bookmark, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserProfile {
    name: string;
    savedFreeMaterialIds?: string[];
}

interface FreeMaterial {
    id: string;
    title: string;
    description?: string;
    fileURL: string;
    createdAt: string;
    fileType: string;
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

export default function SavedMaterialsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [removingId, setRemovingId] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const savedMaterialIds = useMemo(() => userProfile?.savedFreeMaterialIds || [], [userProfile]);

    const materialsQuery = useMemoFirebase(() => {
        if (!firestore || savedMaterialIds.length === 0) return null;
        const idsToFetch = savedMaterialIds.slice(0, 30);
        return query(collection(firestore, 'freeMaterials'), where(documentId(), 'in', idsToFetch));
    }, [firestore, savedMaterialIds]);
    
    const { data: materials, isLoading: materialsLoading } = useCollection<FreeMaterial>(materialsQuery);

    const handleUnsave = async (materialId: string) => {
        if (!userProfileRef) return;
        setRemovingId(materialId);
        try {
            await updateDoc(userProfileRef, {
                savedFreeMaterialIds: arrayRemove(materialId)
            });
        } catch (error) {
            console.error("Error unsaving material:", error);
        } finally {
            setRemovingId(null);
        }
    };

    const isLoading = profileLoading || (savedMaterialIds.length > 0 && materialsLoading);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
            },
        }),
    };

    return (
        <div className="grid gap-8">
            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl font-serif">
                        <Bookmark className="mr-3 h-6 w-6 text-primary"/> Saved Materials
                    </CardTitle>
                    <p className="text-muted-foreground">Your collection of saved resources. Access them anytime.</p>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : materials && materials.length > 0 ? (
                        <motion.div 
                            className="grid gap-4"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                        >
                            {materials.map((material, i) => (
                                <motion.div key={material.id} variants={cardVariants} custom={i} whileHover={{ y: -2 }} className="h-full">
                                    <Card className="p-4 rounded-2xl shadow-md transition-shadow hover:shadow-lg">
                                         <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="p-3 bg-primary/10 rounded-lg mt-1">
                                                   <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-base">{material.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{material.description || 'No description available.'}</p>
                                                    <p className="text-xs text-muted-foreground mt-2">Uploaded: {formatDate(material.createdAt)}</p>
                                                </div>
                                            </div>
                                             <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                                                <Button variant="destructive" size="sm" onClick={() => handleUnsave(material.id)} disabled={removingId === material.id}>
                                                    {removingId === material.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                                                    Remove
                                                </Button>
                                                <Button asChild size="sm">
                                                    <a href={material.fileURL} target="_blank" rel="noopener noreferrer">
                                                        {material.fileType === 'link' ? <ArrowRight className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                                                        View
                                                    </a>
                                                </Button>
                                             </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-center py-16">
                            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Saved Materials</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                You haven't saved any materials yet. Browse the "Free Materials" section to start saving.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
