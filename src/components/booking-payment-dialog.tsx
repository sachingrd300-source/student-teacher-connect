'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

export function BookingPaymentDialog({ isOpen, onClose, booking }: BookingPaymentDialogProps) {
    const [paymentState, setPaymentState] = useState<'idle' | 'show_qr'>('idle');

    const handlePayNowClick = () => {
        setPaymentState('show_qr');
    };

    const handleClose = () => {
        setPaymentState('idle');
        onClose();
    };

    if (!booking) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
            <DialogContent>
                <DialogHeader>
                    {paymentState === 'idle' ? (
                        <>
                            <DialogTitle>Confirm Home Tutor Booking</DialogTitle>
                            <DialogDescription>
                                A one-time platform fee is required to confirm the booking and connect with the teacher.
                            </DialogDescription>
                        </>
                    ) : (
                        <>
                            <DialogTitle>Scan & Pay Booking Fee</DialogTitle>
                            <DialogDescription>Scan the QR to pay the fee. The admin will confirm your booking after payment.</DialogDescription>
                        </>
                    )}
                </DialogHeader>

                {paymentState === 'idle' ? (
                    <div className="py-4">
                        <p><strong>Student:</strong> {booking.studentName}</p>
                        <p className="font-bold text-lg mt-2">Platform Fee: ₹{PLATFORM_FEE.toFixed(2)}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-4 gap-4">
                        <p className="font-semibold">Scan to pay: Sachin Pandit</p>
                        <div className="p-4 bg-white rounded-lg border">
                           <Image src="/payment-qr.png" width={250} height={250} alt="Payment QR Code for Sachin Pandit" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                            Scan to pay the ₹{PLATFORM_FEE.toFixed(2)} platform fee using any UPI app.<br/>
                            After payment, the admin will confirm your booking and connect you with your tutor.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    {paymentState === 'idle' ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handlePayNowClick}>Pay ₹{PLATFORM_FEE.toFixed(2)}</Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={handleClose}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
