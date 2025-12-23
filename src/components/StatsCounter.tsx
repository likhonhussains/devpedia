import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface StatsCounterProps {
  value: number;
  label: string;
}

const StatsCounter = ({ value, label }: StatsCounterProps) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    Math.floor(latest).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return (
    <div className="text-center">
      <motion.p className="text-2xl md:text-3xl font-bold gradient-text">
        {rounded}
      </motion.p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

export default StatsCounter;
