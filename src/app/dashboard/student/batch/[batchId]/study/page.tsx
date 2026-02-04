'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText, Download, X, BookOpen, Music, Brain } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PomodoroTimer } from '@/components/pomodoro-timer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"


interface UserProfile {
    name: string;
}

interface Batch {
    id: string;
    name: string;
    teacherId: string;
    teacherName: string;
    approvedStudents: string[];
}

interface Enrollment {
    id: string;
    studentId: string;
    batchId: string;
    status: 'pending' | 'approved';
}

interface StudyMaterial {
    id: string;
    title: string;
    description?: string;
    fileURL: string;
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
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

export default function StudyModePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const batchId = params.batchId as string;

    const batchRef = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return doc(firestore, 'batches', batchId);
    }, [firestore, batchId]);
    const { data: batch, isLoading: batchLoading } = useDoc<Batch>(batchRef);

    const materialsRef = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'batches', batchId, 'materials'), orderBy('createdAt', 'desc'));
    }, [firestore, batchId]);
    const { data: materials, isLoading: materialsLoading } = useCollection<StudyMaterial>(materialsRef);

    const enrollmentQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user?.uid) return null;
        return query(
            collection(firestore, 'enrollments'),
            where('studentId', '==', user.uid),
            where('batchId', '==', batchId),
            where('status', '==', 'approved')
        );
    }, [firestore, batchId, user?.uid]);
    const { data: enrollments, isLoading: enrollmentLoading } = useCollection<Enrollment>(enrollmentQuery);
    const isEnrolledAndApproved = !!enrollments?.[0];

    // Security check
    const isSecurityLoading = isUserLoading || batchLoading || enrollmentLoading;
    useEffect(() => {
        if (!isSecurityLoading && (!batch || !isEnrolledAndApproved)) {
            router.replace('/dashboard/student');
        }
    }, [isSecurityLoading, batch, isEnrolledAndApproved, router]);

    const isPageLoading = isUserLoading || batchLoading || materialsLoading || enrollmentLoading;

    if (isPageLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-white gap-4">
                <Brain className="h-16 w-16 animate-pulse text-primary" />
                <p>Loading Study Mode...</p>
            </div>
        );
    }
    
    if (!batch || !isEnrolledAndApproved) {
        return (
             <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
                <p>Access Denied. Redirecting...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <div className="font-semibold text-lg">{batch?.name} - Study Mode</div>
                <Button variant="ghost" onClick={() => router.push(`/dashboard/student/batch/${batchId}`)} className="hover:bg-white/10 hover:text-white">
                    <X className="mr-2 h-5 w-5" />
                    Exit Study Mode
                </Button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <PomodoroTimer />
            </main>

            <footer className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                            <BookOpen className="mr-2 h-5 w-5" />
                            Study Materials
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="bg-gray-800 text-white border-t-gray-700">
                        <SheetHeader>
                            <SheetTitle className="text-white">Study Materials for {batch.name}</SheetTitle>
                            <SheetDescription className="text-gray-400">Access and download materials uploaded by your teacher.</SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4 max-h-[50vh] overflow-y-auto">
                            {materials && materials.length > 0 ? (
                                materials.map(material => (
                                    <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="font-semibold">{material.title}</p>
                                                <p className="text-xs text-gray-400 mt-1">Uploaded: {formatDate(material.createdAt)}</p>
                                            </div>
                                        </div>
                                        <Button asChild size="sm">
                                            <a href={material.fileURL} target="_blank" rel="noopener noreferrer">
                                            <Download className="mr-2 h-4 w-4" /> Download
                                            </a>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center py-4">No study materials available for this batch.</p>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                            <Music className="mr-2 h-5 w-5" />
                            Focus Sounds
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="bg-gray-800 text-white border-t-gray-700">
                        <SheetHeader>
                            <SheetTitle className="text-white">Focus Sounds</SheetTitle>
                             <SheetDescription className="text-gray-400">Select a sound to help you focus during your study session.</SheetDescription>
                        </SheetHeader>
                        <div className="py-4 text-center">
                            <p className="text-gray-400">(Feature coming soon)</p>
                        </div>
                    </SheetContent>
                </Sheet>
            </footer>
        </div>
    )
}
