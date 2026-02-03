'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch, increment, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, School, DollarSign, Coins, BadgeCheck, CheckCircle, Award, Shield, Gem, Rocket, Star } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

type BadgeIconType = 'award' | 'shield' | 'gem' | 'rocket' | 'star';

interface ShopItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    priceType: 'money' | 'coins';
    itemType: 'item' | 'badge';
    badgeIcon?: BadgeIconType;
    imageUrl?: string;
    purchaseUrl?: string;
    createdAt: string;
}

interface UserProfile {
    name: string;
    coins?: number;
    equippedBadgeIcon?: string;
}

interface UserInventoryItem {
    id: string;
    itemId: string;
}

const badgeIcons: Record<BadgeIconType, React.ReactNode> = {
    award: <Award className="h-10 w-10" />,
    shield: <Shield className="h-10 w-10" />,
    gem: <Gem className="h-10 w-10" />,
    rocket: <Rocket className="h-10 w-10" />,
    star: <Star className="h-10 w-10" />,
};

export default function ShopPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    
    const inventoryQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'inventory')) : null, [firestore, user]);
    const { data: inventory } = useCollection<UserInventoryItem>(inventoryQuery);

    const shopItemsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'shopItems'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: items, isLoading: itemsLoading } = useCollection<ShopItem>(shopItemsQuery);

    const ownedItemIds = useMemo(() => {
        if (!inventory) return new Set();
        return new Set(inventory.map(item => item.itemId));
    }, [inventory]);

    const handlePurchaseWithCoins = async (item: ShopItem) => {
        if (!user || !firestore || !userProfile || (userProfile.coins ?? 0) < item.price) {
            // maybe show a toast later
            console.error("Cannot purchase. Not enough coins or user not loaded.");
            return;
        }

        setIsPurchasing(item.id);

        const userRef = doc(firestore, 'users', user.uid);
        const inventoryRef = doc(collection(firestore, 'users', user.uid, 'inventory'));
        
        const batch = writeBatch(firestore);

        // Deduct coins from user
        batch.update(userRef, { coins: increment(-item.price) });
        
        // Add item to user's inventory
        const inventoryData: any = {
            itemId: item.id,
            itemName: item.name,
            itemType: item.itemType,
            purchasedAt: new Date().toISOString()
        };
        if (item.itemType === 'badge' && item.badgeIcon) {
            inventoryData.badgeIcon = item.badgeIcon;
        }
        if (item.itemType === 'item' && item.imageUrl) {
            inventoryData.itemImageUrl = item.imageUrl;
        }
        batch.set(inventoryRef, inventoryData);

        try {
            await batch.commit();
            // maybe show success toast later
        } catch (error) {
            console.error("Error purchasing item:", error);
            // maybe show error toast
        } finally {
            setIsPurchasing(null);
        }
    };
    
    const handleEquipBadge = async (item: ShopItem) => {
        if (!user || !firestore || item.itemType !== 'badge') return;
    
        setIsPurchasing(item.id); // reuse loading state
        const userRef = doc(firestore, 'users', user.uid);
        try {
            // If the badge is already equipped, unequip it. Otherwise, equip it.
            const newIcon = userProfile?.equippedBadgeIcon === item.badgeIcon ? null : item.badgeIcon;
            await updateDoc(userRef, { equippedBadgeIcon: newIcon });
        } catch (error) {
            console.error("Error equipping badge:", error);
        } finally {
            setIsPurchasing(null);
        }
    };


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

    const moneyItems = items?.filter(item => item.priceType === 'money') || [];
    const coinItems = items?.filter(item => item.priceType === 'coins') || [];

    const renderItemList = (list: ShopItem[], isCoinShop: boolean) => {
        if (list.length === 0) {
            return (
                <div className="text-center py-16">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">{isCoinShop ? 'No Digital Rewards' : 'No Merchandise Available'}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Our admins are curating new items. Check back soon!
                    </p>
                </div>
            );
        }

        return (
             <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {list.map((item, i) => {
                    const hasEnoughCoins = isCoinShop && (userProfile?.coins ?? 0) >= item.price;
                    const isOwned = isCoinShop && ownedItemIds.has(item.id);
                    const canPurchase = hasEnoughCoins && !isOwned;
                    const isEquipped = item.itemType === 'badge' && userProfile?.equippedBadgeIcon === item.badgeIcon;
                    
                    return (
                         <motion.div
                            key={item.id}
                            variants={cardVariants}
                            custom={i}
                            whileHover={{ y: -5, scale: 1.02, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                            whileTap={{ scale: 0.98 }}
                            className="h-full"
                        >
                            <Card className="flex flex-col h-full overflow-hidden rounded-2xl shadow-lg">
                                <div className="relative w-full h-56 bg-muted">
                                    {item.itemType === 'badge' ? (
                                        <div className="w-full h-full flex items-center justify-center text-primary">
                                            {badgeIcons[item.badgeIcon!]}
                                        </div>
                                    ) : (
                                         <Image src={item.imageUrl!} alt={item.name} layout="fill" objectFit="cover" />
                                    )}
                                    {isOwned && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <BadgeCheck className="h-16 w-16 text-white"/>
                                        </div>
                                    )}
                                </div>
                                <CardHeader>
                                    <CardTitle>{item.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                                     {item.priceType === 'money' ? (
                                        <p className="text-xl font-bold text-primary flex items-center">
                                            <DollarSign className="h-5 w-5 mr-1" />
                                            {item.price.toFixed(2)}
                                        </p>
                                    ) : (
                                        <p className="text-xl font-bold text-primary flex items-center">
                                            <Coins className="h-5 w-5 mr-1" />
                                            {item.price}
                                        </p>
                                    )}
                                    
                                    {isCoinShop ? (
                                        isOwned ? (
                                            item.itemType === 'badge' ? (
                                                <Button onClick={() => handleEquipBadge(item)} disabled={isPurchasing === item.id}>
                                                    {isPurchasing === item.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                    {isEquipped ? 'Unequip' : 'Equip'}
                                                </Button>
                                            ) : (
                                                <Button disabled variant="outline"><CheckCircle className="mr-2 h-4 w-4"/> Owned</Button>
                                            )
                                        ) : (
                                            <Button onClick={() => handlePurchaseWithCoins(item)} disabled={!canPurchase || isPurchasing === item.id}>
                                                {isPurchasing === item.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Purchase
                                            </Button>
                                        )
                                    ) : (
                                         <Button asChild>
                                            <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer">
                                                Buy Now
                                            </a>
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )
                })}
            </motion.div>
        )
    }

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
                    Browse exclusive merchandise or spend your coins on digital rewards!
                </p>
            </div>
            
            <Tabs defaultValue="rewards" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger value="rewards">Digital Rewards</TabsTrigger>
                    <TabsTrigger value="merchandise">Merchandise</TabsTrigger>
                </TabsList>
                <TabsContent value="rewards" className="mt-8">
                    {renderItemList(coinItems, true)}
                </TabsContent>
                <TabsContent value="merchandise" className="mt-8">
                     {renderItemList(moneyItems, false)}
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}

    