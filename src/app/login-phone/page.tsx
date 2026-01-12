
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setupRecaptcha, sendOtp, auth } from '@/firebase/auth';
import { firestore } from '@/firebase/firebase';
import { getAdditionalUserInfo, type ConfirmationResult } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function PhoneLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setupRecaptcha('recaptcha-container');
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await sendOtp(phoneNumber, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast({ title: 'OTP Sent!', description: 'Please check your phone for the verification code.' });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ variant: 'destructive', title: 'Failed to Send OTP', description: error.message || 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setIsLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
          await setDoc(userDocRef, {
              id: user.uid,
              name: 'Student', // Default name
              email: null, // No email with phone auth
              mobileNumber: user.phoneNumber,
              role: 'student',
              status: 'approved',
          });
          toast({ title: 'Account Created!', description: 'Welcome to EduConnect Pro.' });
      } else {
          toast({ title: 'Login Successful', description: "Welcome back!" });
      }
      
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({ variant: 'destructive', title: 'Invalid OTP', description: error.code === 'auth/invalid-verification-code' ? 'The code you entered is incorrect.' : 'An error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-grid-pattern p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-headline">Login with Phone</CardTitle>
            {!otpSent ? (
              <CardDescription className="text-center">Enter your mobile number to receive a one-time verification code (OTP).</CardDescription>
            ) : (
              <CardDescription className="text-center">Enter the 6-digit verification code sent to your mobile number.</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="phone" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+91 12345 67890" required className="pl-10"/>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input id="otp" type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" required />
              </div>
            )}
             <div id="recaptcha-container" className="flex justify-center"></div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="mr-2 h-4 w-4"/>
              {isLoading ? (otpSent ? 'Verifying...' : 'Sending OTP...') : (otpSent ? 'Verify OTP' : 'Send OTP')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login-student" className="text-primary hover:underline">Back to other login options</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
