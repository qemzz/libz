import { ArrowRight, BookOpen, Users, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { BookCard } from '@/components/BookCard';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { useNewArrivals, useFeaturedBooks, usePopularBooks } from '@/hooks/useBooks';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Skeleton } from '@/components/ui/skeleton';

function BookGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card-elevated p-4">
          <Skeleton className="aspect-[2/3] rounded-lg mb-3" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data: newArrivals, isLoading: loadingNew } = useNewArrivals();
  const { data: featured, isLoading: loadingFeatured } = useFeaturedBooks();
  const { data: popular, isLoading: loadingPopular } = usePopularBooks();
  const { data: announcements } = useAnnouncements();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4 animate-fade-in">
              Discover Your Next
              <span className="text-primary"> Great Read</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 animate-fade-in">
              Explore our collection of thousands of books across all subjects and genres.
            </p>
            <SearchBar className="max-w-2xl mx-auto animate-slide-up" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
            {[
              { icon: BookOpen, label: 'Total Books', value: '100,000+' },
              { icon: Users, label: 'Active Readers', value: '200+' },
              { icon: Clock, label: 'Open Hours', value: '8AM-5PM' },
              { icon: TrendingUp, label: 'Books Borrowed', value: '60,000+' },
            ].map((stat) => (
              <div key={stat.label} className="stat-card text-center animate-scale-in">
                <stat.icon className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-container space-y-12">
        {/* Announcements */}
        {announcements && announcements.length > 0 && (
          <section className="animate-slide-up">
            <h2 className="section-title mb-4">Library Announcements</h2>
            <AnnouncementBanner announcements={announcements} />
          </section>
        )}

        {/* Featured Books */}
        {featured && featured.length > 0 && (
          <section className="animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">Featured Books</h2>
            </div>
            {loadingFeatured ? (
              <BookGridSkeleton />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {featured.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* New Arrivals */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">New Arrivals</h2>
            <Link 
              to="/new-arrivals" 
              className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingNew ? (
            <BookGridSkeleton />
          ) : newArrivals && newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.slice(0, 4).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No new arrivals yet. Check back soon!</p>
          )}
        </section>

        {/* Popular Books */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Most Popular</h2>
            <Link 
              to="/popular" 
              className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingPopular ? (
            <BookGridSkeleton />
          ) : popular && popular.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {popular.slice(0, 4).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No popular books data yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
