import { BookCard } from '@/components/BookCard';
import { useNewArrivals } from '@/hooks/useBooks';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewArrivalsPage() {
  const { data: books, isLoading } = useNewArrivals();

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title mb-2">New Arrivals</h1>
        <p className="text-muted-foreground">Check out the latest additions to our library collection.</p>
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
          <p className="text-muted-foreground">No new arrivals at the moment. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
