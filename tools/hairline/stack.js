/**
 * Stack: a 3D chip on its package, pulled slightly apart, that you can turn.
 * Five tiers stand on a substrate: a base die (TSV field, a PHY strip along one
 * edge), a logic die (four placed macros between rows of standard cells) and
 * two thin memory dies of eight banks each, HBM-style. Hover opens the stack
 * (the pointer's x sets the gap, on a spring) and its y picks a tier, which
 * takes the bright edge. Dragging turns the stack; let go and it coasts, then
 * settles on the nearest of the four 2:1 views. The slider is the widest gap.
 *
 * The pattern: scrub and pick, plus push the camera. A spring for the gap, a
 * spring for the azimuth (released with the drag's speed), and a pick made
 * against the target pose, so the stack opening cannot change the choice.
 */
const {
  Cam, clamp, facing, fit, lerp, poly, prism, proj, ringAt, rings, rrect, seg,
  spring, stepS, flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const D = 76, H = D / 2, M = 12, TS = 5;
const NAMES = ["package", "base die", "logic die", "memory die 1", "memory die 2"];
// placed macros on the logic die, in die coordinates centred on 0: [x0, y0, x1, y1]
const MACROS = [[-33, -33, -8, -14], [0, -33, 33, -19], [-33, -4, -19, 29], [9, 4, 33, 33]];
const MARK = 3, DETENT = 90, HOME = 45;

/** Heights of every tier for a gap g: bumps smallest, the hybrid bond to memory largest, memory on memory tight. */
function stackAt(g) {
  const tiers = [[-TS, 0]];
  const th = [6, 6, 4, 4], gaps = [0.3 * g, 0.8 * g, g, 0.45 * g];
  let z = 0;
  th.forEach((t, i) => { z += gaps[i]; tiers.push([z, z + t]); z += t; });
  return tiers;
}

function mount({ stage, svg, read, layout }, value) {
  const bag = disposer();
  let gmax = value, over = null, pick = -1;

  const C = Cam(HOME, 0.5, 1.62), far = stackAt(44);
  const top = far[far.length - 1][1];
  fit(C, [[-H - M, -H - M, -TS], [H + M, H + M, -TS], [H + M, -H - M, -TS], [-H - M, H + M, -TS], [-H, -H, top], [H, H, top], [-H, H, top], [H, -H, top]], 200, 164);
  let P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [sr, si] = rings(-H - M, -H - M, H + M, H + M, 8, 2.2), [dr, di] = rings(-H, -H, H, H, 5, 1.6);

  // package: a substrate with a ring of pads round the die
  const sub = solid(g), pads = [];
  for (let k = 0; k <= 10; k++) {
    const t = -H - 2 + k * 8;
    for (const [x, y] of [[t, -H - 6.5], [t, H + 6.5], [-H - 6.5, t], [H + 6.5, t]]) pads.push([x, y, flatDot(g, C, 0.9, "dot off")]);
  }
  // base die: a 5 × 5 TSV field and a PHY strip of ten lanes along one edge
  const base = solid(g), tsv = [], phy = mk("path", { class: "nf lo" }, g);
  for (let k = 0; k < 25; k++) tsv.push([-20 + (k % 5) * 10, -24 + Math.floor(k / 5) * 10, flatDot(g, C, 0.8, "dot m")]);
  const bonds = [mk("path", { class: "nf lo" }, g)];
  // logic die: standard-cell rows under four placed macros
  const logic = solid(g), rows = mk("path", { class: "nf lo" }, g), mg = mk("g", {}, g);
  const macros = MACROS.map(([x0, y0, x1, y1]) => ({ c: [(x0 + x1) / 2, (y0 + y1) / 2], rr: rings(x0, y0, x1, y1, 2.4, 1), el: solid(mg) }));
  bonds.push(mk("path", { class: "nf lo" }, g));
  // two memory dies, eight banks each
  const mem1 = solid(g), banks1 = mk("path", { class: "nf lo" }, g);
  bonds.push(mk("path", { class: "nf lo" }, g));
  const mem2 = solid(g), banks2 = mk("path", { class: "nf lo" }, g);
  const tiers = [sub, base, logic, mem1, mem2];

  const gap = spring(0.4 * gmax, { eps: 0.02 });
  let dragging = false, lastX = 0, lastT = 0, vel = 0;
  const az = spring(HOME, { k: 38, c: 11, eps: 0.05 });
  let drawn = "", order = "";

  /** Vertical bonds between two tiers, on all four edges: the die above hides the far ones. */
  const bondsAt = (zLo, zHi) => {
    let d = "";
    for (let t = -27; t <= 27; t += 13.5) for (const [x, y] of [[t, H - 3], [t, -H + 3], [H - 3, t], [-H + 3, t]]) d += seg(P(x, y, zLo), P(x, y, zHi));
    return d;
  };
  const banksAt = (z) => {
    let b = "";
    for (let c = 0; c < 2; c++) for (let k = 0; k < 4; k++) {
      const x0 = -H + 5 + c * 34, y0 = -H + 5 + k * 16.8;
      b += poly(ringAt(P, rrect(x0, y0, x0 + 32, y0 + 13.5, 2.5, 3), z));
    }
    return b;
  };
  /** The tier's corner furthest right on screen, at mid height: where a label's leader starts. */
  const corner = (r, z) => [[-r, -r], [r, -r], [r, r], [-r, r]].map(([x, y]) => P(x, y, z)).reduce((a, b) => (b[0] > a[0] ? b : a));

  function draw() {
    const key = gap.x.toFixed(3) + "|" + az.x.toFixed(3);
    if (key === drawn) return;
    drawn = key;
    C.az = (az.x * Math.PI) / 180;
    P = proj(C); front = facing(C);
    const z = stackAt(gap.x), [zs, zb, zl, zm1, zm2] = z;
    put(sub, prism(P, front, sr, si, zs[0], zs[1]));
    pads.forEach(([x, y, el]) => place(el, P(x, y, 0)));
    put(base, prism(P, front, dr, di, zb[0], zb[1]));
    tsv.forEach(([x, y, el]) => place(el, P(x, y, zb[1])));
    let p = "";
    for (let k = 0; k < 10; k++) p += poly(ringAt(P, rrect(-30 + k * 6.2, H - 9, -26 + k * 6.2, H - 4, 1, 2), zb[1]));
    phy.setAttribute("d", p);
    bonds[0].setAttribute("d", bondsAt(zb[1], zl[0]));
    put(logic, prism(P, front, dr, di, zl[0], zl[1]));
    let r = "";
    for (let y = -4; y <= 29; y += 4.2) r += seg(P(-15, y, zl[1]), P(5, y, zl[1]));
    for (let y = -16; y <= 0; y += 4) r += seg(P(-4, y, zl[1]), P(33, y, zl[1]));
    rows.setAttribute("d", r);
    // macros back to front for this azimuth: the nearer one is appended last
    const s = Math.sin(C.az), c = Math.cos(C.az), depth = (m) => m.c[0] * s + m.c[1] * c;
    const sorted = macros.slice().sort((a, b) => depth(a) - depth(b)), o = sorted.map((m) => macros.indexOf(m)).join();
    if (o !== order) { order = o; sorted.forEach((m) => mg.appendChild(m.el.g)); }
    macros.forEach((m) => put(m.el, prism(P, front, m.rr[0], m.rr[1], zl[1], zl[1] + 3.5)));
    bonds[1].setAttribute("d", bondsAt(zl[1], zm1[0]));
    put(mem1, prism(P, front, dr, di, zm1[0], zm1[1]));
    banks1.setAttribute("d", banksAt(zm1[1]));
    bonds[2].setAttribute("d", bondsAt(zm1[1], zm2[0]));
    put(mem2, prism(P, front, dr, di, zm2[0], zm2[1]));
    banks2.setAttribute("d", banksAt(zm2[1]));
    if (layout) layout([corner(H + M, -TS / 2), ...z.slice(1).map(([a, b]) => corner(H, (a + b) / 2))]);
  }

  const B = register(stage, (dt) => { const m1 = stepS(gap, dt), m2 = dragging ? false : stepS(az, dt); draw(); return m1 || m2 || dragging; });
  bag.add(B.unregister);

  function light() {
    tiers.forEach((t, i) => t.sil.classList.toggle("hi", i === pick));
    macros.forEach((m, i) => m.el.sil.classList.toggle("hi", pick === 2 || (pick < 0 && i === MARK)));
  }

  /** Which tier the pointer's height points at, read on the stack the gap is heading for (rule 01). */
  function choose(py) {
    const mids = stackAt(gap.t).map(([a, b]) => P(0, 0, (a + b) / 2)[1]);
    let best = 0;
    mids.forEach((y, i) => { if (Math.abs(py - y) < Math.abs(py - mids[best])) best = i; });
    return best;
  }

  function retarget() {
    if (!over) { gap.t = 0.4 * gmax; pick = -1; read.textContent = "rest"; }
    else {
      gap.t = lerp(2, gmax, clamp((over[0] - 70) / 250, 0, 1));
      pick = choose(over[1]);
      read.textContent = NAMES[pick];
    }
    light();
    B.wake();
  }

  // drag to turn: the azimuth follows the pointer; on release it keeps the drag's speed and settles on a 2:1 view
  const detent = (a) => HOME + Math.round((a - HOME) / DETENT) * DETENT;
  function release() {
    if (!dragging) return;
    dragging = false;
    if (performance.now() - lastT > 100) vel = 0;   // held still before letting go: no fling, just settle
    az.v = clamp(vel, -720, 720); az.t = detent(az.x + az.v * 0.22);
    B.wake();
  }
  function move(p, e) {
    const pressed = e && (e.buttons & 1) === 1;
    if (pressed && dragging) {
      const now = performance.now(), dx = p[0] - lastX, d = dx * 0.75;
      az.x += d; az.t = az.x; az.v = 0;
      vel = lerp(vel, d / Math.max(0.008, (now - lastT) / 1000), 0.5);
      lastX = p[0]; lastT = now;
      B.wake();
      return;
    }
    if (!pressed) release();
    over = p; retarget();
  }

  light();
  bag.add(pointer(stage, {
    move,
    down: (p, e) => { dragging = true; lastX = p[0]; lastT = performance.now(); vel = 0; over = p; retarget(); },
    leave: () => { release(); over = null; retarget(); },
  }));
  bag.on(stage, "pointerup", release);
  bag.on(stage, "pointercancel", release);
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { gmax = v; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "stack",
  means: "A 3D chip on its package: drag to turn it, move across to open the stack, up or down to pick a die.",
  gap: 32,   // how far the stack opens at rest
  mount,
});
