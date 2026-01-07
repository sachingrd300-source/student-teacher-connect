'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';

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
import { useAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
        <FormField control={form.control} name="subjects" render={({ field }) => ( <FormItem> <FormLabel>Subject(s)</FormLabel> <FormControl> <Input placeholder="e.g., Physics, Mathematics" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="className" render={({ field }) => ( <FormItem> <FormLabel>Class / Coaching Name</FormLabel> <FormControl> <Input placeholder="e.g., Vision Classes" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
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
            <FormField control={form.control} name="teacherCode" render={({ field }) => ( <FormItem> <FormLabel>Teacher Code (Optional)</FormLabel> <FormControl> <Input placeholder="Enter code if you have one" {...field} /> </FormControl> <FormDescription> Not studying with a teacher? Skip this field. </FormDescription> <FormMessage /> </FormItem> )} />
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

    // A mock email is created from the mobile number for Firebase Auth compatibility.
    // In a real app, you'd use phone number authentication.
    const getEmailFromMobile = (mobile: string) => `${mobile}@edconnect.pro`;

    const handleSignUp = (role: Role) => async (values: any) => {
        try {
            const email = getEmailFromMobile(values.mobileNumber);
            const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: values.name });

            // Create user document in 'users' collection
            const userDocRef = doc(firestore, "users", user.uid);
            setDocumentNonBlocking(userDocRef, {
                id: user.uid,
                role: role,
                name: values.name,
                email: email, // Storing the mock email
                mobileNumber: values.mobileNumber
            }, { merge: true });


            // Create role-specific document
            let roleCollection = '';
            let roleData: any = { userId: user.uid, id: user.uid };

            if (role === 'teacher') {
                roleCollection = 'teachers';
                roleData.verificationCode = `TCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                roleData.subjects = values.subjects;
                roleData.className = values.className;
            } else if (role === 'student') {
                roleCollection = 'students';
                roleData.isApproved = !values.teacherCode; // Auto-approved if no teacher code
                roleData.teacherId = values.teacherCode || null;
            } else if (role === 'parent') {
                roleCollection = 'parents';
                roleData.studentId = values.studentId; 
            }
            
            if (roleCollection) {
                const roleDocRef = doc(firestore, roleCollection, user.uid);
                 setDocumentNonBlocking(roleDocRef, roleData, { merge: true });
            }

            toast({
                title: "Account Created!",
                description: "You've been successfully signed up.",
            });
            
            router.push(`/dashboard/${role}`);

        } catch (error: any) {
            console.error(`Error signing up as ${role}:`, error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: error.message || "There was a problem with your request.",
            });
        }
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
