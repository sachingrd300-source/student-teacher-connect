'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { Megaphone } from 'lucide-react';

interface Announcement {
    id: string;
    message: string;
    target: 'all' | 'teachers' | 'students';
    createdAt: string;
    expiresAt?: string;
}

interface MarqueeAnnouncementsProps {
    userRole: 'student' | 'teacher';
}

export function MarqueeAnnouncements({ userRole }: MarqueeAnnouncementsProps) {
    const firestore = useFirestore();

    const announcementsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'announcements'),
            where('target', 'in', ['all', userRole])
        );
    }, [firestore, userRole]);

    const { data: allAnnouncements, isLoading } = useCollection<Announcement>(announcementsQuery);

    const activeAnnouncements = useMemo(() => {
        if (!allAnnouncements) return [];
        const now = new Date();
        return allAnnouncements.filter(ann => {
            if (!ann.expiresAt) return true; // No expiry date means it's always active
            return new Date(ann.expiresAt) > now;
        });
    }, [allAnnouncements]);

    if (isLoading || activeAnnouncements.length === 0) {
        return null;
    }

    const announcementText = activeAnnouncements.map(a => a.message).join(' ••• ');

    return (
        <div className="relative flex overflow-x-hidden bg-primary text-primary-foreground">
            <div className="py-2 whitespace-nowrap flex items-center animate-marquee">
                <Megaphone className="h-5 w-5 mx-4 flex-shrink-0" />
                <span className="text-sm font-semibold">{announcementText}</span>
            </div>
            <div className="absolute top-0 py-2 whitespace-nowrap flex items-center animate-marquee2">
                 <Megaphone className="h-5 w-5 mx-4 flex-shrink-0" />
                <span className="text-sm font-semibold">{announcementText}</span>
            </div>
        </div>
    );
}
