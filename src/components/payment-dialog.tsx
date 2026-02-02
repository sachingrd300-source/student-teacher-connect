'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    batchName: string;
    feeDetails: { month: number, year: number };
    onPaymentSuccess: () => void;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

export function PaymentDialog({ isOpen, onClose, studentName, batchName, feeDetails }: PaymentDialogProps) {
    const [paymentState, setPaymentState] = useState<'idle' | 'show_qr'>('idle');

    const handlePayNowClick = () => {
        setPaymentState('show_qr');
    };

    const handleClose = () => {
        setPaymentState('idle');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent>
                <DialogHeader>
                    {paymentState === 'idle' ? (
                        <>
                            <DialogTitle>Confirm Fee Payment</DialogTitle>
                            <DialogDescription>
                                You are about to pay the fee for {monthFormatter.format(new Date(feeDetails.year, feeDetails.month - 1))} {feeDetails.year}.
                            </DialogDescription>
                        </>
                    ) : (
                         <DialogTitle>Scan & Pay Fee</DialogTitle>
                    )}
                </DialogHeader>

                {paymentState === 'idle' ? (
                    <div className="py-4">
                        <p><strong>Student:</strong> {studentName}</p>
                        <p><strong>Batch:</strong> {batchName}</p>
                        <p><strong>Fee for:</strong> {monthFormatter.format(new Date(feeDetails.year, feeDetails.month - 1))}</p>
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center py-4 gap-4">
                        <p className="font-semibold">Scan to pay: Sachin Pandit</p>
                        <div className="p-4 bg-white rounded-lg border">
                           <Image src="/payment-qr.png" width={250} height={250} alt="Payment QR Code for Sachin Pandit" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                            Use any UPI app (e.g., PhonePe, GPay).<br/>
                            After payment, the teacher will verify and update your fee status.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    {paymentState === 'idle' ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handlePayNowClick}>Pay Now</Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={handleClose}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
