/**
 * Bug Reporter - Community Bug Submission System
 * Handles bug report UI, validation, submission, and environment capture
 */

class BugReporter {
  constructor() {
    this.modal = null;
    this.form = null;
    this.isOpen = false;
    this.capturedScreenshot = null;
  }

  /**
   * Initialize bug reporter
   */
  init() {
    this.modal = document.getElementById('bug-report-modal');
    this.form = document.getElementById('bug-report-form');
    
    if (!this.form) {
      console.error('Bug report form not found');
      return;
    }

    // Attach event listeners
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Screenshot preview
    const screenshotInput = document.getElementById('bug-screenshot');
    if (screenshotInput) {
      screenshotInput.addEventListener('change', (e) => this.handleScreenshotUpload(e));
    }

    // Capture environment info on init
    this.captureEnvironmentInfo();
  }

  /**
   * Open bug report modal
   */
  open() {
    if (!this.modal) this.init();
    
    this.modal.style.display = 'flex';
    this.isOpen = true;
    
    // Focus on first input
    setTimeout(() => {
      const titleInput = document.getElementById('bug-title');
      if (titleInput) titleInput.focus();
    }, 100);

    // Re-capture environment info
    this.captureEnvironmentInfo();
  }

  /**
   * Close bug report modal
   */
  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    this.isOpen = false;
  }

  /**
   * Reset form for new bug report
   */
  reset() {
    if (this.form) {
      this.form.reset();
      this.capturedScreenshot = null;
      document.getElementById('screenshot-preview').innerHTML = '';
    }
    
    // Hide success message, show form
    document.getElementById('bug-report-success').style.display = 'none';
    document.getElementById('bug-report-form').style.display = 'block';
  }

  /**
   * Capture environment information
   */
  captureEnvironmentInfo() {
    // Browser detection
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    
    // OS detection
    let os = 'Unknown';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    // Screen info
    const screen = `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio}x DPI)`;

    // Update UI
    document.getElementById('env-browser').textContent = `Browser: ${browser}`;
    document.getElementById('env-os').textContent = `OS: ${os}`;
    document.getElementById('env-screen').textContent = `Screen: ${screen}`;

    return { browser, os, screen, userAgent: ua };
  }

  /**
   * Handle screenshot upload
   */
  handleScreenshotUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Screenshot too large! Maximum 5 MB.');
      event.target.value = '';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Invalid file type! Please upload PNG, JPEG, or GIF.');
      event.target.value = '';
      return;
    }

    // Read file and show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.capturedScreenshot = e.target.result; // base64 data URL
      
      // Show preview
      const preview = document.getElementById('screenshot-preview');
      preview.innerHTML = `
        <div class="screenshot-preview-container">
          <img src="${e.target.result}" alt="Screenshot preview" />
          <button type="button" class="remove-screenshot" onclick="BugReporter.removeScreenshot()">
            ✕ Remove
          </button>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove uploaded screenshot
   */
  removeScreenshot() {
    this.capturedScreenshot = null;
    document.getElementById('bug-screenshot').value = '';
    document.getElementById('screenshot-preview').innerHTML = '';
  }

  /**
   * Handle form submission
   */
  async handleSubmit(event) {
    event.preventDefault();

    // Get form data
    const formData = new FormData(this.form);
    const bugReport = {
      title: formData.get('title'),
      component: formData.get('component'),
      severity: formData.get('severity'),
      description: formData.get('description'),
      steps: formData.get('steps'),
      expected: formData.get('expected') || '',
      actual: formData.get('actual') || '',
      email: formData.get('email') || '',
      screenshot: this.capturedScreenshot,
      environment: this.captureEnvironmentInfo(),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Validate required fields
    if (!bugReport.title || !bugReport.component || !bugReport.severity || 
        !bugReport.description || !bugReport.steps) {
      alert('Please fill in all required fields.');
      return;
    }

    // Submit bug report
    try {
      const response = await fetch('http://192.168.254.4:3030/api/bugs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bugReport)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Show success message
      this.showSuccess(result.bugId, result.status || 'pending');

    } catch (error) {
      console.error('Bug submission failed:', error);
      alert(`Failed to submit bug report: ${error.message}\n\nPlease try again or contact support.`);
    }
  }

  /**
   * Show success message
   */
  showSuccess(bugId, status) {
    // Hide form
    document.getElementById('bug-report-form').style.display = 'none';
    
    // Show success message
    const successDiv = document.getElementById('bug-report-success');
    successDiv.style.display = 'block';
    
    // Update bug ID
    document.getElementById('submitted-bug-id').textContent = bugId;
    
    // Update status badge
    const statusBadge = successDiv.querySelector('.bug-status .badge');
    statusBadge.className = `badge badge-${status}`;
    statusBadge.textContent = this.formatStatus(status);
  }

  /**
   * Format status for display
   */
  formatStatus(status) {
    const statusMap = {
      'pending': 'Under Review',
      'confirmed': 'Confirmed',
      'duplicate': 'Duplicate',
      'cannot-reproduce': 'Cannot Reproduce',
      'user-error': 'User Error',
      'fixing': 'Being Fixed',
      'fixed': 'Fixed'
    };
    return statusMap[status] || status;
  }
}

// Global instance
const bugReporter = new BugReporter();

// Make available globally for onclick handlers
window.BugReporter = bugReporter;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => bugReporter.init());
} else {
  bugReporter.init();
}
