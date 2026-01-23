'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, School } from 'lucide-react';
import { Button } from './ui/button';

export function MainHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const navLinks = [
        { href: '#', label: 'Features' },
        { href: '#', label: 'Pricing' },
        { href: '#', label: 'About' },
        { href: '#', label: 'Contact' },
    ];
    
    return (
        <header className="px-4 lg:px-6 h-14 flex items-center bg-background border-b relative">
            <Link className="flex items-center justify-center" href="/">
                <School className="h-6 w-6 mr-2 text-primary" />
                <span className="text-lg font-semibold font-serif">EduConnect Pro</span>
            </Link>
            <nav className="ml-auto hidden md:flex gap-4 sm:gap-6">
                {navLinks.map(link => (
                     <Link
                        key={link.label}
                        className="text-sm font-medium hover:underline underline-offset-4"
                        href={link.href}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
            <div className="ml-auto md:hidden">
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </div>
             {isMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-background shadow-md md:hidden z-20">
                     <nav className="flex flex-col items-center gap-4 py-4">
                        {navLinks.map(link => (
                            <Link
                                key={link.label}
                                className="text-sm font-medium hover:underline underline-offset-4"
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
             )}
        </header>
    );
}
