import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminRequestsPage() {
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; request: any; action: 'approved' | 'rejected' }>({
    open: false, request: null, action: 'approved'
  });
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: pendingRequests, isLoading: loadingPending } = useQuery({
    queryKey: ['borrow-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('*, book:books(id, title, author), student:students(id, name, student_id)')
        .eq('status', 'pending' as any)
        .order('requested_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: processedRequests, isLoading: loadingProcessed } = useQuery({
    queryKey: ['borrow-requests', 'processed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('*, book:books(id, title, author), student:students(id, name, student_id)')
        .neq('status', 'pending' as any)
        .order('reviewed_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, status, notes, bookId, studentId }: {
      requestId: string; status: string; notes: string; bookId: string; studentId: string;
    }) => {
      // Update request status
      const { error } = await supabase
        .from('borrow_requests')
        .update({
          status: status as any,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_notes: notes || null,
        })
        .eq('id', requestId);
      if (error) throw error;

      // If approved, create a borrowing record
      if (status === 'approved') {
        // Get library settings for max borrow days
        const { data: settings } = await supabase.from('library_settings').select('*');
        const maxDays = parseInt(settings?.find((s: any) => s.setting_key === 'max_borrow_days')?.setting_value || '14');

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + maxDays);

        const { error: borrowError } = await supabase.from('borrowings').insert({
          book_id: bookId,
          student_id: studentId,
          due_date: dueDate.toISOString(),
        });
        if (borrowError) throw borrowError;

        // Decrement available quantity, increment times_borrowed
        const { data: book } = await supabase
          .from('books')
          .select('available_quantity, times_borrowed')
          .eq('id', bookId)
          .single();

        if (book) {
          await supabase
            .from('books')
            .update({
              available_quantity: Math.max(0, book.available_quantity - 1),
              times_borrowed: book.times_borrowed + 1,
            })
            .eq('id', bookId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrow-requests'] });
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: `Request ${reviewDialog.action}` });
      setReviewDialog({ open: false, request: null, action: 'approved' });
      setAdminNotes('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const openReview = (request: any, action: 'approved' | 'rejected') => {
    setReviewDialog({ open: true, request, action });
    setAdminNotes('');
  };

  const handleConfirm = () => {
    const req = reviewDialog.request;
    reviewMutation.mutate({
      requestId: req.id,
      status: reviewDialog.action,
      notes: adminNotes,
      bookId: req.book_id || req.book?.id,
      studentId: req.student_id || req.student?.id,
    });
  };

  const RequestTable = ({ data, loading, showActions }: { data: any[]; loading: boolean; showActions: boolean }) => (
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header border-b border-border">
              <th className="text-left p-4 font-medium">Book</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Student</th>
              <th className="text-left p-4 font-medium">Requested</th>
              <th className="text-left p-4 font-medium">Status</th>
              {showActions && <th className="text-right p-4 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((req: any) => (
                <tr key={req.id} className="border-b border-border">
                  <td className="p-4">
                    <p className="font-medium text-foreground">{req.book?.title}</p>
                    <p className="text-sm text-muted-foreground">{req.book?.author}</p>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <p className="text-foreground">{req.student?.name}</p>
                    <p className="text-sm text-muted-foreground">{req.student?.student_id}</p>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(req.requested_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={req.status} />
                  </td>
                  {showActions && (
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => openReview(req, 'approved')} className="gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openReview(req, 'rejected')} className="gap-1">
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Borrow Requests</h1>
        <p className="text-muted-foreground">Review and manage student book requests</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingRequests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="processed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Processed
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <RequestTable data={pendingRequests || []} loading={loadingPending} showActions />
        </TabsContent>
        <TabsContent value="processed" className="mt-4">
          <RequestTable data={processedRequests || []} loading={loadingProcessed} showActions={false} />
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {reviewDialog.action === 'approved' ? 'Approve' : 'Reject'} Request
            </DialogTitle>
          </DialogHeader>
          {reviewDialog.request && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                <p className="font-medium">{reviewDialog.request.book?.title}</p>
                <p className="text-muted-foreground">
                  Requested by {reviewDialog.request.student?.name} ({reviewDialog.request.student?.student_id})
                </p>
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add a note for the student..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReviewDialog({ open: false, request: null, action: 'approved' })}>
                  Cancel
                </Button>
                <Button
                  variant={reviewDialog.action === 'approved' ? 'default' : 'destructive'}
                  onClick={handleConfirm}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? 'Processing...' : reviewDialog.action === 'approved' ? 'Approve & Issue' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    pending: { className: 'bg-warning/15 text-warning', label: 'Pending' },
    approved: { className: 'bg-success/15 text-success', label: 'Approved' },
    rejected: { className: 'bg-destructive/15 text-destructive', label: 'Rejected' },
    cancelled: { className: 'bg-muted text-muted-foreground', label: 'Cancelled' },
  };
  const c = config[status] || config.pending;
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.className}`}>{c.label}</span>;
}
