import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BadgeCelebration from '@/components/BadgeCelebration';

interface Badge {
  name: string;
  description: string;
  icon: string;
}

interface BadgeCelebrationContextType {
  triggerCelebration: (badge: Badge) => void;
}

const BadgeCelebrationContext = createContext<BadgeCelebrationContextType | undefined>(undefined);

export const useBadgeCelebration = () => {
  const context = useContext(BadgeCelebrationContext);
  if (!context) {
    throw new Error('useBadgeCelebration must be used within a BadgeCelebrationProvider');
  }
  return context;
};

export const BadgeCelebrationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [celebrationBadge, setCelebrationBadge] = useState<Badge | null>(null);

  const triggerCelebration = useCallback((badge: Badge) => {
    setCelebrationBadge(badge);
  }, []);

  const handleClose = useCallback(() => {
    setCelebrationBadge(null);
  }, []);

  // Listen for new badge notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('badge-celebrations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch the badge details
          const { data: badge } = await supabase
            .from('badges')
            .select('name, description, icon')
            .eq('id', payload.new.badge_id)
            .maybeSingle();

          if (badge) {
            triggerCelebration(badge);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, triggerCelebration]);

  return (
    <BadgeCelebrationContext.Provider value={{ triggerCelebration }}>
      {children}
      <BadgeCelebration badge={celebrationBadge} onClose={handleClose} />
    </BadgeCelebrationContext.Provider>
  );
};
