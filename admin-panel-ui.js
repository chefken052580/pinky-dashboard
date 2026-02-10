// Admin Panel UI — Workspace Management for Admins
// Features: User management, workspace settings, analytics, role-based access

(function initAdminPanel() {
  const adminHTML = `
    <div id="admin-panel-container" class="admin-panel">
      <div class="admin-sidebar">
        <div class="admin-menu">
          <button class="admin-nav-btn active" data-section="dashboard">
            📊 Dashboard
          </button>
          <button class="admin-nav-btn" data-section="users">
            👥 User Management
          </button>
          <button class="admin-nav-btn" data-section="workspaces">
            🏢 Workspaces
          </button>
          <button class="admin-nav-btn" data-section="settings">
            ⚙️ Settings
          </button>
          <button class="admin-nav-btn" data-section="audit-log">
            📋 Audit Log
          </button>
        </div>
      </div>

      <div class="admin-content">
        <!-- Dashboard Section -->
        <section id="dashboard-section" class="admin-section active">
          <h2>Admin Dashboard</h2>
          <div class="dashboard-grid">
            <div class="stat-card">
              <div class="stat-label">Total Users</div>
              <div id="stat-total-users" class="stat-value">0</div>
              <div class="stat-change">+0% this month</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Active Workspaces</div>
              <div id="stat-active-workspaces" class="stat-value">0</div>
              <div class="stat-change">+0% this month</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Tasks</div>
              <div id="stat-total-tasks" class="stat-value">0</div>
              <div class="stat-change">+0% this month</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">System Health</div>
              <div id="stat-system-health" class="stat-value">100%</div>
              <div class="stat-change" style="color: #10b981;">✓ All systems online</div>
            </div>
          </div>

          <div class="admin-section-box">
            <h3>Recent Activity</h3>
            <div id="recent-activity-list" class="activity-list">
              <p class="placeholder">Loading recent activity...</p>
            </div>
          </div>
        </section>

        <!-- User Management Section -->
        <section id="users-section" class="admin-section">
          <h2>User Management</h2>
          
          <div class="admin-section-box">
            <h3>Add New User</h3>
            <form id="add-user-form" class="admin-form">
              <input type="text" id="new-user-email" placeholder="Email address" required>
              <select id="new-user-role" required>
                <option value="viewer">Viewer (read-only)</option>
                <option value="member">Member (edit tasks)</option>
                <option value="admin">Admin (full control)</option>
              </select>
              <button type="submit" class="btn-primary">Add User</button>
            </form>
          </div>

          <div class="admin-section-box">
            <h3>All Users</h3>
            <div class="table-responsive">
              <table id="users-table" class="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="users-tbody">
                  <tr><td colspan="5" class="placeholder">Loading users...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Workspaces Section -->
        <section id="workspaces-section" class="admin-section">
          <h2>Workspace Management</h2>

          <div class="admin-section-box">
            <h3>Create Workspace</h3>
            <form id="create-workspace-form" class="admin-form">
              <input type="text" id="workspace-name" placeholder="Workspace name" required>
              <textarea id="workspace-description" placeholder="Description (optional)" rows="3"></textarea>
              <button type="submit" class="btn-primary">Create Workspace</button>
            </form>
          </div>

          <div class="admin-section-box">
            <h3>All Workspaces</h3>
            <div class="workspaces-grid" id="workspaces-grid">
              <p class="placeholder">Loading workspaces...</p>
            </div>
          </div>
        </section>

        <!-- Settings Section -->
        <section id="settings-section" class="admin-section">
          <h2>System Settings</h2>

          <div class="admin-section-box">
            <h3>General Settings</h3>
            <form id="settings-form" class="admin-form">
              <label>
                Max Users per Workspace
                <input type="number" id="max-users" value="50" min="1">
              </label>
              <label>
                Max Tasks per Queue
                <input type="number" id="max-tasks" value="1000" min="1">
              </label>
              <label>
                <input type="checkbox" id="enable-notifications">
                Enable Email Notifications
              </label>
              <label>
                <input type="checkbox" id="enable-audit-logging" checked>
                Enable Audit Logging
              </label>
              <button type="submit" class="btn-primary">Save Settings</button>
            </form>
          </div>

          <div class="admin-section-box">
            <h3>Backup & Export</h3>
            <div class="button-group">
              <button id="backup-btn" class="btn-secondary">💾 Create Backup</button>
              <button id="export-users-btn" class="btn-secondary">📤 Export Users</button>
              <button id="export-workspaces-btn" class="btn-secondary">📤 Export Workspaces</button>
            </div>
          </div>
        </section>

        <!-- Audit Log Section -->
        <section id="audit-log-section" class="admin-section">
          <h2>Audit Log</h2>

          <div class="admin-section-box">
            <div class="filter-controls">
              <input type="text" id="audit-filter" placeholder="Filter by user or action...">
              <select id="audit-action-filter">
                <option value="">All Actions</option>
                <option value="user_created">User Created</option>
                <option value="user_deleted">User Deleted</option>
                <option value="role_changed">Role Changed</option>
                <option value="workspace_created">Workspace Created</option>
                <option value="task_created">Task Created</option>
                <option value="settings_changed">Settings Changed</option>
              </select>
            </div>

            <div class="table-responsive">
              <table id="audit-table" class="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody id="audit-tbody">
                  <tr><td colspan="5" class="placeholder">Loading audit log...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  function initAdmin() {
    const container = document.getElementById('admin-panel-container');
    
    if (container) {
      // Section navigation
      document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const section = e.target.dataset.section;
          switchSection(section);
        });
      });

      // Add user form
      document.getElementById('add-user-form').addEventListener('submit', addUser);
      
      // Create workspace form
      document.getElementById('create-workspace-form').addEventListener('submit', createWorkspace);
      
      // Settings form
      document.getElementById('settings-form').addEventListener('submit', saveSettings);
      
      // Backup/export buttons
      document.getElementById('backup-btn').addEventListener('click', createBackup);
      document.getElementById('export-users-btn').addEventListener('click', exportUsers);
      document.getElementById('export-workspaces-btn').addEventListener('click', exportWorkspaces);

      // Audit filters
      document.getElementById('audit-filter').addEventListener('input', filterAuditLog);
      document.getElementById('audit-action-filter').addEventListener('change', filterAuditLog);

      // Load initial data
      loadDashboardStats();
      loadUsers();
      loadWorkspaces();
      loadAuditLog();
    }
  }

  function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
      sec.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(section + '-section').classList.add('active');
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
  }

  async function loadDashboardStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const stats = await res.json();
      
      document.getElementById('stat-total-users').textContent = stats.totalUsers || 0;
      document.getElementById('stat-active-workspaces').textContent = stats.activeWorkspaces || 0;
      document.getElementById('stat-total-tasks').textContent = stats.totalTasks || 0;
      document.getElementById('stat-system-health').textContent = (stats.systemHealth || 100) + '%';
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      const tbody = document.getElementById('users-tbody');
      
      if (data.users && data.users.length > 0) {
        tbody.innerHTML = data.users.map(user => `
          <tr>
            <td>${user.email}</td>
            <td><span class="badge badge-${user.role}">${user.role}</span></td>
            <td>${new Date(user.joined).toLocaleDateString()}</td>
            <td>${user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}</td>
            <td>
              <button class="btn-sm" onclick="changeUserRole('${user.id}')">Edit</button>
              <button class="btn-sm btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  async function loadWorkspaces() {
    try {
      const res = await fetch('/api/admin/workspaces');
      const data = await res.json();
      const grid = document.getElementById('workspaces-grid');
      
      if (data.workspaces && data.workspaces.length > 0) {
        grid.innerHTML = data.workspaces.map(ws => `
          <div class="workspace-card">
            <h4>${ws.name}</h4>
            <p class="workspace-description">${ws.description}</p>
            <div class="workspace-meta">
              <span>Users: ${ws.memberCount}</span>
              <span>Tasks: ${ws.taskCount}</span>
            </div>
            <div class="workspace-actions">
              <button class="btn-sm" onclick="editWorkspace('${ws.id}')">Edit</button>
              <button class="btn-sm btn-danger" onclick="deleteWorkspace('${ws.id}')">Delete</button>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }

  async function loadAuditLog() {
    try {
      const res = await fetch('/api/admin/audit-log');
      const data = await res.json();
      const tbody = document.getElementById('audit-tbody');
      
      if (data.logs && data.logs.length > 0) {
        tbody.innerHTML = data.logs.map(log => `
          <tr>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.user}</td>
            <td><span class="badge badge-action">${log.action}</span></td>
            <td>${log.resource}</td>
            <td>${log.details}</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load audit log:', err);
    }
  }

  async function addUser(e) {
    e.preventDefault();
    const email = document.getElementById('new-user-email').value;
    const role = document.getElementById('new-user-role').value;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });

      if (res.ok) {
        alert('User added successfully');
        e.target.reset();
        loadUsers();
      } else {
        alert('Failed to add user');
      }
    } catch (err) {
      console.error('Error adding user:', err);
      alert('Error adding user');
    }
  }

  async function createWorkspace(e) {
    e.preventDefault();
    const name = document.getElementById('workspace-name').value;
    const description = document.getElementById('workspace-description').value;

    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });

      if (res.ok) {
        alert('Workspace created successfully');
        e.target.reset();
        loadWorkspaces();
      } else {
        alert('Failed to create workspace');
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
      alert('Error creating workspace');
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    const settings = {
      maxUsersPerWorkspace: parseInt(document.getElementById('max-users').value),
      maxTasksPerQueue: parseInt(document.getElementById('max-tasks').value),
      enableNotifications: document.getElementById('enable-notifications').checked,
      enableAuditLogging: document.getElementById('enable-audit-logging').checked
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        alert('Settings saved successfully');
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error saving settings');
    }
  }

  async function createBackup() {
    try {
      const res = await fetch('/api/admin/backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      console.error('Backup failed:', err);
      alert('Backup failed');
    }
  }

  async function exportUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed');
    }
  }

  async function exportWorkspaces() {
    try {
      const res = await fetch('/api/admin/workspaces');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workspaces-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed');
    }
  }

  function filterAuditLog() {
    const filter = document.getElementById('audit-filter').value.toLowerCase();
    const actionFilter = document.getElementById('audit-action-filter').value;
    const rows = document.querySelectorAll('#audit-tbody tr');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const action = row.cells[2]?.textContent || '';
      const matchesText = text.includes(filter);
      const matchesAction = !actionFilter || action.includes(actionFilter);
      
      row.style.display = (matchesText && matchesAction) ? '' : 'none';
    });
  }

  // Make functions globally available
  window.changeUserRole = changeUserRole;
  window.deleteUser = deleteUser;
  window.editWorkspace = editWorkspace;
  window.deleteWorkspace = deleteWorkspace;

  async function changeUserRole(userId) {
    const newRole = prompt('Enter new role (admin/member/viewer):');
    if (newRole) {
      try {
        const res = await fetch('/api/admin/users/' + userId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        });

        if (res.ok) {
          loadUsers();
        }
      } catch (err) {
        alert('Failed to update role');
      }
    }
  }

  async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const res = await fetch('/api/admin/users/' + userId, { method: 'DELETE' });
        if (res.ok) loadUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  }

  async function editWorkspace(workspaceId) {
    alert('Edit workspace modal would open here');
  }

  async function deleteWorkspace(workspaceId) {
    if (confirm('Delete this workspace? This cannot be undone.')) {
      try {
        const res = await fetch('/api/admin/workspaces/' + workspaceId, { method: 'DELETE' });
        if (res.ok) loadWorkspaces();
      } catch (err) {
        alert('Failed to delete workspace');
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }

  // Return initialization function for manual trigger
  return { init: initAdmin, html: adminHTML };
})();
