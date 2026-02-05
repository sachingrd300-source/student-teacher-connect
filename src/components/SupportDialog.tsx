'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';

interface SupportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userProfile: { name?: string | null; role?: string | null; } | null;
}

export function SupportDialog({ isOpen, onOpenChange, userProfile }: SupportDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !userProfile || !message.trim()) return;

    setIsSending(true);
    try {
      await addDoc(collection(firestore, 'supportTickets'), {
        userId: user.uid,
        userName: userProfile.name,
        userRole: userProfile.role,
        message: message.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
      });
      setIsSent(true);
      setMessage('');
      setTimeout(() => {
        onOpenChange(false);
        // Reset isSent state after the dialog closes
        setTimeout(() => setIsSent(false), 300);
      }, 2000);
    } catch (error) {
      console.error("Error creating support ticket:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Reset sent state when dialog is closed manually
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setIsSent(false), 300);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            Have a question or need help? Send a message to our support team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="support-message">Your Message</Label>
              <Textarea
                id="support-message"
                placeholder="Please describe your issue or question here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSending || isSent || !message.trim()}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSent ? 'Sent!' : <Send className="mr-2 h-4 w-4" />}
              {isSent ? 'Message Sent' : 'Send Message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
