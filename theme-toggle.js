class ThemeToggle {
  constructor() {
    this.currentTheme = localStorage.getItem('pinky_theme') || 'dark';
    this.applyTheme();
  }
  
  toggle() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pinky_theme', this.currentTheme);
    this.applyTheme();
  }
  
  applyTheme() {
    document.body.classList.toggle('light-theme', this.currentTheme === 'light');
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }
  }
}
window.themeToggle = new ThemeToggle();
