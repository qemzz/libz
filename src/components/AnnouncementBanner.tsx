import { Megaphone, X } from 'lucide-react';
import { useState } from 'react';
import type { Announcement } from '@/lib/supabase-types';

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  if (visibleAnnouncements.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  return (
    <div className="space-y-2">
      {visibleAnnouncements.slice(0, 3).map((announcement) => (
        <div key={announcement.id} className="announcement-card flex items-start gap-3 animate-slide-up">
          <Megaphone className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">{announcement.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
          </div>
          <button
            onClick={() => dismiss(announcement.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
