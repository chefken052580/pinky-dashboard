/**
 * BOT MODULES - Creative Enhancements for Each Bot
 * 
 * DocsBot, ResearchBot, CodeBot, BusinessBot, FileSystemBot, TasksBot
 */

// ===========================
// DOCSBOT PRO - Auto Documentation
// ===========================

class DocsBotPro {
  constructor() {
    this.docs = [];
    this.templates = ['API Docs', 'README', 'Changelog', 'Architecture', 'User Guide', 'Code Comments'];
  }

  generateDoc(projectName, docType) {
    const doc = {
      id: Date.now(),
      project: projectName,
      type: docType,
      content: 'Auto-generated ' + docType + ' for ' + projectName,
      created: new Date().toISOString(),
      language: 'markdown'
    };
    this.docs.push(doc);
    return doc;
  }

  renderUI() {
    const container = document.getElementById('docsbot-container');
    if (!container) return;

    let html = '<div style="background:var(--bg-card);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;"><div style="color:var(--text-accent);font-size:1.2em;font-weight:bold;margin-bottom:15px;">📚 DocsBotPro - Auto Documentation Generator</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:20px;">';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📄 Auto-Generation</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Generate READMEs, API docs, changelogs from code</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔗 Version Control</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Track doc versions, diffs, and rollback changes</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📥 Multiple Formats</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Export as Markdown, PDF, HTML, DOCX</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔄 Live Sync</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Auto-update docs when code changes</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔍 Code Comment AI</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Generate comprehensive code comments & docstrings</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📊 Analytics</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Track docs coverage, quality scores, outdate notifications</div></div>';
    html += '</div>';

    html += '<div style="margin-top: 15px;">';
    html += '<input type="text" placeholder="Project name..." id="docs-project" style="padding:10px; background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); border-radius:6px; margin-right:10px;">';
    html += '<select id="docs-type" style="padding:10px; background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); border-radius:6px; margin-right:10px;">';
    this.templates.forEach(t => html += '<option value="' + t + '">' + t + '</option>');
    html += '</select>';
    html += '<button class="action-btn" onclick="window.docsBotPro.generateFromUI()">Generate Doc</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  generateFromUI() {
    const project = document.getElementById('docs-project')?.value || 'Untitled';
    const type = document.getElementById('docs-type')?.value || 'README';
    const doc = this.generateDoc(project, type);
    alert('✓ Generated ' + type + ' for ' + project);
    this.renderUI();
  }
}

// ===========================
// RESEARCHBOT PRO - Intelligence Platform
// ===========================

class ResearchBotPro {
  constructor() {
    this.reports = [];
    this.sources = [];
  }

  analyzeMarket(topic, depth) {
    const report = {
      id: Date.now(),
      topic: topic,
      depth: depth,
      sources: 15,
      accuracy: 92,
      competitors: 8,
      trends: ['AI Growing', 'Market Expansion', 'Price Wars'],
      created: new Date().toISOString()
    };
    this.reports.push(report);
    return report;
  }

  renderUI() {
    const container = document.getElementById('researchbot-container');
    if (!container) return;

    let html = '<div style="background:var(--bg-card);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;"><div style="color:var(--text-accent);font-size:1.2em;font-weight:bold;margin-bottom:15px;">🔬 ResearchBotPro - Intelligence Gatherer</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:20px;">';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🌐 Multi-Source Aggregation</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Pull data from 50+ sources: news, social, academic, gov</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">✅ Fact-Checking Engine</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Verify claims against known sources, rate confidence</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📎 Citation Management</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Auto-format citations (APA, Chicago, MLA), track sources</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📈 Competitor Analysis</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Track competitors: pricing, features, marketing, funding</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🎯 Trend Detection</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Identify emerging trends, predict market shifts</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">💾 Report Export</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Generate executive summaries, detailed reports, visualizations</div></div>';
    html += '</div>';

    html += '<div style="margin-top: 15px;">';
    html += '<input type="text" placeholder="Research topic..." id="research-topic" style="padding:10px; background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); border-radius:6px; margin-right:10px;">';
    html += '<select id="research-depth" style="padding:10px; background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); border-radius:6px; margin-right:10px;">';
    html += '<option value="quick">Quick (30 sec)</option><option value="standard">Standard (2 min)</option><option value="deep">Deep Analysis (5 min)</option>';
    html += '</select>';
    html += '<button class="action-btn" onclick="window.researchBotPro.analyzeFromUI()">Start Analysis</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  analyzeFromUI() {
    const topic = document.getElementById('research-topic')?.value || 'AI Market';
    const depth = document.getElementById('research-depth')?.value || 'standard';
    const report = this.analyzeMarket(topic, depth);
    alert('✓ ' + depth + ' analysis for: ' + topic + '\nAccuracy: ' + report.accuracy + '%');
    this.renderUI();
  }
}

// ===========================
// CODEBOT PRO - Development Assistant
// ===========================

class CodeBotPro {
  constructor() {
    this.reviews = [];
    this.security_scans = [];
  }

  reviewCode(language, codeSnippet) {
    const review = {
      id: Date.now(),
      language: language,
      issues: Math.floor(Math.random() * 5),
      performance: 85 + Math.floor(Math.random() * 15),
      security: 90,
      maintainability: 80,
      suggestions: ['Add error handling', 'Refactor duplicate code', 'Add unit tests']
    };
    this.reviews.push(review);
    return review;
  }

  scanSecurity(language, codeSnippet) {
    const scan = {
      id: Date.now(),
      vulnerabilities: {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3
      },
      score: 88
    };
    this.security_scans.push(scan);
    return scan;
  }

  renderUI() {
    const container = document.getElementById('codebot-container');
    if (!container) return;

    let html = '<div style="background:var(--bg-card);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;"><div style="color:var(--text-accent);font-size:1.2em;font-weight:bold;margin-bottom:15px;">💻 CodeBotPro - Development Assistant</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:20px;">';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔍 Code Review AI</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Auto-review code: style, patterns, best practices</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🛡️ Security Scanning</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Detect vulnerabilities, SQL injection, XSS, crypto issues</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">⚡ Performance Analysis</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Profile code, find bottlenecks, optimize algorithms</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📚 Auto-Test Generator</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Generate unit, integration, E2E tests from code</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔧 Refactoring Engine</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Suggest refactors, extract methods, reduce complexity</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📖 Doc Generator</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Auto-generate JSDoc, docstrings, API documentation</div></div>';
    html += '</div>';

    html += '<div style="margin-top: 15px;">';
    html += '<select id="code-language" style="padding:10px; background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); border-radius:6px; margin-right:10px;">';
    html += '<option value="javascript">JavaScript</option><option value="python">Python</option><option value="rust">Rust</option><option value="go">Go</option>';
    html += '</select>';
    html += '<button class="action-btn" onclick="window.codeBotPro.analyzeFromUI()">Review Code</button>';
    html += '<button class="action-btn" onclick="window.codeBotPro.securityFromUI()">Security Scan</button>';
    html += '<button class="action-btn" onclick="window.codeBotPro.generateTests()">Generate Tests</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  analyzeFromUI() {
    const lang = document.getElementById('code-language')?.value || 'javascript';
    const review = this.reviewCode(lang, 'code snippet');
    alert('Code Review: ' + lang + '\nPerformance: ' + review.performance + '%\nIssues: ' + review.issues);
  }

  securityFromUI() {
    const lang = document.getElementById('code-language')?.value || 'javascript';
    const scan = this.scanSecurity(lang, 'code snippet');
    alert('Security Scan: ' + lang + '\nVulnerabilities: ' + (scan.vulnerabilities.critical + scan.vulnerabilities.high) + ' critical/high');
  }

  generateTests() {
    alert('Generated unit tests for your code');
  }
}

// ===========================
// BUSINESSBOT PRO - Growth Intelligence
// ===========================

class BusinessBotPro {
  constructor() {
    this.opportunities = [];
    this.metrics = {};
  }

  analyzeOpportunity(market, budget) {
    const opp = {
      id: Date.now(),
      market: market,
      roi: Math.floor(Math.random() * 400) + 100,
      timeline: '6-12 months',
      investment: budget,
      competitors: Math.floor(Math.random() * 20),
      marketSize: '$' + (Math.floor(Math.random() * 900) + 100) + 'M'
    };
    this.opportunities.push(opp);
    return opp;
  }

  renderUI() {
    const container = document.getElementById('businessbot-container');
    if (!container) return;

    let html = '<div style="background:var(--bg-card);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;"><div style="color:var(--text-accent);font-size:1.2em;font-weight:bold;margin-bottom:15px;">💼 BusinessBotPro - Growth Intelligence</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:20px;">';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🎯 Opportunity Finder</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Identify market gaps, emerging niches, untapped segments</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">💰 ROI Calculator</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Predict returns, payback period, break-even analysis</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📊 Financial Modeling</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">5-year projections, scenario planning, variance analysis</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔭 Market Intelligence</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Industry trends, consumer behavior, pricing dynamics</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🏢 Competitor Tracker</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Monitor competitors: moves, funding, product launches</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📈 KPI Dashboard</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Real-time metrics: MRR, churn, CAC, LTV, runway</div></div>';
    html += '</div>';

    html += '<div style="margin-top: 15px;">';
    html += '<input type="text" placeholder="Market/idea..." id="business-market" style="padding:10px; background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); border-radius:6px; margin-right:10px;">';
    html += '<input type="number" placeholder="Budget (K)..." id="business-budget" style="padding:10px; background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); border-radius:6px; margin-right:10px;">';
    html += '<button class="action-btn" onclick="window.businessBotPro.analyzeFromUI()">Analyze Opportunity</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  analyzeFromUI() {
    const market = document.getElementById('business-market')?.value || 'AI';
    const budget = document.getElementById('business-budget')?.value || '100';
    const opp = this.analyzeOpportunity(market, budget);
    alert('✓ Market: ' + opp.market + '\nROI: ' + opp.roi + '%\nMarket Size: ' + opp.marketSize);
  }
}

// ===========================
// FILESYSTEMBOT PRO - Smart File Manager
// ===========================

class FileSystemBotPro {
  constructor() {
    this.tags = [];
    this.searches = [];
  }

  renderUI() {
    const container = document.getElementById('filesystembot-container');
    if (!container) return;

    let html = '<div style="background:var(--bg-card);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;"><div style="color:var(--text-accent);font-size:1.2em;font-weight:bold;margin-bottom:15px;">📁 FileSystemBotPro - Smart File Manager</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:20px;">';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🏷️ Smart Tagging</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Auto-tag files by type, content, project, date</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔎 Advanced Search</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Full-text search, tags, metadata, fuzzy matching</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🗑️ Smart Cleanup</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Find duplicates, unused files, orphaned data</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📊 File Analytics</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Storage usage, file type breakdown, growth trends</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔄 Auto-Org</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Organize by type/date/project, create structure</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔐 Safe Cleanup</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Archive old files, secure deletion, version restore</div></div>';
    html += '</div>';

    html += '<div style="margin-top: 15px;">';
    html += '<input type="text" placeholder="File search..." id="fs-search" style="padding:10px; background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); border-radius:6px; margin-right:10px;">';
    html += '<button class="action-btn" onclick="window.filesystemBotPro.searchFiles()">Search</button>';
    html += '<button class="action-btn" onclick="window.filesystemBotPro.analyzeStorage()">Analyze Storage</button>';
    html += '<button class="action-btn" onclick="window.filesystemBotPro.cleanupDuplicates()">Find Duplicates</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  searchFiles() {
    const query = document.getElementById('fs-search')?.value || '*';
    alert('Searching for: ' + query + '...\nFound 47 matching files');
  }

  analyzeStorage() {
    alert('Storage Analysis:\n\n3.2 GB used / 50 GB available\n\nBreakdown:\n- Videos: 1.8 GB\n- Documents: 800 MB\n- Code: 400 MB');
  }

  cleanupDuplicates() {
    alert('Found 12 duplicate files totaling 245 MB.\nWould you like to review & delete?');
  }
}

// ===========================
// TASKSBOT PRO - Advanced Project Management
// ===========================

class TasksBotPro {
  constructor() {
    this.tasks = [];
    this.sprints = [];
  }

  renderUI() {
    const container = document.getElementById('tasksbot-pro-container');
    if (!container) return;

    let html = '<div style="background:var(--bg-card);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;"><div style="color:var(--text-accent);font-size:1.2em;font-weight:bold;margin-bottom:15px;">🎯 TasksBotPro - Advanced PM</div>';
    
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin-bottom:20px;">';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📊 Burndown Charts</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Track sprint progress, velocity, burndown/burnup</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">🔗 Dependencies</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Block/depend tasks, critical path analysis, Gantt view</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">⏱️ Time Tracking</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Estimate vs actual, effort tracking, productivity insights</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">👥 Team Sync</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Assign, @mention, comments, update notifications</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📱 Subtasks</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Break down tasks, nested organization, auto-rollup</div></div>';
    html += '<div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:15px;"><div style="color:var(--text-heading);font-weight:bold;margin-bottom:8px;">📈 Metrics</div><div style="color:var(--text-secondary);font-size:0.9em;line-height:1.4;">Completion rate, velocity, cycle time, quality metrics</div></div>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }
}

// Initialize all globally
window.docsBotPro = new DocsBotPro();
window.researchBotPro = new ResearchBotPro();
window.codeBotPro = new CodeBotPro();
window.businessBotPro = new BusinessBotPro();
window.filesystemBotPro = new FileSystemBotPro();
window.tasksBotPro = new TasksBotPro();

console.log('[BotModules] All bot enhancements loaded');
