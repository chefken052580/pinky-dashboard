/**
 * Perplexity Search Integration UI for ResearchBot
 * Provides web search with AI-powered synthesis and citations
 */

class PerplexitySearch {
  constructor() {
    this.currentModel = 'sonar';
    this.searchHistory = [];
    this.isSearching = false;
    this.init();
  }

  async init() {
    await this.checkStatus();
    this.render();
    await this.loadHistory();
  }

  /**
   * Check if Perplexity API is configured
   */
  async checkStatus() {
    try {
      const response = await fetch('/api/perplexity/status');
      const data = await response.json();
      this.configured = data.configured;
      
      if (!this.configured) {
        console.warn('Perplexity API not configured');
      }
    } catch (error) {
      console.error('Failed to check Perplexity status:', error);
      this.configured = false;
    }
  }

  /**
   * Load search history
   */
  async loadHistory() {
    try {
      const response = await fetch('/api/perplexity/history?limit=10');
      const data = await response.json();
      
      if (data.success) {
        this.searchHistory = data.searches || [];
        this.renderHistory();
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  /**
   * Render main UI
   */
  render() {
    const container = document.getElementById('researchbot-container');
    if (!container) return;

    container.innerHTML = `
      <div class="perplexity-search-container">
        <!-- Search Form -->
        <div class="perplexity-search-form">
          <div class="search-header">
            <h3>🔍 AI-Powered Web Search</h3>
            ${!this.configured ? `
              <div class="warning-banner" style="margin-top:10px;padding:10px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:8px;">
                <span style="color:#fbbf24;">⚠️ Perplexity API not configured. Add <code>PERPLEXITY_API_KEY</code> to .env file.</span>
              </div>
            ` : ''}
          </div>

          <!-- Model Selector -->
          <div class="model-selector" style="margin:15px 0;">
            <label for="perplexity-model" style="display:block;margin-bottom:8px;font-weight:600;color:#fff;">Search Model:</label>
            <select id="perplexity-model" class="form-control" style="width:100%;padding:10px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;">
              <option value="sonar">Sonar - Fast & Efficient (Recommended)</option>
              <option value="sonar-pro">Sonar Pro - Advanced Analysis</option>
              <option value="sonar-reasoning">Sonar Reasoning - Complex Questions</option>
              <option value="sonar-deep-research">Sonar Deep Research - Comprehensive</option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="search-input-wrapper" style="position:relative;">
            <textarea 
              id="perplexity-query" 
              class="form-control" 
              placeholder="Ask a research question... (e.g., 'What are the latest trends in AI automation?')"
              rows="3"
              style="width:100%;padding:12px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;resize:vertical;font-size:14px;"
            ></textarea>
            <div style="margin-top:10px;display:flex;gap:10px;align-items:center;">
              <button 
                id="perplexity-search-btn" 
                class="action-btn" 
                style="padding:12px 24px;border-radius:8px;flex:1;"
                ${!this.configured ? 'disabled' : ''}
              >
                🔍 Search with AI
              </button>
              <button 
                id="perplexity-clear-btn" 
                class="action-btn" 
                style="padding:12px 20px;border-radius:8px;background:var(--gradient-secondary);"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div id="perplexity-results" class="perplexity-results" style="margin-top:30px;display:none;">
          <div class="results-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <h3>📄 Search Results</h3>
            <span id="search-duration" style="color:var(--text-secondary);font-size:14px;"></span>
          </div>
          
          <div id="results-content" class="results-content">
            <!-- Results will be inserted here -->
          </div>
        </div>

        <!-- Search History -->
        <div class="perplexity-history" style="margin-top:30px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <h3>📚 Recent Searches</h3>
            <button id="clear-history-btn" class="action-btn" style="padding:8px 16px;font-size:13px;background:var(--gradient-secondary);">Clear History</button>
          </div>
          <div id="perplexity-history-list" class="history-list">
            <!-- History will be inserted here -->
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Model selector
    const modelSelect = document.getElementById('perplexity-model');
    if (modelSelect) {
      modelSelect.value = this.currentModel;
      modelSelect.addEventListener('change', (e) => {
        this.currentModel = e.target.value;
      });
    }

    // Search button
    const searchBtn = document.getElementById('perplexity-search-btn');
    if (searchBtn && !searchBtn.disabled) {
      searchBtn.addEventListener('click', () => this.executeSearch());
    }

    // Clear button
    const clearBtn = document.getElementById('perplexity-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.getElementById('perplexity-query').value = '';
        document.getElementById('perplexity-results').style.display = 'none';
      });
    }

    // Clear history button
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    // Enter key to search
    const queryInput = document.getElementById('perplexity-query');
    if (queryInput) {
      queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey && !this.isSearching) {
          this.executeSearch();
        }
      });
    }
  }

  /**
   * Execute Perplexity search
   */
  async executeSearch() {
    if (this.isSearching) return;

    const queryInput = document.getElementById('perplexity-query');
    const searchBtn = document.getElementById('perplexity-search-btn');
    const query = queryInput.value.trim();

    if (!query) {
      alert('Please enter a search query');
      return;
    }

    this.isSearching = true;
    searchBtn.textContent = '⏳ Searching...';
    searchBtn.disabled = true;

    try {
      const response = await fetch('/api/perplexity/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          model: this.currentModel,
          options: {
            search_recency_filter: 'month',
            return_citations: true,
            return_related_questions: true
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        this.displayResults(data);
        await this.loadHistory(); // Refresh history
      } else {
        alert(`Search failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`Search failed: ${error.message}`);
    } finally {
      this.isSearching = false;
      searchBtn.textContent = '🔍 Search with AI';
      searchBtn.disabled = false;
    }
  }

  /**
   * Display search results
   */
  displayResults(data) {
    const resultsDiv = document.getElementById('perplexity-results');
    const contentDiv = document.getElementById('results-content');
    const durationSpan = document.getElementById('search-duration');

    if (!resultsDiv || !contentDiv) return;

    // Show results section
    resultsDiv.style.display = 'block';
    durationSpan.textContent = `${data.duration}ms`;

    // Build results HTML
    let html = `
      <div class="result-card" style="padding:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
        <div class="result-query" style="font-weight:600;color:#00d4ff;margin-bottom:15px;font-size:16px;">
          ${this.escapeHtml(data.query)}
        </div>
        <div class="result-answer" style="line-height:1.7;color:#e5e7eb;white-space:pre-wrap;">
          ${this.formatMarkdown(data.answer)}
        </div>
      </div>
    `;

    // Citations
    if (data.citations && data.citations.length > 0) {
      html += `
        <div class="citations-section" style="margin-top:20px;">
          <h4 style="color:#fbbf24;margin-bottom:12px;">📚 Sources & Citations</h4>
          <div style="display:grid;gap:10px;">
            ${data.citations.map((citation, idx) => `
              <div class="citation-item" style="padding:12px;background:rgba(251,191,36,0.05);border-left:3px solid #fbbf24;border-radius:6px;">
                <div style="font-weight:600;color:#fbbf24;margin-bottom:5px;">[${idx + 1}] ${this.getDomainFromUrl(citation)}</div>
                <a href="${this.escapeHtml(citation)}" target="_blank" style="color:#00d4ff;font-size:13px;word-break:break-all;">${this.escapeHtml(citation)}</a>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Related Questions
    if (data.relatedQuestions && data.relatedQuestions.length > 0) {
      html += `
        <div class="related-questions" style="margin-top:20px;">
          <h4 style="color:#a78bfa;margin-bottom:12px;">💡 Related Questions</h4>
          <div style="display:grid;gap:8px;">
            ${data.relatedQuestions.map(q => `
              <div class="related-question" style="padding:10px;background:rgba(167,139,250,0.05);border-left:3px solid #a78bfa;border-radius:6px;cursor:pointer;" onclick="document.getElementById('perplexity-query').value='${this.escapeHtml(q)}';window.scrollTo(0,0);">
                ${this.escapeHtml(q)}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    contentDiv.innerHTML = html;

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Render search history
   */
  renderHistory() {
    const historyList = document.getElementById('perplexity-history-list');
    if (!historyList) return;

    if (this.searchHistory.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state" style="text-align:center;padding:30px;color:var(--text-secondary);">
          No search history yet. Try a search above!
        </div>
      `;
      return;
    }

    historyList.innerHTML = this.searchHistory.map(search => `
      <div class="history-item" style="padding:15px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;margin-bottom:10px;cursor:pointer;" onclick="window.perplexitySearch.loadHistoryItem('${search.id}')">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div style="flex:1;">
            <div style="font-weight:600;color:#fff;margin-bottom:5px;">${this.escapeHtml(search.query)}</div>
            <div style="font-size:13px;color:var(--text-secondary);">
              <span>Model: ${search.model}</span>
              <span style="margin-left:15px;">Duration: ${search.duration}ms</span>
              <span style="margin-left:15px;">Citations: ${search.citations?.length || 0}</span>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);white-space:nowrap;margin-left:15px;">
            ${this.formatTimestamp(search.timestamp)}
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Load a history item (re-display results)
   */
  loadHistoryItem(searchId) {
    const search = this.searchHistory.find(s => s.id === searchId);
    if (!search) return;

    // Set query and model
    const queryInput = document.getElementById('perplexity-query');
    const modelSelect = document.getElementById('perplexity-model');
    if (queryInput) queryInput.value = search.query;
    if (modelSelect) {
      modelSelect.value = search.model;
      this.currentModel = search.model;
    }

    // Display results
    this.displayResults(search);
  }

  /**
   * Clear search history
   */
  async clearHistory() {
    if (!confirm('Clear all search history?')) return;

    try {
      const response = await fetch('/api/perplexity/history', {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        this.searchHistory = [];
        this.renderHistory();
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history');
    }
  }

  /**
   * Helper: Format markdown-style text
   */
  formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p style="margin-top:12px;">')
      .replace(/\n/g, '<br>');
  }

  /**
   * Helper: Extract domain from URL
   */
  getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * Helper: Format timestamp
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  /**
   * Helper: Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're on the research view
  const researchView = document.getElementById('research-view');
  if (researchView) {
    window.perplexitySearch = new PerplexitySearch();
  }
});
