'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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


const formSchema = z
  .object({
    name: z.string().min(2, {
      message: 'Name must be at least 2 characters.',
    }),
    email: z.string().email({
      message: 'Please enter a valid email address.',
    }),
    password: z.string().min(8, {
      message: 'Password must be at least 8 characters.',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Role = 'student' | 'teacher' | 'parent';

function SignUpForm({ role, onSignUp }: { role: Role; onSignUp: (values: z.infer<typeof formSchema>) => void; }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSignUp)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create {role.charAt(0).toUpperCase() + role.slice(1)} Account
        </Button>
      </form>
    </Form>
  );
}


export default function SignUpPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSignUp = (role: Role) => async (values: z.infer<typeof formSchema>) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: values.name });

            // Create user document in 'users' collection
            const userDocRef = doc(firestore, "users", user.uid);
            setDocumentNonBlocking(userDocRef, {
                id: user.uid,
                role: role,
                name: values.name,
                email: values.email,
                mobileNumber: ''
            }, { merge: true });


            // Create role-specific document
            let roleCollection = '';
            let roleData: any = { userId: user.uid, id: user.uid };

            if (role === 'teacher') {
                roleCollection = 'teachers';
                roleData.verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            } else if (role === 'student') {
                roleCollection = 'students';
                roleData.isApproved = false;
            } else if (role === 'parent') {
                // For parents, we'll need a studentId. For now, we'll leave it blank.
                // This would typically be handled in a separate step, e.g., linking to a child.
                roleCollection = 'parents';
                roleData.studentId = ''; 
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
                    <CardDescription>Choose your role to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="student" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="student">Student</TabsTrigger>
                            <TabsTrigger value="teacher">Teacher</TabsTrigger>
                            <TabsTrigger value="parent">Parent</TabsTrigger>
                        </TabsList>
                        <TabsContent value="student">
                            <SignUpForm role="student" onSignUp={handleSignUp('student')} />
                        </TabsContent>
                        <TabsContent value="teacher">
                             <SignUpForm role="teacher" onSignUp={handleSignUp('teacher')} />
                        </TabsContent>
                        <TabsContent value="parent">
                             <SignUpForm role="parent" onSignUp={handleSignUp('parent')} />
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
