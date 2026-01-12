
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Check, User, Briefcase, BookCopy } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { signupWithEmail, auth } from '@/firebase/auth';
import { firestore } from '@/firebase/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const steps = [
    { id: 1, name: 'Basic Details', icon: User },
    { id: 2, name: 'Subjects', icon: BookCopy },
    { id: 3, name: 'Experience', icon: Briefcase },
    { id: 4, name: 'Verification', icon: Check },
];

const subjectCategories = ["Maths", "Physics", "Chemistry", "Biology", "English", "Computer", "Competitive Exam"];
const classLevels = ["Class 6–8", "Class 9–10", "Class 11–12", "Diploma / Degree"];
const experienceLevels = ["Fresher", "1–2 years", "3+ years"];
const experienceTypes = ["School", "Coaching", "Home Tutor", "Online"];


export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    subjectCategory: '',
    subjects: [] as string[],
    classLevels: [] as string[],
    qualification: '',
    experience: '',
    experienceType: '',
    address: '',
    coachingName: '',
    whatsappNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    if (name && email) {
      setFormData(prev => ({ ...prev, name, email }));
      setIsGoogleSignIn(true);
    }
  }, [searchParams]);

  const handleClassLevelChange = (level: string) => {
    setFormData(prev => {
        const newLevels = prev.classLevels.includes(level)
            ? prev.classLevels.filter(l => l !== level)
            : [...prev.classLevels, level];
        return { ...prev, classLevels: newLevels };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: keyof typeof formData, value: string) => {
    setFormData(prev => ({...prev, [id]: value}))
  }

  const handleSubjectsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const subjectsArray = value.split(',').map(s => s.trim()).filter(s => s);
    setFormData(prev => ({...prev, subjects: subjectsArray}));
  }

  const handleNext = () => {
    if (currentStep === 1 && !isGoogleSignIn) {
        if (!formData.name || !formData.email || !formData.mobileNumber || !formData.password || !formData.confirmPassword) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill all the basic details.'});
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast({ variant: 'destructive', title: 'Passwords Do Not Match', description: 'Please ensure your passwords match.'});
            return;
        }
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleRegistration = async () => {
    setIsLoading(true);
    try {
        let user;
        if (isGoogleSignIn) {
            user = auth.currentUser;
            if (!user) {
                throw new Error("User not found. Please try logging in with Google again.");
            }
        } else {
            const userCredential = await signupWithEmail(formData.email, formData.password);
            user = userCredential.user;
            await updateProfile(user, { displayName: formData.name });
        }

        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
            id: user.uid,
            name: formData.name,
            email: formData.email,
            mobileNumber: formData.mobileNumber,
            role: 'tutor',
            subjects: formData.subjects,
            classLevels: formData.classLevels,
            subjectCategory: formData.subjectCategory,
            qualification: formData.qualification,
            experience: formData.experience,
            experienceType: formData.experienceType,
            address: formData.address,
            coachingName: formData.coachingName,
            whatsappNumber: formData.whatsappNumber,
            status: 'pending_verification'
        });
        
        toast({ title: 'Registration Submitted!', description: 'Your profile is under review. You will be notified upon approval.' });
        router.push('/login');
    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already registered. Please log in or use a different email.';
        }
        toast({ variant: 'destructive', title: 'Registration Failed', description });
    } finally {
        setIsLoading(false);
    }
  };

  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-grid-pattern p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">Become a Tutor</CardTitle>
          <CardDescription className="text-center">Follow the steps below to create your tutor profile.</CardDescription>
          <div className="pt-4">
              <Progress value={progressValue} className="w-full" />
              <div className={`grid grid-cols-${steps.length} mt-2`}>
                  {steps.map(step => (
                      <div key={step.id} className="text-center">
                          <p className={`text-xs sm:text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</p>
                      </div>
                  ))}
              </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[350px]">
            {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Basic Details</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" value={formData.name} onChange={handleChange} placeholder="John Doe" disabled={isGoogleSignIn} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="mobileNumber">Mobile Number</Label>
                          <Input id="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} placeholder="9876543210" />
                      </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" disabled={isGoogleSignIn} />
                    </div>
                     {!isGoogleSignIn && <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
                        </div>
                    </div>}
                </div>
            )}
             {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><BookCopy className="h-5 w-5 text-primary" /> Subject Selection</h3>
                     <div className="space-y-2">
                        <Label>Subject Category</Label>
                         <Select onValueChange={(value) => handleSelectChange('subjectCategory', value)} value={formData.subjectCategory}>
                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                            <SelectContent>
                                {subjectCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Subjects you teach in this category</Label>
                        <Input id="subjects" onChange={handleSubjectsInputChange} value={formData.subjects.join(', ')} placeholder="e.g. Algebra, Calculus (comma-separated)" />
                    </div>
                    <div className="space-y-2">
                        <Label>Class / Level</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {classLevels.map(level => (
                                <div key={level} className="flex items-center space-x-2">
                                    <Checkbox id={level} checked={formData.classLevels.includes(level)} onCheckedChange={() => handleClassLevelChange(level)} />
                                    <Label htmlFor={level} className="text-sm font-normal">{level}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Qualification & Experience</h3>
                     <div className="space-y-2">
                        <Label htmlFor="qualification">Highest Qualification</Label>
                        <Input id="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g., B.Tech in Computer Science" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Teaching Experience</Label>
                          <Select onValueChange={(value) => handleSelectChange('experience', value)} value={formData.experience}>
                              <SelectTrigger><SelectValue placeholder="Select experience level" /></SelectTrigger>
                              <SelectContent>
                                  {experienceLevels.map(exp => <SelectItem key={exp} value={exp}>{exp}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                       <div className="space-y-2">
                          <Label>Primary Experience Type</Label>
                          <Select onValueChange={(value) => handleSelectChange('experienceType', value)} value={formData.experienceType}>
                              <SelectTrigger><SelectValue placeholder="Select experience type" /></SelectTrigger>
                              <SelectContent>
                                  {experienceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address / City</Label>
                        <Textarea id="address" value={formData.address} onChange={handleChange} placeholder="Your coaching or city where you teach" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                        <Input id="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="e.g. 919876543210 (with country code)" />
                    </div>
                </div>
            )}
             {currentStep === 4 && (
                <div className="text-center space-y-4 flex flex-col items-center animate-in fade-in-50">
                    <Check className="h-12 w-12 text-green-500 bg-green-100 rounded-full p-2" />
                    <h3 className="font-semibold text-xl">Review & Submit</h3>
                    <p className="text-muted-foreground max-w-md">
                        Please review your details. You can go back to change any information.
                    </p>
                    <Card className="text-left w-full p-4 bg-muted/50">
                        <p><strong>Name:</strong> {formData.name}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Mobile:</strong> {formData.mobileNumber}</p>
                        <p><strong>Subject Category:</strong> {formData.subjectCategory}</p>
                        <p><strong>Subjects:</strong> {formData.subjects.join(', ')}</p>
                         <p><strong>Classes:</strong> {formData.classLevels.join(', ')}</p>
                        <p><strong>Qualification:</strong> {formData.qualification}</p>
                        <p><strong>Experience:</strong> {formData.experience} ({formData.experienceType})</p>
                        <p><strong>Address:</strong> {formData.address}</p>
                        <p><strong>WhatsApp:</strong> {formData.whatsappNumber}</p>
                    </Card>
                    <Button size="lg" className="w-full max-w-xs" onClick={handleRegistration} disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Agree & Submit for Verification'}
                    </Button>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-between">
            {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack}>Back</Button>
            ) : <div />}
            {currentStep < steps.length ? (
                <Button onClick={handleNext}>Next</Button>
            ) : <div></div>}
        </CardFooter>
      </Card>
       {!isGoogleSignIn && <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
      </p>}
    </div>
  );
}
