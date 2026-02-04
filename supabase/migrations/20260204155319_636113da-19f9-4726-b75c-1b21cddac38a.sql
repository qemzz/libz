-- Create role enum for admin users
CREATE TYPE public.app_role AS ENUM ('admin', 'librarian');

-- Categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Books table
CREATE TABLE public.books (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE,
    description TEXT,
    cover_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    available_quantity INTEGER NOT NULL DEFAULT 1,
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    times_borrowed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Students table (registered library members)
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    class_grade TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Borrowings table
CREATE TABLE public.borrowings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    borrowed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    fine_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table for admin authentication
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Activity log for admin actions
CREATE TABLE public.activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Library settings (for fine rate, etc.)
CREATE TABLE public.library_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.library_settings (setting_key, setting_value) VALUES
    ('fine_per_day', '0.50'),
    ('max_borrow_days', '14'),
    ('max_books_per_student', '3');

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
    ('Fiction', 'Novels and fictional stories'),
    ('Non-Fiction', 'Educational and factual books'),
    ('Science', 'Science and technology books'),
    ('History', 'Historical books and biographies'),
    ('Literature', 'Classic literature and poetry'),
    ('Reference', 'Dictionaries, encyclopedias, and reference materials');

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin or librarian
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'librarian')
  )
$$;

-- PUBLIC READ policies for student-facing website
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT USING (is_active = true);

-- ADMIN policies for categories
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.is_admin());

-- ADMIN policies for books
CREATE POLICY "Admins can insert books" ON public.books FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update books" ON public.books FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete books" ON public.books FOR DELETE USING (public.is_admin());

-- ADMIN policies for students
CREATE POLICY "Admins can view students" ON public.students FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert students" ON public.students FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update students" ON public.students FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete students" ON public.students FOR DELETE USING (public.is_admin());

-- ADMIN policies for borrowings
CREATE POLICY "Admins can view borrowings" ON public.borrowings FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert borrowings" ON public.borrowings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update borrowings" ON public.borrowings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete borrowings" ON public.borrowings FOR DELETE USING (public.is_admin());

-- ADMIN policies for announcements (full access)
CREATE POLICY "Admins can view all announcements" ON public.announcements FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (public.is_admin());

-- User roles policies
CREATE POLICY "Admins can view user roles" ON public.user_roles FOR SELECT USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "Only superadmins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Activity logs policies
CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (public.is_admin());

-- Library settings policies
CREATE POLICY "Anyone can view settings" ON public.library_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.library_settings FOR UPDATE USING (public.is_admin());

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_library_settings_updated_at BEFORE UPDATE ON public.library_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for books, announcements, and borrowings
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.borrowings;