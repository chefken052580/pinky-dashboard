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

        // Attach button listener with retry and event delegation
        const attachRefreshListener = () => {
            const refreshBtn = document.getElementById('health-refresh-btn');
            if (refreshBtn) {
                refreshBtn.onclick = null; // Clear any previous listeners
                refreshBtn.addEventListener('click', (e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[SystemHealth] Refresh clicked');
                    this.hostInfo = null; 
                    this.updateMetrics(); 
                });
                console.log('[SystemHealth] Refresh button listener attached');
            } else {
                // Retry if button not found yet
                setTimeout(attachRefreshListener, 100);
            }
        };
        attachRefreshListener();
    }

    /**
     * Fetch and update system health metrics
     */
    async updateMetrics() {
        try {
            // Get widget container for loading spinner
            const widgetContainer = document.getElementById(this.containerId);
            
            // Use apiFetch() wrapper with loading spinner
            const data = await apiFetch('/api/system/metrics', {}, widgetContainer);
            
            if (data) {
                this.metrics = data.metrics || data;
                
                // Fetch host stats (PowerShell is slow ~2s, so non-blocking)
                if (!this.hostInfo) {
                    const hostData = await apiFetch('/api/system/host');
                    if (hostData && hostData.success) {
                        this.hostInfo = hostData.host;
                        this.renderMetrics();
                    }
                } else {
                    // Refresh host stats every 30s
                    if (!this._lastHostFetch || Date.now() - this._lastHostFetch > 30000) {
                        this._lastHostFetch = Date.now();
                        const hostData = await apiFetch('/api/system/host');
                        if (hostData && hostData.success) {
                            this.hostInfo = hostData.host;
                            this.renderMetrics();
                        }
                    }
                }
                this.renderMetrics();
                this.setStatus('online');
            } else {
                throw new Error('Failed to load system metrics');
            }
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

        // Use host stats as primary if available, fall back to container metrics
        const h = this.hostInfo || {};
        const hasHost = h.ramGB > 0;

        // CPU - prefer host live CPU
        const cpuPercent = hasHost ? (h.cpuPercent || 0) : (m.cpu.usage || 0);
        document.getElementById('cpu-usage').textContent = (typeof cpuPercent === 'number' ? cpuPercent.toFixed(1) : cpuPercent) + '%';
        document.getElementById('cpu-bar').style.width = Math.min(cpuPercent, 100) + '%';
        document.getElementById('cpu-bar').className = 'metric-fill ' + this.getHealthStatus(cpuPercent, 80, 90);
        document.getElementById('cpu-cores').textContent = hasHost ? h.cores + ' cores' : m.cpu.cores + ' cores';
        document.getElementById('cpu-load').textContent = parseFloat(m.cpu.loadAvg['1min']).toFixed(2);

        // Memory - show host actual usage
        const memUsed = hasHost ? h.memUsedGB : (m.memory.used / 1024);
        const memTotal = hasHost ? h.memTotalGB : (m.memory.total / 1024);
        const memPercent = memTotal > 0 ? (memUsed / memTotal * 100) : 0;
        document.getElementById('memory-usage').textContent = memPercent.toFixed(1) + '%';
        document.getElementById('memory-bar').style.width = Math.min(memPercent, 100) + '%';
        document.getElementById('memory-bar').className = 'metric-fill ' + this.getHealthStatus(memPercent, 75, 90);
        document.getElementById('memory-detail').textContent = parseFloat(memUsed).toFixed(1) + ' / ' + parseFloat(memTotal).toFixed(1) + ' GB';

        // Disk - show all host drives
        if (hasHost && h.disks && h.disks.length > 0) {
            const totalDisk = h.disks.reduce((a, d) => a + d.totalGB, 0);
            const usedDisk = h.disks.reduce((a, d) => a + d.usedGB, 0);
            const diskPercent = totalDisk > 0 ? (usedDisk / totalDisk * 100) : 0;
            document.getElementById('disk-usage').textContent = diskPercent.toFixed(1) + '%';
            document.getElementById('disk-bar').style.width = Math.min(diskPercent, 100) + '%';
            document.getElementById('disk-bar').className = 'metric-fill ' + this.getHealthStatus(diskPercent, 80, 90);
            document.getElementById('disk-detail').textContent = h.disks.map(function(d) { return d.drive + ' ' + d.freeGB + '/' + d.totalGB + 'GB'; }).join(' | ');
        } else if (m.disk) {
            document.getElementById('disk-usage').textContent = (m.disk.usage || 0).toFixed(1) + '%';
            document.getElementById('disk-bar').style.width = Math.min(m.disk.usage || 0, 100) + '%';
            document.getElementById('disk-detail').textContent = (m.disk.used / 1024).toFixed(0) + ' / ' + (m.disk.total / 1024).toFixed(0) + ' GB';
        }

        // Uptime - prefer host uptime
        if (hasHost && h.uptime) {
            document.getElementById('uptime-value').textContent = h.uptime;
            document.getElementById('process-uptime').textContent = h.uptime;
            document.getElementById('system-uptime').textContent = (h.platform || '').replace('windows','Windows').replace('linux','Linux').replace('mac','macOS');
        } else {
            const uptimeSec = (typeof m.uptime === 'number') ? m.uptime : 0;
            const ph = Math.floor(uptimeSec / 3600);
            const pm = Math.floor((uptimeSec % 3600) / 60);
            document.getElementById('uptime-value').textContent = ph + 'h ' + pm + 'm';
            document.getElementById('process-uptime').textContent = ph + 'h ' + pm + 'm';
            document.getElementById('system-uptime').textContent = '';
        }

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
        
        // DISABLED this.refreshInterval = setInterval(() => {
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
