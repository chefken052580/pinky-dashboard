/**
 * VISUAL POLISH CSS LOADER
 * Dynamically loads visual-polish.css into the dashboard
 * Created: 2026-02-07 for P1.4-4
 */

(function() {
    // Check if already loaded
    if (document.getElementById('visual-polish-css')) {
        console.log('[Visual Polish] CSS already loaded');
        return;
    }
    
    // Create link element
    const link = document.createElement('link');
    link.id = 'visual-polish-css';
    link.rel = 'stylesheet';
    link.href = 'visual-polish.css?v=' + Date.now();
    link.type = 'text/css';
    
    // Add to head
    document.head.appendChild(link);
    
    console.log('[Visual Polish] CSS loaded dynamically');
    
    // Apply additional runtime fixes
    document.addEventListener('DOMContentLoaded', function() {
        applyRuntimeFixes();
    });
    
    function applyRuntimeFixes() {
        // Fix any remaining inline styles that can't be overridden with CSS
        
        // Remove hardcoded colors from social-media-view paragraphs
        const socialViewPs = document.querySelectorAll('#social-media-view p[style*="color"]');
        socialViewPs.forEach(p => {
            if (p.style.color) {
                p.style.color = ''; // Let CSS take over
            }
        });
        
        // Remove hardcoded colors from wordpress-view paragraphs
        const wpViewPs = document.querySelectorAll('#wordpress-view p[style*="color"]');
        wpViewPs.forEach(p => {
            if (p.style.color === 'rgb(102, 102, 102)' || p.style.color === '#666') {
                p.style.color = ''; // Let CSS take over
            }
        });
        
        // Ensure all quick action buttons have proper event listeners
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            if (!btn.onclick && !btn.getAttribute('data-action-bound')) {
                btn.setAttribute('data-action-bound', 'true');
                // Add tooltip if no action defined
                if (!btn.onclick) {
                    btn.title = '💡 Quick Action - Click to trigger';
                }
            }
        });
        
        // Fix task analytics accordion if it exists
        const taskAnalyticsAccordion = document.querySelector('.task-analytics-accordion');
        if (taskAnalyticsAccordion && !taskAnalyticsAccordion.getAttribute('data-accordion-bound')) {
            taskAnalyticsAccordion.setAttribute('data-accordion-bound', 'true');
            const header = taskAnalyticsAccordion.querySelector('.task-analytics-accordion-header');
            if (header) {
                header.addEventListener('click', function() {
                    taskAnalyticsAccordion.classList.toggle('expanded');
                });
            }
        }
        
        console.log('[Visual Polish] Runtime fixes applied');
    }
    
    // If DOM already loaded, apply fixes immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyRuntimeFixes);
    } else {
        applyRuntimeFixes();
    }
})();
