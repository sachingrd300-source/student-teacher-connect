
'use client';

import { cn } from "@/lib/utils";

export function AnimatedGradient() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-[-100%] animate-spin-slow">
                <div 
                    className={cn(
                        "absolute inset-0 gradient-rotate",
                        "[--gradient-angle:0deg]",
                        "bg-[conic-gradient(from_var(--gradient-angle)_at_50%_50%,_hsl(var(--primary))_0%,_hsl(var(--accent))_50%,_hsl(var(--primary))_100%)]",
                        "opacity-20"
                    )}
                />
            </div>
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl"></div>
        </div>
    );
}
