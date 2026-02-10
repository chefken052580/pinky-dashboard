// Plugin Marketplace UI — Browse, search, and install plugins
// Features: plugin discovery, installation, reviews, ratings

(function initPluginMarketplace() {
  const marketplaceHTML = `
    <div id="plugin-marketplace-container" class="plugin-marketplace">
      <div class="marketplace-header">
        <h1>🔌 Plugin Marketplace</h1>
        <p class="marketplace-subtitle">Discover and install plugins to extend PinkyBot</p>
      </div>

      <div class="marketplace-controls">
        <input type="text" id="plugin-search" placeholder="Search plugins..." class="search-input">
        <select id="plugin-category-filter" class="filter-select">
          <option value="">All Categories</option>
          <option value="analytics">Analytics</option>
          <option value="automation">Automation</option>
          <option value="integration">Integration</option>
          <option value="security">Security</option>
          <option value="productivity">Productivity</option>
          <option value="entertainment">Entertainment</option>
        </select>
        <select id="plugin-sort-select" class="sort-select">
          <option value="popularity">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="rating">Highest Rated</option>
          <option value="updates">Recently Updated</option>
        </select>
      </div>

      <div class="marketplace-tabs">
        <button class="marketplace-tab active" data-tab="available">Available</button>
        <button class="marketplace-tab" data-tab="installed">Installed</button>
        <button class="marketplace-tab" data-tab="my-plugins">My Plugins</button>
      </div>

      <!-- Available Plugins Tab -->
      <div id="available-tab" class="marketplace-tab-content active">
        <div id="plugins-grid" class="plugins-grid">
          <div class="loading">Loading plugins...</div>
        </div>
      </div>

      <!-- Installed Plugins Tab -->
      <div id="installed-tab" class="marketplace-tab-content">
        <div id="installed-plugins-list" class="installed-list">
          <div class="loading">Loading installed plugins...</div>
        </div>
      </div>

      <!-- My Plugins Tab -->
      <div id="my-plugins-tab" class="marketplace-tab-content">
        <div class="my-plugins-section">
          <h3>Your Published Plugins</h3>
          <button id="publish-plugin-btn" class="btn-primary">📤 Publish New Plugin</button>
          <div id="my-plugins-list" class="my-plugins-list">
            <p class="placeholder">You haven't published any plugins yet</p>
          </div>
        </div>
      </div>

      <!-- Plugin Detail Modal -->
      <div id="plugin-detail-modal" class="modal hidden">
        <div class="modal-content">
          <button class="modal-close">&times;</button>
          <div class="plugin-detail">
            <div class="plugin-header">
              <img id="plugin-icon" src="" alt="Plugin Icon" class="plugin-icon">
              <div class="plugin-info">
                <h2 id="plugin-name"></h2>
                <p id="plugin-author">By <span></span></p>
                <div class="plugin-meta">
                  <span id="plugin-version" class="badge">v1.0.0</span>
                  <span id="plugin-category" class="badge badge-category"></span>
                </div>
              </div>
              <div class="plugin-actions">
                <button id="plugin-install-btn" class="btn-primary">Install</button>
                <button id="plugin-uninstall-btn" class="btn-danger hidden">Uninstall</button>
              </div>
            </div>

            <div class="plugin-description">
              <p id="plugin-long-description"></p>
            </div>

            <div class="plugin-stats">
              <div class="stat">
                <div class="stat-label">Downloads</div>
                <div id="plugin-downloads" class="stat-value">0</div>
              </div>
              <div class="stat">
                <div class="stat-label">Rating</div>
                <div id="plugin-rating" class="stat-value">0/5 ⭐</div>
              </div>
              <div class="stat">
                <div class="stat-label">Reviews</div>
                <div id="plugin-reviews-count" class="stat-value">0</div>
              </div>
              <div class="stat">
                <div class="stat-label">Updated</div>
                <div id="plugin-updated" class="stat-value">-</div>
              </div>
            </div>

            <div class="plugin-features">
              <h3>Features</h3>
              <ul id="plugin-features-list"></ul>
            </div>

            <div class="plugin-reviews">
              <h3>Reviews (<span id="reviews-count">0</span>)</h3>
              <div id="reviews-list" class="reviews-list">
                <p class="placeholder">No reviews yet</p>
              </div>
            </div>

            <div class="plugin-settings">
              <h3>Configuration</h3>
              <div id="plugin-settings-form" class="settings-form"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  function initMarketplace() {
    const container = document.getElementById('plugin-marketplace-container');
    
    if (container) {
      // Tab switching
      document.querySelectorAll('.marketplace-tab').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
      });

      // Search and filter
      document.getElementById('plugin-search').addEventListener('input', filterPlugins);
      document.getElementById('plugin-category-filter').addEventListener('change', filterPlugins);
      document.getElementById('plugin-sort-select').addEventListener('change', sortPlugins);

      // Modal close
      document.querySelector('.modal-close').addEventListener('click', closePluginModal);
      document.getElementById('plugin-detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'plugin-detail-modal') closePluginModal();
      });

      // Load marketplace data
      loadMarketplacePlugins();
      loadInstalledPlugins();
    }
  }

  async function loadMarketplacePlugins() {
    try {
      const res = await fetch('/api/plugins/marketplace');
      const data = await res.json();
      const grid = document.getElementById('plugins-grid');

      if (data.plugins && data.plugins.length > 0) {
        grid.innerHTML = data.plugins.map(plugin => `
          <div class="plugin-card" onclick="showPluginDetail('${plugin.id}')">
            <div class="plugin-card-icon">
              <img src="${plugin.icon || '/assets/plugin-default.png'}" alt="${plugin.name}">
            </div>
            <h3>${plugin.name}</h3>
            <p class="plugin-card-description">${plugin.description}</p>
            <div class="plugin-card-meta">
              <span class="badge badge-category">${plugin.category}</span>
              <span class="rating">⭐ ${plugin.rating || 0}/5</span>
            </div>
            <div class="plugin-card-actions">
              <span class="downloads">📥 ${plugin.downloads || 0}</span>
              <button class="btn-sm" onclick="installPlugin(event, '${plugin.id}')">Install</button>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load marketplace plugins:', err);
    }
  }

  async function loadInstalledPlugins() {
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      const list = document.getElementById('installed-plugins-list');

      if (data.plugins && data.plugins.length > 0) {
        list.innerHTML = data.plugins
          .filter(p => p.installed)
          .map(plugin => `
            <div class="installed-plugin">
              <div class="installed-plugin-info">
                <h4>${plugin.name}</h4>
                <p>${plugin.description}</p>
                <div class="plugin-version">v${plugin.version}</div>
              </div>
              <div class="installed-plugin-status">
                <span class="status-badge ${plugin.enabled ? 'enabled' : 'disabled'}">
                  ${plugin.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div class="installed-plugin-actions">
                ${plugin.enabled ? 
                  `<button class="btn-sm" onclick="disablePlugin('${plugin.id}')">Disable</button>` :
                  `<button class="btn-sm" onclick="enablePlugin('${plugin.id}')">Enable</button>`
                }
                <button class="btn-sm btn-danger" onclick="uninstallPlugin('${plugin.id}')">Uninstall</button>
              </div>
            </div>
          `).join('');
      }
    } catch (err) {
      console.error('Failed to load installed plugins:', err);
    }
  }

  function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.marketplace-tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.marketplace-tab').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');

    // Load data for tab
    if (tabName === 'installed') loadInstalledPlugins();
  }

  function filterPlugins() {
    const searchTerm = document.getElementById('plugin-search').value.toLowerCase();
    const category = document.getElementById('plugin-category-filter').value;

    document.querySelectorAll('.plugin-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      const pluginCategory = card.dataset.category;
      
      const matchesSearch = text.includes(searchTerm);
      const matchesCategory = !category || pluginCategory === category;

      card.style.display = (matchesSearch && matchesCategory) ? '' : 'none';
    });
  }

  function sortPlugins() {
    const sortBy = document.getElementById('plugin-sort-select').value;
    const grid = document.getElementById('plugins-grid');
    const cards = Array.from(grid.querySelectorAll('.plugin-card'));

    cards.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.dataset.publishDate) - new Date(a.dataset.publishDate);
        case 'rating':
          return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
        case 'updates':
          return new Date(b.dataset.updated) - new Date(a.dataset.updated);
        case 'popularity':
        default:
          return parseInt(b.dataset.downloads) - parseInt(a.dataset.downloads);
      }
    });

    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
  }

  async function showPluginDetail(pluginId) {
    try {
      const res = await fetch('/api/plugins/' + pluginId);
      const plugin = await res.json();

      document.getElementById('plugin-name').textContent = plugin.name;
      document.getElementById('plugin-author').textContent = 'By ' + plugin.author;
      document.getElementById('plugin-version').textContent = 'v' + plugin.version;
      document.getElementById('plugin-long-description').textContent = plugin.description;
      document.getElementById('plugin-downloads').textContent = (plugin.downloads || 0).toLocaleString();
      document.getElementById('plugin-rating').textContent = (plugin.rating || 0) + '/5 ⭐';
      document.getElementById('plugin-reviews-count').textContent = plugin.reviews || 0;
      document.getElementById('plugin-updated').textContent = new Date(plugin.updated).toLocaleDateString();

      // Features list
      if (plugin.features && plugin.features.length > 0) {
        document.getElementById('plugin-features-list').innerHTML = plugin.features
          .map(f => '<li>' + f + '</li>')
          .join('');
      }

      // Update button states
      if (plugin.installed) {
        document.getElementById('plugin-install-btn').classList.add('hidden');
        document.getElementById('plugin-uninstall-btn').classList.remove('hidden');
      } else {
        document.getElementById('plugin-install-btn').classList.remove('hidden');
        document.getElementById('plugin-uninstall-btn').classList.add('hidden');
      }

      document.getElementById('plugin-detail-modal').classList.remove('hidden');
    } catch (err) {
      console.error('Failed to load plugin details:', err);
    }
  }

  function closePluginModal() {
    document.getElementById('plugin-detail-modal').classList.add('hidden');
  }

  async function installPlugin(event, pluginId) {
    event.stopPropagation();
    try {
      const res = await fetch('/api/plugins/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId, source: 'marketplace' })
      });

      if (res.ok) {
        alert('Plugin installed successfully');
        loadMarketplacePlugins();
      }
    } catch (err) {
      alert('Failed to install plugin');
    }
  }

  async function uninstallPlugin(pluginId) {
    if (confirm('Uninstall this plugin?')) {
      try {
        const res = await fetch('/api/plugins/' + pluginId, { method: 'DELETE' });
        if (res.ok) {
          loadInstalledPlugins();
        }
      } catch (err) {
        alert('Failed to uninstall plugin');
      }
    }
  }

  async function enablePlugin(pluginId) {
    try {
      const res = await fetch('/api/plugins/' + pluginId + '/enable', { method: 'POST' });
      if (res.ok) loadInstalledPlugins();
    } catch (err) {
      alert('Failed to enable plugin');
    }
  }

  async function disablePlugin(pluginId) {
    try {
      const res = await fetch('/api/plugins/' + pluginId + '/disable', { method: 'POST' });
      if (res.ok) loadInstalledPlugins();
    } catch (err) {
      alert('Failed to disable plugin');
    }
  }

  // Make functions globally available
  window.showPluginDetail = showPluginDetail;
  window.installPlugin = installPlugin;
  window.uninstallPlugin = uninstallPlugin;
  window.enablePlugin = enablePlugin;
  window.disablePlugin = disablePlugin;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarketplace);
  } else {
    initMarketplace();
  }

  return { html: marketplaceHTML };
})();
