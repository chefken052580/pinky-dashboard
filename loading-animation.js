/**
 * Dashboard Loading Animation - Pinky Character
 * Displays while dashboard initializes
 */

class LoadingAnimation {
  constructor() {
    this.isLoading = false;
  }

  show() {
    if (this.isLoading) return;
    this.isLoading = true;
    
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a1428 0%, #1a2847 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        flex-direction: column;
        gap: 1.5rem;
      `;
      
      overlay.innerHTML = `
        <div style="font-size: 3rem; animation: pinky-bounce 1.5s infinite;">🐭</div>
        <div style="font-size: 1.2em; color: #4496ff; text-align: center;">
          <div style="margin-bottom: 0.5rem;">Loading PinkyBot Dashboard...</div>
          <div style="font-size: 0.9em; color: #6666aa;">
            <span class="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        </div>
        <style>
          @keyframes pinky-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          @keyframes dot-blink {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .loading-dots span {
            animation: dot-blink 1.5s infinite;
            display: inline-block;
            width: 4px;
            margin: 0 2px;
          }
          .loading-dots span:nth-child(2) {
            animation-delay: 0.2s;
          }
          .loading-dots span:nth-child(3) {
            animation-delay: 0.4s;
          }
        </style>
      `;
      
      document.body.insertBefore(overlay, document.body.firstChild);
    }
    
    overlay.style.display = 'flex';
  }

  hide() {
    this.isLoading = false;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Show for duration then hide
   */
  showForDuration(ms = 2000) {
    this.show();
    setTimeout(() => this.hide(), ms);
  }
}

window.loadingAnimation = new LoadingAnimation();

// Auto-show on page load
document.addEventListener('DOMContentLoaded', () => {
  window.loadingAnimation.show();
  
  // Hide when dashboard is ready
  window.addEventListener('load', () => {
    // Give 500ms for dashboard to render
    setTimeout(() => window.loadingAnimation.hide(), 500);
    // Safety: force hide after 3s
    setTimeout(() => window.loadingAnimation.hide(), 3000);
  });
});

// Start the single global refresh cycle
if (window.GlobalRefresh) {
  window.GlobalRefresh.start(30000);
}

// Start the single global refresh cycle
if (window.GlobalRefresh) {
  window.GlobalRefresh.start(30000);
}
