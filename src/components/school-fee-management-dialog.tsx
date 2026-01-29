'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// From [schoolId]/page.tsx
interface StudentEntry {
    id: string;
    name:string;
    admissionDate?: string;
    fees?: FeeEntry[];
}

interface ClassEntry {
    id: string;
    name: string;
    section: string;
    students?: StudentEntry[];
}

interface School {
    id: string;
    classes?: ClassEntry[];
}

interface FeeEntry {
    feeMonth: number; // 1-12
    feeYear: number;
    status: 'paid' | 'unpaid';
    paidOn?: string;
}

interface SchoolFeeManagementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    school: School;
    classId: string;
    student: StudentEntry | null;
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

export function SchoolFeeManagementDialog({ isOpen, onClose, school, classId, student }: SchoolFeeManagementDialogProps) {
    const firestore = useFirestore();
    const [feeStatus, setFeeStatus] = useState<FeeEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (student?.fees) {
            setFeeStatus([...student.fees]);
        } else {
            setFeeStatus([]);
        }
    }, [student]);

    const allMonths = useMemo(() => {
        if (!student?.admissionDate) {
            // If no admission date, show last 12 months as a fallback
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1);
            return getMonthsInRange(startDate, endDate);
        };
        const startDate = new Date(student.admissionDate);
        const endDate = new Date(); // today
        return getMonthsInRange(startDate, endDate);
    }, [student?.admissionDate]);

    const handleFeeStatusChange = (month: number, year: number, isPaid: boolean) => {
        const newStatus = isPaid ? 'paid' : 'unpaid';
        const existingEntryIndex = feeStatus.findIndex(f => f.feeMonth === month && f.feeYear === year);

        let updatedFees = [...feeStatus];

        if (existingEntryIndex !== -1) {
            // Update existing entry
            const entryToUpdate = { ...updatedFees[existingEntryIndex] };
            entryToUpdate.status = newStatus;
            if (isPaid) {
                entryToUpdate.paidOn = new Date().toISOString();
            } else {
                delete entryToUpdate.paidOn;
            }
            updatedFees[existingEntryIndex] = entryToUpdate;
        } else {
            // Add new entry
            const newEntry: FeeEntry = {
                feeMonth: month,
                feeYear: year,
                status: newStatus,
            };
            if (isPaid) {
                newEntry.paidOn = new Date().toISOString();
            }
            updatedFees.push(newEntry);
        }
        setFeeStatus(updatedFees);
    };
    
    const handleSave = async () => {
        if (!firestore || !school || !classId || !student) return;
        setIsSaving(true);
        
        try {
            const updatedClasses = (school.classes || []).map(c => {
                if (c.id === classId) {
                    const updatedStudents = (c.students || []).map(s => {
                        if (s.id === student.id) {
                            return { ...s, fees: feeStatus };
                        }
                        return s;
                    });
                    return { ...c, students: updatedStudents };
                }
                return c;
            });

            const schoolRef = doc(firestore, 'schools', school.id);
            await updateDoc(schoolRef, { classes: updatedClasses });
            onClose();
        } catch (error) {
            console.error("Error saving fee status:", error);
        } finally {
            setIsSaving(false);
        }
    };


    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

    if (!student) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Fees for {student.name}</DialogTitle>
                    <DialogDescription>
                        Admission Date: {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-4">
                        {allMonths.length > 0 ? allMonths.slice().reverse().map(({ month, year }) => { // Show recent months first
                            const feeInfo = feeStatus.find(f => f.feeMonth === month && f.feeYear === year);
                            const isPaid = feeInfo?.status === 'paid';
                            const paidOnDate = feeInfo?.paidOn ? new Date(feeInfo.paidOn) : null;
                            
                            return (
                                <div key={`${year}-${month}`} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <p className="font-medium">
                                            {monthFormatter.format(new Date(year, month - 1))}
                                        </p>
                                         {isPaid && paidOnDate && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Paid on: {paidOnDate.toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
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
                        }) : <p className="text-center text-muted-foreground">Set an admission date for the student to manage fees.</p>}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                     <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
