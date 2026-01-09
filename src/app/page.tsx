'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Shield, GraduationCap } from 'lucide-react';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<string>('student');
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole === 'tutor') {
      router.push('/login');
    } else if (selectedRole === 'student') {
        router.push('/dashboard/student');
    }
     else if (selectedRole === 'parent') {
        router.push('/dashboard/parent');
    }
     else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-grid-pattern">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Choose Your Role</CardTitle>
          <CardDescription>Select your role to get started with EduConnect Pro.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-1 gap-4">
            <Label htmlFor="student" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
              <RadioGroupItem value="student" id="student" className="sr-only" />
              <User className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Student</h3>
                <p className="text-sm text-muted-foreground">Access materials and track progress.</p>
              </div>
            </Label>
             <Label htmlFor="parent" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
              <RadioGroupItem value="parent" id="parent" className="sr-only" />
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Parent</h3>
                <p className="text-sm text-muted-foreground">Monitor your child's journey.</p>
              </div>
            </Label>
             <Label htmlFor="tutor" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
              <RadioGroupItem value="tutor" id="tutor" className="sr-only" />
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Tutor</h3>
                <p className="text-sm text-muted-foreground">Login to your dashboard.</p>
              </div>
            </Label>
          </RadioGroup>
          <Button onClick={handleContinue} className="w-full">
            Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}