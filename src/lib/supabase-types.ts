// Extended types for the library management system
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  cover_url: string | null;
  category_id: string | null;
  quantity: number;
  available_quantity: number;
  is_new_arrival: boolean;
  is_featured: boolean;
  times_borrowed: number;
  file_url: string | null;
  dewey_number: string | null;
  shelf_location: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  class_grade: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Borrowing {
  id: string;
  book_id: string;
  student_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  fine_amount: number;
  fine_paid: boolean;
  created_at: string;
  book?: Book;
  student?: Student;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface LibrarySetting {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

export interface LibraryStats {
  totalBooks: number;
  totalStudents: number;
  borrowedBooks: number;
  overdueBooks: number;
  popularBooks: Book[];
}
