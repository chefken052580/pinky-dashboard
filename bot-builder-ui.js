/**
 * Custom Bot Builder for Enterprise Clients
 * Allows visual creation and configuration of custom bots
 * Integrates with bot registry API (/api/bots/register)
 */

(function() {
  'use strict';
  
  const API = (typeof API_BASE !== 'undefined' ? API_BASE : '') || '';
  let currentStep = 1;
  let botConfig = {
    id: '',
    name: '',
    icon: '🤖',
    role: '',
    model: 'haiku',
    system: '',
    capabilities: [],
    feeds: [],
    fedBy: [],
    shares: '',
    status: 'active',
    schedule: 'on_task',
    config: {
      autoAssign: true,
      '24x7': false,
      crossRef: true,
      createTasks: true,
      logToDiary: true
    }
  };

  const BOT_TEMPLATES = {
    dataanalyst: {
      name: 'Data Analyst Bot',
      icon: '📊',
      role: 'Data Analyst',
      system: 'You are a data analysis bot. Your job is to analyze datasets, generate insights, create visualizations, and provide statistical summaries.',
      capabilities: ['data analysis', 'visualization', 'reporting', 'statistics', 'insights'],
      model: 'sonnet'
    },
    contentwriter: {
      name: 'Content Writer Bot',
      icon: '✍️',
      role: 'Content Writer',
      system: 'You are a professional content writer. Your job is to create engaging, high-quality content for various platforms.',
      capabilities: ['writing', 'editing', 'seo', 'publishing', 'content-strategy'],
      model: 'sonnet'
    },
    customerservice: {
      name: 'Customer Service Bot',
      icon: '💬',
      role: 'Customer Service Agent',
      system: 'You are a friendly and helpful customer service representative. Your job is to resolve customer inquiries and provide excellent support.',
      capabilities: ['support', 'troubleshooting', 'communication', 'escalation', 'feedback'],
      model: 'haiku'
    },
    research: {
      name: 'Research Bot',
      icon: '🔬',
      role: 'Research Analyst',
      system: 'You are a research analyst. Your job is to conduct research, synthesize findings, and generate detailed reports.',
      capabilities: ['research', 'analysis', 'synthesis', 'documentation', 'citations'],
      model: 'opus'
    },
    automation: {
      name: 'Automation Bot',
      icon: '⚙️',
      role: 'Automation Engineer',
      system: 'You are an automation bot. Your job is to automate repetitive tasks and workflows.',
      capabilities: ['automation', 'workflow', 'scheduling', 'monitoring', 'alerts'],
      model: 'haiku'
    },
    compliance: {
      name: 'Compliance Bot',
      icon: '⚖️',
      role: 'Compliance Officer',
      system: 'You are a compliance bot. Your job is to ensure adherence to regulations and company policies.',
      capabilities: ['compliance', 'audit', 'monitoring', 'enforcement', 'reporting'],
      model: 'opus'
    }
  };

  // Initialize
  window.initBotBuilder = async function() {
    const container = document.getElementById('bot-builder-container');
    if (!container) return;
    
    container.innerHTML = renderBuilderUI();
    setupEventListeners();
    renderStep(1);
  };

  function renderBuilderUI() {
    return `
      <div class="bot-builder-wrapper">
        <div class="bot-builder-header">
          <div class="builder-title">
            <h2>🤖 Custom Bot Builder</h2>
            <p>Create and configure enterprise-grade custom bots for your organization</p>
          </div>
          <button class="builder-close-btn" onclick="window.dashboard.showView('dashboard')">✕</button>
        </div>

        <div class="bot-builder-container">
          <!-- Sidebar with progress -->
          <div class="builder-sidebar">
            <div class="builder-progress">
              <div class="progress-steps">
                <div class="progress-step active" data-step="1">
                  <div class="step-number">1</div>
                  <div class="step-label">Choose Template</div>
                </div>
                <div class="progress-step" data-step="2">
                  <div class="step-number">2</div>
                  <div class="step-label">Basic Info</div>
                </div>
                <div class="progress-step" data-step="3">
                  <div class="step-number">3</div>
                  <div class="step-label">Capabilities</div>
                </div>
                <div class="progress-step" data-step="4">
                  <div class="step-number">4</div>
                  <div class="step-label">Advanced Config</div>
                </div>
                <div class="progress-step" data-step="5">
                  <div class="step-number">5</div>
                  <div class="step-label">Review & Deploy</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main content area -->
          <div class="builder-content">
            <div id="builder-steps-container"></div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="builder-actions">
          <button id="btn-prev" class="builder-btn builder-btn-secondary" onclick="window.botBuilder.previousStep()" style="display:none;">← Previous</button>
          <button id="btn-next" class="builder-btn builder-btn-primary" onclick="window.botBuilder.nextStep()">Next →</button>
          <button id="btn-save" class="builder-btn builder-btn-success" onclick="window.botBuilder.saveBotConfig()" style="display:none;">💾 Save Configuration</button>
          <button id="btn-deploy" class="builder-btn builder-btn-accent" onclick="window.botBuilder.deployBot()" style="display:none;">🚀 Deploy Bot</button>
        </div>
      </div>
    `;
  }

  function setupEventListeners() {
    // Will be set up per step
  }

  function renderStep(step) {
    currentStep = step;
    const stepsContainer = document.getElementById('builder-steps-container');
    
    // Update progress
    document.querySelectorAll('.progress-step').forEach(s => {
      s.classList.remove('active', 'completed');
      const stepNum = parseInt(s.getAttribute('data-step'));
      if (stepNum === step) s.classList.add('active');
      else if (stepNum < step) s.classList.add('completed');
    });

    // Update buttons
    updateButtons(step);

    // Render current step
    switch(step) {
      case 1:
        stepsContainer.innerHTML = renderTemplateSelection();
        setupTemplateListeners();
        break;
      case 2:
        stepsContainer.innerHTML = renderBasicInfo();
        setupBasicInfoListeners();
        break;
      case 3:
        stepsContainer.innerHTML = renderCapabilities();
        setupCapabilitiesListeners();
        break;
      case 4:
        stepsContainer.innerHTML = renderAdvancedConfig();
        setupAdvancedListeners();
        break;
      case 5:
        stepsContainer.innerHTML = renderReviewAndDeploy();
        setupReviewListeners();
        break;
    }

    // Scroll to top
    stepsContainer.scrollTop = 0;
  }

  function updateButtons(step) {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSave = document.getElementById('btn-save');
    const btnDeploy = document.getElementById('btn-deploy');

    btnPrev.style.display = step > 1 ? 'block' : 'none';
    btnNext.style.display = step < 5 ? 'block' : 'none';
    btnSave.style.display = step === 5 ? 'block' : 'none';
    btnDeploy.style.display = step === 5 && botConfig.id ? 'block' : 'none';
  }

  // Step 1: Template Selection
  function renderTemplateSelection() {
    let html = `
      <div class="builder-step">
        <h3>Choose a Template</h3>
        <p class="step-description">Select a template to get started or start from scratch</p>
        
        <div class="template-grid">
          <div class="template-card blank" onclick="window.botBuilder.selectTemplate('blank')">
            <div class="template-icon">📝</div>
            <div class="template-name">Blank Bot</div>
            <div class="template-desc">Start from scratch with full customization</div>
          </div>
    `;

    for (const [key, template] of Object.entries(BOT_TEMPLATES)) {
      html += `
        <div class="template-card" onclick="window.botBuilder.selectTemplate('${key}')">
          <div class="template-icon">${template.icon}</div>
          <div class="template-name">${template.name}</div>
          <div class="template-desc">${template.role}</div>
        </div>
      `;
    }

    html += `
        </div>
        
        <div class="template-info">
          <p><strong>💡 Tip:</strong> Templates provide a starting point. You can customize everything in the following steps.</p>
        </div>
      </div>
    `;

    return html;
  }

  function setupTemplateListeners() {
    // Already set up with onclick
  }

  window.botBuilder = window.botBuilder || {};
  window.botBuilder.selectTemplate = function(templateKey) {
    if (templateKey !== 'blank') {
      const template = BOT_TEMPLATES[templateKey];
      botConfig.name = template.name;
      botConfig.icon = template.icon;
      botConfig.role = template.role;
      botConfig.system = template.system;
      botConfig.capabilities = [...template.capabilities];
      botConfig.model = template.model;
    }
    this.nextStep();
  };

  // Step 2: Basic Info
  function renderBasicInfo() {
    return `
      <div class="builder-step">
        <h3>Bot Basic Information</h3>
        <p class="step-description">Configure your bot's identity and basic properties</p>
        
        <div class="form-section">
          <label class="form-label">
            Bot Name <span class="required">*</span>
            <input type="text" id="input-name" class="form-input" placeholder="e.g., Sales Assistant Bot" value="${botConfig.name}">
            <span class="form-hint">A human-readable name for your bot</span>
          </label>

          <label class="form-label">
            Bot ID <span class="required">*</span>
            <input type="text" id="input-id" class="form-input" placeholder="e.g., sales-assistant" value="${botConfig.id}">
            <span class="form-hint">Unique identifier (lowercase, no spaces). Auto-generated if left empty.</span>
          </label>

          <label class="form-label">
            Icon (Emoji)
            <div class="icon-picker">
              <button class="icon-button" onclick="window.botBuilder.changeIcon('🤖')" title="Robot">🤖</button>
              <button class="icon-button" onclick="window.botBuilder.changeIcon('📊')" title="Data">📊</button>
              <button class="icon-button" onclick="window.botBuilder.changeIcon('✍️')" title="Write">✍️</button>
              <button class="icon-button" onclick="window.botBuilder.changeIcon('💬')" title="Chat">💬</button>
              <button class="icon-button" onclick="window.botBuilder.changeIcon('🔬')" title="Research">🔬</button>
              <button class="icon-button" onclick="window.botBuilder.changeIcon('⚙️')" title="Automation">⚙️</button>
              <button class="icon-button" onclick="window.botBuilder.changeIcon('💼')" title="Business">💼</button>
              <button class="icon-button" onclick="window.botBuilder.changeIcon('🎯')" title="Target">🎯</button>
              <input type="text" id="input-icon" class="form-input" placeholder="or paste emoji" value="${botConfig.icon}" style="margin-top:8px;width:100px;">
            </div>
          </label>

          <label class="form-label">
            Role / Purpose
            <input type="text" id="input-role" class="form-input" placeholder="e.g., Sales Assistant, Data Analyst" value="${botConfig.role}">
            <span class="form-hint">What is this bot's primary role or function?</span>
          </label>

          <label class="form-label">
            System Prompt (Instructions)
            <textarea id="input-system" class="form-textarea" placeholder="Describe what this bot does and how it behaves..." rows="6">${botConfig.system}</textarea>
            <span class="form-hint">Detailed instructions for how the bot should behave and respond</span>
          </label>

          <label class="form-label">
            AI Model
            <select id="input-model" class="form-input">
              <!-- Claude Models (Anthropic) -->
              <optgroup label="🔵 Claude (Anthropic)">
                <option value="claude-opus-4-6" ${botConfig.model === 'claude-opus-4-6' ? 'selected' : ''}>Claude Opus 4.6 - Most powerful (Complex reasoning)</option>
                <option value="claude-sonnet-4-5" ${botConfig.model === 'claude-sonnet-4-5' ? 'selected' : ''}>Claude Sonnet 4.5 - Balanced (Recommended)</option>
                <option value="claude-haiku-4-5" ${botConfig.model === 'claude-haiku-4-5' ? 'selected' : ''}>Claude Haiku 4.5 - Fast & cheap (Simple tasks)</option>
                <option value="opus" ${botConfig.model === 'opus' ? 'selected' : ''}>Opus (Legacy)</option>
                <option value="sonnet" ${botConfig.model === 'sonnet' ? 'selected' : ''}>Sonnet (Legacy)</option>
                <option value="haiku" ${botConfig.model === 'haiku' ? 'selected' : ''}>Haiku (Legacy)</option>
              </optgroup>
              
              <!-- OpenAI Models -->
              <optgroup label="⚪ OpenAI (ChatGPT)">
                <option value="gpt-4-turbo" ${botConfig.model === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo - Advanced reasoning</option>
                <option value="gpt-4" ${botConfig.model === 'gpt-4' ? 'selected' : ''}>GPT-4 - Most capable</option>
                <option value="gpt-4o" ${botConfig.model === 'gpt-4o' ? 'selected' : ''}>GPT-4o - Optimized for speed</option>
                <option value="gpt-4o-mini" ${botConfig.model === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o Mini - Lightweight</option>
                <option value="gpt-3.5-turbo" ${botConfig.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo - Fast & cheap</option>
              </optgroup>
              
              <!-- Grok Models -->
              <optgroup label="💫 Grok (xAI)">
                <option value="grok-2" ${botConfig.model === 'grok-2' ? 'selected' : ''}>Grok-2 - Latest & most capable</option>
                <option value="grok-2-vision" ${botConfig.model === 'grok-2-vision' ? 'selected' : ''}>Grok-2 Vision - With image understanding</option>
                <option value="grok-1" ${botConfig.model === 'grok-1' ? 'selected' : ''}>Grok-1 - Previous version</option>
              </optgroup>
              
              <!-- Other Popular Models -->
              <optgroup label="🎯 Other Popular Models">
                <option value="llama-2-70b" ${botConfig.model === 'llama-2-70b' ? 'selected' : ''}>Llama 2 70B - Meta's powerful open model</option>
                <option value="llama-3-70b" ${botConfig.model === 'llama-3-70b' ? 'selected' : ''}>Llama 3 70B - Newer Meta model</option>
                <option value="mixtral-8x7b" ${botConfig.model === 'mixtral-8x7b' ? 'selected' : ''}>Mixtral 8x7B - Efficient mixture</option>
                <option value="mistral-large" ${botConfig.model === 'mistral-large' ? 'selected' : ''}>Mistral Large - Fast reasoning</option>
                <option value="palm-2" ${botConfig.model === 'palm-2' ? 'selected' : ''}>PaLM 2 - Google's model</option>
                <option value="gemini-pro" ${botConfig.model === 'gemini-pro' ? 'selected' : ''}>Gemini Pro - Google's advanced model</option>
              </optgroup>
            </select>
            <span class="form-hint">Choose based on task complexity, cost, and desired capabilities</span>
          </label>
        </div>
      </div>
    `;
  }

  function setupBasicInfoListeners() {
    document.getElementById('input-name').addEventListener('change', (e) => {
      botConfig.name = e.target.value;
      if (!botConfig.id) {
        botConfig.id = e.target.value.toLowerCase().replace(/\s+/g, '-');
        document.getElementById('input-id').value = botConfig.id;
      }
    });
    document.getElementById('input-id').addEventListener('change', (e) => botConfig.id = e.target.value);
    document.getElementById('input-role').addEventListener('change', (e) => botConfig.role = e.target.value);
    document.getElementById('input-system').addEventListener('change', (e) => botConfig.system = e.target.value);
    document.getElementById('input-model').addEventListener('change', (e) => botConfig.model = e.target.value);
    document.getElementById('input-icon').addEventListener('change', (e) => {
      botConfig.icon = e.target.value || '🤖';
      updateIconPreview();
    });
  }

  window.botBuilder.changeIcon = function(icon) {
    botConfig.icon = icon;
    document.getElementById('input-icon').value = icon;
    updateIconPreview();
  };

  function updateIconPreview() {
    // Update icon in sidebar or wherever displayed
    const headers = document.querySelectorAll('.builder-title h2');
    if (headers[0]) {
      headers[0].textContent = `${botConfig.icon} ${botConfig.name || 'Custom Bot'}`;
    }
  }

  // Step 3: Capabilities
  function renderCapabilities() {
    const commonCapabilities = [
      'data analysis', 'reporting', 'visualization', 'automation',
      'customer support', 'content creation', 'research',
      'scheduling', 'notifications', 'integration', 'monitoring',
      'troubleshooting', 'documentation', 'forecasting'
    ];

    let html = `
      <div class="builder-step">
        <h3>Bot Capabilities</h3>
        <p class="step-description">Define what this bot can do. Select from suggestions or add your own.</p>
        
        <div class="capabilities-section">
          <label class="form-label">Current Capabilities</label>
          <div id="current-capabilities" class="capabilities-list">
    `;

    botConfig.capabilities.forEach((cap, idx) => {
      html += `<div class="capability-tag">${cap} <button onclick="window.botBuilder.removeCapability(${idx})" class="cap-remove">✕</button></div>`;
    });

    html += `
          </div>

          <label class="form-label">Add Capability</label>
          <div class="capability-input-group">
            <input type="text" id="new-capability" class="form-input" placeholder="Type a capability and press Enter">
            <button class="form-btn" onclick="window.botBuilder.addCapability()">Add</button>
          </div>

          <label class="form-label">Quick Add from Suggestions</label>
          <div class="capability-suggestions">
    `;

    commonCapabilities.forEach(cap => {
      const isSelected = botConfig.capabilities.includes(cap);
      html += `
        <button 
          class="suggestion-badge ${isSelected ? 'selected' : ''}" 
          onclick="window.botBuilder.toggleCapability('${cap}')"
        >${cap}</button>
      `;
    });

    html += `
          </div>

          <label class="form-label">Bot Integrations</label>
          <div class="integration-info">
            <p><strong>What feeds into this bot (Fed By):</strong></p>
            <div class="integration-select" id="fed-by-select"></div>
            
            <p style="margin-top:16px;"><strong>What this bot feeds into:</strong></p>
            <div class="integration-select" id="feeds-to-select"></div>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  function setupCapabilitiesListeners() {
    const input = document.getElementById('new-capability');
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.botBuilder.addCapability();
      }
    });

    // Setup integrations
    const avaliableBots = ['DiaryBot', 'ResearchBot', 'CodeBot', 'BusinessBot', 'SocialBot', 'FileSystemBot', 'TasksBot'];
    const fedBySelect = document.getElementById('fed-by-select');
    const fedsToSelect = document.getElementById('feeds-to-select');

    avaliableBots.forEach(bot => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" value="${bot}" ${botConfig.fedBy.includes(bot) ? 'checked' : ''} 
               onchange="window.botBuilder.updateFedBy(this)">
        <span>${bot}</span>
      `;
      fedBySelect.appendChild(label);
    });

    avaliableBots.forEach(bot => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" value="${bot}" ${botConfig.feeds.includes(bot) ? 'checked' : ''} 
               onchange="window.botBuilder.updateFeeds(this)">
        <span>${bot}</span>
      `;
      fedsToSelect.appendChild(label);
    });
  }

  window.botBuilder.addCapability = function() {
    const input = document.getElementById('new-capability');
    const cap = input.value.trim().toLowerCase();
    if (cap && !botConfig.capabilities.includes(cap)) {
      botConfig.capabilities.push(cap);
      input.value = '';
      renderStep(3);
    }
  };

  window.botBuilder.removeCapability = function(idx) {
    botConfig.capabilities.splice(idx, 1);
    renderStep(3);
  };

  window.botBuilder.toggleCapability = function(cap) {
    const idx = botConfig.capabilities.indexOf(cap);
    if (idx >= 0) {
      botConfig.capabilities.splice(idx, 1);
    } else {
      botConfig.capabilities.push(cap);
    }
    renderStep(3);
  };

  window.botBuilder.updateFedBy = function(checkbox) {
    const bot = checkbox.value;
    if (checkbox.checked) {
      if (!botConfig.fedBy.includes(bot)) botConfig.fedBy.push(bot);
    } else {
      botConfig.fedBy = botConfig.fedBy.filter(b => b !== bot);
    }
  };

  window.botBuilder.updateFeeds = function(checkbox) {
    const bot = checkbox.value;
    if (checkbox.checked) {
      if (!botConfig.feeds.includes(bot)) botConfig.feeds.push(bot);
    } else {
      botConfig.feeds = botConfig.feeds.filter(b => b !== bot);
    }
  };

  // Step 4: Advanced Configuration
  function renderAdvancedConfig() {
    return `
      <div class="builder-step">
        <h3>Advanced Configuration</h3>
        <p class="step-description">Fine-tune behavior, scheduling, and data sharing</p>

        <div class="form-section">
          <label class="form-label">
            Execution Schedule
            <select id="input-schedule" class="form-input">
              <option value="on_task" ${botConfig.schedule === 'on_task' ? 'selected' : ''}>On Task (triggered by task assignment)</option>
              <option value="heartbeat" ${botConfig.schedule === 'heartbeat' ? 'selected' : ''}>Every Heartbeat (continuous monitoring)</option>
              <option value="hourly" ${botConfig.schedule === 'hourly' ? 'selected' : ''}>Hourly</option>
              <option value="daily" ${botConfig.schedule === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="realtime" ${botConfig.schedule === 'realtime' ? 'selected' : ''}>Real-time (instant response)</option>
              <option value="passive" ${botConfig.schedule === 'passive' ? 'selected' : ''}>Passive (wait for events)</option>
            </select>
            <span class="form-hint">When should this bot run?</span>
          </label>

          <label class="form-label">
            Bot Status
            <select id="input-status" class="form-input">
              <option value="active" ${botConfig.status === 'active' ? 'selected' : ''}>Active (Running)</option>
              <option value="idle" ${botConfig.status === 'idle' ? 'selected' : ''}>Idle (Paused)</option>
              <option value="disabled" ${botConfig.status === 'disabled' ? 'selected' : ''}>Disabled (Offline)</option>
            </select>
            <span class="form-hint">Is this bot currently active?</span>
          </label>

          <label class="form-label">
            Data Shared With Other Bots
            <textarea id="input-shares" class="form-textarea" placeholder="e.g., Analysis results, generated reports, insights" rows="3">${botConfig.shares}</textarea>
            <span class="form-hint">What data or outputs does this bot share with other bots?</span>
          </label>

          <div class="config-toggles">
            <label class="checkbox-label">
              <input type="checkbox" id="auto-assign" ${botConfig.config.autoAssign ? 'checked' : ''}>
              <span>Auto-assign tasks to this bot</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="24x7" ${botConfig.config['24x7'] ? 'checked' : ''}>
              <span>Run 24/7 (continuous operation)</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="cross-ref" ${botConfig.config.crossRef ? 'checked' : ''}>
              <span>Enable cross-bot references</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="create-tasks" ${botConfig.config.createTasks ? 'checked' : ''}>
              <span>Create tasks when needed</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="log-diary" ${botConfig.config.logToDiary ? 'checked' : ''}>
              <span>Log activity to diary bot</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  function setupAdvancedListeners() {
    document.getElementById('input-schedule').addEventListener('change', (e) => botConfig.schedule = e.target.value);
    document.getElementById('input-status').addEventListener('change', (e) => botConfig.status = e.target.value);
    document.getElementById('input-shares').addEventListener('change', (e) => botConfig.shares = e.target.value);
    
    document.getElementById('auto-assign').addEventListener('change', (e) => botConfig.config.autoAssign = e.target.checked);
    document.getElementById('24x7').addEventListener('change', (e) => botConfig.config['24x7'] = e.target.checked);
    document.getElementById('cross-ref').addEventListener('change', (e) => botConfig.config.crossRef = e.target.checked);
    document.getElementById('create-tasks').addEventListener('change', (e) => botConfig.config.createTasks = e.target.checked);
    document.getElementById('log-diary').addEventListener('change', (e) => botConfig.config.logToDiary = e.target.checked);
  }

  // Step 5: Review and Deploy
  function renderReviewAndDeploy() {
    const botJson = JSON.stringify(botConfig, null, 2);

    return `
      <div class="builder-step">
        <h3>Review & Deploy</h3>
        <p class="step-description">Review your bot configuration before deploying</p>

        <div class="review-section">
          <div class="review-card">
            <h4>${botConfig.icon} ${botConfig.name}</h4>
            <div class="review-grid">
              <div class="review-item">
                <span class="review-label">ID:</span>
                <span class="review-value">${botConfig.id}</span>
              </div>
              <div class="review-item">
                <span class="review-label">Role:</span>
                <span class="review-value">${botConfig.role}</span>
              </div>
              <div class="review-item">
                <span class="review-label">Model:</span>
                <span class="review-value">${botConfig.model.toUpperCase()}</span>
              </div>
              <div class="review-item">
                <span class="review-label">Schedule:</span>
                <span class="review-value">${botConfig.schedule}</span>
              </div>
              <div class="review-item">
                <span class="review-label">Status:</span>
                <span class="review-value">${botConfig.status}</span>
              </div>
              <div class="review-item">
                <span class="review-label">Capabilities:</span>
                <span class="review-value">${botConfig.capabilities.length} items</span>
              </div>
            </div>

            <div class="review-section-item">
              <strong>System Prompt:</strong>
              <div class="review-code">${botConfig.system}</div>
            </div>

            <div class="review-section-item">
              <strong>Capabilities:</strong>
              <div class="tags-list">
                ${botConfig.capabilities.map(c => `<span class="tag">${c}</span>`).join('')}
              </div>
            </div>

            <div class="review-section-item">
              <strong>Integrations:</strong>
              <p><span class="label">Receives from:</span> ${botConfig.fedBy.length > 0 ? botConfig.fedBy.join(', ') : 'None'}</p>
              <p><span class="label">Sends to:</span> ${botConfig.feeds.length > 0 ? botConfig.feeds.join(', ') : 'None'}</p>
            </div>
          </div>

          <div class="config-export">
            <h4>📋 Configuration (JSON)</h4>
            <textarea id="config-json" class="review-code" readonly rows="10">${botJson}</textarea>
            <button class="form-btn" onclick="window.botBuilder.copyConfig()">📋 Copy Config</button>
            <button class="form-btn" onclick="window.botBuilder.downloadConfig()">⬇️ Download Config</button>
          </div>

          <div class="deployment-info">
            <h4>🚀 Deployment</h4>
            <p>Once you deploy this bot, it will be:</p>
            <ul>
              <li>✓ Registered in the global bot registry</li>
              <li>✓ Available for task assignment</li>
              <li>✓ Connected to other bots via feeds</li>
              <li>✓ Accessible via the API</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  function setupReviewListeners() {
    // No real listeners needed, just display
  }

  window.botBuilder.copyConfig = function() {
    const textarea = document.getElementById('config-json');
    textarea.select();
    document.execCommand('copy');
    alert('Configuration copied to clipboard!');
  };

  window.botBuilder.downloadConfig = function() {
    const botJson = JSON.stringify(botConfig, null, 2);
    const blob = new Blob([botJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${botConfig.id}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  window.botBuilder.deployBot = async function() {
    if (!botConfig.name || !botConfig.id || !botConfig.role) {
      alert('Please fill in all required fields (Name, ID, Role)');
      return;
    }

    const deployBtn = document.getElementById('btn-deploy');
    deployBtn.disabled = true;
    deployBtn.textContent = '🔄 Deploying...';

    try {
      const response = await fetch(API + '/api/bots/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botConfig)
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Bot "${botConfig.name}" deployed successfully!\n\nBot ID: ${botConfig.id}\nTotal bots: ${result.total}`);
        // Reset form
        botConfig = {
          id: '', name: '', icon: '🤖', role: '', model: 'haiku',
          system: '', capabilities: [], feeds: [], fedBy: [], shares: '',
          status: 'active', schedule: 'on_task',
          config: { autoAssign: true, '24x7': false, crossRef: true, createTasks: true, logToDiary: true }
        };
        currentStep = 1;
        renderStep(1);
      } else {
        alert(`Error: ${result.error || 'Unknown error'}`);
        deployBtn.disabled = false;
        deployBtn.textContent = '🚀 Deploy Bot';
      }
    } catch (error) {
      alert(`Deployment failed: ${error.message}`);
      deployBtn.disabled = false;
      deployBtn.textContent = '🚀 Deploy Bot';
    }
  };

  window.botBuilder.saveBotConfig = function() {
    window.botBuilder.downloadConfig();
  };

  window.botBuilder.nextStep = function() {
    if (currentStep < 5) {
      renderStep(currentStep + 1);
    }
  };

  window.botBuilder.previousStep = function() {
    if (currentStep > 1) {
      renderStep(currentStep - 1);
    }
  };

})();
