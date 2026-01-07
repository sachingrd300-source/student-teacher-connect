
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useEffect } from 'react';

const baseSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
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
  teacherCode: z.string().optional(),
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

function TeacherSignUpForm({ onSignUp }: { onSignUp: (values: z.infer<typeof teacherSchema>) => void; }) {
  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: '', mobileNumber: '', password: '', confirmPassword: '', subjects: '', className: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="mobileNumber" render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl> <Input placeholder="9876543210" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField
          control={form.control}
          name="subjects"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject(s)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Physics, Mathematics" {...field} />
              </FormControl>
              <FormDescription>
                Enter the subjects you teach, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="className"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class / Coaching Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Vision Classes" {...field} />
              </FormControl>
              <FormDescription>
                Enter the name of your institution.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirm Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <Button type="submit" className="w-full"> Create Teacher Account </Button>
      </form>
    </Form>
  );
}

function StudentSignUpForm({ onSignUp }: { onSignUp: (values: z.infer<typeof studentSchema>) => void; }) {
    const form = useForm<z.infer<typeof studentSchema>>({
      resolver: zodResolver(studentSchema),
      defaultValues: { name: '', mobileNumber: '', password: '', confirmPassword: '', teacherCode: '' },
    });
  
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="mobileNumber" render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl> <Input placeholder="9876543210" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField
              control={form.control}
              name="teacherCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter code if you have one" {...field} />
                  </FormControl>
                  <FormDescription>
                    If you are not studying with a specific teacher, you can leave this field blank.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirm Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <Button type="submit" className="w-full"> Create Student Account </Button>
        </form>
      </Form>
    );
}

function ParentSignUpForm({ onSignUp }: { onSignUp: (values: z.infer<typeof parentSchema>) => void; }) {
    const form = useForm<z.infer<typeof parentSchema>>({
      resolver: zodResolver(parentSchema),
      defaultValues: { name: '', mobileNumber: '', password: '', confirmPassword: '', studentId: '' },
    });
  
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="Jane Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="mobileNumber" render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl> <Input placeholder="9876543210" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="studentId" render={({ field }) => ( <FormItem> <FormLabel>Your Child's Student ID</FormLabel> <FormControl> <Input placeholder="Enter your child's unique ID" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirm Password</FormLabel> <FormControl> <Input type="password" placeholder="********" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
            <Button type="submit" className="w-full"> Create Parent Account </Button>
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
    
    // Store role and form values temporarily
    useEffect(() => {
        if (user && firestore) {
            const signupData = localStorage.getItem('signup_data');
            if (signupData) {
                const { role, values } = JSON.parse(signupData);
                
                const commonData = {
                    id: user.uid,
                    name: values.name,
                    mobileNumber: values.mobileNumber,
                    email: user.email,
                    role: role,
                };
                
                // Create user profile document
                const userDocRef = doc(firestore, 'users', user.uid);
                setDocumentNonBlocking(userDocRef, commonData, { merge: true });

                // Create role-specific document
                let roleDocRef;
                let roleData;

                if (role === 'teacher') {
                    const teacherId = `TCH-${uuidv4().slice(0,4)}`;
                    roleDocRef = doc(firestore, 'teachers', teacherId);
                    roleData = {
                        id: teacherId,
                        userId: user.uid,
                        verificationCode: teacherId,
                        subjects: values.subjects,
                        className: values.className,
                    };
                } else if (role === 'student') {
                    const studentId = `STU-${uuidv4().slice(0,4)}`;
                    roleDocRef = doc(firestore, 'students', studentId);
                    roleData = {
                        id: studentId,
                        userId: user.uid,
                        isApproved: !values.teacherCode,
                        teacherId: values.teacherCode || null,
                    };
                } else if (role === 'parent') {
                    const parentId = `PAR-${uuidv4().slice(0,4)}`;
                    roleDocRef = doc(firestore, 'parents', parentId);
                    roleData = {
                        id: parentId,
                        userId: user.uid,
                        studentId: values.studentId,
                    };
                }
                
                if(roleDocRef && roleData){
                    setDocumentNonBlocking(roleDocRef, roleData, { merge: true });
                }

                localStorage.removeItem('signup_data');
                toast({
                    title: "Account Created!",
                    description: "Your profile has been saved.",
                });
                router.push(`/dashboard/${role}`);
            }
        }
    }, [user, firestore, router, toast]);

    const getEmailFromMobile = (mobile: string) => `${mobile}@edconnect.pro`;

    const handleSignUp = (role: Role) => async (values: any) => {
        if (!auth) {
            toast({ variant: 'destructive', title: 'Firebase not initialized' });
            return;
        }

        const email = getEmailFromMobile(values.mobileNumber);
        
        // Store form data in local storage to be retrieved after auth redirect
        localStorage.setItem('signup_data', JSON.stringify({ role, values }));

        initiateEmailSignUp(auth, email, values.password);
        
        toast({
            title: "Creating Account...",
            description: "Please wait while we set up your account.",
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="absolute top-4 left-4">
                <Link href="/" className="flex items-center gap-2 text-foreground">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="font-bold font-headline text-lg">EduConnect Pro</span>
                </Link>
            </div>
            <Card className="w-full max-w-md">
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
                        <TabsContent value="student">
                            <StudentSignUpForm onSignUp={handleSignUp('student')} />
                        </TabsContent>
                        <TabsContent value="teacher">
                             <TeacherSignUpForm onSignUp={handleSignUp('teacher')} />
                        </TabsContent>
                        <TabsContent value="parent">
                             <ParentSignUpForm onSignUp={handleSignUp('parent')} />
                        </TabsContent>
                    </Tabs>
                     <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/dashboard/student"
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

    