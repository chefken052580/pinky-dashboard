/**
 * fix-approval.js
 * Frontend logic for fix approval queue
 */

const API_BASE = 'http://192.168.254.4:3030';
let allFixes = [];
let currentFix = null;
let currentFilter = 'pending';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadFixes();
  setupFilterButtons();
  loadStats();
});

/**
 * Load all fixes from API
 */
async function loadFixes() {
  showLoading();
  
  try {
    // Load pending fixes (primary view)
    const pendingResponse = await fetch(`${API_BASE}/api/autofix/pending`);
    const pendingData = await pendingResponse.json();
    
    if (pendingData.success) {
      allFixes = pendingData.fixes || [];
    }

    // If viewing all/applied/rejected, need to load all fixes
    // For now, we'll focus on pending fixes
    // TODO: Add endpoint to fetch all fixes with status filter

    renderFixes();
    hideLoading();
  } catch (error) {
    console.error('Error loading fixes:', error);
    hideLoading();
    showError('Failed to load fixes');
  }
}

/**
 * Load statistics
 */
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/autofix/stats`);
    const data = await response.json();
    
    if (data.success) {
      const stats = data.stats;
      document.getElementById('pending-count').textContent = stats.byStatus['pending-approval'] || 0;
      document.getElementById('applied-count').textContent = stats.byStatus['applied'] || 0;
      document.getElementById('rejected-count').textContent = stats.byStatus['rejected'] || 0;
      
      const successRate = Math.round(stats.successRate * 100);
      document.getElementById('success-rate').textContent = `${successRate}%`;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

/**
 * Render fixes list
 */
function renderFixes() {
  const container = document.getElementById('fixes-list');
  const emptyState = document.getElementById('empty-state');
  
  // Filter fixes based on current filter
  let filteredFixes = allFixes;
  if (currentFilter !== 'all') {
    filteredFixes = allFixes.filter(fix => fix.status === currentFilter);
  }

  if (filteredFixes.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  container.style.display = 'grid';
  emptyState.style.display = 'none';

  container.innerHTML = filteredFixes.map(fix => createFixCard(fix)).join('');

  // Add click listeners
  document.querySelectorAll('.fix-card').forEach(card => {
    card.addEventListener('click', () => {
      const fixId = card.dataset.fixId;
      openFixModal(fixId);
    });
  });
}

/**
 * Create fix card HTML
 */
function createFixCard(fix) {
  const confidence = fix.proposal?.confidence || 0;
  const confidenceClass = confidence >= 0.7 ? 'confidence-high' : 
                          confidence >= 0.5 ? 'confidence-medium' : 
                          'confidence-low';
  const confidencePercent = Math.round(confidence * 100);

  const statusClass = fix.status === 'applied' ? 'status-applied' : 
                      fix.status === 'rejected' ? 'status-rejected' : 
                      'status-pending';

  const createdDate = new Date(fix.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="fix-card ${statusClass}" data-fix-id="${fix.fixId}">
      <div class="fix-header">
        <div>
          <div class="fix-title">${fix.bugId}: Auto-Fix Proposed</div>
          <div class="fix-ids">Fix ID: ${fix.fixId}</div>
        </div>
        <span class="confidence-badge ${confidenceClass}">${confidencePercent}% confident</span>
      </div>
      
      <div class="fix-meta">
        <div class="meta-item">
          📅 ${createdDate}
        </div>
        <div class="meta-item">
          📁 ${fix.proposal?.affectedFiles?.length || 0} files
        </div>
        <div class="meta-item">
          <span class="status-badge ${statusClass}">${fix.status}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Open fix detail modal
 */
async function openFixModal(fixId) {
  try {
    const response = await fetch(`${API_BASE}/api/autofix/${fixId}`);
    const data = await response.json();
    
    if (!data.success) {
      showError('Failed to load fix details');
      return;
    }

    currentFix = data.fix;
    populateModal(currentFix);
    
    const modal = document.getElementById('fix-modal');
    modal.style.display = 'flex';
  } catch (error) {
    console.error('Error loading fix details:', error);
    showError('Failed to load fix details');
  }
}

/**
 * Populate modal with fix data
 */
function populateModal(fix) {
  document.getElementById('modal-fix-id').textContent = fix.fixId;
  document.getElementById('modal-bug-id').textContent = fix.bugId;
  document.getElementById('modal-bug-title').textContent = `Fix for ${fix.bugId}`;
  
  const createdDate = new Date(fix.createdAt).toLocaleString();
  document.getElementById('modal-created-at').textContent = createdDate;

  const confidence = fix.proposal?.confidence || 0;
  const confidencePercent = Math.round(confidence * 100);
  const confidenceClass = confidence >= 0.7 ? 'confidence-high' : 
                          confidence >= 0.5 ? 'confidence-medium' : 
                          'confidence-low';
  
  const confidenceBadge = document.getElementById('modal-confidence');
  confidenceBadge.textContent = `${confidencePercent}%`;
  confidenceBadge.className = `confidence-badge ${confidenceClass}`;

  document.getElementById('modal-description').textContent = fix.proposal?.description || 'No description available';

  const filesList = document.getElementById('modal-files');
  filesList.innerHTML = (fix.proposal?.affectedFiles || [])
    .map(file => `<li>${file}</li>`)
    .join('');

  document.getElementById('modal-patch').textContent = fix.proposal?.patch || 'No patch available';

  // Show breaking changes warning if applicable
  const breakingWarning = document.getElementById('breaking-warning');
  if (fix.proposal?.breakingChanges) {
    breakingWarning.style.display = 'block';
  } else {
    breakingWarning.style.display = 'none';
  }

  // Disable approve/reject buttons if already processed
  const approveBtn = document.getElementById('approve-btn');
  const rejectBtn = document.getElementById('reject-btn');
  
  if (fix.status !== 'pending-approval') {
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    approveBtn.textContent = fix.status === 'applied' ? '✓ Already Applied' : '✕ Already Rejected';
  } else {
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    approveBtn.textContent = '✓ Approve & Apply';
  }
}

/**
 * Close fix modal
 */
function closeFixModal() {
  const modal = document.getElementById('fix-modal');
  modal.style.display = 'none';
  currentFix = null;
}

/**
 * Approve fix
 */
async function approveFix() {
  if (!currentFix) return;

  const approvedBy = 'Brain'; // Could be made configurable
  
  try {
    const response = await fetch(`${API_BASE}/api/autofix/approve/${currentFix.fixId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ approvedBy })
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('Fix approved and applied!');
      closeFixModal();
      loadFixes();
      loadStats();
    } else {
      showError(data.error || 'Failed to approve fix');
    }
  } catch (error) {
    console.error('Error approving fix:', error);
    showError('Failed to approve fix');
  }
}

/**
 * Show reject dialog
 */
function showRejectDialog() {
  const modal = document.getElementById('reject-modal');
  modal.style.display = 'flex';
  document.getElementById('reject-reason').value = '';
  document.getElementById('rejected-by').value = 'Brain';
}

/**
 * Close reject dialog
 */
function closeRejectDialog() {
  const modal = document.getElementById('reject-modal');
  modal.style.display = 'none';
}

/**
 * Confirm rejection
 */
async function confirmReject() {
  if (!currentFix) return;

  const reason = document.getElementById('reject-reason').value.trim();
  const rejectedBy = document.getElementById('rejected-by').value.trim();

  if (!reason) {
    alert('Please provide a rejection reason');
    return;
  }

  if (!rejectedBy) {
    alert('Please provide your name');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/autofix/reject/${currentFix.fixId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason, rejectedBy })
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('Fix rejected');
      closeRejectDialog();
      closeFixModal();
      loadFixes();
      loadStats();
    } else {
      showError(data.error || 'Failed to reject fix');
    }
  } catch (error) {
    console.error('Error rejecting fix:', error);
    showError('Failed to reject fix');
  }
}

/**
 * Setup filter buttons
 */
function setupFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      
      // Update active state
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      renderFixes();
    });
  });
}

/**
 * Show loading state
 */
function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('fixes-list').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

/**
 * Show success message
 */
function showSuccess(message) {
  alert(`✅ ${message}`);
}

/**
 * Show error message
 */
function showError(message) {
  alert(`❌ ${message}`);
}
