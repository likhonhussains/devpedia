import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Star, Award, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BadgeCelebrationProps {
  badge: {
    name: string;
    description: string;
    icon: string;
  } | null;
  onClose: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'trophy': Trophy,
  'crown': Crown,
  'star': Star,
  'award': Award,
};

const RARE_BADGES = ['Superstar', 'Celebrity', 'Centurion'];

const Particle = ({ index }: { index: number }) => {
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB', '#32CD32'];
  const color = colors[index % colors.length];
  const startX = Math.random() * 100;
  const startDelay = Math.random() * 0.5;
  const duration = 2 + Math.random() * 2;
  const size = 8 + Math.random() * 8;
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${startX}%`,
        top: '-20px',
      }}
      initial={{ y: 0, opacity: 1, rotate: 0 }}
      animate={{
        y: ['0vh', '100vh'],
        opacity: [1, 1, 0],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        x: [0, (Math.random() - 0.5) * 200],
      }}
      transition={{
        duration,
        delay: startDelay,
        ease: 'easeOut',
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
      }}
    />
  );
};

const Sparkle = ({ index }: { index: number }) => {
  const angle = (index / 12) * Math.PI * 2;
  const distance = 120 + Math.random() * 60;
  
  return (
    <motion.div
      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
      style={{
        left: '50%',
        top: '50%',
      }}
      initial={{ 
        x: 0, 
        y: 0, 
        scale: 0,
        opacity: 1 
      }}
      animate={{
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: [0, 1.5, 0],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 1,
        delay: 0.3 + index * 0.05,
        ease: 'easeOut',
      }}
    />
  );
};

const BadgeCelebration = ({ badge, onClose }: BadgeCelebrationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (badge && RARE_BADGES.includes(badge.name)) {
      setIsVisible(true);
    }
  }, [badge]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!badge || !RARE_BADGES.includes(badge.name)) {
    return null;
  }

  const IconComponent = iconMap[badge.icon] || Trophy;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <Particle key={i} index={i} />
            ))}
          </div>

          {/* Celebration content */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-8 py-12"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ 
              type: 'spring', 
              damping: 15, 
              stiffness: 300,
              delay: 0.1 
            }}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Sparkles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <Sparkle key={i} index={i} />
              ))}
            </div>

            {/* Badge icon with glow */}
            <motion.div
              className="relative mb-6"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="absolute inset-0 blur-2xl bg-yellow-500/50 rounded-full scale-150" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl border-4 border-yellow-300">
                <IconComponent className="w-16 h-16 text-white drop-shadow-lg" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Achievement Unlocked!
            </motion.h2>

            {/* Badge name */}
            <motion.div
              className="mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-2xl font-bold text-foreground">{badge.name}</span>
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-muted-foreground text-lg mb-8 max-w-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {badge.description}
            </motion.p>

            {/* Action button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold px-8 py-2 shadow-lg"
              >
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BadgeCelebration;
