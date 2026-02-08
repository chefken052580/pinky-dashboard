/**
 * TOKEN WARNING SYSTEM — Dashboard Module v2
 * Shows warning badge + inline "Token Approval" button on pending tasks
 * that have exceeded token limits. One click to approve override.
 * 
 * INSTALL:
 * 1. Add <script src="token-warning-ui.js"></script> to pinky-dashboard/index.html
 *    (AFTER tasks-bot-enhanced.js)
 * 2. Add <link rel="stylesheet" href="token-warning-ui.css"> to <head>
 */

(function() {
    'use strict';

    var warnings = {};
    var pollInterval = null;

    // ─── Init ───
    function init() {
        console.log('[TokenWarning UI] Initializing...');
        fetchWarnings();
        pollInterval = setInterval(fetchWarnings, 30000);
        hookTaskRender();
        console.log('[TokenWarning UI] Ready');
    }

    // ─── Fetch warnings from API ───
    function fetchWarnings() {
        fetch('/api/tasks/warnings')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success && data.warnings) {
                    warnings = {};
                    data.warnings.forEach(function(w) {
                        warnings[w.taskName] = w;
                    });
                    applyWarningBadges();
                }
            })
            .catch(function(err) {
                console.log('[TokenWarning UI] Fetch failed:', err.message);
            });
    }

    // ─── Hook into existing task rendering ───
    function hookTaskRender() {
        var observer = new MutationObserver(function(mutations) {
            var shouldApply = false;
            mutations.forEach(function(m) {
                if (m.addedNodes.length > 0 || m.type === 'childList') {
                    shouldApply = true;
                }
            });
            if (shouldApply) {
                setTimeout(applyWarningBadges, 100);
            }
        });

        var containers = [
            'tasksbot-container',
            'tasks-bot-container',
            'task-queue-container'
        ];

        function tryObserve() {
            for (var i = 0; i < containers.length; i++) {
                var el = document.getElementById(containers[i]);
                if (el) {
                    observer.observe(el, { childList: true, subtree: true });
                    console.log('[TokenWarning UI] Observing: #' + containers[i]);
                    return true;
                }
            }
            return false;
        }

        if (!tryObserve()) {
            setTimeout(function() {
                if (!tryObserve()) {
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            }, 2000);
        }
    }

    // ─── Apply warning badges + approval buttons to pending tasks ───
    function applyWarningBadges() {
        if (Object.keys(warnings).length === 0) return;

        var taskItems = document.querySelectorAll('.task-item');

        taskItems.forEach(function(item) {
            // Skip if already processed
            if (item.querySelector('.tw-action-row')) return;

            var nameEl = item.querySelector('.task-name');
            if (!nameEl) return;
            var taskName = nameEl.textContent.trim();

            var warning = warnings[taskName];
            if (!warning) return;

            // Only add to pending tasks
            var statusBadge = item.querySelector('.status-badge');
            if (!statusBadge) return;
            var statusText = statusBadge.textContent.toLowerCase();
            if (statusText.indexOf('pending') === -1 && statusText.indexOf('⏳') === -1) return;

            // Build the action row
            var row = document.createElement('div');
            row.className = 'tw-action-row';

            if (warning.overrideApproved) {
                // Already approved — show green confirmation
                row.innerHTML = ''
                    + '<div class="tw-approved-badge">'
                    + '  <span class="tw-approved-icon">🔓</span>'
                    + '  <span class="tw-approved-text">Override approved — Pinky will retry next heartbeat</span>'
                    + '</div>';
                item.classList.remove('token-warned-task');
                item.classList.add('token-override-task');
            } else {
                // Not approved — show warning + action buttons
                row.innerHTML = ''
                    + '<div class="tw-warning-info">'
                    + '  <span class="tw-warning-icon">⚠️</span>'
                    + '  <span class="tw-warning-text">Token limit exceeded'
                    + (warning.backoffCount > 1 ? ' <span class="tw-count">(' + warning.backoffCount + 'x)</span>' : '')
                    + '</span>'
                    + '</div>'
                    + '<div class="tw-buttons">'
                    + '  <button class="tw-btn tw-btn-approve" data-task="' + escapeAttr(taskName) + '">🔓 Token Approval</button>'
                    + '  <button class="tw-btn tw-btn-split" data-task="' + escapeAttr(taskName) + '">✂️ Split</button>'
                    + '</div>';

                item.classList.add('token-warned-task');

                // Bind button clicks
                setTimeout(function() {
                    var approveBtn = row.querySelector('.tw-btn-approve');
                    var splitBtn = row.querySelector('.tw-btn-split');

                    if (approveBtn) {
                        approveBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            var name = this.getAttribute('data-task');
                            doOverride(name, this, row, item);
                        });
                    }

                    if (splitBtn) {
                        splitBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            var name = this.getAttribute('data-task');
                            if (window.TasksBot && typeof window.TasksBot.openCreateForm === 'function') {
                                window.TasksBot.openCreateForm(name + ' (Part 1)');
                            } else {
                                alert('Split task: Create 2-3 smaller subtasks from:\n\n"' + name + '"\n\nThen mark the original as completed.');
                            }
                        });
                    }
                }, 0);
            }

            // Insert after the task header
            var header = item.querySelector('.task-header');
            if (header && header.nextSibling) {
                header.parentNode.insertBefore(row, header.nextSibling);
            } else if (header) {
                header.parentNode.appendChild(row);
            } else {
                item.appendChild(row);
            }
        });
    }

    // ─── Send override to API (two-click confirm) ───
    function doOverride(taskName, btn, row, taskItem) {
        // First click = show confirmation state
        if (!btn.classList.contains('tw-confirming')) {
            btn.classList.add('tw-confirming');
            btn.innerHTML = '⚡ Confirm? <span class="tw-cost-note">May increase API cost</span>';

            // Auto-revert after 4 seconds
            btn._revertTimer = setTimeout(function() {
                btn.classList.remove('tw-confirming');
                btn.innerHTML = '🔓 Token Approval';
            }, 4000);
            return;
        }

        // Second click = confirmed
        clearTimeout(btn._revertTimer);
        btn.disabled = true;
        btn.innerHTML = '⏳ Approving...';

        fetch('/api/tasks/warnings/override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskName: taskName })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                if (warnings[taskName]) {
                    warnings[taskName].overrideApproved = true;
                }

                // Swap to approved state
                row.innerHTML = ''
                    + '<div class="tw-approved-badge tw-just-approved">'
                    + '  <span class="tw-approved-icon">✅</span>'
                    + '  <span class="tw-approved-text">Override approved — Pinky will retry next heartbeat</span>'
                    + '</div>';

                taskItem.classList.remove('token-warned-task');
                taskItem.classList.add('token-override-task');

                // Update the task notes to signal Pinky
                fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update',
                        taskName: taskName,
                        notes: '🔓 TOKEN OVERRIDE APPROVED by Lord_Cracker at '
                            + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
                            + ' EST. Complete this task in full — no token ceiling.'
                    })
                }).catch(function() {});

                showToast('Override approved — Pinky will pick it up next heartbeat');
            } else {
                btn.disabled = false;
                btn.classList.remove('tw-confirming');
                btn.innerHTML = '🔓 Token Approval';
                showToast('Override failed: ' + (data.error || 'Unknown error'), true);
            }
        })
        .catch(function(err) {
            btn.disabled = false;
            btn.classList.remove('tw-confirming');
            btn.innerHTML = '🔓 Token Approval';
            showToast('Network error: ' + err.message, true);
        });
    }

    // ─── Toast notification ───
    function showToast(message, isError) {
        var existing = document.querySelector('.tw-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'tw-toast' + (isError ? ' tw-toast-error' : '');
        toast.innerHTML = '<span class="tw-toast-icon">' + (isError ? '❌' : '🐭') + '</span>'
            + '<span class="tw-toast-text">' + message + '</span>';

        document.body.appendChild(toast);
        requestAnimationFrame(function() { toast.classList.add('tw-toast-visible'); });

        setTimeout(function() {
            toast.classList.remove('tw-toast-visible');
            setTimeout(function() { toast.remove(); }, 300);
        }, 4000);
    }

    // ─── Helpers ───
    function escapeAttr(str) {
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
    }

    // ─── Public API ───
    window.TokenWarningUI = {
        refresh: fetchWarnings,
        getWarnings: function() { return warnings; },
        recordBackoff: function(taskName, notes) {
            return fetch('/api/tasks/warnings/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskName: taskName, notes: notes || '' })
            }).then(function(r) { return r.json(); })
              .then(function() { fetchWarnings(); });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
