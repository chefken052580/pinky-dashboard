/**
 * FILE ATTACHMENT MODULE FOR TASKSBOT
 * Allows attaching .png, .jpeg, .pdf files to tasks
 * Stores references in task metadata, persists to localStorage
 * 
 * Usage: taskAttachmentManager.addAttachment(taskId, file)
 */

class FileAttachmentManager {
  constructor() {
    this.attachments = {};
    this.maxFileSize = 10 * 1024 * 1024; // 10 MB per file
    this.allowedFormats = ['image/png', 'image/jpeg', 'application/pdf'];
    this.storageKey = 'task-attachments-v1';
    this.loadFromStorage();
  }

  /**
   * Initialize: Load existing attachments from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.attachments = JSON.parse(stored);
      }
    } catch (e) {
      console.log('[FileAttachment] Failed to load from storage:', e.message);
      this.attachments = {};
    }
  }

  /**
   * Save attachments to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.attachments));
    } catch (e) {
      console.error('[FileAttachment] Failed to save to storage:', e.message);
    }
  }

  /**
   * Add attachment to task
   * @param {string} taskId - Task identifier
   * @param {File} file - File to attach
   * @returns {Object} - Attachment metadata
   */
  async addAttachment(taskId, file) {
    // Validation
    if (!file) {
      throw new Error('No file provided');
    }

    if (!this.allowedFormats.includes(file.type)) {
      throw new Error(
        'Invalid file type. Allowed: PNG, JPEG, PDF. Got: ' + file.type
      );
    }

    if (file.size > this.maxFileSize) {
      throw new Error(
        'File too large. Max: ' + this.formatFileSize(this.maxFileSize) +
        ', Got: ' + this.formatFileSize(file.size)
      );
    }

    // Convert file to base64 for storage
    const base64 = await this.fileToBase64(file);

    const attachment = {
      id: 'attach-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      taskId: taskId,
      filename: file.name,
      type: file.type,
      size: file.size,
      data: base64,
      timestamp: new Date().toISOString(),
      preview: file.type.startsWith('image/') ? base64 : null
    };

    // Store attachment
    if (!this.attachments[taskId]) {
      this.attachments[taskId] = [];
    }
    this.attachments[taskId].push(attachment);

    // Persist
    this.saveToStorage();

    console.log('[FileAttachment] Added:', attachment.filename, 'to task', taskId);
    return attachment;
  }

  /**
   * Remove attachment from task
   * @param {string} taskId - Task identifier
   * @param {string} attachmentId - Attachment ID to remove
   */
  removeAttachment(taskId, attachmentId) {
    if (!this.attachments[taskId]) {
      return;
    }

    this.attachments[taskId] = this.attachments[taskId].filter(
      a => a.id !== attachmentId
    );

    if (this.attachments[taskId].length === 0) {
      delete this.attachments[taskId];
    }

    this.saveToStorage();
    console.log('[FileAttachment] Removed attachment', attachmentId);
  }

  /**
   * Get all attachments for a task
   * @param {string} taskId - Task identifier
   * @returns {Array} - Attachments array
   */
  getAttachments(taskId) {
    return this.attachments[taskId] || [];
  }

  /**
   * Get single attachment
   * @param {string} taskId - Task identifier
   * @param {string} attachmentId - Attachment ID
   * @returns {Object} - Attachment metadata
   */
  getAttachment(taskId, attachmentId) {
    const attachments = this.getAttachments(taskId);
    return attachments.find(a => a.id === attachmentId);
  }

  /**
   * Download attachment file
   * @param {string} taskId - Task identifier
   * @param {string} attachmentId - Attachment ID
   */
  downloadAttachment(taskId, attachmentId) {
    const attachment = this.getAttachment(taskId, attachmentId);
    if (!attachment) {
      console.error('Attachment not found');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.filename;
    link.click();

    console.log('[FileAttachment] Downloaded:', attachment.filename);
  }

  /**
   * Helper: Convert file to base64
   * @private
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Helper: Format file size for display
   * @private
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get attachment statistics
   */
  getStats() {
    let totalFiles = 0;
    let totalSize = 0;

    Object.values(this.attachments).forEach(attachments => {
      totalFiles += attachments.length;
      totalSize += attachments.reduce((sum, a) => sum + a.size, 0);
    });

    return {
      totalFiles: totalFiles,
      totalSize: totalSize,
      formatSize: this.formatFileSize(totalSize),
      taskCount: Object.keys(this.attachments).length
    };
  }

  /**
   * Clear all attachments (destructive!)
   */
  clearAll() {
    if (confirm('Delete ALL attachments? This cannot be undone.')) {
      this.attachments = {};
      localStorage.removeItem(this.storageKey);
      console.log('[FileAttachment] All attachments cleared');
    }
  }
}

/**
 * UI Component: File Attachment Button & Display
 */
class FileAttachmentUI {
  constructor(attachmentManager) {
    this.manager = attachmentManager;
    this.activeTaskId = null;
  }

  /**
   * Create attachment UI for a task
   */
  createAttachmentUI(taskId) {
    const container = document.createElement('div');
    container.className = 'task-attachments-container';
    container.id = 'attachments-' + taskId;

    // File input (hidden)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file-input-' + taskId;
    fileInput.accept = '.png,.jpg,.jpeg,.pdf';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(taskId, e.target.files[0]);
      e.target.value = ''; // Reset input
    });
    container.appendChild(fileInput);

    // Attach button
    const attachBtn = document.createElement('button');
    attachBtn.className = 'btn-attach-file';
    attachBtn.innerHTML = '📎 Attach File';
    attachBtn.onclick = () => fileInput.click();
    attachBtn.title = 'Attach PNG, JPEG, or PDF';
    container.appendChild(attachBtn);

    // Attachments list
    const attachmentsList = document.createElement('div');
    attachmentsList.className = 'attachments-list';
    attachmentsList.id = 'list-' + taskId;
    container.appendChild(attachmentsList);

    // Initial render
    this.updateAttachmentsList(taskId);

    return container;
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(taskId, file) {
    if (!file) return;

    try {
      // Add attachment
      const attachment = await this.manager.addAttachment(taskId, file);

      // Update UI
      this.updateAttachmentsList(taskId);

      // Show success
      this.showNotification('✓ Attached: ' + file.name, 'success');
    } catch (error) {
      this.showNotification('✗ Error: ' + error.message, 'error');
    }
  }

  /**
   * Update attachment list display
   */
  updateAttachmentsList(taskId) {
    const listElement = document.getElementById('list-' + taskId);
    if (!listElement) return;

    const attachments = this.manager.getAttachments(taskId);
    listElement.innerHTML = '';

    if (attachments.length === 0) {
      listElement.innerHTML = '<p style="color:#999; font-size:12px;">No attachments</p>';
      return;
    }

    const list = document.createElement('ul');
    list.className = 'attachments-list';

    attachments.forEach(attachment => {
      const item = document.createElement('li');
      item.className = 'attachment-item';

      // Icon
      const icon = this.getFileIcon(attachment.type);

      // Info
      const info = document.createElement('div');
      info.className = 'attachment-info';
      info.innerHTML = `
        <span class="attachment-icon">${icon}</span>
        <span class="attachment-name">${this.truncate(attachment.filename, 30)}</span>
        <span class="attachment-size">${this.manager.formatFileSize(attachment.size)}</span>
      `;

      // Actions
      const actions = document.createElement('div');
      actions.className = 'attachment-actions';

      // Preview (if image)
      if (attachment.type.startsWith('image/')) {
        const previewBtn = document.createElement('button');
        previewBtn.className = 'btn-preview';
        previewBtn.innerHTML = '👁️ Preview';
        previewBtn.onclick = () => this.showPreview(attachment);
        actions.appendChild(previewBtn);
      }

      // Download
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'btn-download';
      downloadBtn.innerHTML = '⬇️ Download';
      downloadBtn.onclick = () => this.manager.downloadAttachment(taskId, attachment.id);
      actions.appendChild(downloadBtn);

      // Delete
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-attachment';
      deleteBtn.innerHTML = '🗑️ Delete';
      deleteBtn.onclick = () => {
        this.manager.removeAttachment(taskId, attachment.id);
        this.updateAttachmentsList(taskId);
      };
      actions.appendChild(deleteBtn);

      item.appendChild(info);
      item.appendChild(actions);
      list.appendChild(item);
    });

    listElement.appendChild(list);
  }

  /**
   * Show preview for image attachment
   */
  showPreview(attachment) {
    const modal = document.createElement('div');
    modal.className = 'attachment-preview-modal';
    modal.innerHTML = `
      <div class="preview-content">
        <span class="close-preview">&times;</span>
        <img src="${attachment.data}" alt="${attachment.filename}" />
        <p>${attachment.filename}</p>
      </div>
    `;

    modal.querySelector('.close-preview').onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    document.body.appendChild(modal);
  }

  /**
   * Helper: Get file icon
   */
  getFileIcon(type) {
    if (type === 'image/png') return '🖼️';
    if (type === 'image/jpeg') return '📷';
    if (type === 'application/pdf') return '📄';
    return '📎';
  }

  /**
   * Helper: Truncate text
   */
  truncate(text, max) {
    return text.length > max ? text.substr(0, max - 3) + '...' : text;
  }

  /**
   * Display attachment in task form UI
   */
  displayAttachment(attachment) {
    const listContainer = document.getElementById('task-attachments-list');
    if (!listContainer) return;

    const item = document.createElement('div');
    item.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: 4px; font-size: 12px;';
    item.innerHTML = `
      <span>${this.getFileIcon(attachment.type)}</span>
      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.truncate(attachment.filename, 30)}</span>
      <span style="color: #6b7280; font-size: 11px;">${this.formatFileSize(attachment.size)}</span>
      <button onclick="window.fileAttachmentManager.removeAttachment('new-task', '${attachment.id}'); this.parentElement.remove();" style="padding: 2px 6px; background: rgba(255,71,87,0.15); color: #991b1b; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">✕</button>
    `;
    listContainer.appendChild(item);
  }

  /**
   * Get all attachments for new task
   */
  getTaskAttachments() {
    return this.getAttachments('new-task') || [];
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'attachment-notification ' + type;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

// Initialize globally
window.fileAttachmentManager = new FileAttachmentManager();
window.fileAttachmentUI = new FileAttachmentUI(window.fileAttachmentManager);

console.log('[FileAttachment] Module loaded - ready for task integration');
