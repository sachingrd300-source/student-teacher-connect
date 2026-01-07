
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, BookCopy } from 'lucide-react';
import { shopItemsData } from '@/lib/data';
import Image from 'next/image';


export default function ShopPage() {
  return (
     <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <ShoppingCart className="w-8 h-8"/>
            EduConnect Shop
        </h1>

        <Card>
        <CardHeader>
            <CardTitle>Shop</CardTitle>
            <CardDescription>Browse recommended books, courses, and other educational materials.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {shopItemsData.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col">
                <div className="relative h-48 w-full">
                <Image src={item.imageUrl} alt={item.title} fill style={{objectFit: 'cover'}} />
                </div>
                <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-1"><BookCopy className="h-4 w-4" />{item.category}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                <p className="text-lg font-bold">{item.price}</p>
                </CardContent>
                <CardFooter>
                <Button className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                </Button>
                </CardFooter>
            </Card>
            ))}
        </CardContent>
        </Card>
     </div>
  );
}
