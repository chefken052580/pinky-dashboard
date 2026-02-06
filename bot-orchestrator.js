/**
 * Bot Orchestrator - Master Automation Controller
 * Automatically coordinates and invokes all bots on heartbeat ticks
 * 
 * Orchestrates: LintBot, TestBot, GitBot, BuildBot, UIBot, AnalyticsBot
 * Manages: scheduling, error handling, reporting, bot health monitoring
 * 
 * This is the CORE of Pinky's "manager not worker" architecture
 */

class BotOrchestrator {
  constructor() {
    this.name = 'BotOrchestrator';
    this.bots = new Map();
    this.schedule = {};
    this.heartbeatCount = 0;
    this.lastRun = null;
    this.orchestrationLog = [];
    this.botResults = [];
  }

  /**
   * Register a bot in the orchestrator
   */
  registerBot(botName, botInstance, schedule = { heartbeatInterval: 1 }) {
    console.log(`[Orchestrator] Registering bot: ${botName}`);
    
    this.bots.set(botName, {
      instance: botInstance,
      schedule: schedule,
      lastRun: null,
      executionCount: 0,
      errors: 0
    });

    this.schedule[botName] = schedule;
    console.log(`[Orchestrator] Bot '${botName}' registered (interval: every ${schedule.heartbeatInterval} heartbeats)`);
  }

  /**
   * Execute heartbeat cycle - invokes all scheduled bots
   */
  async executeHeartbeat(heartbeatNumber) {
    this.heartbeatCount = heartbeatNumber;
    this.lastRun = new Date().toISOString();
    this.botResults = [];

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[Orchestrator] HEARTBEAT #${heartbeatNumber} — ${this.lastRun}`);
    console.log(`${'='.repeat(70)}\n`);

    for (const [botName, botConfig] of this.bots) {
      // Check if bot should run on this heartbeat
      if (this.shouldBotRun(botName, heartbeatNumber)) {
        console.log(`\n[Orchestrator] ▶ Executing: ${botName}`);
        
        try {
          const result = await botConfig.instance.run();
          
          botConfig.executionCount++;
          botConfig.lastRun = new Date().toISOString();

          this.botResults.push({
            bot: botName,
            timestamp: botConfig.lastRun,
            status: 'success',
            result: result
          });

          this.logOrchestration(`✅ ${botName} completed (task #${botConfig.executionCount})`);
          console.log(`[Orchestrator] ✅ ${botName} completed\n`);

        } catch (error) {
          botConfig.errors++;
          
          this.botResults.push({
            bot: botName,
            timestamp: new Date().toISOString(),
            status: 'failed',
            error: error.message
          });

          this.logOrchestration(`❌ ${botName} failed: ${error.message}`);
          console.error(`[Orchestrator] ❌ ${botName} failed: ${error.message}\n`);
        }
      }
    }

    // Generate orchestration report
    const report = this.generateOrchestrationReport();
    
    console.log(`${'='.repeat(70)}`);
    console.log(JSON.stringify(report, null, 2));
    console.log(`${'='.repeat(70)}\n`);

    return report;
  }

  /**
   * Determine if a bot should run on this heartbeat
   */
  shouldBotRun(botName, heartbeatNumber) {
    const schedule = this.schedule[botName];
    if (!schedule) return false;

    const interval = schedule.heartbeatInterval || 1;
    const lastBotRecord = this.bots.get(botName);
    
    // Run on first heartbeat and every N heartbeats thereafter
    return heartbeatNumber === 1 || (heartbeatNumber % interval === 0);
  }

  /**
   * Log orchestration event
   */
  logOrchestration(message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: message,
      heartbeat: this.heartbeatCount
    };

    this.orchestrationLog.push(logEntry);
    console.log(`[Log] ${message}`);
  }

  /**
   * Get all bot statuses
   */
  getAllBotStatus() {
    const statuses = [];

    for (const [botName, botConfig] of this.bots) {
      const status = botConfig.instance.getStatus ? 
        botConfig.instance.getStatus() : 
        { name: botName, status: 'unknown' };

      statuses.push({
        ...status,
        executionCount: botConfig.executionCount,
        errors: botConfig.errors,
        lastRun: botConfig.lastRun
      });
    }

    return statuses;
  }

  /**
   * Generate orchestration report
   */
  generateOrchestrationReport() {
    const botsRun = this.botResults.length;
    const successful = this.botResults.filter(r => r.status === 'success').length;
    const failed = this.botResults.filter(r => r.status === 'failed').length;

    const report = {
      heartbeat: this.heartbeatCount,
      timestamp: this.lastRun,
      summary: {
        botsInvoked: botsRun,
        successful: successful,
        failed: failed,
        successRate: botsRun > 0 ? Math.round((successful / botsRun) * 100) : 0
      },
      botResults: this.botResults,
      botStatuses: this.getAllBotStatus(),
      totalBots: this.bots.size,
      totalAutomatedTasks: this.getTotalAutomatedTasks()
    };

    return report;
  }

  /**
   * Calculate total automated tasks across all bots
   */
  getTotalAutomatedTasks() {
    let total = 0;
    for (const [, botConfig] of this.bots) {
      if (botConfig.instance.tasksCompleted) {
        total += botConfig.instance.tasksCompleted;
      }
    }
    return total;
  }

  /**
   * Get orchestration metrics for dashboard
   */
  getMetrics() {
    const successfulRuns = this.orchestrationLog.filter(l => l.message.includes('✅')).length;
    const failedRuns = this.orchestrationLog.filter(l => l.message.includes('❌')).length;

    return {
      orchestrationLog: this.orchestrationLog,
      totalHeartbeats: this.heartbeatCount,
      totalBotsRegistered: this.bots.size,
      successfulBotRuns: successfulRuns,
      failedBotRuns: failedRuns,
      totalAutomatedTasks: this.getTotalAutomatedTasks(),
      avgTasksPerHeartbeat: this.heartbeatCount > 0 ? 
        (this.getTotalAutomatedTasks() / this.heartbeatCount).toFixed(2) : 0
    };
  }

  /**
   * Reset bot error counters
   */
  resetBotErrors(botName = null) {
    if (botName) {
      const botConfig = this.bots.get(botName);
      if (botConfig) {
        botConfig.errors = 0;
        console.log(`[Orchestrator] Reset error counter for ${botName}`);
      }
    } else {
      // Reset all
      for (const botConfig of this.bots.values()) {
        botConfig.errors = 0;
      }
      console.log('[Orchestrator] Reset all bot error counters');
    }
  }

  /**
   * Get summary for API endpoint
   */
  getSummary() {
    return {
      name: this.name,
      version: '1.0.0',
      status: 'active',
      lastRun: this.lastRun,
      heartbeatCount: this.heartbeatCount,
      botCount: this.bots.size,
      bots: Array.from(this.bots.keys()),
      metrics: this.getMetrics()
    };
  }
}

// Global instance
const globalOrchestrator = new BotOrchestrator();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BotOrchestrator, globalOrchestrator };
}
