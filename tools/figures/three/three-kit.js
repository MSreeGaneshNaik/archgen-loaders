/* Archgen blog figures in 3D (Three.js r158, tree-shaken and vendored at assets/vendor/three.min.js, MIT).
   Each card first shows a still poster rendered from this same scene at its first frame (tools/figures/posters.mjs);
   on a capable GPU the live scene draws that same frame on a canvas over it and fades in, so the swap is invisible.
   Three is fetched only when a figure nears the screen. Plain classic script: works over http
   and when a post is opened straight from disk (file://). Source: tools/figures/three/three-kit.js.

   Model space is the one the figures were designed in: x, y on the floor, z up, one unit about one pixel of the drawing.
   Three space is y-up; a model point (x, y, z) sits at (x, z, y).

   Colour, strictly from the site's :root tokens, in a 60/30/10 split: ice-paper bodies (--surface, --surface-2, --ink-2),
   slate structure that anchors each machine (--slate, --graphite, --steel), and the brand red (--flare, --signal) only on
   the objects the figure is about and on the lamp of the agent at work.

   Sections:  1. LOADING   fetch three on demand; only a real GPU gets the live scene
              2. PARTS     kitFor(T): palette materials and part builders (slab, cyl, bar, basePlate, dialGauge)
              3. MOUNT     mount(): renderer, light, framing, the turn on one vertical axis, the frame loop, the input
              4. API       window.AG3D.figure(id, spec), called by each blog/figures/<slug>.3d.js */
(function () {
  "use strict";
  /* ---------- 1. LOADING ---------- */
  var me = document.currentScript;
  var THREE_URL = new URL("../../assets/vendor/three.min.js", me ? me.src : location.href).href;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var loading = null;

  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (loading) return loading;
    loading = new Promise(function (ok, no) {
      var s = document.createElement("script");
      s.src = THREE_URL; s.async = true;
      s.onload = function () { window.THREE ? ok(window.THREE) : no(new Error("three missing")); };
      s.onerror = no;
      document.head.appendChild(s);
    });
    return loading;
  }
  // ?ag3d=force runs the 3D figures even on a software renderer (headless testing); ?ag3d=poster renders the still poster
  var POSTER = /[?&]ag3d=poster/.test(location.search);
  var FORCE = POSTER || /[?&]ag3d=force/.test(location.search);
  // only a real GPU gets the 3D figures: a software renderer (SwiftShader, llvmpipe) would spend the whole main thread on them
  function webgl() {
    try {
      var c = document.createElement("canvas"), o = { failIfMajorPerformanceCaveat: !FORCE };
      var gl = window.WebGLRenderingContext && (c.getContext("webgl2", o) || c.getContext("webgl", o));
      if (!gl) return false;
      if (FORCE) return true;
      var info = gl.getExtension("WEBGL_debug_renderer_info");
      var name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
      var lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext();
      return !/swiftshader|llvmpipe|software|softpipe|basic render/i.test(name);
    } catch (e) { return false; }
  }

  /* ---------- 2. PARTS: rounded slabs, cylinders, bars, edges, the site palette ---------- */
  function kitFor(T) {
    var V = function (x, y, z) { return new T.Vector3(x, z, y); };
    var C = function (hex) { return new T.Color(hex); };
    // the site's palette: ice paper and steel bodies, slate structure, ink details, the brand red on the objects that matter
    var mats = {
      paper: new T.MeshStandardMaterial({ color: C("#F7FAFB"), roughness: 0.82, metalness: 0.0 }),     // --surface: base plates, sheets
      body: new T.MeshStandardMaterial({ color: C("#DDE5EA"), roughness: 0.66, metalness: 0.04 }),      // --ink-2: frames, posts, beams
      panel: new T.MeshStandardMaterial({ color: C("#EDF2F5"), roughness: 0.7, metalness: 0.02 }),      // --surface-2: cases, trays, cabinets
      ice: new T.MeshStandardMaterial({ color: C("#CCDBE2"), roughness: 0.5, metalness: 0.12 }),        // --ice: secondary blocks
      steel: new T.MeshStandardMaterial({ color: C("#738A9A"), roughness: 0.32, metalness: 0.55 }),     // --steel: rods, rollers, pins
      graphite: new T.MeshStandardMaterial({ color: C("#636D7D"), roughness: 0.5, metalness: 0.3 }),    // --graphite
      slate: new T.MeshStandardMaterial({ color: C("#435565"), roughness: 0.52, metalness: 0.22 }),     // --slate: tool heads, housings, feet
      ink: new T.MeshStandardMaterial({ color: C("#0E1317"), roughness: 0.45, metalness: 0.2 }),        // --paper (ink): fine details
      chrome: new T.MeshStandardMaterial({ color: C("#CCDBE2"), roughness: 0.16, metalness: 0.85 }),    // --ice, polished: screws, collars
      red: new T.MeshStandardMaterial({ color: C("#D65148"), roughness: 0.4, metalness: 0.06, emissive: C("#D65148"), emissiveIntensity: 0 }), // --flare
      redDeep: new T.MeshStandardMaterial({ color: C("#A8392F"), roughness: 0.38, metalness: 0.1 }),   // --signal
      glass: new T.MeshStandardMaterial({ color: C("#F7FAFB"), roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.3 }),
      lamp: new T.MeshStandardMaterial({ color: C("#EEF3F6"), roughness: 0.3, emissive: C("#D65148"), emissiveIntensity: 0 }), // --on-slate, lit --flare
    };
    var lineMat = new T.LineBasicMaterial({ color: C("#435565"), transparent: true, opacity: 0.3 });
    var lineRed = new T.LineBasicMaterial({ color: C("#A8392F"), transparent: true, opacity: 0.55 });

    function edges(mesh, mat, angle) {
      var l = new T.LineSegments(new T.EdgesGeometry(mesh.geometry, angle || 28), mat || (mesh.material && mesh.material.userData.red ? lineRed : lineMat));
      l.raycast = function () {};
      mesh.add(l);
      return mesh;
    }
    mats.red.userData.red = mats.redDeep.userData.red = true;

    function shapeOf(w, d, r) {
      var s = new T.Shape(), x = -w / 2, y = -d / 2;
      r = Math.max(0.01, Math.min(r || 0.01, w / 2 - 0.01, d / 2 - 0.01));
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
      s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    var geoCache = {};
    /** a rounded slab: plan {x, y, w, d, r} in model units, from z up h, with a small bevel on the top and bottom edges */
    function slab(plan, z, h, mat, opts) {
      opts = opts || {};
      var b = Math.min(opts.bevel != null ? opts.bevel : 0.6, h / 3, plan.w / 4, plan.d / 4);
      var key = [plan.w, plan.d, plan.r || 0, h, b].map(function (n) { return n.toFixed(2); }).join(",");
      var g = geoCache[key];
      if (!g) {
        g = new T.ExtrudeGeometry(shapeOf(plan.w - 2 * b, plan.d - 2 * b, Math.max(0.01, (plan.r || 0) - b)), {
          depth: Math.max(0.01, h - 2 * b), bevelEnabled: b > 0.02, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 6,
        });
        g.translate(0, 0, b); g.rotateX(-Math.PI / 2);
        geoCache[key] = g;
      }
      var m = new T.Mesh(g, mat);
      m.position.copy(V(plan.x + plan.w / 2, plan.y + plan.d / 2, z));
      m.castShadow = opts.cast !== false; m.receiveShadow = true;
      if (opts.edges !== false) edges(m, null, 30);
      return m;
    }
    /** an upright cylinder centred on (x, y), from z up h */
    function cyl(x, y, r, z, h, mat, opts) {
      opts = opts || {};
      var seg = opts.seg || Math.max(16, Math.min(56, Math.round(r * 6)));
      var g = new T.CylinderGeometry(opts.top != null ? opts.top : r, r, h, seg);
      var m = new T.Mesh(g, mat);
      m.position.copy(V(x, y, z + h / 2));
      m.castShadow = opts.cast !== false; m.receiveShadow = true;
      if (opts.edges !== false) edges(m, null, 40);
      return m;
    }
    /** a box between two model points along any direction (arms, beams): from a to b, width w, height h, its base at a[2] */
    function bar(a, b, w, h, mat, opts) {
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      var m = slab({ x: -len / 2, y: -w / 2, w: len, d: w, r: (opts && opts.r) || 1.2 }, 0, h, mat, opts);
      var g = new T.Group(); g.add(m);
      m.position.set(0, 0, 0);
      g.position.copy(V((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]));
      g.rotation.y = -Math.atan2(dy, dx);
      return g;
    }

    /** the base plate every figure stands on: a bevelled slab on four feet, a groove inset, corner screws */
    function basePlate(PLATE, opt) {
      opt = opt || {};
      var g = new T.Group(), h = opt.h || 12, foot = opt.foot || 5;
      g.add(slab(PLATE, -h, h, mats.paper, { bevel: 1.6 }));
      var inset = { x: PLATE.x + 5, y: PLATE.y + 5, w: PLATE.w - 10, d: PLATE.d - 10, r: Math.max(1, PLATE.r - 5) };
      var groove = slab(inset, -0.05, 0.12, mats.panel, { bevel: 0, cast: false });
      g.add(groove);
      [[PLATE.x + 22, PLATE.y + 22], [PLATE.x + PLATE.w - 22, PLATE.y + 22], [PLATE.x + 22, PLATE.y + PLATE.d - 22], [PLATE.x + PLATE.w - 22, PLATE.y + PLATE.d - 22]].forEach(function (p) {
        g.add(cyl(p[0], p[1], 7, -h - foot, 1.6, mats.slate));
        g.add(cyl(p[0], p[1], 5.4, -h - foot + 1.6, foot - 1.6, mats.graphite));
      });
      [[PLATE.x + 10, PLATE.y + 10], [PLATE.x + PLATE.w - 10, PLATE.y + 10], [PLATE.x + 10, PLATE.y + PLATE.d - 10], [PLATE.x + PLATE.w - 10, PLATE.y + PLATE.d - 10]].forEach(function (p) {
        g.add(cyl(p[0], p[1], 1.6, 0, 0.5, mats.chrome, { edges: false }));
      });
      if (opt.ruler) {
        var R = opt.ruler;
        g.add(slab(R, 0, 0.6, mats.panel, { bevel: 0.2 }));
        var pts = [];
        for (var x = R.x + 3, i = 0; x < R.x + R.w - 2; x += 4, i++) { var len = i % 5 === 0 ? 3.2 : 1.6; pts.push(V(x, R.y + R.d - 0.6, 0.62), V(x, R.y + R.d - 0.6 - len, 0.62)); }
        var tg = new T.BufferGeometry().setFromPoints(pts);
        g.add(new T.LineSegments(tg, new T.LineBasicMaterial({ color: 0x435565, transparent: true, opacity: 0.7 })));
      }
      if (opt.label) g.add(slab(opt.label, 0, 0.5, mats.ice, { bevel: 0.2 }));
      return g;
    }
    /** a dial gauge on a post: case, glass, a ring of ticks, and a red needle you can turn with setValue(share 0..1) */
    function dialGauge(x, y, r, post, h) {
      var g = new T.Group();
      g.add(cyl(x, y, r * 0.38, 0, 2, mats.slate));
      g.add(cyl(x, y, r * 0.22, 2, post - 2, mats.steel));
      g.add(cyl(x, y, r, post, h, mats.slate, { seg: 64 }));
      g.add(cyl(x, y, r - 1.6, post + h - 0.4, 0.5, mats.paper, { seg: 64, edges: false }));
      var top = post + h + 0.15, pts = [];
      for (var i = 0; i <= 40; i++) {
        var a = -Math.PI * 0.75 + (i / 40) * Math.PI * 1.5, len = i % 5 === 0 ? 2.6 : 1.2, rr = r - 3;
        pts.push(V(x + Math.sin(a) * rr, y + Math.cos(a) * rr, top), V(x + Math.sin(a) * (rr - len), y + Math.cos(a) * (rr - len), top));
      }
      g.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x0E1317 })));
      var needle = new T.Group(); needle.position.copy(V(x, y, top + 0.2));
      var n = new T.Mesh(new T.BoxGeometry(0.7, 0.35, r - 4), mats.red); n.position.set(0, 0, -(r - 4) / 2 + 1.2); needle.add(n);
      needle.add(new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 0.8, 16), mats.ink));
      g.add(needle);
      var glass = cyl(x, y, r - 0.6, post + h, 0.6, mats.glass, { edges: false, cast: false, seg: 64 });
      g.add(glass);
      g.setValue = function (share) { var a = -Math.PI * 0.75 + Math.max(0, Math.min(1, share)) * Math.PI * 1.5; needle.rotation.y = a + Math.PI; };
      g.setValue(0);
      return g;
    }

    return { T: T, V: V, mats: mats, slab: slab, cyl: cyl, bar: bar, basePlate: basePlate, dialGauge: dialGauge };
  }

  /* ---------- 3. MOUNT: renderer, light, framing, a turn on the vertical axis that follows the pointer, click to pause ---------- */
  function mount(root, spec, T) {
    var plate = root.querySelector(".fig-plate");
    var readout = root.querySelector("[data-readout]");
    var K = kitFor(T);
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", failIfMajorPerformanceCaveat: !FORCE, preserveDrawingBuffer: POSTER }); }
    catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(0xF7FAFB, 1);   // the card's own colour: the canvas is opaque, so once faded in it fully covers the poster
    var canvas = renderer.domElement;
    canvas.className = "ag3d-canvas";
    canvas.setAttribute("aria-hidden", "true");

    var scene = new T.Scene();
    var world = spec.build(K);
    scene.add(world.root);
    world.root.updateMatrixWorld(true);

    // light: a soft sky over a cool floor, a warm key from the upper left that casts the shadows, a cool rim from behind
    scene.add(new T.HemisphereLight(0xF7FAFB, 0xD2DCE2, 1.6));
    var key = new T.DirectionalLight(0xfff6f0, 2.1);
    var size = spec.size || 200;
    key.position.set(-size * 0.7, size * 1.5, size * 0.9);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    var sc = key.shadow.camera; sc.left = -size * 1.1; sc.right = size * 1.1; sc.top = size * 1.1; sc.bottom = -size * 1.1; sc.near = 10; sc.far = size * 5;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6; key.shadow.radius = 4;
    scene.add(key);
    var rim = new T.DirectionalLight(0xdfe9f0, 0.7); rim.position.set(size, size * 0.6, -size); scene.add(rim);
    // the shadow lands on an invisible floor under the feet
    var floor = new T.Mesh(new T.PlaneGeometry(size * 6, size * 6), new T.ShadowMaterial({ color: 0x435565, opacity: 0.2 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -17;   // the base plates' feet stand at z = -17
    floor.receiveShadow = true;
    scene.add(floor);

    // the machine turns on one fixed axis, the vertical through its centre, like a part on a turntable: the camera stays put,
    // so light and shadows stay where they are and the machine swings under them
    var box = new T.Box3().setFromObject(world.root), centre = box.getCenter(new T.Vector3()), radius = box.getBoundingSphere(new T.Sphere()).radius;
    var pivot = new T.Group(); pivot.position.copy(centre);
    scene.remove(world.root); world.root.position.sub(centre); pivot.add(world.root); scene.add(pivot);
    var fov = 22, cam = new T.PerspectiveCamera(fov, 600 / 380, 1, radius * 20);
    var el = (spec.el || 30) * Math.PI / 180, az = (spec.az || 60) * Math.PI / 180;
    // frame the machine: measure where its bounding box lands on screen over the whole range it can turn through, then set
    // the distance so it fills the card with an even margin, and shift the view so it sits dead centre between the corner labels
    var corners = [];
    [box.min.x, box.max.x].forEach(function (x) { [box.min.y, box.max.y].forEach(function (y) { [box.min.z, box.max.z].forEach(function (z) {
      corners.push(new T.Vector3(x - centre.x, y - centre.y, z - centre.z));
    }); }); });
    var TURNS = [-12, -6, 0, 6, 12].map(function (d) { return d * Math.PI / 180; });
    function bounds(only) {
      cam.updateMatrixWorld(); var b = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 }, v = new T.Vector3();
      (only != null ? [only] : TURNS).forEach(function (a) {
        var c = Math.cos(a), s = Math.sin(a);
        corners.forEach(function (p) {
          v.set(p.x * c + p.z * s, p.y, -p.x * s + p.z * c).add(centre).project(cam);
          b.x0 = Math.min(b.x0, v.x); b.x1 = Math.max(b.x1, v.x); b.y0 = Math.min(b.y0, v.y); b.y1 = Math.max(b.y1, v.y);
        });
      });
      return b;
    }
    function fit() {
      cam.clearViewOffset();
      var dist = radius / Math.sin(fov * Math.PI / 360);
      var put = function () {
        cam.position.set(centre.x + dist * Math.cos(el) * Math.cos(az), centre.y + dist * Math.sin(el), centre.z + dist * Math.cos(el) * Math.sin(az));
        cam.lookAt(centre);
      };
      put();
      // through its usual swing the machine fills 94% of the card's width or 80% of its height (the corner labels keep a
      // thin band at the top and bottom), whichever comes first
      for (var k = 0; k < 4; k++) {
        var b = bounds(), sx = (b.x1 - b.x0) / (2 * 0.94), sy = (b.y1 - b.y0) / (2 * 0.8);
        dist *= Math.max(sx, sy); put();
      }
      // centred on how it sits at rest
      var f = bounds(0), w = renderer.domElement.width, h = renderer.domElement.height;
      cam.setViewOffset(w, h, ((f.x0 + f.x1) / 2) * w / 2, -((f.y0 + f.y1) / 2) * h / 2, w, h);
    }
    function resize() {
      var w = plate.clientWidth || 600, h = plate.clientHeight || Math.round(w * 0.8);
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix(); fit();
    }

    // rotation = a slow idle swing + where the pointer is across the card + any drag, all about the vertical axis
    var SWING = 8, FOLLOW = 26;
    var hoverX = null, follow = 0, swingAmp = 1, dragAz = 0, turn = 0;
    function turnAt(t, dt) {
      var k = 1 - Math.exp(-dt / 0.22);
      follow += ((hoverX == null ? 0 : (hoverX - 0.5) * 2 * FOLLOW) - follow) * k;
      swingAmp += ((hoverX == null ? 1 : 0.25) - swingAmp) * (1 - Math.exp(-dt / 0.6));
      var swing = reduce.matches ? 0 : Math.sin(t * 0.24) * SWING * swingAmp;
      turn = (swing + follow + dragAz) * Math.PI / 180;
      pivot.rotation.y = turn;
    }

    var clock = 0, last = 0, frame = 0, visible = false, paused = false, shown = false, realDt = 1 / 60;
    function draw() {
      var text = world.update(clock);
      if (readout && text && readout.textContent !== text) readout.textContent = text;
      turnAt(clock, realDt);
      renderer.render(scene, cam);
      if (!shown) {
        shown = true;
        plate.insertBefore(canvas, plate.firstChild.nextSibling);   // over the poster, under the corner labels
        void canvas.offsetWidth;   // style the canvas at opacity 0 now, so adding is-3d below runs the fade
        // fade in on the next frame, once the canvas holds the same picture as the poster
        requestAnimationFrame(function () { root.classList.add("is-3d"); });
        // once the fade is done the poster underneath is hidden, so the page composites one layer, not two
        canvas.addEventListener("transitionend", function () { if (root.classList.contains("is-3d")) root.classList.add("is-live"); }, { once: true });
        var hint = root.querySelector('[data-corner="hint"]');
        if (hint && !POSTER) hint.textContent = "Move to turn · click to pause";
        if (POSTER) window.__agPoster = { readout: readout ? readout.textContent : "" };
      }
    }
    // keep it smooth: watch the real frame time; step the pixel ratio and soft shadows down if frames run long, and hand
    // the card back to the drawing if even that cannot hold ~30 fps
    var perf = { n: 0, sum: 0, level: 0 };
    function guard(ms) {
      if (FORCE || justShown) { justShown = false; return; }   // the first frame after a tab switch is not the device's fault
      perf.n++; perf.sum += Math.min(ms, 400);
      if (perf.n < 30) return;
      var avg = perf.sum / perf.n; perf.n = 0; perf.sum = 0;
      if (avg > 22 && perf.level === 0) { perf.level = 1; renderer.setPixelRatio(1); renderer.shadowMap.type = T.PCFShadowMap; renderer.shadowMap.needsUpdate = true; resize(); }
      else if (avg > 34 && perf.level === 1) { perf.level = 2; giveBack(); }
    }
    // back to the poster for good (a slow device, or the browser took the GPU away): stop, and let go of every listener
    // and the GPU context, so nothing of the scene stays in memory
    function giveBack() {
      if (dead) return;
      if (frame) cancelAnimationFrame(frame); frame = 0; visible = false; dead = true;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      root.classList.remove("is-3d", "is-live");
      var hint = root.querySelector('[data-corner="hint"]'); if (hint) hint.textContent = "";
      ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onShow);
      plate.removeEventListener("keydown", onKey);
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) {}
    }
    var dead = false, justShown = true;
    canvas.addEventListener("webglcontextlost", giveBack);
    // paused and settled: the picture no longer changes, so stop drawing until the pointer, a key or unpausing moves it
    function still() {
      return paused && Math.abs((hoverX == null ? 0 : (hoverX - 0.5) * 2 * FOLLOW) - follow) < 0.01 && Math.abs((hoverX == null ? 1 : 0.25) - swingAmp) < 0.001;
    }
    function tick(now) {
      if (dead) return;
      if (last) guard(now - last);
      realDt = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60; last = now;
      if (!paused) clock += realDt;
      draw();
      frame = visible && !document.hidden && !still() ? requestAnimationFrame(tick) : 0;
    }
    function run() { if (!dead && !frame && visible && !reduce.matches) { last = 0; frame = requestAnimationFrame(tick); } }
    // the pointer and keys restart the loop; with reduced motion there is no loop, so they draw single frames directly
    function nudge() { if (dead || frame) return; if (visible && !reduce.matches) run(); else { realDt = 1; draw(); } }
    function onShow() { justShown = true; run(); }

    resize();
    draw();
    var ro = new ResizeObserver(function () { if (dead) return; resize(); if (!frame) draw(); });
    ro.observe(plate);
    var io = new IntersectionObserver(function (e) { visible = !POSTER && e[e.length - 1].isIntersecting; run(); }, { rootMargin: "80px 0px" });
    io.observe(plate);
    document.addEventListener("visibilitychange", onShow);

    // the pointer over the card turns the machine toward it; a drag turns it further and it stays there; a click holds the motion
    var down = null;
    canvas.style.touchAction = "pan-y";
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      if (e.pointerType === "mouse") hoverX = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (down) {
        var dx = e.clientX - down.x;
        if (Math.abs(dx) > 4) down.moved = true;
        if (down.moved) dragAz = down.az + dx * 0.4;
      }
      nudge();
    });
    canvas.addEventListener("pointerleave", function () { hoverX = null; nudge(); });
    canvas.addEventListener("pointerdown", function (e) { down = { x: e.clientX, az: dragAz, moved: false }; if (e.pointerType === "mouse") canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointerup", function () {
      if (!down) return;
      if (!down.moved) { paused = !paused; run(); }
      down = null;
    });
    canvas.addEventListener("pointercancel", function () { down = null; });
    function onKey(e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); paused = !paused; run(); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); dragAz += e.key === "ArrowLeft" ? -12 : 12; nudge(); }
    }
    plate.addEventListener("keydown", onKey);
  }

  /* ---------- 4. API ---------- */
  window.AG3D = {
    /** register a figure. id: the card root (#fig-<slug>). spec: { az, el: camera angles in degrees; size: light and shadow
        reach in model units; build(K) -> { root: THREE.Group,
        update(t) -> readout text } } */
    figure: function (id, spec) {
      var root = document.getElementById(id);
      // reduced motion: the card keeps its still poster, and three.js is never fetched
      if (!root || (reduce.matches && !POSTER)) return;
      var plate = root.querySelector(".fig-plate");
      var started = false;
      var go = function () {
        if (started) return; started = true;
        if (!webgl()) return;   // checked only now: creating a test GL context costs a few ms, kept out of the page load
        loadThree().then(function (T) { mount(root, spec, T); }).catch(function (e) { console.warn("3D figure stays 2D:", e && e.message); });
      };
      // fetch three only when the figure is about to be read
      var io = new IntersectionObserver(function (e) {
        if (e[e.length - 1].isIntersecting) { io.disconnect(); go(); }
      }, { rootMargin: "600px 0px" });
      io.observe(plate);
    },
  };
})();
