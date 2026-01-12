
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';


export default function AttendancePage() {
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <ClipboardCheck className="h-8 w-8"/>
                    Mark Attendance
                </h1>
                <p className="text-muted-foreground">Select a class and date to mark student attendance.</p>
            </div>

            <Card className="shadow-soft-shadow">
                <CardHeader>
                    <CardTitle>Attendance</CardTitle>
                    <CardDescription>
                        The student attendance feature is currently under development.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Please check back later for updates.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
