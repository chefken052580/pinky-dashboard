/**
 * System Health Widget
 * Displays live CPU, Memory, and Disk usage metrics
 */

class SystemHealthWidget {
    constructor() {
        this.updateInterval = 5000; // Update every 5 seconds
        this.containerId = 'system-health-widget';
        this.refreshInterval = null;
        this.metrics = null;
    }

    /**
     * Initialize the system health widget
     */
    async initialize() {
        this.createWidgetHTML();
        await this.updateMetrics();
        this.startAutoRefresh();
    }

    /**
     * Create the widget HTML structure
     */
    createWidgetHTML() {
        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'system-health-widget';
        container.innerHTML = `
            <div class="widget-header">
                <h3>💻 System Health</h3>
                <div class="refresh-indicator" title="Last updated">
                    <span class="dot"></span>
                    <span id="last-update">Updating...</span>
                </div>
            </div>

            <div class="metrics-grid">
                <!-- CPU Metric -->
                <div class="metric-card cpu-metric">
                    <div class="metric-header">
                        <span class="metric-icon">⚙️</span>
                        <span class="metric-label">CPU Usage</span>
                    </div>
                    <div class="metric-body">
                        <div class="metric-value" id="cpu-usage">--</div>
                        <div class="metric-bar">
                            <div class="metric-fill" id="cpu-bar" style="width: 0%"></div>
                        </div>
                        <div class="metric-details">
                            <div>Cores: <strong id="cpu-cores">--</strong></div>
                            <div>Load (1m): <strong id="cpu-load">--</strong></div>
                        </div>
                    </div>
                </div>

                <!-- Memory Metric -->
                <div class="metric-card memory-metric">
                    <div class="metric-header">
                        <span class="metric-icon">🧠</span>
                        <span class="metric-label">Memory Usage</span>
                    </div>
                    <div class="metric-body">
                        <div class="metric-value" id="memory-usage">--</div>
                        <div class="metric-bar">
                            <div class="metric-fill" id="memory-bar" style="width: 0%"></div>
                        </div>
                        <div class="metric-details">
                            <div id="memory-detail">-- / -- GB</div>
                        </div>
                    </div>
                </div>

                <!-- Disk Metric -->
                <div class="metric-card disk-metric">
                    <div class="metric-header">
                        <span class="metric-icon">💾</span>
                        <span class="metric-label">Disk Usage</span>
                    </div>
                    <div class="metric-body">
                        <div class="metric-value" id="disk-usage">--</div>
                        <div class="metric-bar">
                            <div class="metric-fill" id="disk-bar" style="width: 0%"></div>
                        </div>
                        <div class="metric-details">
                            <div id="disk-detail">-- / -- GB</div>
                        </div>
                    </div>
                </div>

                <!-- Uptime Metric -->
                <div class="metric-card uptime-metric">
                    <div class="metric-header">
                        <span class="metric-icon">⏱️</span>
                        <span class="metric-label">Uptime</span>
                    </div>
                    <div class="metric-body">
                        <div class="metric-value" id="uptime-value">--</div>
                        <div class="metric-details">
                            <div>Process: <strong id="process-uptime">--</strong></div>
                            <div>System: <strong id="system-uptime">--</strong></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="widget-footer">
                <button id="health-refresh-btn" class="btn-refresh">🔄 Refresh Now</button>
                <div class="status-indicator">
                    <span id="health-status" class="status-badge">●</span>
                    <span id="health-status-text">Monitoring</span>
                </div>
            </div>
        `;

        // Insert into dashboard
        const mainContainer = document.querySelector('.dashboard-main') || 
                            document.querySelector('main') || 
                            document.body;
        mainContainer.appendChild(container);

        // Attach button listener
        const refreshBtn = document.getElementById('health-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.updateMetrics());
        }
    }

    /**
     * Fetch and update system health metrics
     */
    async updateMetrics() {
        try {
            const response = await fetch('/api/system/metrics');
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json(); this.metrics = data.metrics || data;
            this.renderMetrics();
            this.setStatus('online');
        } catch (error) {
            console.error('System health update error:', error);
            this.setStatus('error', error.message);
        }
    }

    /**
     * Render the collected metrics
     */
    renderMetrics() {
        if (!this.metrics) return;

        const m = this.metrics;
        const now = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });

        // CPU
        const cpuPercent = m.cpu.usage || 0;
        document.getElementById('cpu-usage').textContent = cpuPercent.toFixed(1) + '%';
        document.getElementById('cpu-bar').style.width = Math.min(cpuPercent, 100) + '%';
        document.getElementById('cpu-bar').className = 'metric-fill ' + this.getHealthStatus(cpuPercent, 80, 90);
        document.getElementById('cpu-cores').textContent = m.cpu.cores;
        document.getElementById('cpu-load').textContent = parseFloat(m.cpu.loadAvg['1min']).toFixed(2);

        // Memory
        const memPercent = m.memory.usage || 0;
        document.getElementById('memory-usage').textContent = memPercent.toFixed(1) + '%';
        document.getElementById('memory-bar').style.width = Math.min(memPercent, 100) + '%';
        document.getElementById('memory-bar').className = 'metric-fill ' + this.getHealthStatus(memPercent, 75, 90);
        document.getElementById('memory-detail').textContent = 
            `${(m.memory.used / 1024).toFixed(2)} / ${(m.memory.total / 1024).toFixed(2)} GB`;

        // Disk
        if (m.disk) {
            const diskPercent = m.disk.usage || 0;
            document.getElementById('disk-usage').textContent = diskPercent.toFixed(1) + '%';
            document.getElementById('disk-bar').style.width = Math.min(diskPercent, 100) + '%';
            document.getElementById('disk-bar').className = 'metric-fill ' + this.getHealthStatus(diskPercent, 80, 90);
            document.getElementById('disk-detail').textContent = 
                `${(m.disk.used / 1024 / 1024 / 1024).toFixed(2)} / ${(m.disk.total / 1024 / 1024 / 1024).toFixed(2)} GB`;
        } else {
            document.getElementById('disk-usage').textContent = 'N/A';
            document.getElementById('disk-detail').textContent = 'Not available';
        }

        // Uptime
        const processHours = Math.floor(m.uptime.process / 3600);
        const processMins = Math.floor((m.uptime.process % 3600) / 60);
        const systemHours = Math.floor(m.uptime.system / 3600);
        const systemDays = Math.floor(systemHours / 24);
        
        document.getElementById('uptime-value').textContent = `${processHours}h ${processMins}m`;
        document.getElementById('process-uptime').textContent = `${processHours}h ${processMins}m`;
        document.getElementById('system-uptime').textContent = `${systemDays}d ${systemHours % 24}h`;

        // Last update time
        document.getElementById('last-update').textContent = now;
    }

    /**
     * Determine health status based on percentage
     */
    getHealthStatus(percent, warningThreshold, criticalThreshold) {
        if (percent >= criticalThreshold) return 'critical';
        if (percent >= warningThreshold) return 'warning';
        return 'healthy';
    }

    /**
     * Set widget status indicator
     */
    setStatus(status, message = '') {
        const statusBadge = document.getElementById('health-status');
        const statusText = document.getElementById('health-status-text');
        
        if (statusBadge) {
            statusBadge.className = 'status-badge status-' + status;
        }
        
        if (statusText) {
            statusText.textContent = message || (status === 'online' ? 'Monitoring' : 'Error');
        }
    }

    /**
     * Start automatic refresh
     */
    startAutoRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        
        this.refreshInterval = setInterval(() => {
            this.updateMetrics();
        }, this.updateInterval);
    }

    /**
     * Stop automatic refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Destroy the widget
     */
    destroy() {
        this.stopAutoRefresh();
        const container = document.getElementById(this.containerId);
        if (container) {
            container.remove();
        }
    }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof SystemHealthWidget !== 'undefined') {
        const widget = new SystemHealthWidget();
        widget.initialize();
        
        // Store reference globally for management
        window.systemHealthWidget = widget;
    }
});
