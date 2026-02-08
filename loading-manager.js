// Loading Manager + Global Interval Throttle
window.LoadingManager = {
  show: function() {},
  hide: function() {},
  setProgress: function() {},
  error: function(msg) { console.warn('[LoadingManager]', msg); }
};

(function() {
  var _origSetInterval = window.setInterval;
  var MIN = 30000;
  window.setInterval = function(fn, ms) {
    var t = (ms && ms < MIN) ? MIN : ms;
    return _origSetInterval.call(window, fn, t);
  };
})();

var _sc = 0;
var _st = window.setInterval(function() {
  _sc++;
  var o = document.getElementById('loading-overlay');
  if (o) { o.style.display = 'none'; clearInterval(_st); }
  if (_sc > 20) clearInterval(_st);
}, 500);
