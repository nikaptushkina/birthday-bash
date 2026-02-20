// Web Audio API Synthesizer for Pop and Background Music

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicSource: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;

  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  playPop() {
    if (!this.audioCtx || this.isMuted) return;
    
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + 0.1);
  }

  playMusic() {
    if (!this.audioCtx || this.musicSource) return;

    this.musicGain = this.audioCtx.createGain();
    this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05, this.audioCtx.currentTime);
    this.musicGain.connect(this.audioCtx.destination);

    // Simple melody loop
    const playNote = (freq: number, time: number, duration: number) => {
      if (!this.audioCtx || !this.musicGain) return;
      const osc = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.5, time + 0.1);
      g.gain.linearRampToValueAtTime(0, time + duration);
      
      osc.connect(g);
      g.connect(this.musicGain);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00]; // C4 to A4
    let time = this.audioCtx.currentTime;
    
    // This is a simplified loop tracker
    const loop = () => {
      for (let i = 0; i < 8; i++) {
        const freq = notes[Math.floor(Math.random() * notes.length)];
        playNote(freq, time + i * 0.5, 0.4);
      }
      time += 4;
      setTimeout(loop, 4000);
    };
    
    // loop(); // Disable auto-music for now, user might find it annoying if it's too simple
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05, this.audioCtx?.currentTime || 0);
    }
    return this.isMuted;
  }
}

export const audioManager = new AudioManager();
