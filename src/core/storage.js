// Local Storage & High Score Manager
const STORAGE_KEY = 'casual_web_games_data';

class StorageManager {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { highScores: {} };
    } catch (e) {
      console.warn('LocalStorage error:', e);
      return { highScores: {} };
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  getHighScore(gameId) {
    return this.data.highScores[gameId] || 0;
  }

  setHighScore(gameId, score) {
    const current = this.getHighScore(gameId);
    if (score > current) {
      this.data.highScores[gameId] = score;
      this.saveData();
      return true; // New High Score achieved!
    }
    return false;
  }
}

export const storage = new StorageManager();
