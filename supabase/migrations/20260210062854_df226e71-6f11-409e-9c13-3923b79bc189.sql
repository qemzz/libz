
-- Create enum for borrow request status
CREATE TYPE public.borrow_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Add user_id to students table to link student accounts to auth users
ALTER TABLE public.students ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

-- Create borrow_requests table
CREATE TABLE public.borrow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  status borrow_request_status NOT NULL DEFAULT 'pending',
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests
CREATE POLICY "Students can view own requests"
ON public.borrow_requests
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
  OR is_admin()
);

-- Students can create requests
CREATE POLICY "Students can create requests"
ON public.borrow_requests
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON public.borrow_requests
FOR UPDATE
USING (is_admin());

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
ON public.borrow_requests
FOR DELETE
USING (is_admin());

-- Students can cancel their own pending requests
CREATE POLICY "Students can cancel own pending requests"
ON public.borrow_requests
FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
  AND status = 'pending'
);

-- Allow students to view their own student record (needed for auth linking)
CREATE POLICY "Students can view own record"
ON public.students
FOR SELECT
USING (user_id = auth.uid() OR is_admin());

-- Index for faster queries
CREATE INDEX idx_borrow_requests_student_id ON public.borrow_requests(student_id);
CREATE INDEX idx_borrow_requests_status ON public.borrow_requests(status);
CREATE INDEX idx_borrow_requests_book_id ON public.borrow_requests(book_id);
CREATE INDEX idx_students_user_id ON public.students(user_id);
