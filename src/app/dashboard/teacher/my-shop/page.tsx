
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
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
import { ShoppingCart, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type PremiumMaterial = {
    id: string;
    title: string;
    type: string;
    subject: string;
    price?: number;
    createdAt: { toDate: () => Date };
};

export default function TeacherShopPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const premiumMaterialsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'studyMaterials'),
            where('teacherId', '==', user.uid),
            where('isFree', '==', false),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);
    
    const { data: materials, isLoading } = useCollection<PremiumMaterial>(premiumMaterialsQuery);
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <ShoppingCart className="h-8 w-8"/>
                        My Shop
                    </h1>
                    <p className="text-muted-foreground">Manage the premium materials you're selling in the marketplace.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/teacher/materials">
                        <PlusCircle className="mr-2 h-4 w-4"/> Add Premium Item
                    </Link>
                </Button>
            </div>

            <Card className="shadow-soft-shadow">
                <CardHeader>
                    <CardTitle>Your Premium Listings</CardTitle>
                    <CardDescription>All materials you have listed for sale in the student marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    )}
                    {materials && materials.length > 0 ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                        <TableCell>{item.subject}</TableCell>
                                        <TableCell className="text-right font-semibold">₹{item.price}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : !isLoading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="font-semibold">You haven't listed any premium items for sale yet.</p>
                            <p className="text-sm mt-1">Click "Add Premium Item" to get started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
