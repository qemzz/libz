import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, ArrowLeftRight, Megaphone, Tag, Settings } from 'lucide-react';

const actionIcons: Record<string, React.ElementType> = {
  book: BookOpen,
  student: Users,
  borrowing: ArrowLeftRight,
  announcement: Megaphone,
  category: Tag,
  settings: Settings,
};

export default function AdminActivityPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Activity Log</h1>
        <p className="text-muted-foreground">Track all admin actions in the system</p>
      </div>

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const Icon = actionIcons[log.entity_type] || BookOpen;
              return (
                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-secondary/30">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{log.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.entity_type} • {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.details && (
                      <pre className="text-xs text-muted-foreground mt-1 bg-secondary/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No activity recorded yet. Actions will appear here as you use the admin panel.
          </div>
        )}
      </div>
    </div>
  );
}
