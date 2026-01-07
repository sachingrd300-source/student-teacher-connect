
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

const signUpSchema = z.object({
  role: z.enum(['student', 'teacher', 'parent'], { required_error: 'You must select a role.' }),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  mobileNumber: z.string().length(10, 'Please enter a valid 10-digit mobile number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  // Teacher fields
  subjects: z.string().optional(),
  className: z.string().optional(),
  // Student fields
  teacherId: z.string().optional(),
  // Parent fields
  studentId: z.string().optional(),
}).refine(data => {
    if (data.role === 'teacher') {
        return !!data.subjects && !!data.className;
    }
    return true;
}, {
    message: 'Subjects and Class Name are required for teachers.',
    path: ['subjects'], // Or path: ['className']
}).refine(data => {
    if (data.role === 'parent') {
        return !!data.studentId;
    }
    return true;
}, {
    message: 'Student ID is required for parents.',
    path: ['studentId'],
});


export default function SignUpPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    
    const form = useForm<z.infer<typeof signUpSchema>>({
      resolver: zodResolver(signUpSchema),
      defaultValues: {
        role: 'student',
        name: '',
        mobileNumber: '',
        password: '',
        subjects: '',
        className: '',
        teacherId: '',
        studentId: '',
      },
    });

    const selectedRole = form.watch('role');

    // Redirect if user is already logged in
    useEffect(() => {
        if (!isUserLoading && user && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    router.push(`/dashboard/${userData.role}`);
                }
            })
        }
    }, [user, isUserLoading, router, firestore]);
    
    const getEmailFromMobile = (mobile: string) => `${mobile}@edconnect.pro`;

    const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
        if (!auth || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication service is not available.' });
            return;
        }

        const email = getEmailFromMobile(values.mobileNumber);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
            const newUser = userCredential.user;

            const userDocRef = doc(firestore, 'users', newUser.uid);
            const userData = {
                id: newUser.uid,
                name: values.name,
                mobileNumber: values.mobileNumber,
                email: newUser.email,
                role: values.role,
                avatarUrl: `https://picsum.photos/seed/${newUser.uid}/100/100`,
            };
            
            if (values.role === 'teacher') {
                const teacherId = `TCH-${uuidv4().slice(0,4).toUpperCase()}`;
                const teacherDocRef = doc(firestore, 'teachers', teacherId);
                await setDoc(teacherDocRef, {
                    id: teacherId,
                    userId: newUser.uid,
                    verificationCode: teacherId,
                    subjects: values.subjects,
                    className: values.className,
                    experience: 'Not specified',
                    address: 'Not specified',
                });
                await setDoc(userDocRef, userData, { merge: true });

            } else if (values.role === 'student') {
                const studentDocRef = doc(firestore, 'students', newUser.uid);
                await setDoc(studentDocRef, {
                    id: newUser.uid,
                    userId: newUser.uid,
                    isApproved: !values.teacherId, 
                    teacherId: values.teacherId || null,
                });
                await setDoc(userDocRef, { 
                    ...userData,
                    isApproved: !values.teacherId, 
                    teacherId: values.teacherId || null 
                }, { merge: true });

            } else if (values.role === 'parent') {
                const studentUserDoc = await getDoc(doc(firestore, 'users', values.studentId!));
                if (!studentUserDoc.exists() || studentUserDoc.data().role !== 'student') {
                    throw new Error("Invalid Student ID provided. Please check and try again.");
                }
                const parentDocRef = doc(firestore, 'parents', newUser.uid);
                await setDoc(parentDocRef, {
                    id: newUser.uid,
                    userId: newUser.uid,
                    studentId: values.studentId,
                    teacherId: studentUserDoc.data().teacherId || null,
                });
                await setDoc(userDocRef, userData, { merge: true });
            }

            toast({
                title: "Account Created!",
                description: "Your profile has been saved. Redirecting to your dashboard...",
            });

        } catch (error: any) {
            console.error("SignUp Error:", error);
            let errorMessage = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "An account with this mobile number already exists.";
            } else if (error.message.includes("Invalid Student ID")) {
                errorMessage = error.message;
            }
            
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: errorMessage,
            });
        }
    };
    
    if (isUserLoading) {
      return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <p>Loading...</p>
        </div>
      )
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden">
             <div className="absolute inset-0 z-0 opacity-50 bg-grid-pattern"></div>
            <div className="absolute top-4 left-4 z-10">
                <Link href="/" className="flex items-center gap-2 text-foreground">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="font-bold font-headline text-lg">EduConnect Pro</span>
                </Link>
            </div>
            <Card className="w-full max-w-md z-10 shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Create your Account</CardTitle>
                    <CardDescription>Join the platform to connect and learn.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>I am a...</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="student">Student</SelectItem>
                                                <SelectItem value="teacher">Teacher</SelectItem>
                                                <SelectItem value="parent">Parent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="Your full name" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                            <FormField control={form.control} name="mobileNumber" render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl> <Input placeholder="Your 10-digit mobile number" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                            
                            {selectedRole === 'teacher' && (
                                <>
                                    <FormField control={form.control} name="subjects" render={({ field }) => ( <FormItem> <FormLabel>Subject(s)</FormLabel> <FormControl> <Input placeholder="e.g., Physics, Mathematics" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                                    <FormField control={form.control} name="className" render={({ field }) => ( <FormItem> <FormLabel>Class / Coaching Name</FormLabel> <FormControl> <Input placeholder="e.g., Vision Classes" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                                </>
                            )}
                            
                            {selectedRole === 'student' && (
                                <FormField control={form.control} name="teacherId" render={({ field }) => ( <FormItem> <FormLabel>Teacher Code (Optional)</FormLabel> <FormControl> <Input placeholder="Enter teacher's code to enroll" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                            )}
                            
                            {selectedRole === 'parent' && (
                                <FormField control={form.control} name="studentId" render={({ field }) => ( <FormItem> <FormLabel>Your Child's Student ID</FormLabel> <FormControl> <Input placeholder="Enter your child's unique ID" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                            )}

                            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl> <Input type="password" placeholder="Choose a strong password" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />

                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
                            </Button>
                        </form>
                    </Form>
                     <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Login
                        </Link>
                     </p>
                </CardContent>
            </Card>
        </div>
    );
}
