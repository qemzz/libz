
-- Add file_url column to books for soft/digital book uploads
ALTER TABLE public.books ADD COLUMN file_url text;

-- Create storage bucket for digital book files
INSERT INTO storage.buckets (id, name, public) VALUES ('book-files', 'book-files', true);

-- Storage policies for book-files bucket
CREATE POLICY "Anyone can view book files"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-files');

CREATE POLICY "Admins can upload book files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-files' AND is_admin());

CREATE POLICY "Admins can delete book files"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-files' AND is_admin());
