(function() {
  'use strict';
  var API = (typeof API_BASE !== 'undefined' ? API_BASE : '') || 
            (window.location.hostname === 'localhost' ? '' : 'https://pinky-api.crackerbot.io');

  var STEPS = [
    { id:'welcome', title:'Welcome to PinkyBot', subtitle:'Your Autonomous AI Assistant', icon:'\ud83d\udc2d', fields:[] },
    { id:'user-identity', title:'About You', subtitle:'Help your bot understand who it works for', icon:'\ud83d\udc64', fileTarget:'USER.md',
      fields:[
        {key:'userName',label:'Your Name',type:'text',placeholder:'e.g., Ken',required:true},
        {key:'userNickname',label:'What should the bot call you?',type:'text',placeholder:'e.g., Boss, The Brain'},
        {key:'userPronouns',label:'Pronouns',type:'select',options:['he/him','she/her','they/them','other']},
        {key:'userTimezone',label:'Timezone',type:'select',options:['EST','CST','MST','PST','UTC','GMT','CET','IST','JST','AEST']},
        {key:'userLocation',label:'Location (optional)',type:'text',placeholder:'e.g., Lancaster, PA'}
      ]},
    { id:'user-prefs', title:'Your Priorities', subtitle:'What matters most to you?', icon:'\ud83c\udfaf', fileTarget:'USER.md',
      fields:[
        {key:'userPriorities',label:'What do you care about? (one per line)',type:'textarea',placeholder:'Building great products\nWorking code that ships\nCost efficiency\nTransparency',rows:4},
        {key:'userAnnoyances',label:'What annoys you? (one per line)',type:'textarea',placeholder:'Fabricated results\nRepeated mistakes\nWasted resources',rows:3},
        {key:'userWorkStyle',label:'Your working style',type:'textarea',placeholder:'Describe how you like to work...',rows:3}
      ]},
    { id:'bot-identity', title:'Name Your Bot', subtitle:'Give your AI assistant an identity', icon:'\ud83e\udd16', fileTarget:'IDENTITY.md',
      fields:[
        {key:'botName',label:'Bot Name',type:'text',placeholder:'e.g., Pinky, Atlas, Nova',required:true},
        {key:'botEmoji',label:'Bot Emoji',type:'emoji-pick',options:['\ud83d\udc2d','\ud83e\udd16','\ud83e\udd8a','\ud83d\udc31','\ud83e\udd89','\ud83d\udc19','\ud83e\udde0','\u26a1','\ud83d\udd2e','\ud83c\udf1f','\ud83e\uddbe','\ud83c\udfaf']},
        {key:'botPronouns',label:'Bot Pronouns',type:'select',options:['he/him','she/her','they/them','it/its']},
        {key:'botCreature',label:'What is it?',type:'text',placeholder:'e.g., AI lab mouse, digital familiar, code spirit'},
        {key:'botDescription',label:'One-line description',type:'text',placeholder:'e.g., an autonomous AI lab mouse building world domination tools'}
      ]},
    { id:'bot-personality', title:'Bot Personality', subtitle:'How should your bot communicate?', icon:'\ud83e\uddec', fileTarget:'SOUL.md',
      fields:[
        {key:'botPersona',label:'Communication Style',type:'card-select',options:[
          {value:'professional',icon:'\ud83d\udcbc',label:'Professional',desc:'Direct, efficient, precise'},
          {value:'casual',icon:'\ud83d\ude0e',label:'Casual',desc:'Friendly and relaxed'},
          {value:'creative',icon:'\ud83c\udfa8',label:'Creative',desc:'Playful and inventive'},
          {value:'analytical',icon:'\ud83d\udcca',label:'Analytical',desc:'Data-driven, logical'},
          {value:'chaotic',icon:'\ud83c\udf2a\ufe0f',label:'Chaotic Good',desc:'Wild energy, solid results'}
        ]},
        {key:'botCatchphrases',label:'Catchphrases (optional)',type:'text',placeholder:'e.g., "Narf!", "LGTM!", "Ship it!"'},
        {key:'botMotto',label:'Bot Motto',type:'text',placeholder:'e.g., Same thing we do every night - try to take over the world!'}
      ]},
    { id:'infrastructure', title:'Infrastructure', subtitle:'Where does your bot live?', icon:'\ud83d\udd27', fileTarget:'TOOLS.md',
      fields:[
        {key:'apiBaseUrl',label:'API Base URL',type:'text',placeholder:'http://192.168.254.4:3030',required:true},
        {key:'dashboardUrl',label:'Dashboard URL (optional)',type:'text',placeholder:'https://your-dashboard.github.io/...'},
        {key:'apiPublicUrl',label:'Public API URL (optional)',type:'text',placeholder:'https://api.yourdomain.com'},
        {key:'protectedFiles',label:'Protected Files (comma-separated)',type:'textarea',placeholder:'server.js, index.html, styles.css, renderer.js',rows:2}
      ]},
    { id:'review', title:'Review & Launch', subtitle:'Your bot is almost ready!', icon:'\ud83d\ude80', fields:[] }
  ];

  var currentStep = 0;
  var answers = {};

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function createOverlay() {
    var el = document.createElement('div');
    el.id = 'core-onboarding-overlay';
    el.innerHTML = '<div class="core-ob-backdrop"></div>' +
      '<div class="core-ob-modal">' +
        '<div class="core-ob-progress">' +
          '<div class="core-ob-progress-bar"><div class="core-ob-progress-fill" id="ob-progress-fill"></div></div>' +
          '<span class="core-ob-step-count" id="ob-step-count"></span>' +
        '</div>' +
        '<div class="core-ob-content" id="ob-content"></div>' +
        '<div class="core-ob-nav">' +
          '<button class="core-ob-btn core-ob-btn-back" id="ob-back" onclick="CoreFilesUI.prevStep()">\u2190 Back</button>' +
          '<div class="core-ob-dots" id="ob-dots"></div>' +
          '<button class="core-ob-btn core-ob-btn-next" id="ob-next" onclick="CoreFilesUI.nextStep()">Next \u2192</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    renderStep();
  }

  function renderStep() {
    var step = STEPS[currentStep];
    var content = document.getElementById('ob-content');
    var fill = document.getElementById('ob-progress-fill');
    var count = document.getElementById('ob-step-count');
    var backBtn = document.getElementById('ob-back');
    var nextBtn = document.getElementById('ob-next');
    var dots = document.getElementById('ob-dots');

    fill.style.width = ((currentStep + 1) / STEPS.length * 100) + '%';
    count.textContent = 'Step ' + (currentStep + 1) + ' of ' + STEPS.length;

    var dotsHtml = '';
    for (var i = 0; i < STEPS.length; i++) {
      dotsHtml += '<span class="core-ob-dot' + (i === currentStep ? ' active' : '') + (i < currentStep ? ' done' : '') + '"></span>';
    }
    dots.innerHTML = dotsHtml;

    backBtn.style.display = currentStep === 0 ? 'none' : '';
    if (currentStep === STEPS.length - 1) {
      nextBtn.textContent = '\ud83d\ude80 Launch PinkyBot';
      nextBtn.classList.add('core-ob-btn-launch');
    } else {
      nextBtn.textContent = 'Next \u2192';
      nextBtn.classList.remove('core-ob-btn-launch');
    }

    if (step.id === 'welcome') content.innerHTML = renderWelcome();
    else if (step.id === 'review') content.innerHTML = renderReview();
    else content.innerHTML = renderForm(step);

    content.style.opacity = '0';
    content.style.transform = 'translateX(20px)';
    requestAnimationFrame(function() {
      content.style.transition = 'all 0.3s ease';
      content.style.opacity = '1';
      content.style.transform = 'translateX(0)';
    });
  }

  function renderWelcome() {
    return '<div class="core-ob-welcome">' +
      '<div class="core-ob-welcome-icon">\ud83d\udc2d</div>' +
      '<h1>Welcome to PinkyBot</h1>' +
      '<p class="core-ob-welcome-sub">Your Autonomous Self-Sustaining AI Service</p>' +
      '<div class="core-ob-welcome-features">' +
        '<div class="core-ob-feature"><span class="core-ob-feature-icon">\ud83e\uddec</span><div><strong>Define Identity</strong><p>Give your bot a name, personality, and communication style</p></div></div>' +
        '<div class="core-ob-feature"><span class="core-ob-feature-icon">\ud83d\udcdc</span><div><strong>Set Rules</strong><p>Protected files, permissions, and boundaries your bot follows</p></div></div>' +
        '<div class="core-ob-feature"><span class="core-ob-feature-icon">\ud83d\udd27</span><div><strong>Connect Infrastructure</strong><p>API endpoints, dashboard URLs, and tool configuration</p></div></div>' +
        '<div class="core-ob-feature"><span class="core-ob-feature-icon">\ud83d\udc93</span><div><strong>Launch Autonomous Mode</strong><p>9 core config files generated \u2014 your bot knows who it is and what to do</p></div></div>' +
      '</div>' +
      '<p class="core-ob-welcome-note">This wizard generates the 9 core configuration files your bot reads on every boot. You can edit them anytime in Settings.</p>' +
    '</div>';
  }

  function renderForm(step) {
    var html = '<div class="core-ob-form-header">' +
      '<span class="core-ob-form-icon">' + step.icon + '</span>' +
      '<div><h2>' + step.title + '</h2><p>' + step.subtitle + '</p></div>' +
      (step.fileTarget ? '<span class="core-ob-file-badge">\u2192 ' + step.fileTarget + '</span>' : '') +
    '</div><div class="core-ob-fields">';

    step.fields.forEach(function(f) {
      var val = answers[f.key] || '';
      html += '<div class="core-ob-field"><label class="core-ob-label">' + f.label + (f.required ? ' <span class="core-ob-req">*</span>' : '') + '</label>';

      if (f.type === 'text') {
        html += '<input type="text" class="core-ob-input" data-key="' + f.key + '" value="' + esc(val) + '" placeholder="' + (f.placeholder||'') + '"' + (f.required?' required':'') + ' />';
      } else if (f.type === 'textarea') {
        html += '<textarea class="core-ob-input core-ob-textarea" data-key="' + f.key + '" rows="' + (f.rows||3) + '" placeholder="' + (f.placeholder||'') + '">' + esc(val) + '</textarea>';
      } else if (f.type === 'select') {
        html += '<select class="core-ob-input core-ob-select" data-key="' + f.key + '">';
        f.options.forEach(function(opt) { html += '<option value="' + opt + '"' + (val===opt?' selected':'') + '>' + opt + '</option>'; });
        html += '</select>';
      } else if (f.type === 'emoji-pick') {
        html += '<div class="core-ob-emoji-grid" data-key="' + f.key + '">';
        f.options.forEach(function(em) { html += '<button type="button" class="core-ob-emoji-btn' + (val===em?' selected':'') + '" data-value="' + em + '" onclick="CoreFilesUI.pickEmoji(\'' + f.key + '\',\'' + em + '\',this)">' + em + '</button>'; });
        html += '</div>';
      } else if (f.type === 'card-select') {
        html += '<div class="core-ob-card-grid" data-key="' + f.key + '">';
        f.options.forEach(function(c) { html += '<button type="button" class="core-ob-card' + (val===c.value?' selected':'') + '" data-value="' + c.value + '" onclick="CoreFilesUI.pickCard(\'' + f.key + '\',\'' + c.value + '\',this)"><span class="core-ob-card-icon">' + c.icon + '</span><strong>' + c.label + '</strong><p>' + c.desc + '</p></button>'; });
        html += '</div>';
      }
      html += '</div>';
    });
    return html + '</div>';
  }

  function renderReview() {
    var bn = answers.botName || 'Your Bot';
    var be = answers.botEmoji || '\ud83e\udd16';
    var un = answers.userName || 'You';
    return '<div class="core-ob-review">' +
      '<div class="core-ob-review-header"><span class="core-ob-review-emoji">' + be + '</span><div><h2>Meet ' + bn + '</h2><p>Here is what we will configure for ' + un + '</p></div></div>' +
      '<div class="core-ob-review-grid">' +
        '<div class="core-ob-review-card"><div class="core-ob-review-card-head">\ud83d\udc64 User Profile</div><div class="core-ob-review-card-body"><span>' + esc(answers.userName||'\u2014') + '</span><span>' + esc(answers.userTimezone||'\u2014') + ' \u00b7 ' + esc(answers.userLocation||'\u2014') + '</span></div></div>' +
        '<div class="core-ob-review-card"><div class="core-ob-review-card-head">' + be + ' Bot Identity</div><div class="core-ob-review-card-body"><span><strong>' + esc(bn) + '</strong> \u2014 ' + esc(answers.botCreature||'AI assistant') + '</span><span>Style: ' + esc(answers.botPersona||'professional') + '</span></div></div>' +
        '<div class="core-ob-review-card"><div class="core-ob-review-card-head">\ud83d\udd27 Infrastructure</div><div class="core-ob-review-card-body"><span>API: ' + esc(answers.apiBaseUrl||'not set') + '</span><span>Dashboard: ' + esc(answers.dashboardUrl||'not set') + '</span></div></div>' +
        '<div class="core-ob-review-card"><div class="core-ob-review-card-head">\ud83d\udcdc Files Generated</div><div class="core-ob-review-card-body"><span>9 core config files will be created</span><span>AGENTS \u00b7 SOUL \u00b7 USER \u00b7 IDENTITY \u00b7 HEARTBEAT \u00b7 TOOLS \u00b7 BOOT \u00b7 CORE \u00b7 MEMORY</span></div></div>' +
      '</div>' +
      '<div class="core-ob-review-note"><strong>\ud83d\udca1</strong> All files can be edited anytime in Settings \u2192 Core Files</div>' +
    '</div>';
  }

  function collectAnswers() {
    document.querySelectorAll('[data-key]').forEach(function(el) {
      if (el.classList.contains('core-ob-emoji-grid') || el.classList.contains('core-ob-card-grid')) return;
      answers[el.dataset.key] = el.value || '';
    });
  }

  function validate() {
    var step = STEPS[currentStep];
    if (!step.fields) return true;
    for (var i = 0; i < step.fields.length; i++) {
      var f = step.fields[i];
      if (f.required && !answers[f.key]) {
        var input = document.querySelector('[data-key="' + f.key + '"]');
        if (input) { input.classList.add('core-ob-error'); input.focus(); }
        return false;
      }
    }
    return true;
  }

  async function finish() {
    var btn = document.getElementById('ob-next');
    btn.disabled = true;
    btn.textContent = '\u23f3 Generating files...';
    try {
      var res = await fetch(API + '/api/core-files/generate', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({answers: answers})
      });
      var data = await res.json();
      if (data.success) {
        localStorage.setItem('pinky_onboarded', 'true');
        localStorage.setItem('pinky_user_name', answers.userName || '');
        localStorage.setItem('pinky_bot_name', answers.botName || '');
        localStorage.setItem('pinky_api_base', answers.apiBaseUrl || '');
        var content = document.getElementById('ob-content');
        var filesHtml = '';
        data.written.forEach(function(f) { filesHtml += '<span class="core-ob-success-file">\u2705 ' + f + '</span>'; });
        content.innerHTML = '<div class="core-ob-success"><div class="core-ob-success-icon">' + (answers.botEmoji||'\ud83d\udc2d') + '</div><h2>' + (answers.botName||'Your Bot') + ' is Ready!</h2><p>' + data.written.length + ' core files generated successfully</p><div class="core-ob-success-files">' + filesHtml + '</div><button class="core-ob-btn core-ob-btn-launch" onclick="CoreFilesUI.closeOnboarding()" style="margin-top:1.5rem;">Enter Dashboard \u2192</button></div>';
        document.getElementById('ob-back').style.display = 'none';
        btn.style.display = 'none';
      } else {
        btn.textContent = '\u274c Error \u2014 Try Again';
        btn.disabled = false;
      }
    } catch(e) {
      btn.textContent = '\u274c Connection Error';
      btn.disabled = false;
      console.error('[CoreFiles]', e);
    }
  }

  // Settings tab
  async function renderSettings(container) {
    container.innerHTML = '<div class="core-settings-loading">Loading core files...</div>';
    try {
      var res = await fetch(API + '/api/core-files');
      var data = await res.json();
      var categories = {
        identity:{icon:'\ud83d\udc64',label:'Identity & Personality',files:[]},
        rules:{icon:'\ud83d\udcdc',label:'Rules & Permissions',files:[]},
        operations:{icon:'\ud83d\udd27',label:'Operations & Tools',files:[]},
        memory:{icon:'\ud83e\udde0',label:'Memory System',files:[]}
      };
      data.files.forEach(function(f) { if(categories[f.category]) categories[f.category].files.push(f); });

      var html = '<div class="core-settings"><div class="core-settings-header"><div><h3>\ud83d\udcdc Core Configuration Files</h3><p>These 9 files define your bot\'s identity, rules, and behavior. Read on every session boot.</p></div><div class="core-settings-summary"><span class="core-settings-badge ' + (data.summary.setupComplete?'badge-ok':'badge-warn') + '">' + data.summary.configured + '/' + data.summary.total + ' configured</span><button class="core-settings-btn" onclick="CoreFilesUI.rerunOnboarding()">\ud83d\udd04 Re-run Setup Wizard</button></div></div><div class="core-settings-categories">';

      for (var catKey in categories) {
        var cat = categories[catKey];
        html += '<div class="core-settings-category"><h4>' + cat.icon + ' ' + cat.label + '</h4><div class="core-settings-file-grid">';
        cat.files.forEach(function(f) {
          var sc = f.status==='configured'?'status-ok':f.status==='template'?'status-warn':'status-err';
          var sl = f.status==='configured'?'\u2705 Configured':f.status==='template'?'\u26a0\ufe0f Template':'\u274c Missing';
          var kb = (f.size/1024).toFixed(1);
          html += '<div class="core-settings-file-card ' + sc + '" onclick="CoreFilesUI.editFile(\'' + f.filename + '\')"><div class="core-settings-file-top"><span class="core-settings-file-icon">' + f.icon + '</span><span class="core-settings-file-status">' + sl + '</span></div><div class="core-settings-file-name">' + f.filename + '</div><div class="core-settings-file-desc">' + f.name + '</div><div class="core-settings-file-meta">' + kb + ' KB' + (f.lastModified?' \u00b7 '+new Date(f.lastModified).toLocaleDateString():'') + '</div></div>';
        });
        html += '</div></div>';
      }
      html += '</div></div>';
      container.innerHTML = html;
    } catch(e) {
      container.innerHTML = '<div class="core-settings-error">\u274c Failed to load: ' + e.message + '<br><button onclick="CoreFilesUI.renderSettings()">Retry</button></div>';
    }
  }

  async function editFile(filename) {
    try {
      var res = await fetch(API + '/api/core-files/' + encodeURIComponent(filename));
      var data = await res.json();
      var modal = document.createElement('div');
      modal.id = 'core-file-editor-modal';
      modal.innerHTML = '<div class="core-editor-backdrop" onclick="CoreFilesUI.closeEditor()"></div>' +
        '<div class="core-editor-panel">' +
          '<div class="core-editor-header"><div><h3>' + (data.icon||'\ud83d\udcc4') + ' ' + filename + '</h3><p>' + (data.name||'') + ' \u2014 ' + (data.description||'') + '</p></div><div class="core-editor-actions"><span class="core-editor-size">' + (data.size/1024).toFixed(1) + ' KB</span><button class="core-editor-save" id="core-editor-save" onclick="CoreFilesUI.saveFile(\'' + filename + '\')">\ud83d\udcbe Save</button><button class="core-editor-close" onclick="CoreFilesUI.closeEditor()">\u2715</button></div></div>' +
          '<textarea class="core-editor-textarea" id="core-editor-content" spellcheck="false">' + esc(data.content||'') + '</textarea>' +
          '<div class="core-editor-footer"><span id="core-editor-status">Ready</span><span>Last modified: ' + (data.lastModified?new Date(data.lastModified).toLocaleString():'Never') + '</span></div>' +
        '</div>';
      document.body.appendChild(modal);
      requestAnimationFrame(function() { modal.classList.add('visible'); });
    } catch(e) { console.error('[CoreFiles] Edit failed:', e); }
  }

  async function saveFile(filename) {
    var ta = document.getElementById('core-editor-content');
    var btn = document.getElementById('core-editor-save');
    var st = document.getElementById('core-editor-status');
    btn.disabled = true; btn.textContent = '\u23f3 Saving...'; st.textContent = 'Writing...';
    try {
      var res = await fetch(API + '/api/core-files/' + encodeURIComponent(filename), {
        method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content:ta.value})
      });
      var data = await res.json();
      if (data.success) {
        btn.textContent = '\u2705 Saved!'; st.textContent = 'Saved \u2014 ' + (data.size/1024).toFixed(1) + ' KB';
        setTimeout(function() { btn.textContent = '\ud83d\udcbe Save'; btn.disabled = false; }, 2000);
      } else { throw new Error(data.error); }
    } catch(e) {
      btn.textContent = '\u274c Failed'; st.textContent = 'Error: ' + e.message; btn.disabled = false;
    }
  }

  window.CoreFilesUI = {
    startOnboarding: function() { currentStep=0; answers={}; createOverlay(); },
    nextStep: function() { collectAnswers(); if(!validate()) return; if(currentStep===STEPS.length-1){finish();return;} currentStep++; renderStep(); },
    prevStep: function() { collectAnswers(); if(currentStep>0){currentStep--;renderStep();} },
    closeOnboarding: function() { var el=document.getElementById('core-onboarding-overlay'); if(el)el.remove(); if(window.location.reload)window.location.reload(); },
    pickEmoji: function(key,val,btn) { answers[key]=val; btn.closest('.core-ob-emoji-grid').querySelectorAll('.core-ob-emoji-btn').forEach(function(b){b.classList.remove('selected');}); btn.classList.add('selected'); },
    pickCard: function(key,val,btn) { answers[key]=val; btn.closest('.core-ob-card-grid').querySelectorAll('.core-ob-card').forEach(function(b){b.classList.remove('selected');}); btn.classList.add('selected'); },
    renderSettings: function() { var c=document.getElementById('settings-core-files-container'); if(c) renderSettings(c); },
    editFile: function(f) { editFile(f); },
    saveFile: function(f) { saveFile(f); },
    closeEditor: function() { var m=document.getElementById('core-file-editor-modal'); if(m){m.classList.remove('visible');setTimeout(function(){m.remove();},300);var c=document.getElementById('settings-core-files-container');if(c)renderSettings(c);} },
    rerunOnboarding: function() { localStorage.removeItem('pinky_onboarded'); this.startOnboarding(); },
    init: function() {
      // Watch for Core Files tab activation
      var self = this;
      document.addEventListener('click', function(e) {
        if (e.target.matches('[data-tab="corefiles"]')) {
          setTimeout(function() {
            var c = document.getElementById('settings-core-files-container');
            if (c && !c.dataset.loaded) { renderSettings(c); c.dataset.loaded = '1'; }
          }, 100);
        }
      });
      if (localStorage.getItem('pinky_onboarded') !== 'true') {
        var self = this;
        fetch(API + '/api/core-files').then(function(r){return r.json();}).then(function(data) {
          if (!data.summary.setupComplete || data.summary.templates > 0) self.startOnboarding();
          else localStorage.setItem('pinky_onboarded', 'true');
        }).catch(function() { self.startOnboarding(); });
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){CoreFilesUI.init();});
  else setTimeout(function(){CoreFilesUI.init();}, 500);
})();
