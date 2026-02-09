/**
 * Pinky Chat v2 — "Talk to the AI that built himself"
 * Full chat with session management, search, persistent history,
 * code block copy, hover actions, connection status, scroll-to-bottom FAB
 */

(function() {
    'use strict';

    var currentSessionId = null;
    var isWaiting = false;
    var chatInitialized = false;
    var scrollFab = null;

    // ─── Init ───
    function init() {
        if (chatInitialized) return;
        chatInitialized = true;
        console.log('[PinkyChat v2] Initializing...');
        loadSessions();
        bindEvents();
        createScrollFab();
        console.log('[PinkyChat v2] Ready!');
    }

    // ─── Event Bindings ───
    function bindEvents() {
        var sendBtn = document.getElementById('chat-send-btn');
        var textarea = document.getElementById('chat-input');
        var newBtn = document.getElementById('chat-new-session');
        var searchInput = document.getElementById('chat-search');

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        
        if (textarea) {
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            // Auto-resize
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 160) + 'px';
            });
        }

        if (newBtn) newBtn.addEventListener('click', newSession);
        
        if (searchInput) {
            var debounce = null;
            searchInput.addEventListener('input', function() {
                clearTimeout(debounce);
                var q = this.value.trim();
                debounce = setTimeout(function() {
                    if (q.length >= 2) {
                        searchSessions(q);
                    } else {
                        loadSessions();
                    }
                }, 300);
            });
        }

        // Scroll listener for FAB visibility
        var msgContainer = document.getElementById('chat-messages');
        if (msgContainer) {
            msgContainer.addEventListener('scroll', function() {
                var distFromBottom = this.scrollHeight - this.scrollTop - this.clientHeight;
                if (scrollFab) {
                    if (distFromBottom > 200) {
                        scrollFab.classList.add('visible');
                    } else {
                        scrollFab.classList.remove('visible');
                    }
                }
            });
        }
    }

    // ─── Scroll to Bottom FAB ───
    function createScrollFab() {
        var chatMain = document.querySelector('.chat-main');
        if (!chatMain || document.querySelector('.chat-scroll-fab')) return;
        
        scrollFab = document.createElement('button');
        scrollFab.className = 'chat-scroll-fab';
        scrollFab.innerHTML = '↓';
        scrollFab.title = 'Scroll to bottom';
        scrollFab.addEventListener('click', function() {
            scrollToBottom(true);
        });
        chatMain.appendChild(scrollFab);
    }

    // ─── Sessions ───
    function loadSessions() {
        fetch('/api/chat/sessions')
            .then(function(r) { return r.json(); })
            .then(function(sessions) {
                renderSessionList(sessions);
            })
            .catch(function(err) {
                console.error('[PinkyChat] Failed to load sessions:', err);
            });
    }

    function renderSessionList(sessions) {
        var list = document.getElementById('chat-session-list');
        if (!list) return;

        if (!sessions || sessions.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--chat-text-muted,#5e5580);font-size:0.78em;font-family:var(--chat-font,monospace);">' +
                'No conversations yet.<br><span style="opacity:0.6">Start chatting with Pinky!</span></div>';
            return;
        }

        var html = '';
        sessions.forEach(function(s) {
            var isActive = s.id === currentSessionId ? ' active' : '';
            var date = new Date(s.updated);
            var timeStr = formatTime(date);
            html += '<div class="chat-session-item' + isActive + '" data-session="' + s.id + '" onclick="PinkyChat.openSession(\'' + s.id + '\')">' +
                '<div style="display:flex;justify-content:space-between;align-items:start;">' +
                '<div class="chat-session-title">' + escapeHtml(s.title) + '</div>' +
                '<button class="chat-session-delete" onclick="event.stopPropagation();PinkyChat.deleteSession(\'' + s.id + '\')" title="Delete">✕</button>' +
                '</div>' +
                '<div class="chat-session-meta">' +
                '<span>' + s.messageCount + ' msgs</span>' +
                '<span>' + timeStr + '</span>' +
                '</div>' +
                (s.lastMessage ? '<div class="chat-session-preview">' + escapeHtml(s.lastMessage) + '</div>' : '') +
                '</div>';
        });
        list.innerHTML = html;
    }

    function openSession(sessionId) {
        currentSessionId = sessionId;
        
        // Highlight in sidebar
        document.querySelectorAll('.chat-session-item').forEach(function(el) {
            el.classList.toggle('active', el.dataset.session === sessionId);
        });

        fetch('/api/chat/session/' + sessionId)
            .then(function(r) { return r.json(); })
            .then(function(session) {
                renderMessages(session.messages);
                updateHeader(session);
            })
            .catch(function(err) {
                console.error('[PinkyChat] Failed to load session:', err);
            });
    }

    function newSession() {
        currentSessionId = null;
        var msgs = document.getElementById('chat-messages');
        if (msgs) {
            msgs.innerHTML = getEmptyState();
        }
        updateHeader(null);
        
        document.querySelectorAll('.chat-session-item').forEach(function(el) {
            el.classList.remove('active');
        });

        var input = document.getElementById('chat-input');
        if (input) input.focus();
    }

    function deleteSession(sessionId) {
        if (!confirm('Delete this conversation?')) return;
        
        fetch('/api/chat/session/' + sessionId, { method: 'DELETE' })
            .then(function() {
                if (currentSessionId === sessionId) {
                    newSession();
                }
                loadSessions();
            })
            .catch(function(err) {
                console.error('[PinkyChat] Delete failed:', err);
            });
    }

    // ─── Search ───
    function searchSessions(query) {
        fetch('/api/chat/search?q=' + encodeURIComponent(query))
            .then(function(r) { return r.json(); })
            .then(function(results) {
                renderSearchResults(results);
            })
            .catch(function(err) {
                console.error('[PinkyChat] Search failed:', err);
            });
    }

    function renderSearchResults(results) {
        var list = document.getElementById('chat-session-list');
        if (!list) return;

        if (!results || results.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--chat-text-muted);font-size:0.78em;">No matches found</div>';
            return;
        }

        var html = '<div class="chat-search-results">';
        results.forEach(function(r) {
            html += '<div class="chat-search-result" onclick="PinkyChat.openSession(\'' + r.id + '\')">' +
                '<div class="chat-search-result-title">' + escapeHtml(r.title) + ' (' + r.matchCount + ' matches)</div>';
            if (r.matches && r.matches[0]) {
                html += '<div class="chat-search-result-match">' + escapeHtml(r.matches[0].text) + '</div>';
            }
            html += '</div>';
        });
        html += '</div>';
        list.innerHTML = html;
    }

    // ─── Messaging ───
    function sendMessage() {
        if (isWaiting) return;

        var textarea = document.getElementById('chat-input');
        var message = textarea ? textarea.value.trim() : '';
        if (!message) return;

        // Clear input
        textarea.value = '';
        textarea.style.height = 'auto';

        // Clear empty state if present
        var msgs = document.getElementById('chat-messages');
        if (msgs && msgs.querySelector('.chat-empty-state')) {
            msgs.innerHTML = '';
        }

        // Add user message to UI
        appendMessage('user', message);

        // Show typing indicator
        showTyping();
        setWaiting(true);

        // Send to API
        fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                sessionId: currentSessionId
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            hideTyping();
            setWaiting(false);

            if (data.sessionId && !currentSessionId) {
                currentSessionId = data.sessionId;
            }

            if (data.response) {
                appendMessage('assistant', data.response);
            } else if (data.error) {
                appendMessage('assistant', '⚠️ Error: ' + data.error);
            }

            loadSessions();
        })
        .catch(function(err) {
            hideTyping();
            setWaiting(false);
            appendMessage('assistant', '⚠️ Connection error — is the backend running?');
            console.error('[PinkyChat] Send failed:', err);
        });
    }

    // ─── Render Messages ───
    function renderMessages(messages) {
        var container = document.getElementById('chat-messages');
        if (!container) return;

        if (!messages || messages.length === 0) {
            container.innerHTML = getEmptyState();
            return;
        }

        container.innerHTML = '';
        var lastDate = '';
        
        messages.forEach(function(msg) {
            // Date divider
            var msgDate = new Date(msg.timestamp || Date.now());
            var dateStr = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (dateStr !== lastDate) {
                lastDate = dateStr;
                var divider = document.createElement('div');
                divider.className = 'chat-date-divider';
                divider.innerHTML = '<span>' + dateStr + '</span>';
                container.appendChild(divider);
            }
            
            appendMessage(msg.role, msg.content, msg.timestamp, false);
        });
        scrollToBottom();
    }

    function appendMessage(role, content, timestamp, scroll) {
        var container = document.getElementById('chat-messages');
        if (!container) return;

        var time = timestamp ? new Date(timestamp) : new Date();
        var timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }) + ' EST';
        var avatar = role === 'user' ? '👤' : '🐭';
        var name = role === 'user' ? 'LORD_CRACKER' : 'PINKY';
        var rendered = renderMarkdown(content);
        var msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

        var div = document.createElement('div');
        div.className = 'chat-msg ' + role;
        div.id = msgId;
        div.innerHTML = '<div class="chat-msg-avatar">' + avatar + '</div>' +
            '<div class="chat-msg-body">' +
            '<div class="chat-msg-name">' + name + '</div>' +
            '<div class="chat-msg-content">' + rendered +
            '<div class="chat-msg-actions">' +
            '<button class="chat-msg-action-btn" onclick="PinkyChat.copyMessage(\'' + msgId + '\')" title="Copy">📋</button>' +
            '</div>' +
            '</div>' +
            '<div class="chat-msg-time">' + timeStr + '</div>' +
            '</div>';

        container.appendChild(div);

        // Add copy buttons to code blocks
        div.querySelectorAll('pre').forEach(function(pre) {
            var btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var code = pre.querySelector('code');
                var text = code ? code.textContent : pre.textContent;
                navigator.clipboard.writeText(text).then(function() {
                    btn.textContent = '✓ Copied';
                    btn.classList.add('copied');
                    setTimeout(function() {
                        btn.textContent = 'Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                });
            });
            pre.style.position = 'relative';
            pre.appendChild(btn);
        });

        if (scroll !== false) {
            scrollToBottom();
        }
    }

    function showTyping() {
        var container = document.getElementById('chat-messages');
        if (!container) return;

        var div = document.createElement('div');
        div.id = 'chat-typing-indicator';
        div.className = 'chat-typing';
        div.innerHTML = '<div class="chat-msg-avatar" style="background:linear-gradient(135deg,rgba(244,114,182,0.15),rgba(124,58,237,0.2));border:1px solid rgba(244,114,182,0.3);width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.15em;">🐭</div>' +
            '<div class="chat-msg-content">' +
            '<div class="typing-dots"><span></span><span></span><span></span></div>' +
            '<div class="typing-label">Pinky is thinking...</div>' +
            '</div>';
        container.appendChild(div);
        scrollToBottom();
    }

    function hideTyping() {
        var el = document.getElementById('chat-typing-indicator');
        if (el) el.remove();
    }

    function updateHeader(session) {
        var title = document.getElementById('chat-header-title-text');
        var stats = document.getElementById('chat-header-stats');
        
        if (title) {
            title.textContent = session ? (session.title || 'Chat with Pinky') : 'New Conversation';
        }
        if (stats && session) {
            var msgCount = session.messages ? session.messages.length : session.messageCount || 0;
            var tokens = session.tokenCount || 0;
            stats.innerHTML = '<span>' + msgCount + ' msgs</span>' +
                (tokens ? '<span class="chat-cost-badge">~' + (tokens * 0.000003).toFixed(4) + ' USD</span>' : '') +
                '<span class="chat-model-badge">Pinky AI</span>';
        } else if (stats) {
            stats.innerHTML = '<span class="chat-model-badge">Pinky AI</span>';
        }
    }

    function getEmptyState() {
        return '<div class="chat-empty-state">' +
            '<div class="pinky-avatar-large">🐭</div>' +
            '<h3>Chat with Pinky</h3>' +
            '<p>Ask about tasks, check status, give commands, or just say hi. Your conversations are saved and searchable.</p>' +
            '<div class="chat-quick-actions">' +
            '<button class="chat-quick-btn" onclick="PinkyChat.quickSend(\'What are you working on right now?\')">📋 Current tasks</button>' +
            '<button class="chat-quick-btn" onclick="PinkyChat.quickSend(\'Show me your heartbeat status and what you accomplished today\')">💓 Status report</button>' +
            '<button class="chat-quick-btn" onclick="PinkyChat.quickSend(\'What needs to be done next? Check the task queue.\')">🎯 Next task</button>' +
            '<button class="chat-quick-btn" onclick="PinkyChat.quickSend(\'How much have you spent in API costs today?\')">💰 Cost check</button>' +
            '</div>' +
            '</div>';
    }

    // ─── Markdown Rendering ───
    function renderMarkdown(text) {
        if (!text) return '';
        var html = escapeHtml(text);
        
        // Code blocks with language labels
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(m, lang, code) {
            var langLabel = lang ? '<div style="position:absolute;top:4px;left:12px;font-size:0.65em;color:rgba(167,139,250,0.5);text-transform:uppercase;letter-spacing:1px;">' + lang + '</div>' : '';
            return '<pre style="position:relative;">' + langLabel + '<code class="lang-' + lang + '">' + code.trim() + '</code></pre>';
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Strikethrough
        html = html.replace(/~~(.+?)~~/g, '<del style="color:var(--chat-text-muted);">$1</del>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // Blockquotes
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Unordered lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    // ─── Utilities ───
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatTime(date) {
        var now = new Date();
        var diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (msgDay.getTime() === today.getTime()) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
        
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (msgDay.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function scrollToBottom(smooth) {
        var container = document.getElementById('chat-messages');
        if (container) {
            setTimeout(function() {
                if (smooth) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                } else {
                    container.scrollTop = container.scrollHeight;
                }
            }, 50);
        }
    }

    function setWaiting(waiting) {
        isWaiting = waiting;
        var btn = document.getElementById('chat-send-btn');
        var textarea = document.getElementById('chat-input');
        if (btn) {
            btn.disabled = waiting;
            btn.textContent = waiting ? 'THINKING...' : 'SEND';
            btn.classList.toggle('thinking', waiting);
        }
        if (textarea) {
            textarea.disabled = waiting;
            if (!waiting) textarea.focus();
        }
    }

    function quickSend(text) {
        var textarea = document.getElementById('chat-input');
        if (textarea) {
            textarea.value = text;
            sendMessage();
        }
    }

    function copyMessage(msgId) {
        var msg = document.getElementById(msgId);
        if (!msg) return;
        var content = msg.querySelector('.chat-msg-content');
        if (!content) return;
        
        // Get text content without action buttons
        var clone = content.cloneNode(true);
        var actions = clone.querySelector('.chat-msg-actions');
        if (actions) actions.remove();
        var copyBtns = clone.querySelectorAll('.code-copy-btn');
        copyBtns.forEach(function(b) { b.remove(); });
        
        navigator.clipboard.writeText(clone.textContent.trim()).then(function() {
            var btn = msg.querySelector('.chat-msg-action-btn');
            if (btn) {
                btn.classList.add('copied');
                btn.innerHTML = '✓';
                setTimeout(function() {
                    btn.classList.remove('copied');
                    btn.innerHTML = '📋';
                }, 2000);
            }
        });
    }

    // ─── Public API ───
    window.PinkyChat = {
        init: init,
        openSession: openSession,
        deleteSession: deleteSession,
        newSession: newSession,
        quickSend: quickSend,
        copyMessage: copyMessage
    };

    // Auto-init when chat view becomes visible
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.target.id === 'chat-view' && m.target.classList.contains('active')) {
                init();
            }
        });
    });

    var chatView = document.getElementById('chat-view');
    if (chatView) {
        observer.observe(chatView, { attributes: true, attributeFilter: ['class'] });
    }

    // Also init on DOMContentLoaded if chat is already active
    document.addEventListener('DOMContentLoaded', function() {
        var cv = document.getElementById('chat-view');
        if (cv && cv.classList.contains('active')) {
            init();
        }
    });

})();
