// SocialBot UI - Company Management & Post Creation
// Fetches from /api/companies and /api/posts

const SOCIALBOT_API = '';

let socialBotState = {
    companies: [],
    posts: [],
    selectedCompany: null,
    selectedTab: 'companies',
    loading: false,
    editingCompany: null
};

const AVAILABLE_PLATFORMS = [
    { id: 'twitter', name: 'Twitter / X', icon: '\ud835\udd4f', color: '#000' },
    { id: 'instagram', name: 'Instagram', icon: '\ud83d\udcf8', color: '#E4405F' },
    { id: 'facebook', name: 'Facebook', icon: '\ud83d\udcd8', color: '#1877F2' },
    { id: 'linkedin', name: 'LinkedIn', icon: '\ud83d\udcbc', color: '#0A66C2' },
    { id: 'tiktok', name: 'TikTok', icon: '\ud83c\udfb5', color: '#000' },
    { id: 'bluesky', name: 'Bluesky', icon: '\ud83e\udd8b', color: '#0085FF' },
    { id: 'mastodon', name: 'Mastodon', icon: '\ud83d\udc18', color: '#6364FF' },
    { id: 'discord', name: 'Discord', icon: '\ud83d\udcac', color: '#5865F2' },
    { id: 'telegram', name: 'Telegram', icon: '\u2708\ufe0f', color: '#26A5E4' },
    { id: 'wordpress', name: 'WordPress', icon: '\ud83d\udcdd', color: '#21759B' }
];

window.initSocialBotUI = function() {
    console.log('[SocialBot] Initializing UI...');
    loadCompanies();
    injectSocialStyles();
};

function loadCompanies() {
    socialBotState.loading = true;
    fetch(SOCIALBOT_API + '/api/companies')
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(data) {
            socialBotState.companies = data.companies || [];
            renderCompanySelector();
            renderCompaniesTab();
            socialBotState.loading = false;
        })
        .catch(function(e) {
            console.error('[SocialBot] Load failed:', e);
            socialBotState.loading = false;
        });
}

function loadPosts() {
    fetch(SOCIALBOT_API + '/api/posts')
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(data) { socialBotState.posts = data.posts || []; renderHistoryTab(); })
        .catch(function(e) { console.error('[SocialBot] Posts failed:', e); });
}

function apiCreateCompany(d) {
    return fetch(SOCIALBOT_API + '/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
function apiUpdateCompany(id, d) {
    return fetch(SOCIALBOT_API + '/api/companies/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
function apiDeleteCompany(id) {
    return fetch(SOCIALBOT_API + '/api/companies/' + id, { method: 'DELETE' })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}

window.switchSocialTab = function(tabName) {
    socialBotState.selectedTab = tabName;
    document.querySelectorAll('.social-tab-button').forEach(function(btn) { btn.classList.remove('active'); });
    var ab = document.querySelector('[data-social-tab="' + tabName + '"]');
    if (ab) ab.classList.add('active');
    document.querySelectorAll('.social-tab-content').forEach(function(c) { c.style.display = 'none'; });
    var ac = document.getElementById('social-tab-' + tabName);
    if (ac) ac.style.display = 'block';
    if (tabName === 'companies') renderCompaniesTab();
    else if (tabName === 'create') renderCreatePostTab();
    else if (tabName === 'history' || tabName === 'scheduled') loadPosts();
    else if (tabName === 'wordpress') renderWordPressTab();
};

window.selectSocialCompany = function(companyId) {
    socialBotState.selectedCompany = companyId;
    document.querySelectorAll('.company-selector-btn').forEach(function(btn) { btn.classList.remove('selected'); });
    var sb = document.querySelector('[data-company-id="' + companyId + '"]');
    if (sb) sb.classList.add('selected');
};

function renderCompanySelector() {
    var c = document.getElementById('social-company-selector');
    if (!c) return;
    if (socialBotState.companies.length === 0) { c.innerHTML = '<p style="color:#888;">No companies yet</p>'; return; }
    var h = '';
    socialBotState.companies.forEach(function(co) {
        var sel = socialBotState.selectedCompany === co.id ? ' selected' : '';
        h += '<button class="company-selector-btn' + sel + '" data-company-id="' + co.id + '" onclick="selectSocialCompany(\'' + co.id + '\')">';
        h += '<span class="company-name">' + co.name + '</span>';
        h += '<span style="font-size:11px;color:#888;">' + (co.platforms||[]).length + ' platforms</span>';
        h += '</button>';
    });
    c.innerHTML = h;
}

function renderCompaniesTab() {
    var c = document.getElementById('social-tab-companies');
    if (!c) return;
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">';
    h += '<h3 style="margin:0;color:#fff;">Your Companies</h3>';
    h += '<button class="btn-add-company" onclick="showAddCompanyModal()">+ Add Company</button></div>';
    if (socialBotState.companies.length === 0) {
        h += '<div class="empty-state"><div style="font-size:48px;margin-bottom:15px;">🏢</div>';
        h += '<h3 style="color:#ccc;">No Companies Yet</h3><p>Add your first company to start managing social media.</p>';
        h += '<button class="btn-add-company" onclick="showAddCompanyModal()" style="margin-top:15px;padding:15px 30px;font-size:16px;">+ Create Your First Company</button></div>';
    } else {
        h += '<div class="companies-grid">';
        socialBotState.companies.forEach(function(co) {
            var platforms = co.platforms || [];
            var icons = platforms.map(function(p) { var pl = AVAILABLE_PLATFORMS.find(function(a){return a.id===p;}); return pl ? pl.icon : ''; }).join(' ');
            var pc = (co.branding && co.branding.colors && co.branding.colors.primary) || '#667eea';
            h += '<div class="company-card" style="border-top:3px solid '+pc+';">';
            h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
            h += '<div style="font-size:18px;font-weight:bold;color:#fff;">'+co.name+'</div>';
            h += '<div style="display:flex;gap:5px;">';
            h += '<button class="btn-icon" onclick="showEditCompanyModal(\''+co.id+'\')" title="Edit">✏️</button>';
            h += '<button class="btn-icon" onclick="confirmDeleteCompany(\''+co.id+'\',\''+co.name.replace(/'/g,"\\'")+'\')" title="Delete" style="color:#f44336;">🗑️</button>';
            h += '</div></div>';
            h += '<div style="font-size:20px;letter-spacing:4px;margin:10px 0;">'+(icons||'<span style="color:#666;">No platforms</span>')+'</div>';
            h += '<div style="font-size:12px;color:#888;margin:8px 0;">Created: '+formatDate(co.createdAt)+'</div>';
            h += '<div style="display:flex;gap:8px;margin-top:15px;">';
            h += '<button class="btn-small-primary" onclick="selectSocialCompany(\''+co.id+'\');switchSocialTab(\'create\');">Create Post</button>';
            h += '<button class="btn-small-secondary" onclick="showEditCompanyModal(\''+co.id+'\')">Settings</button>';
            h += '</div></div>';
        });
        h += '</div>';
    }
    c.innerHTML = h;
}

window.showAddCompanyModal = function() {
    socialBotState.editingCompany = null;
    showCompanyModal('Add New Company', { name:'', platforms:[], apiKeys:{}, branding:{colors:{primary:'#667eea',secondary:'#764ba2'}} });
};
window.showEditCompanyModal = function(id) {
    var co = socialBotState.companies.find(function(c){return c.id===id;});
    if (!co) return;
    socialBotState.editingCompany = id;
    showCompanyModal('Edit: ' + co.name, co);
};

function showCompanyModal(title, co) {
    var ex = document.getElementById('company-modal-overlay');
    if (ex) ex.remove();
    var pcb = AVAILABLE_PLATFORMS.map(function(p) {
        var ch = (co.platforms||[]).includes(p.id) ? ' checked' : '';
        return '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,0.05);border-radius:6px;cursor:pointer;"><input type="checkbox" value="'+p.id+'"'+ch+'><span style="color:#ccc;font-size:13px;">'+p.icon+' '+p.name+'</span></label>';
    }).join('');
    var akf = '';
    if (co.platforms && co.platforms.length > 0) {
        akf = '<div id="modal-api-keys-section"><h4 style="color:#fff;margin:15px 0 10px;">API Keys</h4>';
        co.platforms.forEach(function(pId) {
            var pl = AVAILABLE_PLATFORMS.find(function(a){return a.id===pId;});
            var keys = (co.apiKeys && co.apiKeys[pId]) || {};
            akf += '<div style="margin:10px 0;padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;">';
            akf += '<label style="color:#aaa;font-size:12px;font-weight:bold;display:block;margin-bottom:6px;">'+(pl?pl.icon+' '+pl.name:pId)+'</label>';
            akf += '<input type="text" class="form-input api-key-input" data-platform="'+pId+'" data-field="key" placeholder="API Key / Token" value="'+(keys.key||keys.token||'')+'" style="margin-top:4px;">';
            if (pId==='twitter') akf += '<input type="text" class="form-input api-key-input" data-platform="twitter" data-field="secret" placeholder="API Secret" value="'+(keys.secret||'')+'" style="margin-top:4px;">';
            if (pId==='mastodon') akf += '<input type="text" class="form-input api-key-input" data-platform="mastodon" data-field="instance" placeholder="Instance URL" value="'+(keys.instance||'')+'" style="margin-top:4px;">';
            if (pId==='telegram') akf += '<input type="text" class="form-input api-key-input" data-platform="telegram" data-field="chatId" placeholder="Chat ID" value="'+(keys.chatId||'')+'" style="margin-top:4px;">';
            if (pId==='discord') akf += '<input type="text" class="form-input api-key-input" data-platform="discord" data-field="webhook" placeholder="Webhook URL" value="'+(keys.webhook||'')+'" style="margin-top:4px;">';
            if (pId==='bluesky') akf += '<input type="text" class="form-input api-key-input" data-platform="bluesky" data-field="handle" placeholder="Handle" value="'+(keys.handle||'')+'" style="margin-top:4px;">';
            if (pId==='wordpress') {
                akf += '<input type="text" class="form-input api-key-input" data-platform="wordpress" data-field="url" placeholder="Site URL" value="'+(keys.url||'')+'" style="margin-top:4px;">';
                akf += '<input type="text" class="form-input api-key-input" data-platform="wordpress" data-field="username" placeholder="Username" value="'+(keys.username||'')+'" style="margin-top:4px;">';
                akf += '<input type="password" class="form-input api-key-input" data-platform="wordpress" data-field="password" placeholder="App Password" value="'+(keys.password||'')+'" style="margin-top:4px;">';
            }
            akf += '</div>';
        });
        akf += '</div>';
    }
    var pc = (co.branding&&co.branding.colors&&co.branding.colors.primary)||'#667eea';
    var sc = (co.branding&&co.branding.colors&&co.branding.colors.secondary)||'#764ba2';
    var ov = document.createElement('div');
    ov.id = 'company-modal-overlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = '<div style="background:#1a2847;border-radius:16px;width:90%;max-width:600px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 25px;border-bottom:1px solid rgba(255,255,255,0.1);"><h3 style="margin:0;color:#fff;">'+title+'</h3><button onclick="closeSocialModal()" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;">X</button></div>' +
        '<div style="padding:25px;">' +
            '<div style="margin-bottom:18px;"><label style="display:block;color:#aaa;margin-bottom:6px;font-size:13px;font-weight:bold;">Company Name *</label><input type="text" id="modal-company-name" class="form-input" placeholder="e.g. Acme Corp" value="'+(co.name||'')+'"></div>' +
            '<div style="margin-bottom:18px;"><label style="display:block;color:#aaa;margin-bottom:6px;font-size:13px;font-weight:bold;">Platforms</label><div id="modal-platforms-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;">'+pcb+'</div></div>' +
            '<div id="modal-api-keys-container">'+akf+'</div>' +
            '<div style="margin-bottom:18px;"><label style="display:block;color:#aaa;margin-bottom:6px;font-size:13px;font-weight:bold;">Brand Colors</label><div style="display:flex;gap:20px;"><label style="color:#aaa;display:flex;align-items:center;gap:8px;">Primary: <input type="color" id="modal-color-primary" value="'+pc+'"></label><label style="color:#aaa;display:flex;align-items:center;gap:8px;">Secondary: <input type="color" id="modal-color-secondary" value="'+sc+'"></label></div></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;gap:10px;padding:15px 25px;border-top:1px solid rgba(255,255,255,0.1);"><button onclick="closeSocialModal()" style="background:rgba(255,255,255,0.1);color:#ccc;border:1px solid rgba(255,255,255,0.2);padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;">Cancel</button><button onclick="saveSocialCompany()" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;">Save Company</button></div>' +
    '</div>';
    document.body.appendChild(ov);
    document.querySelectorAll('#modal-platforms-grid input[type=checkbox]').forEach(function(cb) { cb.addEventListener('change', updateApiKeyFields); });
}

function updateApiKeyFields() {
    var sel = [];
    document.querySelectorAll('#modal-platforms-grid input:checked').forEach(function(cb) { sel.push(cb.value); });
    var c = document.getElementById('modal-api-keys-container');
    if (!c) return;
    if (sel.length === 0) { c.innerHTML = ''; return; }
    var h = '<div><h4 style="color:#fff;margin:15px 0 10px;">API Keys</h4>';
    sel.forEach(function(pId) {
        var pl = AVAILABLE_PLATFORMS.find(function(a){return a.id===pId;});
        h += '<div style="margin:10px 0;padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;">';
        h += '<label style="color:#aaa;font-size:12px;font-weight:bold;display:block;margin-bottom:6px;">'+(pl?pl.icon+' '+pl.name:pId)+'</label>';
        h += '<input type="text" class="form-input api-key-input" data-platform="'+pId+'" data-field="key" placeholder="API Key / Token" style="margin-top:4px;">';
        if (pId==='twitter') h += '<input type="text" class="form-input api-key-input" data-platform="twitter" data-field="secret" placeholder="API Secret" style="margin-top:4px;">';
        if (pId==='mastodon') h += '<input type="text" class="form-input api-key-input" data-platform="mastodon" data-field="instance" placeholder="Instance URL" style="margin-top:4px;">';
        if (pId==='telegram') h += '<input type="text" class="form-input api-key-input" data-platform="telegram" data-field="chatId" placeholder="Chat ID" style="margin-top:4px;">';
        if (pId==='discord') h += '<input type="text" class="form-input api-key-input" data-platform="discord" data-field="webhook" placeholder="Webhook URL" style="margin-top:4px;">';
        if (pId==='bluesky') h += '<input type="text" class="form-input api-key-input" data-platform="bluesky" data-field="handle" placeholder="Handle" style="margin-top:4px;">';
        if (pId==='wordpress') {
            h += '<input type="text" class="form-input api-key-input" data-platform="wordpress" data-field="url" placeholder="Site URL" style="margin-top:4px;">';
            h += '<input type="text" class="form-input api-key-input" data-platform="wordpress" data-field="username" placeholder="Username" style="margin-top:4px;">';
            h += '<input type="password" class="form-input api-key-input" data-platform="wordpress" data-field="password" placeholder="App Password" style="margin-top:4px;">';
        }
        h += '</div>';
    });
    h += '</div>';
    c.innerHTML = h;
}

window.closeSocialModal = function() {
    var o = document.getElementById('company-modal-overlay');
    if (o) o.remove();
    socialBotState.editingCompany = null;
};

window.saveSocialCompany = function() {
    var name = document.getElementById('modal-company-name').value.trim();
    if (!name) { alert('Company name is required'); return; }
    var platforms = [];
    document.querySelectorAll('#modal-platforms-grid input:checked').forEach(function(cb) { platforms.push(cb.value); });
    var apiKeys = {};
    document.querySelectorAll('.api-key-input').forEach(function(inp) {
        var p = inp.getAttribute('data-platform'), f = inp.getAttribute('data-field');
        if (inp.value.trim()) { if (!apiKeys[p]) apiKeys[p] = {}; apiKeys[p][f] = inp.value.trim(); }
    });
    var data = { name: name, platforms: platforms, apiKeys: apiKeys, branding: { colors: { primary: document.getElementById('modal-color-primary').value, secondary: document.getElementById('modal-color-secondary').value } } };
    var promise = socialBotState.editingCompany ? apiUpdateCompany(socialBotState.editingCompany, data) : apiCreateCompany(data);
    promise.then(function() { closeSocialModal(); loadCompanies(); showSocialSuccess(socialBotState.editingCompany ? 'Company updated!' : 'Company created!'); })
        .catch(function(e) { alert('Save failed: ' + e.message); });
};

window.confirmDeleteCompany = function(id, name) {
    if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;
    apiDeleteCompany(id).then(function() { if (socialBotState.selectedCompany===id) socialBotState.selectedCompany=null; loadCompanies(); showSocialSuccess('Company deleted'); })
        .catch(function(e) { alert('Delete failed: ' + e.message); });
};

function renderCreatePostTab() {
    var c = document.getElementById('social-tab-create');
    if (!c) return;
    var selCo = socialBotState.companies.find(function(co){return co.id===socialBotState.selectedCompany;});
    var plats = selCo ? (selCo.platforms||[]) : [];
    var h = '<div class="create-post-form">';
    h += '<div style="margin-bottom:18px;"><label style="display:block;color:#aaa;margin-bottom:6px;font-weight:bold;">Select Company</label><select id="create-post-company" class="form-select" onchange="onPostCompanyChange()"><option value="">-- Choose --</option>';
    socialBotState.companies.forEach(function(co) { h += '<option value="'+co.id+'"'+(co.id===socialBotState.selectedCompany?' selected':'')+'>'+co.name+'</option>'; });
    h += '</select></div>';
    h += '<div style="margin-bottom:18px;"><label style="display:block;color:#aaa;margin-bottom:6px;font-weight:bold;">Platforms</label><div id="post-platform-checkboxes" style="display:flex;flex-wrap:wrap;gap:8px;">';
    if (plats.length > 0) { plats.forEach(function(pId) { var pl = AVAILABLE_PLATFORMS.find(function(a){return a.id===pId;}); if(pl) h += '<label style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(255,255,255,0.05);border-radius:6px;cursor:pointer;color:#ccc;"><input type="checkbox" name="post-platform" value="'+pId+'">'+pl.icon+' '+pl.name+'</label>'; }); }
    else h += '<p style="color:#888;">Select a company first</p>';
    h += '</div></div>';
    h += '<div style="margin-bottom:18px;"><label style="display:block;color:#aaa;margin-bottom:6px;font-weight:bold;">Content</label><textarea id="create-post-content" class="form-textarea" placeholder="Write your post..." rows="6" style="width:100%;padding:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-size:14px;resize:vertical;"></textarea></div>';
    h += '<div style="margin-bottom:18px;"><label style="display:block;color:#aaa;margin-bottom:6px;font-weight:bold;">Schedule (optional)</label><input type="datetime-local" id="create-post-schedule" class="form-input"></div>';
    h += '<div style="display:flex;gap:10px;"><button onclick="submitSocialPost(false)" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;">Post Now</button><button onclick="submitSocialPost(true)" style="background:rgba(255,255,255,0.1);color:#ccc;border:1px solid rgba(255,255,255,0.2);padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;">Schedule</button></div>';
    h += '</div>';
    c.innerHTML = h;
}

window.onPostCompanyChange = function() {
    var cid = document.getElementById('create-post-company').value;
    socialBotState.selectedCompany = cid;
    var co = socialBotState.companies.find(function(c){return c.id===cid;});
    var plats = co ? (co.platforms||[]) : [];
    var c = document.getElementById('post-platform-checkboxes');
    if (!c) return;
    if (plats.length===0) { c.innerHTML='<p style="color:#888;">No platforms for this company</p>'; return; }
    var h = '';
    plats.forEach(function(pId) { var pl=AVAILABLE_PLATFORMS.find(function(a){return a.id===pId;}); if(pl) h+='<label style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(255,255,255,0.05);border-radius:6px;cursor:pointer;color:#ccc;"><input type="checkbox" name="post-platform" value="'+pId+'">'+pl.icon+' '+pl.name+'</label>'; });
    c.innerHTML = h;
    renderCompanySelector();
};

window.submitSocialPost = function(isScheduled) {
    var company = document.getElementById('create-post-company').value;
    var content = document.getElementById('create-post-content').value;
    var schedule = document.getElementById('create-post-schedule').value;
    var platforms = [];
    document.querySelectorAll('input[name="post-platform"]:checked').forEach(function(cb) { platforms.push(cb.value); });
    if (!company || platforms.length===0 || !content.trim()) { alert('Select company, platform(s), and write content'); return; }
    fetch(SOCIALBOT_API + '/api/posts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({company:company,platforms:platforms,content:content,scheduled:isScheduled||false,scheduledFor:schedule||null}) })
        .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
        .then(function(){showSocialSuccess('Post '+(isScheduled?'scheduled':'published')+'!');document.getElementById('create-post-content').value='';})
        .catch(function(e){alert('Failed: '+e.message);});
};

function renderHistoryTab() {
    var c = document.getElementById('social-tab-history');
    if (!c) return;
    var posts = socialBotState.posts.filter(function(p){return !p.scheduled;});
    if (posts.length===0) { c.innerHTML='<div class="empty-state" style="text-align:center;padding:40px;color:#888;"><div style="font-size:48px;">📊</div><h3 style="color:#ccc;">No Post History</h3></div>'; return; }
    var h = '<div style="display:flex;flex-direction:column;gap:12px;">';
    posts.forEach(function(p) {
        var cn = socialBotState.companies.find(function(co){return co.id===p.company;});
        h += '<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:15px;">';
        h += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">';
        h += '<span style="background:#667eea;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;">'+(cn?cn.name:'Unknown')+'</span>';
        h += '<span style="color:#666;font-size:12px;margin-left:auto;">'+formatDate(p.createdAt)+'</span></div>';
        h += '<div style="color:#ccc;font-size:14px;">'+(p.content||'').substring(0,200)+'</div></div>';
    });
    h += '</div>';
    c.innerHTML = h;
}

function renderWordPressTab() {
    var c = document.getElementById('social-tab-wordpress');
    if (!c) return;
    c.innerHTML = '<div style="padding:20px;background:rgba(255,255,255,0.05);border-radius:8px;"><p style="color:#aaa;">WordPress Page Maker is integrated with SocialBot.</p><button onclick="switchView(\'wordpress-view\')" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;margin-top:10px;">Open WordPress Editor</button></div>';
}

function formatDate(d) { if(!d)return'N/A'; var dt=new Date(d); return dt.toLocaleDateString()+' '+dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
function showSocialSuccess(m) { var t=document.createElement('div'); t.style.cssText='position:fixed;top:20px;right:20px;background:#4CAF50;color:#fff;padding:12px 24px;border-radius:8px;z-index:99999;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);'; t.textContent=m; document.body.appendChild(t); setTimeout(function(){t.remove();},3000); }
function showSocialError(m) { var t=document.createElement('div'); t.style.cssText='position:fixed;top:20px;right:20px;background:#f44336;color:#fff;padding:12px 24px;border-radius:8px;z-index:99999;font-weight:bold;'; t.textContent=m; document.body.appendChild(t); setTimeout(function(){t.remove();},5000); }

function injectSocialStyles() {
    if (document.getElementById('socialbot-crud-styles')) return;
    var s = document.createElement('style');
    s.id = 'socialbot-crud-styles';
    s.textContent = '.btn-add-company{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px;transition:transform 0.2s;}.btn-add-company:hover{transform:scale(1.05);}.companies-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}.company-card{background:rgba(255,255,255,0.06);border-radius:12px;padding:20px;transition:transform 0.2s,box-shadow 0.2s;}.company-card:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.3);}.btn-icon{background:none;border:none;cursor:pointer;font-size:16px;padding:4px 8px;border-radius:4px;}.btn-icon:hover{background:rgba(255,255,255,0.1);}.btn-small-primary{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;}.btn-small-secondary{background:rgba(255,255,255,0.08);color:#aaa;border:1px solid rgba(255,255,255,0.15);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;}.empty-state{text-align:center;padding:60px 20px;color:#888;}.form-input,.form-select{width:100%;padding:10px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;}.form-input:focus,.form-select:focus{outline:none;border-color:#667eea;}.company-selector-btn{display:inline-flex;flex-direction:column;align-items:center;gap:4px;padding:8px 16px;background:rgba(255,255,255,0.06);border:2px solid transparent;border-radius:8px;color:#ccc;cursor:pointer;transition:all 0.2s;margin:4px;}.company-selector-btn:hover{background:rgba(255,255,255,0.1);}.company-selector-btn.selected{border-color:#667eea;background:rgba(102,126,234,0.15);color:#fff;}';
    document.head.appendChild(s);
}


// Social API Settings Tab
function renderSocialSettingsTab() {
    var container = document.getElementById('social-tab-settings');
    if (!container) {
        container = document.createElement('div');
        container.id = 'social-tab-settings';
        container.className = 'social-tab-content';
        container.style.display = 'none';
        var parent = document.querySelector('#social-media-view .social-tab-nav');
        if (parent && parent.parentNode) parent.parentNode.appendChild(container);
    }
    
    var platforms = [
        { id:'twitter', icon:'\ud835\udd4f', name:'Twitter/X', fields:[{k:'key',l:'API Key'},{k:'secret',l:'API Secret'}] },
        { id:'instagram', icon:'\ud83d\udcf8', name:'Instagram', fields:[{k:'token',l:'Business Token'}] },
        { id:'tiktok', icon:'\ud83c\udfb5', name:'TikTok', fields:[{k:'token',l:'Creator Token'}] },
        { id:'linkedin', icon:'\ud83d\udcbc', name:'LinkedIn', fields:[{k:'token',l:'Access Token'}] },
        { id:'bluesky', icon:'\ud83c\udf0a', name:'Bluesky', fields:[{k:'key',l:'API Key'},{k:'handle',l:'Handle'}] },
        { id:'mastodon', icon:'\ud83d\udc18', name:'Mastodon', fields:[{k:'token',l:'Access Token'},{k:'instance',l:'Instance URL'}] },
        { id:'discord', icon:'\ud83d\udcac', name:'Discord', fields:[{k:'webhook',l:'Webhook URL'}] },
        { id:'telegram', icon:'\u2708\ufe0f', name:'Telegram', fields:[{k:'token',l:'Bot Token'},{k:'chatId',l:'Chat ID'}] }
    ];
    
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem('pinky-social-apis') || '{}'); } catch(e) {}
    
    var html = '<h3 style="color:var(--text-primary);margin-bottom:20px;">\ud83d\udd11 Platform API Keys</h3>';
    html += '<p style="color:var(--text-secondary);margin-bottom:20px;font-size:0.9em;">Connect your social platforms to enable automated posting.</p>';
    html += '<div class="social-api-grid">';
    
    platforms.forEach(function(p) {
        var pData = stored[p.id] || {};
        var connected = pData.connected || false;
        html += '<div class="social-api-card ' + (connected ? 'connected' : '') + '">';
        html += '<div class="social-api-card-header"><span class="social-api-icon">' + p.icon + '</span><strong>' + p.name + '</strong>';
        html += '<span class="social-api-status">' + (connected ? '\u2705 Connected' : '\u26aa Not connected') + '</span></div>';
        p.fields.forEach(function(f) {
            var val = pData[f.k] || '';
            html += '<input type="password" class="social-api-input" data-platform="' + p.id + '" data-field="' + f.k + '" placeholder="' + f.l + '" value="' + val + '" />';
        });
        html += '<button class="social-api-test-btn" onclick="testSocialAPI(\'' + p.id + '\')">Test Connection</button>';
        html += '</div>';
    });
    
    html += '</div>';
    html += '<div style="margin-top:20px;text-align:right;"><button class="social-api-save-btn" onclick="saveSocialAPIs()">\ud83d\udcbe Save All API Keys</button></div>';
    container.innerHTML = html;
}

window.saveSocialAPIs = function() {
    var stored = {};
    document.querySelectorAll('.social-api-input').forEach(function(el) {
        var p = el.dataset.platform;
        var f = el.dataset.field;
        if (!stored[p]) stored[p] = {};
        stored[p][f] = el.value;
        if (el.value) stored[p].connected = true;
    });
    localStorage.setItem('pinky-social-apis', JSON.stringify(stored));
    alert('\u2705 API keys saved!');
    renderSocialSettingsTab();
};

window.testSocialAPI = function(platform) {
    alert('\ud83e\uddea Testing ' + platform + ' connection...\n(API testing coming soon)');
};

// Hook into tab switching
var origSwitch = window.switchSocialTab;
window.switchSocialTab = function(tabName) {
    origSwitch(tabName);
    var settingsTab = document.getElementById('social-tab-settings');
    if (settingsTab) settingsTab.style.display = tabName === 'settings' ? 'block' : 'none';
    if (tabName === 'settings') renderSocialSettingsTab();
};
