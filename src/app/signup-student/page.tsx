
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Check, User, Mail, Key } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, initiateEmailSignUp, useFirestore } from '@/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

const steps = [
    { id: 1, name: 'Account Details', fields: ['name', 'email', 'password'], icon: User },
    { id: 2, name: 'Verification', icon: Check },
];

export default function SignUpStudentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
        if (!formData.name || !formData.email || !formData.password) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill out all account details.',
            });
            return;
        }
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleRegistration = async () => {
    if (!firestore || !auth) return;
    setIsLoading(true);
    try {
        const userCredential = await initiateEmailSignUp(auth, formData.email, formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.name });

        // Create user profile document in Firestore
        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
            id: user.uid,
            name: formData.name,
            email: formData.email,
            role: 'student',
        });
        
        toast({ title: 'Registration Successful!', description: 'Your account is being created. Redirecting to your dashboard...' });
        
        router.push('/dashboard/student');
    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already registered. Please log in or use a different email.';
        }
        toast({ variant: 'destructive', title: 'Registration Failed', description });
        setIsLoading(false);
    }
  };


  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-grid-pattern p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">Create Your Student Account</CardTitle>
          <CardDescription className="text-center">Join EduConnect Pro to access your learning materials.</CardDescription>
          <div className="pt-4">
              <Progress value={progressValue} className="w-full" />
              <div className="grid grid-cols-2 mt-2">
                  {steps.map(step => (
                      <div key={step.id} className="text-center">
                          <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</p>
                      </div>
                  ))}
              </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[250px]">
            {currentStep === 1 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Account Details</h3>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} placeholder="Jane Doe" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                    </div>
                </div>
            )}
             {currentStep === 2 && (
                <div className="text-center space-y-4 flex flex-col items-center pt-8">
                    <Check className="h-12 w-12 text-green-500 bg-green-100 rounded-full p-2" />
                    <h3 className="font-semibold text-xl">Review and Complete</h3>
                    <p className="text-muted-foreground max-w-md">
                        You're ready to go! Click the button below to create your student account.
                    </p>
                    <Button size="lg" className="w-full max-w-xs" onClick={handleRegistration} disabled={isLoading}>
                         <Mail className="mr-2 h-5 w-5" /> {isLoading ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-between">
            {currentStep === 2 ? (
                <Button variant="outline" onClick={handleBack}>Back</Button>
            ) : <div />}
            {currentStep === 1 ? (
                <Button onClick={handleNext}>Next</Button>
            ) : <div></div>}
        </CardFooter>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account? <Link href="/login-student" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
