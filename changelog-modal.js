class ChangelogModal {
  constructor() {
    this.modal = document.getElementById('changelog-modal-overlay');
    this.setupEventListeners();
  }
  setupEventListeners() {
    document.getElementById('changelog-close').addEventListener('click', () => {
      const dontShow = document.getElementById('changelog-dont-show').checked;
      if (dontShow) {
        localStorage.setItem('pinky_changelog_dismissed', window.appVersion || '1.0.0');
      }
      this.hide();
    });
  }
  show(version, changelog) {
    document.getElementById('changelog-version').textContent = `Version ${version}`;
    const content = document.getElementById('changelog-content');
    content.innerHTML = '';
    if (changelog.features && changelog.features.length) {
      content.innerHTML += `<div class="changelog-section"><div class="changelog-section-title">✨ New Features</div><ul class="changelog-list">${changelog.features.map(f => `<li>${f}</li>`).join('')}</ul></div>`;
    }
    if (changelog.fixes && changelog.fixes.length) {
      content.innerHTML += `<div class="changelog-section"><div class="changelog-section-title">🐛 Bug Fixes</div><ul class="changelog-list">${changelog.fixes.map(f => `<li>${f}</li>`).join('')}</ul></div>`;
    }
    if (changelog.breaking && changelog.breaking.length) {
      content.innerHTML += `<div class="changelog-section"><div class="changelog-section-title">⚠️ Breaking Changes</div><ul class="changelog-list">${changelog.breaking.map(f => `<li>${f}</li>`).join('')}</ul></div>`;
    }
    const dismissed = localStorage.getItem('pinky_changelog_dismissed');
    if (dismissed === version) return;
    this.modal.style.display = 'block';
  }
  hide() {
    this.modal.style.display = 'none';
  }
}
let changelogModal = null;
document.addEventListener('DOMContentLoaded', () => {
  changelogModal = new ChangelogModal();
  window.changelogModal = changelogModal;
});
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChangelogModal;
}
