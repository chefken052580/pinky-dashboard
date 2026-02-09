/**
 * FILESYSTEMBOT PRO - AI File Assistant with Task Pattern Learning
 * Helps with tasks, file management, code cleanup, automation
 * Enhanced with ML-style pattern recognition from task history
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
    this.taskPatterns = null;
    this.initialized = false;
  }

  /**
   * Load and analyze task patterns from history
   */
  async learnFromTaskHistory() {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) return;
      
      const tasks = await response.json();
      const completed = tasks.filter(t => t.status === 'completed');
      
      this.taskPatterns = {
        totalCompleted: completed.length,
        categories: this.categorizeTasksbyType(completed),
        priorityDistribution: this.analyzePriorities(completed),
        commonKeywords: this.extractKeywords(completed),
        averageTaskStructure: this.analyzeTaskStructure(completed),
        recentTrends: this.analyzeRecentTrends(completed)
      };
      
      this.initialized = true;
      console.log('[FileSystemBot] Learned from', completed.length, 'completed tasks');
      console.log('[FileSystemBot] Task patterns:', this.taskPatterns);
    } catch (e) {
      console.warn('[FileSystemBot] Could not load task history:', e);
    }
  }

  /**
   * Categorize tasks by type
   */
  categorizeTasksByType(tasks) {
    const categories = {
      bugFix: { count: 0, keywords: ['fix', 'bug', 'error', 'issue', 'broken'] },
      feature: { count: 0, keywords: ['add', 'create', 'build', 'implement', 'new'] },
      integration: { count: 0, keywords: ['integrate', 'connect', 'wire', 'api', 'connector'] },
      testing: { count: 0, keywords: ['test', 'verify', 'check', 'validate'] },
      refactor: { count: 0, keywords: ['cleanup', 'refactor', 'improve', 'update', 'enhance'] },
      documentation: { count: 0, keywords: ['docs', 'document', 'guide', 'readme'] },
      infrastructure: { count: 0, keywords: ['server', 'hosting', 'deploy', 'setup', 'config'] }
    };

    tasks.forEach(task => {
      const name = (task.name || '').toLowerCase();
      const notes = (task.notes || '').toLowerCase();
      const text = name + ' ' + notes;

      for (const [category, data] of Object.entries(categories)) {
        if (data.keywords.some(kw => text.includes(kw))) {
          data.count++;
        }
      }
    });

    return categories;
  }

  /**
   * Analyze priority distribution
   */
  analyzePriorities(tasks) {
    const dist = { P1: 0, P2: 0, P3: 0, unset: 0 };
    tasks.forEach(task => {
      const priority = task.priority || '-';
      if (priority === 'P1') dist.P1++;
      else if (priority === 'P2') dist.P2++;
      else if (priority === 'P3') dist.P3++;
      else dist.unset++;
    });
    return dist;
  }

  /**
   * Extract common keywords from completed tasks
   */
  extractKeywords(tasks) {
    const words = {};
    const stopWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'to', 'in', 'on', 'at'];

    tasks.forEach(task => {
      const text = ((task.name || '') + ' ' + (task.notes || '')).toLowerCase();
      text.split(/\W+/).forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
          words[word] = (words[word] || 0) + 1;
        }
      });
    });

    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * Analyze task structure patterns
   */
  analyzeTaskStructure(tasks) {
    const withCommits = tasks.filter(t => t.notes && t.notes.includes('—')).length;
    const withDocs = tasks.filter(t => t.notes && (t.notes.includes('.md') || t.notes.includes('docs/'))).length;
    const withTests = tasks.filter(t => t.notes && t.notes.toLowerCase().includes('test')).length;

    return {
      percentWithCommits: Math.round((withCommits / tasks.length) * 100),
      percentWithDocs: Math.round((withDocs / tasks.length) * 100),
      percentWithTests: Math.round((withTests / tasks.length) * 100)
    };
  }

  /**
   * Analyze recent trends (last 10 tasks)
   */
  analyzeRecentTrends(tasks) {
    const recent = tasks.slice(-10);
    const categories = this.categorizeTasksByType(recent);
    const topCategory = Object.entries(categories)
      .sort((a, b) => b[1].count - a[1].count)[0];
    
    return {
      recentTaskCount: recent.length,
      trendingCategory: topCategory ? topCategory[0] : 'unknown'
    };
  }

  /**
   * Generate intelligent suggestions based on learned patterns
   */
  generateSmartSuggestions(prompt, capability) {
    if (!this.taskPatterns) {
      return this.generateResponse(prompt, capability);
    }

    const patterns = this.taskPatterns;
    const promptLower = prompt.toLowerCase();
    let suggestions = [];

    // Pattern-based suggestions
    if (capability === 'task_creation') {
      // Check what kind of task this might be
      const categories = patterns.categories;
      
      if (promptLower.includes('fix') || promptLower.includes('bug')) {
        suggestions.push(`📊 Pattern: ${categories.bugFix.count} bug fixes completed. Typical approach:`);
        suggestions.push('• Reproduce the issue');
        suggestions.push('• Identify root cause');
        suggestions.push('• Implement fix with tests');
        suggestions.push('• Commit with hash reference');
        suggestions.push(`\n💡 Priority: ${patterns.priorityDistribution.P1 > 5 ? 'P1 (fixes are usually high priority)' : 'P2'}`);
      }
      else if (promptLower.includes('test')) {
        suggestions.push(`📊 Pattern: ${categories.testing.count} tests completed. Typical approach:`);
        suggestions.push('• Identify what needs testing');
        suggestions.push('• Write test cases');
        suggestions.push('• Verify all endpoints/features');
        suggestions.push('• Document results');
        suggestions.push(`\n💡 Tip: ${patterns.averageTaskStructure.percentWithTests}% of tasks include testing`);
      }
      else if (promptLower.includes('integrate') || promptLower.includes('api')) {
        suggestions.push(`📊 Pattern: ${categories.integration.count} integrations completed. Typical approach:`);
        suggestions.push('• API/service connection');
        suggestions.push('• Authentication setup');
        suggestions.push('• Error handling');
        suggestions.push('• Documentation');
      }
      else if (promptLower.includes('doc') || promptLower.includes('guide')) {
        suggestions.push(`📊 Pattern: ${patterns.averageTaskStructure.percentWithDocs}% of tasks include documentation`);
        suggestions.push('Best practices:');
        suggestions.push('• Create in docs/ or memory/ folder');
        suggestions.push('• Include examples');
        suggestions.push('• Link to related code');
      }
      else {
        // General task suggestion
        suggestions.push(`📊 Based on ${patterns.totalCompleted} completed tasks:`);
        suggestions.push(`• Trending: ${patterns.recentTrends.trendingCategory} tasks`);
        suggestions.push(`• ${patterns.averageTaskStructure.percentWithCommits}% include git commits`);
        suggestions.push(`• Common keywords: ${patterns.commonKeywords.slice(0, 5).map(k => k.word).join(', ')}`);
      }
    }
    else if (capability === 'analysis') {
      suggestions.push('📊 Task Pattern Analysis:');
      suggestions.push(`Total completed: ${patterns.totalCompleted}`);
      suggestions.push(`\nCategories:`);
      Object.entries(patterns.categories).forEach(([cat, data]) => {
        if (data.count > 0) {
          suggestions.push(`• ${cat}: ${data.count} tasks`);
        }
      });
      suggestions.push(`\nPriorities: P1(${patterns.priorityDistribution.P1}) P2(${patterns.priorityDistribution.P2}) P3(${patterns.priorityDistribution.P3})`);
      suggestions.push(`\nTop keywords: ${patterns.commonKeywords.slice(0, 8).map(k => `${k.word}(${k.count})`).join(', ')}`);
    }
    else {
      return this.generateResponse(prompt, capability);
    }

    return suggestions.join('\n');
  }

  /**
   * Process a request from the LLM
   */
  async processRequest(prompt, capability) {
    console.log('[FileSystemBot] Processing:', prompt);

    // Initialize patterns if not already done
    if (!this.initialized) {
      await this.learnFromTaskHistory();
    }

    // Generate smart response based on learned patterns
    const response = this.taskPatterns 
      ? this.generateSmartSuggestions(prompt, capability)
      : this.generateResponse(prompt, capability);
    
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      prompt: prompt,
      capability: capability,
      response: response,
      usedPatterns: !!this.taskPatterns
    });

    return response;
  }

  /**
   * Generate fallback mock LLM response
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
    html += '<h3 style="color:#00d4ff;margin-bottom:10px;">🔧 FileSystemBot Pro - AI Task Assistant</h3>';
    
    // Show pattern learning status
    if (this.taskPatterns) {
      html += '<div style="background:rgba(0,212,255,0.1);border:1px solid #00d4ff;border-radius:6px;padding:8px;margin-bottom:15px;font-size:0.9em;">';
      html += `🧠 <strong>Pattern Learning Active</strong> — Trained on ${this.taskPatterns.totalCompleted} completed tasks`;
      html += '</div>';
    }
    
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
      html += '<div class="capability-card" onclick="window.fileSystemBotLLM.showCapability(\'' + cap.id + '\')" style="background:var(--bg-card);border:1px solid #00d4ff;border-radius:8px;padding:15px;cursor:pointer;transition:all 0.3s;">';
      html += '<div style="display:flex;align-items:center;">';
      html += '<span class="cap-emoji" style="font-size:2em;margin-right:10px;">' + cap.emoji + '</span>';
      html += '<div class="cap-info">';
      html += '<h5 style="color:#00d4ff;margin:5px 0;">' + cap.name + '</h5>';
      html += '<p style="color:#aaa;font-size:0.9em;margin:0;">' + cap.desc + '</p>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div></div>';

    html += '<div class="fsbot-interface" style="margin-top:30px;">';
    html += '<h4 style="color:#00d4ff;margin-bottom:15px;">Ask FileSystemBot</h4>';
    html += '<div class="fsbot-input-group" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">';
    html += '<input type="text" id="fsbot-prompt" placeholder="What would you like me to do?" style="flex:1;min-width:250px;padding:10px;border:1px solid #00d4ff;border-radius:6px;background:var(--bg-card);color:#fff;">';
    html += '<select id="fsbot-capability" style="padding:10px;border:1px solid #00d4ff;border-radius:6px;background:var(--bg-card);color:#fff;">';
    caps.forEach(cap => {
      html += '<option value="' + cap.id + '">' + cap.emoji + ' ' + cap.name + '</option>';
    });
    html += '</select>';
    html += '<button class="action-btn" onclick="window.fileSystemBotLLM.sendRequest()" style="padding:10px 20px;background:#00d4ff;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Send</button>';
    html += '</div>';
    html += '<div id="fsbot-response" style="margin-top:15px;padding:15px;background:rgba(0,212,255,0.05);border:1px solid #00d4ff;border-radius:8px;min-height:60px;color:#fff;display:none;white-space:pre-wrap;"></div>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  showCapability(capId) {
    const prompt = document.getElementById('fsbot-prompt');
    const capability = document.getElementById('fsbot-capability');
    if (prompt) {
      prompt.focus();
      prompt.placeholder = 'Tell me what you need for ' + capId.replace('_', ' ') + '...';
    }
    if (capability) {
      capability.value = capId;
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
      responseDiv.innerHTML = '<em>🤔 Analyzing patterns...</em>';
    }

    const response = await this.processRequest(prompt, capability);
    
    if (responseDiv) {
      const escaped = escapeHtmlForFSBot(response);
      responseDiv.innerHTML = '<strong>FileSystemBot:</strong>\n' + escaped;
    }

    // Log task if it was a task creation request
    if (capability === 'task_creation' && window.taskQueueManager) {
      window.taskQueueManager.logTaskStart('FileSystemBot: ' + prompt.substring(0, 50), 'assistant');
    }

    // Clear input
    const promptInput = document.getElementById('fsbot-prompt');
    if (promptInput) promptInput.value = '';
  }
}

// Initialize globally
try {
  window.fileSystemBotLLM = new FileSystemBotLLM();
  
  // Auto-learn patterns when dashboard loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.fileSystemBotLLM.learnFromTaskHistory();
    });
  } else {
    window.fileSystemBotLLM.learnFromTaskHistory();
  }
  
  console.log('[FileSystemBot] LLM with Pattern Learning initialized');
} catch (e) {
  console.error('[FileSystemBot] Error:', e);
}
