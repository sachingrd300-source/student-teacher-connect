
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  Download,
  BookOpen,
  ShoppingCart,
  BookCopy,
} from 'lucide-react';
import { studentData, shopItemsData } from '@/lib/data';
import Image from 'next/image';
import { ConnectTeacherForm } from '@/components/connect-teacher-form';

const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};


export default function StudentDashboardPage() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectionSuccess = () => {
    setIsConnected(true);
  };
  
  const dailyPracticePapers = studentData.studyMaterials.filter(m => m.type === 'DPP');

  return (
    <div className="space-y-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Welcome back, {studentData.name}!</h1>
        {!isConnected && (
            <Card className="w-full max-w-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Connect with a Teacher</CardTitle>
                    <CardDescription className="text-sm">Enter your teacher's code to view their profile and materials.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ConnectTeacherForm onConnectionSuccess={handleConnectionSuccess} />
                </CardContent>
            </Card>
        )}
      </div>


      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials"><BookOpen className="w-4 h-4 mr-2" />Study Materials</TabsTrigger>
          <TabsTrigger value="practice"><ClipboardList className="w-4 h-4 mr-2" />Daily Practice</TabsTrigger>
          <TabsTrigger value="shop"><ShoppingCart className="w-4 h-4 mr-2" />Shop</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
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
        </TabsContent>

        <TabsContent value="practice">
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
        </TabsContent>

         <TabsContent value="shop">
          <Card>
            <CardHeader>
              <CardTitle>EduConnect Shop</CardTitle>
              <CardDescription>Browse recommended books, courses, and other educational materials.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {shopItemsData.map((item) => (
                <Card key={item.id} className="overflow-hidden flex flex-col">
                  <div className="relative h-48 w-full">
                    <Image src={item.imageUrl} alt={item.title} fill style={{objectFit: 'cover'}} />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-1"><BookCopy className="h-4 w-4" />{item.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-lg font-bold">{item.price}</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
