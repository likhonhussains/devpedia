import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProfileCompletionProps {
  profile: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    cover_url?: string | null;
    twitter?: string | null;
    github?: string | null;
    linkedin?: string | null;
  };
}

const ProfileCompletion = ({ profile }: ProfileCompletionProps) => {
  const fields = [
    { key: 'display_name', label: 'Display Name', completed: !!profile.display_name },
    { key: 'username', label: 'Username', completed: !!profile.username },
    { key: 'avatar_url', label: 'Profile Picture', completed: !!profile.avatar_url },
    { key: 'bio', label: 'Bio', completed: !!profile.bio },
    { key: 'location', label: 'Location', completed: !!profile.location },
    { key: 'website', label: 'Website', completed: !!profile.website },
    { key: 'cover_url', label: 'Cover Photo', completed: !!profile.cover_url },
  ];

  const completedCount = fields.filter(f => f.completed).length;
  const percentage = Math.round((completedCount / fields.length) * 100);

  if (percentage === 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-3 sm:p-4"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-3">
        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
        <h3 className="font-semibold text-sm sm:text-base">Complete Your Profile</h3>
        <span className="ml-auto text-xs sm:text-sm text-muted-foreground">{percentage}%</span>
      </div>
      
      <Progress value={percentage} className="h-2 mb-3 sm:mb-4" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center gap-2 text-xs sm:text-sm">
            {field.completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className={field.completed ? 'text-muted-foreground line-through' : ''}>
              {field.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProfileCompletion;
