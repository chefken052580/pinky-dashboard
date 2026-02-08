/**
 * Update Progress UI Controller
 * Handles update notifications, progress display, and user actions
 */

class UpdateProgressUI {
  constructor() {
    this.modal = document.getElementById('update-modal-overlay');
    this.toast = document.getElementById('update-toast');
    this.state = 'idle'; // idle, checking, available, downloading, ready, installing
    this.updateInfo = null;
    
    this.setupEventListeners();
    this.listenForUpdateEvents();
  }
  
  setupEventListeners() {
    // Modal buttons
    document.getElementById('update-btn-cancel').addEventListener('click', () => {
      this.hideModal();
    });
    
    document.getElementById('update-btn-action').addEventListener('click', () => {
      this.handleActionClick();
    });
    
    // Toast buttons
    document.getElementById('update-toast-close').addEventListener('click', () => {
      this.hideToast();
    });
    
    document.getElementById('update-toast-action').addEventListener('click', () => {
      this.showModal();
      this.hideToast();
    });
  }
  
  listenForUpdateEvents() {
    // Listen for Electron IPC events (if in Electron)
    if (window.electronAPI) {
      window.electronAPI.onUpdateAvailable((info) => {
        this.handleUpdateAvailable(info);
      });
      
      window.electronAPI.onUpdateDownloadProgress((progress) => {
        this.handleDownloadProgress(progress);
      });
      
      window.electronAPI.onUpdateDownloaded((info) => {
        this.handleUpdateDownloaded(info);
      });
      
      window.electronAPI.onUpdateError((error) => {
        this.handleUpdateError(error);
      });
    }
  }
  
  // Show toast notification
  showToast(title, message, actionText = null) {
    document.getElementById('update-toast-title').textContent = title;
    document.getElementById('update-toast-message').textContent = message;
    
    const actionBtn = document.getElementById('update-toast-action');
    if (actionText) {
      actionBtn.textContent = actionText;
      actionBtn.style.display = 'inline-block';
    } else {
      actionBtn.style.display = 'none';
    }
    
    this.toast.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideToast();
    }, 10000);
  }
  
  hideToast() {
    this.toast.style.display = 'none';
  }
  
  // Show modal
  showModal() {
    this.modal.style.display = 'block';
  }
  
  hideModal() {
    this.modal.style.display = 'none';
  }
  
  // Handle action button click
  handleActionClick() {
    const btn = document.getElementById('update-btn-action');
    
    switch (this.state) {
      case 'available':
        // Start download
        if (window.electronAPI) {
          window.electronAPI.downloadUpdate();
        }
        this.state = 'downloading';
        btn.textContent = 'Downloading...';
        btn.disabled = true;
        break;
        
      case 'ready':
        // Install and restart
        if (window.electronAPI) {
          window.electronAPI.installUpdate();
        }
        this.state = 'installing';
        btn.textContent = 'Installing...';
        btn.disabled = true;
        break;
        
      default:
        this.hideModal();
    }
  }
  
  // Handle update available
  handleUpdateAvailable(info) {
    this.state = 'available';
    this.updateInfo = info;
    
    // Update modal
    document.getElementById('update-icon').textContent = '🎉';
    document.getElementById('update-modal-title').textContent = 'Update Available';
    document.getElementById('update-modal-subtitle').textContent = `Version ${info.version} is now available`;
    
    // Show details
    document.getElementById('update-details').style.display = 'block';
    document.getElementById('update-new-version').textContent = info.version;
    document.getElementById('update-size').textContent = this.formatBytes(info.size || 0);
    
    // Update status
    document.getElementById('update-status').textContent = 'A new version is ready to download.';
    
    // Update button
    document.getElementById('update-btn-action').textContent = 'Download';
    document.getElementById('update-btn-action').disabled = false;
    
    // Show toast
    this.showToast(
      'Update Available',
      `PinkyBot ${info.version} is available.`,
      'View Update'
    );
  }
  
  // Handle download progress
  handleDownloadProgress(progress) {
    this.state = 'downloading';
    
    // Show progress bar
    document.getElementById('update-progress-container').style.display = 'block';
    
    // Update progress
    const percent = Math.round(progress.percent || 0);
    document.getElementById('update-progress-fill').style.width = `${percent}%`;
    document.getElementById('update-progress-percent').textContent = `${percent}%`;
    
    // Update speed
    const speed = progress.bytesPerSecond || 0;
    document.getElementById('update-progress-speed').textContent = `${this.formatBytes(speed)}/s`;
    
    // Update status
    const downloaded = this.formatBytes(progress.transferred || 0);
    const total = this.formatBytes(progress.total || 0);
    document.getElementById('update-status').textContent = `Downloading... ${downloaded} / ${total}`;
    
    // Update title
    document.getElementById('update-modal-title').textContent = 'Downloading Update';
    document.getElementById('update-icon').textContent = '⬇️';
  }
  
  // Handle update downloaded
  handleUpdateDownloaded(info) {
    this.state = 'ready';
    
    // Hide progress bar
    document.getElementById('update-progress-container').style.display = 'none';
    
    // Update modal
    document.getElementById('update-icon').textContent = '✅';
    document.getElementById('update-modal-title').textContent = 'Update Ready';
    document.getElementById('update-modal-subtitle').textContent = 'Ready to install and restart';
    
    // Update status
    document.getElementById('update-status').textContent = 'The update has been downloaded and is ready to install.';
    
    // Update button
    document.getElementById('update-btn-action').textContent = 'Install & Restart';
    document.getElementById('update-btn-action').disabled = false;
    
    // Show toast
    this.showToast(
      'Update Ready',
      'Update downloaded. Restart to install.',
      'Install Now'
    );
  }
  
  // Handle update error
  handleUpdateError(error) {
    this.state = 'error';
    
    // Update modal
    document.getElementById('update-icon').textContent = '❌';
    document.getElementById('update-modal-title').textContent = 'Update Failed';
    document.getElementById('update-modal-subtitle').textContent = 'An error occurred';
    
    // Update status
    document.getElementById('update-status').textContent = `Error: ${error.message}`;
    
    // Update button
    document.getElementById('update-btn-action').textContent = 'Try Again';
    document.getElementById('update-btn-action').disabled = false;
    
    // Hide progress
    document.getElementById('update-progress-container').style.display = 'none';
    
    console.error('[UpdateProgressUI] Update error:', error);
  }
  
  // Format bytes to human-readable string
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  // Check for updates manually
  async checkForUpdates() {
    this.state = 'checking';
    
    // Show modal
    this.showModal();
    
    // Update modal
    document.getElementById('update-icon').textContent = '🔍';
    document.getElementById('update-modal-title').textContent = 'Checking for Updates';
    document.getElementById('update-modal-subtitle').textContent = 'Please wait...';
    document.getElementById('update-status').textContent = 'Contacting update server...';
    
    // Hide details and progress
    document.getElementById('update-details').style.display = 'none';
    document.getElementById('update-progress-container').style.display = 'none';
    
    // Disable button
    document.getElementById('update-btn-action').disabled = true;
    document.getElementById('update-btn-action').textContent = 'Checking...';
    
    try {
      // Call Electron API
      if (window.electronAPI) {
        const result = await window.electronAPI.checkForUpdates();
        
        if (!result || !result.updateAvailable) {
          // No update available
          this.state = 'idle';
          document.getElementById('update-icon').textContent = '✅';
          document.getElementById('update-modal-title').textContent = 'Up to Date';
          document.getElementById('update-modal-subtitle').textContent = `Version ${result?.currentVersion || 'Unknown'}`;
          document.getElementById('update-status').textContent = 'You are running the latest version.';
          document.getElementById('update-btn-action').textContent = 'Close';
          document.getElementById('update-btn-action').disabled = false;
        }
      }
    } catch (error) {
      this.handleUpdateError(error);
    }
  }
}

// Initialize when DOM is ready
let updateUI = null;

document.addEventListener('DOMContentLoaded', () => {
  updateUI = new UpdateProgressUI();
  
  // Expose globally for external access
  window.updateUI = updateUI;
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UpdateProgressUI;
}
