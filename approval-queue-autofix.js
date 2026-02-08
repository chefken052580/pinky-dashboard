/**
 * Auto-Fix Approval Queue
 * Interface for reviewing and approving AI-generated bug fixes
 */

class ApprovalQueue {
  constructor() {
    this.fixes = [];
    this.currentFix = null;
    this.apiBase = window.API_BASE || 'http://localhost:3030';
  }

  async init() {
    console.log('[ApprovalQueue] Initializing auto-fix approval queue');
    await this.loadStats();
    await this.loadFixes();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Filter changes
    const statusFilter = document.getElementById('fix-status-filter');
    const complexityFilter = document.getElementById('fix-complexity-filter');
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterFixes());
    }
    
    if (complexityFilter) {
      complexityFilter.addEventListener('change', () => this.filterFixes());
    }
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/api/autofix/stats/summary`);
      const data = await response.json();
      
      if (data.success) {
        const stats = data.stats;
        
        document.getElementById('pending-fixes-count').textContent = stats.byApproval?.pending || 0;
        document.getElementById('approved-fixes-count').textContent = stats.byApproval?.approved || 0;
        document.getElementById('rejected-fixes-count').textContent = stats.byApproval?.rejected || 0;
        document.getElementById('test-pass-rate').textContent = `${Math.round(stats.testPassRate)}%`;
      }
    } catch (err) {
      console.error('[ApprovalQueue] Failed to load stats:', err);
    }
  }

  async loadFixes() {
    try {
      const response = await fetch(`${this.apiBase}/api/autofix`);
      const data = await response.json();
      
      if (data.success) {
        this.fixes = data.fixes;
        this.renderFixes();
      } else {
        this.showError('Failed to load fixes');
      }
    } catch (err) {
      console.error('[ApprovalQueue] Failed to load fixes:', err);
      this.showError('Network error loading fixes');
    }
  }

  filterFixes() {
    const statusFilter = document.getElementById('fix-status-filter').value;
    const complexityFilter = document.getElementById('fix-complexity-filter').value;
    
    let filtered = this.fixes;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fix => {
        if (statusFilter === 'pending') {
          return fix.approvalStatus === 'pending';
        } else if (statusFilter === 'approved') {
          return fix.approvalStatus === 'approved';
        } else if (statusFilter === 'rejected') {
          return fix.approvalStatus === 'rejected';
        } else if (statusFilter === 'generated') {
          return fix.status === 'generated';
        }
        return true;
      });
    }
    
    // Filter by complexity
    if (complexityFilter !== 'all') {
      filtered = filtered.filter(fix => 
        fix.analysis?.complexity === complexityFilter
      );
    }
    
    this.renderFixes(filtered);
  }

  renderFixes(fixes = this.fixes) {
    const container = document.getElementById('fixes-list');
    
    if (fixes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔧</div>
          <h3>No Fixes Found</h3>
          <p>No auto-generated fixes match your filters.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = fixes.map(fix => this.renderFixCard(fix)).join('');
  }

  renderFixCard(fix) {
    const statusClass = fix.approvalStatus || 'pending';
    const complexityClass = fix.analysis?.complexity || 'unknown';
    const testStatus = fix.testResults?.status || 'unknown';
    const testStatusIcon = this.getTestStatusIcon(testStatus);
    
    const bug = fix.analysis;
    
    return `
      <div class="fix-card ${statusClass}" data-fix-id="${fix.id}">
        <div class="fix-card-header">
          <div class="fix-title">
            <span class="fix-id">${fix.id}</span>
            <h4>${bug?.title || 'Unknown Bug'}</h4>
          </div>
          <div class="fix-badges">
            <span class="badge complexity-${complexityClass}">${complexityClass}</span>
            <span class="badge status-${statusClass}">${statusClass}</span>
          </div>
        </div>
        
        <div class="fix-card-body">
          <div class="fix-info-grid">
            <div class="info-item">
              <strong>Bug ID:</strong> ${fix.bugId}
            </div>
            <div class="info-item">
              <strong>Category:</strong> ${bug?.category || 'unknown'}
            </div>
            <div class="info-item">
              <strong>Severity:</strong> ${bug?.severity || 'unknown'}
            </div>
            <div class="info-item">
              <strong>Strategy:</strong> ${bug?.strategy?.approach || 'unknown'}
            </div>
          </div>
          
          <div class="fix-test-results">
            ${testStatusIcon} <strong>Tests:</strong> 
            ${fix.testResults?.passed || 0} passed, 
            ${fix.testResults?.failed || 0} failed
            ${fix.testResults?.syntaxCheck?.passed ? '✓ Syntax OK' : '✗ Syntax Errors'}
          </div>
          
          <div class="fix-changes-summary">
            <strong>Changes:</strong> ${fix.changes?.length || 0} file(s) modified
          </div>
          
          <div class="fix-timestamp">
            Generated: ${this.formatTimestamp(fix.generatedAt)}
          </div>
        </div>
        
        <div class="fix-card-actions">
          <button class="btn-secondary" onclick="ApprovalQueue.viewDetails('${fix.id}')">
            👁️ View Details
          </button>
          ${fix.approvalStatus === 'pending' ? `
            <button class="btn-danger" onclick="ApprovalQueue.quickReject('${fix.id}')">
              ❌ Reject
            </button>
            <button class="btn-success" onclick="ApprovalQueue.quickApprove('${fix.id}')">
              ✅ Approve
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  getTestStatusIcon(status) {
    const icons = {
      'passed': '✅',
      'failed': '❌',
      'no-tests': '⚠️',
      'error': '🚫',
      'unknown': '❓'
    };
    return icons[status] || icons.unknown;
  }

  formatTimestamp(isoString) {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async viewDetails(fixId) {
    try {
      const response = await fetch(`${this.apiBase}/api/autofix/${fixId}`);
      const data = await response.json();
      
      if (data.success) {
        this.currentFix = data.fix;
        this.showDetailModal(data.fix);
      } else {
        alert('Failed to load fix details');
      }
    } catch (err) {
      console.error('[ApprovalQueue] Failed to load details:', err);
      alert('Network error loading details');
    }
  }

  showDetailModal(fix) {
    const modal = document.getElementById('fix-detail-modal');
    const body = document.getElementById('fix-detail-body');
    
    body.innerHTML = `
      <div class="fix-detail-section">
        <h4>Bug Analysis</h4>
        <div class="detail-grid">
          <div><strong>Title:</strong> ${fix.analysis.title}</div>
          <div><strong>Category:</strong> ${fix.analysis.category}</div>
          <div><strong>Severity:</strong> ${fix.analysis.severity}</div>
          <div><strong>Complexity:</strong> ${fix.analysis.complexity}</div>
        </div>
        <p><strong>Description:</strong> ${fix.analysis.description || 'N/A'}</p>
      </div>
      
      <div class="fix-detail-section">
        <h4>Fix Strategy</h4>
        <p><strong>Approach:</strong> ${fix.analysis.strategy.approach}</p>
        <p><strong>Estimated Time:</strong> ${fix.analysis.strategy.estimatedTime} minutes</p>
        <p><strong>Requires Approval:</strong> ${fix.analysis.strategy.requiresApproval ? 'Yes' : 'No'}</p>
        <div class="strategy-steps">
          <strong>Steps:</strong>
          <ol>
            ${fix.analysis.strategy.steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
      </div>
      
      <div class="fix-detail-section">
        <h4>Code Changes (${fix.changes.length})</h4>
        ${fix.changes.map((change, idx) => `
          <div class="code-change">
            <div class="change-header">
              <strong>Change ${idx + 1}:</strong> ${change.file}
              <span class="badge">${change.type}</span>
            </div>
            <p><em>${change.description}</em></p>
            <div class="code-diff">
              <div class="code-block original">
                <strong>Original:</strong>
                <pre>${this.escapeHtml(change.originalCode)}</pre>
              </div>
              <div class="code-block fixed">
                <strong>Fixed:</strong>
                <pre>${this.escapeHtml(change.fixedCode)}</pre>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="fix-detail-section">
        <h4>Test Results</h4>
        <div class="test-results-detail">
          <div><strong>Status:</strong> ${fix.testResults.status}</div>
          <div><strong>Passed:</strong> ${fix.testResults.passed}</div>
          <div><strong>Failed:</strong> ${fix.testResults.failed}</div>
          <div><strong>Duration:</strong> ${fix.testResults.duration}ms</div>
          <div><strong>Syntax Check:</strong> ${fix.testResults.syntaxCheck.passed ? '✅ Passed' : '❌ Failed'}</div>
        </div>
        
        ${fix.testResults.syntaxCheck.errors.length > 0 ? `
          <div class="syntax-errors">
            <strong>Syntax Errors:</strong>
            <ul>
              ${fix.testResults.syntaxCheck.errors.map(err => `
                <li>${err.file}: ${err.error}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="manual-verification">
          <strong>Manual Verification Steps:</strong>
          <ol>
            ${fix.testResults.manualVerification.instructions.map(step => `
              <li>${step}</li>
            `).join('')}
          </ol>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  }

  closeDetailModal() {
    const modal = document.getElementById('fix-detail-modal');
    modal.style.display = 'none';
    this.currentFix = null;
  }

  async quickApprove(fixId) {
    if (!confirm('Approve this fix for deployment?')) return;
    await this.updateApproval(fixId, 'approved', 'Quick approval');
  }

  async quickReject(fixId) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    await this.updateApproval(fixId, 'rejected', reason);
  }

  async approveFix() {
    if (!this.currentFix) return;
    
    const notes = prompt('Approval notes (optional):') || 'Approved via approval queue';
    await this.updateApproval(this.currentFix.id, 'approved', notes);
    this.closeDetailModal();
  }

  async rejectFix() {
    if (!this.currentFix) return;
    
    const notes = prompt('Rejection reason:');
    if (!notes) return;
    
    await this.updateApproval(this.currentFix.id, 'rejected', notes);
    this.closeDetailModal();
  }

  async retestFix() {
    if (!this.currentFix) return;
    
    try {
      const response = await fetch(`${this.apiBase}/api/autofix/${this.currentFix.id}/retest`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Tests re-run successfully');
        await this.viewDetails(this.currentFix.id); // Reload details
      } else {
        alert('Failed to re-run tests');
      }
    } catch (err) {
      console.error('[ApprovalQueue] Retest failed:', err);
      alert('Network error during retest');
    }
  }

  async updateApproval(fixId, status, notes) {
    try {
      const response = await fetch(`${this.apiBase}/api/autofix/${fixId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          reviewer: 'Brain',
          notes: notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Fix ${status} successfully`);
        await this.refreshQueue();
      } else {
        alert('Failed to update approval status');
      }
    } catch (err) {
      console.error('[ApprovalQueue] Approval update failed:', err);
      alert('Network error updating approval');
    }
  }

  async refreshQueue() {
    await this.loadStats();
    await this.loadFixes();
  }

  showError(message) {
    const container = document.getElementById('fixes-list');
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn-primary" onclick="ApprovalQueue.refreshQueue()">Retry</button>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global instance
window.ApprovalQueue = new ApprovalQueue();

// Auto-initialize when view is loaded
if (document.getElementById('fixes-list')) {
  window.ApprovalQueue.init();
}
