/**
 * WordPress Manager - Frontend Controller
 * Manages WordPress site connections and content creation
 */

const API_BASE = 'http://192.168.254.4:3030';

// WordPress Manager State
const WordPressManager = {
  connections: [],
  companies: [],
  activeConnection: null,
  categories: [],
  tags: [],

  // Initialize WordPress Manager
  async init() {
    console.log('[WordPress Manager] Initializing...');
    
    await this.loadCompanies();
    await this.loadConnections();
    
    // Show/hide sections based on connections
    this.updateUI();
    
    console.log('[WordPress Manager] Initialized');
  },

  // Load companies from API
  async loadCompanies() {
    try {
      const response = await fetch(`${API_BASE}/api/companies`);
      const data = await response.json();
      
      if (data.success) {
        this.companies = data.companies || [];
        console.log(`[WordPress Manager] Loaded ${this.companies.length} companies`);
        this.populateCompanyDropdowns();
      }
    } catch (err) {
      console.error('[WordPress Manager] Error loading companies:', err);
    }
  },

  // Load WordPress connections
  async loadConnections() {
    try {
      const companyId = localStorage.getItem('pinky_active_company');
      const url = companyId 
        ? `${API_BASE}/api/wordpress/connections?companyId=${companyId}`
        : `${API_BASE}/api/wordpress/connections`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        this.connections = data.connections || [];
        console.log(`[WordPress Manager] Loaded ${this.connections.length} connections`);
        this.renderConnections();
      }
    } catch (err) {
      console.error('[WordPress Manager] Error loading connections:', err);
    }
  },

  // Populate company dropdowns
  populateCompanyDropdowns() {
    const dropdown = document.getElementById('wp-connect-company');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Select company...</option>';
    
    this.companies.forEach(company => {
      const option = document.createElement('option');
      option.value = company.id;
      option.textContent = company.name;
      dropdown.appendChild(option);
    });

    // Pre-select active company if available
    const activeCompanyId = localStorage.getItem('pinky_active_company');
    if (activeCompanyId) {
      dropdown.value = activeCompanyId;
    }
  },

  // Render connections list
  renderConnections() {
    const container = document.getElementById('wp-connections-list');
    const noConnections = document.getElementById('wp-no-connections');
    
    if (this.connections.length === 0) {
      container.style.display = 'none';
      noConnections.style.display = 'block';
      return;
    }
    
    container.style.display = 'grid';
    noConnections.style.display = 'none';
    container.innerHTML = '';
    
    this.connections.forEach(connection => {
      const card = document.createElement('div');
      card.className = 'wp-connection-card';
      card.innerHTML = `
        <div class="wp-connection-header">
          <div>
            <h4 class="wp-connection-name">${this.escapeHtml(connection.name)}</h4>
            <p class="wp-connection-url">${this.escapeHtml(connection.siteUrl)}</p>
          </div>
          <span class="wp-connection-status ${connection.status}">
            ${connection.status === 'active' ? '✓ Active' : '⚠ Error'}
          </span>
        </div>
        
        <div class="wp-connection-info">
          <div class="wp-connection-info-row">
            <span>Username:</span>
            <strong>${this.escapeHtml(connection.username)}</strong>
          </div>
          <div class="wp-connection-info-row">
            <span>Last Tested:</span>
            <strong>${this.formatDate(connection.lastTested)}</strong>
          </div>
        </div>
        
        <div class="wp-connection-actions">
          <button class="btn-edit" onclick="WordPressManager.selectConnection('${connection.id}')">
            Use This Site
          </button>
          <button class="btn-delete" onclick="WordPressManager.deleteConnection('${connection.id}')">
            Delete
          </button>
        </div>
      `;
      
      container.appendChild(card);
    });
    
    // Populate builder connection dropdown
    this.populateBuilderConnectionDropdown();
  },

  // Populate builder connection dropdown
  populateBuilderConnectionDropdown() {
    const dropdown = document.getElementById('wp-builder-connection');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Select a connected site...</option>';
    
    this.connections.forEach(connection => {
      const option = document.createElement('option');
      option.value = connection.id;
      option.textContent = `${connection.name} (${connection.siteUrl})`;
      dropdown.appendChild(option);
    });

    // Populate filter dropdown too
    const filterDropdown = document.getElementById('wp-content-filter-site');
    if (filterDropdown) {
      filterDropdown.innerHTML = '<option value="">All Sites</option>';
      this.connections.forEach(connection => {
        const option = document.createElement('option');
        option.value = connection.id;
        option.textContent = connection.name;
        filterDropdown.appendChild(option);
      });
    }
  },

  // Select connection for content creation
  async selectConnection(connectionId) {
    this.activeConnection = connectionId;
    
    // Load categories and tags for this connection
    await this.loadCategories(connectionId);
    await this.loadTags(connectionId);
    
    // Show builder section
    document.getElementById('wp-builder-section').style.display = 'block';
    document.getElementById('wp-content-section').style.display = 'block';
    
    // Pre-select connection in dropdown
    document.getElementById('wp-builder-connection').value = connectionId;
    
    // Scroll to builder
    document.getElementById('wp-builder-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log(`[WordPress Manager] Selected connection: ${connectionId}`);
  },

  // Load categories from WordPress
  async loadCategories(connectionId) {
    try {
      const response = await fetch(`${API_BASE}/api/wordpress/categories?connectionId=${connectionId}`);
      const data = await response.json();
      
      if (data.success) {
        this.categories = data.categories || [];
        this.renderCategories();
        console.log(`[WordPress Manager] Loaded ${this.categories.length} categories`);
      }
    } catch (err) {
      console.error('[WordPress Manager] Error loading categories:', err);
    }
  },

  // Render categories as checkboxes
  renderCategories() {
    const container = document.getElementById('wp-categories-container');
    if (!container) return;
    
    if (this.categories.length === 0) {
      container.innerHTML = '<p class="form-hint">No categories available. Create some in WordPress first.</p>';
      return;
    }
    
    container.innerHTML = '';
    
    this.categories.forEach(category => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" name="wp-category" value="${category.id}">
        <span>${this.escapeHtml(category.name)} (${category.count})</span>
      `;
      container.appendChild(label);
    });
  },

  // Load tags from WordPress
  async loadTags(connectionId) {
    try {
      const response = await fetch(`${API_BASE}/api/wordpress/tags?connectionId=${connectionId}`);
      const data = await response.json();
      
      if (data.success) {
        this.tags = data.tags || [];
        console.log(`[WordPress Manager] Loaded ${this.tags.length} tags`);
      }
    } catch (err) {
      console.error('[WordPress Manager] Error loading tags:', err);
    }
  },

  // Update UI based on state
  updateUI() {
    const hasConnections = this.connections.length > 0;
    
    // Show/hide builder and content sections
    document.getElementById('wp-builder-section').style.display = hasConnections ? 'none' : 'none'; // Hidden until connection selected
    document.getElementById('wp-content-section').style.display = hasConnections ? 'none' : 'none'; // Hidden until connection selected
  },

  // Delete connection
  async deleteConnection(connectionId) {
    if (!confirm('Are you sure you want to delete this WordPress connection?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/wordpress/connections/${connectionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('WordPress connection deleted successfully!');
        await this.loadConnections();
      } else {
        alert('Error: ' + (data.error || 'Failed to delete connection'));
      }
    } catch (err) {
      alert('Error deleting connection: ' + err.message);
    }
  },

  // Utility: Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Utility: Format date
  formatDate(isoString) {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Global Functions (called from HTML)

function showConnectModal() {
  document.getElementById('wp-connect-modal').style.display = 'flex';
}

function closeConnectModal() {
  document.getElementById('wp-connect-modal').style.display = 'none';
  document.getElementById('wp-connect-form').reset();
}

async function saveWordPressConnection() {
  const companyId = document.getElementById('wp-connect-company').value;
  const name = document.getElementById('wp-connect-name').value.trim();
  const siteUrl = document.getElementById('wp-connect-url').value.trim();
  const username = document.getElementById('wp-connect-username').value.trim();
  const appPassword = document.getElementById('wp-connect-password').value.trim();
  
  // Validation
  if (!companyId) {
    alert('Please select a company');
    return;
  }
  if (!name || name.length < 2) {
    alert('Connection name must be at least 2 characters');
    return;
  }
  if (!siteUrl || !siteUrl.startsWith('http')) {
    alert('Please enter a valid site URL (must start with https://)');
    return;
  }
  if (!username) {
    alert('WordPress username is required');
    return;
  }
  if (!appPassword) {
    alert('Application password is required');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/wordpress/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, name, siteUrl, username, appPassword })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`WordPress site connected successfully!\nStatus: ${data.status}`);
      closeConnectModal();
      await WordPressManager.loadConnections();
    } else {
      alert('Connection Error:\n' + (data.error || 'Failed to connect to WordPress'));
    }
  } catch (err) {
    alert('Error connecting WordPress site: ' + err.message);
  }
}

async function createWordPressContent() {
  const connectionId = document.getElementById('wp-builder-connection').value;
  const title = document.getElementById('wp-builder-title').value.trim();
  const content = document.getElementById('wp-builder-content').value.trim();
  const excerpt = document.getElementById('wp-builder-excerpt').value.trim();
  const status = document.getElementById('wp-builder-status').value;
  const keywords = document.getElementById('wp-builder-keywords').value.trim();
  const tags = document.getElementById('wp-builder-tags').value.trim();
  
  const contentType = document.querySelector('input[name="wp-content-type"]:checked').value;
  
  // Get selected categories
  const categoryCheckboxes = document.querySelectorAll('input[name="wp-category"]:checked');
  const categories = Array.from(categoryCheckboxes).map(cb => parseInt(cb.value));
  
  // Validation
  if (!connectionId) {
    alert('Please select a WordPress site from the dropdown');
    return;
  }
  if (!title) {
    alert('Title is required');
    return;
  }
  if (!content) {
    alert('Content is required');
    return;
  }
  if (title.length > 60) {
    if (!confirm('Title is over 60 characters, which may be truncated in search results. Continue anyway?')) {
      return;
    }
  }
  if (content.split(/\s+/).length < 300) {
    if (!confirm('Content is under 300 words. Longer content typically ranks better for SEO. Continue anyway?')) {
      return;
    }
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/wordpress/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId,
        title,
        content,
        excerpt,
        status,
        type: contentType,
        categories,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        yoastMeta: {
          focusKeyword: keywords.split(',')[0] || '',
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k)
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`✅ Content created successfully!\n\nTitle: ${data.title}\nStatus: ${data.status}\nLink: ${data.link}`);
      
      // Reset form
      resetBuilderForm();
      
      // Reload content list
      await loadWordPressContent();
    } else {
      alert('Error creating content:\n' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Error creating WordPress content: ' + err.message);
  }
}

function resetBuilderForm() {
  document.getElementById('wp-builder-title').value = '';
  document.getElementById('wp-builder-keywords').value = '';
  document.getElementById('wp-builder-content').value = '';
  document.getElementById('wp-builder-excerpt').value = '';
  document.getElementById('wp-builder-tags').value = '';
  document.getElementById('wp-builder-status').value = 'draft';
  
  // Uncheck all categories
  document.querySelectorAll('input[name="wp-category"]').forEach(cb => cb.checked = false);
  
  // Reset radio to post
  document.querySelector('input[name="wp-content-type"][value="post"]').checked = true;
}

async function loadWordPressContent() {
  const connectionId = document.getElementById('wp-builder-connection').value;
  
  if (!connectionId) {
    alert('Please select a WordPress site first');
    return;
  }
  
  const status = document.getElementById('wp-content-filter-status').value;
  const type = document.querySelector('input[name="wp-content-type"]:checked').value;
  
  try {
    let url = `${API_BASE}/api/wordpress/posts?connectionId=${connectionId}&type=${type}&per_page=20`;
    if (status) url += `&status=${status}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      renderWordPressContent(data.posts || []);
    } else {
      alert('Error loading content: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Error loading WordPress content: ' + err.message);
  }
}

function renderWordPressContent(posts) {
  const container = document.getElementById('wp-content-list');
  
  if (posts.length === 0) {
    container.innerHTML = '<p class="form-hint" style="text-align: center; padding: 40px;">No content found</p>';
    return;
  }
  
  container.innerHTML = '';
  
  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'wp-content-card';
    card.innerHTML = `
      <h4 class="wp-content-title">${post.title}</h4>
      <p class="wp-content-excerpt">${post.excerpt.replace(/<[^>]*>/g, '').substring(0, 150)}...</p>
      <div class="wp-content-meta">
        <span class="wp-content-status ${post.status}">${post.status}</span>
        <a href="${post.link}" target="_blank" class="wp-content-link">View →</a>
      </div>
    `;
    container.appendChild(card);
  });
}

// Initialize WordPress Manager when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WordPressManager.init());
} else {
  WordPressManager.init();
}

// Re-init when company changes
window.addEventListener('companyChanged', () => {
  console.log('[WordPress Manager] Company changed, reloading connections...');
  WordPressManager.loadConnections();
});
