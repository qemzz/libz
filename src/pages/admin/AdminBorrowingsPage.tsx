import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Calculator, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Borrowing, Book, Student } from '@/lib/supabase-types';

export default function AdminBorrowingsPage() {
  const [search, setSearch] = useState('');
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [fineCalculatorOpen, setFineCalculatorOpen] = useState(false);
  const [selectedBorrowing, setSelectedBorrowing] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: activeBorrowings, isLoading: loadingActive } = useQuery({
    queryKey: ['borrowings', 'active', search],
    queryFn: async () => {
      let query = supabase
        .from('borrowings')
        .select('*, book:books(id, title, author), student:students(id, name, student_id)')
        .is('returned_at', null);
      
      const { data, error } = await query.order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: returnedBorrowings, isLoading: loadingReturned } = useQuery({
    queryKey: ['borrowings', 'returned', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrowings')
        .select('*, book:books(id, title, author), student:students(id, name, student_id)')
        .not('returned_at', 'is', null)
        .order('returned_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['library-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('library_settings').select('*');
      if (error) throw error;
      return data.reduce((acc, s) => ({ ...acc, [s.setting_key]: s.setting_value }), {} as Record<string, string>);
    },
  });

  const returnMutation = useMutation({
    mutationFn: async ({ borrowingId, fineAmount }: { borrowingId: string; fineAmount: number }) => {
      // Get borrowing details first
      const { data: borrowing, error: fetchError } = await supabase
        .from('borrowings')
        .select('book_id')
        .eq('id', borrowingId)
        .single();
      
      if (fetchError) throw fetchError;

      // Update borrowing
      const { error: updateError } = await supabase
        .from('borrowings')
        .update({ 
          returned_at: new Date().toISOString(),
          fine_amount: fineAmount,
        })
        .eq('id', borrowingId);
      
      if (updateError) throw updateError;

      // Increment available quantity
      const { data: book } = await supabase
        .from('books')
        .select('available_quantity')
        .eq('id', borrowing.book_id)
        .single();
      
      if (book) {
        await supabase
          .from('books')
          .update({ available_quantity: book.available_quantity + 1 })
          .eq('id', borrowing.book_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: 'Book returned successfully' });
      setFineCalculatorOpen(false);
      setSelectedBorrowing(null);
    },
    onError: (error) => {
      toast({ title: 'Error returning book', description: error.message, variant: 'destructive' });
    },
  });

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const getDaysOverdue = (dueDate: string) => {
    const diff = Date.now() - new Date(dueDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateFine = (dueDate: string) => {
    const daysOverdue = getDaysOverdue(dueDate);
    const finePerDay = parseFloat(settings?.fine_per_day || '0.50');
    return (daysOverdue * finePerDay).toFixed(2);
  };

  const handleReturn = (borrowing: any) => {
    if (isOverdue(borrowing.due_date)) {
      setSelectedBorrowing(borrowing);
      setFineCalculatorOpen(true);
    } else {
      returnMutation.mutate({ borrowingId: borrowing.id, fineAmount: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Borrowings</h1>
          <p className="text-muted-foreground">Issue and return books</p>
        </div>
        <Button onClick={() => setIsIssueDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Issue Book
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Active ({activeBorrowings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="returned" className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Returned
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header border-b border-border">
                    <th className="text-left p-4 font-medium">Book</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Student</th>
                    <th className="text-left p-4 font-medium">Due Date</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingActive ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}><td colSpan={4} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                    ))
                  ) : activeBorrowings && activeBorrowings.length > 0 ? (
                    activeBorrowings.map((b: any) => {
                      const overdue = isOverdue(b.due_date);
                      const daysOverdue = getDaysOverdue(b.due_date);
                      return (
                        <tr key={b.id} className={`border-b border-border ${overdue ? 'bg-destructive/5' : ''}`}>
                          <td className="p-4">
                            <p className="font-medium text-foreground">{b.book?.title}</p>
                            <p className="text-sm text-muted-foreground">{b.book?.author}</p>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <p className="text-foreground">{b.student?.name}</p>
                            <p className="text-sm text-muted-foreground">{b.student?.student_id}</p>
                          </td>
                          <td className="p-4">
                            <p className={overdue ? 'text-destructive font-medium' : 'text-foreground'}>
                              {new Date(b.due_date).toLocaleDateString()}
                            </p>
                            {overdue && (
                              <span className="badge-overdue mt-1 inline-flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {daysOverdue} days overdue
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <Button 
                              size="sm" 
                              variant={overdue ? 'destructive' : 'default'}
                              onClick={() => handleReturn(b)}
                            >
                              Return
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No active borrowings
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="returned" className="mt-4">
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header border-b border-border">
                    <th className="text-left p-4 font-medium">Book</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Student</th>
                    <th className="text-left p-4 font-medium">Returned</th>
                    <th className="text-left p-4 font-medium">Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingReturned ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}><td colSpan={4} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                    ))
                  ) : returnedBorrowings && returnedBorrowings.length > 0 ? (
                    returnedBorrowings.map((b: any) => (
                      <tr key={b.id} className="border-b border-border">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{b.book?.title}</p>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-muted-foreground">
                          {b.student?.name}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(b.returned_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {b.fine_amount > 0 ? (
                            <span className="text-destructive font-medium">${b.fine_amount}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No returned books
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Issue Book Dialog */}
      <IssueBookDialog 
        open={isIssueDialogOpen} 
        onOpenChange={setIsIssueDialogOpen} 
        maxDays={parseInt(settings?.max_borrow_days || '14')}
      />

      {/* Fine Calculator Dialog */}
      <Dialog open={fineCalculatorOpen} onOpenChange={setFineCalculatorOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Fine Calculator
            </DialogTitle>
          </DialogHeader>
          {selectedBorrowing && (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="font-medium text-destructive">
                  {getDaysOverdue(selectedBorrowing.due_date)} days overdue
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Due: {new Date(selectedBorrowing.due_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span>Total Fine:</span>
                <span className="font-bold text-destructive">
                  ${calculateFine(selectedBorrowing.due_date)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Rate: ${settings?.fine_per_day || '0.50'}/day
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFineCalculatorOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => returnMutation.mutate({
                    borrowingId: selectedBorrowing.id,
                    fineAmount: parseFloat(calculateFine(selectedBorrowing.due_date))
                  })}
                  disabled={returnMutation.isPending}
                >
                  Confirm Return
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IssueBookDialog({ 
  open, 
  onOpenChange,
  maxDays
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  maxDays: number;
}) {
  const [bookId, setBookId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [daysToReturn, setDaysToReturn] = useState(maxDays);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: availableBooks } = useQuery({
    queryKey: ['available-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, available_quantity')
        .gt('available_quantity', 0)
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

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

  const issueMutation = useMutation({
    mutationFn: async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysToReturn);

      // Create borrowing
      const { error: borrowError } = await supabase.from('borrowings').insert({
        book_id: bookId,
        student_id: studentId,
        due_date: dueDate.toISOString(),
      });
      if (borrowError) throw borrowError;

      // Decrement available quantity and increment times_borrowed
      const { data: book } = await supabase
        .from('books')
        .select('available_quantity, times_borrowed')
        .eq('id', bookId)
        .single();
      
      if (book) {
        await supabase
          .from('books')
          .update({ 
            available_quantity: book.available_quantity - 1,
            times_borrowed: book.times_borrowed + 1
          })
          .eq('id', bookId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['available-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: 'Book issued successfully' });
      onOpenChange(false);
      setBookId('');
      setStudentId('');
    },
    onError: (error) => {
      toast({ title: 'Error issuing book', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Issue Book</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); issueMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Book *</Label>
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a book" />
              </SelectTrigger>
              <SelectContent>
                {availableBooks?.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} - {book.author} ({book.available_quantity} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Select Student *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {activeStudents?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Return in (days)</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={daysToReturn}
              onChange={(e) => setDaysToReturn(parseInt(e.target.value) || maxDays)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!bookId || !studentId || issueMutation.isPending}>
              {issueMutation.isPending ? 'Issuing...' : 'Issue Book'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
