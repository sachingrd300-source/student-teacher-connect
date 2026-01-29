'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';

interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    teacherId: string;
    batchId: string;
    batchName: string;
    feeDetails: { month: number, year: number };
    onPaymentSuccess: () => void;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

export function PaymentDialog({ isOpen, onClose, studentId, studentName, teacherId, batchId, batchName, feeDetails, onPaymentSuccess }: PaymentDialogProps) {
    const firestore = useFirestore();
    const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleConfirmPayment = async () => {
        if (!firestore) return;
        setPaymentState('processing');
        setError(null);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            const feesRef = collection(firestore, 'fees');
            const q = query(
                feesRef,
                where('studentId', '==', studentId),
                where('batchId', '==', batchId),
                where('feeMonth', '==', feeDetails.month),
                where('feeYear', '==', feeDetails.year)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // If no record exists, create one
                await addDoc(feesRef, {
                    studentId,
                    studentName,
                    teacherId,
                    batchId,
                    batchName,
                    feeMonth: feeDetails.month,
                    feeYear: feeDetails.year,
                    status: 'paid',
                    paidOn: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                });
            } else {
                // If a record exists (as 'unpaid'), update it
                const feeDocRef = doc(firestore, 'fees', querySnapshot.docs[0].id);
                await updateDoc(feeDocRef, {
                    status: 'paid',
                    paidOn: new Date().toISOString(),
                });
            }
            
            setPaymentState('success');
            setTimeout(() => {
                onPaymentSuccess();
                onClose();
                setPaymentState('idle');
            }, 1500);

        } catch (err) {
            console.error("Payment failed:", err);
            setError("Something went wrong. Please try again.");
            setPaymentState('idle');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setPaymentState('idle'); } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Fee Payment</DialogTitle>
                    <DialogDescription>
                        You are about to pay the fee for {monthFormatter.format(new Date(feeDetails.year, feeDetails.month - 1))} {feeDetails.year}.
                    </DialogDescription>
                </DialogHeader>

                {paymentState === 'idle' && (
                    <div className="py-4">
                        <p><strong>Student:</strong> {studentName}</p>
                        <p><strong>Batch:</strong> {batchName}</p>
                        <p><strong>Fee for:</strong> {monthFormatter.format(new Date(feeDetails.year, feeDetails.month - 1))}</p>
                        {error && <p className="text-destructive text-sm mt-4">{error}</p>}
                    </div>
                )}
                
                {paymentState === 'processing' && (
                     <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Processing payment...</p>
                    </div>
                )}

                {paymentState === 'success' && (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                        <p className="font-semibold">Payment Successful!</p>
                    </div>
                )}

                <DialogFooter>
                    {paymentState === 'idle' && (
                        <>
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleConfirmPayment}>Confirm Payment</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
