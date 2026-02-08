// Header Live Data Manager - Updates dashboard header with real-time task counts
// Responsible for: Tasks Today, Bots Active, System Status

class HeaderLiveDataManager {
    constructor() {
        this.updateInterval = null;
        this.refreshRate = 30000; // Update every 30 seconds
        this.initialized = false;
        console.log('[HeaderLiveData] Manager created');
    }

    async init() {
        if (this.initialized) return;
        console.log('[HeaderLiveData] Initializing...');
        
        // Do first update immediately
        await this.updateTasksToday();
        
        // Set up periodic updates
        this.updateInterval = setInterval(() => {
            this.updateTasksToday();
        }, this.refreshRate);
        
        this.initialized = true;
        console.log('[HeaderLiveData] Initialized and ready');
    }

    async updateTasksToday() {
        try {
            const response = await fetch((typeof API_BASE !== 'undefined' ? API_BASE : '') + '/api/tasks');
            if (!response.ok) {
                console.warn('[HeaderLiveData] API returned non-200 status:', response.status);
                return;
            }
            
            const tasks = await response.json();
            if (!Array.isArray(tasks)) {
                console.warn('[HeaderLiveData] API did not return an array');
                return;
            }

            // Calculate tasks completed today (match current date in EST)
            const estTime = this.getESTDateTime();
            const todayString = estTime.toISOString().split('T')[0]; // YYYY-MM-DD
            
            const todayCompletedTasks = tasks.filter(task => {
                if (!task.updated || task.status !== 'completed') return false;
                
                // Extract date part from updated timestamp
                const taskDate = task.updated.split('T')[0];
                return taskDate === todayString;
            });

            const count = todayCompletedTasks.length;
            
            // Update DOM
            const countElement = document.getElementById('tasks-today-count');
            if (countElement) {
                countElement.textContent = count;
            }
            
            console.log(`[HeaderLiveData] Updated tasks today: ${count} (${todayString})`);
        } catch (error) {
            console.error('[HeaderLiveData] Error updating tasks:', error);
        }
    }

    getESTDateTime() {
        // Create a date in EST timezone
        const now = new Date();
        const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        return estTime;
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.initialized = false;
        console.log('[HeaderLiveData] Destroyed');
    }
}

// Create global instance
let headerLiveDataManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!headerLiveDataManager) {
        headerLiveDataManager = new HeaderLiveDataManager();
        headerLiveDataManager.init();
    }
});

// Expose to window for manual control if needed
window.HeaderLiveDataManager = HeaderLiveDataManager;
window.headerLiveDataManager = () => headerLiveDataManager;
