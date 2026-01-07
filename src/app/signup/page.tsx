
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const baseSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobileNumber: z.string().length(10, { message: 'Please enter a valid 10-digit mobile number.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
});

const teacherSchema = baseSchema.extend({
  subjects: z.string().min(2, { message: 'Please enter at least one subject.'}),
  className: z.string().min(2, { message: 'Please enter your class or coaching name.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const studentSchema = baseSchema.extend({
  teacherId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

const parentSchema = baseSchema.extend({
    studentId: z.string().min(1, { message: 'Student ID is required.' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type Role = 'student' | 'teacher' | 'parent';

// Abstracted Form for Teacher
function TeacherSignUpForm({ onSignUp, isSubmitting }: { onSignUp: (values: z.infer<typeof teacherSchema>) => void; isSubmitting: boolean; }) {
  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: '', mobileNumber: '', password: '', confirmPassword: '', subjects: '', className: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="mobileNumber" render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl> <Input placeholder="9876543210" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="subjects" render={({ field }) => ( <FormItem> <FormLabel>Subject(s)</FormLabel> <FormControl> <Input placeholder="e.g., Physics, Mathematics" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="className" render={({ field }) => ( <FormItem> <FormLabel>Class / Coaching Name</FormLabel> <FormControl> <Input placeholder="e.g., Vision Classes" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirm Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <Button type="submit" className="w-full" disabled={isSubmitting}> {isSubmitting ? "Creating Account..." : "Create Teacher Account"} </Button>
      </form>
    </Form>
  );
}

// Abstracted Form for Student
function StudentSignUpForm({ onSignUp, isSubmitting }: { onSignUp: (values: z.infer<typeof studentSchema>) => void; isSubmitting: boolean; }) {
    const form = useForm<z.infer<typeof studentSchema>>({
      resolver: zodResolver(studentSchema),
      defaultValues: { name: '', mobileNumber: '', password: '', confirmPassword: '', teacherId: '' },
    });
  
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="Jane Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="mobileNumber" render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl> <Input placeholder="9876543210" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="teacherId" render={({ field }) => ( <FormItem> <FormLabel>Teacher Code (Optional)</FormLabel> <FormControl> <Input placeholder="Enter code (e.g., TCH-xxxx)" {...field} /> </FormControl> <FormDescription> If you have a teacher's code, enter it here to send an enrollment request. </FormDescription> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirm Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <Button type="submit" className="w-full" disabled={isSubmitting}> {isSubmitting ? "Creating Account..." : "Create Student Account"} </Button>
        </form>
      </Form>
    );
}

// Abstracted Form for Parent
function ParentSignUpForm({ onSignUp, isSubmitting }: { onSignUp: (values: z.infer<typeof parentSchema>) => void; isSubmitting: boolean; }) {
    const form = useForm<z.infer<typeof parentSchema>>({
      resolver: zodResolver(parentSchema),
      defaultValues: { name: '', mobileNumber: '', password: '', confirmPassword: '', studentId: '' },
    });
  
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="John Smith" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="mobileNumber" render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl> <Input placeholder="9876543210" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="studentId" render={({ field }) => ( <FormItem> <FormLabel>Your Child's Student ID</FormLabel> <FormControl> <Input placeholder="Enter your child's unique ID" {...field} /> </FormControl> <FormDescription>You can get this ID from your child's school or teacher.</FormDescription> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirm Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <Button type="submit" className="w-full" disabled={isSubmitting}> {isSubmitting ? "Creating Account..." : "Create Parent Account"} </Button>
        </form>
      </Form>
    );
}


export default function SignUpPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    
    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);
    
    const getEmailFromMobile = (mobile: string) => `${mobile}@edconnect.pro`;

    const handleSignUp = (role: Role) => async (values: any) => {
        if (!auth || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication service is not available.' });
            return;
        }

        const email = getEmailFromMobile(values.mobileNumber);
        
        try {
            // Step 1: Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
            const newUser = userCredential.user;

            // Step 2: Create user profile documents in Firestore
            const userDocRef = doc(firestore, 'users', newUser.uid);
            const userData = {
                id: newUser.uid,
                name: values.name,
                mobileNumber: values.mobileNumber,
                email: newUser.email,
                role: role,
                avatarUrl: `https://picsum.photos/seed/${newUser.uid}/100/100`,
            };
            
            await setDoc(userDocRef, userData, { merge: true });
            
            // Step 3: Create role-specific document
            if (role === 'teacher') {
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
            } else if (role === 'student') {
                const studentDocRef = doc(firestore, 'students', newUser.uid);
                await setDoc(studentDocRef, {
                    id: newUser.uid,
                    userId: newUser.uid,
                    isApproved: !values.teacherId, 
                    teacherId: values.teacherId || null,
                });
                await setDoc(userDocRef, { 
                    isApproved: !values.teacherId, 
                    teacherId: values.teacherId || null 
                }, { merge: true });
            } else if (role === 'parent') {
                // Ensure the student ID exists before creating the parent profile
                const studentUserDoc = await getDoc(doc(firestore, 'users', values.studentId));
                if (!studentUserDoc.exists() || studentUserDoc.data().role !== 'student') {
                    throw new Error("Invalid Student ID provided. Please check and try again.");
                }
                const parentDocRef = doc(firestore, 'parents', newUser.uid);
                await setDoc(parentDocRef, {
                    id: newUser.uid,
                    userId: newUser.uid,
                    studentId: values.studentId,
                    // Denormalize teacherId for easy access if available on student
                    teacherId: studentUserDoc.data().teacherId || null,
                });
            }

            toast({
                title: "Account Created!",
                description: "Your profile has been saved. You are now being logged in.",
            });
            // The onAuthStateChanged listener in the provider will handle redirection
            router.push(`/dashboard/${role}`);

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

    // Since we redirect on user, this form is only shown when no user is logged in.
    // The useForm hook's isSubmitting state can be used for each form.
    const teacherForm = useForm<z.infer<typeof teacherSchema>>({ resolver: zodResolver(teacherSchema) });
    const studentForm = useForm<z.infer<typeof studentSchema>>({ resolver: zodResolver(studentSchema) });
    const parentForm = useForm<z.infer<typeof parentSchema>>({ resolver: zodResolver(parentSchema) });
    
    // We can't easily share a single isSubmitting state without a more complex state management.
    // For this case, we check one of the forms. A more advanced solution might use a shared state.
    const isAnyFormSubmitting = teacherForm.formState.isSubmitting || studentForm.formState.isSubmitting || parentForm.formState.isSubmitting;


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
                    <CardDescription>First, tell us who you are.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="student" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="student">Student</TabsTrigger>
                            <TabsTrigger value="teacher">Teacher</TabsTrigger>
                            <TabsTrigger value="parent">Parent</TabsTrigger>
                        </TabsList>
                        <TabsContent value="student" className="pt-4">
                            <StudentSignUpForm onSignUp={handleSignUp('student')} isSubmitting={isAnyFormSubmitting} />
                        </TabsContent>
                        <TabsContent value="teacher" className="pt-4">
                             <TeacherSignUpForm onSignUp={handleSignUp('teacher')} isSubmitting={isAnyFormSubmitting} />
                        </TabsContent>
                        <TabsContent value="parent" className="pt-4">
                             <ParentSignUpForm onSignUp={handleSignUp('parent')} isSubmitting={isAnyFormSubmitting} />
                        </TabsContent>
                    </Tabs>
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
    )
}
