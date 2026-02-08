/**
 * Company Selector Component
 * Multi-company management for SocialBot
 */

const CompanySelector = {
    apiBase: window.location.origin,
    activeCompany: null,
    companies: [],
    
    /**
     * Initialize company selector
     */
    async init() {
        console.log('[Company Selector] Initializing...');
        
        // Load active company from localStorage
        const storedCompanyId = localStorage.getItem('pinky_active_company');
        
        // Load companies from API
        await this.loadCompanies();
        
        // Restore active company if exists
        if (storedCompanyId) {
            this.setActiveCompany(storedCompanyId);
        }
        
        console.log('[Company Selector] Initialized with', this.companies.length, 'companies');
    },
    
    /**
     * Load companies from API
     */
    async loadCompanies() {
        try {
            const response = await fetch(`${this.apiBase}/api/companies`);
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to load companies');
            }
            
            this.companies = data.companies || [];
            this.renderCompanyDropdown();
            
            console.log('[Company Selector] Loaded', this.companies.length, 'companies');
            return this.companies;
            
        } catch (error) {
            console.error('[Company Selector] Load error:', error);
            this.showError('Failed to load companies');
            return [];
        }
    },
    
    /**
     * Render company dropdown options
     */
    renderCompanyDropdown() {
        const select = document.getElementById('company-selector');
        if (!select) return;
        
        // Clear existing options (except first placeholder)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add company options
        this.companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            
            // Select if active
            if (this.activeCompany && this.activeCompany.id === company.id) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
    },
    
    /**
     * Set active company
     */
    setActiveCompany(companyId) {
        const company = this.companies.find(c => c.id === companyId);
        
        if (!company) {
            console.warn('[Company Selector] Company not found:', companyId);
            return false;
        }
        
        this.activeCompany = company;
        localStorage.setItem('pinky_active_company', companyId);
        
        // Update UI
        this.renderCompanyInfo();
        
        // Update dropdown selection
        const select = document.getElementById('company-selector');
        if (select) {
            select.value = companyId;
        }
        
        console.log('[Company Selector] Active company set:', company.name);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('companyChanged', {
            detail: { company }
        }));
        
        return true;
    },
    
    /**
     * Render company info card
     */
    renderCompanyInfo() {
        const infoCard = document.getElementById('company-info');
        const nameDisplay = document.getElementById('company-name-display');
        const platformsDisplay = document.getElementById('company-platforms-display');
        const logo = document.getElementById('company-logo');
        const logoPlaceholder = document.getElementById('company-logo-placeholder');
        
        if (!infoCard) return;
        
        if (this.activeCompany) {
            infoCard.style.display = 'flex';
            
            // Company name
            if (nameDisplay) {
                nameDisplay.textContent = this.activeCompany.name;
            }
            
            // Platforms
            if (platformsDisplay) {
                const platforms = this.activeCompany.platforms || [];
                if (platforms.length > 0) {
                    platformsDisplay.innerHTML = platforms
                        .map(p => `<span>${p}</span>`)
                        .join('');
                } else {
                    platformsDisplay.innerHTML = '<span style="opacity:0.5">No platforms selected</span>';
                }
            }
            
            // Logo
            if (logo && this.activeCompany.branding && this.activeCompany.branding.logo) {
                logo.src = this.activeCompany.branding.logo;
                logo.style.display = 'block';
                if (logoPlaceholder) logoPlaceholder.style.display = 'none';
            } else {
                if (logo) logo.style.display = 'none';
                if (logoPlaceholder) logoPlaceholder.style.display = 'flex';
            }
        } else {
            infoCard.style.display = 'none';
        }
    },
    
    /**
     * Create new company
     */
    async createCompany(companyData) {
        try {
            const response = await fetch(`${this.apiBase}/api/companies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `API error: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to create company');
            }
            
            console.log('[Company Selector] Company created:', data.company.id);
            
            // Reload companies
            await this.loadCompanies();
            
            // Set as active
            this.setActiveCompany(data.company.id);
            
            return data.company;
            
        } catch (error) {
            console.error('[Company Selector] Create error:', error);
            throw error;
        }
    },
    
    /**
     * Update company
     */
    async updateCompany(companyId, updates) {
        try {
            const response = await fetch(`${this.apiBase}/api/companies/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `API error: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update company');
            }
            
            console.log('[Company Selector] Company updated:', companyId);
            
            // Reload companies
            await this.loadCompanies();
            
            // Update active if it's the current company
            if (this.activeCompany && this.activeCompany.id === companyId) {
                this.setActiveCompany(companyId);
            }
            
            return data.company;
            
        } catch (error) {
            console.error('[Company Selector] Update error:', error);
            throw error;
        }
    },
    
    /**
     * Show error message
     */
    showError(message) {
        // Simple alert for now, could be enhanced with toast notifications
        alert(`❌ Error: ${message}`);
    },
    
    /**
     * Show success message
     */
    showSuccess(message) {
        // Simple alert for now, could be enhanced with toast notifications
        alert(`✅ Success: ${message}`);
    }
};

/**
 * Switch company (called from dropdown)
 */
function switchCompany(companyId) {
    if (!companyId) {
        CompanySelector.activeCompany = null;
        localStorage.removeItem('pinky_active_company');
        CompanySelector.renderCompanyInfo();
        return;
    }
    
    CompanySelector.setActiveCompany(companyId);
}

/**
 * Show create company modal
 */
function showCreateCompanyModal() {
    const modal = document.getElementById('company-modal');
    const modalTitle = document.getElementById('modal-title');
    const saveBtnText = document.getElementById('save-btn-text');
    const companyIdInput = document.getElementById('company-id');
    const form = document.getElementById('company-form');
    
    if (!modal) return;
    
    // Reset form
    if (form) form.reset();
    if (companyIdInput) companyIdInput.value = '';
    
    // Set mode to create
    if (modalTitle) modalTitle.textContent = 'Create New Company';
    if (saveBtnText) saveBtnText.textContent = 'Create Company';
    
    // Show modal
    modal.style.display = 'flex';
}

/**
 * Edit current company
 */
function editCurrentCompany() {
    if (!CompanySelector.activeCompany) {
        alert('No company selected');
        return;
    }
    
    const modal = document.getElementById('company-modal');
    const modalTitle = document.getElementById('modal-title');
    const saveBtnText = document.getElementById('save-btn-text');
    const companyIdInput = document.getElementById('company-id');
    const nameInput = document.getElementById('company-name-input');
    const logoInput = document.getElementById('company-logo-url');
    const primaryColorInput = document.getElementById('brand-color-primary');
    const secondaryColorInput = document.getElementById('brand-color-secondary');
    
    if (!modal) return;
    
    const company = CompanySelector.activeCompany;
    
    // Set mode to edit
    if (modalTitle) modalTitle.textContent = 'Edit Company';
    if (saveBtnText) saveBtnText.textContent = 'Save Changes';
    if (companyIdInput) companyIdInput.value = company.id;
    
    // Populate form
    if (nameInput) nameInput.value = company.name || '';
    if (logoInput) logoInput.value = (company.branding && company.branding.logo) || '';
    if (primaryColorInput) primaryColorInput.value = (company.branding && company.branding.colors && company.branding.colors.primary) || '#667eea';
    if (secondaryColorInput) secondaryColorInput.value = (company.branding && company.branding.colors && company.branding.colors.secondary) || '#764ba2';
    
    // Check platforms
    const platformCheckboxes = document.querySelectorAll('input[name="platforms"]');
    platformCheckboxes.forEach(checkbox => {
        checkbox.checked = (company.platforms || []).includes(checkbox.value);
    });
    
    // Show modal
    modal.style.display = 'flex';
}

/**
 * Close company modal
 */
function closeCompanyModal() {
    const modal = document.getElementById('company-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Save company (create or update)
 */
async function saveCompany() {
    const companyIdInput = document.getElementById('company-id');
    const nameInput = document.getElementById('company-name-input');
    const logoInput = document.getElementById('company-logo-url');
    const primaryColorInput = document.getElementById('brand-color-primary');
    const secondaryColorInput = document.getElementById('brand-color-secondary');
    const platformCheckboxes = document.querySelectorAll('input[name="platforms"]:checked');
    
    // Validate name
    if (!nameInput || !nameInput.value.trim()) {
        alert('Company name is required');
        return;
    }
    
    if (nameInput.value.trim().length < 2) {
        alert('Company name must be at least 2 characters');
        return;
    }
    
    // Collect form data
    const platforms = Array.from(platformCheckboxes).map(cb => cb.value);
    
    const companyData = {
        name: nameInput.value.trim(),
        platforms: platforms,
        branding: {
            logo: logoInput ? logoInput.value.trim() : '',
            colors: {
                primary: primaryColorInput ? primaryColorInput.value : '#667eea',
                secondary: secondaryColorInput ? secondaryColorInput.value : '#764ba2'
            }
        }
    };
    
    try {
        const companyId = companyIdInput ? companyIdInput.value : '';
        
        if (companyId) {
            // Update existing company
            await CompanySelector.updateCompany(companyId, companyData);
            CompanySelector.showSuccess('Company updated successfully!');
        } else {
            // Create new company
            await CompanySelector.createCompany(companyData);
            CompanySelector.showSuccess('Company created successfully!');
        }
        
        closeCompanyModal();
        
    } catch (error) {
        CompanySelector.showError(error.message);
    }
}

// Initialize on DOM ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => CompanySelector.init(), 100);
} else {
    document.addEventListener('DOMContentLoaded', () => CompanySelector.init());
}

// Make globally accessible
window.CompanySelector = CompanySelector;
window.switchCompany = switchCompany;
window.showCreateCompanyModal = showCreateCompanyModal;
window.editCurrentCompany = editCurrentCompany;
window.closeCompanyModal = closeCompanyModal;
window.saveCompany = saveCompany;
