import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Search, UserCheck, UserX, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student } from '@/lib/supabase-types';

export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin-students', search],
    queryFn: async () => {
      let query = supabase.from('students').select('*');
      if (search) {
        query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Student[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast({ title: 'Student deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting student', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Manage Students</h1>
          <p className="text-muted-foreground">Register and manage library members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => { setEditingStudent(null); setIsDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header border-b border-border">
                <th className="text-left p-4 font-medium">Student</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Class</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Contact</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4" colSpan={5}><Skeleton className="h-12 w-full" /></td>
                  </tr>
                ))
              ) : students && students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">
                      {student.class_grade || '-'}
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="text-sm">
                        {student.email && <p className="text-muted-foreground">{student.email}</p>}
                        {student.phone && <p className="text-muted-foreground">{student.phone}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        student.is_active 
                          ? 'bg-success/15 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {student.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingStudent(student); setIsDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this student?')) {
                              deleteMutation.mutate(student.id);
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
                    No students found. Register your first student!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        student={editingStudent}
      />

      <BulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
      />
    </div>
  );
}

function StudentFormDialog({ 
  open, 
  onOpenChange, 
  student 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  student: Student | null;
}) {
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    phone: '',
    class_grade: '',
    is_active: true,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetForm = () => {
    if (student) {
      setFormData({
        student_id: student.student_id,
        name: student.name,
        email: student.email || '',
        phone: student.phone || '',
        class_grade: student.class_grade || '',
        is_active: student.is_active,
      });
    } else {
      setFormData({
        student_id: '',
        name: '',
        email: '',
        phone: '',
        class_grade: '',
        is_active: true,
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        class_grade: formData.class_grade || null,
      };

      if (student) {
        const { error } = await supabase.from('students').update(payload).eq('id', student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('students').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast({ title: student ? 'Student updated successfully' : 'Student registered successfully' });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: 'Error saving student', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (isOpen) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{student ? 'Edit Student' : 'Register New Student'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID *</Label>
              <Input
                id="student_id"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="STU-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_grade">Class/Grade</Label>
              <Input
                id="class_grade"
                value={formData.class_grade}
                onChange={(e) => setFormData({ ...formData, class_grade: e.target.value })}
                placeholder="10th Grade"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active Student</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : (student ? 'Update' : 'Register')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Array<{ student_id: string; name: string; email?: string; phone?: string; class_grade?: string }>>([]);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.csv')) {
      setParseError('Please select a CSV file');
      return;
    }
    setFile(selectedFile);
    setParseError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setParseError('CSV must have a header row and at least one data row');
          return;
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h === 'name' || h === 'full_name' || h === 'full name');
        const idIdx = headers.findIndex(h => h === 'student_id' || h === 'id' || h === 'student id');
        if (nameIdx === -1 || idIdx === -1) {
          setParseError('CSV must have "student_id" and "name" columns');
          return;
        }
        const emailIdx = headers.findIndex(h => h === 'email');
        const phoneIdx = headers.findIndex(h => h === 'phone');
        const classIdx = headers.findIndex(h => h === 'class_grade' || h === 'class' || h === 'grade');

        const students = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.trim());
          return {
            student_id: cols[idIdx] || '',
            name: cols[nameIdx] || '',
            email: emailIdx !== -1 ? cols[emailIdx] : undefined,
            phone: phoneIdx !== -1 ? cols[phoneIdx] : undefined,
            class_grade: classIdx !== -1 ? cols[classIdx] : undefined,
          };
        }).filter(s => s.student_id && s.name);

        if (students.length === 0) {
          setParseError('No valid student records found');
          return;
        }
        setParsedStudents(students);
      } catch {
        setParseError('Failed to parse CSV file');
      }
    };
    reader.readAsText(selectedFile);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const payload = parsedStudents.map(s => ({
        student_id: s.student_id,
        name: s.name,
        email: s.email || null,
        phone: s.phone || null,
        class_grade: s.class_grade || null,
      }));
      const { error } = await supabase.from('students').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast({ title: `${parsedStudents.length} students imported successfully` });
      onOpenChange(false);
      setFile(null);
      setParsedStudents([]);
      setParseError('');
    },
    onError: (error) => {
      toast({ title: 'Error importing students', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) { setFile(null); setParsedStudents([]); setParseError(''); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Import Students from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Upload a CSV file with the following columns:</p>
            <p className="font-mono text-xs mt-1 bg-muted p-2 rounded">student_id, name, email, phone, class_grade</p>
            <p className="mt-1">Required: <strong>student_id</strong> and <strong>name</strong></p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : 'Choose CSV File'}
            </Button>
          </div>

          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}

          {parsedStudents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{parsedStudents.length} students found:</p>
              <div className="max-h-48 overflow-y-auto border border-border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-2 font-medium">ID</th>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedStudents.slice(0, 10).map((s, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="p-2 text-muted-foreground">{s.student_id}</td>
                        <td className="p-2">{s.name}</td>
                        <td className="p-2 text-muted-foreground">{s.class_grade || '-'}</td>
                      </tr>
                    ))}
                    {parsedStudents.length > 10 && (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-muted-foreground">
                          ...and {parsedStudents.length - 10} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={parsedStudents.length === 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Importing...' : `Import ${parsedStudents.length} Students`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
