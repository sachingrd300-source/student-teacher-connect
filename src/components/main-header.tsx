
'use client';

import Link from 'next/link';
import { School } from 'lucide-react';
import { Button } from './ui/button';

export function MainHeader() {
    return (
        <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b sticky top-0 z-50">
            <Link className="flex items-center justify-center" href="/">
                <School className="h-6 w-6 mr-2 text-primary" />
                <span className="text-lg font-semibold font-serif">My App</span>
            </Link>
            <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
                 <Link href="/">
                    <Button variant="ghost">Home</Button>
                </Link>
            </nav>
        </header>
    );
}
