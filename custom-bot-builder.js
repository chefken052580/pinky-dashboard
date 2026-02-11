/**
 * Custom Bot Builder for Enterprise Clients
 * Allows creation of enterprise-grade AI bots without coding
 */

class CustomBotBuilder {
  constructor() {
    this.currentBot = this.getDefaultConfig();
    this.testResults = [];
    this.init();
  }

  getDefaultConfig() {
    return {
      name: '',
      id: '',
      description: '',
      icon: '🤖',
      role: 'assistant',
      model: 'sonnet',
      systemPrompt: '',
      tone: 'professional',
      responseLength: 'balanced',
      specialInstructions: '',
      capabilities: [],
      integrations: [],
      knowledgeBase: '',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30,
      rateLimit: 60,
      maxConcurrent: 10,
      errorBehavior: 'retry',
      enableLogging: true,
      enableAnalytics: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  init() {
    // Auto-generate bot ID from name
    const nameInput = document.getElementById('botName');
    if (nameInput) {
      nameInput.addEventListener('change', (e) => this.generateBotId(e.target.value));
    }

    // Load saved configs
    this.loadSavedConfigs();
  }

  generateBotId(name) {
    const botId = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    document.getElementById('botId').value = botId || 'custom_bot';
  }

  switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected section
    const section = document.getElementById(`${sectionName}-section`);
    if (section) section.style.display = 'block';

    // Mark button as active
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
  }

  selectTone(tone) {
    // Update current tone
    this.currentBot.tone = tone;

    // Update UI
    document.querySelectorAll('.tone-option').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-tone="${tone}"]`)?.classList.add('selected');

    // Add system prompt suggestions based on tone
    this.updateSystemPromptSuggestion(tone);
  }

  updateSystemPromptSuggestion(tone) {
    const toneInstructions = {
      professional: 'Be professional, concise, and businesslike. Use formal language.',
      friendly: 'Be warm, approachable, and conversational. Use casual language.',
      casual: 'Be relaxed and informal. Use everyday language and occasional humor.',
      technical: 'Be precise and technical. Explain complex concepts clearly.',
      creative: 'Be imaginative and expressive. Think outside the box.'
    };

    const hint = toneInstructions[tone] || '';
    const currentPrompt = document.getElementById('systemPrompt').value;

    if (!currentPrompt) {
      document.getElementById('systemPrompt').placeholder = `${hint}. Start your system prompt here...`;
    }
  }

  updateSliderValue(sliderId) {
    const slider = document.getElementById(sliderId);
    const value = document.getElementById(`${sliderId}-value`);
    if (slider && value) {
      value.textContent = slider.value;
    }
  }

  collectBotConfig() {
    const capabilities = [];
    const integrations = [];

    // Collect checked capabilities
    document.querySelectorAll('.capability-input:checked').forEach(input => {
      const label = input.nextElementSibling?.textContent || '';
      capabilities.push(label.replace(/[📝💻🔍✍️🧮🖼️📊🌐]/g, '').trim());
    });

    // Collect checked integrations
    document.querySelectorAll('.integration-input:checked').forEach(input => {
      const label = input.parentElement?.textContent || '';
      integrations.push(label.trim());
    });

    return {
      ...this.currentBot,
      name: document.getElementById('botName')?.value || '',
      id: document.getElementById('botId')?.value || '',
      description: document.getElementById('botDescription')?.value || '',
      icon: document.getElementById('botIcon')?.value || '🤖',
      role: document.getElementById('botRole')?.value || 'assistant',
      model: document.getElementById('defaultModel')?.value || 'sonnet',
      systemPrompt: document.getElementById('systemPrompt')?.value || '',
      responseLength: document.getElementById('responseLength')?.value || 'balanced',
      specialInstructions: document.getElementById('specialInstructions')?.value || '',
      capabilities,
      integrations,
      knowledgeBase: document.getElementById('knowledgeBase')?.value || '',
      temperature: parseFloat(document.getElementById('temperature')?.value || 0.7),
      maxTokens: parseInt(document.getElementById('maxTokens')?.value || 2000),
      timeout: parseInt(document.getElementById('timeout')?.value || 30),
      rateLimit: parseInt(document.getElementById('rateLimit')?.value || 60),
      maxConcurrent: parseInt(document.getElementById('maxConcurrent')?.value || 10),
      errorBehavior: document.getElementById('errorBehavior')?.value || 'retry',
      enableLogging: document.getElementById('enableLogging')?.checked || true,
      enableAnalytics: document.getElementById('enableAnalytics')?.checked || true,
      updatedAt: new Date().toISOString()
    };
  }

  async saveBotConfig() {
    const config = this.collectBotConfig();

    // Validate required fields
    if (!config.name) {
      alert('❌ Bot name is required');
      return;
    }

    if (!config.systemPrompt) {
      alert('❌ System prompt is required');
      return;
    }

    try {
      const response = await fetch('/api/bots/custom/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        document.getElementById('savedBotId').textContent = config.id;
        document.getElementById('savedTime').textContent = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        this.showModal('save-modal');
        this.currentBot = config;
        localStorage.setItem(`bot-${config.id}`, JSON.stringify(config));
        return true;
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      alert(`❌ Error saving bot: ${error.message}`);
      return false;
    }
  }

  async testBotConfig() {
    const testMessage = document.getElementById('testMessage')?.value;
    if (!testMessage) {
      alert('Please enter a test message');
      return;
    }

    const config = this.collectBotConfig();
    const testArea = document.getElementById('testResponseArea');
    const responseEl = document.getElementById('testResponse');

    testArea.style.display = 'block';
    responseEl.innerHTML = '⏳ Testing bot... please wait...';
    document.getElementById('responseTime').textContent = '';

    try {
      const startTime = Date.now();
      const response = await fetch('/api/bots/custom/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          message: testMessage
        })
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      if (response.ok) {
        const result = await response.json();
        responseEl.innerHTML = this.escapeHtml(result.response || 'No response generated');
        document.getElementById('responseTime').textContent = `⏱️ Response time: ${duration.toFixed(2)}s`;
      } else {
        responseEl.innerHTML = '❌ Error generating response. Check bot configuration.';
      }
    } catch (error) {
      responseEl.innerHTML = `❌ Error: ${error.message}`;
    }
  }

  async deployBotConfig() {
    const config = this.collectBotConfig();

    if (!config.name || !config.id || !config.systemPrompt) {
      alert('❌ Complete all required fields before deploying');
      return;
    }

    // Save first
    const saved = await this.saveBotConfig();
    if (!saved) return;

    this.showModal('deploy-modal');
  }

  async deployToCloud() {
    const config = this.currentBot;
    try {
      const response = await fetch('/api/bots/custom/deploy/cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Bot deployed! API endpoint: ${result.endpoint}`);
        this.closeModal('deploy-modal');
        return true;
      }
    } catch (error) {
      alert(`❌ Deployment failed: ${error.message}`);
    }
    return false;
  }

  async deployToSelf() {
    const config = this.currentBot;
    try {
      const response = await fetch('/api/bots/custom/deploy/self-hosted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Bot exported for self-hosting!\n\nDownload: ${result.downloadUrl}`);
        this.closeModal('deploy-modal');
        return true;
      }
    } catch (error) {
      alert(`❌ Export failed: ${error.message}`);
    }
    return false;
  }

  async deployToSlack() {
    const config = this.currentBot;
    try {
      const response = await fetch('/api/bots/custom/deploy/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Slack bot created!\n\nAdd to Slack: ${result.slackUrl}`);
        this.closeModal('deploy-modal');
        return true;
      }
    } catch (error) {
      alert(`❌ Slack deployment failed: ${error.message}`);
    }
    return false;
  }

  updateConfigSummary() {
    const config = this.collectBotConfig();
    const summary = document.getElementById('configSummary');

    const summaryHTML = `
      <div class="summary-section">
        <h4>📋 Basic Config</h4>
        <p><strong>Name:</strong> ${this.escapeHtml(config.name) || 'Not set'}</p>
        <p><strong>Model:</strong> ${config.model}</p>
        <p><strong>Tone:</strong> ${config.tone}</p>
      </div>
      <div class="summary-section">
        <h4>⚙️ Capabilities</h4>
        <p>${config.capabilities.length > 0 ? config.capabilities.join(', ') : 'None selected'}</p>
      </div>
      <div class="summary-section">
        <h4>🔌 Integrations</h4>
        <p>${config.integrations.length > 0 ? config.integrations.join(', ') : 'None selected'}</p>
      </div>
      <div class="summary-section">
        <h4>⚡ Performance</h4>
        <p><strong>Max Tokens:</strong> ${config.maxTokens}</p>
        <p><strong>Timeout:</strong> ${config.timeout}s</p>
        <p><strong>Temperature:</strong> ${config.temperature}</p>
      </div>
    `;

    if (summary) summary.innerHTML = summaryHTML;
  }

  loadSavedConfigs() {
    // Load from localStorage for offline availability
    const savedKeys = Object.keys(localStorage).filter(k => k.startsWith('bot-'));
    if (savedKeys.length > 0) {
      const lastBot = localStorage.getItem(savedKeys[savedKeys.length - 1]);
      if (lastBot) {
        try {
          this.currentBot = JSON.parse(lastBot);
          this.populateForm();
        } catch (e) {
          console.error('Error loading saved config:', e);
        }
      }
    }
  }

  populateForm() {
    const bot = this.currentBot;
    document.getElementById('botName').value = bot.name || '';
    document.getElementById('botId').value = bot.id || '';
    document.getElementById('botDescription').value = bot.description || '';
    document.getElementById('botIcon').value = bot.icon || '🤖';
    document.getElementById('botRole').value = bot.role || 'assistant';
    document.getElementById('defaultModel').value = bot.model || 'sonnet';
    document.getElementById('systemPrompt').value = bot.systemPrompt || '';
    document.getElementById('responseLength').value = bot.responseLength || 'balanced';
    document.getElementById('specialInstructions').value = bot.specialInstructions || '';
    document.getElementById('knowledgeBase').value = bot.knowledgeBase || '';
    document.getElementById('temperature').value = bot.temperature || 0.7;
    document.getElementById('maxTokens').value = bot.maxTokens || 2000;
    document.getElementById('timeout').value = bot.timeout || 30;
    document.getElementById('rateLimit').value = bot.rateLimit || 60;
    document.getElementById('maxConcurrent').value = bot.maxConcurrent || 10;
    document.getElementById('errorBehavior').value = bot.errorBehavior || 'retry';
    document.getElementById('enableLogging').checked = bot.enableLogging !== false;
    document.getElementById('enableAnalytics').checked = bot.enableAnalytics !== false;
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global function wrappers for HTML onclick handlers
function switchBuilderSection(section) {
  window.botBuilder?.switchSection(section);
}

function selectTone(tone) {
  window.botBuilder?.selectTone(tone);
}

function updateSliderValue(sliderId) {
  window.botBuilder?.updateSliderValue(sliderId);
}

function saveBotConfig() {
  return window.botBuilder?.saveBotConfig();
}

function testBotConfig() {
  return window.botBuilder?.testBotConfig();
}

function deployBotConfig() {
  return window.botBuilder?.deployBotConfig();
}

function sendTestMessage() {
  window.botBuilder?.testBotConfig();
}

function deployToCloud() {
  return window.botBuilder?.deployToCloud();
}

function deployToSelf() {
  return window.botBuilder?.deployToSelf();
}

function deployToSlack() {
  return window.botBuilder?.deployToSlack();
}

function closeModal(modalId) {
  window.botBuilder?.closeModal(modalId);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.botBuilder = new CustomBotBuilder();
  });
} else {
  window.botBuilder = new CustomBotBuilder();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomBotBuilder;
}
