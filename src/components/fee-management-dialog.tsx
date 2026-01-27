'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch, addDoc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// From teacher/page.tsx
interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    teacherId: string;
    batchId: string;
    batchName: string;
    status: 'pending' | 'approved';
    createdAt: string;
    approvedAt?: string;
}

interface Fee {
    id: string;
    studentId: string;
    batchId: string;
    feeMonth: number; // 1-12
    feeYear: number;
    status: 'paid' | 'unpaid';
}

interface FeeManagementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    student: Enrollment | null;
}

// Function to get all months between two dates
const getMonthsInRange = (startDate: Date, endDate: Date) => {
    const months = [];
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentDate <= endDate) {
        months.push({ month: currentDate.getMonth() + 1, year: currentDate.getFullYear() });
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
};

export function FeeManagementDialog({ isOpen, onClose, student }: FeeManagementDialogProps) {
    const firestore = useFirestore();
    
    const feesQuery = useMemoFirebase(() => {
        if (!firestore || !student) return null;
        return query(
            collection(firestore, 'fees'),
            where('studentId', '==', student.studentId),
            where('batchId', '==', student.batchId)
        );
    }, [firestore, student]);

    const { data: feesData, isLoading: feesLoading } = useCollection<Fee>(feesQuery);

    const feeStatusByMonth = useMemo(() => {
        const statusMap = new Map<string, { status: 'paid' | 'unpaid', feeId: string }>();
        feesData?.forEach(fee => {
            const key = `${fee.feeYear}-${fee.feeMonth}`;
            statusMap.set(key, { status: fee.status, feeId: fee.id });
        });
        return statusMap;
    }, [feesData]);

    const allMonths = useMemo(() => {
        if (!student?.approvedAt) return [];
        const startDate = new Date(student.approvedAt);
        const endDate = new Date(); // today
        return getMonthsInRange(startDate, endDate);
    }, [student?.approvedAt]);

    const handleFeeStatusChange = async (month: number, year: number, isPaid: boolean) => {
        if (!firestore || !student) return;

        const key = `${year}-${month}`;
        const existingFee = feeStatusByMonth.get(key);
        const newStatus = isPaid ? 'paid' : 'unpaid';

        try {
            if (existingFee) {
                // Update existing doc
                const feeRef = doc(firestore, 'fees', existingFee.feeId);
                await updateDoc(feeRef, {
                    status: newStatus,
                    paidOn: isPaid ? new Date().toISOString() : null,
                });
            } else {
                // Create new doc
                const feeCollRef = collection(firestore, 'fees');
                await addDoc(feeCollRef, {
                    studentId: student.studentId,
                    studentName: student.studentName,
                    teacherId: student.teacherId,
                    batchId: student.batchId,
                    batchName: student.batchName,
                    feeMonth: month,
                    feeYear: year,
                    status: newStatus,
                    paidOn: isPaid ? new Date().toISOString() : null,
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            console.error("Error updating fee status:", error);
            // Optionally: show an error toast to the user
        }
    };


    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

    if (!student) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Fees for {student.studentName}</DialogTitle>
                    <DialogDescription>
                        Batch: {student.batchName} <br/>
                        Joined: {student.approvedAt ? new Date(student.approvedAt).toLocaleDateString() : 'N/A'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {feesLoading ? (
                         <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {allMonths.reverse().map(({ month, year }) => { // Show recent months first
                                const key = `${year}-${month}`;
                                const feeInfo = feeStatusByMonth.get(key);
                                const isPaid = feeInfo?.status === 'paid';
                                
                                return (
                                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                                        <p className="font-medium">
                                            {monthFormatter.format(new Date(year, month - 1))}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-semibold ${isPaid ? 'text-green-600' : 'text-destructive'}`}>
                                                {isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                            <Switch
                                                checked={isPaid}
                                                onCheckedChange={(checked) => handleFeeStatusChange(month, year, checked)}
                                                aria-label={`Mark as ${isPaid ? 'unpaid' : 'paid'}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
