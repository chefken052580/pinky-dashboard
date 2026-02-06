/**
 * Pinky Chat - Dashboard Chat Interface
 * Full chat with session management, search, and persistent history
 */

(function() {
    'use strict';

    var currentSessionId = null;
    var isWaiting = false;

    // ─── Init ───
    function init() {
        console.log('[PinkyChat] Initializing...');
        loadSessions();
        bindEvents();
        console.log('[PinkyChat] Ready!');
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
                this.style.height = Math.min(this.scrollHeight, 150) + 'px';
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
    }

    // ─── Helper: Safe JSON Response Handler ───
    function safeJsonResponse(response, context) {
        context = context || 'API';
        
        // Check if response is OK
        if (!response.ok) {
            var contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                return Promise.reject(new Error(context + ' returned HTML error (HTTP ' + response.status + '). Server may be down.'));
            }
            return Promise.reject(new Error(context + ' error: HTTP ' + response.status + ' ' + response.statusText));
        }
        
        // Check content-type before parsing
        var contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return Promise.reject(new Error(context + ' returned non-JSON response (Content-Type: ' + contentType + '). Expected JSON.'));
        }
        
        return response.json();
    }

    // ─── Sessions ───
    function loadSessions() {
        fetch('/api/chat/sessions')
            .then(function(r) { return safeJsonResponse(r, 'Chat/Sessions'); })
            .then(function(sessions) {
                renderSessionList(sessions);
            })
            .catch(function(err) {
                console.error('[PinkyChat] Failed to load sessions:', err);
                var list = document.getElementById('chat-session-list');
                if (list) {
                    list.innerHTML = '<div style="padding:20px;text-align:center;color:#e74c3c;font-size:0.8em;">' +
                        '⚠️ Failed to load sessions<br>' +
                        '<small>' + (err.message || 'Unknown error') + '</small></div>';
                }
            });
    }

    function renderSessionList(sessions) {
        var list = document.getElementById('chat-session-list');
        if (!list) return;

        if (!sessions || sessions.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#3a4560;font-size:0.8em;">' +
                'No conversations yet.<br>Start chatting with Pinky!</div>';
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
            .then(function(r) { return safeJsonResponse(r, 'Chat/Session'); })
            .then(function(session) {
                renderMessages(session.messages);
                updateHeader(session);
            })
            .catch(function(err) {
                console.error('[PinkyChat] Failed to load session:', err);
                var msgs = document.getElementById('chat-messages');
                if (msgs) {
                    msgs.innerHTML = '<div class="chat-empty-state" style="color:#e74c3c;">⚠️ Failed to load conversation: ' + (err.message || 'Unknown error') + '</div>';
                }
            });
    }

    function newSession() {
        currentSessionId = null;
        var msgs = document.getElementById('chat-messages');
        if (msgs) {
            msgs.innerHTML = getEmptyState();
        }
        updateHeader(null);
        
        // Remove active from all sessions
        document.querySelectorAll('.chat-session-item').forEach(function(el) {
            el.classList.remove('active');
        });

        // Focus input
        var input = document.getElementById('chat-input');
        if (input) input.focus();
    }

    function deleteSession(sessionId) {
        if (!confirm('Delete this conversation?')) return;
        
        fetch('/api/chat/session/' + sessionId, { method: 'DELETE' })
            .then(function(r) { return safeJsonResponse(r, 'Chat/Delete'); })
            .then(function() {
                if (currentSessionId === sessionId) {
                    newSession();
                }
                loadSessions();
            })
            .catch(function(err) {
                console.error('[PinkyChat] Delete failed:', err);
                alert('Failed to delete conversation: ' + (err.message || 'Unknown error'));
            });
    }

    // ─── Search ───
    function searchSessions(query) {
        fetch('/api/chat/search?q=' + encodeURIComponent(query))
            .then(function(r) { return safeJsonResponse(r, 'Chat/Search'); })
            .then(function(results) {
                renderSearchResults(results);
            })
            .catch(function(err) {
                console.error('[PinkyChat] Search failed:', err);
                var list = document.getElementById('chat-session-list');
                if (list) {
                    list.innerHTML = '<div style="padding:20px;text-align:center;color:#e74c3c;font-size:0.8em;">' +
                        '⚠️ Search failed: ' + (err.message || 'Unknown error') + '</div>';
                }
            });
    }

    function renderSearchResults(results) {
        var list = document.getElementById('chat-session-list');
        if (!list) return;

        if (!results || results.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#3a4560;font-size:0.8em;">No matches found</div>';
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
                sessionId: currentSessionId,
                message: message
            })
        })
        .then(function(r) {
            // Check if response is OK
            if (!r.ok) {
                // If response is HTML (error page), provide better error message
                var contentType = r.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    return Promise.reject(new Error('Server returned HTML error (HTTP ' + r.status + '). Chat API may be down.'));
                }
                // For other errors, include status code
                return Promise.reject(new Error('HTTP ' + r.status + ': ' + r.statusText));
            }
            
            // Check if response is JSON before parsing
            var contentType = r.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return Promise.reject(new Error('Server returned non-JSON response (Content-Type: ' + contentType + '). Expected JSON.'));
            }
            
            return r.json();
        })
        .then(function(data) {
            hideTyping();
            setWaiting(false);

            if (data.error) {
                appendMessage('assistant', '⚠️ Error: ' + data.error);
                return;
            }

            // Update session ID if new
            if (!currentSessionId && data.sessionId) {
                currentSessionId = data.sessionId;
            }

            // Add assistant response
            appendMessage('assistant', data.response);

            // Update header
            updateHeader({
                title: message.length > 50 ? message.substring(0, 50) + '...' : message,
                messages: [],
                tokenCount: data.tokens ? (data.tokens.input_tokens + data.tokens.output_tokens) : 0
            });

            // Refresh session list
            loadSessions();
        })
        .catch(function(err) {
            hideTyping();
            setWaiting(false);
            // Provide clear error message (avoid exposing raw JSON parse errors)
            var errorMsg = err.message || 'Connection error';
            if (errorMsg.includes('Unexpected token')) {
                errorMsg = 'Invalid response from server. Chat API may be misconfigured.';
            }
            appendMessage('assistant', '⚠️ ' + errorMsg);
        });
    }

    // ─── Rendering ───
    function renderMessages(messages) {
        var container = document.getElementById('chat-messages');
        if (!container) return;

        if (!messages || messages.length === 0) {
            container.innerHTML = getEmptyState();
            return;
        }

        container.innerHTML = '';
        messages.forEach(function(msg) {
            appendMessage(msg.role, msg.content, msg.timestamp, false);
        });
        scrollToBottom();
    }

    function appendMessage(role, content, timestamp, scroll) {
        var container = document.getElementById('chat-messages');
        if (!container) return;

        var time = timestamp ? new Date(timestamp) : new Date();
        var timeStr = formatTime(time);
        var avatar = role === 'user' ? '👤' : '🐭';
        var name = role === 'user' ? 'LORD_CRACKER' : 'PINKY';
        var rendered = renderMarkdown(content);

        var div = document.createElement('div');
        div.className = 'chat-msg ' + role;
        div.innerHTML = '<div class="chat-msg-avatar">' + avatar + '</div>' +
            '<div class="chat-msg-body">' +
            '<div class="chat-msg-name">' + name + '</div>' +
            '<div class="chat-msg-content">' + rendered + '</div>' +
            '<div class="chat-msg-time">' + timeStr + '</div>' +
            '</div>';

        container.appendChild(div);

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
        div.innerHTML = '<div class="chat-msg-avatar" style="background:linear-gradient(135deg,#ff44aa22,#ff668822);border:1px solid #ff44aa44;">🐭</div>' +
            '<div class="chat-msg-content" style="background:linear-gradient(135deg,#1a1028,#140e22);border:1px solid rgba(255,68,170,0.12);border-radius:12px;border-top-left-radius:4px;">' +
            '<div class="typing-dots"><span></span><span></span><span></span></div>' +
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
            title.textContent = session ? (session.title || 'Chat') : 'New Conversation';
        }
        if (stats && session) {
            var msgCount = session.messages ? session.messages.length : session.messageCount || 0;
            var tokens = session.tokenCount || 0;
            stats.textContent = msgCount + ' msgs · ' + tokens + ' tokens';
        } else if (stats) {
            stats.textContent = '';
        }
    }

    function getEmptyState() {
        return '<div class="chat-empty-state">' +
            '<div class="pinky-ascii">' +
            '    ╭──────────────────╮\n' +
            '    │   🐭  PINKY AI   │\n' +
            '    │    Dashboard     │\n' +
            '    │     Chat v1      │\n' +
            '    ╰──────────────────╯\n' +
            '</div>' +
            '<h3>Chat with Pinky</h3>' +
            '<p>Ask about tasks, check status, give commands, or just say hi. Your conversations are saved and searchable.</p>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px;">' +
            '<button onclick="PinkyChat.quickSend(\'What are you working on right now?\')" style="padding:8px 14px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.2);border-radius:8px;color:#00d4ff;cursor:pointer;font-size:0.8em;font-family:monospace;">📋 Current tasks</button>' +
            '<button onclick="PinkyChat.quickSend(\'Show me your heartbeat status and what you accomplished today\')" style="padding:8px 14px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.2);border-radius:8px;color:#00d4ff;cursor:pointer;font-size:0.8em;font-family:monospace;">💓 Status report</button>' +
            '<button onclick="PinkyChat.quickSend(\'What needs to be done next? Check the task queue.\')" style="padding:8px 14px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.2);border-radius:8px;color:#00d4ff;cursor:pointer;font-size:0.8em;font-family:monospace;">🎯 Next task</button>' +
            '</div>' +
            '</div>';
    }

    // ─── Markdown Rendering ───
    function renderMarkdown(text) {
        if (!text) return '';
        var html = escapeHtml(text);
        
        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(m, lang, code) {
            return '<pre><code class="lang-' + lang + '">' + code.trim() + '</code></pre>';
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#00d4ff;">$1</a>');
        
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
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (msgDay.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }
        
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    function scrollToBottom() {
        var container = document.getElementById('chat-messages');
        if (container) {
            setTimeout(function() {
                container.scrollTop = container.scrollHeight;
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
        }
        if (textarea) {
            textarea.disabled = waiting;
        }
    }

    function quickSend(text) {
        var textarea = document.getElementById('chat-input');
        if (textarea) {
            textarea.value = text;
            sendMessage();
        }
    }

    // ─── Public API ───
    window.PinkyChat = {
        init: init,
        openSession: openSession,
        deleteSession: deleteSession,
        newSession: newSession,
        quickSend: quickSend
    };

    // Auto-init when chat view becomes visible
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.target.id === 'chat-view' && m.target.classList.contains('active')) {
                init();
                observer.disconnect();
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
