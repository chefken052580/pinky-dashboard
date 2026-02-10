/* ═══════════════════════════════════════════════════════
   PINKY ANIMATIONS JS — State Manager
   Switches between cage (paused) and wheel (running)
   Replaces loading spinners with mouse-in-wheel
   ═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  var IMG_PATH = 'images/';

  // ─── Cage HTML (stopped state) ───
  var cageHTML =
    '<div class="pinky-cage-container">' +
      '<div class="cage-hook"></div>' +
      '<div class="cage-top-bar"></div>' +
      '<img class="cage-pinky-logo" src="' + IMG_PATH + 'pinky-mouse-sad.svg" alt="Pinky (sad)">' +
      '<div class="cage-bars-group">' +
        '<div class="cage-bar-v"></div><div class="cage-bar-v"></div><div class="cage-bar-v"></div>' +
        '<div class="cage-bar-v"></div><div class="cage-bar-v"></div><div class="cage-bar-v"></div>' +
        '<div class="cage-bar-v"></div><div class="cage-bar-v"></div><div class="cage-bar-v"></div>' +
      '</div>' +
      '<div class="cage-frame"></div>' +
      '<div class="cage-bottom-bar"></div>' +
      '<div class="cage-zzz">Z</div>' +
      '<div class="cage-padlock"><img src="' + IMG_PATH + 'padlock.svg" width="22" height="26" alt="locked"></div>' +
    '</div>' +
    '<div class="cage-label">\uD83D\uDD12 In His Cage</div>';

  // ─── Wheel HTML (running state) ───
  var wheelHTML =
    '<div class="pinky-wheel-container">' +
      '<div class="hamster-wheel">' +
        '<div class="wheel-outer"></div>' +
        '<div class="wheel-rungs">' +
          '<div class="wheel-rung"></div><div class="wheel-rung"></div><div class="wheel-rung"></div>' +
          '<div class="wheel-rung"></div><div class="wheel-rung"></div><div class="wheel-rung"></div>' +
        '</div>' +
        '<div class="wheel-inner-track"></div>' +
        '<div class="running-mouse-wrapper">' +
          '<svg class="running-mouse" viewBox="0 0 60 35" fill="none">' +
            '<ellipse cx="28" cy="20" rx="18" ry="12" fill="#ff69b4"/>' +
            '<circle cx="48" cy="16" r="10" fill="#ff69b4"/>' +
            '<circle cx="52" cy="8" r="6" fill="#ff69b4"/>' +
            '<circle cx="52" cy="8" r="3.5" fill="#ffb6d9"/>' +
            '<circle cx="52" cy="14" r="2" fill="#333"/>' +
            '<circle cx="52.8" cy="13.3" r="0.7" fill="#fff"/>' +
            '<circle cx="57" cy="17" r="1.8" fill="#ff1493"/>' +
            '<g class="mouse-tail"><path d="M10 18 Q2 10 5 4" stroke="#ff69b4" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>' +
            '<g class="mouse-front-legs">' +
              '<line x1="38" y1="28" x2="42" y2="34" stroke="#ff69b4" stroke-width="3" stroke-linecap="round"/>' +
              '<line x1="34" y1="29" x2="37" y2="34" stroke="#ff69b4" stroke-width="3" stroke-linecap="round"/>' +
            '</g>' +
            '<g class="mouse-back-legs">' +
              '<line x1="20" y1="28" x2="16" y2="34" stroke="#ff69b4" stroke-width="3" stroke-linecap="round"/>' +
              '<line x1="24" y1="29" x2="21" y2="34" stroke="#ff69b4" stroke-width="3" stroke-linecap="round"/>' +
            '</g>' +
            '<line x1="55" y1="15" x2="60" y2="13" stroke="#333" stroke-width="0.8"/>' +
            '<line x1="55" y1="18" x2="60" y2="19" stroke="#333" stroke-width="0.8"/>' +
          '</svg>' +
        '</div>' +
        '<div class="spark"></div><div class="spark"></div><div class="spark"></div>' +
      '</div>' +
      '<div class="speed-lines">' +
        '<div class="spd-line"></div><div class="spd-line"></div><div class="spd-line"></div>' +
      '</div>' +
      '<div class="wheel-stand-group">' +
        '<img src="' + IMG_PATH + 'wheel-stand.svg" width="80" height="25" alt="">' +
      '</div>' +
    '</div>' +
    '<div class="wheel-label" style="margin-left:45px">\u26A1 Running on His Wheel!</div>';

  // ─── Loader HTML (any size: sm, md, lg) ───
  function loaderHTML(size) {
    size = size || 'md';
    var wheelSVG =
      '<svg viewBox="0 0 100 100" fill="none">' +
        '<circle cx="50" cy="50" r="46" stroke="#7850ff" stroke-width="3" opacity="0.85"/>' +
        '<circle cx="50" cy="50" r="38" stroke="#7850ff" stroke-width="1.5" opacity="0.3"/>' +
        '<line x1="50" y1="4" x2="50" y2="96" stroke="#7850ff" stroke-width="2" opacity="0.35"/>' +
        '<line x1="4" y1="50" x2="96" y2="50" stroke="#7850ff" stroke-width="2" opacity="0.35"/>' +
        '<line x1="17" y1="17" x2="83" y2="83" stroke="#7850ff" stroke-width="1.5" opacity="0.28"/>' +
        '<line x1="83" y1="17" x2="17" y2="83" stroke="#7850ff" stroke-width="1.5" opacity="0.28"/>' +
        '<line x1="27" y1="5" x2="73" y2="95" stroke="#7850ff" stroke-width="1" opacity="0.18"/>' +
        '<line x1="73" y1="5" x2="27" y2="95" stroke="#7850ff" stroke-width="1" opacity="0.18"/>' +
        '<circle cx="50" cy="50" r="5" fill="#7850ff" opacity="0.35"/>' +
        '<circle cx="50" cy="50" r="2.5" fill="#00ffc8" opacity="0.3"/>' +
      '</svg>';

    var mouseSVG =
      '<svg viewBox="0 0 30 22" fill="none">' +
        '<ellipse cx="14" cy="13" rx="9" ry="7" fill="#ff69b4"/>' +
        '<circle cx="23" cy="10" r="5.5" fill="#ff69b4"/>' +
        '<circle cx="25.5" cy="5.5" r="3" fill="#ff69b4"/>' +
        '<circle cx="25.5" cy="5.5" r="1.8" fill="#ffb6d9"/>' +
        '<circle cx="25" cy="9" r="1.2" fill="#333"/>' +
        '<circle cx="25.8" cy="8.5" r="0.4" fill="#fff"/>' +
        '<circle cx="28" cy="11" r="1.2" fill="#ff1493"/>' +
        '<path d="M4 12 Q1 7 3 3" stroke="#ff69b4" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</svg>';

    return '<div class="mouse-loader ' + size + '">' +
      '<div class="loader-neon-ring"></div>' +
      '<div class="loader-wheel-wrap">' + wheelSVG + '</div>' +
      '<div class="loader-mouse-wrap">' + mouseSVG + '</div>' +
    '</div>';
  }

  // ─── Inject animation into dropdown ───
  function injectAnimationContainer() {
    var dropdown = document.querySelector('.pinky-control-dropdown') ||
                   document.getElementById('pinky-control-panel');
    if (!dropdown || document.getElementById('pinky-animation-container')) return;

    var wrapper = document.createElement('div');
    wrapper.id = 'pinky-animation-container';
    wrapper.className = 'pinky-control-animation-wrapper';
    wrapper.innerHTML = '<div class="pinky-state-animation">' + wheelHTML + '</div>';
    dropdown.insertBefore(wrapper, dropdown.firstChild);
  }

  // ─── Update cage/wheel state ───
  function updatePinkyAnimation(isPaused) {
    var container = document.getElementById('pinky-animation-container');
    if (!container) { injectAnimationContainer(); container = document.getElementById('pinky-animation-container'); }
    if (!container) return;
    var inner = container.querySelector('.pinky-state-animation');
    if (!inner) return;
    inner.innerHTML = isPaused ? cageHTML : wheelHTML;
  }

  // ─── Monitor localStorage for state changes ───
  function monitorState() {
    var isPaused = localStorage.getItem('pinky_paused') === 'true';
    updatePinkyAnimation(isPaused);
    var lastState = isPaused;
    setInterval(function() {
      var current = localStorage.getItem('pinky_paused') === 'true';
      if (current !== lastState) { lastState = current; updatePinkyAnimation(current); }
    }, 1000);
  }

  // ─── Global API ───
  window.PinkyAnimations = {
    showCage: function() { updatePinkyAnimation(true); },
    showWheel: function() { updatePinkyAnimation(false); },
    loaderHTML: loaderHTML,
    injectContainer: injectAnimationContainer
  };

  // ─── Init ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorState);
  } else {
    monitorState();
  }
})();
