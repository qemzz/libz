import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Users, ArrowLeftRight, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import type { Book, Category } from '@/lib/supabase-types';

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = 'primary',
  to 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string; 
  trend?: string;
  color?: 'primary' | 'accent' | 'destructive' | 'success';
  to?: string;
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
  };

  const content = (
    <div className="stat-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <span className="text-xs text-muted-foreground">{trend}</span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [booksRes, studentsRes, borrowingsRes, overdueRes] = await Promise.all([
        supabase.from('books').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('borrowings').select('id', { count: 'exact', head: true }).is('returned_at', null),
        supabase.from('borrowings')
          .select('id', { count: 'exact', head: true })
          .is('returned_at', null)
          .lt('due_date', new Date().toISOString()),
      ]);

      return {
        totalBooks: booksRes.count || 0,
        activeStudents: studentsRes.count || 0,
        borrowedBooks: borrowingsRes.count || 0,
        overdueBooks: overdueRes.count || 0,
      };
    },
  });

  const { data: recentBorrowings } = useQuery({
    queryKey: ['recent-borrowings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrowings')
        .select(`
          *,
          book:books(id, title, author),
          student:students(id, name, student_id)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: popularBooks } = useQuery({
    queryKey: ['admin-popular-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, category:categories(*)')
        .order('times_borrowed', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as (Book & { category: Category | null })[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your library system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={BookOpen} 
          label="Total Books" 
          value={stats?.totalBooks || 0}
          color="primary"
          to="/admin/books"
        />
        <StatCard 
          icon={Users} 
          label="Active Students" 
          value={stats?.activeStudents || 0}
          color="accent"
          to="/admin/students"
        />
        <StatCard 
          icon={ArrowLeftRight} 
          label="Currently Borrowed" 
          value={stats?.borrowedBooks || 0}
          color="success"
          to="/admin/borrowings"
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Overdue Books" 
          value={stats?.overdueBooks || 0}
          color="destructive"
          to="/admin/borrowings"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Borrowings */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </h2>
            <Link to="/admin/borrowings" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          {recentBorrowings && recentBorrowings.length > 0 ? (
            <div className="space-y-3">
              {recentBorrowings.map((borrowing: any) => (
                <div key={borrowing.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {borrowing.book?.title || 'Unknown Book'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {borrowing.student?.name} ({borrowing.student?.student_id})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      borrowing.returned_at 
                        ? 'bg-success/15 text-success' 
                        : 'bg-accent/15 text-accent-foreground'
                    }`}>
                      {borrowing.returned_at ? 'Returned' : 'Borrowed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent borrowings</p>
          )}
        </div>

        {/* Popular Books */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Most Popular Books
            </h2>
            <Link to="/admin/books" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          {popularBooks && popularBooks.length > 0 ? (
            <div className="space-y-3">
              {popularBooks.map((book, index) => (
                <div key={book.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{book.times_borrowed}</p>
                    <p className="text-xs text-muted-foreground">borrows</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No books data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
