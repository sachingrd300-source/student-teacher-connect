
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';

const loginSchema = z.object({
  mobileNumber: z.string().min(10, { message: 'Please enter a valid 10-digit mobile number.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});


export default function LoginPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { mobileNumber: '', password: '' },
    });

    useEffect(() => {
        if (user && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    toast({
                        title: `Welcome back, ${userData.name}!`,
                        description: "Redirecting to your dashboard...",
                    });
                    router.push(`/dashboard/${userData.role}`);
                } else {
                    // This case can happen if profile creation failed before.
                    // We can try to recover or guide the user. For now, we log them out.
                    toast({
                        variant: 'destructive',
                        title: 'Profile not found.',
                        description: 'Your user profile is missing. Please sign up again or contact support.',
                    });
                    signOut(auth);
                }
            });
        }
    }, [user, firestore, router, toast, auth]);

    const getEmailFromMobile = (mobile: string) => `${mobile}@edconnect.pro`;

    const handleLogin = async (values: z.infer<typeof loginSchema>) => {
        if (!auth) {
            toast({ variant: 'destructive', title: 'Firebase not initialized' });
            return;
        }

        const email = getEmailFromMobile(values.mobileNumber);
        
        try {
            await signInWithEmailAndPassword(auth, email, values.password);
            toast({
                title: "Logging In...",
                description: "Please wait while we check your credentials.",
            });
        } catch (error: any) {
            console.error("Login Error:", error);
            const errorMessage = error.code === 'auth/invalid-credential'
                ? 'Invalid mobile number or password.'
                : 'An unexpected error occurred. Please try again.';
            toast({
                variant: 'destructive',
                title: 'Login Failed',
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
                    <CardTitle className="text-2xl font-headline">Welcome Back!</CardTitle>
                    <CardDescription>Sign in to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="mobileNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your 10-digit mobile number" {...field} />
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
                                            <Input type="password" placeholder="Your password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Logging In..." : "Login"}
                            </Button>
                        </form>
                    </Form>
                     <p className="mt-6 px-8 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link
                            href="/signup"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign Up
                        </Link>
                     </p>
                </CardContent>
            </Card>
        </div>
    )
}
