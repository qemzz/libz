import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Student Pages
import { StudentLayout } from "@/layouts/StudentLayout";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import BookDetailPage from "@/pages/BookDetailPage";
import NewArrivalsPage from "@/pages/NewArrivalsPage";
import PopularBooksPage from "@/pages/PopularBooksPage";
import NotFound from "@/pages/NotFound";

// Student Auth Pages
import StudentLoginPage from "@/pages/student/StudentLoginPage";
import StudentRegisterPage from "@/pages/student/StudentRegisterPage";
import MyRequestsPage from "@/pages/student/MyRequestsPage";

// Admin Pages
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBooksPage from "@/pages/admin/AdminBooksPage";
import AdminStudentsPage from "@/pages/admin/AdminStudentsPage";
import AdminBorrowingsPage from "@/pages/admin/AdminBorrowingsPage";
import AdminRequestsPage from "@/pages/admin/AdminRequestsPage";
import AdminAnnouncementsPage from "@/pages/admin/AdminAnnouncementsPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminActivityPage from "@/pages/admin/AdminActivityPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminVisitsPage from "@/pages/admin/AdminVisitsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Student Routes */}
              <Route element={<StudentLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/books/:id" element={<BookDetailPage />} />
                <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                <Route path="/popular" element={<PopularBooksPage />} />
                <Route path="/student/my-requests" element={<MyRequestsPage />} />
              </Route>

              {/* Student Auth Routes */}
              <Route path="/student/login" element={<StudentLoginPage />} />
              <Route path="/student/register" element={<StudentRegisterPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="books" element={<AdminBooksPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="borrowings" element={<AdminBorrowingsPage />} />
                <Route path="visits" element={<AdminVisitsPage />} />
                <Route path="requests" element={<AdminRequestsPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="activity" element={<AdminActivityPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
