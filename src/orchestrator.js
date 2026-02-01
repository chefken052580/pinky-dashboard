/**
 * BOT ORCHESTRATOR
 * 
 * Manages all bot operations, task queue, and scheduling
 */

const DocsBot = require('../../bots/docs-bot');
const ResearchBot = require('../../bots/research-bot');
const CodeBot = require('../../bots/code-bot');
const SocialBot = require('../../bots/social-bot');
const BusinessBot = require('../../bots/business-bot');
const cron = require('node-cron');

class BotOrchestrator {
  constructor(database) {
    this.database = database;
    this.bots = {
      docs: new DocsBot(),
      research: new ResearchBot(),
      code: new CodeBot(),
      social: new SocialBot(),
      business: new BusinessBot()
    };
    
    this.taskQueue = [];
    this.activeTask = null;
    this.scheduledTasks = new Map();
    this.stats = {
      tasksCompleted: 0,
      tasksFailed: 0,
      costSaved: 0,
      avgDuration: 0
    };
  }

  /**
   * Execute bot command
   */
  async execute(botName, command, params = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`[Orchestrator] Executing ${botName}.${command}`);
      
      const bot = this.bots[botName];
      if (!bot) {
        throw new Error(`Bot not found: ${botName}`);
      }

      // Execute command
      let result;
      switch (botName) {
        case 'docs':
          result = await this.executeDocs(command, params);
          break;
        case 'research':
          result = await this.executeResearch(command, params);
          break;
        case 'code':
          result = await this.executeCode(command, params);
          break;
        case 'social':
          result = await this.executeSocial(command, params);
          break;
        case 'business':
          result = await this.executeBusiness(command, params);
          break;
        default:
          throw new Error(`Unknown bot: ${botName}`);
      }

      const duration = Date.now() - startTime;
      
      // Update stats
      this.stats.tasksCompleted++;
      this.stats.avgDuration = (this.stats.avgDuration * (this.stats.tasksCompleted - 1) + duration) / this.stats.tasksCompleted;
      this.stats.costSaved += this.estimateCostSaved(botName, command);

      // Log to database
      await this.database.logTask({
        bot: botName,
        command: command,
        params: params,
        result: result,
        duration: duration,
        success: true,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        result: result,
        duration: duration,
        bot: botName,
        command: command
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.stats.tasksFailed++;
      
      await this.database.logTask({
        bot: botName,
        command: command,
        params: params,
        error: error.message,
        duration: duration,
        success: false,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message,
        duration: duration,
        bot: botName,
        command: command
      };
    }
  }

  /**
   * Execute DocsBot command
   */
  async executeDocs(command, params) {
    const bot = this.bots.docs;
    
    switch (command) {
      case 'daily-log':
        return bot.generateDailyLog(
          params.date || new Date().toISOString().split('T')[0],
          params.events || [],
          params.lessons || [],
          params.nextSteps || []
        );
      
      case 'memory-update':
        return bot.generateMemoryUpdate(params.topic, params.content, params.category);
      
      case 'learning-note':
        return bot.generateLearningNote(params.skill, params.points, params.examples, params.status);
      
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Execute ResearchBot command
   */
  async executeResearch(command, params) {
    const bot = this.bots.research;
    
    switch (command) {
      case 'research':
        const results = await bot.research(params.topic, params.depth);
        return bot.generateReport(results);
      
      case 'cache-clean':
        bot.cleanCache();
        return { message: 'Cache cleaned successfully' };
      
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Execute CodeBot command
   */
  async executeCode(command, params) {
    const bot = this.bots.code;
    
    switch (command) {
      case 'generate':
        return bot.generate(params.type, params.spec);
      
      case 'debug':
        return bot.debug(params.code, params.issue);
      
      case 'optimize':
        return bot.optimize(params.code);
      
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Execute SocialBot command
   */
  async executeSocial(command, params) {
    const bot = this.bots.social;
    
    switch (command) {
      case 'generate':
        return bot.generateContent(params.platform, params.spec);
      
      case 'calendar':
        return bot.createCalendar(params.days, params.postsPerDay);
      
      case 'strategy':
        return bot.generateStrategy(params.topic, params.platforms);
      
      case 'hashtags':
        return bot.generateHashtags(params.topic, params.count);
      
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Execute BusinessBot command
   */
  async executeBusiness(command, params) {
    const bot = this.bots.business;
    
    switch (command) {
      case 'analyze':
        return bot.analyzeOpportunity(params.spec);
      
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Schedule recurring task
   */
  schedule(task) {
    const { id, schedule, bot, command, params } = task;
    
    if (this.scheduledTasks.has(id)) {
      throw new Error(`Task already scheduled: ${id}`);
    }

    const cronJob = cron.schedule(schedule, async () => {
      console.log(`[Orchestrator] Running scheduled task: ${id}`);
      await this.execute(bot, command, params);
    });

    this.scheduledTasks.set(id, {
      ...task,
      cronJob: cronJob
    });

    return { success: true, taskId: id };
  }

  /**
   * Unschedule task
   */
  unschedule(taskId) {
    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.cronJob.stop();
    this.scheduledTasks.delete(taskId);

    return { success: true };
  }

  /**
   * Get scheduled tasks
   */
  getScheduled() {
    const tasks = [];
    this.scheduledTasks.forEach((task, id) => {
      tasks.push({
        id: id,
        bot: task.bot,
        command: task.command,
        schedule: task.schedule,
        params: task.params
      });
    });
    return tasks;
  }

  /**
   * Get bot status
   */
  getBotStatus() {
    return {
      bots: {
        docs: { status: 'online', name: 'DocsBot' },
        research: { status: 'online', name: 'ResearchBot' },
        code: { status: 'online', name: 'CodeBot' },
        social: { status: 'online', name: 'SocialBot' },
        business: { status: 'online', name: 'BusinessBot' }
      },
      stats: this.stats,
      queueLength: this.taskQueue.length,
      activeTask: this.activeTask
    };
  }

  /**
   * Estimate cost saved by using bot vs API
   */
  estimateCostSaved(bot, command) {
    // Rough estimates based on Claude API pricing
    const estimates = {
      docs: 0.05,     // $0.05 per doc generation
      research: 0.10,  // $0.10 per research task
      code: 0.15,      // $0.15 per code generation
      social: 0.08,    // $0.08 per social post
      business: 0.20   // $0.20 per business analysis
    };
    
    return estimates[bot] || 0.10;
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown() {
    console.log('[Orchestrator] Shutting down...');
    
    // Stop all scheduled tasks
    this.scheduledTasks.forEach((task) => {
      task.cronJob.stop();
    });
    
    this.scheduledTasks.clear();
  }
}

module.exports = BotOrchestrator;
