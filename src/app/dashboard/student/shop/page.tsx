
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, School, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ShopItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl: string;
    purchaseUrl: string;
    createdAt: string;
}

export default function ShopPage() {
    const firestore = useFirestore();

    const shopItemsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'shopItems'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: items, isLoading: itemsLoading } = useCollection<ShopItem>(shopItemsQuery);

    if (itemsLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Shop...</p>
            </div>
        );
    }
    
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
    const staggerContainer = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    };


    return (
        <motion.div 
            className="grid gap-8"
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
        >
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-serif text-foreground flex items-center justify-center">
                    <ShoppingBag className="mr-4 h-10 w-10 text-primary"/> Our Shop
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                    Browse exclusive merchandise and study kits, curated just for you.
                </p>
            </div>
            
            {items && items.length > 0 ? (
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    {items.map((item, i) => (
                        <motion.div
                            key={item.id}
                            variants={cardVariants}
                            custom={i}
                            whileHover={{ y: -5, scale: 1.02, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                            whileTap={{ scale: 0.98 }}
                            className="h-full"
                        >
                            <Card className="flex flex-col h-full overflow-hidden rounded-2xl shadow-lg">
                                <div className="relative w-full h-56">
                                    <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" />
                                </div>
                                <CardHeader>
                                    <CardTitle>{item.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                                    <p className="text-xl font-bold text-primary flex items-center">
                                        <DollarSign className="h-5 w-5 mr-1" />
                                        {item.price.toFixed(2)}
                                    </p>
                                    <Button asChild>
                                        <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer">
                                            Buy Now
                                        </a>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-16">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">The Shop is Empty</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Our admins are curating new items. Check back soon!
                    </p>
                </div>
            )}
        </motion.div>
    );
}
