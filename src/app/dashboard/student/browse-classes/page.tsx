
'use client';

import { useMemo } from 'react';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookCopy, User, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type ClassInfo = {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  teacherName: string;
  createdAt: { toDate: () => Date };
};

function ClassCard({ classInfo }: { classInfo: ClassInfo }) {
  return (
    <Card className="flex flex-col shadow-soft-shadow transition-transform duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <CardTitle>{classInfo.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
          <User className="h-4 w-4" />
          {classInfo.teacherName}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex gap-2">
          <Badge variant="secondary">{classInfo.subject}</Badge>
          <Badge variant="outline">{classInfo.classLevel}</Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Clock className="h-4 w-4"/>
            <span>Created on {classInfo.createdAt.toDate().toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
            <Link href="/dashboard/student">
                Join Class via Dashboard <ArrowRight className="ml-2 h-4 w-4"/>
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function BrowseClassesPage() {
  const firestore = useFirestore();

  const classesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'classes'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: classes, isLoading } = useCollection<ClassInfo>(classesQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <BookCopy className="w-8 h-8" />
          Browse All Classes
        </h1>
        <p className="text-muted-foreground">
          Explore all active classes available on the platform. Join one from your dashboard using the class code.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-4 shadow-soft-shadow">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="pt-4 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
              </div>
              <div className="pt-4">
                 <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        
        {!isLoading && classes?.map((classInfo) => (
          <ClassCard key={classInfo.id} classInfo={classInfo} />
        ))}
      </div>
      
       {!isLoading && classes?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground col-span-full">
              <p className="font-semibold text-lg">No Classes Found</p>
              <p>
                There are currently no active classes available. Please check back later.
              </p>
          </div>
      )}
    </div>
  );
}
