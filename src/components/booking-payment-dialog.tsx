'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';

interface HomeBooking {
    id: string;
    studentName: string;
}

interface BookingPaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    booking: HomeBooking | null;
    onPaymentSuccess: () => void;
}

const PLATFORM_FEE = 99;

export function BookingPaymentDialog({ isOpen, onClose, booking, onPaymentSuccess }: BookingPaymentDialogProps) {
    const firestore = useFirestore();
    const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleConfirmPayment = async () => {
        if (!firestore || !booking) return;
        setPaymentState('processing');
        setError(null);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            const bookingRef = doc(firestore, 'homeBookings', booking.id);
            await updateDoc(bookingRef, {
                status: 'Confirmed',
                bookingFee: PLATFORM_FEE,
                paymentId: `sim_${new Date().getTime()}` // Simulated payment ID
            });
            
            setPaymentState('success');
            setTimeout(() => {
                onPaymentSuccess();
                onClose();
                setPaymentState('idle'); // Reset for next time
            }, 1500);

        } catch (err) {
            console.error("Booking payment failed:", err);
            setError("Something went wrong. Please try again.");
            setPaymentState('idle');
        }
    };

    if (!booking) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setPaymentState('idle'); } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Home Tutor Booking</DialogTitle>
                    <DialogDescription>
                        A one-time platform fee is required to confirm the booking and connect with the teacher.
                    </DialogDescription>
                </DialogHeader>

                {paymentState === 'idle' && (
                    <div className="py-4">
                        <p><strong>Student:</strong> {booking.studentName}</p>
                        <p className="font-bold text-lg mt-2">Platform Fee: ₹{PLATFORM_FEE.toFixed(2)}</p>
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
                        <p className="font-semibold">Payment Successful! Booking Confirmed.</p>
                    </div>
                )}

                <DialogFooter>
                    {paymentState === 'idle' && (
                        <>
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleConfirmPayment}>Pay ₹{PLATFORM_FEE.toFixed(2)}</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
