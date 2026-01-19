'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { signupWithEmail } from '@/firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const subjectCategories = [
    "K-12",
    "Competitive Exams",
    "Professional Courses",
    "Languages",
    "Arts & Hobbies",
  ];
const experienceTypes = ["School", "Coaching", "Online", "Home Tutor"];

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobileNumber: '',
    subjectCategory: '',
    subjects: '',
    classLevels: '',
    qualification: '',
    experience: '',
    experienceType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const tutorBgImage = PlaceHolderImages.find(img => img.id === 'tutor-bg');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({...prev, [id]: value}));
  };

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.name || !formData.mobileNumber) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill in all required fields.',
        });
        return;
    }
    setIsLoading(true);
    try {
      const { user } = await signupWithEmail(formData.email, formData.password);

      const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(Boolean);
      const classLevelsArray = formData.classLevels.split(',').map(s => s.trim()).filter(Boolean);

      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        role: 'tutor',
        status: 'pending_verification',
        subjectCategory: formData.subjectCategory,
        subjects: subjectsArray,
        classLevels: classLevelsArray,
        qualification: formData.qualification,
        experience: formData.experience,
        experienceType: formData.experienceType,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Signup Successful!',
        description: "Your profile has been submitted for verification. We'll notify you upon approval.",
      });
      router.push('/dashboard/teacher');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.code === 'auth/email-already-in-use' ? 'This email is already registered.' : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 py-12 overflow-hidden">
        {tutorBgImage && (
            <Image
                src={tutorBgImage.imageUrl}
                alt={tutorBgImage.description}
                data-ai-hint={tutorBgImage.imageHint}
                fill
                className="object-cover"
            />
        )}
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <Card className="w-full max-w-lg shadow-2xl z-20">
            <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <Icons.logo className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Become a Tutor</CardTitle>
            <CardDescription>Join our community of expert educators.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="name">Full Name*</Label>
                <Input id="name" value={formData.name} onChange={handleChange} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number*</Label>
                <Input id="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="email">Email*</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Password*</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleChange} disabled={isLoading} />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="subjects">Subjects You Teach*</Label>
                    <Input id="subjects" placeholder="e.g. Physics, Maths, History" value={formData.subjects} onChange={handleChange} disabled={isLoading} />
                    <p className="text-xs text-muted-foreground">Separate subjects with a comma.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="qualification">Highest Qualification</Label>
                    <Input id="qualification" placeholder="e.g. B.Tech, M.Sc. Physics" value={formData.qualification} onChange={handleChange} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" placeholder="e.g. 5 Years" value={formData.experience} onChange={handleChange} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="experienceType">Type of Experience</Label>
                    <Select onValueChange={(value) => handleSelectChange('experienceType', value)} value={formData.experienceType}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            {experienceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subjectCategory">Primary Subject Category</Label>
                    <Select onValueChange={(value) => handleSelectChange('subjectCategory', value)} value={formData.subjectCategory}>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                            {subjectCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="classLevels">Class Levels</Label>
                    <Input id="classLevels" placeholder="e.g. 9-10, 11-12" value={formData.classLevels} onChange={handleChange} disabled={isLoading} />
                    <p className="text-xs text-muted-foreground">Separate levels with a comma.</p>
                </div>
            </div>
            <Button onClick={handleSignup} className="mt-6 w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
                </Link>
            </p>
            </CardContent>
        </Card>
    </div>
  );
}
