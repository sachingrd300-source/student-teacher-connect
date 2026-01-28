'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch, addDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Enrollment {
    studentId: string;
    studentName: string;
    teacherId: string;
    batchId: string;
}

interface Test {
    id: string;
    title: string;
    maxMarks: number;
}

interface TestResult {
    id: string;
    studentId: string;
    marksObtained: number;
}

interface TestMarksDialogProps {
    isOpen: boolean;
    onClose: () => void;
    test: Test | null;
    students: Enrollment[];
}

type MarksState = {
    [studentId: string]: {
        marks: string;
        resultId?: string; 
    };
};

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

export function TestMarksDialog({ isOpen, onClose, test, students }: TestMarksDialogProps) {
    const firestore = useFirestore();
    const [marks, setMarks] = useState<MarksState>({});
    const [isSaving, setIsSaving] = useState(false);

    const testResultsQuery = useMemoFirebase(() => {
        if (!firestore || !test) return null;
        return query(collection(firestore, 'testResults'), where('testId', '==', test.id));
    }, [firestore, test]);

    const { data: existingResults, isLoading: resultsLoading } = useCollection<TestResult>(testResultsQuery);

    useEffect(() => {
        if (existingResults) {
            const initialMarks: MarksState = {};
            existingResults.forEach(result => {
                initialMarks[result.studentId] = {
                    marks: String(result.marksObtained),
                    resultId: result.id,
                };
            });
            setMarks(initialMarks);
        }
    }, [existingResults]);

    const handleMarksChange = (studentId: string, value: string) => {
        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                marks: value,
            },
        }));
    };

    const handleSaveMarks = async () => {
        if (!firestore || !test || students.length === 0) return;
        setIsSaving(true);

        const batch = writeBatch(firestore);

        for (const student of students) {
            const studentId = student.studentId;
            const markData = marks[studentId];
            
            // Continue if no marks entered or if marks are not a valid number string
            if (!markData || markData.marks.trim() === '' || isNaN(Number(markData.marks))) {
                continue;
            }

            const marksObtained = Number(markData.marks);

            if (markData.resultId) {
                // Update existing result
                const resultRef = doc(firestore, 'testResults', markData.resultId);
                batch.update(resultRef, { marksObtained });
            } else {
                // Create new result
                const newResultRef = doc(collection(firestore, 'testResults'));
                batch.set(newResultRef, {
                    testId: test.id,
                    studentId: student.studentId,
                    studentName: student.studentName,
                    batchId: student.batchId,
                    teacherId: student.teacherId,
                    marksObtained,
                    uploadedAt: new Date().toISOString(),
                });
            }
        }

        try {
            await batch.commit();

            // After saving marks, create an announcement
            const batchId = students[0].batchId; // All students are from the same batch
            const activityColRef = collection(firestore, 'batches', batchId, 'activity');
            await addDoc(activityColRef, {
                message: `Marks for the test "${test.title}" have been uploaded.`,
                createdAt: new Date().toISOString(),
            });

            onClose();
        } catch (error) {
            console.error("Error saving marks:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!test) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Manage Marks for "{test.title}"</DialogTitle>
                    <DialogDescription>
                        Enter the marks obtained by each student. Maximum marks: {test.maxMarks}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {resultsLoading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {students.map(student => (
                                <div key={student.studentId} className="flex items-center justify-between p-2 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback>{getInitials(student.studentName)}</AvatarFallback>
                                        </Avatar>
                                        <Label htmlFor={`marks-${student.studentId}`} className="font-medium">{student.studentName}</Label>
                                    </div>
                                    <Input
                                        id={`marks-${student.studentId}`}
                                        type="number"
                                        placeholder="Marks"
                                        className="w-24"
                                        value={marks[student.studentId]?.marks || ''}
                                        onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                                        max={test.maxMarks}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSaveMarks} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Marks
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
