/* Fig 3 in 3D · the PD orchestrator. A column with one swinging arm visits planning_agent (a desk), runtime_agent (a press
   with a red die), analyzer_agent (a slack gauge), then files a red run card in the memory cabinet.
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
  var PLATE = { x: -100, y: -100, w: 176, d: 176, r: 10 };
  var R_ST = 70, ARM_Z = 50, ARM_H = 5, COL_R = 9;
  var rad = function (d) { return d * Math.PI / 180; };
  var C = [-26, -26];
  var polar = function (r, deg) { return [C[0] + r * Math.cos(rad(deg)), C[1] + r * Math.sin(rad(deg))]; };
  var ST = { plan: 122, run: 72, analyze: 22, memory: -30 };
  var DESK = (function () { var p = polar(R_ST, ST.plan); return { x: p[0] - 13, y: p[1] - 10, w: 26, d: 20, r: 2 }; })();
  var DESK_H = 16, PRESS = polar(R_ST, ST.run), GAUGE = polar(R_ST, ST.analyze), FILE_T = 14;
  var CAB = (function () { var p = polar(R_ST, ST.memory); return { x: p[0] - FILE_T - 30, y: p[1] - 14, w: 30, d: 28, r: 2 }; })();
  var CAB_H = 30, DRAWER_Z = [3.5, 12.5, 21.5], DRAWER_H = 7.5, FACE = CAB.x + CAB.w;
  var SLACK = [-0.42, -0.21, -0.07, 0.03];
  var GAUGE_R = 13, GAUGE_POST = 16, GAUGE_H = 6, GAUGE_TOP = GAUGE_POST + GAUGE_H;
  var DRAWER_H_IN = 5, BOX_L = 30, CARD_H = 5.5, CARD_T = 0.8;
  var SLOT = function (k) { return -15.6 + 2.2 * k; };
  var OPEN = function (k) { return FILE_T + 1 - SLOT(k) - CARD_T / 2; };
  var BOX = { y: CAB.y + 4, d: CAB.d - 8 };

  /* ---------- 2. TIMELINE ---------- */
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var STEPS = [
    { at: "plan", label: "planning_agent", dur: 1.8 },
    { at: "run", label: "runtime_agent", dur: 2.2 },
    { at: "analyze", label: "analyzer_agent", dur: 1.9 },
    { at: "memory", label: "record_iteration", dur: 2.2 },
  ];
  var SWING = 0.9;
  var ITER = STEPS.reduce(function (s, x) { return s + x.dur + SWING; }, 0);
  var TOTAL = ITER * SLACK.length + 2.6;
  function poseAt(t) {
    t = t % TOTAL;
    var iter = Math.min(SLACK.length - 1, Math.floor(t / ITER));
    if (t >= ITER * SLACK.length) return { iter: SLACK.length - 1, done: true, deg: ST.memory, step: null, u: 1 };
    var local = t - iter * ITER;
    for (var i = 0; i < STEPS.length; i++) {
      var from = i === 0 ? ST.memory : ST[STEPS[i - 1].at], to = ST[STEPS[i].at];
      if (local < SWING) { var d = to - from, sweep = d > 180 ? d - 360 : d < -180 ? d + 360 : d; return { iter: iter, deg: from + sweep * ease(local / SWING), step: null, next: i, u: 0, u0: local / SWING }; }
      local -= SWING;
      if (local < STEPS[i].dur) return { iter: iter, deg: to, step: i, u: local / STEPS[i].dur };
      local -= STEPS[i].dur;
    }
    return { iter: iter, deg: ST.memory, step: 3, u: 1 };
  }

  /* ---------- 3. SCENE ---------- */
  AG3D.figure("fig-cognitive-agents-next-era-silicon", {
    az: 62, el: 32, size: 120,
    build: function (K) {
      var T = K.T, V = K.V, M = K.mats, slab = K.slab, cyl = K.cyl;
      var root = new T.Group();
      root.add(K.basePlate(PLATE, { ruler: { x: -84, y: 64, w: 110, d: 6, r: 1 }, label: { x: -88, y: -88, w: 30, d: 16, r: 1.5 } }));

      // the orchestrator column
      root.add(cyl(C[0], C[1], 18, 0, 3, M.slate, { seg: 56 }));
      root.add(cyl(C[0], C[1], COL_R, 3, ARM_Z - 10, M.body, { seg: 40 }));
      root.add(cyl(C[0], C[1], 12, ARM_Z - 7, 7, M.slate, { seg: 48 }));

      // planning_agent: a desk with a plan sheet and a lamp
      root.add(slab(DESK, 0, DESK_H, M.panel, { bevel: 0.6 }));
      var sheet = { x: DESK.x + 4, y: DESK.y + 4, w: DESK.w - 8, d: DESK.d - 8, r: 0.5 };
      root.add(slab(sheet, DESK_H, 0.6, M.paper, { bevel: 0.1 }));
      [0.3, 0.45, 0.6, 0.75].forEach(function (f, i) {
        root.add(slab({ x: sheet.x + 3, y: sheet.y + sheet.d * f - 0.3, w: (sheet.w - 6) * [0.9, 0.6, 0.8, 0.5][i], d: 0.6, r: 0.2 }, DESK_H + 0.6, 0.08, M.slate, { bevel: 0, edges: false, cast: false }));
      });
      var lampAt = [DESK.x + DESK.w - 4, DESK.y + 4];
      root.add(cyl(lampAt[0], lampAt[1], 2.6, DESK_H, 1.2, M.slate));
      var lampMat = M.lamp.clone(); root.add(cyl(lampAt[0], lampAt[1], 1.8, DESK_H + 1.2, 2.4, lampMat));

      // runtime_agent: a press with the red die in its socket, a ram that comes down while it runs, status LEDs
      var px = PRESS[0], py = PRESS[1];
      root.add(slab({ x: px - 14, y: py - 12, w: 28, d: 24, r: 2 }, 0, 6, M.panel, { bevel: 0.6 }));
      root.add(slab({ x: px - 7, y: py - 7, w: 14, d: 14, r: 1 }, 6, 1.4, M.slate, { bevel: 0.3 }));
      var dieMat = M.red.clone();
      root.add(slab({ x: px - 5, y: py - 5, w: 10, d: 10, r: 0.8 }, 7.4, 1.6, dieMat, { bevel: 0.3 }));
      var leds = [-8, -4, 0, 4, 8].map(function (dx) { var m = M.lamp.clone(); root.add(cyl(px + dx, py + 9.4, 0.8, 6, 0.5, m, { edges: false })); return m; });
      [[-11, -9], [11, -9]].forEach(function (d) { root.add(cyl(px + d[0], py + d[1], 1.2, 6, 20, M.steel)); });
      root.add(slab({ x: px - 13, y: py - 11, w: 26, d: 4, r: 1 }, 26, 3, M.body, { bevel: 0.4 }));
      var ram = slab({ x: px - 6, y: py - 6, w: 12, d: 12, r: 1 }, 18, 3, M.slate, { bevel: 0.4 }); root.add(ram);

      // analyzer_agent: the slack gauge
      var gauge = K.dialGauge(GAUGE[0], GAUGE[1], GAUGE_R, GAUGE_POST, GAUGE_H); root.add(gauge);

      // memory: a three-drawer cabinet; the top drawer slides out and takes a red card per run
      root.add(slab(CAB, 0, CAB_H, M.panel, { bevel: 0.6 }));
      DRAWER_Z.slice(0, 2).forEach(function (z) {
        root.add(slab({ x: FACE - 1, y: CAB.y + 3, w: 2.6, d: CAB.d - 6, r: 0.8 }, z, DRAWER_H, M.body, { bevel: 0.3 }));
        root.add(slab({ x: FACE + 1.6, y: CAB.y + CAB.d / 2 - 4, w: 1.6, d: 8, r: 0.6 }, z + DRAWER_H / 2 - 0.8, 1.6, M.steel, { bevel: 0.2 }));
      });
      var drawer = new T.Group(); root.add(drawer);
      var z2 = DRAWER_Z[2], mid = BOX.y + BOX.d / 2;
      drawer.add(slab({ x: FACE - 1 - BOX_L, y: BOX.y, w: BOX_L, d: 0.8, r: 0.2 }, z2, DRAWER_H_IN, M.body, { bevel: 0.1 }));
      drawer.add(slab({ x: FACE - 1 - BOX_L, y: BOX.y + BOX.d - 0.8, w: BOX_L, d: 0.8, r: 0.2 }, z2, DRAWER_H_IN, M.body, { bevel: 0.1 }));
      drawer.add(slab({ x: FACE - 1 - BOX_L, y: BOX.y, w: BOX_L, d: BOX.d, r: 0.3 }, z2, 0.8, M.ice, { bevel: 0.1 }));
      drawer.add(slab({ x: FACE - 1, y: CAB.y + 3, w: 2.6, d: CAB.d - 6, r: 0.8 }, z2, DRAWER_H, M.body, { bevel: 0.3 }));
      drawer.add(slab({ x: FACE + 1.6, y: CAB.y + CAB.d / 2 - 4, w: 1.6, d: 8, r: 0.6 }, z2 + DRAWER_H / 2 - 0.8, 1.6, M.steel, { bevel: 0.2 }));
      var card = function (mat) { return slab({ x: -CARD_T / 2, y: -(BOX.d - 4) / 2, w: CARD_T, d: BOX.d - 4, r: 0.3 }, 0, CARD_H, mat, { bevel: 0.15 }); };
      var cards = [];
      for (var k = 0; k < SLACK.length; k++) { var cm = M.red.clone(); var c = card(cm); c.mat = cm; drawer.add(c); cards.push(c); }

      // the arm: turns on the column; a wrist, a probe that dips, and a card it carries to the drawer
      var arm = new T.Group(); arm.position.copy(V(C[0], C[1], 0)); root.add(arm);
      arm.add(K.bar([0, 0, ARM_Z], [R_ST + 2, 0], 7, ARM_H, M.body));
      arm.add(cyl(0, 0, 8, ARM_Z, ARM_H + 1, M.slate, { seg: 36 }));
      arm.add(cyl(R_ST, 0, 3.6, ARM_Z - 6, 6, M.slate));
      var probe = new T.Group(); arm.add(probe);
      var unit = new T.CylinderGeometry(1.4, 1.4, 1, 14); unit.translate(0, 0.5, 0);
      var rod = new T.Mesh(unit, M.steel); rod.castShadow = true; arm.add(rod);
      probe.add(cyl(R_ST, 0, 2.4, 0, 2, M.redDeep));
      var carriedMat = M.red.clone(), carried = card(carriedMat); probe.add(carried);
      carried.position.copy(V(R_ST, 0, -CARD_H));

      var gaugeV = -0.5, last = 0, filing = false;
      /* ---------- 4. FRAME ---------- */
      return {
        root: root,
        update: function (t) {
          var dt = Math.max(0, Math.min(0.1, t - last)); last = t;
          var s = poseAt(t), st = s.step === null ? null : STEPS[s.step];
          var tipRest = ARM_Z - 20;
          var REACH = { plan: tipRest - (DESK_H + 0.6), run: tipRest - 9, analyze: tipRest - (GAUGE_TOP + 3) };
          var hold = function (u) { return u < 0.3 ? ease(u / 0.3) : u < 0.62 ? 1 : u < 0.88 ? 1 - ease((u - 0.62) / 0.26) : 0; };
          var LIFT = -6, CARD_Z = z2 + 0.8, k = s.iter;
          var dip = 0, carry = 0, open = 0, extra = null;
          var recording = st && st.at === "memory";
          if (st && !recording) dip = hold(s.u) * REACH[st.at];
          if (s.step === null && s.next === 3) { dip = LIFT * ease(Math.min(1, s.u0 / 0.6)); carry = Math.min(1, s.u0 / 0.3); }
          if (recording) {
            var u = s.u, down = tipRest - (CARD_Z + CARD_H);
            open = OPEN(k) * (u < 0.3 ? ease(u / 0.3) : u < 0.72 ? 1 : 1 - ease((u - 0.72) / 0.28));
            if (u < 0.3) { dip = LIFT; carry = 1; }
            else if (u < 0.5) { dip = LIFT + (down - LIFT) * ease((u - 0.3) / 0.2); extra = true; }
            else dip = u < 0.58 ? down : u < 0.72 ? down + (LIFT - down) * ease((u - 0.58) / 0.14) : LIFT;
          }
          if (s.step === null && s.next === 0) dip = LIFT * (1 - ease(Math.min(1, s.u0 / 0.8)));
          if (s.done) dip = LIFT;
          // the arm: model angle deg turns to a three rotation about the vertical
          arm.rotation.y = -rad(s.deg);
          var tip = ARM_Z - 20 - dip;
          probe.position.y = tip;
          rod.position.copy(V(R_ST, 0, tip + 2)); rod.scale.y = Math.max(0.1, ARM_Z - 6 - (tip + 2));
          carried.visible = carry > 0.02 || !!extra;
          carriedMat.emissiveIntensity = 0.35;
          var planning = st && st.at === "plan", running = st && st.at === "run";
          lampMat.emissiveIntensity += ((planning ? 1.5 : 0) - lampMat.emissiveIntensity) * 0.2;
          var press = running ? hold(s.u) : 0;
          ram.position.y = -8.4 * press;
          dieMat.emissiveIntensity = 0.5 * press;
          leds.forEach(function (m, i) { m.emissiveIntensity = running ? (Math.floor(t * 8 + i) % 5 === 0 ? 1.6 : 0.25) : 0; });
          var analyzed = s.done || (s.step !== null && s.step >= 2) ? s.iter : s.iter - 1;
          var target = analyzed < 0 ? -0.5 : SLACK[analyzed];
          gaugeV += (target - gaugeV) * (1 - Math.exp(-(dt || 0.016) / 0.3));
          gauge.setValue((gaugeV + 0.5) / 1);
          filing = recording && s.u >= 0.5 && s.u < 0.85;
          var n = s.iter + (s.done || (recording && s.u >= 0.5) ? 1 : 0);
          drawer.position.x = open;
          var front = FACE - 1;
          cards.forEach(function (c, i) {
            c.visible = i < n;
            c.position.copy(V(front + SLOT(i) + CARD_T / 2, mid, CARD_Z));
            c.mat.emissiveIntensity = filing && i === n - 1 ? 0.45 : 0;
          });
          var slackText = analyzed < 0 ? "" : " · worst slack " + (SLACK[analyzed] > 0 ? "+" : "") + SLACK[analyzed].toFixed(2) + " ns";
          return s.done ? "timing met · " + n + " runs filed" : "iteration " + (s.iter + 1) + " · " + (st ? st.label : "orchestrator") + slackText;
        },
      };
    },
  });
})();
