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
    this.init();
  }

  init() {
    console.log('[ResearchBot UI] Initializing...');
    this.loadReports();
    this.setupEventListeners();
    this.setupAutoRefresh();
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
