'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Check, User, Briefcase, MapPin, Mail, Key } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, initiateEmailSignUp } from '@/firebase'; // Using the non-blocking sign-up

const steps = [
    { id: 1, name: 'Account Details', fields: ['name', 'email', 'password'], icon: User },
    { id: 2, name: 'Professional Info', fields: ['subjects', 'qualification', 'experience'], icon: Briefcase },
    { id: 3, name: 'Contact Info', fields: ['address', 'mobileNumber'], icon: MapPin },
    { id: 4, name: 'Verification', icon: Check },
];

export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    subjects: '',
    qualification: '',
    experience: '',
    address: '',
    mobileNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleRegistration = async () => {
    setIsLoading(true);
    try {
        // This is non-blocking, it starts the sign-up and the onAuthStateChanged listener will catch the result
        initiateEmailSignUp(auth, formData.email, formData.password);
        
        toast({ title: 'Registration Successful!', description: 'Your account is being created. Redirecting to your profile...' });
        
        // TODO: In a real app, we would also save the additional profile data (steps 2 & 3) to Firestore here.
        // For now, we'll just redirect.

        router.push('/dashboard/teacher/profile');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
        setIsLoading(false);
    }
  };


  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-grid-pattern p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">Become a Tutor on EduConnect Pro</CardTitle>
          <CardDescription className="text-center">Follow the steps below to create your profile.</CardDescription>
          <div className="pt-4">
              <Progress value={progressValue} className="w-full" />
              <div className="grid grid-cols-4 mt-2">
                  {steps.map(step => (
                      <div key={step.id} className="text-center">
                          <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</p>
                      </div>
                  ))}
              </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[280px]">
            {currentStep === 1 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Account Details</h3>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleChange} />
                    </div>
                </div>
            )}
             {currentStep === 2 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Professional Information</h3>
                    <div className="space-y-2">
                        <Label htmlFor="subjects">Subjects Taught</Label>
                        <Input id="subjects" value={formData.subjects} onChange={handleChange} placeholder="e.g., Mathematics, Physics" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="qualification">Highest Qualification</Label>
                        <Input id="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g., Ph.D. in Physics" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input id="experience" value={formData.experience} onChange={handleChange} placeholder="e.g., 5 Years" />
                    </div>
                </div>
            )}
            {currentStep === 3 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Contact & Location</h3>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" value={formData.address} onChange={handleChange} placeholder="Your primary coaching or home address" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Mobile Number</Label>
                        <Input id="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} placeholder="+1 (555) 123-4567" />
                    </div>
                </div>
            )}
             {currentStep === 4 && (
                <div className="text-center space-y-4 flex flex-col items-center">
                    <Check className="h-12 w-12 text-green-500 bg-green-100 rounded-full p-2" />
                    <h3 className="font-semibold text-xl">You're All Set!</h3>
                    <p className="text-muted-foreground max-w-md">
                        Thank you for filling out your details. Click the button below to create your account and complete your registration.
                    </p>
                    <Button size="lg" className="w-full max-w-xs" onClick={handleRegistration} disabled={isLoading}>
                         <Mail className="mr-2 h-5 w-5" /> {isLoading ? 'Registering...' : 'Complete Registration'}
                    </Button>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-between">
            {currentStep > 1 && currentStep < 4 ? (
                <Button variant="outline" onClick={handleBack}>Back</Button>
            ) : <div />}
            {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>Next</Button>
            ) : currentStep === steps.length ? (
                 <Button asChild><Link href="/dashboard/teacher">Go to Dashboard</Link></Button>
            ): <div></div>}
        </CardFooter>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
