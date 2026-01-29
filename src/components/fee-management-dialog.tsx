'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, addDoc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle } from 'lucide-react';
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
    paidOn?: string;
}

interface StudentProfile {
    mobileNumber?: string;
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

    const studentProfileRef = useMemoFirebase(() => {
        if (!firestore || !student) return null;
        return doc(firestore, 'users', student.studentId);
    }, [firestore, student]);
    const { data: studentProfile, isLoading: profileLoading } = useDoc<StudentProfile>(studentProfileRef);

    const isLoading = feesLoading || profileLoading;

    const feeStatusByMonth = useMemo(() => {
        const statusMap = new Map<string, { status: 'paid' | 'unpaid', feeId: string, paidOn?: string }>();
        feesData?.forEach(fee => {
            const key = `${fee.feeYear}-${fee.feeMonth}`;
            statusMap.set(key, { status: fee.status, feeId: fee.id, paidOn: fee.paidOn });
        });
        return statusMap;
    }, [feesData]);

    const allMonths = useMemo(() => {
        if (!student?.approvedAt) return [];
        const startDate = new Date(student.approvedAt);
        const endDate = new Date(); // today
        return getMonthsInRange(startDate, endDate);
    }, [student?.approvedAt]);
    
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

    const handleSendReminder = (month: number, year: number) => {
        if (!studentProfile?.mobileNumber || !student) return;
        const message = `Hello ${student.studentName}, this is a reminder for your fee payment for the month of ${monthFormatter.format(new Date(year, month - 1))}. Please pay at your earliest convenience. Thank you.`;
        const phoneNumber = studentProfile.mobileNumber.replace(/[^0-9]/g, '');
        const formattedPhoneNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
        const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleFeeStatusChange = async (month: number, year: number, isPaid: boolean) => {
        if (!firestore || !student) return;

        const key = `${year}-${month}`;
        const existingFee = feeStatusByMonth.get(key);

        if (existingFee?.status === 'paid' && !isPaid) {
            // Prevent marking a paid fee as unpaid
            return;
        }

        const newStatus = isPaid ? 'paid' : 'unpaid';

        try {
            if (existingFee) {
                // Update existing doc
                const feeRef = doc(firestore, 'fees', existingFee.feeId);
                await updateDoc(feeRef, {
                    status: newStatus,
                    paidOn: isPaid ? new Date().toISOString() : undefined,
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
                    paidOn: isPaid ? new Date().toISOString() : undefined,
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            console.error("Error updating fee status:", error);
            // Optionally: show an error toast to the user
        }
    };


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
                    {isLoading ? (
                         <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {allMonths.slice().reverse().map(({ month, year }) => { // Show recent months first
                                const key = `${year}-${month}`;
                                const feeInfo = feeStatusByMonth.get(key);
                                const isPaid = feeInfo?.status === 'paid';
                                const paidOnDate = feeInfo?.paidOn ? new Date(feeInfo.paidOn) : null;
                                
                                return (
                                    <div key={key} className="flex flex-col p-3 rounded-lg border gap-2">
                                        <div className="flex items-center justify-between">
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
                                                    disabled={isPaid}
                                                />
                                            </div>
                                        </div>
                                         {isPaid && paidOnDate && (
                                            <p className="text-xs text-muted-foreground">
                                                Paid on: {paidOnDate.toLocaleDateString()}
                                            </p>
                                        )}
                                        {!isPaid && (
                                            studentProfile?.mobileNumber ? (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="self-start"
                                                    onClick={() => handleSendReminder(month, year)}
                                                >
                                                    <MessageCircle className="h-4 w-4 mr-2" />
                                                    Send Reminder
                                                </Button>
                                            ) : (
                                                <p className="text-xs text-muted-foreground self-start pt-2">
                                                    Add mobile number to student's profile to send reminders.
                                                </p>
                                            )
                                        )}
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
