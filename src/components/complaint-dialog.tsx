
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';


interface Enrollment {
    studentId: string;
    studentName: string;
}

interface UserProfile {
    mobileNumber?: string;
    parentMobileNumber?: string;
}

interface ComplaintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: Enrollment | null;
  teacherName: string | null;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

export function ComplaintDialog({ isOpen, onClose, student, teacherName }: ComplaintDialogProps) {
  const firestore = useFirestore();
  const [complaintMessage, setComplaintMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!firestore || !student || !teacherName) return;

    setIsSending(true);
    setError(null);
    
    try {
        const studentDocRef = doc(firestore, 'users', student.studentId);
        const studentSnap = await getDoc(studentDocRef);

        if (studentSnap.exists()) {
            const studentData = studentSnap.data() as UserProfile;
            const targetMobileNumber = studentData.parentMobileNumber || studentData.mobileNumber;

            if (targetMobileNumber) {
                const fullMessage = `Hello, this is a message from ${teacherName} regarding your child, ${student.studentName}:\n\n"${complaintMessage.trim()}"\n\nPlease contact us for further details.\n\nThank you,\nAchievers Community`;
                const phoneNumber = targetMobileNumber.replace(/[^0-9]/g, '');
                const formattedPhoneNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
                const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${encodeURIComponent(fullMessage)}`;
                
                window.open(whatsappUrl, '_blank');
                onClose(); // Close dialog after opening whatsapp
            } else {
                setError("This student does not have a parent's or their own mobile number saved in their profile. Please ask them to update it.");
            }
        } else {
            setError("Could not find the student's profile to get their contact number.");
        }
    } catch (err) {
        console.error(err);
        setError("An error occurred while trying to send the message. Please check the console.");
    } finally {
        setIsSending(false);
    }
  };

  // Reset state when the dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setComplaintMessage('');
      setError(null);
      onClose();
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
                <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">{getInitials(student.studentName)}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle>Send Complaint about {student.studentName}</DialogTitle>
                    <DialogDescription>
                        This message will be sent to the parent's WhatsApp number if available, otherwise to the student's.
                    </DialogDescription>
                </div>
            </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="complaint-message">Complaint Message</Label>
                <Textarea
                    id="complaint-message"
                    placeholder={`e.g., "${student.studentName} has not completed their homework for the past three days."`}
                    value={complaintMessage}
                    onChange={(e) => setComplaintMessage(e.target.value)}
                    required
                    rows={5}
                />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSend} disabled={isSending || !complaintMessage.trim()}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send on WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
