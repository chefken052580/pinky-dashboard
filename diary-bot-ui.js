/**
 * DiaryBot UI — Pinky's Personal Scribe Dashboard
 * 
 * Tabs: Live Feed | Knowledge Base | Escalation Pipeline | Memory Map
 */
(function() {
  'use strict';

  const API = window.PINKY_API || 'https://pinky-api.crackerbot.io';
  let currentTab = 'feed';
  let refreshTimer = null;

  function init() {
    console.log('[DiaryBot UI] 📝 Initializing...');
    setupTabs();
    loadDiaryFeed();
    loadEscalationStatus();
    loadMemoryTiers();
    refreshTimer = setInterval(() => {
      if (currentTab === 'feed') loadDiaryFeed();
      if (currentTab === 'escalation') loadEscalationStatus();
    }, 15000);
  }

  // ── Tab Navigation ──
  function setupTabs() {
    document.querySelectorAll('.diary-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentTab = tab.dataset.tab;
        document.querySelectorAll('.diary-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.diary-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        var panel = document.getElementById('diary-panel-' + currentTab);
        if (panel) panel.classList.add('active');
        if (currentTab === 'knowledge') loadKnowledge();
        if (currentTab === 'escalation') loadEscalationStatus();
        if (currentTab === 'memory') loadMemoryTiers();
      });
    });
  }

  // ── Diary Feed ──
  async function loadDiaryFeed() {
    try {
      var res = await fetch(API + '/api/diary/today');
      if (!res.ok) throw new Error('API error');
      var data = await res.json();
      var feed = document.getElementById('diary-feed-list');
      if (!feed) return;

      var countEl = document.getElementById('diary-entry-count');
      if (countEl) countEl.textContent = data.entries || 0;

      var entries = parseDiaryEntries(data.content || '');
      if (entries.length === 0) {
        feed.innerHTML = '<div class="diary-empty"><div class="diary-empty-icon">📝</div><div class="diary-empty-text">No entries yet today. DiaryBot is watching... NARF!</div></div>';
        return;
      }

      feed.innerHTML = entries.map(function(e) {
        return '<div class="diary-entry">' +
          '<span class="diary-entry-time">' + e.time + '</span>' +
          '<span class="diary-entry-source ' + getSourceClass(e.source) + '">' + e.source + '</span>' +
          '<div class="diary-entry-content">' +
            '<div class="diary-entry-action">' + e.action + '</div>' +
            (e.details ? '<div class="diary-entry-details">' + e.details + '</div>' : '') +
          '</div></div>';
      }).join('');
      feed.scrollTop = feed.scrollHeight;
    } catch (err) {
      console.warn('[DiaryBot UI] Feed error:', err.message);
    }
  }

  function parseDiaryEntries(content) {
    var entries = [];
    var lines = content.split('\n');
    var current = null;
    for (var i = 0; i < lines.length; i++) {
      var match = lines[i].match(/^###\s+(.+?)\s+—\s+\[(.+?)\]\s+(.+)/);
      if (match) {
        if (current) entries.push(current);
        current = { time: match[1], source: match[2], action: match[3], details: '' };
      } else if (current && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('*')) {
        current.details += (current.details ? ' ' : '') + lines[i].trim();
      }
    }
    if (current) entries.push(current);
    return entries;
  }

  function getSourceClass(source) {
    var s = source.toLowerCase();
    if (s.includes('brain')) return 'diary-source-brain';
    if (s.includes('pinky')) return 'diary-source-pinky';
    if (s.includes('task')) return 'diary-source-task';
    if (s.includes('escalat')) return 'diary-source-escalation';
    if (s.includes('knowledge') || s.includes('research')) return 'diary-source-knowledge';
    return 'diary-source-system';
  }

  // ── Quick Note ──
  window.diaryQuickNote = async function() {
    var textarea = document.getElementById('diary-note-input');
    if (!textarea || !textarea.value.trim()) return;
    try {
      await fetch(API + '/api/diary/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Brain', action: textarea.value.trim(), details: 'Added via dashboard' })
      });
      textarea.value = '';
      loadDiaryFeed();
    } catch (err) { console.error('[DiaryBot UI] Note error:', err); }
  };

  // ── Knowledge Base ──
  async function loadKnowledge(query) {
    var grid = document.getElementById('knowledge-grid');
    if (!grid) return;
    try {
      var url = API + '/api/diary/knowledge/search?q=' + encodeURIComponent(query || '');
      var res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      var data = await res.json();
      var countEl = document.getElementById('knowledge-count');
      if (countEl) countEl.textContent = data.count || 0;

      if (!data.results || data.results.length === 0) {
        grid.innerHTML = '<div class="diary-empty" style="grid-column:1/-1;"><div class="diary-empty-icon">📚</div><div class="diary-empty-text">' + (query ? 'No results for "' + query + '"' : 'Knowledge base empty. Web searches stored here.') + '</div></div>';
        return;
      }
      grid.innerHTML = data.results.map(function(k) {
        return '<div class="knowledge-card" onclick="diaryViewKnowledge(\'' + k.file + '\')">' +
          '<div class="knowledge-card-title">' + k.file.replace('.md', '').replace(/-/g, ' ') + '</div>' +
          '<div class="knowledge-card-snippet">' + (k.snippet || '').substring(0, 200) + '</div>' +
          '<div class="knowledge-card-meta"><span>Relevance: ' + k.relevance + '</span></div></div>';
      }).join('');
    } catch (err) {
      grid.innerHTML = '<div class="diary-empty" style="grid-column:1/-1;"><div class="diary-empty-icon">⚠️</div><div class="diary-empty-text">Could not load knowledge base</div></div>';
    }
  }

  window.diarySearchKnowledge = function() {
    var input = document.getElementById('knowledge-search-input');
    if (input) loadKnowledge(input.value);
  };
  window.diaryViewKnowledge = function(filename) {
    console.log('[DiaryBot UI] View:', filename);
  };

  // ── Escalation Engine ──
  async function loadEscalationStatus() {
    try {
      var res = await fetch(API + '/api/escalation/status');
      if (!res.ok) throw new Error('API error');
      var data = await res.json();
      renderPipeline(data.pinkyTiers || [], data.codebotTiers || []);
      renderCosts(data.costs || {});
      setEl('escalation-total-tasks', data.costs ? data.costs.totalTasks : 0);
      setEl('escalation-active', data.activeTasks || 0);
      setEl('escalation-escalations', data.costs ? data.costs.escalations : 0);
      setEl('escalation-self-debug-saves', data.costs ? data.costs.selfDebugSaves : 0);
    } catch (err) { console.warn('[DiaryBot UI] Escalation error:', err.message); }
  }

  function setEl(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }

  function renderPipeline(pinkyTiers, codebotTiers) {
    var container = document.getElementById('escalation-pipeline');
    if (!container) return;
    var icons = ['🐹', '🧠', '🤔', '🔬', '🆓', '💎', '👑'];
    var html = '';

    pinkyTiers.forEach(function(t, i) {
      if (i > 0) html += '<span class="tier-arrow">→</span>';
      html += '<div class="tier-node" id="tier-node-' + i + '">' +
        '<span class="tier-icon">' + icons[i] + '</span>' +
        '<span class="tier-name">' + t.name.split('(')[0].trim() + '</span>' +
        '<span class="tier-cost">' + t.cost + '</span>' +
        '<span class="tier-shots">' + t.shots + '</span></div>';
    });

    html += '<div class="tier-divider"></div>';

    codebotTiers.forEach(function(t, i) {
      if (i > 0) html += '<span class="tier-arrow">→</span>';
      var isFree = t.includes('FREE');
      html += '<div class="tier-node ' + (isFree ? 'completed' : '') + '">' +
        '<span class="tier-icon">' + icons[pinkyTiers.length + i] + '</span>' +
        '<span class="tier-name">' + t.split(':')[0].replace('Tier ', 'T') + '</span>' +
        '<span class="tier-cost">' + (isFree ? 'FREE' : '') + '</span></div>';
    });

    container.innerHTML = html;
  }

  function renderCosts(costs) {
    var container = document.getElementById('cost-savings-widget');
    if (!container) return;
    container.innerHTML = '<div class="savings-comparison">' +
      '<div class="savings-old"><div class="savings-label">Old Cost (Sonnet Always)</div><div class="savings-amount">' + (costs.oldCost || '$0.00') + '</div></div>' +
      '<div class="savings-arrow">→</div>' +
      '<div class="savings-new"><div class="savings-label">Tiered Cost</div><div class="savings-amount">' + (costs.actualCost || '$0.00') + '</div></div>' +
      '</div><div class="savings-percent">' + (costs.savings || 'N/A') + ' saved</div>' +
      '<div style="display:flex;justify-content:space-around;margin-top:12px;font-size:0.75em;color:var(--text-muted);">' +
      '<span>🐹 Haiku: ' + (costs.byModel ? costs.byModel.haiku : 0) + '</span>' +
      '<span>🧠 Sonnet: ' + (costs.byModel ? costs.byModel.sonnet : 0) + '</span>' +
      '<span>🤔 Think: ' + (costs.byModel ? costs.byModel.sonnetThink : 0) + '</span></div>';
  }

  // ── Memory Map ──
  function loadMemoryTiers() {
    var container = document.getElementById('memory-tiers-grid');
    if (!container) return;
    var tiers = [
      { name: 'CORE.md', type: 'always', badge: 'Always Loaded', desc: 'Identity, rules, model routing. ~800 tokens.', icon: '💎' },
      { name: 'PATTERNS.md', type: 'demand', badge: 'On Demand', desc: 'Design system, protected files, CSS rules.', icon: '📐' },
      { name: 'CONTEXT.md', type: 'demand', badge: 'On Demand', desc: 'Current phase, active tasks, recent decisions.', icon: '📋' },
      { name: 'END-GOAL.md', type: 'demand', badge: 'On Demand', desc: 'Full product vision. Architecture decisions only.', icon: '🎯' },
      { name: 'MEMORY.md', type: 'demand', badge: 'On Demand', desc: 'Working memory with absolute rules and protocols.', icon: '🧠' },
      { name: 'diary/', type: 'demand', badge: 'DiaryBot', desc: 'Daily activity logs. Recent context for any bot.', icon: '📝' },
      { name: 'knowledge/', type: 'demand', badge: 'DiaryBot', desc: 'Stored web search results. Check before searching.', icon: '📚' },
      { name: 'handoffs/', type: 'demand', badge: 'Escalation', desc: 'Tier transition notes. ~500 tokens each.', icon: '🤝' },
      { name: 'archive/', type: 'archive', badge: 'Never Auto-Load', desc: '48 old phase reports, test logs. Reference only.', icon: '🗄️' }
    ];
    container.innerHTML = tiers.map(function(t) {
      var cls = t.type === 'always' ? 'always-loaded' : t.type === 'archive' ? 'archived' : 'on-demand';
      var bcls = t.type === 'always' ? 'memory-badge-always' : t.type === 'archive' ? 'memory-badge-archive' : 'memory-badge-demand';
      return '<div class="memory-tier-card ' + cls + '">' +
        '<div class="memory-tier-name"><span>' + t.icon + ' ' + t.name + '</span><span class="memory-tier-badge ' + bcls + '">' + t.badge + '</span></div>' +
        '<div class="memory-tier-desc">' + t.desc + '</div></div>';
    }).join('');
  }

  // ── Store Knowledge ──
  window.diaryStoreKnowledge = async function() {
    var topic = document.getElementById('knowledge-topic-input');
    var content = document.getElementById('knowledge-content-input');
    if (!topic || !content || !topic.value.trim() || !content.value.trim()) return;
    try {
      await fetch(API + '/api/diary/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.value.trim(), content: content.value.trim(), source: 'manual' })
      });
      topic.value = ''; content.value = '';
      loadKnowledge();
    } catch (err) { console.error('[DiaryBot UI] Store error:', err); }
  };

  // ── Generate Summary ──
  window.diaryGenerateSummary = async function() {
    var btn = document.getElementById('diary-summary-btn');
    if (btn) { btn.textContent = 'Generating...'; btn.disabled = true; }
    try {
      await fetch(API + '/api/diary/summary', { method: 'POST' });
      loadDiaryFeed();
    } catch (err) { console.error('[DiaryBot UI] Summary error:', err); }
    if (btn) { btn.textContent = '📊 Generate Summary'; btn.disabled = false; }
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
