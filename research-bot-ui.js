/**
 * ResearchBot UI - Research report generation and insights dashboard
 * 
 * Features:
 * - Auto-generate strategic research reports
 * - Display market analysis, competitor tracking, opportunities
 * - Track report history
 * - Filter by topic and date
 */

class ResearchBotUI {
  constructor() {
    this.currentReport = null;
    this.reports = [];
    this.autoRefreshInterval = null;
    this.businessClients = [];
    this.companyReports = {};
    this.init();
  }

  init() {
    console.log('[ResearchBot UI] Initializing...');
    this.loadReports();
    this.loadBusinessClients();
    this.setupEventListeners();
    this.setupAutoRefresh();
  }

  /**
   * Load clients from BusinessBot API
   */
  async loadBusinessClients() {
    try {
      const response = await fetch('/api/business/clients');
      const data = await response.json();
      
      if (data.success && data.clients) {
        this.businessClients = data.clients;
        console.log('[ResearchBot] Loaded', this.businessClients.length, 'clients from BusinessBot');
        this.renderCompanyResearchSection();
      }
    } catch (error) {
      console.error('[ResearchBot] Error loading business clients:', error);
    }
  }

  /**
   * Render company research section showing BusinessBot clients
   */
  renderCompanyResearchSection() {
    const container = document.getElementById('research-content');
    if (!container || this.businessClients.length === 0) return;

    let companyHtml = `
      <div class="research-companies-section" style="margin-bottom:30px;background:var(--bg-card);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:20px;">
        <h3 style="color:var(--text-primary);margin-bottom:15px;">🏢 Research Your Clients</h3>
        <p style="color:var(--text-secondary);margin-bottom:20px;">Select a client from your BusinessBot portfolio to generate detailed company research and market insights.</p>
        
        <div class="company-research-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:15px;">
    `;

    this.businessClients.forEach(client => {
      const reportKey = `report_${client.id}`;
      const hasReport = this.companyReports[reportKey];
      
      companyHtml += `
        <div class="company-card" style="background:var(--surface-2);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:15px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='var(--surface-3)'" onmouseout="this.style.background='var(--surface-2)'">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
            <div>
              <h4 style="color:var(--text-primary);margin:0;font-size:1em;">${client.name}</h4>
              <p style="color:var(--text-secondary);margin:5px 0 0 0;font-size:0.85em;">${client.company || 'N/A'}</p>
            </div>
            <span style="background:var(--success);color:#000;padding:4px 8px;border-radius:4px;font-size:0.75em;font-weight:600;">${client.status.toUpperCase()}</span>
          </div>
          
          <div style="font-size:0.9em;color:var(--text-secondary);margin-bottom:10px;">
            📧 ${client.email}
          </div>
          
          <button onclick="researchBot.researchCompany('${client.id}', '${client.name}', '${client.company}')" style="width:100%;background:var(--gradient-primary);color:#fff;border:none;padding:8px;border-radius:4px;cursor:pointer;font-weight:600;margin-top:10px;">
            ${hasReport ? '✓ Refresh Report' : '🔬 Research Company'}
          </button>
          
          ${hasReport ? `<div style="margin-top:8px;font-size:0.75em;color:var(--text-secondary);">Report generated</div>` : ''}
        </div>
      `;
    });

    companyHtml += `
        </div>
      </div>
    `;

    // Insert before existing reports section
    const reportsSection = container.querySelector('.research-report, .research-loading, .error, .research-empty-state');
    if (reportsSection) {
      reportsSection.insertAdjacentHTML('beforebegin', companyHtml);
    } else if (container.innerHTML.length === 0) {
      container.innerHTML = companyHtml + container.innerHTML;
    }
  }

  /**
   * Load research reports from API
   */
  async loadReports() {
    try {
      const response = await fetch('/api/research/v2/reports?limit=10');
      const data = await response.json();
      
      if (data.success) {
        this.reports = data.reports || [];
        this.renderReportsList();
      }
    } catch (error) {
      console.error('[ResearchBot] Error loading reports:', error);
    }
  }

  /**
   * Generate report for a topic
   */
  async generateReport(topic) {
    try {
      const container = document.getElementById('research-content');
      if (!container) return;

      // Show loading state
      container.innerHTML = `
        <div class="research-loading">
          <div class="spinner"></div>
          <p>🔬 ResearchBot analyzing market for: <strong>${topic}</strong></p>
          <p class="subtitle">Generating market analysis, competitor tracking, and strategic insights...</p>
        </div>
      `;

      const response = await fetch('/api/research/v2/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });

      const data = await response.json();

      if (data.success && data.report) {
        this.currentReport = data.report;
        this.renderReport(data.report);
        this.reports.unshift({
          id: data.report.id,
          topic: data.report.topic,
          date: data.report.generatedAt,
          status: data.report.status
        });
        this.renderReportsList();
      } else {
        container.innerHTML = `<div class="error">Error generating report: ${data.error || 'Unknown error'}</div>`;
      }
    } catch (error) {
      console.error('[ResearchBot] Error:', error);
      const container = document.getElementById('research-content');
      if (container) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      }
    }
  }

  /**
   * Research a specific company from BusinessBot clients
   */
  async researchCompany(clientId, clientName, companyName) {
    try {
      const container = document.getElementById('research-content');
      if (!container) return;

      const searchTerm = companyName || clientName;

      // Show loading state
      container.innerHTML = `
        <div class="research-loading">
          <div class="spinner"></div>
          <p>🔬 ResearchBot analyzing: <strong>${searchTerm}</strong></p>
          <p class="subtitle">Gathering company data, financials, competitors, market position, and strategic insights...</p>
        </div>
      `;

      // Generate comprehensive company research
      const response = await fetch('/api/research/v2/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: `${searchTerm} - Company Profile, Market Position, Financial Health, Competitors, Growth Opportunities`,
          companyResearch: true,
          clientId: clientId
        })
      });

      const data = await response.json();

      if (data.success && data.report) {
        // Enhance report with company-specific details
        const enhancedReport = {
          ...data.report,
          companyName: searchTerm,
          clientId: clientId,
          sections: {
            overview: 'Company Profile & Key Metrics',
            financials: 'Financial Performance & Trends',
            competitors: 'Competitive Landscape',
            market: 'Market Position & Opportunities',
            risks: 'Risk Assessment & Mitigation',
            recommendations: 'Strategic Recommendations'
          }
        };

        this.currentReport = enhancedReport;
        this.renderCompanyReport(enhancedReport);
        
        // Store in cache
        this.companyReports[`report_${clientId}`] = enhancedReport;
        
        // Update reports list
        this.reports.unshift({
          id: data.report.id,
          topic: `${searchTerm} (Company Research)`,
          date: data.report.generatedAt,
          status: data.report.status,
          isCompanyReport: true,
          clientId: clientId
        });
        this.renderReportsList();
      } else {
        container.innerHTML = `<div class="error">Error generating company research: ${data.error || 'Unknown error'}</div>`;
      }
    } catch (error) {
      console.error('[ResearchBot] Company research error:', error);
      const container = document.getElementById('research-content');
      if (container) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      }
    }
  }

  /**
   * Render full report
   */
  renderReport(report) {
    const container = document.getElementById('research-content');
    if (!container) return;

    let html = `
      <div class="research-report">
        <div class="report-header">
          <h2>🔬 Research Report: ${report.topic}</h2>
          <div class="report-meta">
            <span class="confidence">Confidence: ${report.confidence}%</span>
            <span class="date">${new Date(report.generatedAt).toLocaleDateString()}</span>
            <span class="status ${report.status}">${report.status.toUpperCase()}</span>
          </div>
        </div>
    `;

    // Market Analysis
    if (report.sections.marketAnalysis) {
      html += this.renderMarketAnalysis(report.sections.marketAnalysis);
    }

    // Competitor Analysis
    if (report.sections.competitorAnalysis) {
      html += this.renderCompetitorAnalysis(report.sections.competitorAnalysis);
    }

    // Opportunities
    if (report.sections.opportunities) {
      html += this.renderOpportunities(report.sections.opportunities);
    }

    // Recommendations
    if (report.sections.recommendations) {
      html += this.renderRecommendations(report.sections.recommendations);
    }

    // Risk Analysis
    if (report.sections.risks) {
      html += this.renderRisks(report.sections.risks);
    }

    // Metrics
    if (report.sections.metrics) {
      html += this.renderMetrics(report.sections.metrics);
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Render market analysis section
   */
  renderMarketAnalysis(analysis) {
    let html = `
      <div class="section market-analysis">
        <h3>📊 Market Analysis</h3>
        <div class="market-size">
          <label>Market Size:</label>
          <span class="value">${analysis.marketSize.current}</span>
        </div>
        <div class="metrics-grid">
          <div class="metric">
            <label>Growth:</label>
            <span>${analysis.marketSize.growth}</span>
          </div>
          <div class="metric">
            <label>Trend:</label>
            <span>${analysis.marketSize.trend}</span>
          </div>
        </div>
        
        <h4>Key Trends</h4>
        <ul class="trends-list">
          ${analysis.keyTrends.map(t => `<li>${t}</li>`).join('')}
        </ul>

        <h4>Demand Signals</h4>
        <ul class="demand-signals">
          ${analysis.demandSignals.map(d => `<li>✅ ${d}</li>`).join('')}
        </ul>

        <h4>Market Gaps</h4>
        <ul class="gaps">
          ${analysis.marketGaps.map(g => `<li>⚠️ ${g}</li>`).join('')}
        </ul>
      </div>
    `;
    return html;
  }

  /**
   * Render competitor analysis section
   */
  renderCompetitorAnalysis(analysis) {
    let html = `
      <div class="section competitor-analysis">
        <h3>🏆 Competitive Landscape</h3>
        
        <h4>Direct Competitors</h4>
        <div class="competitors-grid">
          ${analysis.direct.map(comp => `
            <div class="competitor-card">
              <h5>${comp.name}</h5>
              <div class="metric">
                <label>Market Share:</label>
                <span>${comp.marketShare}</span>
              </div>
              <div class="metric">
                <label>Position:</label>
                <span>${comp.positioning}</span>
              </div>
              <div class="strengths">
                <label>Strengths:</label>
                <ul>${comp.strengths.map(s => `<li>+${s}</li>`).join('')}</ul>
              </div>
              <div class="weaknesses">
                <label>Weaknesses:</label>
                <ul>${comp.weaknesses.map(w => `<li>-${w}</li>`).join('')}</ul>
              </div>
            </div>
          `).join('')}
        </div>

        <h4>Our Advantages</h4>
        <div class="advantages">
          ${analysis.ourAdvantage.map(a => `<div class="advantage">${a}</div>`).join('')}
        </div>
      </div>
    `;
    return html;
  }

  /**
   * Render opportunities section
   */
  renderOpportunities(opportunities) {
    let html = `
      <div class="section opportunities">
        <h3>🚀 Growth Opportunities</h3>
        
        <h4>Short-Term (1-3 months)</h4>
        <div class="opportunities-list">
          ${opportunities.shortTerm.map(opp => this.renderOpportunittyCard(opp)).join('')}
        </div>

        <h4>Medium-Term (3-9 months)</h4>
        <div class="opportunities-list">
          ${opportunities.mediumTerm.map(opp => this.renderOpportunittyCard(opp)).join('')}
        </div>

        <h4>Long-Term (12+ months)</h4>
        <div class="opportunities-list">
          ${opportunities.longTerm.map(opp => this.renderOpportunittyCard(opp)).join('')}
        </div>
      </div>
    `;
    return html;
  }

  /**
   * Render single opportunity card
   */
  renderOpportunittyCard(opp) {
    return `
      <div class="opportunity-card">
        <h5>${opp.opportunity}</h5>
        <div class="details">
          <div class="detail">
            <label>Potential:</label>
            <span class="potential">${opp.potential}</span>
          </div>
          <div class="detail">
            <label>Timeline:</label>
            <span>${opp.timeline}</span>
          </div>
          <div class="detail">
            <label>Effort:</label>
            <span>${opp.effort}</span>
          </div>
          <p class="description">${opp.details}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render recommendations section
   */
  renderRecommendations(recommendations) {
    let html = `
      <div class="section recommendations">
        <h3>💡 Strategic Recommendations</h3>
        
        <div class="recommendations-list">
          ${recommendations.strategic.map(rec => `
            <div class="recommendation-card">
              <div class="priority ${rec.priority.toLowerCase().replace(/\s+/g, '-')}">${rec.priority}</div>
              <h5>${rec.recommendation}</h5>
              <div class="detail">
                <label>Rationale:</label>
                <p>${rec.rationale}</p>
              </div>
              <div class="detail">
                <label>Action:</label>
                <p>${rec.action}</p>
              </div>
              <div class="detail">
                <label>Expected Impact:</label>
                <p>${rec.expectedImpact}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <h4>Marketing Messages</h4>
        <ul class="marketing-messages">
          ${recommendations.marketing.map(m => `<li>"${m}"</li>`).join('')}
        </ul>
      </div>
    `;
    return html;
  }

  /**
   * Render risk analysis section
   */
  renderRisks(risks) {
    let html = `
      <div class="section risk-analysis">
        <h3>⚠️ Risk Analysis</h3>
        
        <h4>Technical Risks</h4>
        <div class="risks-list">
          ${risks.technicalRisks.map(r => this.renderRiskCard(r)).join('')}
        </div>

        <h4>Business Risks</h4>
        <div class="risks-list">
          ${risks.businessRisks.map(r => this.renderRiskCard(r)).join('')}
        </div>

        <h4>Market Risks</h4>
        <div class="risks-list">
          ${risks.marketRisks.map(r => this.renderRiskCard(r)).join('')}
        </div>
      </div>
    `;
    return html;
  }

  /**
   * Render single risk card
   */
  renderRiskCard(risk) {
    return `
      <div class="risk-card">
        <div class="risk-header">
          <h5>${risk.risk}</h5>
          <span class="severity ${risk.severity.toLowerCase()}">${risk.severity}</span>
        </div>
        <div class="detail">
          <label>Mitigation:</label>
          <p>${risk.mitigation}</p>
        </div>
        ${risk.timeline ? `<div class="detail"><label>Timeline:</label><p>${risk.timeline}</p></div>` : ''}
        ${risk.status ? `<div class="detail"><label>Status:</label><span class="status">${risk.status}</span></div>` : ''}
      </div>
    `;
  }

  /**
   * Render metrics section
   */
  renderMetrics(metrics) {
    let html = `
      <div class="section metrics">
        <h3>📈 Key Metrics & KPIs</h3>
        
        <h4>Launch Metrics</h4>
        <div class="metrics-grid">
          ${Object.entries(metrics.launchMetrics).map(([key, value]) => `
            <div class="metric-item">
              <label>${this.formatLabel(key)}</label>
              <span>${value}</span>
            </div>
          `).join('')}
        </div>

        <h4>Success Metrics</h4>
        <ul class="success-metrics">
          ${metrics.successMetrics.map(m => `<li>${m}</li>`).join('')}
        </ul>

        <h4>Tracking Dashboard</h4>
        <ul class="tracking">
          ${metrics.trackingDashboard.map(t => `<li>📊 ${t}</li>`).join('')}
        </ul>
      </div>
    `;
    return html;
  }

  /**
   * Format label from camelCase
   */
  formatLabel(str) {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, c => c.toUpperCase())
      .trim();
  }

  /**
   * Render enhanced company research report
   */
  renderCompanyReport(report) {
    const container = document.getElementById('research-content');
    if (!container) return;

    let html = `
      <div class="research-report">
        <div class="report-header" style="border-bottom:2px solid var(--gradient-primary);padding-bottom:15px;">
          <h2 style="color:var(--text-primary);margin:0;">🏢 Company Research Report: ${report.companyName}</h2>
          <div style="margin-top:10px;display:flex;gap:15px;flex-wrap:wrap;">
            <span style="background:var(--success);color:#000;padding:5px 12px;border-radius:6px;font-size:0.85em;font-weight:600;">📊 Comprehensive Analysis</span>
            <span style="background:var(--info);color:#000;padding:5px 12px;border-radius:6px;font-size:0.85em;font-weight:600;">Confidence: ${report.confidence}%</span>
            <span style="color:var(--text-secondary);font-size:0.9em;padding-top:3px;">Generated: ${new Date(report.generatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="report-sections" style="margin-top:20px;">
    `;

    // Report sections with rich details
    const sections = [
      {
        title: '📋 Executive Summary',
        key: 'executive_summary',
        icon: '📋'
      },
      {
        title: '💰 Financial Overview',
        key: 'financial_health',
        icon: '💰'
      },
      {
        title: '🎯 Market Position',
        key: 'market_position',
        icon: '🎯'
      },
      {
        title: '🏆 Competitive Advantage',
        key: 'competitive_edge',
        icon: '🏆'
      },
      {
        title: '⚠️ Risk Assessment',
        key: 'risks',
        icon: '⚠️'
      },
      {
        title: '🚀 Growth Opportunities',
        key: 'opportunities',
        icon: '🚀'
      },
      {
        title: '💡 Strategic Recommendations',
        key: 'recommendations',
        icon: '💡'
      }
    ];

    sections.forEach((section, idx) => {
      const content = report.sections && report.sections[section.key] 
        ? report.sections[section.key]
        : report.content || 'Analysis in progress...';

      html += `
        <div class="report-section" style="margin-bottom:20px;background:var(--surface-2);border-left:4px solid var(--gradient-primary);padding:15px;border-radius:4px;">
          <h3 style="color:var(--text-primary);margin:0 0 10px 0;font-size:1.1em;">
            <span>${section.title}</span>
          </h3>
          <div style="color:var(--text-secondary);line-height:1.6;">
            ${content.substring ? content.substring(0, 500) + '...' : JSON.stringify(content).substring(0, 500) + '...'}
          </div>
          <button onclick="alert('Full section view coming soon!')" style="margin-top:10px;background:var(--border-default);border:none;color:var(--text-primary);padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.85em;">
            View Full Details →
          </button>
        </div>
      `;
    });

    // Bottom action buttons
    html += `
        </div>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid var(--border-default);display:flex;gap:10px;flex-wrap:wrap;">
          <button onclick="researchBot.exportReport('${report.companyName}')" style="background:var(--gradient-primary);color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">
            📥 Export Report
          </button>
          <button onclick="researchBot.shareReport('${report.companyName}')" style="background:var(--border-default);color:var(--text-primary);border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">
            🔗 Share Report
          </button>
          <button onclick="researchBot.refineResearch('${report.companyName}')" style="background:var(--border-default);color:var(--text-primary);border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">
            🔄 Refine Analysis
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Export report (placeholder)
   */
  exportReport(companyName) {
    alert(`📥 Exporting ${companyName} report as PDF... (Coming soon)`);
  }

  /**
   * Share report (placeholder)
   */
  shareReport(companyName) {
    alert(`🔗 Sharing ${companyName} report... (Coming soon)`);
  }

  /**
   * Refine research (placeholder)
   */
  refineResearch(companyName) {
    alert(`🔄 Refining analysis for ${companyName}... (Coming soon)`);
  }

  /**
   * Render reports list sidebar
   */
  renderReportsList() {
    const sidebar = document.getElementById('research-sidebar');
    if (!sidebar) return;

    const endGoalTopics = [
      'AssS business model vs SaaS market positioning',
      'Autonomous AI agent market trends 2025',
      'PinkyBot.io competitive landscape',
      'Token economy integration in AI services',
      'Self-healing software platform opportunities',
      'Enterprise autonomous agent adoption'
    ];

    let html = `
      <div class="research-sidebar-content">
        <h3>📑 Quick Research</h3>
        <div class="quick-topics">
    `;

    endGoalTopics.forEach(topic => {
      html += `
        <button class="quick-topic-btn" onclick="researchBotUI.generateReport('${topic}')">
          ${topic}
        </button>
      `;
    });

    html += `
        </div>

        <h3>📚 Report History</h3>
        <div class="reports-history">
    `;

    if (this.reports.length === 0) {
      html += '<p class="no-reports">No reports yet. Generate one!</p>';
    } else {
      this.reports.forEach(report => {
        const date = new Date(report.date).toLocaleDateString();
        html += `
          <div class="report-item" onclick="researchBotUI.generateReport('${report.topic}')">
            <strong>${report.topic}</strong>
            <small>${date}</small>
            <span class="status">${report.status}</span>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    sidebar.innerHTML = html;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Auto-generate reports button
    const autoGenBtn = document.getElementById('research-auto-gen-btn');
    if (autoGenBtn) {
      autoGenBtn.addEventListener('click', () => this.autoGenerateReports());
    }
  }

  /**
   * Auto-generate reports for key topics
   */
  async autoGenerateReports() {
    try {
      const container = document.getElementById('research-content');
      if (!container) return;

      container.innerHTML = `
        <div class="research-loading">
          <div class="spinner"></div>
          <p>🔬 ResearchBot auto-generating strategic reports...</p>
          <p class="subtitle">Analyzing market, competitors, and opportunities for PinkyBot.io...</p>
        </div>
      `;

      const response = await fetch('/api/research/v2/auto-generate', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        container.innerHTML = `
          <div class="auto-gen-results">
            <h2>✅ Generated ${data.generated} Strategic Reports</h2>
            <div class="reports-summary">
              ${data.reports.map(r => `
                <div class="report-summary">
                  <h4>${r.topic}</h4>
                  <p>Confidence: ${r.confidence}%</p>
                  <p>${new Date(r.generatedAt).toLocaleString()}</p>
                  <button onclick="researchBotUI.generateReport('${r.topic}')">View Full Report</button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        this.loadReports();
      }
    } catch (error) {
      console.error('[ResearchBot] Auto-gen error:', error);
      const container = document.getElementById('research-content');
      if (container) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      }
    }
  }

  /**
   * Setup auto-refresh (every 10 minutes)
   */
  setupAutoRefresh() {
    this.autoRefreshInterval = setInterval(() => {
      this.loadReports();
    }, 10 * 60 * 1000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.researchBotUI = new ResearchBotUI();
  });
} else {
  window.researchBotUI = new ResearchBotUI();
}
