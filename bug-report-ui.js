/**
 * Bug Report UI - Frontend component for bug submission
 * Handles screenshot/log uploads and form submission to backend API
 */

class BugReporter {
    constructor() {
        this.screenshotData = null;
        this.logsData = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10 MB
    }
    
    /**
     * Open the bug report modal
     */
    static open() {
        const modal = document.getElementById('bug-report-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Reset form
            BugReporter.reset();
        }
    }
    
    /**
     * Close the bug report modal
     */
    static close() {
        const modal = document.getElementById('bug-report-modal');
        if (modal) {
            modal.style.display = 'none';
            BugReporter.reset();
        }
    }
    
    /**
     * Reset form and state
     */
    static reset() {
        const form = document.getElementById('bug-report-form');
        if (form) form.reset();
        
        const reporter = new BugReporter();
        reporter.screenshotData = null;
        reporter.logsData = null;
        
        // Clear previews
        document.getElementById('screenshot-preview').innerHTML = '';
        document.getElementById('logs-preview').innerHTML = '';
        
        // Hide success/error
        document.getElementById('bug-success').style.display = 'none';
        document.getElementById('bug-error-msg').style.display = 'none';
        document.getElementById('bug-duplicate-notice').style.display = 'none';
        
        // Show form
        document.getElementById('bug-report-form').style.display = 'block';
    }
    
    /**
     * Handle screenshot upload
     */
    static handleScreenshot(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reporter = new BugReporter();
        
        // Check file size
        if (file.size > reporter.maxFileSize) {
            alert(`Screenshot too large. Maximum size is ${reporter.maxFileSize / 1024 / 1024} MB.`);
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, JPEG).');
            return;
        }
        
        // Read file as base64
        const reader = new FileReader();
        reader.onload = function(e) {
            reporter.screenshotData = e.target.result;
            
            // Show preview
            const preview = document.getElementById('screenshot-preview');
            preview.innerHTML = `
                <div class="bug-file-item">
                    <img src="${e.target.result}" alt="Screenshot" style="max-width: 200px; max-height: 150px; border-radius: 4px;"/>
                    <span>${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                    <button type="button" onclick="BugReporter.removeScreenshot()">✕</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Remove screenshot
     */
    static removeScreenshot() {
        const reporter = new BugReporter();
        reporter.screenshotData = null;
        document.getElementById('screenshot-preview').innerHTML = '';
        document.getElementById('bug-screenshot').value = '';
    }
    
    /**
     * Handle logs upload
     */
    static handleLogs(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reporter = new BugReporter();
        
        // Check file size
        if (file.size > reporter.maxFileSize) {
            alert(`Log file too large. Maximum size is ${reporter.maxFileSize / 1024 / 1024} MB.`);
            return;
        }
        
        // Read file as text
        const reader = new FileReader();
        reader.onload = function(e) {
            reporter.logsData = e.target.result;
            
            // Show preview
            const preview = document.getElementById('logs-preview');
            preview.innerHTML = `
                <div class="bug-file-item">
                    <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                    <button type="button" onclick="BugReporter.removeLogs()">✕</button>
                </div>
            `;
        };
        reader.readAsText(file);
    }
    
    /**
     * Remove logs
     */
    static removeLogs() {
        const reporter = new BugReporter();
        reporter.logsData = null;
        document.getElementById('logs-preview').innerHTML = '';
        document.getElementById('bug-logs').value = '';
    }
    
    /**
     * Submit bug report
     */
    static async submit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = document.getElementById('bug-submit-btn');
        const errorDiv = document.getElementById('bug-error-msg');
        const errorText = document.getElementById('bug-error-text');
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = '📤 Submitting...';
        
        // Hide previous errors
        errorDiv.style.display = 'none';
        
        try {
            // Get form data
            const title = form.querySelector('#bug-title').value.trim();
            const errorMessage = form.querySelector('#bug-error').value.trim();
            const stackTrace = form.querySelector('#bug-stack').value.trim();
            const description = form.querySelector('#bug-description').value.trim();
            const steps = form.querySelector('#bug-steps').value.trim();
            
            // Get auto-captured info
            const userAgent = navigator.userAgent;
            const url = window.location.href;
            
            // Get screenshot and logs data
            const reporter = new BugReporter();
            const screenshot = reporter.screenshotData;
            const logs = reporter.logsData;
            
            // Prepare payload
            const payload = {
                title,
                errorMessage,
                stackTrace: stackTrace || null,
                description: description || null,
                steps: steps || null,
                userAgent,
                url,
                screenshot: screenshot || null,
                logs: logs || null
            };
            
            // Submit to backend
            const response = await fetch('/api/bugs/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to submit bug report');
            }
            
            // Show success message
            form.style.display = 'none';
            const successDiv = document.getElementById('bug-success');
            const successMessage = document.getElementById('bug-success-message');
            const bugIdDisplay = document.getElementById('bug-id-display');
            const duplicateNotice = document.getElementById('bug-duplicate-notice');
            
            successDiv.style.display = 'flex';
            bugIdDisplay.textContent = result.bugId;
            
            if (result.isDuplicate) {
                duplicateNotice.style.display = 'block';
                duplicateNotice.textContent = `This bug has already been reported (${(result.similarity * 100).toFixed(0)}% match). We've updated the occurrence count.`;
            } else {
                duplicateNotice.style.display = 'none';
                successMessage.textContent = 'Thank you for helping improve PinkyBot! Our team will investigate this issue.';
            }
            
        } catch (err) {
            console.error('Bug submission error:', err);
            errorDiv.style.display = 'block';
            errorText.textContent = err.message || 'Failed to submit bug report. Please try again.';
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Submit Bug Report';
        }
    }
}

// Initialize form handler when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bug-report-form');
    if (form) {
        form.addEventListener('submit', BugReporter.submit);
    }
    
    // Close modal when clicking overlay
    const modal = document.getElementById('bug-report-modal');
    if (modal) {
        const overlay = modal.querySelector('.bug-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', BugReporter.close);
        }
    }
});

// Global function to open bug reporter
window.openBugReporter = function() {
    BugReporter.open();
};
