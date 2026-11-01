"""Rebuild the Archgen AG monogram + ARCHGEN AI wordmark as outlined vector paths.
Geometry measured from the 386x102 screenshot (units = source pixels)."""
import skia, math

def stroke_outline(path, w, cap=skia.Paint.kButt_Cap, join=skia.Paint.kMiter_Join, miter=10):
    p = skia.Paint(); p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(w)
    p.setStrokeCap(cap); p.setStrokeJoin(join); p.setStrokeMiter(miter)
    out = skia.Path(); p.getFillPath(path, out, None, 8.0)
    return skia.Simplify(out)

def union(paths):
    acc = skia.Path()
    for q in paths:
        acc = skia.Op(acc, q, skia.PathOp.kUnion_PathOp)
    return acc

def poly(pts, close=False):
    p = skia.Path(); p.moveTo(*pts[0])
    for x, y in pts[1:]: p.lineTo(x, y)
    if close: p.close()
    return p

def circle(x, y, r):
    p = skia.Path(); p.addCircle(x, y, r); return p

# ---------------- MARK ----------------
SM = 3.8          # mark stroke
RS, RB = 3.4, 4.0 # pad radii (small / G terminals)
A, B, C = (42.0, 64.5), (62.0, 35.5), (102.5, 35.5)
D = (60.8, 57.9); E = (D[0] + 15.0 / math.sqrt(3), 72.9)   # 60deg, parallel to G diagonal
F = (108.8, 44.3); Gc = (110.0, 71.0)
mark_parts = [
    stroke_outline(poly([A, B, C]), SM, skia.Paint.kRound_Cap),
    stroke_outline(poly([D, E]), SM, skia.Paint.kRound_Cap),
    # G: crossbar (butt) -> right side -> bottom -> long 60deg diagonal -> chamfer -> top bar
    stroke_outline(poly([(98.3, 56.7), (110.0, 56.7), (110.0, 71.0), (83.6, 71.0),
                         (83.6 - 21.5 / math.sqrt(3), 49.5), (83.6 - 21.5 / math.sqrt(3) + 5.2 / math.sqrt(3), 44.3),
                         F]), SM),
    circle(*A, RS), circle(*B, RS), circle(*C, RS), circle(*D, RS), circle(*E, RS),
    circle(*F, RB), circle(*Gc, RB),
]
mark = union(mark_parts)

# ---------------- WORDMARK ----------------
SW = 3.35
Y0, Y1 = 42.4, 66.3            # cap box (outer)
yT, yB, yM = Y0 + SW/2, Y1 - SW/2, 54.75
EXT_T, EXT_B = Y0 - 3, Y1 + 3  # strokes run past the cap box, then get clipped flat
R = 2.0                        # corner radius on round letters (centerline)

def rpath(cmds):
    """tiny builder: ('M',x,y) ('L',x,y) ('A',cx,cy,x,y) quadratic corner via control point."""
    p = skia.Path()
    for c in cmds:
        if c[0] == 'M': p.moveTo(c[1], c[2])
        elif c[0] == 'L': p.lineTo(c[1], c[2])
        elif c[0] == 'Q': p.conicTo(c[1], c[2], c[3], c[4], math.sqrt(0.5))
    return p

def letter_A(x0, w):
    # outer: bottom x0..x0+w, flat apex ~5 wide starting 10 in
    lb, rb = x0, x0 + w
    lt, rt = x0 + 10.0, x0 + w - 9.4
    hw_l = (SW/2) / math.cos(math.atan((lt-lb)/(Y1-Y0)))
    hw_r = (SW/2) / math.cos(math.atan((rb-rt)/(Y1-Y0)))
    # centerlines as functions of y
    L = lambda y: (lb + hw_l) + (Y1 - y) * (lt - lb) / (Y1 - Y0)
    Rr = lambda y: (rb - hw_r) - (Y1 - y) * (rb - rt) / (Y1 - Y0)
    # apex intersection
    t = ((rb - hw_r) - (lb + hw_l)) / ((lt - lb)/(Y1-Y0) + (rb - rt)/(Y1-Y0))
    ay = Y1 - t; ax = L(ay)
    legs = stroke_outline(poly([(L(EXT_B), EXT_B), (ax, ay), (Rr(EXT_B), EXT_B)]), SW)
    bar = stroke_outline(poly([(L(59.4), 59.4), (Rr(59.4), 59.4)]), SW)
    return [legs, bar]

def letter_R(x0, x1):
    s = x0 + SW/2; r = x1 - SW/2
    bowl = rpath([('M', s, EXT_B), ('L', s, yT), ('L', r - R, yT), ('Q', r, yT, r, yT + R),
                  ('L', r, 54.9 - R), ('Q', r, 54.9, r - R, 54.9), ('L', s, 54.9)])
    leg = poly([(167.5 - 155.9 + x0, 54.9), (x1 - SW/2 + 0.9, EXT_B)])
    return [stroke_outline(bowl, SW), stroke_outline(leg, SW)]

def letter_C(x0, x1):
    l = x0 + SW/2
    return [stroke_outline(rpath([('M', x1, yT), ('L', l + R, yT), ('Q', l, yT, l, yT + R),
                                  ('L', l, yB - R), ('Q', l, yB, l + R, yB), ('L', x1, yB)]), SW)]

def letter_H(x0, x1):
    l, r = x0 + SW/2, x1 - SW/2
    return [stroke_outline(poly([(l, EXT_T), (l, EXT_B)]), SW), stroke_outline(poly([(r, EXT_T), (r, EXT_B)]), SW),
            stroke_outline(poly([(l, yM), (r, yM)]), SW)]

def letter_G(x0, x1):
    l, r = x0 + SW/2, x1 - SW/2
    return [stroke_outline(rpath([('M', x1, yT), ('L', l + R, yT), ('Q', l, yT, l, yT + R),
                                  ('L', l, yB - R), ('Q', l, yB, l + R, yB), ('L', r - R, yB),
                                  ('Q', r, yB, r, yB - R), ('L', r, yM), ('L', x0 + 8.8, yM)]), SW)]

def letter_E(x0, x1):
    l = x0 + SW/2
    return [stroke_outline(poly([(x1, yT), (l, yT), (l, yB), (x1, yB)]), SW),
            stroke_outline(poly([(l, yM), (x1 - 2.0, yM)]), SW)]

def letter_N(x0, x1):
    l, r = x0 + SW/2, x1 - SW/2
    return [stroke_outline(poly([(l, EXT_B), (l, yT - 1.2), (r, yB + 1.2), (r, EXT_T)]), SW)]

def letter_I(x0):
    c = x0 + SW/2
    return [stroke_outline(poly([(c, EXT_T), (c, EXT_B)]), SW)]

parts = []
parts += letter_A(127.0, 24.4)
parts += letter_R(155.9, 176.4)
parts += letter_C(182.6, 202.6)
parts += letter_H(208.1, 229.2)
parts += letter_G(235.3, 256.3)
parts += letter_E(261.9, 281.3)
parts += letter_N(286.3, 306.9)
parts += letter_A(324.1, 24.6)
parts += letter_I(354.0)
word = union(parts)
clip = skia.Path(); clip.addRect(skia.Rect.MakeLTRB(100, Y0, 400, Y1))
word = skia.Simplify(skia.Op(word, clip, skia.PathOp.kIntersect_PathOp))
mark = skia.Simplify(mark)
print('fill', word.getFillType(), mark.getFillType())

# ---------------- export ----------------
def to_d(path, dx, dy, k):
    out = []
    it = skia.Path.Iter(path, False)
    f = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
    P = lambda pt: f'{f((pt.x()+dx)*k)} {f((pt.y()+dy)*k)}'
    while True:
        verb, pts = it.next()
        if verb == skia.Path.Verb.kDone_Verb: break
        if verb == skia.Path.Verb.kMove_Verb: out.append('M' + P(pts[0]))
        elif verb == skia.Path.Verb.kLine_Verb: out.append('L' + P(pts[1]))
        elif verb == skia.Path.Verb.kQuad_Verb: out.append('Q' + P(pts[1]) + ' ' + P(pts[2]))
        elif verb == skia.Path.Verb.kConic_Verb:
            # convert conic to quads
            quads = skia.Path.ConvertConicToQuads(pts[0], pts[1], pts[2], it.conicWeight(), 2)
            for i in range(1, len(quads) - 1, 2):
                out.append('Q' + P(quads[i]) + ' ' + P(quads[i+1]))
        elif verb == skia.Path.Verb.kCubic_Verb: out.append('C' + P(pts[1]) + ' ' + P(pts[2]) + ' ' + P(pts[3]))
        elif verb == skia.Path.Verb.kClose_Verb: out.append('Z')
    return ''.join(out)

K = 10  # scale up so coordinates are clean
mb = mark.computeTightBounds(); wb = word.computeTightBounds()
pad = 0
ox, oy = -mb.left(), -min(mb.top(), wb.top())
H = (max(mb.bottom(), wb.bottom()) - min(mb.top(), wb.top()))
Wl = (wb.right() - mb.left())
mark_d = to_d(mark, ox, oy, K); word_d = to_d(word, ox, oy, K)
VW, VH = round(Wl*K), round(H*K)

# standalone mark, own tight box
mw, mh = mb.width(), mb.height()
mark_only_d = to_d(mark, -mb.left(), -mb.top(), K)
MW, MH = round(mw*K), round(mh*K)

def svg(vw, vh, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

import os, json
os.makedirs('out', exist_ok=True)
for name, col in [('cream', '#F7F7EE'), ('black', '#050505'), ('red', '#FF2A1F')]:
    open(f'out/archgen-ai-lockup-{name}.svg', 'w').write(svg(VW, VH, f'<path fill-rule="evenodd" fill="{col}" d="{mark_d}"/><path fill-rule="evenodd" fill="{col}" d="{word_d}"/>', 'Archgen AI'))
    open(f'out/archgen-ai-mark-{name}.svg', 'w').write(svg(MW, MH, f'<path fill-rule="evenodd" fill="{col}" d="{mark_only_d}"/>', 'Archgen AI'))
# accent lockup: cream with fluorescent red on the G terminal pads? keep pure; plus app tiles
S = 1024; m = 0.62 * S / max(MW, MH)
tx, ty = (S - MW*m)/2, (S - MH*m)/2
for name, bg, fg in [('on-black', '#050505', '#F7F7EE'), ('on-red', '#A3161D', '#F7F7EE'), ('on-cream', '#F7F7EE', '#050505')]:
    open(f'out/archgen-ai-app-tile-{name}.svg', 'w').write(svg(S, S, f'<rect width="{S}" height="{S}" rx="{int(S*0.2)}" fill="{bg}"/><path fill-rule="evenodd" transform="translate({tx:.1f} {ty:.1f}) scale({m:.4f})" fill="{fg}" d="{mark_only_d}"/>', 'Archgen AI'))
json.dump({'lockup_vb': [VW, VH], 'mark_vb': [MW, MH], 'mark_d': mark_only_d, 'lockup_mark_d': mark_d, 'word_d': word_d}, open('out/paths.json', 'w'))
print(VW, VH, MW, MH, len(mark_d), len(word_d))
