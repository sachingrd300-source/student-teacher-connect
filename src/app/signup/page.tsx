
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { v4 as uuidv4 } from 'uuid';

// Schemas
const studentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  teacherCode: z.string().optional(),
});

const teacherSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  subjects: z.string().min(1, { message: 'Please enter at least one subject.' }),
  className: z.string().min(1, { message: 'Please enter your class/coaching name.' }),
});

const parentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  studentId: z.string().min(1, { message: 'Student ID is required.' }),
});

type Role = 'student' | 'teacher' | 'parent';

export default function SignUpPage() {
  const [activeTab, setActiveTab] = useState<Role>('student');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const studentForm = useForm<z.infer<typeof studentSchema>>({ resolver: zodResolver(studentSchema), defaultValues: { name: '', mobileNumber: '', password: '', teacherCode: '' } });
  const teacherForm = useForm<z.infer<typeof teacherSchema>>({ resolver: zodResolver(teacherSchema), defaultValues: { name: '', mobileNumber: '', password: '', subjects: '', className: '' } });
  const parentForm = useForm<z.infer<typeof parentSchema>>({ resolver: zodResolver(parentSchema), defaultValues: { name: '', mobileNumber: '', password: '', studentId: '' } });

  const getForm = (role: Role) => {
    if (role === 'student') return studentForm;
    if (role === 'teacher') return teacherForm;
    return parentForm;
  }

  async function onSubmit(values: any, role: Role) {
    setIsLoading(true);
    const { mobileNumber, password, name, ...rest } = values;
    const email = `${mobileNumber}@edconnect.pro`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 1. Create user document
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocData = {
        id: user.uid,
        name,
        email,
        mobileNumber: mobileNumber,
        role,
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
        isApproved: role === 'student' ? !rest.teacherCode : true,
        teacherId: role === 'student' ? rest.teacherCode || null : null,
      };
      setDocumentNonBlocking(userDocRef, userDocData, { merge: false });
      
      // 2. Create role-specific document
      if (role === 'teacher') {
        const verificationCode = `TCH-${uuidv4().slice(0, 4).toUpperCase()}`;
        const teacherDocRef = doc(firestore, 'teachers', verificationCode);
        setDocumentNonBlocking(teacherDocRef, {
            id: verificationCode,
            userId: user.uid,
            verificationCode,
            subjects: rest.subjects,
            className: rest.className,
            experience: 'Not set',
            address: 'Not set',
        }, { merge: false });
      } else if (role === 'student') {
        const studentDocRef = doc(firestore, 'students', user.uid);
        setDocumentNonBlocking(studentDocRef, {
            id: user.uid,
            userId: user.uid,
            teacherId: rest.teacherCode || null,
            isApproved: !rest.teacherCode,
            batch: null,
        }, { merge: false });
      } else if (role === 'parent') {
        const parentDocRef = doc(firestore, 'parents', user.uid);
        setDocumentNonBlocking(parentDocRef, {
            id: user.uid,
            userId: user.uid,
            studentId: rest.studentId,
        }, { merge: false });
      }

      toast({
        title: 'Account Created!',
        description: 'Redirecting you to your new dashboard.',
      });

      // Redirect to profile for teacher, dashboard for others
      if (role === 'teacher') {
        router.push(`/dashboard/teacher/profile`);
      } else {
        router.push(`/dashboard/${role}`);
      }

    } catch (error: any) {
      console.error('Signup failed:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.code === 'auth/email-already-in-use' 
          ? 'This mobile number is already linked to an account.' 
          : error.message || 'An unexpected error occurred.',
      });
    } finally {
        setIsLoading(false);
    }
  }

  const renderForm = (role: Role) => {
    const form = getForm(role);
    let schema, fields;

    if (role === 'student') {
        schema = studentSchema;
        fields = [
            { name: 'name', label: 'Full Name', placeholder: 'John Doe' },
            { name: 'mobileNumber', label: 'Mobile Number', placeholder: '9876543210' },
            { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { name: 'teacherCode', label: 'Teacher Code (Optional)', placeholder: 'TCH-XXXX' },
        ];
    } else if (role === 'teacher') {
        schema = teacherSchema;
        fields = [
            { name: 'name', label: 'Full Name', placeholder: 'Dr. Jane Smith' },
            { name: 'mobileNumber', label: 'Mobile Number', placeholder: '9876543210' },
            { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { name: 'subjects', label: 'Subjects Taught', placeholder: 'Physics, Chemistry' },
            { name: 'className', label: 'Coaching/Class Name', placeholder: 'Prestige Academy' },
        ];
    } else { // parent
        schema = parentSchema;
        fields = [
            { name: 'name', label: 'Full Name', placeholder: 'David Johnson' },
            { name: 'mobileNumber', label: 'Mobile Number', placeholder: '9876543210' },
            { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { name: 'studentId', label: "Your Child's Student ID", placeholder: 'Enter the ID provided by the school' },
        ];
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => onSubmit(values, role))} className="space-y-4">
                {fields.map(f => (
                    <FormField
                        key={f.name}
                        control={form.control}
                        name={f.name as any}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{f.label}</FormLabel>
                                <FormControl>
                                    <Input placeholder={f.placeholder} type={f.type || 'text'} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
                 <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
            </form>
        </Form>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Icons.logo className="h-7 w-7 text-primary"/>
                <CardTitle className="text-3xl font-headline">Create an Account</CardTitle>
            </div>
          <CardDescription>Join EduConnect Pro as a student, teacher, or parent.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Role)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="student">Student</TabsTrigger>
                    <TabsTrigger value="teacher">Teacher</TabsTrigger>
                    <TabsTrigger value="parent">Parent</TabsTrigger>
                </TabsList>
                <TabsContent value="student" className="pt-4">{renderForm('student')}</TabsContent>
                <TabsContent value="teacher" className="pt-4">{renderForm('teacher')}</TabsContent>
                <TabsContent value="parent" className="pt-4">{renderForm('parent')}</TabsContent>
            </Tabs>
        </CardContent>
         <div className="p-6 pt-0 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
