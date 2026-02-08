/**
 * Load WordPress Manager component dynamically into SocialBot view
 */

(async function loadWordPressManager() {
  const container = document.getElementById('wordpress-manager-container');
  
  if (!container) {
    console.warn('[WordPress Manager] Container #wordpress-manager-container not found');
    return;
  }

  try {
    const response = await fetch('wordpress-manager.html');
    
    if (!response.ok) {
      throw new Error(`Failed to load WordPress Manager: ${response.status}`);
    }
    
    const html = await response.text();
    container.innerHTML = html;
    
    console.log('[WordPress Manager] Component loaded successfully');
  } catch (err) {
    console.error('[WordPress Manager] Load error:', err);
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ff3b30;">
        <p>⚠️ Failed to load WordPress Manager component</p>
        <p style="font-size: 12px; color: #8e9ab3;">${err.message}</p>
      </div>
    `;
  }
})();
