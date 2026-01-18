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
import { ShoppingCart, ShoppingBag, BookOpen } from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

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

type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  sellerName: string;
  condition?: string;
  itemType: string;
  imageUrl?: string;
  createdAt: { toDate: () => Date };
}

const MaterialCard = ({ material }: { material: StudyMaterial }) => {
  return (
    <Card className="flex flex-col shadow-soft-shadow transition-transform duration-200 active:scale-95">
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

const StudentItemCard = ({ item }: { item: MarketplaceItem }) => {
    return (
    <Card className="flex flex-col shadow-soft-shadow transition-transform duration-200 active:scale-95 overflow-hidden">
        {item.imageUrl ? (
            <div className="relative h-40 w-full">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
            </div>
        ) : (
            <div className="h-40 w-full bg-muted flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground"/>
            </div>
        )}
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="text-xl font-headline">{item.title}</CardTitle>
                <CardDescription>
                    Sold by {item.sellerName}
                </CardDescription>
            </div>
            <Badge variant="outline">{item.subject}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
         {item.condition && <Badge variant="secondary">{item.condition}</Badge>}
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        <p className="text-2xl font-bold pt-2">₹{item.price}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Contact Seller
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function ShopPage() {
  const firestore = useFirestore();
  const { user, isLoading: isUserLoading } = useUser();

  const premiumMaterialsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'studyMaterials'),
      where('isFree', '==', false),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid]);

  const studentItemsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'marketplaceItems'),
        where('status', '==', 'available'),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid]);

  const { data: premiumMaterials, isLoading: isLoadingPremium } = useCollection<StudyMaterial>(premiumMaterialsQuery);
  const { data: studentItems, isLoading: isLoadingStudentItems } = useCollection<MarketplaceItem>(studentItemsQuery);
  
  const isLoading = isUserLoading || isLoadingPremium || isLoadingStudentItems;
  const allItems = useMemo(() => {
    const combined = [
        ...(premiumMaterials || []).map(item => ({...item, itemCategory: 'premium'})),
        ...(studentItems || []).map(item => ({...item, itemCategory: 'student'}))
    ];
    return combined.sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  }, [premiumMaterials, studentItems]);


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          Marketplace
        </h1>
        <p className="text-muted-foreground">
          Purchase exclusive materials or buy second-hand items from other students.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-4 shadow-soft-shadow">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        
        {!isLoading && allItems.map((item) => {
            if (item.itemCategory === 'premium') {
                return <MaterialCard key={item.id} material={item as StudyMaterial} />
            }
            return <StudentItemCard key={item.id} item={item as MarketplaceItem} />
        })}
      </div>

      {!isLoading && allItems?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground col-span-full">
              <p className="font-semibold text-lg">Shop is Empty</p>
              <p>
                No items are available for sale right now. Please check back later.
              </p>
          </div>
      )}
    </div>
  );
}
