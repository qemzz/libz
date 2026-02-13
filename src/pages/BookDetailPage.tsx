import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Book, Calendar, Tag, Hash, SendHorizontal, Clock, BookOpen, MapPin, Library } from 'lucide-react';
import { useBook, useBooks } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDeweyClassName, getShelfLocation } from '@/lib/dewey-classification';
import { BookCard } from '@/components/BookCard';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading, error } = useBook(id || '');
  const { user, isStudent, studentInfo } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if student already has a pending request for this book
  const { data: existingRequest } = useQuery({
    queryKey: ['my-request-for-book', id, studentInfo?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('id, status')
        .eq('student_id', studentInfo!.id)
        .eq('book_id', id!)
        .eq('status', 'pending' as any)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentInfo && !!id,
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('borrow_requests').insert({
        student_id: studentInfo!.id,
        book_id: id!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-request-for-book', id] });
      queryClient.invalidateQueries({ queryKey: ['my-borrow-requests'] });
      toast({ title: 'Request submitted!', description: 'The librarian will review your request.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-80 aspect-[2/3] rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="page-container text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">Book Not Found</h2>
        <p className="text-muted-foreground mb-6">The book you're looking for doesn't exist or has been removed.</p>
        <Link to="/search">
          <Button>Browse Books</Button>
        </Link>
      </div>
    );
  }

  const isAvailable = book.available_quantity > 0;
  const hasDigitalVersion = !!book.file_url;

  // Fetch books in same Dewey range for recommendations
  const deweyBase = book.dewey_number ? book.dewey_number.substring(0, 1) : null;
  const { data: relatedBooks } = useQuery({
    queryKey: ['books-dewey-related', deweyBase, book.id],
    queryFn: async () => {
      if (!deweyBase) return [];
      const rangeStart = `${deweyBase}00`;
      const rangeEnd = `${deweyBase}99`;
      const { data, error } = await supabase
        .from('books')
        .select('*, category:categories(*)')
        .gte('dewey_number', rangeStart)
        .lte('dewey_number', rangeEnd + '.999')
        .neq('id', book.id)
        .order('dewey_number')
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!deweyBase,
  });

  return (
    <div className="page-container">
      <Link 
        to="/search" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Browse
      </Link>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Book Cover */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="book-cover relative">
            {book.cover_url ? (
              <img 
                src={book.cover_url} 
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <Book className="w-20 h-20 text-muted-foreground" />
              </div>
            )}
            {book.is_new_arrival && (
              <span className="badge-new absolute top-4 right-4">New Arrival</span>
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
            {book.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>

          <div className="flex flex-wrap gap-4 mb-6">
            <span className={`text-lg font-medium ${isAvailable ? 'text-success' : 'text-destructive'}`}>
              {isAvailable ? `${book.available_quantity} of ${book.quantity} available` : 'Currently Unavailable'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {book.isbn && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Hash className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">ISBN</p>
                  <p className="text-foreground font-medium">{book.isbn}</p>
                </div>
              </div>
            )}
            {book.category && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Tag className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">Category</p>
                  <p className="text-foreground font-medium">{book.category.name}</p>
                </div>
              </div>
            )}
            {book.dewey_number && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Library className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">Dewey Decimal</p>
                  <p className="text-foreground font-medium">{book.dewey_number}</p>
                  <p className="text-xs text-muted-foreground">{getDeweyClassName(book.dewey_number)}</p>
                </div>
              </div>
            )}
            {book.dewey_number && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">Shelf Location</p>
                  <p className="text-foreground font-medium">{book.shelf_location || getShelfLocation(book.dewey_number)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <div>
                <p className="text-xs uppercase tracking-wide">Added</p>
                <p className="text-foreground font-medium">
                  {new Date(book.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Book className="h-5 w-5" />
              <div>
                <p className="text-xs uppercase tracking-wide">Times Borrowed</p>
                <p className="text-foreground font-medium">{book.times_borrowed}</p>
              </div>
            </div>
          </div>

          {book.description && (
            <div>
              <h2 className="text-xl font-serif font-semibold text-foreground mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {book.description}
              </p>
            </div>
          )}

          {/* Read Online Button */}
          {hasDigitalVersion && (
            <div className="mt-6">
              <Link to={`/books/${id}/read`}>
                <Button variant="outline" size="lg" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Read Online
                </Button>
              </Link>
            </div>
          )}

          {/* Borrow Request Section */}
          <div className="mt-8">
            {isStudent && isAvailable ? (
              existingRequest ? (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-3">
                  <Clock className="h-5 w-5 text-warning flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    You already have a pending request for this book. Check your{' '}
                    <Link to="/student/my-requests" className="text-primary font-medium hover:underline">requests</Link>.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={() => requestMutation.mutate()}
                  disabled={requestMutation.isPending}
                  className="gap-2"
                  size="lg"
                >
                  <SendHorizontal className="h-4 w-4" />
                  {requestMutation.isPending ? 'Submitting...' : 'Request to Borrow'}
                </Button>
              )
            ) : !user ? (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  📚{' '}
                  <Link to="/student/login" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>{' '}
                  to request this book online, or visit the library with your student ID card.
                </p>
              </div>
            ) : !isStudent ? (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  📚 To borrow this book, please visit the library with your student ID card.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  📚 This book is currently unavailable. Check back later!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Books in Same Dewey Range */}
      {relatedBooks && relatedBooks.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
            Related Books {book.dewey_number && <span className="text-base font-normal text-muted-foreground">({getDeweyClassName(book.dewey_number)})</span>}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedBooks.map((b: any) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
