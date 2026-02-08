/**
 * Bug Screenshot Uploader
 * 
 * Handles screenshot uploads for bug reports:
 * - Drag-and-drop interface
 * - Client-side image compression (max 2MB)
 * - Image preview with thumbnails
 * - Multiple file support
 * - Auto-screenshot using html2canvas (optional)
 */

class BugScreenshotUploader {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.files = [];
    this.maxFileSize = 2 * 1024 * 1024; // 2MB
    this.maxFiles = 3;
    this.acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  }

  init() {
    if (!this.container) {
      console.error('Screenshot uploader: Container not found');
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="screenshot-uploader">
        <div class="upload-area" id="uploadArea">
          <div class="upload-icon">📷</div>
          <div class="upload-text">
            <p><strong>Click to upload</strong> or drag and drop</p>
            <p class="upload-hint">PNG, JPG, WEBP (max 2MB, up to 3 files)</p>
          </div>
          <input 
            type="file" 
            id="screenshotInput" 
            accept="image/png,image/jpeg,image/jpg,image/webp" 
            multiple 
            style="display: none;"
          />
        </div>

        <div class="screenshot-actions">
          <button type="button" class="auto-screenshot-btn" id="autoScreenshotBtn">
            🖼️ Capture Screen
          </button>
        </div>

        <div class="screenshot-previews" id="screenshotPreviews"></div>
      </div>
    `;
  }

  attachEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('screenshotInput');
    const autoScreenshotBtn = document.getElementById('autoScreenshotBtn');

    // Click to upload
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });

    // Auto-screenshot button
    autoScreenshotBtn.addEventListener('click', () => {
      this.captureScreen();
    });
  }

  async handleFiles(fileList) {
    const newFiles = Array.from(fileList);

    // Check file count
    if (this.files.length + newFiles.length > this.maxFiles) {
      alert(`Maximum ${this.maxFiles} screenshots allowed`);
      return;
    }

    for (const file of newFiles) {
      // Validate file type
      if (!this.acceptedFormats.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PNG, JPG, WEBP allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > this.maxFileSize) {
        alert(`File too large: ${file.name}. Max size is 2MB.`);
        continue;
      }

      // Compress and add file
      const compressedFile = await this.compressImage(file);
      this.files.push(compressedFile);
    }

    this.renderPreviews();
  }

  async compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if larger than 1920x1080
          const maxWidth = 1920;
          const maxHeight = 1080;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            resolve({
              file: compressedFile,
              dataUrl: canvas.toDataURL('image/jpeg', 0.8),
              originalSize: file.size,
              compressedSize: blob.size
            });
          }, 'image/jpeg', 0.8);
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  renderPreviews() {
    const previewsContainer = document.getElementById('screenshotPreviews');

    if (this.files.length === 0) {
      previewsContainer.innerHTML = '';
      return;
    }

    previewsContainer.innerHTML = this.files.map((fileData, index) => `
      <div class="screenshot-preview">
        <img src="${fileData.dataUrl}" alt="Screenshot ${index + 1}" />
        <div class="preview-info">
          <span class="file-name">${fileData.file.name}</span>
          <span class="file-size">${this.formatFileSize(fileData.compressedSize)}</span>
          ${fileData.compressedSize < fileData.originalSize ? 
            `<span class="compressed-label">Compressed ${Math.round((1 - fileData.compressedSize / fileData.originalSize) * 100)}%</span>` : 
            ''
          }
        </div>
        <button type="button" class="remove-btn" onclick="bugScreenshotUploader.removeFile(${index})">
          ✕
        </button>
      </div>
    `).join('');
  }

  async captureScreen() {
    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
      alert('html2canvas library not loaded. Screenshot capture unavailable.');
      return;
    }

    try {
      // Hide modal temporarily
      const modal = document.getElementById('bug-report-modal');
      if (modal) {
        modal.style.display = 'none';
      }

      // Wait a moment for UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture screen
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false
      });

      // Show modal again
      if (modal) {
        modal.style.display = 'flex';
      }

      // Convert to blob
      canvas.toBlob((blob) => {
        const file = new File([blob], `screenshot-${Date.now()}.png`, {
          type: 'image/png',
          lastModified: Date.now()
        });

        // Add as compressed file
        this.files.push({
          file: file,
          dataUrl: canvas.toDataURL('image/png'),
          originalSize: blob.size,
          compressedSize: blob.size
        });

        this.renderPreviews();
      });

    } catch (error) {
      console.error('Screen capture error:', error);
      alert('Failed to capture screenshot. Please upload manually.');
    }
  }

  removeFile(index) {
    this.files.splice(index, 1);
    this.renderPreviews();
  }

  getFiles() {
    return this.files.map(f => f.file);
  }

  getDataUrls() {
    return this.files.map(f => f.dataUrl);
  }

  clear() {
    this.files = [];
    this.renderPreviews();
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// Auto-initialize
let bugScreenshotUploader = null;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('bug-screenshot-uploader')) {
    bugScreenshotUploader = new BugScreenshotUploader('bug-screenshot-uploader');
    bugScreenshotUploader.init();
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BugScreenshotUploader;
}
