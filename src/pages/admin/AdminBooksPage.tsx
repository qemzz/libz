import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Book, Star, Sparkles, Search, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book as BookType, Category } from '@/lib/supabase-types';

export default function AdminBooksPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: books, isLoading } = useQuery({
    queryKey: ['admin-books', search],
    queryFn: async () => {
      let query = supabase.from('books').select('*, category:categories(*)');
      if (search) {
        query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as (BookType & { category: Category | null })[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data as Category[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      toast({ title: 'Book deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting book', description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (book: BookType) => {
    setEditingBook(book);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBook(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Manage Books</h1>
          <p className="text-muted-foreground">Add, edit, and manage your library collection</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Book
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Books Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header border-b border-border">
                <th className="text-left p-4 font-medium">Book</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Category</th>
                <th className="text-left p-4 font-medium">Quantity</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4" colSpan={5}>
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : books && books.length > 0 ? (
                books.map((book) => (
                  <tr key={book.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <Book className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{book.title}</p>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-muted-foreground">{book.category?.name || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className={book.available_quantity > 0 ? 'text-success' : 'text-destructive'}>
                        {book.available_quantity}/{book.quantity}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {book.is_new_arrival && (
                          <span className="badge-new flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> New
                          </span>
                        )}
                        {book.is_featured && (
                          <span className="bg-primary/15 text-primary text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3" /> Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(book)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this book?')) {
                              deleteMutation.mutate(book.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No books found. Add your first book!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Dialog */}
      <BookFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        book={editingBook}
        categories={categories || []}
      />
    </div>
  );
}

function BookFormDialog({ 
  open, 
  onOpenChange, 
  book, 
  categories 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  book: BookType | null;
  categories: Category[];
}) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    cover_url: '',
    category_id: '',
    quantity: 1,
    is_new_arrival: false,
    is_featured: false,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const clearCoverFile = () => {
    setCoverFile(null);
    setCoverPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useState(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        description: book.description || '',
        cover_url: book.cover_url || '',
        category_id: book.category_id || '',
        quantity: book.quantity,
        is_new_arrival: book.is_new_arrival,
        is_featured: book.is_featured,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        cover_url: '',
        category_id: '',
        quantity: 1,
        is_new_arrival: false,
        is_featured: false,
      });
    }
  });

  // Reset form when dialog opens/closes or book changes
  const resetForm = () => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        description: book.description || '',
        cover_url: book.cover_url || '',
        category_id: book.category_id || '',
        quantity: book.quantity,
        is_new_arrival: book.is_new_arrival,
        is_featured: book.is_featured,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        cover_url: '',
        category_id: '',
        quantity: 1,
        is_new_arrival: false,
        is_featured: false,
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let coverUrl = formData.cover_url;

      // Upload cover file if selected
      if (coverFile) {
        setIsUploading(true);
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(fileName, coverFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('book-covers')
          .getPublicUrl(fileName);
        coverUrl = urlData.publicUrl;
        setIsUploading(false);
      }

      const payload = {
        ...formData,
        cover_url: coverUrl || null,
        category_id: formData.category_id || null,
        available_quantity: book ? book.available_quantity : formData.quantity,
      };

      if (book) {
        const { error } = await supabase.from('books').update(payload).eq('id', book.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: book ? 'Book updated successfully' : 'Book added successfully' });
      onOpenChange(false);
      clearCoverFile();
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error saving book', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (isOpen) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{book ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        </DialogHeader>
        <form 
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Cover Image</Label>
              <div className="space-y-3">
                {/* File upload */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Browse Image
                  </Button>
                  {coverFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate max-w-[150px]">{coverFile.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={clearCoverFile}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {/* Preview */}
                {(coverPreview || formData.cover_url) && (
                  <div className="w-20 h-28 rounded border border-border overflow-hidden">
                    <img src={coverPreview || formData.cover_url} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>
                )}
                {/* Fallback URL input */}
                {!coverFile && (
                  <Input
                    id="cover_url"
                    type="url"
                    value={formData.cover_url}
                    onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                    placeholder="Or paste image URL..."
                  />
                )}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_new_arrival">Mark as New Arrival</Label>
              <Switch
                id="is_new_arrival"
                checked={formData.is_new_arrival}
                onCheckedChange={(checked) => setFormData({ ...formData, is_new_arrival: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_featured">Mark as Featured</Label>
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || isUploading}>
              {isUploading ? 'Uploading...' : saveMutation.isPending ? 'Saving...' : (book ? 'Update Book' : 'Add Book')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
