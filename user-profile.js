/**
 * User Profile Page JavaScript
 * Handles profile updates, password changes, and account deletion
 */

let currentUser = null;
let authToken = null;

// Load user profile on page load
document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('pinky_auth_token');
  
  if (!authToken) {
    window.location.href = '/login.html';
    return;
  }
  
  loadUserProfile();
  loadWorkspaceStats();
});

// Load user profile data
async function loadUserProfile() {
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }
    
    currentUser = await response.json();
    
    // Update UI with user data
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-email-input').value = currentUser.email;
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-tier').textContent = currentUser.tier || 'Free';
    
    // Update subscription status
    updateSubscriptionDisplay();
    
    console.log('[Profile] Loaded user profile:', currentUser.email);
  } catch (error) {
    console.error('[Profile] Error loading profile:', error);
    showError('Failed to load profile. Please try logging in again.');
  }
}

// Load workspace statistics
async function loadWorkspaceStats() {
  try {
    const response = await fetch('/api/user/workspace/info', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load workspace stats');
    }
    
    const data = await response.json();
    const stats = data.workspace.stats;
    
    document.getElementById('stat-tasks').textContent = stats.tasks || 0;
    document.getElementById('stat-companies').textContent = stats.companies || 0;
    document.getElementById('stat-posts').textContent = stats.scheduledPosts || 0;
    document.getElementById('stat-connections').textContent = stats.wordpressConnections || 0;
    
    console.log('[Profile] Loaded workspace stats:', stats);
  } catch (error) {
    console.error('[Profile] Error loading workspace stats:', error);
    // Don't show error for stats - not critical
  }
}

// Update subscription display
function updateSubscriptionDisplay() {
  const tier = currentUser.tier || 'free';
  const statusDiv = document.getElementById('subscription-status');
  const tierName = document.getElementById('subscription-tier-name');
  const details = document.getElementById('subscription-details');
  const downloadBtn = document.getElementById('download-license-btn');
  
  if (tier === 'pro') {
    statusDiv.classList.add('pro');
    statusDiv.querySelector('.subscription-status-icon').textContent = '⚡';
    tierName.textContent = 'Pro Tier';
    details.textContent = 'All features unlocked';
    downloadBtn.style.display = 'inline-block';
  } else {
    statusDiv.classList.remove('pro');
    statusDiv.querySelector('.subscription-status-icon').textContent = '🆓';
    tierName.textContent = 'Free Tier';
    details.textContent = 'Limited features - upgrade to unlock all 9 bots';
    downloadBtn.style.display = 'none';
  }
}

// Update profile information
async function updateProfile() {
  const name = document.getElementById('profile-name').value;
  
  if (!name || name.trim().length < 2) {
    showError('Please enter a valid name (at least 2 characters)');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/update-profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }
    
    const data = await response.json();
    currentUser = data.user;
    
    showSuccess('Profile updated successfully!');
    console.log('[Profile] Profile updated');
  } catch (error) {
    console.error('[Profile] Error updating profile:', error);
    showError(error.message);
  }
}

// Change password
async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    showError('Please fill in all password fields');
    return;
  }
  
  if (newPassword.length < 8) {
    showError('New password must be at least 8 characters');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showError('New passwords do not match');
    return;
  }
  
  if (currentPassword === newPassword) {
    showError('New password must be different from current password');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }
    
    // Clear password fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    showSuccess('Password changed successfully!');
    console.log('[Profile] Password changed');
  } catch (error) {
    console.error('[Profile] Error changing password:', error);
    showError(error.message);
  }
}

// Delete account
function deleteAccount() {
  const confirmed = confirm(
    '⚠️ WARNING: This action cannot be undone!\n\n' +
    'Are you absolutely sure you want to delete your account?\n' +
    'All your data (tasks, companies, analytics, posts) will be permanently deleted.'
  );
  
  if (!confirmed) return;
  
  const doubleConfirm = confirm(
    'This is your last chance!\n\n' +
    'Type DELETE in the next prompt to confirm account deletion.'
  );
  
  if (!doubleConfirm) return;
  
  const deleteConfirmation = prompt('Type DELETE to confirm:');
  
  if (deleteConfirmation !== 'DELETE') {
    showError('Account deletion cancelled');
    return;
  }
  
  performAccountDeletion();
}

// Perform account deletion API call
async function performAccountDeletion() {
  try {
    const response = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }
    
    // Clear local storage
    localStorage.removeItem('pinky_auth_token');
    localStorage.removeItem('pinky_tier');
    localStorage.removeItem('pinky_user_email');
    
    alert('Your account has been deleted. You will now be redirected to the homepage.');
    window.location.href = '/';
  } catch (error) {
    console.error('[Profile] Error deleting account:', error);
    showError(error.message);
  }
}

// Upgrade account to Pro
function upgradeAccount() {
  // Redirect to pricing/checkout page
  window.location.href = '/pricing.html';
}

// Download license key (for self-hosted Pro users)
async function downloadLicenseKey() {
  try {
    const response = await fetch('/api/license/my-license', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('No license key found');
    }
    
    const data = await response.json();
    const licenseKey = data.licenseKey;
    
    // Create download link
    const blob = new Blob([licenseKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pinkybot-license-key.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess('License key downloaded successfully!');
  } catch (error) {
    console.error('[Profile] Error downloading license key:', error);
    showError('Failed to download license key. Please contact support.');
  }
}

// Show success message
function showSuccess(message) {
  const successDiv = document.getElementById('success-message');
  successDiv.textContent = message;
  successDiv.style.display = 'block';
  
  setTimeout(() => {
    successDiv.style.display = 'none';
  }, 5000);
  
  // Hide error if visible
  document.getElementById('error-message').style.display = 'none';
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
  
  // Hide success if visible
  document.getElementById('success-message').style.display = 'none';
}
