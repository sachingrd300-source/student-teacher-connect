
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type StudyMaterial = {
  id: string;
  title: string;
  description: string;
  subject: string;
  type: string;
  teacherName?: string;
  isOfficial?: boolean;
  price: number;
  createdAt: { toDate: () => Date };
};

const MaterialCard = ({ material }: { material: StudyMaterial }) => {
  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="text-xl font-headline">{material.title}</CardTitle>
                <CardDescription>
                    by {material.teacherName || 'EduConnect Pro'}
                    {material.isOfficial && <Badge variant="secondary" className="ml-2">Official</Badge>}
                </CardDescription>
            </div>
            <Badge variant="outline">{material.subject}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">{material.description}</p>
        <p className="text-2xl font-bold mt-4">₹{material.price}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Buy Now
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function ShopPage() {
  const firestore = useFirestore();

  const premiumMaterialsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'studyMaterials'),
      where('isFree', '==', false),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: materials, isLoading } = useCollection<StudyMaterial>(premiumMaterialsQuery);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          Premium Content Shop
        </h1>
        <p className="text-muted-foreground">
          Purchase exclusive study materials from our top tutors and official content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        
        {!isLoading && materials?.map((material) => (
          <MaterialCard key={material.id} material={material} />
        ))}
      </div>

      {!isLoading && materials?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground col-span-full">
              <p className="font-semibold text-lg">Shop is Empty</p>
              <p>
                No premium materials are available for sale right now. Please check back later.
              </p>
          </div>
      )}
    </div>
  );
}
