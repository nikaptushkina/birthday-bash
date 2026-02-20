import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BalloonProps {
  id: number;
  color: string;
  size: number;
  onPop: (id: number, e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => void;
}

export const Balloon: React.FC<BalloonProps> = ({ id, color, size, onPop }) => {
  const [isPopped, setIsPopped] = useState(false);
  const isPoppingRef = useRef(false);
  const [leftPosition] = useState(Math.random() * 85 + 7.5); // Stay away from extreme edges
  const [duration] = useState(Math.random() * 3 + 4); // Speed up slightly (4s to 7s)
  const [swayDelay] = useState(Math.random() * 2);

  const handlePop = (e: React.PointerEvent) => {
    if (isPopped || isPoppingRef.current) return;
    isPoppingRef.current = true;
    setIsPopped(true);
    onPop(id, e);
  };

  return (
    <AnimatePresence>
      {!isPopped && (
        <motion.div
          initial={{ y: '110vh', x: `${leftPosition}vw`, opacity: 0 }}
          animate={{ y: '-20vh', opacity: 1 }}
          exit={{ scale: 2, opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration, ease: 'linear' }}
          className="absolute cursor-pointer touch-none select-none"
          style={{ width: size, height: size * 1.2 }}
          onPointerDown={handlePop}
        >
          <motion.div
            animate={{ x: [0, 15, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: swayDelay }}
            className="relative w-full h-full"
          >
            {/* Balloon Body */}
            <div 
              className="w-full h-[85%] rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-lg border-2 border-white/40"
              style={{ 
                backgroundColor: color,
                filter: 'brightness(1.1) saturate(1.05)',
                boxShadow: `inset -8px -8px 16px rgba(0,0,0,0.08), 0 8px 18px ${color}55`
              }}
            >
              {/* Highlight */}
              <div className="absolute top-[15%] left-[20%] w-[20%] h-[15%] bg-white/30 rounded-full blur-[2px]" />
            </div>
            {/* Balloon Knot */}
            <div 
              className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[15%] h-[5%] clip-path-triangle"
              style={{ backgroundColor: color }}
            />
            {/* String */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-[30px] bg-foreground/10" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};