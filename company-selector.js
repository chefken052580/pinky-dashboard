/**
 * Company Selector Dropdown for SocialBot Dashboard
 * Manages company context switching and company CRUD operations
 * Part of Phase 3.4 - Multi-Company Social Management
 */

class CompanySelector {
  constructor() {
    this.companies = [];
    this.activeCompanyId = null;
    this.onCompanyChange = null; // Callback when company changes
  }

  async init() {
    await this.loadCompanies();
    this.restoreActiveCompany();
    this.render();
    this.setupEventListeners();
  }

  async loadCompanies() {
    try {
      const response = await fetch('http://192.168.254.4:3030/api/companies');
      if (!response.ok) {
        throw new Error(`Failed to load companies: ${response.status}`);
      }
      this.companies = await response.json();
    } catch (error) {
      console.error('Error loading companies:', error);
      this.companies = [];
    }
  }

  restoreActiveCompany() {
    const stored = localStorage.getItem('pinky_active_company');
    if (stored && this.companies.find(c => c.id === stored)) {
      this.activeCompanyId = stored;
    } else if (this.companies.length > 0) {
      this.activeCompanyId = this.companies[0].id;
      this.saveActiveCompany();
    }
  }

  saveActiveCompany() {
    if (this.activeCompanyId) {
      localStorage.setItem('pinky_active_company', this.activeCompanyId);
    }
  }

  getActiveCompany() {
    return this.companies.find(c => c.id === this.activeCompanyId) || null;
  }

  render() {
    const container = document.getElementById('company-selector-container');
    if (!container) return;

    const activeCompany = this.getActiveCompany();

    container.innerHTML = `
      <div class="company-selector-wrapper">
        <div class="company-selector-header">
          <label class="company-selector-label">📊 Company:</label>
          <div class="company-selector-dropdown">
            <button class="company-selector-button" id="company-dropdown-btn">
              ${activeCompany ? this.renderCompanyButton(activeCompany) : 'Select Company'}
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="company-dropdown-menu" id="company-dropdown-menu">
              ${this.renderDropdownItems()}
              <div class="dropdown-divider"></div>
              <button class="dropdown-item create-company-btn" id="create-company-btn">
                <span class="item-icon">➕</span>
                <span class="item-text">Create New Company</span>
              </button>
            </div>
          </div>
        </div>

        ${activeCompany ? this.renderCompanyInfo(activeCompany) : ''}
      </div>

      ${this.renderCreateCompanyModal()}
    `;
  }

  renderCompanyButton(company) {
    return `
      <span class="company-logo">${company.logo || '🏢'}</span>
      <span class="company-name">${company.name}</span>
    `;
  }

  renderDropdownItems() {
    if (this.companies.length === 0) {
      return '<div class="dropdown-item empty">No companies yet</div>';
    }

    return this.companies.map(company => `
      <button class="dropdown-item ${company.id === this.activeCompanyId ? 'active' : ''}" 
              data-company-id="${company.id}">
        <span class="item-logo">${company.logo || '🏢'}</span>
        <span class="item-text">${company.name}</span>
        ${company.id === this.activeCompanyId ? '<span class="item-check">✓</span>' : ''}
      </button>
    `).join('');
  }

  renderCompanyInfo(company) {
    const platformCount = company.platforms ? Object.keys(company.platforms).length : 0;
    const connectedPlatforms = company.platforms ? 
      Object.entries(company.platforms)
        .filter(([_, data]) => data.enabled)
        .map(([name, _]) => this.getPlatformEmoji(name))
        .join(' ') : '';

    return `
      <div class="company-info-bar">
        <div class="info-item">
          <span class="info-label">Platforms:</span>
          <span class="info-value">${platformCount} connected ${connectedPlatforms}</span>
        </div>
        <button class="btn-edit-company" data-company-id="${company.id}" title="Edit Company">
          ⚙️ Manage
        </button>
      </div>
    `;
  }

  renderCreateCompanyModal() {
    return `
      <div class="company-modal" id="company-modal" style="display: none;">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title">Create New Company</h3>
            <button class="modal-close" id="modal-close-btn">✕</button>
          </div>
          <div class="modal-body">
            <form id="company-form">
              <div class="form-group">
                <label for="company-name">Company Name *</label>
                <input type="text" id="company-name" name="name" required 
                       placeholder="e.g., Acme Corp" maxlength="100">
              </div>

              <div class="form-group">
                <label for="company-logo">Logo Emoji</label>
                <input type="text" id="company-logo" name="logo" 
                       placeholder="🏢" maxlength="2">
                <small>Optional: Pick an emoji to represent your company</small>
              </div>

              <div class="form-group">
                <label for="company-website">Website</label>
                <input type="url" id="company-website" name="website" 
                       placeholder="https://example.com">
              </div>

              <div class="form-group">
                <label for="company-industry">Industry</label>
                <input type="text" id="company-industry" name="industry" 
                       placeholder="e.g., Technology, Retail, Healthcare">
              </div>

              <div class="form-actions">
                <button type="button" class="btn-cancel" id="cancel-btn">Cancel</button>
                <button type="submit" class="btn-submit">
                  <span id="submit-text">Create Company</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Dropdown toggle
    const dropdownBtn = document.getElementById('company-dropdown-btn');
    const dropdownMenu = document.getElementById('company-dropdown-menu');
    
    if (dropdownBtn && dropdownMenu) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
      });

      dropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Company selection
    document.querySelectorAll('.dropdown-item[data-company-id]').forEach(item => {
      item.addEventListener('click', (e) => {
        const companyId = e.currentTarget.getAttribute('data-company-id');
        this.switchCompany(companyId);
      });
    });

    // Create company button
    const createBtn = document.getElementById('create-company-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateModal());
    }

    // Edit company buttons
    document.querySelectorAll('.btn-edit-company').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const companyId = e.currentTarget.getAttribute('data-company-id');
        this.showEditModal(companyId);
      });
    });

    // Modal controls
    const modal = document.getElementById('company-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('company-form');

    if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideModal());
    
    if (modal) {
      modal.querySelector('.modal-overlay')?.addEventListener('click', () => this.hideModal());
    }

    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  async switchCompany(companyId) {
    this.activeCompanyId = companyId;
    this.saveActiveCompany();
    this.render();
    this.setupEventListeners();

    // Trigger callback if set
    if (this.onCompanyChange && typeof this.onCompanyChange === 'function') {
      const company = this.getActiveCompany();
      await this.onCompanyChange(company);
    }

    // Close dropdown
    document.getElementById('company-dropdown-menu')?.classList.remove('show');
  }

  showCreateModal() {
    const modal = document.getElementById('company-modal');
    const form = document.getElementById('company-form');
    const title = document.getElementById('modal-title');
    const submitText = document.getElementById('submit-text');

    if (modal && form && title && submitText) {
      form.reset();
      form.dataset.mode = 'create';
      delete form.dataset.companyId;
      title.textContent = 'Create New Company';
      submitText.textContent = 'Create Company';
      modal.style.display = 'flex';
    }
  }

  showEditModal(companyId) {
    const company = this.companies.find(c => c.id === companyId);
    if (!company) return;

    const modal = document.getElementById('company-modal');
    const form = document.getElementById('company-form');
    const title = document.getElementById('modal-title');
    const submitText = document.getElementById('submit-text');

    if (modal && form && title && submitText) {
      form.dataset.mode = 'edit';
      form.dataset.companyId = companyId;
      
      document.getElementById('company-name').value = company.name || '';
      document.getElementById('company-logo').value = company.logo || '';
      document.getElementById('company-website').value = company.website || '';
      document.getElementById('company-industry').value = company.industry || '';

      title.textContent = 'Edit Company';
      submitText.textContent = 'Save Changes';
      modal.style.display = 'flex';
    }
  }

  hideModal() {
    const modal = document.getElementById('company-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const companyId = form.dataset.companyId;

    const formData = {
      name: document.getElementById('company-name').value.trim(),
      logo: document.getElementById('company-logo').value.trim() || '🏢',
      website: document.getElementById('company-website').value.trim(),
      industry: document.getElementById('company-industry').value.trim(),
      platforms: {}
    };

    try {
      let response;
      if (mode === 'create') {
        response = await fetch('http://192.168.254.4:3030/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        response = await fetch(`http://192.168.254.4:3030/api/companies/${companyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save company');
      }

      const result = await response.json();
      
      // Reload companies and switch to new/edited company
      await this.loadCompanies();
      
      if (mode === 'create' && result.company) {
        await this.switchCompany(result.company.id);
      } else {
        this.render();
        this.setupEventListeners();
      }

      this.hideModal();
      
    } catch (error) {
      console.error('Error saving company:', error);
      alert(`Failed to save company: ${error.message}`);
    }
  }

  getPlatformEmoji(platform) {
    const emojis = {
      twitter: '🐦',
      instagram: '📷',
      facebook: '👍',
      linkedin: '💼',
      tiktok: '🎵',
      youtube: '📺',
      bluesky: '🦋',
      mastodon: '🐘'
    };
    return emojis[platform.toLowerCase()] || '📱';
  }

  // Public method to refresh companies list
  async refresh() {
    await this.loadCompanies();
    this.render();
    this.setupEventListeners();
  }
}

// Global instance
window.companySelector = new CompanySelector();
