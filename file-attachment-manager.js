/**
 * FILE ATTACHMENT MANAGER
 * Manages file attachments for TasksBot
 * Supports: .png, .jpeg, .pdf (up to 10 MB per file)
 * Storage: localStorage with base64 encoding
 */

class FileAttachmentManager {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10 MB
    this.allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    this.allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
    this.attachments = {};
    this.loadAttachments();
  }

  /**
   * Load attachments from localStorage
   */
  loadAttachments() {
    try {
      const stored = localStorage.getItem('taskAttachments');
      if (stored) {
        this.attachments = JSON.parse(stored);
      }
    } catch (err) {
      console.error('[FileAttachmentManager] Error loading attachments:', err);
      this.attachments = {};
    }
  }

  /**
   * Save attachments to localStorage
   */
  saveAttachments() {
    try {
      localStorage.setItem('taskAttachments', JSON.stringify(this.attachments));
    } catch (err) {
      console.error('[FileAttachmentManager] Error saving attachments:', err);
      throw new Error('Storage quota exceeded');
    }
  }

  /**
   * Add an attachment from a File object
   */
  async addAttachment(taskId, file) {
    // Validate file
    if (!file) throw new Error('No file provided');
    if (file.size > this.maxFileSize) {
      throw new Error(`File too large (max ${this.formatFileSize(this.maxFileSize)})`);
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error(`File type not allowed. Allowed: ${this.allowedExtensions.join(', ')}`);
    }

    // Convert file to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const attachment = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            taskId: taskId,
            filename: file.name,
            size: file.size,
            type: file.type,
            data: reader.result, // base64 string
            createdAt: new Date().toISOString()
          };

          // Store by task ID
          if (!this.attachments[taskId]) {
            this.attachments[taskId] = [];
          }
          this.attachments[taskId].push(attachment);

          // Save to localStorage
          this.saveAttachments();

          console.log('[FileAttachmentManager] Added attachment:', attachment.filename);
          resolve(attachment);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get attachments for a task
   */
  getTaskAttachments(taskId) {
    return this.attachments[taskId] || [];
  }

  /**
   * Remove an attachment
   */
  removeAttachment(taskId, attachmentId) {
    if (!this.attachments[taskId]) return false;
    
    const index = this.attachments[taskId].findIndex(a => a.id === attachmentId);
    if (index > -1) {
      this.attachments[taskId].splice(index, 1);
      if (this.attachments[taskId].length === 0) {
        delete this.attachments[taskId];
      }
      this.saveAttachments();
      return true;
    }
    return false;
  }

  /**
   * Clear all attachments for a task
   */
  clearTaskAttachments(taskId) {
    if (this.attachments[taskId]) {
      delete this.attachments[taskId];
      this.saveAttachments();
    }
  }

  /**
   * Display attachment in UI
   */
  displayAttachment(attachment, containerId = 'task-attachments-list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const attachmentEl = document.createElement('div');
    attachmentEl.id = 'attachment-' + attachment.id;
    attachmentEl.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding: 8px 12px;
      background: #e8f4f8;
      border-radius: 6px;
      border-left: 3px solid #0084ff;
      font-size: 13px;
    `;

    const icon = attachment.type === 'application/pdf' ? '📄' : '🖼️';
    
    attachmentEl.innerHTML = `
      <span>${icon}</span>
      <span style="flex: 1; word-break: break-all;">${attachment.filename} (${this.formatFileSize(attachment.size)})</span>
      <button class="remove-attachment-btn" data-id="${attachment.id}" style="
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
      ">✕</button>
    `;

    container.appendChild(attachmentEl);

    // Add remove handler
    const removeBtn = attachmentEl.querySelector('.remove-attachment-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.removeAttachment(attachment.taskId, attachment.id);
        attachmentEl.remove();
      });
    }
  }

  /**
   * Render all attachments for a task
   */
  renderTaskAttachments(taskId, containerId = 'task-attachments-list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const attachments = this.getTaskAttachments(taskId);

    if (attachments.length === 0) {
      container.innerHTML = '';
      return;
    }

    attachments.forEach(att => this.displayAttachment(att, containerId));
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Export attachment data
   */
  exportAttachment(attachment) {
    return {
      filename: attachment.filename,
      size: attachment.size,
      type: attachment.type,
      data: attachment.data,
      createdAt: attachment.createdAt
    };
  }

  /**
   * Get all attachments as array (for display/export)
   */
  getAllAttachments() {
    const all = [];
    Object.values(this.attachments).forEach(taskAtts => {
      all.push(...taskAtts);
    });
    return all;
  }

  /**
   * Clear all attachments (dangerous!)
   */
  clearAllAttachments() {
    this.attachments = {};
    this.saveAttachments();
    console.log('[FileAttachmentManager] Cleared all attachments');
  }
}

// Initialize globally when script loads
if (typeof window !== 'undefined') {
  console.log('[FileAttachmentManager] Initializing...');
  window.fileAttachmentManager = new FileAttachmentManager();
  console.log('[FileAttachmentManager] Ready - ' + window.fileAttachmentManager.getAllAttachments().length + ' attachments in storage');
}
