// Web Audio API Synthesizer Engine for Sound Effects (No external assets required!)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playMove() {
    this.playTone(320, 'sine', 0.08, 0.08);
  }

  playScore() {
    this.playTone(587.33, 'triangle', 0.12, 0.15); // D5
    setTimeout(() => this.playTone(880, 'triangle', 0.18, 0.15), 80); // A5
  }

  playCombine() {
    this.playTone(440, 'sine', 0.08, 0.12);
    setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.15), 60);
  }

  playFlip() {
    this.playTone(280, 'triangle', 0.06, 0.08);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.15), idx * 100);
    });
  }

  playGameOver() {
    const notes = [400, 350, 300, 220];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.25, 0.1), idx * 120);
    });
  }
}

export const sound = new SoundEngine();
