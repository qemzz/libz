-- Add Dewey Decimal Classification columns to books
ALTER TABLE public.books 
ADD COLUMN dewey_number TEXT DEFAULT NULL,
ADD COLUMN shelf_location TEXT DEFAULT NULL;

-- Create index for Dewey number sorting and searching
CREATE INDEX idx_books_dewey_number ON public.books (dewey_number);
