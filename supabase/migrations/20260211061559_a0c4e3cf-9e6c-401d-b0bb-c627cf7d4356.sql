
-- Create storage bucket for book covers
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- Allow anyone to view book covers
CREATE POLICY "Book covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

-- Allow admins to upload book covers
CREATE POLICY "Admins can upload book covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-covers' AND public.is_admin());

-- Allow admins to update book covers
CREATE POLICY "Admins can update book covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'book-covers' AND public.is_admin());

-- Allow admins to delete book covers
CREATE POLICY "Admins can delete book covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-covers' AND public.is_admin());
