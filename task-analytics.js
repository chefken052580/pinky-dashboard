/**
 * Task Analytics Dashboard
 * Displays task completion trends, priority distribution, and productivity insights
 */

class TaskAnalyticsDashboard {
    constructor(targetContainerId = null) {
        this.containerId = 'task-analytics-widget';
        this.targetContainerId = targetContainerId; // Where to render the widget
        this.data = {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            analysisTasks: 0,
            completionRate: 0,
            avgCompletionTime: 0,
            priorityDistribution: { P1: 0, P2: 0, P3: 0, '-': 0 },
            completedToday: 0,
            completedThisWeek: 0,
            completedThisMonth: 0,
            tasksByStatus: {}
        };
        this.refreshInterval = 10000; // Update every 10 seconds
        this.chartInstance = null;
    }

    /**
     * Initialize the analytics dashboard
     */
    async initialize() {
        this.createWidgetHTML();
        await this.loadAnalytics();
        this.startAutoRefresh();
    }

    /**
     * Create the widget HTML structure
     */
    createWidgetHTML() {
        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'task-analytics-widget';
        container.innerHTML = `
            <div class="analytics-header">
                <h3>📊 Task Analytics</h3>
                <div class="analytics-controls">
                    <button id="analytics-refresh-btn" title="Refresh analytics" class="refresh-btn">⟳</button>
                    <select id="analytics-period" class="period-select">
                        <option value="all">All Time</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
            </div>

            <div class="analytics-grid">
                <!-- Completion Rate Card -->
                <div class="analytics-card completion-rate">
                    <div class="card-header">
                        <span class="card-icon">✅</span>
                        <span class="card-title">Completion Rate</span>
                    </div>
                    <div class="card-value" id="completion-rate">0%</div>
                    <div class="card-subtitle" id="completion-subtitle">0 / 0 tasks</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="completion-progress" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Average Completion Time Card -->
                <div class="analytics-card avg-time">
                    <div class="card-header">
                        <span class="card-icon">⏱️</span>
                        <span class="card-title">Avg Completion</span>
                    </div>
                    <div class="card-value" id="avg-completion-time">0d</div>
                    <div class="card-subtitle">time to complete</div>
                </div>

                <!-- Tasks Completed Today Card -->
                <div class="analytics-card today-tasks">
                    <div class="card-header">
                        <span class="card-icon">📈</span>
                        <span class="card-title">Today</span>
                    </div>
                    <div class="card-value" id="tasks-today">0</div>
                    <div class="card-subtitle">tasks completed</div>
                </div>

                <!-- Week Progress Card -->
                <div class="analytics-card week-tasks">
                    <div class="card-header">
                        <span class="card-icon">📅</span>
                        <span class="card-title">This Week</span>
                    </div>
                    <div class="card-value" id="tasks-week">0</div>
                    <div class="card-subtitle">tasks completed</div>
                </div>
            </div>

            <div class="analytics-section">
                <h4>Task Distribution by Priority</h4>
                <div class="priority-distribution">
                    <div class="priority-item">
                        <div class="priority-label">
                            <span class="priority-badge p1">P1</span>
                            <span class="priority-name">Critical</span>
                        </div>
                        <div class="priority-bar">
                            <div class="priority-fill p1" id="p1-bar" style="width: 0%"></div>
                        </div>
                        <span class="priority-count" id="p1-count">0</span>
                    </div>

                    <div class="priority-item">
                        <div class="priority-label">
                            <span class="priority-badge p2">P2</span>
                            <span class="priority-name">High</span>
                        </div>
                        <div class="priority-bar">
                            <div class="priority-fill p2" id="p2-bar" style="width: 0%"></div>
                        </div>
                        <span class="priority-count" id="p2-count">0</span>
                    </div>

                    <div class="priority-item">
                        <div class="priority-label">
                            <span class="priority-badge p3">P3</span>
                            <span class="priority-name">Normal</span>
                        </div>
                        <div class="priority-bar">
                            <div class="priority-fill p3" id="p3-bar" style="width: 0%"></div>
                        </div>
                        <span class="priority-count" id="p3-count">0</span>
                    </div>

                    <div class="priority-item">
                        <div class="priority-label">
                            <span class="priority-badge unset">-</span>
                            <span class="priority-name">Unset</span>
                        </div>
                        <div class="priority-bar">
                            <div class="priority-fill unset" id="unset-bar" style="width: 0%"></div>
                        </div>
                        <span class="priority-count" id="unset-count">0</span>
                    </div>
                </div>
            </div>

            <div class="analytics-section">
                <h4>Task Status Summary</h4>
                <div class="status-summary" id="status-summary">
                    <!-- Status cards will be inserted here -->
                </div>
            </div>

            <div class="analytics-footer">
                <span id="analytics-last-update">Last updated: --</span>
            </div>
        `;

        // Append to target container or body
        const targetElement = this.targetContainerId 
            ? document.getElementById(this.targetContainerId) 
            : document.body;
        
        if (targetElement) {
            targetElement.appendChild(container);
        } else {
            console.warn(`[TaskAnalytics] Target container '${this.targetContainerId}' not found, appending to body`);
            document.body.appendChild(container);
        }

        // Add event listeners
        document.getElementById('analytics-refresh-btn')?.addEventListener('click', () => this.loadAnalytics());
        document.getElementById('analytics-period')?.addEventListener('change', () => this.loadAnalytics());
    }

    /**
     * Load and analyze task data
     */
    async loadAnalytics() {
        try {
            const response = await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/tasks');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const tasks = await response.json();
            if (!Array.isArray(tasks)) {
                console.warn('Task analytics: Expected array, got', typeof tasks);
                return;
            }

            this.analyzeData(tasks);
            this.renderAnalytics();
        } catch (err) {
            console.error('Task analytics error:', err.message);
        }
    }

    /**
     * Analyze task data
     */
    analyzeData(tasks) {
        this.data.totalTasks = tasks.length;
        this.data.completedTasks = tasks.filter(t => t.status === 'completed').length;
        this.data.pendingTasks = tasks.filter(t => t.status === 'pending').length;
        this.data.analysisTasks = tasks.filter(t => t.status === 'analysis-ready').length;
        
        // Completion rate
        this.data.completionRate = this.data.totalTasks > 0 
            ? Math.round((this.data.completedTasks / this.data.totalTasks) * 100)
            : 0;

        // Priority distribution
        this.data.priorityDistribution = { P1: 0, P2: 0, P3: 0, '-': 0 };
        tasks.forEach(t => {
            const priority = t.priority || '-';
            if (priority in this.data.priorityDistribution) {
                this.data.priorityDistribution[priority]++;
            }
        });

        // Time-based completion
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

        this.data.completedToday = tasks.filter(t => {
            if (t.status !== 'completed') return false;
            const updated = new Date(t.updated).getTime();
            return updated > oneDayAgo;
        }).length;

        this.data.completedThisWeek = tasks.filter(t => {
            if (t.status !== 'completed') return false;
            const updated = new Date(t.updated).getTime();
            return updated > sevenDaysAgo;
        }).length;

        // Average completion time (simplified)
        const completedTasks = tasks.filter(t => t.status === 'completed');
        if (completedTasks.length > 0) {
            // Calculate average days between assigned and updated
            let totalDays = 0;
            completedTasks.forEach(t => {
                const assigned = new Date(t.assigned).getTime();
                const updated = new Date(t.updated).getTime();
                const days = (updated - assigned) / (24 * 60 * 60 * 1000);
                totalDays += Math.max(0, days);
            });
            this.data.avgCompletionTime = Math.round(totalDays / completedTasks.length);
        }

        // Status breakdown
        this.data.tasksByStatus = {};
        tasks.forEach(t => {
            const status = t.status || 'unknown';
            this.data.tasksByStatus[status] = (this.data.tasksByStatus[status] || 0) + 1;
        });
    }

    /**
     * Render analytics to DOM
     */
    renderAnalytics() {
        // Update completion rate
        const completionDiv = document.getElementById('completion-rate');
        const completionSubtitle = document.getElementById('completion-subtitle');
        const completionProgress = document.getElementById('completion-progress');
        if (completionDiv) {
            completionDiv.textContent = this.data.completionRate + '%';
            completionSubtitle.textContent = `${this.data.completedTasks} / ${this.data.totalTasks} tasks`;
            completionProgress.style.width = this.data.completionRate + '%';
        }

        // Update average completion time
        const avgTimeDiv = document.getElementById('avg-completion-time');
        if (avgTimeDiv) {
            const days = this.data.avgCompletionTime;
            avgTimeDiv.textContent = days === 0 ? 'Same day' : `${days}d`;
        }

        // Update today and this week
        document.getElementById('tasks-today').textContent = this.data.completedToday;
        document.getElementById('tasks-week').textContent = this.data.completedThisWeek;

        // Update priority distribution
        const totalTasks = this.data.totalTasks || 1;
        const priorities = { P1: 'p1', P2: 'p2', P3: 'p3', '-': 'unset' };
        
        Object.entries(priorities).forEach(([priority, className]) => {
            const count = this.data.priorityDistribution[priority] || 0;
            const percentage = (count / totalTasks) * 100;
            
            document.getElementById(`${className}-bar`)?.style.setProperty('width', percentage + '%');
            document.getElementById(`${className}-count`).textContent = count;
        });

        // Update status summary
        this.renderStatusSummary();

        // Update timestamp
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        document.getElementById('analytics-last-update').textContent = `Last updated: ${timeStr}`;
    }

    /**
     * Render status summary cards
     */
    renderStatusSummary() {
        const container = document.getElementById('status-summary');
        if (!container) return;

        const statusIcons = {
            'completed': '✅',
            'pending': '⏳',
            'analysis-ready': '🔍',
            'in-progress': '🔄',
            'blocked': '🚫'
        };

        let html = '';
        Object.entries(this.data.tasksByStatus).forEach(([status, count]) => {
            const icon = statusIcons[status] || '📋';
            const displayName = status.replace(/-/g, ' ').toUpperCase();
            html += `
                <div class="status-card status-${status}">
                    <span class="status-icon">${icon}</span>
                    <div class="status-info">
                        <div class="status-count">${count}</div>
                        <div class="status-name">${displayName}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            setInterval(() => this.loadAnalytics(), this.refreshInterval);
        }
    }
}

// Export class for manual initialization
window.TaskAnalyticsDashboard = TaskAnalyticsDashboard;

// Create a singleton instance for tasks view analytics (doesn't auto-initialize)
window.tasksViewAnalytics = null;

// Function to render analytics in tasks view
window.renderTasksViewAnalytics = function() {
    if (!window.tasksViewAnalytics) {
        window.tasksViewAnalytics = new TaskAnalyticsDashboard('task-analytics-widget');
        window.tasksViewAnalytics.initialize();
        console.log('[Tasks View] Analytics initialized');
    } else {
        window.tasksViewAnalytics.loadAnalytics();
        console.log('[Tasks View] Analytics refreshed');
    }
};
