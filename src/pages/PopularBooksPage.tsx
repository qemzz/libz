import { BookCard } from '@/components/BookCard';
import { usePopularBooks } from '@/hooks/useBooks';
import { Skeleton } from '@/components/ui/skeleton';

export default function PopularBooksPage() {
  const { data: books, isLoading } = usePopularBooks();

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title mb-2">Most Popular Books</h1>
        <p className="text-muted-foreground">Discover the most borrowed books by our students.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card-elevated p-4">
              <Skeleton className="aspect-[2/3] rounded-lg mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : books && books.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No popular books data yet. Start borrowing!</p>
        </div>
      )}
    </div>
  );
}
