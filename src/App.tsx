import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Balloon } from './components/Balloon';
import { Celebration } from './components/Celebration';
import { audioManager } from './lib/audio';
import { Music, Music2, Trophy, Link2 } from 'lucide-react';
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
const DEFAULT_IMAGE_URL = 'https://v3b.fal.media/files/b/0a8f3105/i5EwPSE4aA9tsqhvPa6pE_RsUPESac.png';

interface BirthdayCardConfig {
  recipientName: string;
  headline: string;
  message: string;
  imageUrl: string;
}

const defaultCardConfig: BirthdayCardConfig = {
  recipientName: 'Friend',
  headline: 'Happy Birthday',
  message: 'Wishing you all the best on your special day!\nMay this year be filled with joy, love, and lots of purrs!',
  imageUrl: DEFAULT_IMAGE_URL,
};

interface CompactCardConfig {
  r?: string;
  h?: string;
  m?: string;
  i?: string;
}

const encodeCardConfig = (config: BirthdayCardConfig): string => {
  const compact: CompactCardConfig = {};

  if (config.recipientName !== defaultCardConfig.recipientName) compact.r = config.recipientName;
  if (config.headline !== defaultCardConfig.headline) compact.h = config.headline;
  if (config.message !== defaultCardConfig.message) compact.m = config.message;
  if (config.imageUrl !== defaultCardConfig.imageUrl) compact.i = config.imageUrl;

  return encodeURIComponent(JSON.stringify(compact));
};

const decodeCardConfig = (encodedData: string): BirthdayCardConfig | null => {
  try {
    const parsed = JSON.parse(decodeURIComponent(encodedData)) as CompactCardConfig;

    return {
      recipientName: parsed.r || defaultCardConfig.recipientName,
      headline: parsed.h || defaultCardConfig.headline,
      message: parsed.m || defaultCardConfig.message,
      imageUrl: parsed.i || defaultCardConfig.imageUrl,
    };
  } catch {
    try {
      const base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const binary = window.atob(padded);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<BirthdayCardConfig>;

      return {
        recipientName: parsed.recipientName || defaultCardConfig.recipientName,
        headline: parsed.headline || defaultCardConfig.headline,
        message: parsed.message || defaultCardConfig.message,
        imageUrl: parsed.imageUrl || defaultCardConfig.imageUrl,
      };
    } catch {
      return null;
    }
  }
};

const decodeConfigFromUrl = (): { cardConfig: BirthdayCardConfig; isSharedView: boolean } => {
  const params = new URLSearchParams(window.location.search);
  const encodedData = params.get('card');

  if (!encodedData) {
    return {
      cardConfig: defaultCardConfig,
      isSharedView: false,
    };
  }

  const cardConfig = decodeCardConfig(encodedData);

  return {
    cardConfig: cardConfig || defaultCardConfig,
    isSharedView: Boolean(cardConfig),
  };
};

function App() {
  const isMobile = useIsMobile();
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState<{ id: number; color: string; size: number }[]>([]);
  const [isCelebration, setIsCelebration] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const initialConfigRef = useRef(decodeConfigFromUrl());
  const [isSharedView] = useState(initialConfigRef.current.isSharedView);
  
  const balloonIdRef = useRef(0);
  const [shareLink, setShareLink] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [cardConfig, setCardConfig] = useState<BirthdayCardConfig>(initialConfigRef.current.cardConfig);

  const spawnBalloon = useCallback(() => {
    if (score >= TOTAL_BALLOONS) return;
    
    const id = balloonIdRef.current++;
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const size = Math.random() * 40 + 60; // 60px to 100px

    setBalloons(prev => [...prev, { id, color, size }]);
  }, [score]);

  useEffect(() => {
    if (!gameStarted || isCelebration) return;
    const maxBalloonsOnScreen = isMobile ? 4 : 10;
    const spawnIntervalMs = isMobile ? 1700 : 1000;

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
          particleCount: isMobile ? 80 : 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: BALLOON_COLORS,
        });
      }, 500);
    }
  }, [score, isMobile]);

  const handlePop = (id: number, e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    audioManager.playPop();
    setScore(s => s + 1);
    setBalloons(prev => prev.filter(b => b.id !== id));
    
    // Local confetti burst at click position
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    confetti({
      particleCount: isMobile ? 8 : 20,
      spread: isMobile ? 30 : 40,
      origin: {
        x: clientX / window.innerWidth,
        y: clientY / window.innerHeight,
      },
      colors: BALLOON_COLORS,
      disableForced3d: true,
      gravity: 0.8,
      ticks: isMobile ? 70 : 100,
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

    const updateCardConfig = (field: keyof BirthdayCardConfig, value: string) => {
    setCardConfig(prev => ({ ...prev, [field]: value }));
    setShareFeedback('');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateCardConfig('imageUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateShareLink = async () => {
    const encodedConfig = encodeCardConfig(cardConfig);
    const generatedLink = `${window.location.origin}${window.location.pathname}?card=${encodedConfig}`;

    setShareLink(generatedLink);

    try {
      await navigator.clipboard.writeText(generatedLink);
      setShareFeedback('Share link copied! Send it to your friend 🎉');
    } catch {
      setShareFeedback('Share link ready below. Copy it and send it 🎈');
    }
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden flex flex-col font-sans">
      <div className="float-bg" />

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

      <div className="flex-1 relative overflow-y-auto">
        {!gameStarted ? (
          <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
           <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl w-full"
            >
              <h1 className="text-5xl font-black text-foreground mb-4 font-display">
                {cardConfig.recipientName}&apos;s <br />
                <span className="text-primary-foreground drop-shadow-sm">Balloon Bash</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {isSharedView
                  ? 'A birthday game was shared with you. Pop all balloons to reveal the message 🎈'
                  : 'Customize this birthday game, share your link, and send it to your friend.'}
              </p>

              {!isSharedView && (
                <div className="bg-white/70 backdrop-blur-md border border-white rounded-3xl p-6 text-left shadow-xl mb-6 space-y-4">
                  <h2 className="font-bold text-xl">Customize this birthday card</h2>

                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground">Birthday person&apos;s name</span>
                    <input
                      value={cardConfig.recipientName}
                      onChange={e => updateCardConfig('recipientName', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Jenna"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground">Celebration title</span>
                    <input
                      value={cardConfig.headline}
                      onChange={e => updateCardConfig('headline', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Happy Birthday"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground">Birthday message</span>
                    <textarea
                      value={cardConfig.message}
                      onChange={e => updateCardConfig('message', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Write your custom message here"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground">Photo URL (optional)</span>
                    <input
                      value={cardConfig.imageUrl}
                      onChange={e => updateCardConfig('imageUrl', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="https://..."
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground">Or upload a photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
                    />
                  </label>

                  <div className="rounded-2xl bg-background/70 border border-primary/20 p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Current photo preview (default shown automatically)</p>
                    <img
                      src={cardConfig.imageUrl || DEFAULT_IMAGE_URL}
                      alt="Birthday preview"
                      onError={event => {
                        event.currentTarget.src = DEFAULT_IMAGE_URL;
                      }}
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-primary shadow"
                    />
                  </div> 
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      onClick={generateShareLink}
                      className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-5 py-3 rounded-full font-semibold shadow"
                    >
                      <Link2 size={18} /> Generate share link
                    </button>

                    {shareFeedback && <p className="text-sm text-muted-foreground">{shareFeedback}</p>}
                  </div>

                  {shareLink && (
                    <div className="rounded-2xl bg-background/70 border border-primary/20 p-3 break-all text-sm">
                      {shareLink}
                    </div>
                  )}
                </div>
              )}

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
            <Celebration onRestart={restartGame} cardConfig={cardConfig} />
          </div>
        ) : (
          balloons.map(balloon => (
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
