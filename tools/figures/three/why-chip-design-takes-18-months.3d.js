/* Fig 2 in 3D · the iteration loop. An indexing turntable carries a red die through five stations, Floorplan, Place, CTS,
   Route and Timing check; when timing fails the lamp lights and the die goes all the way round again, and the tally counter
   counts the loops. Runs on three-kit.js, which must load first.
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
  var PLATE = { x: -112, y: -112, w: 224, d: 224, r: 10 };
  var TABLE_R = 62, HUB_R = 46, TABLE_Z = 6, TABLE_H = 6, TABLE_TOP = TABLE_Z + TABLE_H;
  var PATH_R = 46, COL_R = 88, ARM_Z = 46, ARM_H = 5, COL_W = 11;
  var NAMES = ["Floorplan", "Place", "CTS", "Route", "Timing check"];
  var ANG = [130, 175, 220, 265, 310];
  var DIE_TOP = TABLE_TOP + 2.4 + 1.8, TOOL_B = DIE_TOP + 8, HOUSING_B = ARM_Z - 8;
  var HEAD_H = [3, 3, 5.6, 11, 6.5];
  var BOX = { x: 58, y: 56, w: 20, d: 30, r: 2.4 }, BOX_H = 13;
  var DIP = TOOL_B - (DIE_TOP + 0.05);
  var rad = function (d) { return d * Math.PI / 180; };
  var polar = function (r, deg) { return [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))]; };

  /* ---------- 2. TIMELINE ---------- */
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var hold = function (u) { return u < 0.3 ? ease(u / 0.3) : u < 0.6 ? 1 : u < 0.85 ? 1 - ease((u - 0.6) / 0.25) : 0; };
  var DWELL = 0.95, STEP = 0.7, RETURN = 1.9, legs = [];
  ANG.forEach(function (deg, i) {
    legs.push({ kind: "dwell", station: i, dur: DWELL, from: deg, to: deg });
    if (i < ANG.length - 1) legs.push({ kind: "index", dur: STEP, from: deg, to: ANG[i + 1], next: i + 1 });
  });
  legs.push({ kind: "return", dur: RETURN, from: ANG[4], to: ANG[0] + 360 });
  var CYCLE = legs.reduce(function (s, l) { return s + l.dur; }, 0);
  function poseAt(t) {
    var cyc = Math.floor(t / CYCLE), local = t - cyc * CYCLE, n = 0;
    while (local > legs[n].dur) { local -= legs[n].dur; n++; }
    var leg = legs[n], u = local / leg.dur;
    return { n: n, leg: leg, u: u, cycle: cyc, angle: leg.from + (leg.to - leg.from) * ease(u) };
  }

  /* ---------- 3. SCENE ---------- */
  AG3D.figure("fig-why-chip-design-takes-18-months", {
    az: 74, el: 33, size: 140,
    build: function (K) {
      var T = K.T, V = K.V, M = K.mats, slab = K.slab, cyl = K.cyl;
      var root = new T.Group();
      root.add(K.basePlate(PLATE, { ruler: { x: -96, y: 100, w: 140, d: 6, r: 1 }, label: { x: -100, y: 58, w: 30, d: 18, r: 1.5 } }));

      // turntable: hub, table, and the parts that turn with it (rim ticks, locating pins, inner rings)
      root.add(cyl(0, 0, HUB_R, 0, TABLE_Z, M.body, { seg: 72 }));
      var table = new T.Group(); root.add(table);
      table.add(cyl(0, 0, TABLE_R, TABLE_Z, TABLE_H, M.ice, { seg: 96 }));
      var ticks = [];
      for (var i = 0; i < 72; i++) {
        var a = rad(i * 5), r1 = TABLE_R - 1.5, r0 = r1 - (i % 6 === 0 ? 3 : 1.4);
        ticks.push(V(r0 * Math.cos(a), r0 * Math.sin(a), TABLE_TOP + 0.05), V(r1 * Math.cos(a), r1 * Math.sin(a), TABLE_TOP + 0.05));
      }
      table.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(ticks), new T.LineBasicMaterial({ color: 0x435565, transparent: true, opacity: 0.8 })));
      [TABLE_R - 6, 18].forEach(function (r) {
        var pts = []; for (var i = 0; i <= 96; i++) { var a = (i / 96) * Math.PI * 2; pts.push(V(r * Math.cos(a), r * Math.sin(a), TABLE_TOP + 0.04)); }
        table.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x738A9A, transparent: true, opacity: 0.55 })));
      });
      [0, 120, 240].forEach(function (a) { var p = polar(TABLE_R - 10, a); table.add(cyl(p[0], p[1], 1.5, TABLE_TOP, 1.6, M.steel)); });
      root.add(cyl(0, 0, 11, TABLE_TOP, 4, M.graphite, { seg: 40 }));
      root.add(cyl(0, 0, 5, TABLE_TOP + 4, 3, M.steel));

      // stations: base, column, an arm reaching over the die's path, a housing, and each station's own tool on a live rod
      var tools = [], rods = [], unitRod = new T.CylinderGeometry(1.4, 1.4, 1, 14); unitRod.translate(0, 0.5, 0);
      ANG.forEach(function (deg, i) {
        var c = polar(COL_R, deg);
        root.add(slab({ x: c[0] - COL_W / 2 - 3, y: c[1] - COL_W / 2 - 3, w: COL_W + 6, d: COL_W + 6, r: 3 }, 0, 3, M.slate));
        root.add(slab({ x: c[0] - COL_W / 2, y: c[1] - COL_W / 2, w: COL_W, d: COL_W, r: 2 }, 3, ARM_Z - 3, M.body, { bevel: 0.5 }));
        var from = polar(COL_R + 4, deg), to = polar(PATH_R - 6, deg);
        root.add(K.bar([from[0], from[1], ARM_Z], [to[0], to[1]], 8, ARM_H, M.body));
        var h = polar(PATH_R, deg);
        root.add(cyl(h[0], h[1], 4.4, ARM_Z - 8, 8, M.slate));
        var g = new T.Group(), b = TOOL_B, x = h[0], y = h[1];
        if (i === 0) g.add(slab({ x: x - 5, y: y - 5, w: 10, d: 10, r: 1 }, b, 3, M.graphite, { bevel: 0.4 }));
        else if (i === 1) g.add(cyl(x, y, 3, b, 3, M.graphite));
        else if (i === 2) { [[-3, 0], [3, 0], [0, 3]].forEach(function (d) { g.add(cyl(x + d[0], y + d[1], 1, b, 4, M.steel)); }); g.add(cyl(x, y + 1, 4.6, b + 4, 1.6, M.graphite)); }
        else if (i === 3) { g.add(cyl(x, y, 1, b, 5, M.steel)); g.add(cyl(x, y, 3.6, b + 5, 6, M.slate)); }
        else { g.add(cyl(x, y, 0.8, b, 5, M.steel, { top: 0.3 })); g.add(cyl(x, y, 2, b + 5, 1.5, M.graphite)); }
        root.add(g); tools.push(g);
        var rod = new T.Mesh(unitRod, M.steel); rod.castShadow = true; root.add(rod); rods.push({ m: rod, x: x, y: y, h: HEAD_H[i] });
      });
      // the timing station's lamp on top of its column
      var lp = polar(COL_R, ANG[4]);
      root.add(cyl(lp[0], lp[1], 3.4, ARM_Z, 1.6, M.slate));
      var lampMat = M.lamp.clone(); root.add(cyl(lp[0], lp[1], 2.6, ARM_Z + 1.6, 3.4, lampMat));

      // the carrier: a puck and the red die on it, carried round by the table
      var carrier = new T.Group(); root.add(carrier);
      carrier.add(cyl(0, 0, 8, TABLE_TOP, 2.4, M.slate, { seg: 32 }));
      var dieMat = M.red.clone();
      var die = slab({ x: -5.2, y: -5.2, w: 10.4, d: 10.4, r: 0.8 }, TABLE_TOP + 2.4, 1.8, dieMat, { bevel: 0.35 }); carrier.add(die);
      carrier.add(slab({ x: -3.2, y: -3.2, w: 6.4, d: 6.4, r: 0.4 }, DIE_TOP, 0.25, M.redDeep, { bevel: 0, edges: false }));

      // tally counter: case, window, three digits on a live face, a reset knob
      root.add(slab(BOX, 0, BOX_H, M.panel, { bevel: 0.6 }));
      var win = { x: BOX.x + 2.5, y: BOX.y + 6, w: 15, d: 9, r: 1 };
      root.add(slab(win, BOX_H - 0.3, 0.35, M.ink, { bevel: 0, edges: false }));
      var dc = document.createElement("canvas"); dc.width = 192; dc.height = 96;
      var dx = dc.getContext("2d"), dTex = new T.CanvasTexture(dc); dTex.colorSpace = T.SRGBColorSpace; dTex.anisotropy = 8;
      var face = new T.Mesh(new T.PlaneGeometry(win.w - 2, win.d - 2), new T.MeshBasicMaterial({ map: dTex, transparent: true }));
      face.rotation.x = -Math.PI / 2;
      face.position.copy(V(win.x + win.w / 2, win.y + win.d / 2, BOX_H + 0.08)); root.add(face);
      var shownDigits = "";
      function digits(n) {
        var s = String(n).padStart(3, "0"); if (s === shownDigits) return; shownDigits = s;
        dx.clearRect(0, 0, 192, 96); dx.fillStyle = "#F7FAFB"; dx.font = "700 64px 'Cascadia Code', ui-monospace, Menlo, monospace";
        dx.textAlign = "center"; dx.textBaseline = "middle";
        for (var i = 0; i < 3; i++) dx.fillText(s[i], 32 + i * 64, 50);
        dTex.needsUpdate = true;
      }
      root.add(cyl(BOX.x + BOX.w / 2, BOX.y + BOX.d + 3.4, 2.4, 3.2, 6.6, M.graphite));
      digits(1);

      var loop = 1, lastLeg = -1;
      /* ---------- 4. FRAME ---------- */
      return {
        root: root,
        update: function (t) {
          var p = poseAt(t), leg = p.leg, u = p.u, angle = p.angle;
          table.rotation.y = -rad(angle - ANG[0]);
          var c = polar(PATH_R, angle);
          carrier.position.copy(V(c[0], c[1], 0)); carrier.rotation.y = -rad(angle);
          var failing = (leg.kind === "dwell" && leg.station === 4 && u > 0.55) || (leg.kind === "return" && u < 0.7);
          var working = leg.kind === "dwell" ? hold(u) : 0;
          dieMat.emissiveIntensity = failing ? 0.55 : 0.35 * working;
          lampMat.emissiveIntensity += ((failing ? 1.6 : 0) - lampMat.emissiveIntensity) * 0.2;
          tools.forEach(function (g, i) {
            var d = leg.kind === "dwell" && leg.station === i ? hold(u) * DIP : 0;
            g.position.y = -d;
            var r = rods[i], top = TOOL_B + r.h - d;
            r.m.position.copy(V(r.x, r.y, top)); r.m.scale.y = HOUSING_B - top;
          });
          if (p.n !== lastLeg) { if (leg.kind === "dwell" && leg.station === 0 && lastLeg !== -1) loop = loop % 999 + 1; lastLeg = p.n; }
          digits(loop);
          var where = leg.kind === "dwell" ? NAMES[leg.station] + (leg.station === 4 && u > 0.55 ? ": fail" : "") : leg.kind === "index" ? "to " + NAMES[leg.next] : "fail → back to Floorplan";
          return "loop " + loop + " · " + where;
        },
      };
    },
  });
})();
