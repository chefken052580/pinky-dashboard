/**
 * Bug Submission Component
 * 
 * Handles bug report submission with attachments (screenshots, logs)
 * Integrates with community-bugs-api.js backend
 */

class BugSubmission {
  constructor() {
    this.attachments = [];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB per file
    this.allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/plain', 'text/x-log'];
    this.init();
  }

  init() {
    // Auto-detect environment
    this.detectEnvironment();
    
    // Character counter for title
    const titleInput = document.getElementById('bug-title');
    if (titleInput) {
      titleInput.addEventListener('input', () => this.updateCharCount());
    }
    
    // File attachment handler
    const fileInput = document.getElementById('bug-attachments');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    
    // Form submission
    const form = document.getElementById('bug-submission-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  detectEnvironment() {
    const envBrowser = document.getElementById('env-browser');
    const envOS = document.getElementById('env-os');
    
    if (envBrowser) {
      const ua = navigator.userAgent;
      let browser = 'Unknown';
      
      if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) browser = 'Chrome ' + ua.match(/Chrome\/(\d+)/)[1];
      else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
      else if (ua.indexOf('Firefox') > -1) browser = 'Firefox ' + ua.match(/Firefox\/(\d+)/)[1];
      else if (ua.indexOf('Edg') > -1) browser = 'Edge ' + ua.match(/Edg\/(\d+)/)[1];
      
      envBrowser.textContent = browser;
    }
    
    if (envOS) {
      const platform = navigator.platform;
      const ua = navigator.userAgent;
      let os = 'Unknown';
      
      if (platform.indexOf('Win') > -1) os = 'Windows';
      else if (platform.indexOf('Mac') > -1) os = 'macOS';
      else if (platform.indexOf('Linux') > -1) os = 'Linux';
      else if (ua.indexOf('Android') > -1) os = 'Android';
      else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
      
      envOS.textContent = os;
    }
  }

  updateCharCount() {
    const titleInput = document.getElementById('bug-title');
    const charCount = document.querySelector('.char-count');
    
    if (titleInput && charCount) {
      const length = titleInput.value.length;
      charCount.textContent = `${length}/200`;
      
      if (length < 10) {
        charCount.style.color = '#f44336'; // Red
      } else if (length > 180) {
        charCount.style.color = '#ff9800'; // Orange
      } else {
        charCount.style.color = '#4caf50'; // Green
      }
    }
  }

  addStep() {
    const stepsList = document.getElementById('bug-steps-list');
    const stepCount = stepsList.querySelectorAll('.step-item').length + 1;
    
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item';
    stepItem.innerHTML = `
      <input type="text" class="step-input" placeholder="Step ${stepCount}" />
      <button type="button" class="remove-step-btn" onclick="BugSubmission.removeStep(this)">×</button>
    `;
    
    stepsList.appendChild(stepItem);
  }

  removeStep(button) {
    const stepItem = button.closest('.step-item');
    const stepsList = document.getElementById('bug-steps-list');
    
    // Keep at least one step
    if (stepsList.querySelectorAll('.step-item').length > 1) {
      stepItem.remove();
      
      // Renumber remaining steps
      stepsList.querySelectorAll('.step-input').forEach((input, index) => {
        input.placeholder = `Step ${index + 1}`;
      });
    }
  }

  handleFileSelect(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('attachment-preview');
    
    files.forEach(file => {
      // Validate file type
      if (!this.allowedTypes.includes(file.type) && !file.name.endsWith('.log')) {
        this.showError(`File type not allowed: ${file.name}`);
        return;
      }
      
      // Validate file size
      if (file.size > this.maxFileSize) {
        this.showError(`File too large: ${file.name} (max 10MB)`);
        return;
      }
      
      // Add to attachments
      this.attachments.push({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      });
      
      // Show preview
      const previewItem = document.createElement('div');
      previewItem.className = 'attachment-item';
      previewItem.innerHTML = `
        <span class="attachment-icon">${this.getFileIcon(file)}</span>
        <span class="attachment-name">${file.name}</span>
        <span class="attachment-size">${this.formatFileSize(file.size)}</span>
        <button type="button" class="remove-attachment" data-name="${file.name}">×</button>
      `;
      
      previewItem.querySelector('.remove-attachment').addEventListener('click', (e) => {
        this.removeAttachment(file.name);
        previewItem.remove();
      });
      
      preview.appendChild(previewItem);
    });
    
    // Clear file input so same file can be selected again
    event.target.value = '';
  }

  getFileIcon(file) {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.name.endsWith('.log') || file.type === 'text/x-log') return '📄';
    if (file.type === 'text/plain') return '📝';
    return '📎';
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  removeAttachment(filename) {
    this.attachments = this.attachments.filter(att => att.name !== filename);
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const statusDiv = document.getElementById('submission-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Collect form data
    const formData = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      category: form.category.value,
      severity: form.severity.value,
      stepsToReproduce: this.collectSteps(),
      expectedBehavior: form.expectedBehavior.value.trim(),
      actualBehavior: form.actualBehavior.value.trim(),
      environment: {
        browser: document.getElementById('env-browser').textContent,
        os: document.getElementById('env-os').textContent,
        version: document.getElementById('env-version').textContent
      },
      attachments: this.attachments.map(att => ({
        name: att.name,
        size: att.size,
        type: att.type
      })),
      userEmail: form.userEmail.value.trim(),
      userName: form.userName.value.trim() || 'Anonymous'
    };
    
    try {
      // Submit to backend API
      const response = await fetch('http://192.168.254.4:3030/api/bugs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.isDuplicate) {
          // Show duplicate warning
          this.showDuplicates(result.duplicates);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Bug Report';
        } else {
          // Success
          this.showSuccess(`Bug report submitted successfully! ID: ${result.bugId}`);
          
          // Reset form after 2 seconds
          setTimeout(() => {
            this.close();
            form.reset();
            this.attachments = [];
            document.getElementById('attachment-preview').innerHTML = '';
          }, 2000);
        }
      } else {
        this.showError(result.error || 'Failed to submit bug report');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Bug Report';
      }
      
    } catch (error) {
      console.error('Bug submission error:', error);
      this.showError('Network error. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Bug Report';
    }
  }

  collectSteps() {
    const steps = [];
    document.querySelectorAll('.step-input').forEach(input => {
      const value = input.value.trim();
      if (value) steps.push(value);
    });
    return steps;
  }

  showDuplicates(duplicates) {
    const warningDiv = document.getElementById('duplicate-warning');
    const listDiv = document.getElementById('duplicate-list');
    
    listDiv.innerHTML = '';
    
    duplicates.forEach(dup => {
      const item = document.createElement('div');
      item.className = 'duplicate-item';
      item.innerHTML = `
        <strong>${dup.title}</strong>
        <span class="similarity">${Math.round(dup.similarity * 100)}% similar</span>
        <span class="status-badge">${dup.status}</span>
      `;
      listDiv.appendChild(item);
    });
    
    warningDiv.style.display = 'block';
  }

  showSuccess(message) {
    const statusDiv = document.getElementById('submission-status');
    statusDiv.className = 'submission-status success';
    statusDiv.textContent = '✅ ' + message;
    statusDiv.style.display = 'block';
  }

  showError(message) {
    const statusDiv = document.getElementById('submission-status');
    statusDiv.className = 'submission-status error';
    statusDiv.textContent = '❌ ' + message;
    statusDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }

  open() {
    const modal = document.getElementById('bug-submission-modal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    const modal = document.getElementById('bug-submission-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      
      // Reset form
      const form = document.getElementById('bug-submission-form');
      if (form) form.reset();
      
      // Clear attachments
      this.attachments = [];
      const preview = document.getElementById('attachment-preview');
      if (preview) preview.innerHTML = '';
      
      // Hide duplicate warning
      const warningDiv = document.getElementById('duplicate-warning');
      if (warningDiv) warningDiv.style.display = 'none';
      
      // Hide status message
      const statusDiv = document.getElementById('submission-status');
      if (statusDiv) statusDiv.style.display = 'none';
    }
  }
}

// Create global instance
window.BugSubmission = new BugSubmission();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.BugSubmission = new BugSubmission();
  });
} else {
  window.BugSubmission = new BugSubmission();
}
