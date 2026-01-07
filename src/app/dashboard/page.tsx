import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';

const roles = [
    {
        name: 'Teacher',
        icon: <User className="h-8 w-8 text-primary" />,
        description: 'Manage students, materials, and schedules.',
        href: '/dashboard/teacher'
    },
    {
        name: 'Student',
        icon: <BookOpenCheck className="h-8 w-8 text-primary" />,
        description: 'Access your materials, grades, and schedule.',
        href: '/dashboard/student'
    }
]

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-grid-pattern">
        <div className="container max-w-4xl space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">Select Your Dashboard</h1>
                <p className="text-muted-foreground mt-2">Choose your role to view the corresponding dashboard experience.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {roles.map(role => (
                    <Card key={role.name} className="text-center hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="items-center">
                            {role.icon}
                            <CardTitle className="mt-4 font-headline">{role.name}</CardTitle>
                        </CardHeader>
                        <CardDescription>{role.description}</CardDescription>
                        <CardFooter className="mt-4">
                             <Button asChild className="w-full">
                                <Link href={role.href}>View Dashboard</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}
