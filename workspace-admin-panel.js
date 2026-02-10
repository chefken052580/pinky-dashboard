/**
 * Workspace Admin Panel UI Component
 * 
 * Provides admin interface for:
 * - Member management (invite, role change, removal)
 * - Workspace settings
 * - Audit log viewing
 * - Analytics dashboard
 * - Workspace billing
 */

class WorkspaceAdminPanel {
  constructor(containerId, workspaceId, userId) {
    this.container = document.getElementById(containerId);
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.currentTab = 'members';
    this.members = [];
    this.workspace = null;
  }

  async init() {
    try {
      // Fetch workspace data
      const response = await fetch(
        `/api/workspaces/${this.workspaceId}?userId=${this.userId}`
      );
      
      if (response.status === 403) {
        this.renderAccessDenied();
        return;
      }
      
      this.workspace = await response.json();
      
      if (!this.workspace.permissions || 
          !this.workspace.permissions.settings.includes('update')) {
        this.renderReadOnly();
        return;
      }
      
      // Fetch members
      const membersResponse = await fetch(
        `/api/workspaces/${this.workspaceId}/members`
      );
      this.members = (await membersResponse.json()).members;
      
      this.render();
    } catch (err) {
      this.renderError(err.message);
    }
  }

  render() {
    const html = `
      <div class="workspace-admin-panel">
        <div class="admin-header">
          <h2>🔧 Workspace Administration</h2>
          <p class="workspace-name">${this.workspace.workspace.name}</p>
        </div>
        
        <div class="admin-tabs">
          <button class="tab-btn ${this.currentTab === 'members' ? 'active' : ''}" 
                  onclick="this.parentElement.adminPanel.switchTab('members')">
            👥 Members (${this.members.length})
          </button>
          <button class="tab-btn ${this.currentTab === 'settings' ? 'active' : ''}"
                  onclick="this.parentElement.adminPanel.switchTab('settings')">
            ⚙️ Settings
          </button>
          <button class="tab-btn ${this.currentTab === 'audit' ? 'active' : ''}"
                  onclick="this.parentElement.adminPanel.switchTab('audit')">
            📋 Audit Log
          </button>
          <button class="tab-btn ${this.currentTab === 'billing' ? 'active' : ''}"
                  onclick="this.parentElement.adminPanel.switchTab('billing')">
            💳 Billing
          </button>
          <button class="tab-btn ${this.currentTab === 'analytics' ? 'active' : ''}"
                  onclick="this.parentElement.adminPanel.switchTab('analytics')">
            📊 Analytics
          </button>
        </div>
        
        <div class="admin-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    this.container.adminPanel = this;
  }

  renderTabContent() {
    switch (this.currentTab) {
      case 'members':
        return this.renderMembersTab();
      case 'settings':
        return this.renderSettingsTab();
      case 'audit':
        return this.renderAuditTab();
      case 'billing':
        return this.renderBillingTab();
      case 'analytics':
        return this.renderAnalyticsTab();
      default:
        return '<p>Select a tab</p>';
    }
  }

  renderMembersTab() {
    return `
      <div class="members-tab">
        <div class="members-header">
          <h3>Team Members</h3>
          <button class="invite-btn" onclick="this.parentElement.parentElement.parentElement.adminPanel.showInviteModal()">
            ➕ Invite Member
          </button>
        </div>
        
        <div class="members-list">
          ${this.members.length === 0 
            ? '<p class="empty">No members yet</p>'
            : this.members.map(member => `
              <div class="member-card">
                <div class="member-info">
                  <div class="member-name">${member.userId}</div>
                  <div class="member-email">${member.userEmail || 'Email pending'}</div>
                  <div class="member-status">
                    <span class="status-badge ${member.status}">
                      ${member.status === 'active' ? '🟢' : '⏳'} ${member.status}
                    </span>
                  </div>
                </div>
                
                <div class="member-role">
                  <select class="role-select" value="${member.role}" 
                          onchange="this.parentElement.parentElement.parentElement.parentElement.parentElement.adminPanel.changeRole('${member.memberId}', this.value)">
                    <option value="admin">👑 Admin</option>
                    <option value="member">👤 Member</option>
                    <option value="viewer">👁️ Viewer</option>
                  </select>
                </div>
                
                <div class="member-actions">
                  <button class="remove-btn" onclick="this.parentElement.parentElement.parentElement.parentElement.parentElement.adminPanel.removeMember('${member.memberId}')">
                    🗑️ Remove
                  </button>
                </div>
              </div>
            `).join('')
          }
        </div>
        
        <div class="members-info">
          <p>✓ ${this.members.filter(m => m.status === 'active').length} active members</p>
          <p>⏳ ${this.members.filter(m => m.status === 'pending_acceptance').length} pending invitations</p>
          <p class="limit-info">📊 ${this.members.length}/${this.workspace.workspace.settings.maxMembers} members limit</p>
        </div>
      </div>
    `;
  }

  renderSettingsTab() {
    const s = this.workspace.workspace.settings;
    return `
      <div class="settings-tab">
        <h3>Workspace Settings</h3>
        
        <form class="settings-form" onsubmit="event.preventDefault(); this.parentElement.parentElement.adminPanel.saveSettings(this)">
          <div class="setting-group">
            <label>Visibility</label>
            <select name="visibility" value="${s.visibility}">
              <option value="private">🔒 Private (invite only)</option>
              <option value="restricted">🔓 Restricted (pending approval)</option>
              <option value="public">🌐 Public (anyone can join)</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label>Require Approval for New Members</label>
            <input type="checkbox" name="requireApproval" ${s.requireApproval ? 'checked' : ''} />
            <p class="help-text">Admin must approve membership requests</p>
          </div>
          
          <div class="setting-group">
            <label>Require Two-Factor Authentication</label>
            <input type="checkbox" name="twoFactorRequired" ${s.twoFactorRequired ? 'checked' : ''} />
            <p class="help-text">All members must enable 2FA</p>
          </div>
          
          <div class="setting-group">
            <label>Backup Frequency</label>
            <select name="backupFrequency" value="${s.backupFrequency}">
              <option value="hourly">⚡ Hourly</option>
              <option value="daily">📅 Daily</option>
              <option value="weekly">📆 Weekly</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label>Default Member Role</label>
            <select name="defaultRole" value="${s.defaultRole}">
              <option value="viewer">👁️ Viewer (read-only)</option>
              <option value="member">👤 Member</option>
              <option value="admin">👑 Admin</option>
            </select>
          </div>
          
          <button type="submit" class="save-btn">💾 Save Settings</button>
        </form>
      </div>
    `;
  }

  renderAuditTab() {
    return `
      <div class="audit-tab">
        <h3>Audit Log</h3>
        <p class="help-text">All workspace actions are logged for security and compliance</p>
        
        <div class="audit-filters">
          <input type="text" placeholder="🔍 Filter by action..." class="filter-input" />
          <select class="date-filter">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>All time</option>
          </select>
        </div>
        
        <div class="audit-log" id="audit-log-container">
          <p>Loading audit log...</p>
        </div>
      </div>
    `;
  }

  renderBillingTab() {
    const limits = this.workspace.workspace.limits;
    return `
      <div class="billing-tab">
        <h3>Billing & Limits</h3>
        
        <div class="billing-card">
          <h4>Current Plan</h4>
          <div class="plan-info">
            <p class="tier">${this.workspace.workspace.tier.toUpperCase()} Tier</p>
            <p class="limits-grid">
              <span>👥 ${limits.maxMembers} Members Max</span>
              <span>🏢 ${limits.maxCompanies} Companies</span>
              <span>🤖 ${limits.maxBots} Bots</span>
              <span>⚡ ${limits.maxAPI_RequestsPerHour ? limits.maxAPI_RequestsPerHour + ' API/hr' : 'Unlimited API'}</span>
            </p>
          </div>
        </div>
        
        <div class="billing-card">
          <h4>Current Usage</h4>
          <div class="usage-grid">
            <div class="usage-item">
              <p class="label">Members</p>
              <p class="value">${this.members.length}/${limits.maxMembers}</p>
              <div class="progress-bar" style="width: ${(this.members.length / limits.maxMembers * 100)}%"></div>
            </div>
          </div>
        </div>
        
        <div class="billing-card">
          <h4>Upgrade Plan</h4>
          <button class="upgrade-btn" onclick="this.parentElement.parentElement.parentElement.adminPanel.showUpgradeModal()">
            🚀 View Plans
          </button>
        </div>
      </div>
    `;
  }

  renderAnalyticsTab() {
    return `
      <div class="analytics-tab">
        <h3>Workspace Analytics</h3>
        
        <div class="analytics-grid">
          <div class="analytics-card">
            <h4>Team Activity</h4>
            <div class="stat-large">8.3</div>
            <p>tasks per member/day</p>
          </div>
          
          <div class="analytics-card">
            <h4>Completion Rate</h4>
            <div class="stat-large">89%</div>
            <p>average completion rate</p>
          </div>
          
          <div class="analytics-card">
            <h4>Avg Response Time</h4>
            <div class="stat-large">2.1h</div>
            <p>time to first task assignment</p>
          </div>
          
          <div class="analytics-card">
            <h4>Bot Utilization</h4>
            <div class="stat-large">72%</div>
            <p>average bot usage</p>
          </div>
        </div>
        
        <div class="analytics-section">
          <h4>Recent Activity</h4>
          <p>Last 24 hours: 42 tasks completed, 3 members active, 5 bots running</p>
        </div>
      </div>
    `;
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    this.render();
  }

  async changeRole(memberId, newRole) {
    try {
      const response = await fetch(
        `/api/workspaces/${this.workspaceId}/members/${memberId}/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newRole,
            changedBy: this.userId
          })
        }
      );
      
      const result = await response.json();
      if (result.success) {
        alert(`✓ Role changed to ${newRole}`);
        this.init(); // Refresh
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async removeMember(memberId) {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `/api/workspaces/${this.workspaceId}/members/${memberId}?removedBy=${this.userId}`,
        { method: 'DELETE' }
      );
      
      const result = await response.json();
      if (result.success) {
        alert('✓ Member removed');
        this.init(); // Refresh
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async saveSettings(form) {
    const formData = new FormData(form);
    const settings = Object.fromEntries(formData);
    
    try {
      const response = await fetch(
        `/api/workspaces/${this.workspaceId}/settings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            settings
          })
        }
      );
      
      const result = await response.json();
      if (result.success) {
        alert('✓ Settings saved');
        this.init(); // Refresh
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  showInviteModal() {
    const email = prompt('Enter email address to invite:');
    if (!email) return;
    
    const role = prompt('Role (admin/member/viewer)?', 'member');
    if (!role) return;
    
    this.inviteMember(email, role);
  }

  async inviteMember(email, role) {
    try {
      const response = await fetch(
        `/api/workspaces/${this.workspaceId}/invite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            inviteeEmail: email,
            role,
            invitedBy: this.userId
          })
        }
      );
      
      const result = await response.json();
      if (result.success) {
        alert(`✓ Invitation sent to ${email}\nCode: ${result.invitationCode}`);
        this.init(); // Refresh
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  renderAccessDenied() {
    this.container.innerHTML = `
      <div class="error-box">
        <h2>🔒 Access Denied</h2>
        <p>You don't have permission to access this workspace's admin panel.</p>
      </div>
    `;
  }

  renderReadOnly() {
    this.container.innerHTML = `
      <div class="warning-box">
        <h2>👁️ Read-Only Access</h2>
        <p>You have read-only access to this workspace. Contact an admin to make changes.</p>
      </div>
    `;
  }

  renderError(message) {
    this.container.innerHTML = `
      <div class="error-box">
        <h2>❌ Error</h2>
        <p>${message}</p>
      </div>
    `;
  }

  showUpgradeModal() {
    alert('🚀 Upgrade your plan to unlock more features!');
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkspaceAdminPanel;
}
