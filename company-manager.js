/**
 * COMPANY MANAGER — Multi-Company Social Media Account Management
 * Core module for PinkyBot.io — production-grade, modular, scalable
 * 
 * Features:
 * - Unlimited companies with independent platform configuration
 * - Dual storage: localStorage (client) + API backend (server)
 * - Adapter pattern for easy storage swapping
 * - Full CRUD operations with error handling
 */

// ==================== STORAGE ADAPTERS ====================

/**
 * LocalStorageAdapter — Client-side storage (immediate, offline)
 */
class LocalStorageAdapter {
  constructor(namespace = 'pinkybot') {
    this.namespace = namespace;
  }

  save(key, data) {
    try {
      const fullKey = this.namespace + ':' + key;
      localStorage.setItem(fullKey, JSON.stringify(data));
      console.log('[LocalStorage] Saved:', fullKey);
      return true;
    } catch (err) {
      console.error('[LocalStorage] Save failed:', err.message);
      return false;
    }
  }

  load(key) {
    try {
      const fullKey = this.namespace + ':' + key;
      const data = localStorage.getItem(fullKey);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('[LocalStorage] Load failed:', err.message);
      return null;
    }
  }

  delete(key) {
    try {
      const fullKey = this.namespace + ':' + key;
      localStorage.removeItem(fullKey);
      console.log('[LocalStorage] Deleted:', fullKey);
      return true;
    } catch (err) {
      console.error('[LocalStorage] Delete failed:', err.message);
      return false;
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.namespace + ':')) {
          localStorage.removeItem(key);
        }
      });
      console.log('[LocalStorage] Cleared all keys');
      return true;
    } catch (err) {
      console.error('[LocalStorage] Clear failed:', err.message);
      return false;
    }
  }
}

/**
 * FetchAdapter — Backend API storage (persistent, shared)
 * For future use when migrating from localStorage to backend
 */
class FetchAdapter {
  constructor(baseUrl = '/api/companies') {
    this.baseUrl = baseUrl;
  }

  async save(key, data) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);
      console.log('[FetchAdapter] Saved:', key);
      return true;
    } catch (err) {
      console.error('[FetchAdapter] Save failed:', err.message);
      return false;
    }
  }

  async load(key) {
    try {
      const response = await fetch(this.baseUrl + '?key=' + key);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const result = await response.json();
      return result.data || null;
    } catch (err) {
      console.error('[FetchAdapter] Load failed:', err.message);
      return null;
    }
  }

  async delete(key) {
    try {
      const response = await fetch(this.baseUrl + '/' + key, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);
      console.log('[FetchAdapter] Deleted:', key);
      return true;
    } catch (err) {
      console.error('[FetchAdapter] Delete failed:', err.message);
      return false;
    }
  }
}

// ==================== COMPANY MANAGER ====================

class CompanyManager {
  constructor(storageAdapter = null) {
    // Use localStorage by default, but allow injection of other adapters
    this.storage = storageAdapter || new LocalStorageAdapter('pinkybot:companies');
    this.companies = [];
    this.currentCompany = null;

    // Load existing companies or use seed data
    this.loadCompanies();
  }

  /**
   * Load companies from storage, or use seed data if empty
   */
  loadCompanies() {
    const saved = this.storage.load('all');

    if (saved && Array.isArray(saved) && saved.length > 0) {
      this.companies = saved;
      console.log('[CompanyManager] Loaded', saved.length, 'companies from storage');
    } else {
      // Seed data: YOUR 4 companies
      this.companies = this.getSeedData();
      this.saveAll();
      console.log('[CompanyManager] Initialized with', this.companies.length, 'seed companies');
    }

    // Set first company as current
    if (this.companies.length > 0) {
      this.currentCompany = this.companies[0].id;
    }
  }

  /**
   * Get seed data for immediate testing
   */
  getSeedData() {
    return [
      {
        id: 'unlimited-charters',
        name: 'Unlimited Charters',
        description: 'Bus charter and transportation services',
        icon: '🚌',
        platforms: ['facebook', 'instagram', 'linkedin', 'x'],
        accounts: {
          facebook: [
            { id: 'fb-uc-1', name: 'Unlimited Charters Page', account_id: 'seed-fb-uc', verified: true }
          ],
          instagram: [
            { id: 'ig-uc-1', name: '@unlimitedcharters', account_id: 'seed-ig-uc', verified: true }
          ],
          linkedin: [
            { id: 'li-uc-1', name: 'Unlimited Charters Company', account_id: 'seed-li-uc', verified: true }
          ],
          x: [
            { id: 'x-uc-1', name: '@UnlimitedCharters', account_id: 'seed-x-uc', verified: true }
          ]
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      {
        id: 'stretch-xl-freight',
        name: 'Stretch XL Freight',
        description: 'Freight and logistics services',
        icon: '🚚',
        platforms: ['facebook', 'instagram', 'x'],
        accounts: {
          facebook: [
            { id: 'fb-sxl-1', name: 'Stretch XL Freight', account_id: 'seed-fb-sxl', verified: true }
          ],
          instagram: [
            { id: 'ig-sxl-1', name: '@stretchxlfreight', account_id: 'seed-ig-sxl', verified: true }
          ],
          x: [
            { id: 'x-sxl-1', name: '@StretchXLFreight', account_id: 'seed-x-sxl', verified: true }
          ]
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      {
        id: 'philly-charters',
        name: 'Philly Charters',
        description: 'Philadelphia-based charter bus services',
        icon: '🎫',
        platforms: ['facebook'],
        accounts: {
          facebook: [
            { id: 'fb-pc-1', name: 'Philly Charters Page', account_id: 'seed-fb-pc', verified: true }
          ]
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      {
        id: 'usbustrips',
        name: 'USBusTrips',
        description: 'Bus trip booking and travel platform',
        icon: '🌐',
        platforms: ['facebook'],
        accounts: {
          facebook: [
            { id: 'fb-ubt-1', name: 'USBusTrips Page', account_id: 'seed-fb-ubt', verified: true }
          ]
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    ];
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create new company
   */
  createCompany(name, description, icon, platforms = []) {
    const id = name.toLowerCase().replace(/\s+/g, '-');

    // Check for duplicate
    if (this.companies.some(c => c.id === id)) {
      console.error('[CompanyManager] Company already exists:', id);
      return null;
    }

    const company = {
      id,
      name,
      description,
      icon,
      platforms,
      accounts: {},
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    // Initialize account objects for each platform
    platforms.forEach(platform => {
      company.accounts[platform] = [];
    });

    this.companies.push(company);
    this.saveAll();
    console.log('[CompanyManager] Created company:', id);

    return company;
  }

  /**
   * Get company by ID
   */
  getCompany(id) {
    return this.companies.find(c => c.id === id) || null;
  }

  /**
   * Get all companies
   */
  listCompanies() {
    return this.companies;
  }

  /**
   * Update company
   */
  updateCompany(id, updates) {
    const company = this.getCompany(id);
    if (!company) {
      console.error('[CompanyManager] Company not found:', id);
      return null;
    }

    Object.assign(company, updates, { updated: new Date().toISOString() });
    this.saveAll();
    console.log('[CompanyManager] Updated company:', id);

    return company;
  }

  /**
   * Delete company
   */
  deleteCompany(id) {
    const index = this.companies.findIndex(c => c.id === id);
    if (index === -1) {
      console.error('[CompanyManager] Company not found:', id);
      return false;
    }

    this.companies.splice(index, 1);
    this.saveAll();
    console.log('[CompanyManager] Deleted company:', id);

    // Reset current company if deleted
    if (this.currentCompany === id && this.companies.length > 0) {
      this.currentCompany = this.companies[0].id;
    }

    return true;
  }

  // ==================== ACCOUNT MANAGEMENT ====================

  /**
   * Add account to company/platform
   */
  addAccount(companyId, platform, accountData) {
    const company = this.getCompany(companyId);
    if (!company) {
      console.error('[CompanyManager] Company not found:', companyId);
      return null;
    }

    // Initialize platform accounts if not exists
    if (!company.accounts[platform]) {
      company.accounts[platform] = [];
    }

    // Add platform to company's platforms list if not present
    if (!company.platforms.includes(platform)) {
      company.platforms.push(platform);
    }

    // Create account object
    const account = {
      id: platform + '-' + Date.now(),
      name: accountData.name,
      account_id: accountData.account_id,
      verified: false,
      created: new Date().toISOString(),
      ...accountData
    };

    company.accounts[platform].push(account);
    this.updateCompany(companyId, company);
    console.log('[CompanyManager] Added account to', companyId, ':', platform);

    return account;
  }

  /**
   * Remove account from company
   */
  removeAccount(companyId, platform, accountId) {
    const company = this.getCompany(companyId);
    if (!company || !company.accounts[platform]) {
      console.error('[CompanyManager] Company or platform not found');
      return false;
    }

    const index = company.accounts[platform].findIndex(a => a.id === accountId);
    if (index === -1) {
      console.error('[CompanyManager] Account not found:', accountId);
      return false;
    }

    company.accounts[platform].splice(index, 1);

    // Remove platform if no more accounts
    if (company.accounts[platform].length === 0) {
      const platformIdx = company.platforms.indexOf(platform);
      if (platformIdx !== -1) {
        company.platforms.splice(platformIdx, 1);
      }
    }

    this.updateCompany(companyId, company);
    console.log('[CompanyManager] Removed account:', accountId);

    return true;
  }

  /**
   * Get all accounts for a company
   */
  getAccountsForCompany(companyId, platform = null) {
    const company = this.getCompany(companyId);
    if (!company) return {};

    if (platform) {
      return company.accounts[platform] || [];
    }

    return company.accounts;
  }

  /**
   * Verify account connection
   */
  verifyAccount(companyId, platform, accountId) {
    const company = this.getCompany(companyId);
    if (!company) return false;

    const account = company.accounts[platform]?.find(a => a.id === accountId);
    if (!account) return false;

    account.verified = true;
    account.verified_at = new Date().toISOString();
    this.updateCompany(companyId, company);
    console.log('[CompanyManager] Verified account:', accountId);

    return true;
  }

  // ==================== PERSISTENCE ====================

  /**
   * Save all companies to storage
   */
  saveAll() {
    const success = this.storage.save('all', this.companies);
    if (success) {
      console.log('[CompanyManager] Saved to storage');
      // Also send to backend if available
      this.syncToBackend();
    }
    return success;
  }

  /**
   * Sync companies to backend API
   */
  async syncToBackend() {
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: this.companies })
      });

      if (response.ok) {
        console.log('[CompanyManager] Synced to backend');
      } else {
        console.warn('[CompanyManager] Backend sync returned:', response.status);
      }
    } catch (err) {
      // Fail silently - localStorage is enough for now
      console.log('[CompanyManager] Backend sync failed (offline):', err.message);
    }
  }
}

// Export for use in browsers
if (typeof window !== 'undefined') {
  window.CompanyManager = CompanyManager;
  window.LocalStorageAdapter = LocalStorageAdapter;
  window.FetchAdapter = FetchAdapter;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CompanyManager, LocalStorageAdapter, FetchAdapter };
}
