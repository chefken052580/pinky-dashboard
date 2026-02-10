/**
 * Dynamic Bot Loader
 * Loads bot list from /api/bots endpoint instead of hardcoded HTML
 * Renders bot buttons dynamically in sidebar
 */

class BotLoader {
  constructor() {
    this.bots = [];
    this.botContainer = null;
  }

  /**
   * Fetch bot list from API
   */
  async fetchBots() {
    try {
      const response = await fetch('/api/bots');
      if (!response.ok) {
        throw new Error(`Failed to fetch bots: ${response.status}`);
      }
      this.bots = await response.json();
      return this.bots;
    } catch (error) {
      console.error('Error fetching bots:', error);
      // Fallback to default bots if API fails
      return this.getDefaultBots();
    }
  }

  /**
   * Default bots if API is unavailable
   */
  getDefaultBots() {
    return [
      { id: 'docs', name: 'DocsBot', icon: '📝', status: 'active' },
      { id: 'research', name: 'ResearchBot', icon: '🔍', status: 'active' },
      { id: 'code', name: 'CodeBot', icon: '💻', status: 'active' },
      { id: 'social', name: 'SocialBot', icon: '📱', status: 'active' },
      { id: 'business', name: 'BusinessBot', icon: '💼', status: 'active' },
      { id: 'filesystem', name: 'FileSystemBot', icon: '📁', status: 'active' },
      { id: 'tasks', name: 'TasksBot', icon: '🎯', status: 'active' },
      { id: 'crypto', name: 'CryptoBot', icon: '💰', status: 'active' },
      { id: 'diary', name: 'DiaryBot', icon: '📔', status: 'active' }
    ];
  }

  /**
   * Render bot buttons in sidebar
   */
  renderBots(containerId = 'bot-army-section') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Bot container not found: ${containerId}`);
      return false;
    }

    this.botContainer = container;

    // Clear existing bot buttons (but keep the header)
    const botButtonsDiv = container.querySelector('.bot-buttons');
    if (botButtonsDiv) {
      botButtonsDiv.innerHTML = '';
    } else {
      // Create bot-buttons container if it doesn't exist
      const newDiv = document.createElement('div');
      newDiv.className = 'bot-buttons';
      container.appendChild(newDiv);
      this.botContainer = newDiv;
    }

    // Render each bot as a button
    this.bots.forEach((bot, index) => {
      const button = document.createElement('button');
      button.className = `bot-button ${index === 0 ? 'active' : ''}`;
      button.setAttribute('data-bot', bot.id);
      button.setAttribute('data-status', bot.status);
      button.innerHTML = `${bot.icon} ${bot.name}`;
      button.title = `${bot.name} (${bot.status})`;
      
      // Add click handler
      button.addEventListener('click', () => this.onBotClick(bot.id));
      
      // Add status indicator for inactive bots
      if (bot.status !== 'active') {
        button.classList.add('bot-inactive');
      }

      this.botContainer.appendChild(button);
    });

    // Update global bot list for compatibility
    window.botList = this.bots;
    return true;
  }

  /**
   * Handle bot button click
   */
  onBotClick(botId) {
    // Switch to the bot view using existing switchView system
    if (window.switchView) {
      window.switchView(`${botId}-view`);
    } else {
      console.error('switchView function not found');
    }

    // Update active state
    document.querySelectorAll('.bot-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-bot="${botId}"]`)?.classList.add('active');
  }

  /**
   * Initialize bot loader
   */
  async init() {
    try {
      // Fetch bots from API
      await this.fetchBots();
      
      // Render to sidebar
      const success = this.renderBots('bot-army-section');
      
      if (success) {
        console.log(`✅ Loaded ${this.bots.length} bots dynamically`);
      }
      
      return success;
    } catch (error) {
      console.error('Error initializing BotLoader:', error);
      return false;
    }
  }

  /**
   * Get current bot list
   */
  getBots() {
    return this.bots;
  }

  /**
   * Add a new bot (useful for dynamic bot registration)
   */
  addBot(bot) {
    if (!bot.id || !bot.name || !bot.icon) {
      console.error('Invalid bot object. Required: id, name, icon');
      return false;
    }
    
    // Check for duplicates
    if (this.bots.some(b => b.id === bot.id)) {
      console.warn(`Bot ${bot.id} already exists`);
      return false;
    }

    this.bots.push(bot);
    this.renderBots('bot-army-section');
    return true;
  }

  /**
   * Remove a bot
   */
  removeBot(botId) {
    const index = this.bots.findIndex(b => b.id === botId);
    if (index === -1) {
      console.warn(`Bot ${botId} not found`);
      return false;
    }

    this.bots.splice(index, 1);
    this.renderBots('bot-army-section');
    return true;
  }

  /**
   * Update a bot
   */
  updateBot(botId, updates) {
    const bot = this.bots.find(b => b.id === botId);
    if (!bot) {
      console.warn(`Bot ${botId} not found`);
      return false;
    }

    Object.assign(bot, updates);
    this.renderBots('bot-army-section');
    return true;
  }
}

// Create global instance
window.botLoader = new BotLoader();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BotLoader;
}
