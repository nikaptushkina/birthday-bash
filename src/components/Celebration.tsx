import React from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Heart, Music, Music2 } from 'lucide-react';

interface CelebrationProps {
  onRestart: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({ onRestart }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white max-w-lg w-full text-center relative overflow-hidden"
    >
      {/* Background Hearts */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5
          }}
          className="absolute text-primary/20"
          style={{ 
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        >
          <Heart size={24 + Math.random() * 24} fill="currentColor" />
        </motion.div>
      ))}

      <motion.div
        animate={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="mb-6 relative"
      >
        <img 
          src="https://v3b.fal.media/files/b/0a8f3105/i5EwPSE4aA9tsqhvPa6pE_RsUPESac.png" 
          alt="Cute Cat"
          className="w-48 h-48 rounded-[2rem] object-cover border-8 border-primary shadow-xl"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-4 -right-4 bg-accent p-3 rounded-full shadow-lg"
        >
          <PartyPopper className="text-accent-foreground" size={24} />
        </motion.div>
      </motion.div>

      <h1 className="text-4xl font-extrabold text-foreground mb-4 font-display">
        Happy Birthday, Jenna! 🐱
      </h1>
      
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        Wishing you all the best on your special day!<br />
        May this year be filled with joy, love, and lots of purrs!
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/20 transition-all"
      >
        Play Again
      </motion.button>
    </motion.div>
  );
};