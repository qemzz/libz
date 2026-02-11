
-- Create library_visits table for tracking student visits
CREATE TABLE public.library_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  purpose TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.library_visits ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view visits" ON public.library_visits FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert visits" ON public.library_visits FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update visits" ON public.library_visits FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete visits" ON public.library_visits FOR DELETE USING (is_admin());
