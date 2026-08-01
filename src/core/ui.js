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

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        this.soundBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOverlay && this.modalOverlay.classList.contains('active')) {
        this.closeModal();
      }
    });
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
