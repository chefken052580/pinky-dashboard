/**
 * company-selector.js
 * Company selector component for multi-company management
 */

const API_BASE = 'http://192.168.254.4:3030';
let currentUser = null;
let companies = [];
let activeCompanyId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeCompanySelector();
});

/**
 * Initialize company selector
 */
async function initializeCompanySelector() {
  // Get current user (from localStorage or session)
  currentUser = getUserFromSession();
  
  if (!currentUser) {
    console.warn('No user session found');
    return;
  }

  // Load companies
  await loadCompanies();

  // Setup event listeners
  setupEventListeners();

  // Load active company from localStorage
  const savedCompanyId = localStorage.getItem('pinky_active_company');
  if (savedCompanyId && companies.find(c => c.companyId === savedCompanyId)) {
    setActiveCompany(savedCompanyId);
  } else if (companies.length > 0) {
    setActiveCompany(companies[0].companyId);
  }
}

/**
 * Get user from session
 */
function getUserFromSession() {
  // Try localStorage first
  const userJson = localStorage.getItem('pinky_user');
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user JSON:', e);
    }
  }

  // Fallback to mock user (for development)
  return {
    userId: 'user-demo',
    email: 'demo@pinkybot.io',
    name: 'Demo User'
  };
}

/**
 * Load companies from API
 */
async function loadCompanies() {
  try {
    const response = await fetch(`${API_BASE}/api/companies?userId=${currentUser.userId}`);
    const data = await response.json();
    
    if (data.success) {
      companies = data.companies || [];
      renderCompanyDropdown();
    } else {
      console.error('Failed to load companies:', data.error);
    }
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

/**
 * Render company dropdown options
 */
function renderCompanyDropdown() {
  const dropdown = document.getElementById('company-dropdown');
  
  if (companies.length === 0) {
    dropdown.innerHTML = '<option value="">No companies yet - Add one!</option>';
    return;
  }

  dropdown.innerHTML = companies
    .map(company => `<option value="${company.companyId}">${company.name}</option>`)
    .join('');
}

/**
 * Set active company
 */
function setActiveCompany(companyId) {
  activeCompanyId = companyId;
  
  // Update dropdown
  const dropdown = document.getElementById('company-dropdown');
  dropdown.value = companyId;
  
  // Save to localStorage
  localStorage.setItem('pinky_active_company', companyId);
  
  // Update stats
  updateCompanyStats(companyId);
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('companyChanged', {
    detail: { companyId, company: companies.find(c => c.companyId === companyId) }
  }));
}

/**
 * Update company stats display
 */
function updateCompanyStats(companyId) {
  const company = companies.find(c => c.companyId === companyId);
  if (!company) return;

  const statsContainer = document.getElementById('company-stats');
  statsContainer.style.display = 'grid';

  // Update stat values
  document.getElementById('stat-posts').textContent = company.metadata?.postsCount || 0;
  
  const platformCount = company.platforms ? Object.keys(company.platforms).length : 0;
  document.getElementById('stat-platforms').textContent = platformCount;
  
  // TODO: Fetch scheduled posts count from scheduling API
  document.getElementById('stat-scheduled').textContent = 0;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Dropdown change
  const dropdown = document.getElementById('company-dropdown');
  dropdown.addEventListener('change', (e) => {
    setActiveCompany(e.target.value);
  });

  // Add company button
  const addBtn = document.getElementById('add-company-btn');
  addBtn.addEventListener('click', openAddCompanyModal);

  // Manage companies button
  const manageBtn = document.getElementById('manage-companies-btn');
  manageBtn.addEventListener('click', openManageCompaniesModal);

  // Add company form
  const form = document.getElementById('add-company-form');
  form.addEventListener('submit', handleAddCompany);
}

/**
 * Open add company modal
 */
function openAddCompanyModal() {
  const modal = document.getElementById('add-company-modal');
  modal.style.display = 'flex';
}

/**
 * Close add company modal
 */
function closeAddCompanyModal() {
  const modal = document.getElementById('add-company-modal');
  modal.style.display = 'none';
  
  // Reset form
  document.getElementById('add-company-form').reset();
}

/**
 * Handle add company form submission
 */
async function handleAddCompany(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submit-company-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';

  const name = document.getElementById('company-name').value.trim();
  const description = document.getElementById('company-description').value.trim();
  const timezone = document.getElementById('company-timezone').value;
  const primaryColor = document.getElementById('primary-color').value;
  const secondaryColor = document.getElementById('secondary-color').value;

  try {
    const response = await fetch(`${API_BASE}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        timezone,
        branding: {
          primaryColor,
          secondaryColor
        },
        userId: currentUser.userId
      })
    });

    const data = await response.json();

    if (data.success) {
      // Add to local list
      companies.push(data.company);
      renderCompanyDropdown();
      setActiveCompany(data.company.companyId);
      
      closeAddCompanyModal();
      alert('✅ Company added successfully!');
    } else {
      alert(`❌ Failed to add company: ${data.error}`);
    }
  } catch (error) {
    console.error('Error adding company:', error);
    alert('❌ Network error. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Company';
  }
}

/**
 * Open manage companies modal
 */
function openManageCompaniesModal() {
  const modal = document.getElementById('manage-companies-modal');
  modal.style.display = 'flex';
  
  renderCompaniesList();
}

/**
 * Close manage companies modal
 */
function closeManageCompaniesModal() {
  const modal = document.getElementById('manage-companies-modal');
  modal.style.display = 'none';
}

/**
 * Render companies list in manage modal
 */
function renderCompaniesList() {
  const container = document.getElementById('manage-companies-list');
  
  if (companies.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6b7280;">No companies yet.</p>';
    return;
  }

  container.innerHTML = companies.map(company => `
    <div class="company-item" data-company-id="${company.companyId}">
      <div class="company-info">
        <div class="company-name">${company.name}</div>
        <div class="company-meta">
          Created: ${new Date(company.createdAt).toLocaleDateString()} • 
          ${company.platforms ? Object.keys(company.platforms).length : 0} platforms connected
        </div>
      </div>
      <div class="company-actions">
        <button class="edit-btn" onclick="editCompany('${company.companyId}')">Edit</button>
        <button class="delete-btn" onclick="deleteCompany('${company.companyId}')">Delete</button>
      </div>
    </div>
  `).join('');
}

/**
 * Edit company (placeholder)
 */
function editCompany(companyId) {
  alert('Edit functionality coming soon!');
  // TODO: Open edit modal with pre-filled data
}

/**
 * Delete company
 */
async function deleteCompany(companyId) {
  const company = companies.find(c => c.companyId === companyId);
  if (!company) return;

  if (!confirm(`Are you sure you want to delete "${company.name}"? This action can be undone (company will be archived).`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/companies/${companyId}?userId=${currentUser.userId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      // Remove from local list
      companies = companies.filter(c => c.companyId !== companyId);
      
      // If active company was deleted, switch to first available
      if (activeCompanyId === companyId && companies.length > 0) {
        setActiveCompany(companies[0].companyId);
      } else if (companies.length === 0) {
        activeCompanyId = null;
        localStorage.removeItem('pinky_active_company');
      }
      
      renderCompanyDropdown();
      renderCompaniesList();
      
      alert('✅ Company archived successfully');
    } else {
      alert(`❌ Failed to delete company: ${data.error}`);
    }
  } catch (error) {
    console.error('Error deleting company:', error);
    alert('❌ Network error. Please try again.');
  }
}

/**
 * Get active company
 */
function getActiveCompany() {
  return companies.find(c => c.companyId === activeCompanyId);
}
