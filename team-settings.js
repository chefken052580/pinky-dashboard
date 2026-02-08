/**
 * Team Settings - JavaScript
 * Manage workspace members, invitations, and settings
 */

class TeamSettings {
  constructor() {
    this.apiBase = 'http://192.168.254.4:3030/api';
    this.currentWorkspace = null;
    this.workspaces = [];
  }

  /**
   * Initialize team settings
   */
  async init() {
    await this.loadWorkspaces();
    await this.loadMembers();
    await this.loadInvitations();
    await this.loadSettings();
  }

  /**
   * Load user's workspaces
   */
  async loadWorkspaces() {
    try {
      const response = await fetch(`${this.apiBase}/workspaces`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.workspaces = data.workspaces || [];
      
      // Populate workspace selector
      const selector = document.getElementById('workspace-selector');
      selector.innerHTML = this.workspaces.map(ws => `
        <option value="${ws.workspaceId}" ${ws.isPrimary ? 'selected' : ''}>
          ${ws.name} (${ws.userRole})
        </option>
      `).join('');
      
      // Set current workspace
      if (this.workspaces.length > 0) {
        this.currentWorkspace = this.workspaces.find(ws => ws.isPrimary) || this.workspaces[0];
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  }

  /**
   * Switch workspace
   */
  async switchWorkspace() {
    const selector = document.getElementById('workspace-selector');
    const workspaceId = selector.value;
    
    this.currentWorkspace = this.workspaces.find(ws => ws.workspaceId === workspaceId);
    
    // Reload all data
    await this.loadMembers();
    await this.loadInvitations();
    await this.loadSettings();
  }

  /**
   * Switch tab
   */
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
  }

  /**
   * Load members
   */
  async loadMembers() {
    if (!this.currentWorkspace) return;
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}/members`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const members = data.members || [];
      
      const membersList = document.getElementById('members-list');
      
      if (members.length === 0) {
        membersList.innerHTML = '<div class="empty-state">No members yet</div>';
        return;
      }
      
      membersList.innerHTML = members.map(member => `
        <div class="member-card">
          <div class="member-avatar">${member.displayName.charAt(0)}</div>
          <div class="member-info">
            <h3>${member.displayName}</h3>
            <p>${member.email}</p>
          </div>
          <div class="member-role">
            <span class="role-badge role-${member.role}">${member.role}</span>
          </div>
          <div class="member-actions">
            ${member.role !== 'owner' ? `
              <button class="btn-small" onclick="TeamSettings.changeMemberRole('${member.userId}')">
                Change Role
              </button>
              <button class="btn-small btn-danger" onclick="TeamSettings.removeMember('${member.userId}', '${member.displayName}')">
                Remove
              </button>
            ` : '<span class="owner-badge">Owner</span>'}
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load members:', error);
      document.getElementById('members-list').innerHTML = '<div class="error">Failed to load members</div>';
    }
  }

  /**
   * Load invitations
   */
  async loadInvitations() {
    if (!this.currentWorkspace) return;
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}/invitations`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const invitations = (data.invitations || []).filter(inv => inv.status === 'pending');
      
      const invitationsList = document.getElementById('invitations-list');
      
      if (invitations.length === 0) {
        invitationsList.innerHTML = '<div class="empty-state">No pending invitations</div>';
        return;
      }
      
      invitationsList.innerHTML = invitations.map(inv => `
        <div class="invitation-card">
          <div class="invitation-info">
            <h3>${inv.email}</h3>
            <p>Role: <span class="role-badge role-${inv.role}">${inv.role}</span></p>
            <p class="invitation-date">Sent: ${new Date(inv.createdAt).toLocaleDateString()}</p>
          </div>
          <div class="invitation-actions">
            <button class="btn-small" onclick="TeamSettings.copyInviteLink('${inv.token}')">
              📋 Copy Link
            </button>
            <button class="btn-small btn-danger" onclick="TeamSettings.cancelInvitation('${inv.inviteId}')">
              Cancel
            </button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load invitations:', error);
      document.getElementById('invitations-list').innerHTML = '<div class="error">Failed to load invitations</div>';
    }
  }

  /**
   * Load workspace settings
   */
  async loadSettings() {
    if (!this.currentWorkspace) return;
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const workspace = data.workspace;
      
      // Populate form
      document.getElementById('workspace-name').value = workspace.name;
      document.getElementById('default-model').value = workspace.settings.defaultModel;
      document.getElementById('timezone').value = workspace.settings.timezone;
      document.getElementById('enable-heartbeat').checked = workspace.settings.enableHeartbeat;
      
      // Features
      document.getElementById('feature-social').checked = workspace.settings.features.socialBot;
      document.getElementById('feature-tasks').checked = workspace.settings.features.tasksBot;
      document.getElementById('feature-filesystem').checked = workspace.settings.features.filesystemBot;
      document.getElementById('feature-selfhealing').checked = workspace.settings.features.selfHealing;
      document.getElementById('feature-multicompany').checked = workspace.settings.features.multiCompany;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Show invite modal
   */
  showInviteModal() {
    document.getElementById('invite-modal').style.display = 'flex';
    document.getElementById('invite-email').value = '';
    document.getElementById('invite-role').value = 'member';
  }

  /**
   * Close invite modal
   */
  closeInviteModal() {
    document.getElementById('invite-modal').style.display = 'none';
  }

  /**
   * Send invitation
   */
  async sendInvite() {
    const email = document.getElementById('invite-email').value;
    const role = document.getElementById('invite-role').value;
    
    if (!email) {
      alert('Please enter an email address');
      return;
    }
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      alert(`Invitation sent to ${email}!\n\nInvite link: ${data.invitation.inviteLink}`);
      this.closeInviteModal();
      await this.loadInvitations();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  }

  /**
   * Copy invite link
   */
  copyInviteLink(token) {
    const link = `https://pinkybot.io/invite/${token}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(inviteId) {
    if (!confirm('Cancel this invitation?')) return;
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}/invitations/${inviteId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      alert('Invitation cancelled');
      await this.loadInvitations();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      alert('Failed to cancel invitation');
    }
  }

  /**
   * Change member role
   */
  async changeMemberRole(userId) {
    const newRole = prompt('Enter new role (admin, member, viewer, guest):');
    if (!newRole || !['admin', 'member', 'viewer', 'guest'].includes(newRole)) {
      alert('Invalid role');
      return;
    }
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      alert('Role updated');
      await this.loadMembers();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    }
  }

  /**
   * Remove member
   */
  async removeMember(userId, displayName) {
    if (!confirm(`Remove ${displayName} from this workspace?`)) return;
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}/members/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      alert('Member removed');
      await this.loadMembers();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    }
  }

  /**
   * Save settings
   */
  async saveSettings() {
    const settings = {
      name: document.getElementById('workspace-name').value,
      settings: {
        defaultModel: document.getElementById('default-model').value,
        timezone: document.getElementById('timezone').value,
        enableHeartbeat: document.getElementById('enable-heartbeat').checked,
        features: {
          socialBot: document.getElementById('feature-social').checked,
          tasksBot: document.getElementById('feature-tasks').checked,
          filesystemBot: document.getElementById('feature-filesystem').checked,
          selfHealing: document.getElementById('feature-selfhealing').checked,
          multiCompany: document.getElementById('feature-multicompany').checked
        }
      }
    };
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      alert('Settings saved!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace() {
    const confirmation = prompt('Type the workspace name to confirm deletion:');
    if (confirmation !== this.currentWorkspace.name) {
      alert('Workspace name does not match');
      return;
    }
    
    try {
      const response = await fetch(`${this.apiBase}/workspaces/${this.currentWorkspace.workspaceId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      alert('Workspace deleted');
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      alert('Failed to delete workspace');
    }
  }
}

// Global instance
const teamSettings = new TeamSettings();
window.TeamSettings = teamSettings;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => teamSettings.init());
} else {
  teamSettings.init();
}
