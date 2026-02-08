/**
 * Plugin Marketplace - JavaScript
 * Browse, search, install plugins
 */

class PluginMarketplace {
  constructor() {
    this.apiBase = 'http://192.168.254.4:3030/api/plugins';
    this.plugins = [];
    this.filteredPlugins = [];
    this.currentPage = 1;
    this.pageSize = 12;
    this.currentPlugin = null;
  }

  /**
   * Initialize marketplace
   */
  async init() {
    await this.loadPlugins();
    await this.loadStats();
    this.renderPlugins();
  }

  /**
   * Load all plugins
   */
  async loadPlugins() {
    try {
      const response = await fetch(this.apiBase);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.plugins = data.plugins || [];
      this.filteredPlugins = [...this.plugins];
      
      console.log(`Loaded ${this.plugins.length} plugins`);
    } catch (error) {
      console.error('Failed to load plugins:', error);
      document.getElementById('plugin-grid').innerHTML = 
        '<div class="error">Failed to load plugins. Please try again.</div>';
    }
  }

  /**
   * Load marketplace statistics
   */
  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/meta/stats`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const stats = data.stats;
      
      document.getElementById('stat-total').textContent = stats.totalPlugins;
      document.getElementById('stat-downloads').textContent = stats.totalDownloads.toLocaleString();
      document.getElementById('stat-rating').textContent = stats.averageRating;
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  /**
   * Search plugins
   */
  search() {
    const query = document.getElementById('search-input').value.toLowerCase();
    
    if (!query) {
      this.filteredPlugins = [...this.plugins];
    } else {
      this.filteredPlugins = this.plugins.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
      );
    }
    
    this.currentPage = 1;
    this.renderPlugins();
  }

  /**
   * Apply filters
   */
  applyFilters() {
    const category = document.getElementById('category-filter').value;
    const sort = document.getElementById('sort-filter').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    
    // Filter by category
    let filtered = category 
      ? this.plugins.filter(p => p.category === category)
      : [...this.plugins];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery)))
      );
    }
    
    // Sort
    if (sort === 'downloads') {
      filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sort === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'updated') {
      filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    
    this.filteredPlugins = filtered;
    this.currentPage = 1;
    this.renderPlugins();
  }

  /**
   * Render plugin grid
   */
  renderPlugins() {
    const grid = document.getElementById('plugin-grid');
    
    if (this.filteredPlugins.length === 0) {
      grid.innerHTML = '<div class="empty-state">No plugins found</div>';
      document.getElementById('pagination').style.display = 'none';
      return;
    }
    
    // Pagination
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pagePlugins = this.filteredPlugins.slice(start, end);
    const totalPages = Math.ceil(this.filteredPlugins.length / this.pageSize);
    
    // Render plugin cards
    grid.innerHTML = pagePlugins.map(plugin => this.renderPluginCard(plugin)).join('');
    
    // Update pagination
    if (totalPages > 1) {
      document.getElementById('pagination').style.display = 'flex';
      document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${totalPages}`;
    } else {
      document.getElementById('pagination').style.display = 'none';
    }
  }

  /**
   * Render individual plugin card
   */
  renderPluginCard(plugin) {
    const rating = plugin.rating ? '★'.repeat(Math.round(plugin.rating)) + '☆'.repeat(5 - Math.round(plugin.rating)) : '☆☆☆☆☆';
    
    return `
      <div class="plugin-card" onclick="PluginMarketplace.openPluginModal('${plugin.id}')">
        <div class="plugin-card-header">
          <h3>${this.escapeHtml(plugin.name)}</h3>
          <span class="badge badge-${plugin.category}">${plugin.category}</span>
        </div>
        <p class="plugin-card-description">${this.escapeHtml(plugin.description)}</p>
        <div class="plugin-card-footer">
          <div class="plugin-stats-mini">
            <span>📥 ${plugin.downloads || 0}</span>
            <span>${rating} (${plugin.reviews?.length || 0})</span>
          </div>
          <span class="plugin-version">v${plugin.version}</span>
        </div>
        ${plugin.verified ? '<div class="verified-badge">✓ Verified</div>' : ''}
      </div>
    `;
  }

  /**
   * Open plugin detail modal
   */
  async openPluginModal(pluginId) {
    try {
      const response = await fetch(`${this.apiBase}/${pluginId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.currentPlugin = data.plugin;
      
      // Populate modal
      document.getElementById('modal-plugin-name').textContent = this.currentPlugin.name;
      document.getElementById('modal-category').textContent = this.currentPlugin.category;
      document.getElementById('modal-category').className = `badge badge-${this.currentPlugin.category}`;
      document.getElementById('modal-version').textContent = `v${this.currentPlugin.version}`;
      document.getElementById('modal-author').textContent = `by ${this.currentPlugin.author}`;
      document.getElementById('modal-downloads').textContent = `${this.currentPlugin.downloads || 0} downloads`;
      
      const rating = this.currentPlugin.rating 
        ? `${'★'.repeat(Math.round(this.currentPlugin.rating))}${'☆'.repeat(5 - Math.round(this.currentPlugin.rating))} (${this.currentPlugin.reviews?.length || 0})`
        : 'No ratings yet';
      document.getElementById('modal-rating').textContent = rating;
      
      document.getElementById('modal-description').textContent = this.currentPlugin.description;
      
      // Tags
      const tagsHtml = (this.currentPlugin.tags || []).map(tag => 
        `<span class="tag">${tag}</span>`
      ).join('');
      document.getElementById('modal-tags').innerHTML = tagsHtml;
      
      // Screenshots
      if (this.currentPlugin.screenshots && this.currentPlugin.screenshots.length > 0) {
        const screenshotsHtml = this.currentPlugin.screenshots.map(url =>
          `<img src="${url}" alt="Screenshot" />`
        ).join('');
        document.getElementById('modal-screenshots').innerHTML = screenshotsHtml;
      } else {
        document.getElementById('modal-screenshots').innerHTML = '';
      }
      
      // README
      document.getElementById('modal-readme').innerHTML = this.currentPlugin.readme 
        ? `<pre>${this.escapeHtml(this.currentPlugin.readme)}</pre>`
        : '<p class="text-muted">No documentation available</p>';
      
      // Reviews
      this.renderReviews();
      
      // Show modal
      document.getElementById('plugin-modal').style.display = 'flex';
    } catch (error) {
      console.error('Failed to load plugin:', error);
      alert('Failed to load plugin details');
    }
  }

  /**
   * Render reviews
   */
  renderReviews() {
    const reviews = this.currentPlugin.reviews || [];
    const reviewsHtml = reviews.length > 0
      ? reviews.map(review => `
          <div class="review">
            <div class="review-header">
              <span class="review-author">${this.escapeHtml(review.userName)}</span>
              <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
            </div>
            <p class="review-comment">${this.escapeHtml(review.comment)}</p>
            <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
        `).join('')
      : '<p class="text-muted">No reviews yet. Be the first to review!</p>';
    
    document.getElementById('modal-reviews').innerHTML = reviewsHtml;
  }

  /**
   * Close plugin modal
   */
  closeModal() {
    document.getElementById('plugin-modal').style.display = 'none';
    this.currentPlugin = null;
  }

  /**
   * Install plugin
   */
  async installPlugin() {
    if (!this.currentPlugin) return;
    
    // Track download
    try {
      await fetch(`${this.apiBase}/${this.currentPlugin.id}/download`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }
    
    // Show install instructions
    const installCmd = this.currentPlugin.npmPackage
      ? `npm install ${this.currentPlugin.npmPackage}`
      : `git clone ${this.currentPlugin.repository}`;
    
    alert(`Install Instructions:\n\n${installCmd}\n\nThen add to config.json:\n{\n  "plugins": ["${this.currentPlugin.name}"]\n}`);
  }

  /**
   * View repository
   */
  viewRepository() {
    if (this.currentPlugin && this.currentPlugin.repository) {
      window.open(this.currentPlugin.repository, '_blank');
    } else {
      alert('No repository URL available');
    }
  }

  /**
   * Show submit modal
   */
  showSubmitModal() {
    document.getElementById('submit-modal').style.display = 'flex';
  }

  /**
   * Close submit modal
   */
  closeSubmitModal() {
    document.getElementById('submit-modal').style.display = 'none';
    document.getElementById('submit-form').reset();
  }

  /**
   * Submit plugin
   */
  async submitPlugin(event) {
    event.preventDefault();
    
    const plugin = {
      name: document.getElementById('submit-name').value,
      version: document.getElementById('submit-version').value,
      description: document.getElementById('submit-description').value,
      author: document.getElementById('submit-author').value,
      category: document.getElementById('submit-category').value,
      tags: document.getElementById('submit-tags').value.split(',').map(t => t.trim()).filter(t => t),
      repository: document.getElementById('submit-repository').value,
      npmPackage: document.getElementById('submit-npm').value
    };
    
    try {
      const response = await fetch(this.apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plugin)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      alert('Plugin submitted for review! You\'ll be notified when it\'s approved.');
      this.closeSubmitModal();
      await this.loadPlugins();
      this.renderPlugins();
    } catch (error) {
      console.error('Failed to submit plugin:', error);
      alert('Failed to submit plugin. Please try again.');
    }
  }

  /**
   * Show my plugins
   */
  showMyPlugins() {
    // TODO: Filter by current user
    alert('My Plugins feature coming soon!');
  }

  /**
   * Show review form
   */
  showReviewForm() {
    const rating = prompt('Rate this plugin (1-5 stars):');
    if (!rating || rating < 1 || rating > 5) {
      alert('Invalid rating. Please enter 1-5.');
      return;
    }
    
    const comment = prompt('Write a review (optional):');
    
    this.submitReview(Number(rating), comment);
  }

  /**
   * Submit review
   */
  async submitReview(rating, comment) {
    if (!this.currentPlugin) return;
    
    try {
      const response = await fetch(`${this.apiBase}/${this.currentPlugin.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      alert('Review submitted! Thank you for your feedback.');
      
      // Reload plugin details
      await this.openPluginModal(this.currentPlugin.id);
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    }
  }

  /**
   * Pagination
   */
  nextPage() {
    const totalPages = Math.ceil(this.filteredPlugins.length / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderPlugins();
      window.scrollTo(0, 0);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPlugins();
      window.scrollTo(0, 0);
    }
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global instance
const pluginMarketplace = new PluginMarketplace();
window.PluginMarketplace = pluginMarketplace;

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pluginMarketplace.init();
    
    // Setup submit form handler
    document.getElementById('submit-form').addEventListener('submit', (e) => {
      pluginMarketplace.submitPlugin(e);
    });
  });
} else {
  pluginMarketplace.init();
  document.getElementById('submit-form').addEventListener('submit', (e) => {
    pluginMarketplace.submitPlugin(e);
  });
}
