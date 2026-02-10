import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-warning/15 text-warning' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'bg-success/15 text-success' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'bg-destructive/15 text-destructive' },
  cancelled: { icon: Ban, label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
};

export default function MyRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-borrow-requests', studentRecord?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('*, book:books(id, title, author, cover_url)')
        .eq('student_id', studentRecord!.id)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studentRecord,
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('borrow_requests')
        .update({ status: 'cancelled' as any })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-borrow-requests'] });
      toast({ title: 'Request cancelled' });
    },
  });

  if (authLoading) return null;
  if (!user) return <Navigate to="/student/login" replace />;

  return (
    <div className="page-container">
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">My Borrow Requests</h1>
      <p className="text-muted-foreground mb-6">Track the status of your book requests</p>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req: any) => {
            const status = statusConfig[req.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            return (
              <div key={req.id} className="card-elevated p-4 flex items-center gap-4">
                <div className="w-12 h-16 flex-shrink-0 bg-secondary rounded overflow-hidden">
                  {req.book?.cover_url ? (
                    <img src={req.book.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/books/${req.book?.id}`} className="font-medium text-foreground hover:text-primary truncate block">
                    {req.book?.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{req.book?.author}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested {new Date(req.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                  {req.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelMutation.mutate(req.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {req.admin_notes && req.status !== 'pending' && (
                  <p className="text-sm text-muted-foreground italic">Note: {req.admin_notes}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No requests yet</h3>
          <p className="text-muted-foreground mb-4">Browse books and request to borrow them!</p>
          <Link to="/search">
            <Button>Browse Books</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
