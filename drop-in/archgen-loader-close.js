/* Archgen loader: Close. Load as the first thing inside <body>, with archgen-loader.css in <head>. */
/* The Archgen mark, from Brand Identity/Logos/archgen-mark-ink-pin.svg, unchanged. */
var AG_MARK = "M202.35 46.42Q201.77 44.94 201.33 43.41Q200.89 41.89 200.59 40.32Q200.3 38.76 200.15 37.18Q200 35.59 200 34Q200 27.24 202.59 20.99Q205.18 14.74 209.96 9.96Q214.74 5.18 220.99 2.59Q227.24 0 234 0Q238.18 0 242.23 1.01Q246.28 2.02 249.97 3.98Q253.66 5.94 256.76 8.74Q259.86 11.54 262.2 15L610.8 15Q613.14 11.54 616.24 8.74Q619.34 5.94 623.03 3.98Q626.72 2.02 630.77 1.01Q634.82 0 639 0Q645.76 0 652.01 2.59Q658.26 5.18 663.04 9.96Q667.82 14.74 670.41 20.99Q673 27.24 673 34Q673 40.76 670.41 47.01Q667.82 53.26 663.04 58.04Q658.26 62.82 652.01 65.41Q645.76 68 639 68Q634.82 68 630.77 66.99Q626.72 65.98 623.03 64.02Q619.34 62.06 616.24 59.26Q613.14 56.46 610.8 53L262.2 53Q259.86 56.46 256.76 59.26Q253.66 62.06 249.97 64.02Q246.28 65.98 242.23 66.99Q238.18 68 234 68Q233.95 68 233.91 68Q233.86 68 233.82 68Q233.77 68 233.73 68Q233.68 68 233.63 68L65.65 311.58Q66.23 313.06 66.67 314.59Q67.11 316.11 67.41 317.68Q67.7 319.24 67.85 320.83Q68 322.41 68 324Q68 330.76 65.41 337.01Q62.82 343.26 58.04 348.04Q53.26 352.82 47.01 355.41Q40.76 358 34 358Q27.24 358 20.99 355.41Q14.74 352.82 9.96 348.04Q5.18 343.26 2.59 337.01Q0 330.76 0 324Q0 317.24 2.59 310.99Q5.18 304.74 9.96 299.96Q14.74 295.18 20.99 292.59Q27.24 290 34 290Q34.05 290 34.09 290Q34.14 290 34.18 290Q34.23 290 34.27 290Q34.32 290 34.37 290L202.35 46.42ZM702 162Q709.96 162 717.31 158.96Q724.66 155.91 730.28 150.28Q735.91 144.66 738.96 137.31Q742 129.96 742 122Q742 114.04 738.96 106.69Q735.91 99.34 730.28 93.72Q724.66 88.09 717.31 85.04Q709.96 82 702 82Q696.59 82 691.37 83.44Q686.15 84.88 681.51 87.65Q676.86 90.42 673.11 94.33Q669.37 98.24 666.8 103L344.92 103L303.93 174L439.03 408L678.8 408Q681.37 412.76 685.11 416.67Q688.86 420.58 693.51 423.35Q698.15 426.12 703.37 427.56Q708.59 429 714 429Q721.96 429 729.31 425.96Q736.66 422.91 742.28 417.28Q747.91 411.66 750.96 404.31Q754 396.96 754 389Q754 383.59 752.56 378.37Q751.12 373.15 748.35 368.51Q745.58 363.86 741.67 360.11Q737.76 356.37 733 353.8L733 227L597 227L597 265L695 265L695 353.8Q692.44 355.18 690.11 356.92Q687.77 358.66 685.72 360.72Q683.66 362.77 681.92 365.11Q680.18 367.44 678.8 370L460.97 370L347.81 174L366.86 141L666.8 141Q669.37 145.76 673.11 149.67Q676.86 153.58 681.51 156.35Q686.15 159.12 691.37 160.56Q696.59 162 702 162ZM252.55 272.92Q253.4 271.18 254.05 269.36Q254.69 267.54 255.13 265.66Q255.56 263.77 255.78 261.85Q256 259.93 256 258Q256 251.24 253.41 244.99Q250.82 238.74 246.04 233.96Q241.26 229.18 235.01 226.59Q228.76 224 222 224Q215.24 224 208.99 226.59Q202.74 229.18 197.96 233.96Q193.18 238.74 190.59 244.99Q188 251.24 188 258Q188 264.46 190.37 270.46Q192.73 276.47 197.14 281.19Q201.54 285.91 207.37 288.69Q213.2 291.47 219.64 291.92L278.05 393.08Q277.2 394.82 276.56 396.64Q275.91 398.46 275.48 400.34Q275.04 402.23 274.82 404.15Q274.6 406.07 274.6 408Q274.6 414.76 277.19 421.01Q279.78 427.26 284.56 432.04Q289.34 436.82 295.59 439.41Q301.84 442 308.6 442Q315.37 442 321.61 439.41Q327.86 436.82 332.64 432.04Q337.43 427.26 340.01 421.01Q342.6 414.76 342.6 408Q342.6 401.54 340.24 395.54Q337.87 389.53 333.46 384.81Q329.06 380.09 323.23 377.31Q317.4 374.53 310.96 374.08L252.55 272.92Z";

/*
 * Archgen loaders: the core.
 * One clock per loader. Every loader is a pure render(t) of milliseconds since
 * mount, so a frame can be replayed, skipped from where it is, or seeked in a test.
 * Budget: every loader is gone by 1.2s after mount. Reduced motion: the finished
 * frame, held, then a 200ms fade. A click, tap or key skips from the current frame.
 */
(function (g) {
  "use strict";

  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sx(t) { return ((ax * t + bx) * t + cx) * t; }
    function sy(t) { return ((ay * t + by) * t + cy) * t; }
    function dx(t) { return (3 * ax * t + 2 * bx) * t + cx; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x, i, d;
      for (i = 0; i < 8; i++) {
        d = sx(t) - x;
        if (Math.abs(d) < 1e-6) return sy(t);
        var s = dx(t);
        if (Math.abs(s) < 1e-6) break;
        t -= d / s;
      }
      var lo = 0, hi = 1;
      t = x;
      for (i = 0; i < 40; i++) {
        d = sx(t);
        if (Math.abs(d - x) < 1e-6) break;
        if (d < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }

  /* The site's own curves: arrive on (.16,1,.3,1), leave on (.7,0,.84,0). */
  var ease = {
    out: bezier(0.16, 1, 0.3, 1),
    in: bezier(0.7, 0, 0.84, 0),
    inOut: bezier(0.65, 0, 0.35, 1),
    std: bezier(0.4, 0, 0.2, 1)
  };

  /* Apple's two-parameter spring: damping ratio and response (seconds). */
  function spring(ms, damping, response) {
    var t = ms / 1000;
    if (t <= 0) return 0;
    var w = (2 * Math.PI) / response;
    if (damping >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
    var wd = w * Math.sqrt(1 - damping * damping);
    return 1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + ((damping * w) / wd) * Math.sin(wd * t));
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, start, dur, fn) {
    var p = clamp((t - start) / dur, 0, 1);
    return fn ? fn(p) : p;
  }
  function lerp(a, b, p) { return a + (b - a) * p; }
  var uidN = 0;
  function uid(p) { uidN += 1; return p + "-" + uidN; }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mix(a, b, p) {
    return "rgb(" + Math.round(lerp(a[0], b[0], p)) + "," + Math.round(lerp(a[1], b[1], p)) + "," + Math.round(lerp(a[2], b[2], p)) + ")";
  }

  var H = { ease: ease, spring: spring, seg: seg, lerp: lerp, clamp: clamp, uid: uid, hex: hex, mix: mix, bezier: bezier };
  var defs = {};

  function reducedMotion() {
    try { return g.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }

  function mount(kind, opts) {
    opts = opts || {};
    var def = defs[kind];
    if (!def) throw new Error("archgen loader: unknown kind " + kind);
    var doc = g.document;
    var host = opts.host || doc.body || doc.documentElement;
    var boxed = host !== doc.body && host !== doc.documentElement;
    var started = g.performance.now();
    var reduced = opts.reduced != null ? !!opts.reduced : reducedMotion();

    var el = doc.createElement("div");
    el.className = "agl agl--" + def.theme;
    el.setAttribute("data-kind", kind);
    el.setAttribute("data-host", boxed ? "box" : "page");
    el.setAttribute("role", "status");
    el.innerHTML = '<span class="agl-sr">Loading Archgen Labs</span>';
    host.insertBefore(el, host.firstChild);
    if (!boxed) doc.documentElement.classList.add("agl-lock");

    var api = def.build(el, H, { reduced: reduced, boxed: boxed });
    var raf = 0, done = false, paused = false, skipAt = -1, frozen = 0, last = 0, safety = 0;
    var resolveDone;
    var finished = new Promise(function (r) { resolveDone = r; });

    function finish() {
      if (done) return;
      done = true;
      if (raf) g.cancelAnimationFrame(raf);
      g.clearTimeout(safety);
      off();
      if (api.destroy) api.destroy();
      if (el.parentNode) el.parentNode.removeChild(el);
      if (!boxed) doc.documentElement.classList.remove("agl-lock");
      var ms = g.performance.now() - started;
      var detail = { kind: kind, ms: ms, reduced: reduced, skipped: skipAt >= 0 };
      ctl.result = detail;
      try { host.dispatchEvent(new CustomEvent("archgen:loaded", { bubbles: true, detail: detail })); } catch (e) {}
      if (opts.onDone) opts.onDone(detail);
      resolveDone(detail);
    }

    function step(t) {
      last = t;
      if (reduced) {
        api.render(api.exitAt, true);
        el.style.opacity = String(1 - seg(t, 260, 200, ease.std));
        if (t >= 460) finish();
        return;
      }
      if (skipAt >= 0) {
        api.render(frozen);
        el.style.opacity = String(1 - seg(t, skipAt, 180, ease.std));
        if (t >= skipAt + 180) finish();
        return;
      }
      api.render(t);
      if (t >= api.end) finish();
    }

    function frame(now) {
      raf = 0;
      if (done || paused) return;
      step(Math.max(0, now - started));
      if (!done) raf = g.requestAnimationFrame(frame);
    }

    /* Skip: from the frame on screen, never from a jump to the end. */
    function skip() {
      if (done || reduced || skipAt >= 0 || last >= api.exitAt) return;
      frozen = last;
      skipAt = last;
    }
    function onKey(e) { if (!e.metaKey && !e.ctrlKey && !e.altKey) skip(); }
    el.addEventListener("pointerdown", skip);
    if (!boxed) g.addEventListener("keydown", onKey);
    function off() {
      el.removeEventListener("pointerdown", skip);
      if (!boxed) g.removeEventListener("keydown", onKey);
    }

    var ctl = {
      el: el,
      kind: kind,
      end: api.end,
      exitAt: api.exitAt,
      finished: finished,
      result: null,
      skip: skip,
      /* for tests: hold the clock and draw the frame at t */
      seek: function (t) {
        paused = true;
        if (raf) g.cancelAnimationFrame(raf);
        raf = 0;
        g.clearTimeout(safety);
        api.render(t);
      },
      destroy: finish
    };

    step(0);
    raf = g.requestAnimationFrame(frame);
    /* a background tab stalls frames: never leave the page behind a loader */
    safety = g.setTimeout(finish, (reduced ? 460 : api.end) + 1500);
    return ctl;
  }

  g.ArchgenLoader = { define: function (k, d) { defs[k] = d; }, mount: mount, kinds: function () { return Object.keys(defs); }, H: H };
})(window);


/*
 * Close. The number the home page ends on: CORE2's worst slack climbs from
 * −0.185 ns to +0.003 ns, the run from the agent's own log. Red while it fails,
 * paper once it holds. "Closed" takes the red as its full stop, and the dark
 * stage closes into that one red pin.
 */
ArchgenLoader.define("close", {
  theme: "ink",
  build: function (el, H) {
    var wrap = document.createElement("div");
    wrap.className = "agl-close";
    wrap.innerHTML =
      '<div class="num"><span class="n">−0.185</span><span class="u">ns</span></div>' +
      '<div class="line"><span class="a">CORE2 worst slack</span><span class="b">CORE2 closed<i class="pin"></i></span></div>';
    el.appendChild(wrap);
    var num = wrap.querySelector(".num"), n = wrap.querySelector(".n");
    var a = wrap.querySelector(".a"), b = wrap.querySelector(".b"), pin = wrap.querySelector(".pin");
    var FROM = -0.185, TO = 0.003, COUNT = 580;
    var EXIT = 780, END = 1120;
    var shown = "", passing = null, iris = null;

    function fmt(v) {
      var r = Math.round(v * 1000) / 1000;
      if (Math.abs(r) < 0.0005) return "0.000";
      return (r < 0 ? "−" : "+") + Math.abs(r).toFixed(3);
    }

    return {
      exitAt: EXIT,
      end: END,
      render: function (t) {
        var v = H.lerp(FROM, TO, H.seg(t, 0, COUNT, H.ease.out));
        var s = fmt(v);
        if (s !== shown) { shown = s; n.textContent = s; }
        var ok = v >= 0;
        if (ok !== passing) { passing = ok; num.style.color = ok ? "#E8EDF1" : ""; }
        var c = H.spring(t - 580, 1, 0.3);
        a.style.opacity = String(1 - H.seg(t, 530, 60));
        b.style.opacity = String(H.seg(t, 580, 100));
        b.style.transform = "translate3d(0," + (10 * (1 - c)).toFixed(2) + "px,0)";
        pin.style.transform = "scale(" + (t < 610 ? 0 : 0.3 + 0.7 * H.spring(t - 610, 1, 0.2)).toFixed(4) + ")";

        if (t <= EXIT) { el.style.clipPath = ""; iris = null; return; }
        /* the iris: measured once, from where the pin sits when the exit starts */
        if (!iris) {
          var r0 = el.getBoundingClientRect(), p = pin.getBoundingClientRect();
          var cx = p.left + p.width / 2 - r0.left, cy = p.top + p.height / 2 - r0.top;
          var R = Math.max(Math.hypot(cx, cy), Math.hypot(r0.width - cx, cy), Math.hypot(cx, r0.height - cy), Math.hypot(r0.width - cx, r0.height - cy));
          iris = { cx: cx, cy: cy, R: R };
        }
        var e = H.seg(t, EXIT, END - EXIT, H.ease.in);
        el.style.clipPath = "circle(" + (iris.R * (1 - e)).toFixed(2) + "px at " + iris.cx.toFixed(1) + "px " + iris.cy.toFixed(1) + "px)";
      }
    };
  }
});

(function () {
  try { if (sessionStorage.getItem("agl-seen")) return; sessionStorage.setItem("agl-seen", "1"); } catch (e) {}
  ArchgenLoader.mount("close");
})();
