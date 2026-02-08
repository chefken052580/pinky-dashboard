// Loading Manager + Global Interval Throttle
window.LoadingManager = {
  show: function() {},
  hide: function() {},
  setProgress: function() {},
  error: function(msg) { console.warn('[LoadingManager]', msg); }
};

// GLOBAL THROTTLE: Force API-polling intervals to minimum 30s
// But allow fast UI intervals (under 1s) for timers/animations
(function() {
  var _origSetInterval = window.setInterval;
  var MIN = 30000;
  window.setInterval = function(fn, ms) {
    // Allow fast UI timers (<=1000ms) — these are display updates, not API calls
    if (ms && ms <= 1000) return _origSetInterval.call(window, fn, ms);
    // Throttle everything else to 30s minimum
    var t = (ms && ms < MIN) ? MIN : ms;
    return _origSetInterval.call(window, fn, t);
  };
})();

// SAFETY: Force hide loading screen — retry until found
var _sc = 0;
var _st = window.setInterval(function() {
  _sc++;
  var o = document.getElementById('loading-overlay');
  if (o) { o.style.display = 'none'; clearInterval(_st); }
  if (_sc > 20) clearInterval(_st);
}, 500);
