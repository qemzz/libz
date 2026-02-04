import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Announcement } from '@/lib/supabase-types';

export default function AdminAnnouncementsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement deleted' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('announcements').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground">Manage library announcements visible to students</p>
        </div>
        <Button onClick={() => { setEditingAnnouncement(null); setIsDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
        ) : announcements && announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className={`card-elevated p-4 ${!announcement.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{announcement.title}</h3>
                    {announcement.priority > 0 && (
                      <span className="badge-new text-[10px]">Priority: {announcement.priority}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMutation.mutate({ id: announcement.id, is_active: !announcement.is_active })}
                    title={announcement.is_active ? 'Hide from students' : 'Show to students'}
                  >
                    {announcement.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingAnnouncement(announcement); setIsDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive"
                    onClick={() => {
                      if (confirm('Delete this announcement?')) deleteMutation.mutate(announcement.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No announcements yet. Create your first one!
          </div>
        )}
      </div>

      <AnnouncementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        announcement={editingAnnouncement}
      />
    </div>
  );
}

function AnnouncementDialog({ 
  open, 
  onOpenChange, 
  announcement 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  announcement: Announcement | null;
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 0,
    is_active: true,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetForm = () => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        is_active: announcement.is_active,
      });
    } else {
      setFormData({ title: '', content: '', priority: 0, is_active: true });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (announcement) {
        const { error } = await supabase.from('announcements').update(formData).eq('id', announcement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('announcements').insert(formData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: announcement ? 'Announcement updated' : 'Announcement created' });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (isOpen) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{announcement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Content *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Priority (higher = shown first)</Label>
            <Input
              type="number"
              min={0}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active (visible to students)</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
