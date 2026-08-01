import { sound } from './audio.js';

class UIManager {
  constructor() {
    this.modalOverlay = null;
    this.modalTitle = null;
    this.modalContent = null;
    this.closeBtn = null;
    this.soundBtn = null;
    this.activeGameCleanups = [];
  }

  init() {
    this.modalOverlay = document.getElementById('game-overlay');
    this.modalTitle = document.getElementById('modal-game-title');
    this.modalContent = document.getElementById('game-modal-content');
    this.closeBtn = document.getElementById('btn-close-modal');
    this.soundBtn = document.getElementById('btn-toggle-sound');

    this.fullscreenBtn = document.getElementById('btn-fullscreen-modal');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    document.addEventListener('fullscreenchange', () => {
      const isFS = !!document.fullscreenElement;
      if (this.fullscreenBtn) {
        this.fullscreenBtn.textContent = isFS ? '🗗' : '⛶';
        this.fullscreenBtn.title = isFS ? '退出全屏' : '切换全屏';
      }
      if (this.modalOverlay) {
        this.modalOverlay.classList.toggle('is-fullscreen', isFS);
      }
      this.adjustGameScale();
    });

    window.addEventListener('resize', () => {
      if (document.fullscreenElement) {
        this.adjustGameScale();
      }
    });

    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        this.soundBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOverlay && this.modalOverlay.classList.contains('active')) {
        if (!document.fullscreenElement) {
          this.closeModal();
        }
      }
    });
  }

  adjustGameScale() {
    const isFS = !!document.fullscreenElement;
    const content = this.modalContent;
    if (!content) return;

    const gameTarget = content.querySelector('.game-canvas-wrapper, .suika-wrapper, .village-wrapper');
    if (!gameTarget) return;

    if (isFS) {
      const availW = window.innerWidth * 0.94;
      const availH = (window.innerHeight - 75) * 0.94;
      const baseW = 600;
      const baseH = 540;

      const scale = Math.min(availW / baseW, availH / baseH);
      gameTarget.style.transform = `scale(${Math.max(1.1, scale)})`;
      gameTarget.style.transformOrigin = 'center center';
    } else {
      gameTarget.style.transform = '';
      gameTarget.style.transformOrigin = '';
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      const target = this.modalOverlay || document.documentElement;
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(err => console.warn('Fullscreen error:', err));
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn('Exit Fullscreen error:', err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  openModal(title, renderFn, cleanupFn) {
    this.cleanupActiveGame();

    if (this.modalTitle) this.modalTitle.textContent = title;
    if (this.modalContent) {
      this.modalContent.innerHTML = '';
      renderFn(this.modalContent);
    }

    if (cleanupFn) {
      this.activeGameCleanups.push(cleanupFn);
    }

    if (this.modalOverlay) {
      this.modalOverlay.classList.add('active');
    }
  }

  closeModal() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('active');
    }
    this.cleanupActiveGame();
  }

  cleanupActiveGame() {
    this.activeGameCleanups.forEach(fn => {
      try { fn(); } catch(e) { console.error('Cleanup error:', e); }
    });
    this.activeGameCleanups = [];
  }
}

export const ui = new UIManager();
