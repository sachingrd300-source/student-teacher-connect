
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, AlertTriangle, BookOpenCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ClassInfo = {
    id: string;
    subject: string;
    classLevel: string;
    teacherId: string;
}

type TeacherInfo = {
    name: string;
}

type StudyMaterial = {
    id: string;
    title: string;
    type: string;
    createdAt: { toDate: () => Date };
    fileUrl: string;
}

const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <FileText className="h-5 w-5 text-orange-500" />,
  "Question Bank": <FileText className="h-5 w-5 text-indigo-500" />,
  Homework: <FileText className="h-5 w-5 text-yellow-500" />,
  "Test Paper": <FileText className="h-5 w-5 text-purple-500" />,
  Solution: <FileText className="h-5 w-5 text-green-500" />,
};


function ClassRoomSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-72" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ClassRoomPage() {
    const params = useParams();
    const classId = params.classId as string;

    const { user } = useUser();
    const firestore = useFirestore();

    const classQuery = useMemo(() => {
        if (!firestore || !classId) return null;
        return doc(firestore, 'classes', classId);
    }, [firestore, classId]);
    const { data: classInfo, isLoading: isLoadingClass } = useDoc<ClassInfo>(classQuery);

    const teacherQuery = useMemo(() => {
        if (!firestore || !classInfo) return null;
        return doc(firestore, 'users', classInfo.teacherId);
    }, [firestore, classInfo]);
    const { data: teacherInfo, isLoading: isLoadingTeacher } = useDoc<TeacherInfo>(teacherQuery);
    
    // Query for materials specific to this class
    const materialsQuery = useMemo(() => {
        if (!firestore || !classId) return null;
        return query(
            collection(firestore, 'studyMaterials'), 
            where('classId', '==', classId),
            where('isFree', '==', false), // Fetch private materials
            orderBy('createdAt', 'desc')
        );
    }, [firestore, classId]);
    const { data: materials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(materialsQuery);

    const enrollmentQuery = useMemo(() => {
        if (!firestore || !user || !classId) return null;
        const enrollmentsRef = collection(firestore, 'enrollments');
        return query(enrollmentsRef, where('studentId', '==', user.uid), where('classId', '==', classId), where('status', '==', 'approved'));
    }, [firestore, user, classId]);
    const {data: enrollments, isLoading: isLoadingEnrollment} = useCollection(enrollmentQuery);
    
    const isEnrolled = enrollments && enrollments.length > 0;
    const isLoading = isLoadingClass || isLoadingTeacher || isLoadingMaterials || isLoadingEnrollment;

    if (isLoading) {
        return <ClassRoomSkeleton />;
    }

    if (!isEnrolled && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You are not enrolled in this class or your request has not been approved.</p>
                <Button asChild><a href="/dashboard/student">Go to Dashboard</a></Button>
            </div>
        );
    }
    
    if (!classInfo) {
        return <p>Class not found.</p>
    }


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{classInfo.subject} - {classInfo.classLevel}</h1>
                <p className="text-muted-foreground">Tutor: {teacherInfo?.name || 'Loading...'}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpenCheck className="w-6 h-6" />
                        Class Materials
                    </CardTitle>
                    <CardDescription>
                        All private materials uploaded by your teacher for this class.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingMaterials && <tr><td colSpan={4}><Skeleton className="w-full h-12"/></td></tr>}
                            {materials && materials.map(material => (
                                <TableRow key={material.id}>
                                    <TableCell>{materialIcons[material.type] || <FileText className="h-5 w-5" />}</TableCell>
                                    <TableCell className="font-medium">{material.title}</TableCell>
                                    <TableCell>{material.createdAt.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" disabled>
                                            <Download className="mr-2 h-4 w-4" /> Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {!isLoadingMaterials && materials?.length === 0 && (
                        <p className="text-center text-muted-foreground py-12">
                            Your teacher has not uploaded any private materials for this class yet.
                        </p>
                    )}
                </CardContent>
            </Card>

        </div>
    )

}
