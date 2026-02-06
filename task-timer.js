/**
 * TASK TIMER MODULE
 * Manages elapsed time tracking for running tasks
 * Stores timer state in localStorage
 * Features:
 * - Start/pause/stop timers per task
 * - Live elapsed time display
 * - Automatic persistence across sessions
 * - Timer history and totals
 */

class TaskTimer {
  constructor() {
    this.timers = {}; // { taskId: { running: bool, elapsed: ms, startTime: timestamp, history: []{duration, startedAt, endedAt} } }
    this.updateCallbacks = []; // Callbacks when timer updates
    this.timerIntervals = {}; // Store setInterval IDs for cleanup
    this.loadTimers();
  }

  /**
   * Load timers from localStorage
   */
  loadTimers() {
    try {
      const saved = localStorage.getItem('taskTimers');
      if (saved) {
        this.timers = JSON.parse(saved);
        console.log('[TaskTimer] Loaded timers for', Object.keys(this.timers).length, 'tasks');
        // Resume running timers
        this.resumeRunningTimers();
      }
    } catch (e) {
      console.warn('[TaskTimer] Failed to load timers:', e);
      this.timers = {};
    }
  }

  /**
   * Save timers to localStorage
   */
  saveTimers() {
    try {
      localStorage.setItem('taskTimers', JSON.stringify(this.timers));
    } catch (e) {
      console.warn('[TaskTimer] Failed to save timers:', e);
    }
  }

  /**
   * Resume timers that were running when page was closed
   */
  resumeRunningTimers() {
    Object.entries(this.timers).forEach(([taskId, timer]) => {
      if (timer.running && timer.startTime) {
        // Recalculate elapsed time based on how long ago timer started
        const now = Date.now();
        const additionalElapsed = now - timer.startTime;
        timer.elapsed = (timer.elapsed || 0) + additionalElapsed;
        timer.startTime = now;
        this.startLiveUpdate(taskId);
      }
    });
  }

  /**
   * Start timer for a task
   */
  start(taskId) {
    if (!this.timers[taskId]) {
      this.timers[taskId] = {
        running: false,
        elapsed: 0,
        startTime: null,
        history: []
      };
    }

    const timer = this.timers[taskId];
    if (!timer.running) {
      timer.running = true;
      timer.startTime = Date.now();
      this.startLiveUpdate(taskId);
      this.saveTimers();
      console.log(`[TaskTimer] Started timer for task ${taskId}`);
    }
  }

  /**
   * Pause timer for a task
   */
  pause(taskId) {
    if (this.timers[taskId]) {
      const timer = this.timers[taskId];
      if (timer.running && timer.startTime) {
        const elapsed = Date.now() - timer.startTime;
        timer.elapsed = (timer.elapsed || 0) + elapsed;
        timer.running = false;
        timer.startTime = null;
        this.stopLiveUpdate(taskId);
        this.saveTimers();
        console.log(`[TaskTimer] Paused timer for task ${taskId}, elapsed: ${this.formatElapsed(timer.elapsed)}`);
        this.notifyUpdate();
      }
    }
  }

  /**
   * Stop and save timer (end of task)
   */
  stop(taskId) {
    if (this.timers[taskId]) {
      const timer = this.timers[taskId];
      if (timer.running && timer.startTime) {
        const elapsed = Date.now() - timer.startTime;
        timer.elapsed = (timer.elapsed || 0) + elapsed;
        timer.running = false;
        timer.startTime = null;
      }

      // Save to history
      if (!timer.history) timer.history = [];
      timer.history.push({
        duration: timer.elapsed,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString()
      });

      this.stopLiveUpdate(taskId);
      this.saveTimers();
      console.log(`[TaskTimer] Stopped timer for task ${taskId}, total: ${this.formatElapsed(timer.elapsed)}`);
      this.notifyUpdate();
    }
  }

  /**
   * Reset timer for a task
   */
  reset(taskId) {
    if (this.timers[taskId]) {
      this.stopLiveUpdate(taskId);
      this.timers[taskId] = {
        running: false,
        elapsed: 0,
        startTime: null,
        history: []
      };
      this.saveTimers();
      console.log(`[TaskTimer] Reset timer for task ${taskId}`);
      this.notifyUpdate();
    }
  }

  /**
   * Get current elapsed time for task
   */
  getElapsed(taskId) {
    if (!this.timers[taskId]) return 0;
    const timer = this.timers[taskId];
    let elapsed = timer.elapsed || 0;
    if (timer.running && timer.startTime) {
      elapsed += Date.now() - timer.startTime;
    }
    return elapsed;
  }

  /**
   * Check if timer is running
   */
  isRunning(taskId) {
    return this.timers[taskId] && this.timers[taskId].running;
  }

  /**
   * Get total time for task (all sessions)
   */
  getTotal(taskId) {
    if (!this.timers[taskId]) return 0;
    const timer = this.timers[taskId];
    let total = timer.elapsed || 0;
    if (timer.history && Array.isArray(timer.history)) {
      total += timer.history.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    }
    return total;
  }

  /**
   * Format milliseconds to HH:MM:SS
   */
  formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Start live update timer for running timer display
   */
  startLiveUpdate(taskId) {
    // Clear existing interval if any
    if (this.timerIntervals[taskId]) {
      clearInterval(this.timerIntervals[taskId]);
    }

    // Update display every 100ms (smooth live display)
    this.timerIntervals[taskId] = setInterval(() => {
      this.notifyUpdate(taskId);
    }, 100);
  }

  /**
   * Stop live update timer
   */
  stopLiveUpdate(taskId) {
    if (this.timerIntervals[taskId]) {
      clearInterval(this.timerIntervals[taskId]);
      delete this.timerIntervals[taskId];
    }
  }

  /**
   * Register callback for timer updates
   */
  onChange(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Notify all callbacks of update
   */
  notifyUpdate(taskId = null) {
    this.updateCallbacks.forEach(cb => {
      try {
        cb(taskId);
      } catch (e) {
        console.error('[TaskTimer] Callback error:', e);
      }
    });
  }

  /**
   * Get timer state for a task (for UI rendering)
   */
  getState(taskId) {
    const timer = this.timers[taskId];
    if (!timer) {
      return { running: false, elapsed: 0, total: 0 };
    }
    return {
      running: timer.running,
      elapsed: this.getElapsed(taskId),
      total: this.getTotal(taskId),
      history: timer.history || []
    };
  }

  /**
   * Export timer data as CSV
   */
  exportAsCSV(taskId) {
    const timer = this.timers[taskId];
    if (!timer) return '';

    let csv = 'Task ID,Session,Duration,Started At,Ended At\n';
    
    if (timer.history && Array.isArray(timer.history)) {
      timer.history.forEach((entry, idx) => {
        const duration = this.formatElapsed(entry.duration);
        csv += `${taskId},Session ${idx + 1},${duration},"${entry.startedAt}","${entry.endedAt}"\n`;
      });
    }

    return csv;
  }

  /**
   * Get summary stats
   */
  getSummary() {
    const summary = {
      tasksTracked: Object.keys(this.timers).length,
      activeTimers: Object.values(this.timers).filter(t => t.running).length,
      totalTrackedTime: 0
    };

    Object.values(this.timers).forEach(timer => {
      summary.totalTrackedTime += this.getElapsed(timer);
    });

    return summary;
  }

  /**
   * Clear all timers (DESTRUCTIVE)
   */
  clearAll() {
    Object.keys(this.timerIntervals).forEach(taskId => {
      this.stopLiveUpdate(taskId);
    });
    this.timers = {};
    this.saveTimers();
    this.notifyUpdate();
    console.log('[TaskTimer] Cleared all timers');
  }
}

// Create global instance
const taskTimer = new TaskTimer();
