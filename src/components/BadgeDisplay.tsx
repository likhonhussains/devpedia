import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Pencil, BookOpen, Crown, Star, Heart, Trophy, 
  MessageCircle, Users, UserPlus, Award 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

interface BadgeDisplayProps {
  userId: string;
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'pencil': Pencil,
  'book-open': BookOpen,
  'crown': Crown,
  'star': Star,
  'heart': Heart,
  'trophy': Trophy,
  'message-circle': MessageCircle,
  'users': Users,
  'user-plus': UserPlus,
  'award': Award,
};

const BadgeDisplay = ({ userId, compact = false }: BadgeDisplayProps) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          earned_at,
          badges (
            id,
            name,
            description,
            icon
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (!error && data) {
        const formattedBadges = data.map((item: any) => ({
          id: item.badges.id,
          name: item.badges.name,
          description: item.badges.description,
          icon: item.badges.icon,
          earned_at: item.earned_at,
        }));
        setBadges(formattedBadges);
      }
      setLoading(false);
    };

    fetchBadges();
  }, [userId]);

  if (loading) {
    return null;
  }

  if (badges.length === 0) {
    return null;
  }

  const displayBadges = compact ? badges.slice(0, 5) : badges;

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-2 ${compact ? 'items-center' : ''}`}>
        {displayBadges.map((badge, index) => {
          const IconComponent = iconMap[badge.icon] || Star;
          
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`
                    flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 
                    border border-primary/30 cursor-pointer hover:scale-110 transition-transform
                    ${compact ? 'w-8 h-8' : 'w-10 h-10'}
                  `}
                >
                  <IconComponent className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-primary`} />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-center">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {compact && badges.length > 5 && (
          <span className="text-xs text-muted-foreground ml-1">
            +{badges.length - 5} more
          </span>
        )}
      </div>
    </TooltipProvider>
  );
};

export default BadgeDisplay;
