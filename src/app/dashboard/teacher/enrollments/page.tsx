
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type Enrollment = {
    id: string;
    studentId: string;
    studentName: string;
    classId: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: { toDate: () => Date };
};

type ClassInfo = {
    subject: string;
    classLevel: string;
}

function EnrollmentRow({ enrollment }: { enrollment: Enrollment }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const classQuery = useMemo(() => {
        if(!firestore) return null;
        return doc(firestore, 'classes', enrollment.classId);
    }, [firestore, enrollment.classId]);
    const { data: classInfo, isLoading: isLoadingClass } = useDoc<ClassInfo>(classQuery);

    const handleUpdateStatus = async (status: 'approved' | 'denied') => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        try {
            await updateDoc(enrollmentRef, { status });
            toast({
                title: `Request ${status}`,
                description: `The enrollment request from ${enrollment.studentName} has been ${status}.`
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the enrollment status.'
            });
        }
    };

    if (isLoadingClass) {
        return (
            <TableRow>
                <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
            </TableRow>
        );
    }
    
    return (
        <TableRow>
            <TableCell className="font-medium">{enrollment.studentName || 'Loading...'}</TableCell>
            <TableCell>{classInfo?.subject} - {classInfo?.classLevel}</TableCell>
            <TableCell>{enrollment.createdAt.toDate().toLocaleDateString()}</TableCell>
            <TableCell>
                 <Badge variant={
                    enrollment.status === 'approved' ? 'default' : 
                    enrollment.status === 'denied' ? 'destructive' : 'secondary'
                } className="capitalize">{enrollment.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
                {enrollment.status === 'pending' && (
                    <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleUpdateStatus('approved')}>
                            <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleUpdateStatus('denied')}>
                           <X className="mr-2 h-4 w-4" /> Deny
                        </Button>
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}

export default function EnrollmentsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const enrollmentsQuery = useMemo(() => {
        if(!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);
    
    const { data: enrollments, isLoading } = useCollection<Enrollment>(enrollmentsQuery);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <UserPlus className="h-8 w-8"/>
                    Student Enrollments
                </h1>
                <p className="text-muted-foreground">Manage requests from students to join your classes.</p>
            </div>

            <Card className="shadow-soft-shadow">
                <CardHeader>
                    <CardTitle>Enrollment Requests</CardTitle>
                    <CardDescription>Review and respond to student enrollment requests.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading && <p>Loading requests...</p>}
                     {!isLoading && enrollments && enrollments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Request Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments.map(enrollment => (
                                    <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                                ))}
                            </TableBody>
                        </Table>
                     ) : !isLoading && (
                        <p className="text-center text-muted-foreground py-8">No enrollment requests found.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
