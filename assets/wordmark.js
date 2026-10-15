// Wordmark animation: the dot of each "i" (Danit, Simon) hops from letter to letter in a loop.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = document.createElement('canvas').getContext('2d');
  var words = [];

  function setup(word, delay) {
    var text = word.textContent;
    var idx = text.indexOf('i');
    if (idx < 0 || word.dataset.wm) return;
    word.dataset.wm = '1';
    word.setAttribute('aria-label', text);
    word.textContent = '';
    word.style.position = 'relative';
    word.style.display = 'inline-block';
    var letters = Array.prototype.map.call(text, function (ch, k) {
      var s = document.createElement('span');
      s.textContent = k === idx ? 'ı' : ch;
      s.setAttribute('aria-hidden', 'true');
      word.appendChild(s);
      return s;
    });
    var base = document.createElement('span');
    base.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    word.appendChild(base);
    var dot = document.createElement('span');
    dot.className = 'wm-dot';
    dot.setAttribute('aria-hidden', 'true');
    word.appendChild(dot);
    words.push({ word: word, text: text, idx: idx, letters: letters, base: base, dot: dot, delay: delay, anim: null });
  }

  function build(w) {
    if (w.anim) w.anim.cancel();
    var cs = getComputedStyle(w.word);
    var fs = parseFloat(cs.fontSize);
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var asc = function (c) { return ctx.measureText(c).actualBoundingBoxAscent; };
    var iTop = asc('i'), xh = asc('ı');
    var d = Math.max(4, (iTop - xh) * 0.6);
    w.dot.style.width = w.dot.style.height = d + 'px';
    var wr = w.word.getBoundingClientRect();
    var baseY = w.base.getBoundingClientRect().top - wr.top;
    var slant = 0.2, gap = (iTop - xh) - d;
    var pts = w.letters.map(function (l, k) {
      var r = l.getBoundingClientRect();
      var above = k === w.idx ? iTop : Math.max(xh, asc(w.text[k])) + gap + d; // dot top, above baseline
      var mid = above - d / 2;
      var cx = r.left - wr.left + r.width / 2 + slant * (mid - xh / 2);
      return { x: cx - d / 2, y: baseY - above };
    });
    if (reduce) {
      w.dot.style.transform = 'translate(' + pts[w.idx].x + 'px,' + pts[w.idx].y + 'px)';
      return;
    }
    // Path: home i, out to the last letter, back to the first, then home.
    var n = pts.length, path = [];
    for (var k = w.idx; k < n; k++) path.push(k);
    for (k = n - 2; k >= 0; k--) path.push(k);
    for (k = 1; k <= w.idx; k++) path.push(k);
    var HOLD = 1600, HOP = 240, REST = 50;
    var total = HOLD + (path.length - 1) * (HOP + REST);
    var t = 0, frames = [];
    var at = function (p, extra) {
      var f = { transform: 'translate(' + p.x + 'px,' + p.y + 'px)', offset: Math.min(1, t / total) };
      for (var key in extra) f[key] = extra[key];
      frames.push(f);
    };
    at(pts[path[0]], { easing: 'linear' });
    t += HOLD;
    at(pts[path[0]], { easing: 'ease-out' });
    for (var j = 1; j < path.length; j++) {
      var a = pts[path[j - 1]], b = pts[path[j]];
      t += HOP / 2;
      at({ x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - fs * 0.22 }, { easing: 'ease-in' });
      t += HOP / 2;
      at(b, { easing: 'linear' });
      t += REST;
      if (j < path.length - 1) at(b, { easing: 'ease-out' });
    }
    frames[frames.length - 1].offset = 1;
    w.anim = w.dot.animate(frames, { duration: total, iterations: Infinity, delay: w.delay });
  }

  function init() {
    var all = document.querySelectorAll('.brand .wm-1, .brand .wm-3');
    Array.prototype.forEach.call(all, function (el, i) { setup(el, (i % 2) * 900); });
    words.forEach(build);
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { words.forEach(build); }, 150);
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else window.addEventListener('load', init);
})();
