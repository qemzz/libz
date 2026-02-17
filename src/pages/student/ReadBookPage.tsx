import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useBook } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function ReadBookPage() {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading, error } = useBook(id || '');
  const { isStudent } = useAuth();

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  const fileUrl = (book as any)?.file_url;

  if (error || !book || !fileUrl) {
    return (
      <div className="page-container text-center py-16">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-4">Book Not Available for Reading</h2>
        <p className="text-muted-foreground mb-6">
          This book doesn't have a digital version available for online reading.
        </p>
        <Link to={`/books/${id}`}>
          <Button>Back to Book Details</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <Link
          to={`/books/${id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </Link>
        <h1 className="text-lg font-serif font-bold text-foreground truncate ml-4">
          {book.title}
        </h1>
      </div>

      <div className="w-full bg-card border border-border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <iframe
          src={`${fileUrl}#toolbar=1`}
          className="w-full h-full"
          title={`Read ${book.title}`}
        />
      </div>
    </div>
  );
}
