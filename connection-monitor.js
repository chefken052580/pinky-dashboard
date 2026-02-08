/**
 * Connection Monitor - Offline Detection Banner
 * Polls /api/health every 30s, shows reconnecting banner when API is down
 */

class ConnectionMonitor {
  constructor() {
    this.checkInterval = 30000; // 30 seconds
    this.isOnline = true;
    this.banner = null;
    this.intervalId = null;
  }

  init() {
    this.createBanner();
    this.startMonitoring();
    console.log('[ConnectionMonitor] Initialized - polling every 30s');
  }

  createBanner() {
    // Create banner element
    this.banner = document.createElement('div');
    this.banner.id = 'connection-banner';
    this.banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      padding: 12px 20px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      display: none;
      animation: slideDown 0.3s ease-out;
    `;
    document.body.appendChild(this.banner);

    // Add animation styles
    if (!document.getElementById('connection-monitor-styles')) {
      const style = document.createElement('style');
      style.id = 'connection-monitor-styles';
      style.textContent = `
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  startMonitoring() {
    // Initial check
    this.checkConnection();
    
    // Poll every 30 seconds
    this.intervalId = setInterval(() => {
      this.checkConnection();
    }, this.checkInterval);
  }

  async checkConnection() {
    try {
      const response = await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/health', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online') {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      } else {
        this.handleOffline();
      }
    } catch (error) {
      console.warn('[ConnectionMonitor] Health check failed:', error.message);
      this.handleOffline();
    }
  }

  handleOffline() {
    if (this.isOnline) {
      // Connection just went offline
      console.warn('[ConnectionMonitor] Connection lost - showing reconnecting banner');
      this.isOnline = false;
      this.showBanner('⚠️ Connection lost — retrying...', 'offline');
    }
  }

  handleOnline() {
    if (!this.isOnline) {
      // Connection just restored
      console.log('[ConnectionMonitor] Connection restored');
      this.isOnline = true;
      this.showBanner('✅ Reconnected', 'online');
      
      // Hide success banner after 3 seconds
      setTimeout(() => {
        this.hideBanner();
      }, 3000);
    } else {
      // Already online, ensure banner is hidden
      if (this.banner.style.display !== 'none') {
        this.hideBanner();
      }
    }
  }

  showBanner(message, type) {
    if (!this.banner) return;

    // Set styles based on type
    if (type === 'offline') {
      this.banner.style.background = 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)';
      this.banner.style.color = '#ffffff';
      this.banner.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.4)';
    } else if (type === 'online') {
      this.banner.style.background = 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
      this.banner.style.color = '#ffffff';
      this.banner.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.4)';
    }

    this.banner.textContent = message;
    this.banner.style.display = 'block';
    this.banner.style.animation = 'slideDown 0.3s ease-out';
  }

  hideBanner() {
    if (!this.banner) return;
    
    this.banner.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => {
      this.banner.style.display = 'none';
    }, 300);
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.banner) {
      this.banner.remove();
      this.banner = null;
    }
    console.log('[ConnectionMonitor] Destroyed');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.connectionMonitor = new ConnectionMonitor();
    window.connectionMonitor.init();
  });
} else {
  window.connectionMonitor = new ConnectionMonitor();
  window.connectionMonitor.init();
}
