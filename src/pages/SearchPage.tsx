import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { BookCard } from '@/components/BookCard';
import { useBooks, useCategories } from '@/hooks/useBooks';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { DEWEY_CLASSES } from '@/lib/dewey-classification';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const deweyParam = searchParams.get('dewey') || '';
  
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedDewey, setSelectedDewey] = useState(deweyParam);
  
  const { data: books, isLoading } = useBooks(query, selectedCategory, selectedDewey);
  const { data: categories } = useCategories();

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleDeweyChange = (deweyRange: string) => {
    setSelectedDewey(deweyRange);
    const params = new URLSearchParams(searchParams);
    if (deweyRange) {
      params.set('dewey', deweyRange);
    } else {
      params.delete('dewey');
    }
    setSearchParams(params);
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title mb-4">Browse Books</h1>
        <SearchBar className="max-w-2xl" />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleCategoryChange('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          All Categories
        </button>
        {categories?.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Dewey Decimal Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => handleDeweyChange('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !selectedDewey 
              ? 'bg-accent text-accent-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Dewey Classes
        </button>
        {DEWEY_CLASSES.map((dc) => (
          <button
            key={dc.range}
            onClick={() => handleDeweyChange(dc.range.split('–')[0])}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedDewey === dc.range.split('–')[0]
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            title={dc.shelfLocation}
          >
            {dc.range} {dc.name.split(',')[0]}
          </button>
        ))}
      </div>

      {/* Results */}
      {query && (
        <p className="text-muted-foreground mb-4">
          {isLoading ? 'Searching...' : `Found ${books?.length || 0} results for "${query}"`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
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
          <p className="text-muted-foreground">No books found. Try a different search term or category.</p>
        </div>
      )}
    </div>
  );
}
