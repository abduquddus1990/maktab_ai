// Telegram WebApp SDK wrapper
const TG = {
  app: window.Telegram?.WebApp || null,

  init() {
    if (this.app) {
      this.app.ready();
      this.app.expand();
      this.app.setHeaderColor('#FFC800');
      this.app.setBackgroundColor('#f5f5f5');
    }
  },

  getUser() {
    if (this.app?.initDataUnsafe?.user) {
      return this.app.initDataUnsafe.user;
    }
    // Dev fallback
    return { id: 123456789, first_name: 'Test', last_name: 'Foydalanuvchi', username: 'testuser' };
  },

  getInitData() {
    return this.app?.initData || '';
  },

  haptic(type = 'light') {
    this.app?.HapticFeedback?.impactOccurred(type);
  },

  close() {
    this.app?.close();
  }
};
