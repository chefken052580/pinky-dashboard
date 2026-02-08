// SocialBot UI - Company Management & Post Creation
// Fetches from /api/companies and /api/posts

const SOCIALBOT_API = '';

let socialBotState = {
    companies: [],
    posts: [],
    selectedCompany: null,
    selectedTab: 'companies',
    loading: false
};

// Initialize SocialBot UI
window.initSocialBotUI = function() {
    console.log('[SocialBot] Initializing UI...');
    loadCompanies();
    switchSocialTab('companies');
};

// Fetch companies from API
function loadCompanies() {
    console.log('[SocialBot] Fetching companies...');
    socialBotState.loading = true;
    
    fetch(SOCIALBOT_API + '/api/companies')
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {
            console.log('[SocialBot] Companies loaded:', data);
            socialBotState.companies = data.companies || [];
            renderCompanySelector();
            renderCompaniesTab();
            socialBotState.loading = false;
        })
        .catch(function(error) {
            console.error('[SocialBot] Failed to load companies:', error);
            showSocialError('Failed to load companies: ' + error.message);
            socialBotState.loading = false;
        });
}

// Fetch posts from API
function loadPosts() {
    console.log('[SocialBot] Fetching posts...');
    socialBotState.loading = true;
    
    fetch(SOCIALBOT_API + '/api/posts')
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(function(data) {
            console.log('[SocialBot] Posts loaded:', data);
            socialBotState.posts = data.posts || [];
            renderHistoryTab();
            socialBotState.loading = false;
        })
        .catch(function(error) {
            console.error('[SocialBot] Failed to load posts:', error);
            showSocialError('Failed to load posts: ' + error.message);
            socialBotState.loading = false;
        });
}

// Switch between tabs
window.switchSocialTab = function(tabName) {
    console.log('[SocialBot] Switching to tab:', tabName);
    socialBotState.selectedTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.social-tab-button').forEach(function(btn) {
        btn.classList.remove('active');
    });
    var activeBtn = document.querySelector('[data-social-tab="' + tabName + '"]');
    if (activeBtn) activeBtn.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.social-tab-content').forEach(function(content) {
        content.style.display = 'none';
    });
    var activeContent = document.getElementById('social-tab-' + tabName);
    if (activeContent) activeContent.style.display = 'block';
    
    // Load data for specific tabs
    if (tabName === 'history') {
        loadPosts();
    } else if (tabName === 'scheduled') {
        loadPosts(); // Same endpoint, different filter
    } else if (tabName === 'create') {
        renderCreatePostTab();
    } else if (tabName === 'companies') {
        renderCompaniesTab();
    } else if (tabName === 'wordpress') {
        // Initialize WordPress Page Maker in the social tab
        var wpContainer = document.getElementById('wordpress-page-maker-social');
        if (wpContainer) {
            if (!wpContainer.hasAttribute('data-wp-initialized')) {
                // Create a simplified WordPress interface for the social tab
                wpContainer.innerHTML = `
                    <div class="wp-social-tab-content" style="padding:20px;background:rgba(255,255,255,0.05);border-radius:8px;">
                        <p style="color:#aaa;margin-bottom:15px;">
                            🌐 <strong>WordPress Page Maker</strong> is integrated with SocialBot for creating SEO-optimized content.
                        </p>
                        <div style="display:flex;gap:15px;flex-wrap:wrap;margin-top:20px;">
                            <button class="btn-primary" onclick="showView('wordpress-view')" style="padding:10px 20px;">
                                📝 Open Full WordPress Editor
                            </button>
                            <button class="btn-secondary" onclick="alert('Quick post feature coming soon!')" style="padding:10px 20px;">
                                ⚡ Quick Post from Social
                            </button>
                        </div>
                        <div style="margin-top:25px;padding:15px;background:rgba(0,0,0,0.2);border-radius:6px;border-left:3px solid #4CAF50;">
                            <strong style="color:#4CAF50;">💡 Integration Features:</strong>
                            <ul style="margin-top:10px;color:#ccc;line-height:1.8;">
                                <li>✅ Create WordPress pages directly from social content</li>
                                <li>✅ Auto-generate SEO metadata using Research Bot</li>
                                <li>✅ Cross-post to social media platforms</li>
                                <li>✅ Track engagement across WordPress and social</li>
                            </ul>
                        </div>
                    </div>
                `;
                wpContainer.setAttribute('data-wp-initialized', 'true');
            }
        }
    }
};

// Select a company
window.selectSocialCompany = function(companyId) {
    console.log('[SocialBot] Selected company:', companyId);
    socialBotState.selectedCompany = companyId;
    
    // Highlight selected button
    document.querySelectorAll('.company-selector-btn').forEach(function(btn) {
        btn.classList.remove('selected');
    });
    var selectedBtn = document.querySelector('[data-company-id="' + companyId + '"]');
    if (selectedBtn) selectedBtn.classList.add('selected');
};

// Render company selector buttons
function renderCompanySelector() {
    var container = document.getElementById('social-company-selector');
    if (!container) return;
    
    if (socialBotState.companies.length === 0) {
        container.innerHTML = '<p style="color:#999;">No companies available</p>';
        return;
    }
    
    var html = '';
    socialBotState.companies.forEach(function(company) {
        html += '<button class="company-selector-btn" data-company-id="' + company.id + '" onclick="selectSocialCompany(\'' + company.id + '\')">';
        html += '<span class="company-icon">' + company.icon + '</span>';
        html += '<span class="company-name">' + company.name + '</span>';
        html += '</button>';
    });
    
    container.innerHTML = html;
}

// Render companies tab
function renderCompaniesTab() {
    var container = document.getElementById('social-tab-companies');
    if (!container) return;
    
    if (socialBotState.companies.length === 0) {
        container.innerHTML = '<p style="color:#999;padding:20px;">No companies available</p>';
        return;
    }
    
    var html = '<div class="company-grid">';
    socialBotState.companies.forEach(function(company) {
        var platformCount = (company.platforms || []).length;
        html += '<div class="company-card">';
        html += '<div class="card-icon">' + company.icon + '</div>';
        html += '<div class="card-name">' + company.name + '</div>';
        html += '<div class="card-desc">' + company.description + '</div>';
        html += '<div class="card-platforms">📱 ' + platformCount + ' platform' + (platformCount !== 1 ? 's' : '') + '</div>';
        html += '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Render create post tab
function renderCreatePostTab() {
    var container = document.getElementById('social-tab-create');
    if (!container) return;
    
    var html = '<div class="create-post-form">';
    html += '<div class="form-group">';
    html += '<label>Select Company</label>';
    html += '<select id="create-post-company" class="form-select">';
    html += '<option value="">-- Choose a company --</option>';
    
    socialBotState.companies.forEach(function(company) {
        html += '<option value="' + company.id + '">' + company.name + '</option>';
    });
    
    html += '</select>';
    html += '</div>';
    
    html += '<div class="form-group">';
    html += '<label>Select Platform</label>';
    html += '<select id="create-post-platform" class="form-select">';
    html += '<option value="">-- Choose a platform --</option>';
    html += '<option value="facebook">Facebook</option>';
    html += '<option value="instagram">Instagram</option>';
    html += '<option value="x">X (Twitter)</option>';
    html += '<option value="linkedin">LinkedIn</option>';
    html += '</select>';
    html += '</div>';
    
    html += '<div class="form-group">';
    html += '<label>Post Content</label>';
    html += '<textarea id="create-post-content" class="form-textarea" placeholder="Write your post here..." rows="6"></textarea>';
    html += '</div>';
    
    html += '<div class="form-group">';
    html += '<label>Schedule Time</label>';
    html += '<input type="datetime-local" id="create-post-schedule" class="form-input">';
    html += '</div>';
    
    html += '<div class="form-actions">';
    html += '<button class="btn-primary" onclick="submitSocialPost()">Post Now</button>';
    html += '<button class="btn-secondary" onclick="submitSocialPost(true)">Schedule Post</button>';
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
}

// Render history tab
function renderHistoryTab() {
    var container = document.getElementById('social-tab-history');
    if (!container) return;
    
    if (socialBotState.posts.length === 0) {
        container.innerHTML = '<p style="color:#999;padding:20px;">No posts yet</p>';
        return;
    }
    
    var html = '<div class="posts-list">';
    socialBotState.posts.forEach(function(post) {
        html += '<div class="post-item">';
        html += '<div class="post-header">';
        html += '<span class="post-company">' + (post.company || 'Unknown') + '</span>';
        html += '<span class="post-platform">' + (post.platform || 'N/A') + '</span>';
        html += '<span class="post-date">' + formatDate(post.createdAt) + '</span>';
        html += '</div>';
        html += '<div class="post-content">' + post.content + '</div>';
        html += '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Render scheduled posts tab
function renderScheduledTab() {
    var container = document.getElementById('social-tab-scheduled');
    if (!container) return;
    
    var scheduled = (socialBotState.posts || []).filter(function(p) { return p.scheduled; });
    
    if (scheduled.length === 0) {
        container.innerHTML = '<p style="color:#999;padding:20px;">No scheduled posts</p>';
        return;
    }
    
    var html = '<div class="posts-list">';
    scheduled.forEach(function(post) {
        html += '<div class="post-item scheduled">';
        html += '<div class="post-header">';
        html += '<span class="post-company">' + post.company + '</span>';
        html += '<span class="post-platform">' + post.platform + '</span>';
        html += '<span class="post-date">📅 ' + formatDate(post.scheduledFor) + '</span>';
        html += '</div>';
        html += '<div class="post-content">' + post.content + '</div>';
        html += '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Submit a post
window.submitSocialPost = function(isScheduled) {
    var company = document.getElementById('create-post-company').value;
    var platform = document.getElementById('create-post-platform').value;
    var content = document.getElementById('create-post-content').value;
    var schedule = document.getElementById('create-post-schedule').value;
    
    if (!company || !platform || !content.trim()) {
        alert('Please fill in all required fields');
        return;
    }
    
    var payload = {
        company: company,
        platform: platform,
        content: content,
        scheduled: isScheduled || false,
        scheduledFor: schedule || null
    };
    
    console.log('[SocialBot] Submitting post:', payload);
    
    fetch(SOCIALBOT_API + '/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
    })
    .then(function(data) {
        console.log('[SocialBot] Post submitted:', data);
        alert('Post ' + (isScheduled ? 'scheduled' : 'posted') + ' successfully!');
        document.getElementById('create-post-content').value = '';
        document.getElementById('create-post-company').value = '';
        document.getElementById('create-post-platform').value = '';
        document.getElementById('create-post-schedule').value = '';
        loadPosts();
    })
    .catch(function(error) {
        console.error('[SocialBot] Failed to submit post:', error);
        showSocialError('Failed to submit post: ' + error.message);
    });
};

// Helper functions
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    var date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function showSocialError(message) {
    var notif = document.getElementById('notifications');
    if (notif) {
        var div = document.createElement('div');
        div.className = 'notification error';
        div.textContent = message;
        notif.appendChild(div);
        setTimeout(function() { div.remove(); }, 5000);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSocialBotUI);
} else {
    initSocialBotUI();
}
