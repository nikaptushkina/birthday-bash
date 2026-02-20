import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Balloon } from './components/Balloon';
import { Celebration } from './components/Celebration';
import { audioManager } from './lib/audio';
import { Music, Music2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from './hooks/use-mobile';

const BALLOON_COLORS = [
  '#FF4FA3', // Pink
  '#B566FF', // Purple
  '#3FA9FF', // Blue
  '#FFD84A', // Yellow
  '#38E39B', // Green
  '#FF9F43', // Orange
];

const TOTAL_BALLOONS = 20;

function App() {
  const isMobile = useIsMobile();
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState<{ id: number; color: string; size: number }[]>([]);
  const [isCelebration, setIsCelebration] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const balloonIdRef = useRef(0);

  const spawnBalloon = useCallback(() => {
    if (score >= TOTAL_BALLOONS) return;
    
    const id = balloonIdRef.current++;
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const size = Math.random() * 40 + 60; // 60px to 100px

    setBalloons(prev => [...prev, { id, color, size }]);
  }, [score]);

  useEffect(() => {
    if (!gameStarted || isCelebration) return;
    const maxBalloonsOnScreen = isMobile ? 6 : 10;
    const spawnIntervalMs = isMobile ? 1400 : 1000;


    const interval = setInterval(() => {
      if (score < TOTAL_BALLOONS && balloons.length < maxBalloonsOnScreen) {
        spawnBalloon();
      }
    }, spawnIntervalMs);

    return () => clearInterval(interval);
  }, [gameStarted, isCelebration, balloons.length, spawnBalloon, score, isMobile]);

  useEffect(() => {
    if (score === TOTAL_BALLOONS) {
      setTimeout(() => {
        setIsCelebration(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: BALLOON_COLORS
        });
      }, 500);
    }
  }, [score]);

  const handlePop = (id: number, e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    audioManager.playPop();
    setScore(s => s + 1);
    setBalloons(prev => prev.filter(b => b.id !== id));
    
    // Local confetti burst at click position
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    confetti({
      particleCount: 20,
      spread: 40,
      origin: { 
        x: clientX / window.innerWidth,
        y: clientY / window.innerHeight 
      },
      colors: BALLOON_COLORS,
      disableForced3d: true,
      gravity: 0.8,
      ticks: 100
    });
  };

  const toggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  const restartGame = () => {
    setScore(0);
    setBalloons([]);
    setIsCelebration(false);
    balloonIdRef.current = 0;
  };

  const startGame = () => {
    audioManager.init();
    setGameStarted(true);
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden flex flex-col font-sans">
      <div className="float-bg" />

      {/* Header UI */}
      <AnimatePresence>
        {gameStarted && !isCelebration && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none"
          >
            <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/50 flex items-center gap-3 pointer-events-auto">
              <div className="bg-primary/20 p-2 rounded-full">
                <Trophy size={20} className="text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Balloons Popped</p>
                <p className="text-2xl font-black text-foreground leading-none">
                  {score} <span className="text-muted-foreground/50 text-lg">/ {TOTAL_BALLOONS}</span>
                </p>
              </div>
            </div>

            <button 
              onClick={toggleMute}
              className="bg-white/60 backdrop-blur-md p-4 rounded-full shadow-lg border border-white/50 pointer-events-auto hover:bg-white/80 transition-all active:scale-95"
            >
              {isMuted ? <Music2 size={24} className="text-muted-foreground" /> : <Music size={24} className="text-primary" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {!gameStarted ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md"
            >
              <h1 className="text-5xl font-black text-foreground mb-4 font-display">
                Jenna's <br />
                <span className="text-primary-foreground drop-shadow-sm">Balloon Bash</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Pop 20 balloons to celebrate Jenna's birthday!
              </p>
              <button
                onClick={startGame}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-5 rounded-full font-bold text-xl shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                Start Popping!
              </button>
            </motion.div>
          </div>
        ) : isCelebration ? (
          <div className="h-full flex items-start sm:items-center justify-center p-4 pt-6 sm:pt-4">
            <Celebration onRestart={restartGame} />
          </div>
        ) : (
          balloons.map((balloon) => (
            <Balloon
              key={balloon.id}
              id={balloon.id}
              color={balloon.color}
              size={balloon.size}
              onPop={(id, e) => handlePop(id, e)}
            />
          ))
        )}
      </div>

      {/* Progress Bar (Bottom) */}
      {gameStarted && !isCelebration && (
        <div className="fixed bottom-0 left-0 w-full h-1.5 bg-muted/30">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(score / TOTAL_BALLOONS) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
