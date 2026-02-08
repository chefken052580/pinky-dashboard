/**
 * Bug Triage Dashboard - JavaScript
 */

class TriageDashboard {
  constructor() {
    this.bugs = [];
    this.filteredBugs = [];
    this.currentBug = null;
    this.apiBase = 'http://192.168.254.4:3030/api';
  }

  /**
   * Initialize dashboard
   */
  async init() {
    await this.loadBugs();
    this.updateStats();
    this.renderBugList();
  }

  /**
   * Load bugs from API
   */
  async loadBugs() {
    try {
      const response = await fetch(`${this.apiBase}/bugs`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.bugs = data.bugs || [];
      this.filteredBugs = [...this.bugs];
      
      return this.bugs;
    } catch (error) {
      console.error('Failed to load bugs:', error);
      this.showError('Failed to load bugs. Please try again.');
      return [];
    }
  }

  /**
   * Update statistics bar
   */
  updateStats() {
    const stats = {
      pending: 0,
      confirmed: 0,
      fixing: 0,
      fixed: 0,
      duplicates: 0
    };

    this.bugs.forEach(bug => {
      if (bug.status === 'pending' || bug.status === 'possible-duplicate') stats.pending++;
      else if (bug.status === 'confirmed') stats.confirmed++;
      else if (bug.status === 'fixing') stats.fixing++;
      else if (bug.status === 'fixed') stats.fixed++;
      else if (bug.status === 'duplicate') stats.duplicates++;
    });

    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-confirmed').textContent = stats.confirmed;
    document.getElementById('stat-fixing').textContent = stats.fixing;
    document.getElementById('stat-fixed').textContent = stats.fixed;
    document.getElementById('stat-duplicates').textContent = stats.duplicates;
  }

  /**
   * Apply filters to bug list
   */
  applyFilters() {
    const statusFilter = document.getElementById('filter-status').value;
    const severityFilter = document.getElementById('filter-severity').value;
    const componentFilter = document.getElementById('filter-component').value;
    const sortOption = document.getElementById('filter-sort').value;

    // Filter bugs
    this.filteredBugs = this.bugs.filter(bug => {
      if (statusFilter && bug.status !== statusFilter) return false;
      if (severityFilter && bug.severity !== severityFilter) return false;
      if (componentFilter && bug.component !== componentFilter) return false;
      return true;
    });

    // Sort bugs
    this.filteredBugs.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'severity':
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'component':
          return a.component.localeCompare(b.component);
        default:
          return 0;
      }
    });

    this.renderBugList();
  }

  /**
   * Render bug list
   */
  renderBugList() {
    const bugList = document.getElementById('bug-list');

    if (this.filteredBugs.length === 0) {
      bugList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🐛</div>
          <h3>No bugs found</h3>
          <p>No bugs match the current filters.</p>
        </div>
      `;
      return;
    }

    bugList.innerHTML = this.filteredBugs.map(bug => this.renderBugCard(bug)).join('');
  }

  /**
   * Render individual bug card
   */
  renderBugCard(bug) {
    const timestamp = new Date(bug.timestamp).toLocaleString();
    
    return `
      <div class="bug-card" onclick="TriageDashboard.openBugDetails('${bug.bugId}')">
        <div class="bug-card-header">
          <h3 class="bug-card-title">${this.escapeHtml(bug.title)}</h3>
          <div class="bug-card-badges">
            <span class="bug-id-badge">${bug.bugId}</span>
            <span class="severity-badge severity-${bug.severity}">${bug.severity}</span>
            <span class="status-badge status-${bug.status}">${this.formatStatus(bug.status)}</span>
          </div>
        </div>
        <p class="bug-card-description">${this.escapeHtml(bug.description)}</p>
        <div class="bug-card-meta">
          <span class="bug-card-component">${bug.component}</span>
          <span>${timestamp}</span>
        </div>
      </div>
    `;
  }

  /**
   * Open bug details modal
   */
  openBugDetails(bugId) {
    const bug = this.bugs.find(b => b.bugId === bugId);
    if (!bug) return;

    this.currentBug = bug;

    // Populate modal
    document.getElementById('modal-bug-title').textContent = bug.title;
    document.getElementById('modal-bug-id').textContent = bug.bugId;
    document.getElementById('modal-bug-component').textContent = bug.component;
    document.getElementById('modal-bug-severity').textContent = bug.severity;
    document.getElementById('modal-bug-severity').className = `severity-badge severity-${bug.severity}`;
    document.getElementById('modal-bug-status').textContent = this.formatStatus(bug.status);
    document.getElementById('modal-bug-status').className = `status-badge status-${bug.status}`;
    document.getElementById('modal-bug-timestamp').textContent = new Date(bug.timestamp).toLocaleString();
    document.getElementById('modal-bug-submitter').textContent = bug.submittedBy || 'anonymous';
    document.getElementById('modal-bug-description').textContent = bug.description;
    document.getElementById('modal-bug-steps').textContent = bug.steps;
    document.getElementById('modal-bug-expected').textContent = bug.expected || 'N/A';
    document.getElementById('modal-bug-actual').textContent = bug.actual || 'N/A';
    
    // Environment
    document.getElementById('modal-env-browser').textContent = bug.environment?.browser || 'Unknown';
    document.getElementById('modal-env-os').textContent = bug.environment?.os || 'Unknown';
    document.getElementById('modal-env-screen').textContent = bug.environment?.screen || 'Unknown';

    // Screenshot
    if (bug.screenshot) {
      document.getElementById('modal-screenshot-section').style.display = 'block';
      document.getElementById('modal-screenshot').src = bug.screenshot;
    } else {
      document.getElementById('modal-screenshot-section').style.display = 'none';
    }

    // Duplicates
    if (bug.duplicateCandidates && bug.duplicateCandidates.length > 0) {
      document.getElementById('modal-duplicates-section').style.display = 'block';
      document.getElementById('modal-duplicates-list').innerHTML = bug.duplicateCandidates.map(dup => `
        <div class="duplicate-item" onclick="TriageDashboard.openBugDetails('${dup.bugId}')">
          <strong>${dup.bugId}</strong>: ${this.escapeHtml(dup.title)} (${Math.round(dup.similarity * 100)}% similar)
        </div>
      `).join('');
    } else {
      document.getElementById('modal-duplicates-section').style.display = 'none';
    }

    // Set form values
    document.getElementById('modal-severity-select').value = bug.severity;
    document.getElementById('modal-component-select').value = bug.component;
    document.getElementById('modal-triage-notes').value = bug.triageNotes || '';

    // Show modal
    document.getElementById('bug-details-modal').style.display = 'flex';
  }

  /**
   * Close bug details modal
   */
  closeModal() {
    document.getElementById('bug-details-modal').style.display = 'none';
    this.currentBug = null;
  }

  /**
   * Set bug status (triage action)
   */
  async setStatus(newStatus) {
    if (!this.currentBug) return;

    try {
      const response = await fetch(`${this.apiBase}/classification/${this.currentBug.bugId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          overrideReason: `Manual triage by maintainer`
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      console.log('Status updated:', result);

      // Update local bug data
      this.currentBug.status = newStatus;
      
      // Refresh and close modal
      await this.refresh();
      this.closeModal();
      
      this.showSuccess(`Bug marked as: ${this.formatStatus(newStatus)}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      this.showError('Failed to update bug status. Please try again.');
    }
  }

  /**
   * Trigger auto-fix pipeline
   */
  async triggerAutoFix() {
    if (!this.currentBug) return;

    if (!confirm('Trigger auto-fix pipeline for this bug? Staging Pinky will attempt to generate a fix.')) {
      return;
    }

    try {
      // First, mark as confirmed
      await fetch(`${this.apiBase}/classification/${this.currentBug.bugId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed', overrideReason: 'Triggering auto-fix' })
      });

      // Then trigger auto-fix
      const response = await fetch(`${this.apiBase}/autofix/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugId: this.currentBug.bugId })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      console.log('Auto-fix triggered:', result);

      this.closeModal();
      this.showSuccess(`Auto-fix pipeline triggered for ${this.currentBug.bugId}. Check fix-approval dashboard for results.`);
      
      await this.refresh();
    } catch (error) {
      console.error('Failed to trigger auto-fix:', error);
      this.showError('Failed to trigger auto-fix. Please try again.');
    }
  }

  /**
   * Update bug severity
   */
  async updateSeverity() {
    if (!this.currentBug) return;

    const newSeverity = document.getElementById('modal-severity-select').value;
    
    try {
      const response = await fetch(`${this.apiBase}/bugs/${this.currentBug.bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity: newSeverity })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.currentBug.severity = newSeverity;
      await this.refresh();
      
      this.showSuccess(`Severity updated to: ${newSeverity}`);
    } catch (error) {
      console.error('Failed to update severity:', error);
      this.showError('Failed to update severity. Please try again.');
    }
  }

  /**
   * Update bug component
   */
  async updateComponent() {
    if (!this.currentBug) return;

    const newComponent = document.getElementById('modal-component-select').value;
    
    try {
      const response = await fetch(`${this.apiBase}/bugs/${this.currentBug.bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component: newComponent })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.currentBug.component = newComponent;
      await this.refresh();
      
      this.showSuccess(`Component updated to: ${newComponent}`);
    } catch (error) {
      console.error('Failed to update component:', error);
      this.showError('Failed to update component. Please try again.');
    }
  }

  /**
   * Save triage notes
   */
  async saveNotes() {
    if (!this.currentBug) return;

    const notes = document.getElementById('modal-triage-notes').value;
    
    try {
      const response = await fetch(`${this.apiBase}/bugs/${this.currentBug.bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triageNotes: notes })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.currentBug.triageNotes = notes;
      
      this.showSuccess('Triage notes saved');
    } catch (error) {
      console.error('Failed to save notes:', error);
      this.showError('Failed to save notes. Please try again.');
    }
  }

  /**
   * Sync bugs to GitHub Issues
   */
  async syncToGitHub() {
    if (!confirm('Sync all confirmed bugs to GitHub Issues? This may take a while.')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/issues-sync/trigger`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      
      this.showSuccess(`GitHub sync complete: ${result.results.pushed.created} created, ${result.results.pushed.updated} updated`);
    } catch (error) {
      console.error('GitHub sync failed:', error);
      this.showError('GitHub sync failed. Please check configuration.');
    }
  }

  /**
   * Refresh bug list
   */
  async refresh() {
    await this.loadBugs();
    this.updateStats();
    this.applyFilters();
  }

  /**
   * Format status for display
   */
  formatStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'duplicate': 'Duplicate',
      'cannot-reproduce': 'Cannot Reproduce',
      'user-error': 'User Error',
      'fixing': 'Being Fixed',
      'fixed': 'Fixed',
      'possible-duplicate': 'Possible Duplicate'
    };
    return statusMap[status] || status;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    alert(message); // TODO: Replace with toast notification
  }

  /**
   * Show error message
   */
  showError(message) {
    alert(message); // TODO: Replace with toast notification
  }
}

// Global instance
const triageDashboard = new TriageDashboard();
window.TriageDashboard = triageDashboard;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => triageDashboard.init());
} else {
  triageDashboard.init();
}
