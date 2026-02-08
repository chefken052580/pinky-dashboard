/**
 * Public Bug Tracker
 * Display and search bug reports with voting
 */

class BugTracker {
  constructor() {
    this.bugs = [];
    this.filteredBugs = [];
    this.currentBug = null;
    this.currentPage = 1;
    this.perPage = 20;
    this.apiBase = window.API_BASE || 'http://localhost:3030';
  }

  async init() {
    console.log('[BugTracker] Initializing public bug tracker');
    await this.loadBugs();
    await this.loadStats();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search on Enter key
    const searchInput = document.getElementById('bug-search');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.search();
        }
      });
    }
    
    // Filter changes
    const filters = ['filter-status', 'filter-severity', 'filter-category', 'filter-sort'];
    filters.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.applyFilters());
      }
    });
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/api/bugs/stats/all`);
      const data = await response.json();
      
      if (data.success) {
        const stats = data.stats;
        document.getElementById('total-bugs').textContent = stats.total || 0;
        document.getElementById('open-bugs').textContent = 
          (stats.byStatus?.new || 0) + (stats.byStatus?.['in-progress'] || 0);
        document.getElementById('confirmed-bugs').textContent = stats.byStatus?.confirmed || 0;
        document.getElementById('fixed-bugs').textContent = stats.byStatus?.fixed || 0;
      }
    } catch (err) {
      console.error('[BugTracker] Failed to load stats:', err);
    }
  }

  async loadBugs() {
    try {
      const response = await fetch(`${this.apiBase}/api/bugs?limit=1000`);
      const data = await response.json();
      
      if (data.success) {
        this.bugs = data.bugs;
        this.filteredBugs = [...this.bugs];
        this.renderBugs();
      } else {
        this.showError('Failed to load bugs');
      }
    } catch (err) {
      console.error('[BugTracker] Failed to load bugs:', err);
      this.showError('Network error loading bugs');
    }
  }

  search() {
    const query = document.getElementById('bug-search').value.toLowerCase().trim();
    
    if (!query) {
      this.filteredBugs = [...this.bugs];
    } else {
      this.filteredBugs = this.bugs.filter(bug => {
        return bug.title.toLowerCase().includes(query) ||
               (bug.description || '').toLowerCase().includes(query) ||
               bug.id.toLowerCase().includes(query);
      });
    }
    
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    const statusFilter = document.getElementById('filter-status').value;
    const severityFilter = document.getElementById('filter-severity').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const sortBy = document.getElementById('filter-sort').value;
    
    let filtered = [...this.filteredBugs];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bug => bug.status === statusFilter);
    }
    
    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(bug => bug.severity === severityFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(bug => bug.category === categoryFilter);
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    } else if (sortBy === 'most-voted') {
      filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else if (sortBy === 'severity') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }
    
    this.filteredBugs = filtered;
    this.renderBugs();
  }

  resetFilters() {
    document.getElementById('bug-search').value = '';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-severity').value = 'all';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-sort').value = 'newest';
    
    this.filteredBugs = [...this.bugs];
    this.currentPage = 1;
    this.renderBugs();
  }

  renderBugs() {
    const container = document.getElementById('bugs-grid');
    
    if (this.filteredBugs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No Bugs Found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      `;
      return;
    }
    
    // Pagination
    const startIndex = (this.currentPage - 1) * this.perPage;
    const endIndex = startIndex + this.perPage;
    const pageBugs = this.filteredBugs.slice(startIndex, endIndex);
    
    container.innerHTML = pageBugs.map(bug => this.renderBugCard(bug)).join('');
    this.renderPagination();
  }

  renderBugCard(bug) {
    const statusClass = bug.status || 'new';
    const severityClass = bug.severity || 'medium';
    const severityIcons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    
    return `
      <div class="bug-card ${statusClass}" onclick="BugTracker.viewBug('${bug.id}')">
        <div class="bug-card-header">
          <div class="bug-badges">
            <span class="badge severity-${severityClass}">
              ${severityIcons[bug.severity]} ${bug.severity}
            </span>
            <span class="badge status-${statusClass}">${bug.status}</span>
            <span class="badge category">${bug.category}</span>
          </div>
          <div class="bug-votes">
            <span class="vote-count">👍 ${bug.votes || 0}</span>
          </div>
        </div>
        
        <h3 class="bug-title">${this.escapeHtml(bug.title)}</h3>
        
        <p class="bug-description">
          ${this.escapeHtml(this.truncate(bug.description || '', 150))}
        </p>
        
        <div class="bug-meta">
          <span class="bug-id">#${bug.id}</span>
          <span class="bug-date">${this.formatDate(bug.submittedAt)}</span>
        </div>
      </div>
    `;
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredBugs.length / this.perPage);
    
    if (totalPages <= 1) {
      document.getElementById('pagination').innerHTML = '';
      return;
    }
    
    let paginationHTML = '<div class="pagination-controls">';
    
    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `<button onclick="BugTracker.goToPage(${this.currentPage - 1})">← Previous</button>`;
    }
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
      paginationHTML += `<button onclick="BugTracker.goToPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHTML += '<span class="ellipsis">...</span>';
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === this.currentPage ? 'active' : '';
      paginationHTML += `<button class="${activeClass}" onclick="BugTracker.goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += '<span class="ellipsis">...</span>';
      }
      paginationHTML += `<button onclick="BugTracker.goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (this.currentPage < totalPages) {
      paginationHTML += `<button onclick="BugTracker.goToPage(${this.currentPage + 1})">Next →</button>`;
    }
    
    paginationHTML += '</div>';
    document.getElementById('pagination').innerHTML = paginationHTML;
  }

  goToPage(page) {
    this.currentPage = page;
    this.renderBugs();
    
    // Scroll to top of bug grid
    document.getElementById('bugs-grid').scrollIntoView({ behavior: 'smooth' });
  }

  async viewBug(bugId) {
    try {
      const response = await fetch(`${this.apiBase}/api/bugs/${bugId}`);
      const data = await response.json();
      
      if (data.success) {
        this.currentBug = data.bug;
        this.showBugModal(data.bug);
      } else {
        alert('Failed to load bug details');
      }
    } catch (err) {
      console.error('[BugTracker] Failed to load bug:', err);
      alert('Network error loading bug details');
    }
  }

  showBugModal(bug) {
    const modal = document.getElementById('bug-detail-modal');
    const titleElement = document.getElementById('modal-bug-title');
    const bodyElement = document.getElementById('modal-bug-body');
    const voteCount = document.getElementById('vote-count');
    
    titleElement.textContent = bug.title;
    voteCount.textContent = bug.votes || 0;
    
    const severityIcons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    
    bodyElement.innerHTML = `
      <div class="bug-detail-section">
        <div class="bug-detail-badges">
          <span class="badge severity-${bug.severity}">
            ${severityIcons[bug.severity]} ${bug.severity}
          </span>
          <span class="badge status-${bug.status}">${bug.status}</span>
          <span class="badge category">${bug.category}</span>
        </div>
      </div>
      
      <div class="bug-detail-section">
        <h4>Description</h4>
        <p>${this.escapeHtml(bug.description || 'No description provided')}</p>
      </div>
      
      ${bug.stepsToReproduce && bug.stepsToReproduce.length > 0 ? `
        <div class="bug-detail-section">
          <h4>Steps to Reproduce</h4>
          <ol>
            ${bug.stepsToReproduce.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}
          </ol>
        </div>
      ` : ''}
      
      ${bug.expectedBehavior ? `
        <div class="bug-detail-section">
          <h4>Expected Behavior</h4>
          <p>${this.escapeHtml(bug.expectedBehavior)}</p>
        </div>
      ` : ''}
      
      ${bug.actualBehavior ? `
        <div class="bug-detail-section">
          <h4>Actual Behavior</h4>
          <p>${this.escapeHtml(bug.actualBehavior)}</p>
        </div>
      ` : ''}
      
      <div class="bug-detail-section">
        <h4>Environment</h4>
        <div class="environment-info">
          <div><strong>Browser:</strong> ${bug.environment?.browser || 'Unknown'}</div>
          <div><strong>OS:</strong> ${bug.environment?.os || 'Unknown'}</div>
          <div><strong>Version:</strong> ${bug.environment?.version || '1.0.0'}</div>
        </div>
      </div>
      
      <div class="bug-detail-section">
        <h4>Information</h4>
        <div class="bug-info-grid">
          <div><strong>ID:</strong> ${bug.id}</div>
          <div><strong>Submitted:</strong> ${this.formatDate(bug.submittedAt)}</div>
          <div><strong>Reporter:</strong> ${bug.userName || 'Anonymous'}</div>
          <div><strong>Votes:</strong> 👍 ${bug.votes || 0}</div>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  }

  closeModal() {
    const modal = document.getElementById('bug-detail-modal');
    modal.style.display = 'none';
    this.currentBug = null;
  }

  async voteBug() {
    if (!this.currentBug) return;
    
    try {
      // Get user email (or use anonymous)
      const email = prompt('Enter your email to vote (or leave blank for anonymous):') || 'anonymous';
      
      const response = await fetch(`${this.apiBase}/api/bugs/${this.currentBug.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Vote recorded! Thank you.');
        // Update vote count
        this.currentBug.votes = data.votes;
        document.getElementById('vote-count').textContent = data.votes;
        
        // Reload bugs to update card
        await this.loadBugs();
      } else {
        alert(data.error || 'Failed to record vote');
      }
    } catch (err) {
      console.error('[BugTracker] Vote failed:', err);
      alert('Network error recording vote');
    }
  }

  copyBugLink() {
    if (!this.currentBug) return;
    
    const link = `${window.location.origin}${window.location.pathname}?bug=${this.currentBug.id}`;
    
    navigator.clipboard.writeText(link).then(() => {
      alert('Bug link copied to clipboard!');
    }).catch(() => {
      alert(`Copy this link: ${link}`);
    });
  }

  formatDate(isoString) {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
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
    const container = document.getElementById('bugs-grid');
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn-primary" onclick="BugTracker.loadBugs()">Retry</button>
      </div>
    `;
  }
}

// Global instance
window.BugTracker = new BugTracker();

// Auto-initialize when view is loaded
if (document.getElementById('bugs-grid')) {
  window.BugTracker.init();
}

// Handle direct bug link (e.g. ?bug=bug-123)
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const bugId = params.get('bug');
  if (bugId && window.BugTracker) {
    setTimeout(() => {
      window.BugTracker.viewBug(bugId);
    }, 1000); // Wait for bugs to load
  }
});
