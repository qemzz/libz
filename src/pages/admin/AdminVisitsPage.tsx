import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ClipboardList, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminVisitsPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: visits, isLoading } = useQuery({
    queryKey: ['library-visits', search],
    queryFn: async () => {
      let query = supabase
        .from('library_visits')
        .select('*, student:students(id, name, student_id, class_grade)')
        .order('visited_at', { ascending: false })
        .limit(100);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('library_visits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-visits'] });
      toast({ title: 'Visit record deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting record', description: error.message, variant: 'destructive' });
    },
  });

  const filteredVisits = visits?.filter((v: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.student?.name?.toLowerCase().includes(s) ||
      v.student?.student_id?.toLowerCase().includes(s) ||
      v.purpose?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Library Visits</h1>
          <p className="text-muted-foreground">Record and track student visits to the library</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Record Visit
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Visits Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header border-b border-border">
                <th className="text-left p-4 font-medium">Student</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Class/Grade</th>
                <th className="text-left p-4 font-medium">Visit Date</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Purpose</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Notes</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                ))
              ) : filteredVisits && filteredVisits.length > 0 ? (
                filteredVisits.map((v: any) => (
                  <tr key={v.id} className="border-b border-border">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{v.student?.name}</p>
                      <p className="text-sm text-muted-foreground">{v.student?.student_id}</p>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-muted-foreground">
                      {v.student?.class_grade || '-'}
                    </td>
                    <td className="p-4 text-foreground">
                      {new Date(v.visited_at).toLocaleDateString()}{' '}
                      <span className="text-muted-foreground text-sm">
                        {new Date(v.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">
                      {v.purpose || '-'}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                      {v.notes || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(v.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    No visit records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Visit Dialog */}
      <RecordVisitDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userId={user?.id}
      />
    </div>
  );
}

function RecordVisitDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}) {
  const [studentId, setStudentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: activeStudents } = useQuery({
    queryKey: ['active-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, student_id')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('library_visits').insert({
        student_id: studentId,
        purpose: purpose || null,
        notes: notes || null,
        recorded_by: userId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-visits'] });
      toast({ title: 'Visit recorded successfully' });
      onOpenChange(false);
      setStudentId('');
      setPurpose('');
      setNotes('');
    },
    onError: (error) => {
      toast({ title: 'Error recording visit', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Record Library Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Student *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {activeStudents?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Borrowing">Borrowing</SelectItem>
                <SelectItem value="Returning">Returning</SelectItem>
                <SelectItem value="Studying">Studying</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!studentId || saveMutation.isPending}>
              {saveMutation.isPending ? 'Recording...' : 'Record Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
