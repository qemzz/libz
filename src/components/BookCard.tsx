import { Book } from 'lucide-react';
import type { Book as BookType, Category } from '@/lib/supabase-types';
import { Link } from 'react-router-dom';

interface BookCardProps {
  book: BookType & { category: Category | null };
}

export function BookCard({ book }: BookCardProps) {
  const isAvailable = book.available_quantity > 0;

  return (
    <Link 
      to={`/books/${book.id}`}
      className="group card-elevated p-4 flex flex-col gap-3"
    >
      <div className="book-cover relative">
        {book.cover_url ? (
          <img 
            src={book.cover_url} 
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Book className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        {book.is_new_arrival && (
          <span className="badge-new absolute top-2 right-2">New</span>
        )}
      </div>
      
      <div className="flex-1 flex flex-col gap-1">
        <h3 className="font-serif font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-sm text-muted-foreground">{book.author}</p>
        {book.category && (
          <p className="text-xs text-muted-foreground">{book.category.name}</p>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className={isAvailable ? 'badge-available' : 'badge-unavailable'}>
          {isAvailable ? `${book.available_quantity} available` : 'Unavailable'}
        </span>
      </div>
    </Link>
  );
}
