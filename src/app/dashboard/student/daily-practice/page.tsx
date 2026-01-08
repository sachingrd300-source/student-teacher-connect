
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
import { Download, ClipboardList } from 'lucide-react';
import { teacherData } from '@/lib/data';

export default function DailyPracticePage() {
  // Now using teacherData to simulate a connected state
  const dailyPracticePapers = teacherData.studyMaterials.filter(m => m.type === 'DPP');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <ClipboardList className="w-8 h-8"/>
        Daily Practice
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Daily Practice Papers (DPPs)</CardTitle>
          <CardDescription>Stay sharp with these daily exercises from your teacher.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyPracticePapers.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell>
                      <div className="font-medium">{paper.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{paper.subject}</Badge>
                    </TableCell>
                    <TableCell>{paper.date}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {dailyPracticePapers.length === 0 && <p className="text-center text-muted-foreground py-8">No practice papers available yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
