import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['library-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('library_settings').select('*');
      if (error) throw error;
      return data.reduce((acc, s) => ({ ...acc, [s.setting_key]: s.setting_value }), {} as Record<string, string>);
    },
  });

  const [formData, setFormData] = useState<Record<string, string>>({});

  // Sync formData with settings when loaded
  useState(() => {
    if (settings) {
      setFormData(settings);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries({ ...settings, ...formData }).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('library_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-settings'] });
      toast({ title: 'Settings saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="card-elevated p-6 space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  const getValue = (key: string) => formData[key] ?? settings?.[key] ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Library Settings</h1>
        <p className="text-muted-foreground">Configure library policies and defaults</p>
      </div>

      <div className="card-elevated p-6 max-w-xl">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fine_per_day">Fine Per Day (for overdue books)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="fine_per_day"
                type="number"
                step="0.01"
                min="0"
                value={getValue('fine_per_day')}
                onChange={(e) => setFormData({ ...formData, fine_per_day: e.target.value })}
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">Amount charged per day for overdue books</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_borrow_days">Default Borrowing Period (days)</Label>
            <Input
              id="max_borrow_days"
              type="number"
              min="1"
              max="365"
              value={getValue('max_borrow_days')}
              onChange={(e) => setFormData({ ...formData, max_borrow_days: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Default number of days a book can be borrowed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_books_per_student">Max Books Per Student</Label>
            <Input
              id="max_books_per_student"
              type="number"
              min="1"
              max="50"
              value={getValue('max_books_per_student')}
              onChange={(e) => setFormData({ ...formData, max_books_per_student: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Maximum number of books a student can borrow at once</p>
          </div>

          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>
    </div>
  );
}
