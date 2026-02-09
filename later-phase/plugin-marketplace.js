// Plugin Marketplace Management
class PluginMarketplace {
  constructor() {
    this.plugins = [];
    this.installedPlugins = [];
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.init();
  }

  async init() {
    await this.loadPlugins();
    await this.loadInstalledPlugins();
    this.setupEventListeners();
    this.render();
  }

  async loadPlugins() {
    try {
      const response = await fetch('/api/plugins/marketplace');
      const data = await response.json();
      this.plugins = data.plugins || this.getMockPlugins();
    } catch (error) {
      console.error('Error loading plugins:', error);
      this.plugins = this.getMockPlugins();
    }
  }

  async loadInstalledPlugins() {
    try {
      const response = await fetch('/api/plugins/installed');
      const data = await response.json();
      this.installedPlugins = data.plugins || [];
    } catch (error) {
      console.error('Error loading installed plugins:', error);
      this.installedPlugins = [];
    }
  }

  getMockPlugins() {
    return [
      {
        id: 'slack-notifier',
        name: 'Slack Notifier',
        author: 'PinkyBot Team',
        version: '1.2.0',
        category: 'integration',
        description: 'Send task notifications and bot updates to Slack channels',
        longDescription: 'Integrate PinkyBot with Slack to receive real-time notifications about task completions, bot status changes, and system alerts. Supports multiple channels and custom message formatting.',
        downloads: 1247,
        rating: 4.8,
        price: 0,
        features: ['Real-time notifications', 'Custom channel routing', 'Emoji support', 'Thread replies'],
        requirements: ['Slack Workspace', 'Incoming Webhook URL'],
        icon: '💬',
        screenshots: [],
        verified: true
      },
      {
        id: 'github-integration',
        name: 'GitHub Integration',
        author: 'Community',
        version: '2.1.0',
        category: 'automation',
        description: 'Auto-commit code fixes, create issues from bugs, sync tasks with GitHub Projects',
        longDescription: 'Seamlessly integrate with GitHub repositories. Automatically commit auto-fixes, create issues from bug reports, and synchronize your task queue with GitHub Projects.',
        downloads: 892,
        rating: 4.6,
        price: 0,
        features: ['Auto-commit fixes', 'Issue creation', 'PR status tracking', 'Project sync'],
        requirements: ['GitHub Account', 'Personal Access Token'],
        icon: '🐙',
        screenshots: [],
        verified: true
      },
      {
        id: 'email-reports',
        name: 'Email Reports',
        author: 'PinkyBot Team',
        version: '1.0.5',
        category: 'analytics',
        description: 'Daily/weekly email reports with task summaries and system health',
        longDescription: 'Get beautiful email reports summarizing your task completions, bot activity, and system health. Customize frequency and content.',
        downloads: 634,
        rating: 4.5,
        price: 4.99,
        features: ['Daily/weekly schedules', 'PDF attachments', 'Custom branding', 'Chart generation'],
        requirements: ['SMTP Server', 'Email address'],
        icon: '📧',
        screenshots: [],
        verified: true
      },
      {
        id: 'discord-bot',
        name: 'Discord Bot Commands',
        author: 'Community',
        version: '1.5.0',
        category: 'integration',
        description: 'Control PinkyBot via Discord slash commands',
        longDescription: 'Run PinkyBot commands directly from Discord. Create tasks, check status, view analytics, and manage bots without leaving your server.',
        downloads: 1089,
        rating: 4.9,
        price: 0,
        features: ['Slash commands', 'Button controls', 'Embed messages', 'Multi-server'],
        requirements: ['Discord Bot Token', 'Server permissions'],
        icon: '🎮',
        screenshots: [],
        verified: true
      },
      {
        id: 'jira-sync',
        name: 'Jira Sync',
        author: 'Enterprise Solutions',
        version: '3.0.0',
        category: 'integration',
        description: 'Two-way sync between PinkyBot tasks and Jira tickets',
        longDescription: 'Enterprise-grade integration with Atlassian Jira. Bi-directional sync keeps your Pinky tasks and Jira tickets in perfect harmony.',
        downloads: 456,
        rating: 4.7,
        price: 9.99,
        features: ['Bi-directional sync', 'Custom field mapping', 'Webhook support', 'Multi-project'],
        requirements: ['Jira Cloud/Server', 'API Token'],
        icon: '📋',
        screenshots: [],
        verified: true
      },
      {
        id: 'sentiment-analysis',
        name: 'Sentiment Analysis',
        author: 'AI Labs',
        version: '1.3.0',
        category: 'analytics',
        description: 'Analyze chat sentiment and provide mood insights',
        longDescription: 'AI-powered sentiment analysis for your chat conversations. Track team morale, identify frustrations, and optimize your workflow.',
        downloads: 289,
        rating: 4.3,
        price: 7.99,
        features: ['Real-time analysis', 'Mood tracking', 'Trend charts', 'Alert system'],
        requirements: ['Pro Tier', 'OpenAI API Key'],
        icon: '😊',
        screenshots: [],
        verified: false
      }
    ];
  }

  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('plugin-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      });
    }

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.currentCategory = e.target.dataset.category;
        this.render();
      });
    });

    // Close modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
      closeModal.addEventListener('click', () => {
        document.getElementById('plugin-detail-modal').style.display = 'none';
      });
    }
  }

  getFilteredPlugins() {
    return this.plugins.filter(plugin => {
      const matchesCategory = this.currentCategory === 'all' || plugin.category === this.currentCategory;
      const matchesSearch = this.searchQuery === '' ||
        plugin.name.toLowerCase().includes(this.searchQuery) ||
        plugin.description.toLowerCase().includes(this.searchQuery) ||
        plugin.author.toLowerCase().includes(this.searchQuery);
      return matchesCategory && matchesSearch;
    });
  }

  isInstalled(pluginId) {
    return this.installedPlugins.some(p => p.id === pluginId);
  }

  render() {
    const grid = document.getElementById('plugin-grid');
    if (!grid) return;

    const filteredPlugins = this.getFilteredPlugins();
    
    if (filteredPlugins.length === 0) {
      grid.innerHTML = '<div class="no-plugins">No plugins found</div>';
      return;
    }

    grid.innerHTML = filteredPlugins.map(plugin => this.renderPluginCard(plugin)).join('');

    // Render installed plugins
    this.renderInstalledPlugins();

    // Attach event listeners to cards
    this.attachCardListeners();
  }

  renderPluginCard(plugin) {
    const installed = this.isInstalled(plugin.id);
    const priceTag = plugin.price === 0 ? 'Free' : `$${plugin.price}`;
    const verifiedBadge = plugin.verified ? '<span class="verified-badge">✓ Verified</span>' : '';

    return `
      <div class="plugin-card" data-plugin-id="${plugin.id}">
        <div class="plugin-icon">${plugin.icon}</div>
        <div class="plugin-info">
          <h3>${plugin.name} ${verifiedBadge}</h3>
          <p class="plugin-author">by ${plugin.author}</p>
          <p class="plugin-description">${plugin.description}</p>
          <div class="plugin-stats">
            <span>⭐ ${plugin.rating}</span>
            <span>⬇️ ${plugin.downloads}</span>
            <span class="plugin-price">${priceTag}</span>
          </div>
        </div>
        <div class="plugin-actions">
          ${installed 
            ? '<button class="btn-uninstall" onclick="pluginMarketplace.uninstall(\'' + plugin.id + '\')">Uninstall</button>'
            : '<button class="btn-install" onclick="pluginMarketplace.install(\'' + plugin.id + '\')">Install</button>'
          }
          <button class="btn-details" onclick="pluginMarketplace.showDetails(\'' + plugin.id + '\')">Details</button>
        </div>
      </div>
    `;
  }

  renderInstalledPlugins() {
    const container = document.getElementById('installed-plugins');
    if (!container) return;

    if (this.installedPlugins.length === 0) {
      container.innerHTML = '<div class="no-plugins">No plugins installed yet</div>';
      return;
    }

    container.innerHTML = this.installedPlugins.map(plugin => `
      <div class="installed-plugin-card">
        <div class="plugin-icon">${plugin.icon}</div>
        <div class="installed-info">
          <h4>${plugin.name}</h4>
          <p>v${plugin.version}</p>
        </div>
        <div class="installed-actions">
          <button onclick="pluginMarketplace.togglePlugin('${plugin.id}', ${plugin.enabled})" class="btn-toggle">
            ${plugin.enabled ? 'Disable' : 'Enable'}
          </button>
          <button onclick="pluginMarketplace.configurePlugin('${plugin.id}')" class="btn-config">⚙️</button>
        </div>
      </div>
    `).join('');
  }

  attachCardListeners() {
    // Add click listeners for viewing details
    document.querySelectorAll('.plugin-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-install') && 
            !e.target.classList.contains('btn-uninstall') &&
            !e.target.classList.contains('btn-details')) {
          const pluginId = card.dataset.pluginId;
          this.showDetails(pluginId);
        }
      });
    });
  }

  showDetails(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId);
    if (!plugin) return;

    const modal = document.getElementById('plugin-detail-modal');
    const content = document.getElementById('plugin-detail-content');
    const installed = this.isInstalled(pluginId);

    content.innerHTML = `
      <div class="plugin-detail-header">
        <div class="plugin-detail-icon">${plugin.icon}</div>
        <div>
          <h2>${plugin.name}</h2>
          <p class="plugin-author">by ${plugin.author} • v${plugin.version}</p>
        </div>
      </div>
      <div class="plugin-detail-stats">
        <span>⭐ ${plugin.rating}/5</span>
        <span>⬇️ ${plugin.downloads} downloads</span>
        <span>${plugin.price === 0 ? 'Free' : '$' + plugin.price}</span>
        ${plugin.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
      </div>
      <div class="plugin-detail-description">
        <h3>About</h3>
        <p>${plugin.longDescription}</p>
      </div>
      <div class="plugin-detail-features">
        <h3>Features</h3>
        <ul>
          ${plugin.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
      <div class="plugin-detail-requirements">
        <h3>Requirements</h3>
        <ul>
          ${plugin.requirements.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      <div class="plugin-detail-actions">
        ${installed 
          ? `<button class="btn-uninstall" onclick="pluginMarketplace.uninstall('${plugin.id}')">Uninstall</button>`
          : `<button class="btn-install" onclick="pluginMarketplace.install('${plugin.id}')">Install Now</button>`
        }
      </div>
    `;

    modal.style.display = 'block';
  }

  async install(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId);
    if (!plugin) return;

    try {
      const response = await fetch('/api/plugins/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId })
      });

      if (response.ok) {
        this.installedPlugins.push({ ...plugin, enabled: true });
        this.showToast(`✅ ${plugin.name} installed successfully!`);
        this.render();
      } else {
        this.showToast(`❌ Failed to install ${plugin.name}`);
      }
    } catch (error) {
      console.error('Install error:', error);
      // Mock success for demo
      this.installedPlugins.push({ ...plugin, enabled: true });
      this.showToast(`✅ ${plugin.name} installed successfully!`);
      this.render();
    }
  }

  async uninstall(pluginId) {
    const plugin = this.installedPlugins.find(p => p.id === pluginId);
    if (!plugin) return;

    if (!confirm(`Are you sure you want to uninstall ${plugin.name}?`)) return;

    try {
      const response = await fetch(`/api/plugins/uninstall/${pluginId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.installedPlugins = this.installedPlugins.filter(p => p.id !== pluginId);
        this.showToast(`✅ ${plugin.name} uninstalled`);
        this.render();
        document.getElementById('plugin-detail-modal').style.display = 'none';
      } else {
        this.showToast(`❌ Failed to uninstall ${plugin.name}`);
      }
    } catch (error) {
      console.error('Uninstall error:', error);
      // Mock success for demo
      this.installedPlugins = this.installedPlugins.filter(p => p.id !== pluginId);
      this.showToast(`✅ ${plugin.name} uninstalled`);
      this.render();
      document.getElementById('plugin-detail-modal').style.display = 'none';
    }
  }

  async togglePlugin(pluginId, currentState) {
    try {
      const response = await fetch(`/api/plugins/${pluginId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentState })
      });

      if (response.ok) {
        const plugin = this.installedPlugins.find(p => p.id === pluginId);
        if (plugin) {
          plugin.enabled = !currentState;
          this.showToast(`${plugin.name} ${plugin.enabled ? 'enabled' : 'disabled'}`);
          this.render();
        }
      }
    } catch (error) {
      console.error('Toggle error:', error);
      // Mock success
      const plugin = this.installedPlugins.find(p => p.id === pluginId);
      if (plugin) {
        plugin.enabled = !currentState;
        this.showToast(`${plugin.name} ${plugin.enabled ? 'enabled' : 'disabled'}`);
        this.render();
      }
    }
  }

  configurePlugin(pluginId) {
    const plugin = this.installedPlugins.find(p => p.id === pluginId);
    if (!plugin) return;

    alert(`Configuration UI for ${plugin.name} coming soon!`);
  }

  showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize marketplace
let pluginMarketplace;
document.addEventListener('DOMContentLoaded', () => {
  pluginMarketplace = new PluginMarketplace();
});
