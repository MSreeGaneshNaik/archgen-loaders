/* Fig 1 in 3D · macro placement. A pick-and-place gantry lifts eight red hard macros from two overlapping stacks and sets
   each on the die where it overlaps nothing; the gauge settles on the verified average proxy cost, 0.9507.
   Runs on three-kit.js, which must load first.
   How this file is laid out (the same in every scene):
     1. MODEL     sizes and positions in model units (x, y on the floor, z up; about one unit per CSS pixel of the card)
     2. TIMELINE  a pure function of time t: where everything is at t, looped
     3. SCENE     build(K) makes every part once, from the kit's helpers and the site-palette materials in K.mats
     4. FRAME     update(t) moves the parts for time t and returns the readout text shown in the card's corner
   Camera: az (degrees round the vertical, from +x) and el (degrees above the floor) in the AG3D.figure call; the kit frames
   the machine to fit the card by itself. Colours live in three-kit.js (K.mats), never here.
   After any change: sh tools/build.sh --posters (rebuilds the figure, its still poster and the posts, in order). */
(function () {
  if (!window.AG3D) return;

  /* ---------- 1. MODEL ---------- */
  var PLATE = { x: -168, y: -106, w: 318, d: 212, r: 8 };
  var RAIL = { x0: -128, x1: 136, far: -96, near: 88, d: 6, h: 4 };
  var CHUCK = { x: -26, y: -62, w: 152, d: 124, r: 3 };
  var DIE = { x: CHUCK.x + 6, y: CHUCK.y + 6, w: CHUCK.w - 12, d: CHUCK.d - 12, r: 1 };
  var CHUCK_H = 6, DIE_H = 2, DIE_TOP = CHUCK_H + DIE_H;
  var STAGE = { x: -124, y: -64, w: 68, d: 128, r: 3 }, STAGE_H = 3;
  var MAC_H = 5;
  var MACROS = [
    { w: 34, d: 26, to: [-1, -37] }, { w: 28, d: 30, to: [37, -35] }, { w: 46, d: 22, to: [86, -39] },
    { w: 24, d: 34, to: [-6, 3] }, { w: 40, d: 30, to: [88, -5] },
    { w: 38, d: 28, to: [3, 36] }, { w: 30, d: 32, to: [44, 30] }, { w: 36, d: 34, to: [92, 33] },
  ];
  var STACK = [[-90, -34], [-90, 34]];
  var PILE = MACROS.map(function (m, i) {
    var s = i % 2, level = Math.floor(i / 2), off = [[0, 0], [3, -2], [-2, 3], [2, 1]][level];
    return { at: [STACK[s][0] + off[0], STACK[s][1] + off[1]], z: STAGE_H + level * MAC_H };
  });
  var ORDER = [6, 7, 4, 5, 2, 3, 0, 1];
  var BEAM = { w: 10, h: 10, z: 60 }, CAR = { dx: 5, w: 7, d: 18, z0: 54, z1: 72 }, NOZ = { dx: 9, sleeve: [46, 54], travel: 40 };
  var GAUGE = [-146, 70], BOX = { x: 126, y: 64, w: 18, d: 20, r: 2 }, BOX_H = 14;
  var PROXY = 0.9507, START = 1.62;
  var planOf = function (m, c) { return { x: c[0] - m.w / 2, y: c[1] - m.d / 2, w: m.w, d: m.d }; };
  var overlaps = function (a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d; };

  /* ---------- 2. TIMELINE ---------- */
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  // the timeline, as pure segments: for any time it gives the head, every macro's position and what is placed
  var SEG = [], tl = 0;
  ORDER.forEach(function (i, n) { [0.9, 0.45, 0.18, 0.45, 1.3, 0.5, 0.2, 0.45].forEach(function (d, k) { SEG.push({ i: i, n: n, k: k, t0: tl, d: d }); tl += d; }); });
  SEG.push({ k: "hold", t0: tl, d: 3.2 }); tl += 3.2;
  SEG.push({ k: "reset", t0: tl, d: 1.4 }); tl += 1.4;
  var TOTAL = tl;
  function stateAt(t) {
    t = t % TOTAL;
    var s = 0; while (s < SEG.length - 1 && t >= SEG[s].t0 + SEG[s].d) s++;
    var seg = SEG[s], u = Math.min(1, (t - seg.t0) / seg.d);
    var pos = MACROS.map(function (m, i) { return [PILE[i].at[0], PILE[i].at[1], PILE[i].z]; });
    var placed = 0, held = -1;
    var head = { x: PILE[ORDER[0]].at[0], y: PILE[ORDER[0]].at[1], tip: NOZ.travel };
    if (seg.k === "hold" || seg.k === "reset") {
      MACROS.forEach(function (m, i) { pos[i] = [m.to[0], m.to[1], DIE_TOP]; });
      placed = 8; head = { x: MACROS[ORDER[7]].to[0], y: MACROS[ORDER[7]].to[1], tip: NOZ.travel };
      if (seg.k === "reset") {
        var e = ease(u);
        MACROS.forEach(function (m, i) { pos[i] = [lerp(m.to[0], PILE[i].at[0], e), lerp(m.to[1], PILE[i].at[1], e), lerp(DIE_TOP, PILE[i].z, e) + Math.sin(e * Math.PI) * 14]; });
        head = { x: lerp(head.x, PILE[ORDER[0]].at[0], e), y: lerp(head.y, PILE[ORDER[0]].at[1], e), tip: NOZ.travel };
        if (u >= 1) placed = 0;
      }
      return { pos: pos, placed: placed, held: -1, head: head };
    }
    var n = seg.n, i = seg.i, k = seg.k, m = MACROS[i];
    for (var j = 0; j < n; j++) { var q = ORDER[j]; pos[q] = [MACROS[q].to[0], MACROS[q].to[1], DIE_TOP]; }
    placed = n;
    var from = PILE[i].at, fromTop = PILE[i].z + MAC_H, to = m.to, toTop = DIE_TOP + MAC_H;
    var prev = n === 0 ? from : MACROS[ORDER[n - 1]].to;
    var E = ease(u);
    if (k === 0) head = { x: lerp(prev[0], from[0], E), y: lerp(prev[1], from[1], E), tip: NOZ.travel };
    else if (k === 1) head = { x: from[0], y: from[1], tip: lerp(NOZ.travel, fromTop, E) };
    else if (k === 2) { head = { x: from[0], y: from[1], tip: fromTop }; if (u >= 1) held = i; }
    else if (k === 3) { head = { x: from[0], y: from[1], tip: lerp(fromTop, NOZ.travel, E) }; held = i; }
    else if (k === 4) { head = { x: lerp(from[0], to[0], E), y: lerp(from[1], to[1], E), tip: NOZ.travel }; held = i; }
    else if (k === 5) { head = { x: to[0], y: to[1], tip: lerp(NOZ.travel, toTop, E) }; held = i; }
    else if (k === 6) { head = { x: to[0], y: to[1], tip: toTop }; if (u >= 1) placed = n + 1; else held = i; }
    else { head = { x: to[0], y: to[1], tip: lerp(toTop, NOZ.travel, E) }; placed = n + 1; }
    if (held === i) pos[i] = [head.x, head.y, head.tip - MAC_H];
    if (placed > n) pos[i] = [to[0], to[1], DIE_TOP];
    return { pos: pos, placed: placed, held: held, head: head };
  }

  /* ---------- 3. SCENE ---------- */
  AG3D.figure("fig-how-we-ranked-first-in-the-partcl", {
    az: 64, el: 34, size: 200,
    build: function (K) {
      var T = K.T, V = K.V, M = K.mats, slab = K.slab, cyl = K.cyl;
      var root = new T.Group();
      root.add(K.basePlate(PLATE, { ruler: { x: -110, y: 97, w: 230, d: 6, r: 1 }, label: { x: -160, y: -98, w: 34, d: 20, r: 1.5 } }));

      // rails and end stops
      [RAIL.far, RAIL.near].forEach(function (y) {
        root.add(slab({ x: RAIL.x0, y: y, w: RAIL.x1 - RAIL.x0, d: RAIL.d, r: 1 }, 0, RAIL.h, M.steel, { bevel: 0.4 }));
        [RAIL.x0 - 6, RAIL.x1].forEach(function (x) { root.add(slab({ x: x, y: y - 2, w: 6, d: RAIL.d + 4, r: 1.2 }, 0, 8, M.slate, { bevel: 0.5 })); });
      });
      // staging plate with locating pins
      root.add(slab(STAGE, 0, STAGE_H, M.panel, { bevel: 0.6 }));
      STACK.forEach(function (s) { [[-28, -20], [28, 20]].forEach(function (d) { root.add(cyl(s[0] + d[0], s[1] + d[1], 1.4, STAGE_H, 2.2, M.steel)); }); });
      // proxy-cost gauge and the control box
      var gauge = K.dialGauge(GAUGE[0], GAUGE[1], 15, 14, 7); root.add(gauge);
      root.add(slab(BOX, 0, BOX_H, M.panel, { bevel: 0.6 }));
      root.add(cyl(BOX.x + 6, BOX.y + 6, 2.2, BOX_H, 1.2, M.slate));
      root.add(cyl(BOX.x + 12, BOX.y + 6, 2.2, BOX_H, 1.2, M.slate));
      var boxLamp = M.lamp.clone(); root.add(cyl(BOX.x + 9, BOX.y + 14, 1.6, BOX_H, 1.4, boxLamp));

      // chuck and die: standard-cell rows and an I/O pad ring on the die's top
      root.add(slab(CHUCK, 0, CHUCK_H, M.body, { bevel: 0.8 }));
      root.add(slab(DIE, CHUCK_H, DIE_H, M.paper, { bevel: 0.5 }));
      var rows = [];
      for (var y = DIE.y + 7; y < DIE.y + DIE.d - 3; y += 7) rows.push(V(DIE.x + 1, y, DIE_TOP + 0.04), V(DIE.x + DIE.w - 1, y, DIE_TOP + 0.04));
      root.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(rows), new T.LineBasicMaterial({ color: 0x738A9A, transparent: true, opacity: 0.45 })));
      var padPts = [];
      for (var x = DIE.x + 4; x <= DIE.x + DIE.w - 4; x += 6) padPts.push([x, DIE.y + 1.6], [x, DIE.y + DIE.d - 1.6]);
      for (var yy = DIE.y + 7; yy <= DIE.y + DIE.d - 7; yy += 6) padPts.push([DIE.x + 1.6, yy], [DIE.x + DIE.w - 1.6, yy]);
      var pads = new T.InstancedMesh(new T.BoxGeometry(1.4, 0.2, 1.4), M.slate, padPts.length), m4 = new T.Matrix4();
      padPts.forEach(function (p, i) { var v = V(p[0], p[1], DIE_TOP + 0.1); m4.makeTranslation(v.x, v.y, v.z); pads.setMatrixAt(i, m4); });
      root.add(pads);

      // the eight macros, red, each with a pin row along one edge
      var macros = MACROS.map(function (m) {
        var g = new T.Group(), mat = M.red.clone();
        g.add(slab({ x: -m.w / 2, y: -m.d / 2, w: m.w, d: m.d, r: 1.2 }, 0, MAC_H, mat, { bevel: 0.5 }));
        g.add(slab({ x: -m.w / 2 + 2.4, y: -m.d / 2 + 2.4, w: m.w - 4.8, d: m.d - 4.8, r: 0.8 }, MAC_H, 0.12, M.redDeep, { bevel: 0, edges: false, cast: false }));
        for (var x = -m.w / 2 + 3; x <= m.w / 2 - 3; x += 3) g.add(cyl(x, -m.d / 2 + 1.2, 0.45, MAC_H, 0.2, M.paper, { edges: false, cast: false, seg: 8 }));
        g.mat = mat; root.add(g); return g;
      });

      // the gantry: two uprights ride the rails, the beam spans them, the carriage rides the beam, the nozzle dips
      var bridge = new T.Group(); root.add(bridge);
      [RAIL.far, RAIL.near].forEach(function (y) {
        bridge.add(slab({ x: -11, y: y - 3, w: 22, d: RAIL.d + 6, r: 1.6 }, RAIL.h, 6, M.slate, { bevel: 0.5 }));
        bridge.add(slab({ x: -5, y: y - 1, w: 10, d: RAIL.d + 2, r: 1.4 }, RAIL.h + 6, BEAM.z - RAIL.h - 6, M.body, { bevel: 0.4 }));
      });
      bridge.add(slab({ x: -BEAM.w / 2, y: RAIL.far - 1, w: BEAM.w, d: RAIL.near + RAIL.d + 2 - RAIL.far, r: 1.6 }, BEAM.z, BEAM.h, M.body, { bevel: 0.6 }));
      bridge.add(slab({ x: -2.4, y: RAIL.far + 6, w: 4.8, d: RAIL.near - RAIL.far - 12, r: 0.6 }, BEAM.z + BEAM.h, 0.5, M.ice, { bevel: 0.1 }));
      var MY = RAIL.near + 2;
      bridge.add(cyl(0, MY, 4.6, BEAM.z + BEAM.h, 1.4, M.slate));
      bridge.add(cyl(0, MY, 3.8, BEAM.z + BEAM.h + 1.4, 7, M.graphite));
      bridge.add(cyl(0, MY, 2.6, BEAM.z + BEAM.h + 8.4, 2, M.steel));
      var car = new T.Group(); bridge.add(car);
      car.add(slab({ x: CAR.dx, y: -CAR.d / 2, w: CAR.w, d: CAR.d, r: 1.4 }, CAR.z0, CAR.z1 - CAR.z0, M.slate, { bevel: 0.5 }));
      car.add(cyl(NOZ.dx, -6.6, 2.2, NOZ.sleeve[0] + 1, NOZ.sleeve[1] - NOZ.sleeve[0] - 1, M.graphite));
      car.add(cyl(NOZ.dx, -6.6, 1.5, NOZ.sleeve[0] - 1.4, 2.4, M.ink));
      car.add(cyl(NOZ.dx, 0, 3.4, NOZ.sleeve[0], NOZ.sleeve[1] - NOZ.sleeve[0], M.graphite));
      var unit = new T.CylinderGeometry(1.5, 1.5, 1, 16); unit.translate(0, 0.5, 0);
      var rod = new T.Mesh(unit, M.steel); rod.castShadow = true; car.add(rod);
      var cup = cyl(NOZ.dx, 0, 3, 0, 2.4, M.redDeep); car.add(cup);

      var gaugeV = START, last = 0;
      /* ---------- 4. FRAME ---------- */
      return {
        root: root,
        update: function (t) {
          var dt = Math.max(0, Math.min(0.1, t - last)); last = t;
          var S = stateAt(t), h = S.head;
          bridge.position.x = h.x - NOZ.dx;
          car.position.z = h.y;
          cup.position.copy(V(NOZ.dx, 0, h.tip + 1.2));
          rod.position.copy(V(NOZ.dx, 0, h.tip + 2.4)); rod.scale.y = NOZ.sleeve[0] - h.tip - 2.4;
          macros.forEach(function (g, i) {
            var p = S.pos[i]; g.position.copy(V(p[0], p[1], p[2]));
            g.mat.emissiveIntensity = S.held === i ? 0.45 : 0;
          });
          boxLamp.emissiveIntensity = 0.6 + 0.6 * Math.max(0, Math.sin(t * 3));
          var target = S.placed === 8 ? PROXY : START - (START - PROXY) * (S.placed / 8) * 0.86;
          gaugeV += (target - gaugeV) * (1 - Math.exp(-(dt || 0.016) / 0.35));
          gauge.setValue((gaugeV - 0.8) / (1.8 - 0.8));
          // live overlaps from where the macros are now
          var plans = MACROS.map(function (m, i) { return S.held === i ? null : planOf(m, S.pos[i]); }), ov = 0;
          for (var a = 0; a < 8; a++) for (var b = a + 1; b < 8; b++) if (plans[a] && plans[b] && Math.abs(S.pos[a][2] - S.pos[b][2]) < MAC_H + 0.5 && overlaps(plans[a], plans[b])) ov++;
          return S.placed === 8 ? "8 of 8 placed · 0 overlaps · proxy 0.9507" : "placed " + S.placed + " of 8 · overlaps " + ov;
        },
      };
    },
  });
})();
