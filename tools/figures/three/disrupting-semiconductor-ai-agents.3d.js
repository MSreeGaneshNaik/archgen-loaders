/* Fig 4 in 3D · ChipOS as a production line. A belt carries a red die blank under five agent stations (Spec, RTL, Synthesis,
   Layout, GDSII); each head dips and leaves its work on the die, and the finished die drops into the out tray.
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
  var PLATE = { x: -176, y: -54, w: 352, d: 108, r: 8 };
  var FRAME = { x: -158, y: -15, w: 300, d: 30, r: 2 }, FRAME_H = 10;
  var BELT = { x: -154, y: -11, w: 292, d: 22, r: 1.5 }, BELT_TOP = FRAME_H + 2;
  var XS = [-104, -54, -4, 46, 96];
  var NAMES = ["Spec", "RTL", "Synthesis", "Layout", "GDSII"];
  var ARCH_Y = 22, ARCH_Z = 40, POST = 5;
  var DIE = 18, DIE_H = 2;
  var TRAY = { x: 146, y: -18, w: 26, d: 36, r: 2 }, TRAY_H = 6, TRAY_CX = TRAY.x + TRAY.w / 2;
  var ENTER = -142, EXIT = 130;
  var TOOL_BOT = 21, HOUSING = ARCH_Z - 9;
  var CONTACT = [0.05, 0.35, 0.35, 0.05, 1.25];
  var DIP = CONTACT.map(function (c) { return TOOL_BOT - (BELT_TOP + DIE_H + c); });


  /* ---------- 2. TIMELINE ---------- */
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var dipAt = function (u) { return u < 0.35 ? ease(u / 0.35) : u < 0.6 ? 1 : u < 0.85 ? 1 - ease((u - 0.6) / 0.25) : 0; };
  var legs = [], x0 = ENTER;
  XS.forEach(function (x, i) { legs.push({ kind: "move", from: x0, to: x, dur: i === 0 ? 1.4 : 1.1 }); legs.push({ kind: "work", station: i, at: x, dur: 1.5 }); x0 = x; });
  legs.push({ kind: "move", from: x0, to: EXIT, dur: 1.1 });
  legs.push({ kind: "drop", at: EXIT, dur: 0.8 });
  legs.push({ kind: "rest", at: EXIT, dur: 0.9 });
  var CYCLE = legs.reduce(function (s, l) { return s + l.dur; }, 0);
  function poseAt(t) {
    var cycle = Math.floor(t / CYCLE), local = t - cycle * CYCLE, n = 0;
    while (local > legs[n].dur) { local -= legs[n].dur; n++; }
    var leg = legs[n], u = local / leg.dur;
    var x = leg.kind === "move" ? leg.from + (leg.to - leg.from) * ease(u) : leg.at;
    var done = legs.slice(0, n).filter(function (l) { return l.kind === "work"; }).length + (leg.kind === "work" && u > 0.45 ? 1 : 0);
    return { cycle: cycle, leg: leg, u: u, x: x, done: done, n: n };
  }

  /* ---------- 3. SCENE ---------- */
  AG3D.figure("fig-disrupting-semiconductor-ai-agents", {
    az: 64, el: 30, size: 200,
    build: function (K) {
      var T = K.T, V = K.V, M = K.mats, slab = K.slab, cyl = K.cyl;
      var root = new T.Group();
      root.add(K.basePlate(PLATE, { ruler: { x: -150, y: 44, w: 200, d: 6, r: 1 }, label: { x: -168, y: -46, w: 30, d: 16, r: 1.5 } }));

      // conveyor: legs, frame, a dark belt whose stripes travel with the die, chrome end rollers
      [[FRAME.x + 8, FRAME.y + 4], [FRAME.x + FRAME.w - 8, FRAME.y + 4], [FRAME.x + 8, FRAME.y + FRAME.d - 4], [FRAME.x + FRAME.w - 8, FRAME.y + FRAME.d - 4]].forEach(function (p) {
        root.add(cyl(p[0], p[1], 2.4, 0, 3, M.steel));
      });
      root.add(slab(FRAME, 3, FRAME_H - 3, M.panel, { bevel: 0.5 }));
      var stripes = document.createElement("canvas"); stripes.width = 64; stripes.height = 8;
      var cx = stripes.getContext("2d"); cx.fillStyle = "#435565"; cx.fillRect(0, 0, 64, 8); cx.fillStyle = "#636D7D"; cx.fillRect(0, 0, 9, 8);
      var tex = new T.CanvasTexture(stripes); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(1 / 9, 1 / 8); tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 8;
      var beltMat = new T.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.05 });
      root.add(slab(BELT, FRAME_H, 2, beltMat, { bevel: 0.3, edges: false }));
      [BELT.x + 1.5, BELT.x + BELT.w - 1.5].forEach(function (x) {
        var r = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, BELT.d + 4, 24), M.steel);
        r.rotation.x = Math.PI / 2; r.position.copy(V(x, 0, FRAME_H + 0.6)); r.castShadow = true; root.add(r);
      });
      [-130, -80, -30, 20, 70, 120].forEach(function (x) { root.add(cyl(x, FRAME.y + FRAME.d + 0.1, 0.7, 6.8, 0.01, M.chrome, { edges: false })); });

      // stations: two posts, a cross beam, a head housing, a lamp that lights while its agent works, and the agent's own tool
      var lamps = [], tools = [];
      XS.forEach(function (x, i) {
        root.add(slab({ x: x - POST / 2, y: -ARCH_Y - POST / 2, w: POST, d: POST, r: 1 }, 0, ARCH_Z, M.body, { bevel: 0.4 }));
        root.add(slab({ x: x - POST / 2, y: ARCH_Y - POST / 2, w: POST, d: POST, r: 1 }, 0, ARCH_Z, M.body, { bevel: 0.4 }));
        root.add(slab({ x: x - POST / 2 - 2, y: ARCH_Y - POST / 2 - 2, w: POST + 4, d: POST + 4, r: 1.4 }, 0, 2, M.slate));
        root.add(slab({ x: x - POST / 2 - 2, y: -ARCH_Y - POST / 2 - 2, w: POST + 4, d: POST + 4, r: 1.4 }, 0, 2, M.slate));
        root.add(slab({ x: x - 5, y: -ARCH_Y - 4, w: 10, d: ARCH_Y * 2 + 8, r: 1.4 }, ARCH_Z, 6, M.body, { bevel: 0.6 }));
        root.add(slab({ x: x - 7, y: -7, w: 14, d: 14, r: 2 }, ARCH_Z - 9, 9, M.slate, { bevel: 0.6 }));
        root.add(cyl(x, ARCH_Y - 6, 2.2, ARCH_Z + 6, 1, M.slate));
        var lm = M.lamp.clone(); var lamp = cyl(x, ARCH_Y - 6, 1.6, ARCH_Z + 7, 2.2, lm); root.add(lamp); lamps.push(lm);
        var g = new T.Group(), b = TOOL_BOT;
        var rod = function (top) { g.add(cyl(x, 0, 1.6, top, HOUSING - top, M.steel)); };
        if (i === 0) { rod(b + 3); g.add(slab({ x: x - 7, y: -7, w: 14, d: 14, r: 1 }, b, 3, M.graphite, { bevel: 0.4 })); }
        else if (i === 1) { rod(b + 8); g.add(cyl(x, 0, 2.4, b + 3, 5, M.slate)); g.add(cyl(x, 0, 0.8, b, 3, M.ink, { top: 0.25 })); }
        else if (i === 2) { rod(b + 4); g.add(slab({ x: x - 6, y: -6, w: 12, d: 12, r: 1 }, b + 0.6, 3.4, M.slate, { bevel: 0.4 }));
          for (var a = 0; a < 5; a++) for (var c = 0; c < 5; c++) g.add(cyl(x - 4 + a * 2, -4 + c * 2, 0.35, b, 0.6, M.chrome, { edges: false, cast: false, seg: 6 })); }
        else if (i === 3) { rod(b + 3); g.add(cyl(x, 0, 3.2, b, 3, M.slate)); }
        else { rod(b + 2.6); g.add(slab({ x: x - 8, y: -8, w: 16, d: 16, r: 1 }, b, 2.6, M.ink, { bevel: 0.4 })); }
        root.add(g); tools.push(g);
      });

      // the out tray
      root.add(slab(TRAY, 0, TRAY_H, M.panel, { bevel: 0.5 }));
      root.add(slab({ x: TRAY.x + 2.4, y: TRAY.y + 2.4, w: TRAY.w - 4.8, d: TRAY.d - 4.8, r: 1 }, TRAY_H - 1.6, 1.62, M.paper, { bevel: 0, edges: true, cast: false }));

      // a die, built with every stage of work and shown stage by stage: red substrate, spec sheet, RTL traces, gates, blocks, mask
      function makeDie() {
        var g = new T.Group(), h = DIE / 2, top = DIE_H;
        var mat = M.red.clone();
        g.add(slab({ x: -h, y: -h, w: DIE, d: DIE, r: 1 }, 0, DIE_H, mat, { bevel: 0.4 }));
        var sheet = new T.Group();
        sheet.add(slab({ x: -h + 2.5, y: -h + 2.5, w: DIE - 5, d: DIE - 5, r: 0.5 }, top, 0.3, M.paper, { bevel: 0, edges: false }));
        var traces = [];
        for (var i = 0; i < 5; i++) { var tr = slab({ x: -h + 3.6, y: -h + 4.4 + i * 2.4, w: DIE - 7.2 - (i % 2) * 3, d: 0.5, r: 0.2 }, top + 0.3, 0.1, M.ink, { bevel: 0, edges: false, cast: false }); traces.push(tr); sheet.add(tr); }
        g.add(sheet);
        var gates = new T.InstancedMesh(new T.CylinderGeometry(0.42, 0.42, 0.4, 8), M.ink, 49), m4 = new T.Matrix4(), k = 0;
        for (var a = 0; a < 7; a++) for (var c = 0; c < 7; c++) { var p = V(-h + 2.5 + a * 2.2, -h + 2.5 + c * 2.2, top + 0.2); m4.makeTranslation(p.x, p.y, p.z); gates.setMatrixAt(k++, m4); }
        g.add(gates);
        var blocks = new T.Group();
        [[-5, -5, 7, 6], [2, -5, 5, 9], [-5, 3, 6, 4]].forEach(function (q) { blocks.add(slab({ x: q[0], y: q[1], w: q[2], d: q[3], r: 0.4 }, top, 1.2, M.redDeep, { bevel: 0.2 })); });
        g.add(blocks);
        var mask = new T.LineLoop(new T.BufferGeometry().setFromPoints([V(-h + 1, -h + 1, top + 0.05), V(h - 1, -h + 1, top + 0.05), V(h - 1, h - 1, top + 0.05), V(-h + 1, h - 1, top + 0.05)]), new T.LineBasicMaterial({ color: 0xF7FAFB }));
        g.add(mask);
        g.stage = function (done) {
          sheet.visible = done >= 1 && done < 3;
          traces.forEach(function (t, i) { t.visible = done >= 2 || i < 3; });
          gates.visible = done >= 3; blocks.visible = done >= 4; mask.visible = done >= 5;
        };
        g.mat = mat;
        // every part of this die gets its own copy of its material, so the whole die can fade in or out as one
        var faders = [];
        g.traverse(function (o) { if (o.material && o.material !== mat) { o.material = o.material.clone(); faders.push(o.material); } });
        faders.push(mat);
        faders.forEach(function (m) { m.transparent = true; });
        g.setOpacity = function (o) { faders.forEach(function (m) { m.opacity = m.userData.base == null ? (m.userData.base = m.opacity) * o : m.userData.base * o; }); g.visible = o > 0.01; };
        return g;
      }
      var die = makeDie(), held = makeDie();
      held.stage(5);
      root.add(die); root.add(held);

      var out = 0;
      /* ---------- 4. FRAME ---------- */
      return {
        root: root,
        update: function (t) {
          var p = poseAt(t), leg = p.leg, u = p.u;
          out = p.cycle + ((leg.kind === "drop" && u > 0.5) || leg.kind === "rest" ? 1 : 0);
          // belt travel: stripes move with the die
          var travel = p.cycle * (EXIT - ENTER) + (p.x - ENTER);
          tex.offset.x = -(travel / 9) % 1;
          tools.forEach(function (g, i) { var d = leg.kind === "work" && leg.station === i ? dipAt(u) * DIP[i] : 0; g.position.y = -d; });
          lamps.forEach(function (m, i) { var on = leg.kind === "work" && leg.station === i; m.emissiveIntensity += ((on ? 1.4 : 0) - m.emissiveIntensity) * 0.25; });
          var z = BELT_TOP, x = p.x, floorZ = TRAY_H - 1.6;
          if (leg.kind === "drop") { x = EXIT + (TRAY_CX - EXIT) * (1 - (1 - u) * (1 - u)); var f = Math.max(0, (u - 0.35) / 0.65); z = BELT_TOP - (BELT_TOP - floorZ) * f * f; }
          var inTray = leg.kind === "rest";
          if (inTray) die.visible = false;
          die.position.copy(V(x, 0, z)); die.stage(p.done);
          var working = leg.kind === "work" ? Math.sin(Math.min(1, u / 0.85) * Math.PI) : 0;
          die.mat.emissiveIntensity = 0.45 * working;
          if (!inTray) die.setOpacity(p.n === 0 ? Math.min(1, (u * legs[0].dur) / 0.35) : 1);
          held.position.copy(V(TRAY_CX, 0, floorZ));
          held.setOpacity(inTray || p.cycle > 0 ? (leg.kind === "drop" ? Math.max(0, 1 - u / 0.45) : 1) : 0);
          var where = leg.kind === "work" ? NAMES[leg.station] + " agent" : leg.kind === "move" ? (p.done >= 5 ? "to the out tray" : "to " + NAMES[p.done]) : "taped out";
          return where + " · " + out + (out === 1 ? " die" : " dies") + " out";
        },
      };
    },
  });
})();
