/**
 * Known Issues Page
 * Display most voted and common bugs
 */

class KnownIssues {
  constructor() {
    this.issues = [];
    this.apiBase = window.API_BASE || 'http://localhost:3030';
  }

  async init() {
    console.log('[KnownIssues] Initializing known issues page');
    await this.loadIssues();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const filters = ['issues-category', 'issues-severity'];
    filters.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.applyFilters());
      }
    });
  }

  async loadIssues() {
    try {
      // Load bugs sorted by votes
      const response = await fetch(`${this.apiBase}/api/bugs?limit=100`);
      const data = await response.json();
      
      if (data.success) {
        // Filter for known issues (confirmed or in-progress) and sort by votes
        this.issues = data.bugs
          .filter(bug => bug.status === 'confirmed' || bug.status === 'in-progress')
          .sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        this.renderIssues();
      } else {
        this.showError('Failed to load known issues');
      }
    } catch (err) {
      console.error('[KnownIssues] Load error:', err);
      this.showError('Network error loading issues');
    }
  }

  applyFilters() {
    const category = document.getElementById('issues-category').value;
    const severity = document.getElementById('issues-severity').value;
    
    let filtered = [...this.issues];
    
    if (category !== 'all') {
      filtered = filtered.filter(issue => issue.category === category);
    }
    
    if (severity !== 'all') {
      filtered = filtered.filter(issue => issue.severity === severity);
    }
    
    this.renderIssues(filtered);
  }

  renderIssues(issues = this.issues) {
    const container = document.getElementById('issues-list');
    
    if (issues.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>No Known Issues</h3>
          <p>Great! No confirmed bugs match your filters.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = issues.map((issue, index) => this.renderIssueCard(issue, index + 1)).join('');
  }

  renderIssueCard(issue, rank) {
    const severityIcons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    const statusClass = issue.status === 'in-progress' ? 'in-progress' : 'confirmed';
    
    return `
      <div class="issue-card ${statusClass}">
        <div class="issue-rank">#${rank}</div>
        <div class="issue-content">
          <div class="issue-header">
            <h3>${this.escapeHtml(issue.title)}</h3>
            <div class="issue-badges">
              <span class="badge severity-${issue.severity}">
                ${severityIcons[issue.severity]} ${issue.severity}
              </span>
              <span class="badge status-${statusClass}">${issue.status}</span>
            </div>
          </div>
          
          <p class="issue-description">${this.escapeHtml(this.truncate(issue.description || '', 200))}</p>
          
          <div class="issue-footer">
            <div class="issue-meta">
              <span class="issue-id">#${issue.id}</span>
              <span class="issue-category">${issue.category}</span>
            </div>
            <div class="issue-votes">
              <button class="vote-btn" onclick="KnownIssues.vote('${issue.id}')">
                👍 ${issue.votes || 0} votes
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async vote(issueId) {
    const email = prompt('Enter your email to vote (or leave blank for anonymous):') || 'anonymous';
    
    try {
      const response = await fetch(`${this.apiBase}/api/bugs/${issueId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Vote recorded! Thank you.');
        await this.loadIssues(); // Reload to update vote counts
      } else {
        alert(data.error || 'Failed to record vote');
      }
    } catch (err) {
      console.error('[KnownIssues] Vote error:', err);
      alert('Network error recording vote');
    }
  }

  truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    const container = document.getElementById('issues-list');
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn-primary" onclick="KnownIssues.loadIssues()">Retry</button>
      </div>
    `;
  }
}

// Global instance
window.KnownIssues = new KnownIssues();

// Auto-initialize
if (document.getElementById('issues-list')) {
  window.KnownIssues.init();
}
