/**
 * FILESYSTEMBOT PRO - AI File Assistant
 * Helps with tasks, file management, code cleanup, automation
 */

// PROTECTED: XSS Prevention - escape HTML for FileSystemBot output (TIER 2 FIX)
// DO NOT REMOVE OR MODIFY WITHOUT BRAIN APPROVAL
// Critical for preventing XSS from bot-generated content
function escapeHtmlForFSBot(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class FileSystemBotLLM {
  constructor() {
    this.capabilities = [
      'file_operations', // Move, copy, organize files
      'code_cleanup',    // Refactor code, fix issues
      'task_creation',   // Help create and organize tasks
      'documentation',   // Generate docs, comments
      'automation',      // Script creation, workflow automation
      'analysis'         // Analyze files, provide insights
    ];
    this.conversationHistory = [];
  }

  /**
   * Process a request from the LLM
   */
  async processRequest(prompt, capability) {
    console.log('[FileSystemBot] Processing:', prompt);

    // Simulate LLM response (in production, would call actual LLM)
    const response = this.generateResponse(prompt, capability);
    
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      prompt: prompt,
      capability: capability,
      response: response
    });

    return response;
  }

  /**
   * Generate mock LLM response
   */
  generateResponse(prompt, capability) {
    const responses = {
      file_operations: [
        'I can help organize your files. Would you like me to:\n- Sort by type\n- Archive old files\n- Find duplicates',
        'Ready to manage your files. What would you like me to:\n- Move files to folders\n- Rename in batch\n- Create directory structure'
      ],
      code_cleanup: [
        'Code cleanup assistance:\n- Detect dead code\n- Suggest refactoring\n- Fix formatting\n- Add comments',
        'I can help clean your codebase:\n- Remove unused imports\n- Simplify logic\n- Add error handling\n- Improve readability'
      ],
      task_creation: [
        'Task creation:\n- Break down projects\n- Estimate effort\n- Set priorities\n- Create dependencies',
        'I can help organize work:\n- Create task lists\n- Set deadlines\n- Track progress\n- Assign priorities'
      ],
      documentation: [
        'Documentation support:\n- Generate README\n- Write API docs\n- Create guides\n- Add code comments',
        'I can generate:\n- Technical documentation\n- User guides\n- API references\n- Architecture docs'
      ],
      automation: [
        'Automation helper:\n- Create scripts\n- Setup workflows\n- Schedule tasks\n- Monitor processes',
        'I can automate:\n- Repetitive tasks\n- File operations\n- Data processing\n- System management'
      ],
      analysis: [
        'Analysis capabilities:\n- Code metrics\n- File statistics\n- Performance analysis\n- Quality assessment',
        'I can analyze:\n- Project structure\n- Code quality\n- Storage usage\n- Task efficiency'
      ]
    };

    const capResponses = responses[capability] || responses['task_creation'];
    return capResponses[Math.floor(Math.random() * capResponses.length)];
  }

  /**
   * Render UI in FileSystemBot view
   */
  renderUI() {
    const container = document.getElementById('filesystembot-llm-container');
    if (!container) return;

    let html = '<div class="filesystembot-llm" style="color:#fff;">';
    html += '<h3 style="color:#00d4ff;margin-bottom:20px;">🔧 FileSystemBot - Your AI Assistant</h3>';
    
    html += '<div class="fsbot-capabilities" style="margin-bottom:30px;">';
    html += '<h4 style="color:#fff;margin-bottom:15px;">What can I help with?</h4>';
    html += '<div class="capability-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:15px;">';
    
    const caps = [
      { id: 'file_operations', emoji: '📁', name: 'File Management', desc: 'Organize, move, archive files' },
      { id: 'code_cleanup', emoji: '🧹', name: 'Code Cleanup', desc: 'Refactor, fix, improve code' },
      { id: 'task_creation', emoji: '📋', name: 'Task Management', desc: 'Create, organize, prioritize tasks' },
      { id: 'documentation', emoji: '📚', name: 'Documentation', desc: 'Generate docs, comments, guides' },
      { id: 'automation', emoji: '⚙️', name: 'Automation', desc: 'Scripts, workflows, monitoring' },
      { id: 'analysis', emoji: '📊', name: 'Analysis', desc: 'Metrics, quality, performance' }
    ];

    caps.forEach(cap => {
      html += '<div class="capability-card" onclick="window.fileSystemBotLLM.showCapability(\'' + cap.id + '\')" style="background:#1a1a2e;border:1px solid #00d4ff;border-radius:8px;padding:15px;margin:10px;cursor:pointer;transition:all 0.3s;">';
      html += '<span class="cap-emoji" style="font-size:2em;margin-right:10px;">' + cap.emoji + '</span>';
      html += '<div class="cap-info">';
      html += '<h5 style="color:#00d4ff;margin:5px 0;">' + cap.name + '</h5>';
      html += '<p style="color:#aaa;font-size:0.9em;margin:0;">' + cap.desc + '</p>';
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div></div>';

    html += '<div class="fsbot-interface" style="margin-top:30px;">';
    html += '<h4 style="color:#00d4ff;margin-bottom:15px;">Ask FileSystemBot</h4>';
    html += '<div class="fsbot-input-group" style="display:flex;gap:10px;align-items:center;">';
    html += '<input type="text" id="fsbot-prompt" placeholder="What would you like me to do?" style="flex:1;padding:10px;border:1px solid #00d4ff;border-radius:6px;background:#1a1a2e;color:#fff;">';
    html += '<select id="fsbot-capability" style="padding:10px;border:1px solid #00d4ff;border-radius:6px;background:#1a1a2e;color:#fff;">';
    caps.forEach(cap => {
      html += '<option value="' + cap.id + '">' + cap.emoji + ' ' + cap.name + '</option>';
    });
    html += '</select>';
    html += '<button class="action-btn" onclick="window.fileSystemBotLLM.sendRequest()">Send</button>';
    html += '</div>';
    html += '<div id="fsbot-response" style="margin-top:15px;padding:15px;background:rgba(0,212,255,0.05);border:1px solid #00d4ff;border-radius:8px;min-height:60px;color:#fff;display:none;"></div>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  showCapability(capId) {
    const prompt = document.getElementById('fsbot-prompt');
    if (prompt) {
      prompt.focus();
      prompt.placeholder = 'Tell me what you need for ' + capId + '...';
    }
  }

  async sendRequest() {
    const prompt = document.getElementById('fsbot-prompt')?.value || '';
    const capability = document.getElementById('fsbot-capability')?.value || 'task_creation';
    
    if (!prompt.trim()) {
      alert('Please enter a request');
      return;
    }

    const responseDiv = document.getElementById('fsbot-response');
    if (responseDiv) {
      responseDiv.style.display = 'block';
      responseDiv.innerHTML = '<em>Processing...</em>';
    }

    const response = await this.processRequest(prompt, capability);
    
    if (responseDiv) {
      const escaped = escapeHtmlForFSBot(response);
      responseDiv.innerHTML = '<strong>FileSystemBot:</strong><br>' + escaped.replace(/\n/g, '<br>');
    }

    // Log task if it was a task creation request
    if (capability === 'task_creation' && window.taskQueueManager) {
      window.taskQueueManager.logTaskStart('FileSystemBot: ' + prompt.substring(0, 50), 'assistant');
    }
  }
}

// Initialize globally
try {
  window.fileSystemBotLLM = new FileSystemBotLLM();
  console.log('[FileSystemBot] LLM initialized');
} catch (e) {
  console.error('[FileSystemBot] Error:', e);
}
