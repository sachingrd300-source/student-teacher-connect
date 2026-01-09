
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type StudentProfile = {
  id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  avatarUrl?: string;
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const firestore = useFirestore();

  const studentQuery = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return doc(firestore, 'users', studentId)
  }, [firestore, studentId]);
  const { data: student, isLoading: isLoadingStudent } = useDoc<StudentProfile>(studentQuery);

  const isLoading = isLoadingStudent;

  if (isLoading) {
    return <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[300px] w-full" />
    </div>;
  }

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/teacher">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
        </Button>
       <Card className="shadow-lg">
            <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                <Avatar className="h-24 w-24 mb-4 border-4 border-background">
                    <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                    <AvatarFallback className="text-3xl">{student?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-4xl font-headline">{student?.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Contact Information</h3>
                     <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>Email: <span className="font-medium">{student?.email}</span></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>Mobile: <span className="font-medium">{student?.mobileNumber || 'Not provided'}</span></span>
                    </div>
                 </div>
            </CardContent>
        </Card>
    </div>
  );
}
