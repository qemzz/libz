import { Outlet } from 'react-router-dom';
import { StudentHeader } from '@/components/StudentHeader';

export function StudentLayout() {
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main>
        <Outlet />
      </main>
      <footer className="bg-card border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} School Library Management System</p>
          <p className="mt-1">Empowering education through reading</p>
        </div>
      </footer>
    </div>
  );
}
