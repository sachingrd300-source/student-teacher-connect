
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  Download,
  BookOpenCheck,
} from 'lucide-react';
import { studentData } from '@/lib/data';

const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};


export default function StudyMaterialPage() {
  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <BookOpenCheck className="w-8 h-8"/>
            Study Materials
        </h1>
        <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>All Study Materials</CardTitle>
            <CardDescription>Browse and download notes, DPPs, tests, and more.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {studentData.studyMaterials.map((material) => (
                    <TableRow key={material.id}>
                    <TableCell className="font-medium">{materialIcons[material.type]}</TableCell>
                    <TableCell>
                        <div className="font-medium">{material.title}</div>
                        <div className="text-sm text-muted-foreground">{material.date}</div>
                    </TableCell>
                    <TableCell><Badge variant={material.isNew ? "default" : "secondary"} className={material.isNew ? "bg-accent text-accent-foreground" : ""}>{material.subject}</Badge></TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
