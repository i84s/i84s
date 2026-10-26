"""15s premium ad compositor. Built only from the supplied footage.
Output: 1080x1920, 30 fps, 450 frames, raw RGB piped to stdout (or PNG previews)."""
import cv2, numpy as np, json, sys, math
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS, N = 1080, 1920, 30, 450
SRC = "src/f/%03d.png"
TR = json.load(open("tracks.json"))
rng = np.random.default_rng(7)

# ---------- helpers ----------
def clamp01(x): return max(0.0, min(1.0, x))
def lin(t, a, b): return clamp01((t - a) / (b - a)) if b != a else float(t >= a)
def ease(x): x = clamp01(x); return x * x * (3 - 2 * x)
def eio3(x): x = clamp01(x); return 4 * x**3 if x < .5 else 1 - (-2 * x + 2)**3 / 2
def eout3(x): x = clamp01(x); return 1 - (1 - x)**3
def mix(a, b, k): return a + (b - a) * k

@lru_cache(maxsize=64)
def src(i):
    return cv2.imread(SRC % i)[:, :, ::-1].astype(np.float32) / 255.0

def Hmat(name, i, ref):
    """ref-frame coords -> frame i coords (3x3)."""
    T = TR[name]
    return np.array(T[str(i)]) @ np.linalg.inv(np.array(T[str(ref)]))

def cam_matrix(cx, cy, w, rot_deg):
    """output px -> ref coords (3x3)."""
    s = w / W; r = math.radians(rot_deg); c, si = math.cos(r) * s, math.sin(r) * s
    return np.array([[c, -si, cx - c * W / 2 + si * H / 2],
                     [si, c, cy - si * W / 2 - c * H / 2],
                     [0, 0, 1]])

def _shift_fit(cx, cy, w, rot, Hs):
    """Shift camera (continuously) to sit inside all frames; returns (cx, cy, overflow_px)."""
    corners = np.array([[0, 0, 1], [W, 0, 1], [0, H, 1], [W, H, 1]], float).T
    over = 0.0
    for _ in range(30):
        lo_x = lo_y = -1e9; hi_x = hi_y = 1e9
        for Hf in Hs:
            p = Hf @ cam_matrix(cx, cy, w, rot) @ corners
            lo_x = max(lo_x, -p[0].min()); hi_x = min(hi_x, 720 - p[0].max())
            lo_y = max(lo_y, -p[1].min()); hi_y = min(hi_y, 1280 - p[1].max())
        dx = lo_x if lo_x > 0 else (hi_x if hi_x < 0 else 0.0)
        dy = lo_y if lo_y > 0 else (hi_y if hi_y < 0 else 0.0)
        over = max(0.0, lo_x - hi_x, lo_y - hi_y)
        if abs(dx) < 0.01 and abs(dy) < 0.01: break
        cx += dx * 0.9; cy += dy * 0.9
    return cx, cy, over

PATH = {}
CUR = {"fi": None}
def fit_cam(cx, cy, w, rot, Hs):
    """Largest camera <= requested that fits every frame in Hs (continuous in its inputs).
    During the final render the pre-smoothed path is used instead."""
    if CUR["fi"] in PATH: return tuple(PATH[CUR["fi"]])
    c2, d2, over = _shift_fit(cx, cy, w, rot, Hs)
    if over <= 0.01: return c2, d2, w
    lo, hi = 0.5, 1.0
    for _ in range(22):
        m = (lo + hi) / 2
        if _shift_fit(cx, cy, w * m, rot, Hs)[2] <= 0.01: lo = m
        else: hi = m
    c2, d2, _ = _shift_fit(cx, cy, w * lo, rot, Hs)
    return c2, d2, w * lo

def warp(img, M):
    """M: output px -> image px (3x3)."""
    return cv2.warpAffine(img, M[:2], (W, H), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_REPLICATE)

def sample(name, ref, fsrc, C, lo, hi):
    """Frame-blended sample of a tracked segment at fractional source frame fsrc."""
    fsrc = min(max(fsrc, lo), hi)
    a = int(math.floor(fsrc)); b = min(a + 1, hi); k = fsrc - a
    out = warp(src(a), Hmat(name, a, ref) @ C)
    if k > 1e-3 and b != a:
        out = out * (1 - k) + warp(src(b), Hmat(name, b, ref) @ C) * k
    return out

# ---------- static assets ----------
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
def vignette(strength=0.55, cx=0.5, cy=0.46, rad=0.85):
    d = np.sqrt(((XX / W - cx) * 1.0) ** 2 + ((YY / H - cy) * 0.62) ** 2) / (rad * 0.62)
    return (1 - strength * np.clip(d, 0, 1.4) ** 2.2)[..., None].clip(0, 1)
VIG = vignette()

# stable product mask in stack ref (frame 221) coords: average of per-frame masks warped to ref
def build_stack_mask():
    acc = np.zeros((1280, 720), np.float32); n = 0
    for i in range(221, 285):
        m = cv2.imread("masks/%03d.png" % i, 0).astype(np.float32) / 255
        Hi = Hmat("stack", i, 221)  # ref->i ; warp i into ref
        acc += cv2.warpAffine(m, Hi[:2], (720, 1280), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
        n += 1
    acc /= n
    hard = (acc > 0.45).astype(np.uint8)
    hard = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    soft = cv2.GaussianBlur(cv2.dilate(hard.astype(np.float32), np.ones((31, 31))), (0, 0), 38)
    return hard, np.clip(soft * 1.15, 0, 1)
SM_HARD, SM_SOFT = build_stack_mask()

def stack_contours():
    hm = SM_HARD.copy(); hm[:368] = 0          # trace the front stack only (top cup mask is partial)
    cs, _ = cv2.findContours(hm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in sorted(cs, key=cv2.contourArea, reverse=True)[:1]:
        p = c[:, 0, :].astype(np.float32)
        # smooth along the curve
        k = 15; pad = np.vstack([p[-k:], p, p[:k]])
        ker = np.ones(2 * k + 1) / (2 * k + 1)
        p = np.stack([np.convolve(pad[:, 0], ker, 'valid'), np.convolve(pad[:, 1], ker, 'valid')], 1)
        # drop points hugging the frame border (not a real silhouette edge)
        keep = (p[:, 0] > 8) & (p[:, 0] < 712) & (p[:, 1] > 376) & (p[:, 1] < 1272)
        out.append((p, keep))
    return out
CONTOURS = stack_contours()

# dust motes for the volumetric beam
MOTES = [(rng.uniform(0, W), rng.uniform(0, H), rng.uniform(1.2, 3.2), rng.uniform(-6, 6), rng.uniform(-14, -4), rng.uniform(0.3, 1.0))
         for _ in range(46)]

FONT_DIR = "/usr/share/fonts/opentype/inter/"
CREAM = np.array([246, 234, 214], np.float32) / 255
GOLD = np.array([214, 178, 118], np.float32) / 255

def text_sprites(text, font, size, tracking):
    f = ImageFont.truetype(FONT_DIR + font, size)
    sprites = []; x = 0
    for ch in text:
        bb = f.getbbox(ch)
        adv = f.getlength(ch)
        if ch != " ":
            im = Image.new("L", (int(adv) + 40, size * 2), 0)
            ImageDraw.Draw(im).text((20, size // 2), ch, font=f, fill=255)
            sprites.append((x, np.asarray(im, np.float32) / 255))
        x += adv + tracking
    return sprites, x - tracking

TXT = {
    "h1": text_sprites("EVERY LAYER,", "InterDisplay-Light.otf", 74, 14),
    "h2": text_sprites("REVEALED.", "InterDisplay-SemiBold.otf", 74, 14),
    "cta": text_sprites("DISCOVER MORE", "InterDisplay-Medium.otf", 40, 12),
    "c1": text_sprites("SWIRLED CENTER", "InterDisplay-Medium.otf", 30, 7),
    "c2": text_sprites("CRUST", "InterDisplay-Medium.otf", 30, 7),
}

def draw_text(img, key, x0, y0, t, t_in, stagger=0.028, dur=0.45, t_out=None, out_dur=0.35, color=CREAM, center=True, blur_in=True):
    sprites, width = TXT[key]
    if center: x0 = x0 - width / 2
    for j, (dx, spr) in enumerate(sprites):
        a = eout3(lin(t, t_in + j * stagger, t_in + j * stagger + dur))
        if t_out is not None: a *= 1 - ease(lin(t, t_out + j * stagger * 0.5, t_out + j * stagger * 0.5 + out_dur))
        if a <= 0.003: continue
        rise = (1 - a) * 22
        s = spr
        if blur_in and a < 0.98: s = cv2.GaussianBlur(spr, (0, 0), 0.3 + 5 * (1 - a))
        X = int(round(x0 + dx - 20)); Y = int(round(y0 - spr.shape[0] / 4 + rise))
        h, w = s.shape
        ys, xs = max(0, Y), max(0, X); ye, xe = min(H, Y + h), min(W, X + w)
        if ye <= ys or xe <= xs: continue
        al = s[ys - Y:ye - Y, xs - X:xe - X, None] * a
        img[ys:ye, xs:xe] = img[ys:ye, xs:xe] * (1 - al) + color * al
    return width

def line_layer():
    return np.zeros((H, W), np.float32)

def add_glow_lines(img, layer, color, glow=0.9):
    if layer.max() <= 0: return img
    g = cv2.GaussianBlur(layer, (0, 0), 6) * glow
    a = np.clip(layer + g, 0, 1)[..., None]
    return img * (1 - a * 0.85) + color * a

def poly_partial(layer, pts, frac, thick=2, val=1.0):
    """Draw first `frac` of a polyline (by arc length), anti-aliased, in output px."""
    if frac <= 0 or len(pts) < 2: return
    seg = np.hypot(*np.diff(pts, axis=0).T); cum = np.concatenate([[0], np.cumsum(seg)])
    L = cum[-1] * min(frac, 1); n = np.searchsorted(cum, L)
    p = pts[:max(n, 1) + 1].copy()
    if n < len(pts) and n > 0:
        k = (L - cum[n - 1]) / max(seg[n - 1], 1e-6); p[-1] = pts[n - 1] + (pts[n] - pts[n - 1]) * k
    cv2.polylines(layer, [np.round(p * 16).astype(np.int32)], False, val, thick, cv2.LINE_AA, shift=4)
    return p[-1]

def to_out(Cinv, pts):
    P = np.c_[pts, np.ones(len(pts))] @ Cinv.T
    return P[:, :2]

def light_sweep(t, t0, t1, angle=-28, width=150, strength=0.55):
    k = lin(t, t0, t1)
    if k <= 0 or k >= 1: return None
    r = math.radians(angle)
    d = XX * math.cos(r) + YY * math.sin(r)
    lo, hi = d.min() - 300, d.max() + 300
    p = mix(lo, hi, eio3(k))
    return (np.exp(-((d - p) / width) ** 2) * strength * math.sin(math.pi * k) ** 0.5)[..., None]

def grade(img, warmth=1.0, contrast=1.12, lift=0.012):
    img = np.clip(img, 0, None)
    img = img * np.array([1.0 + 0.04 * warmth, 1.0, 1.0 - 0.06 * warmth], np.float32)
    # filmic-ish S curve around 0.42
    img = 0.42 + (img - 0.42) * contrast
    img = np.clip(img, 0, None)
    img = img / (1 + 0.18 * img)  # soft highlight roll-off
    img = img * 1.18
    img = img + np.array([lift, lift * 0.75, lift * 0.5], np.float32)
    return img

def motes(img, t, beam_strength, cx=760, cy=-200, spread=0.42):
    if beam_strength <= 0: return img
    # soft volumetric cone from top-right
    ang = np.arctan2(XX - cx, YY - cy); cone = np.exp(-((ang + 0.42) / spread) ** 2)
    fall = np.clip(1 - (YY - cy) / (H * 1.3), 0, 1)
    beam = (cone * fall * 0.075 * beam_strength)[..., None] * np.array([1.0, 0.86, 0.66], np.float32)
    img = img + beam
    lay = np.zeros((H, W), np.float32)
    for (x, y, r, vx, vy, b) in MOTES:
        X = (x + vx * t * 3) % W; Y = (y + vy * t * 3) % H
        a = math.atan2(X - cx, Y - cy); c = math.exp(-((a + 0.42) / spread) ** 2)
        if c < 0.08: continue
        cv2.circle(lay, (int(X * 4), int(Y * 4)), int(r * 4), b * c, -1, cv2.LINE_AA, shift=2)
    lay = cv2.GaussianBlur(lay, (0, 0), 1.6) * 1.6 * beam_strength
    return img + lay[..., None] * np.array([1.0, 0.9, 0.75], np.float32)

def hblur(img, L):
    L = int(L)
    if L < 3: return img
    k = np.ones((1, L), np.float32) / L
    return cv2.filter2D(img, -1, k, borderType=cv2.BORDER_REPLICATE)

def zoomblur(img, amt, cx=W / 2, cy=H / 2, n=7):
    if amt < 0.004: return img
    acc = img.copy()
    for j in range(1, n):
        s = 1 + amt * j / n
        M = np.array([[s, 0, cx - s * cx], [0, s, cy - s * cy]], np.float32)
        acc += cv2.warpAffine(img, M, (W, H), borderMode=cv2.BORDER_REPLICATE)
    return acc / n

# ---------- shot renderers ----------
def stack_shot(t, fsrc, cx, cy, w, rot, pan=0.0, relight=0.85, prod_gain=1.0, rim=0.0, clamp_frames=None):
    frames = clamp_frames or [int(math.floor(fsrc)), min(int(math.floor(fsrc)) + 1, 284)]
    cx, cy, w = fit_cam(cx, cy, w, rot, [Hmat("stack", i, 221) for i in frames])
    C = cam_matrix(cx + pan * w / W, cy, w, rot)
    img = sample("stack", 221, fsrc, C, 221, 284)
    m = warp(SM_SOFT, C)[..., None]  # mask is in ref coords -> output via C only
    bg = 1 - relight
    img = img * (bg + (1 - bg) * m) * np.where(m > 0, 1, 1)
    img = img * mix(1.0, prod_gain, m)
    if rim > 0:  # warm rim along the upper/left silhouette
        e = cv2.GaussianBlur(warp(SM_HARD.astype(np.float32), C), (0, 0), 3)
        gy = cv2.Sobel(e, cv2.CV_32F, 0, 1, ksize=5); gx = cv2.Sobel(e, cv2.CV_32F, 1, 0, ksize=5)
        edge = np.clip(gy * 0.7 + gx * 0.4, 0, None)
        edge = cv2.GaussianBlur(edge / (edge.max() + 1e-6), (0, 0), 5)
        img = img + (edge * rim * 0.5)[..., None] * np.array([1.0, 0.8, 0.55], np.float32)
    return img, C, m

def frame(fi):
    CUR["fi"] = fi
    t = fi / FPS
    img = None

    # ===== SCENE 1 — HOOK (0–2s): macro of the real filling, born from darkness =====
    if t < 2.0:
        k = eio3(t / 2.0)
        fs = 221 + 10 * (t / 2.0)
        img, C, m = stack_shot(t, fs, mix(418, 404, k), mix(304, 318, k), mix(352, 296, k), mix(-2.2, -1.0, k),
                               relight=0.9, clamp_frames=[221, 232])
        # spotlight opening from the highlight
        R = mix(60, 1300, eout3(lin(t, 0.22, 1.6)))
        d = np.sqrt((XX - 600) ** 2 + ((YY - 900) * 0.8) ** 2)
        spot = np.clip(1 - (d - R) / 420, 0, 1)[..., None] ** 1.5
        expo = ease(lin(t, 0.18, 1.0))
        img = img * spot * expo
        sw = light_sweep(t, 0.30, 1.55, angle=-24, width=120, strength=0.45)
        if sw is not None: img = img + sw * img * 1.6 + sw * 0.05
        # anamorphic glint synced with the boom
        g = math.exp(-((t - 0.36) / 0.16) ** 2) * 0.9
        if g > 0.01:
            streak = np.exp(-((YY - 900) / 5) ** 2) * np.exp(-((XX - 600) / 380) ** 2)
            core = np.exp(-(((XX - 600) / 30) ** 2 + ((YY - 900) / 30) ** 2))
            img = img + ((streak * 0.7 + core) * g)[..., None] * np.array([1.0, 0.85, 0.62], np.float32)
        img = grade(img, contrast=1.15)
        img = motes(img, t, 0.9 * ease(lin(t, 0.1, 0.8)))
        img = img * VIG

    # ===== SCENE 2 — PREMIUM REVEAL (2–5s): pull back, line-art traces the real silhouette, light rises =====
    elif t < 5.0:
        lt = t - 2.0
        k = eio3(lin(lt, 0.0, 1.7))
        fs = 231 + 22 * (lt / 3.0)
        cx = mix(380, 368, k) - 14 * eio3(lt / 3.0)
        cy = mix(332, 640, k); w = mix(296, 700, k)
        rot = mix(-1.0, 0.0, k) + 1.4 * eio3(lt / 3.0)
        # product dims to a silhouette while the drawing traces it, then light comes up inside the outline
        gain = mix(1.0, 0.16, ease(lin(lt, 0.05, 0.6))) + 0.84 * eio3(lin(lt, 1.35, 2.35))
        pan = 0.0
        if lt > 2.78: pan = -340 * (lin(lt, 2.78, 3.0) ** 2.2)   # whip-out to the left
        img, C, m = stack_shot(t, fs, cx, cy, w, rot, pan=pan, relight=0.88, prod_gain=gain,
                               rim=0.9 * ease(lin(lt, 1.5, 2.4)))
        sw = light_sweep(t, 3.55, 4.55, angle=-62, width=160, strength=0.42)
        if sw is not None: img = img + sw * img * m * 1.5
        img = grade(img)
        img = motes(img, t, 0.55)
        # line art (ref coords -> output)
        Cinv = np.linalg.inv(C)
        lay = line_layer()
        draw = eio3(lin(lt, 0.25, 1.55)); fade = 1 - ease(lin(lt, 1.9, 2.7))
        if draw > 0 and fade > 0:
            for (p, keep) in CONTOURS:
                q = to_out(Cinv, p)
                # break the path where it hugs frame edges
                runs = np.split(np.arange(len(q)), np.where(np.diff(keep.astype(int)) != 0)[0] + 1)
                for r in runs:
                    if keep[r[0]] and len(r) > 20:
                        poly_partial(lay, q[r], draw, thick=2, val=fade)
            # turntable plinth ellipse under the front stack
            cxe, cye = to_out(Cinv, np.array([[520, 985]]))[0]
            sc = W / w
            ax = (int(330 * sc), int(46 * sc))
            ang_end = int(360 * eio3(lin(lt, 0.5, 1.7)))
            if ang_end > 0:
                cv2.ellipse(lay, (int(cxe * 16), int(cye * 16)), (ax[0] * 16, ax[1] * 16), rot, 180, 180 + ang_end,
                            0.65 * fade, 2, cv2.LINE_AA, shift=4)
        img = add_glow_lines(img, lay, GOLD, glow=1.1)
        img = img * VIG
        if pan: img = hblur(img, abs(pan) * 0.55)

    # ===== SCENE 3 — 3D EXPERIENCE (5–9s): packaging -> push through the window -> the real break-open with callouts =====
    elif t < 9.0:
        lt = t - 5.0
        if lt < 1.0:
            # packaging beat (real box, frames 18-34)
            fs = 18 + 16 * lt
            a = int(fs); b = min(a + 1, 34); kk = fs - a
            pz = eio3(lt)
            wv = mix(560, 520, pz); cxv = 392; cyv = mix(590, 575, pz)
            pan = 340 * (1 - eout3(lin(lt, 0.0, 0.24)))           # whip-in from the right
            zoom = ease(lin(lt, 0.80, 1.0))                        # push through the window
            wv = wv * (1 - 0.55 * zoom); cyv = mix(cyv, 520, zoom); cxv = mix(cxv, 400, zoom)
            C = cam_matrix(cxv + pan * wv / W, cyv, wv, mix(8, 12, pz))
            img = warp(src(a), C) * (1 - kk) + warp(src(b), C) * kk
            bx, by = to_out(np.linalg.inv(C), np.array([[395.0, 560.0]]))[0]
            d = np.sqrt(((XX - bx) / 640) ** 2 + ((YY - by) / 560) ** 2)
            img = img * (0.16 + 0.84 * np.exp(-d ** 2 * 1.5))[..., None]
            sw = light_sweep(t, 5.15, 5.85, angle=-35, width=140, strength=0.34)
            if sw is not None: img = img + sw * img * 1.3
            img = grade(img, contrast=1.1)
            img = motes(img, t, 0.35)
            img = img * VIG
            if pan > 1: img = hblur(img, pan * 0.55)
            if zoom > 0: img = zoomblur(img, 0.5 * zoom, W / 2, H * 0.45)
            fl = ease(lin(lt, 0.9, 1.0))
            if fl > 0: img = img * (1 - 0.35 * fl) + fl * 0.35 * np.array([1.0, 0.9, 0.75], np.float32)
        else:
            ll = lt - 1.0                                  # 0..3
            fs = 112 + 90 * (ll / 3.0)
            pz = eio3(ll / 3.0)
            land = 1 - eout3(lin(ll, 0.0, 0.35))           # landing from the zoom-through
            cx, cy, w = 262 - 12 * pz, 470 - 20 * pz, mix(470, 405, pz) * (1 + 0.5 * land)
            rot = mix(1.5, -0.5, pz)
            a = int(fs)
            cx, cy, w = fit_cam(cx, cy, w, rot, [Hmat("brk", i, 112) for i in (a, min(a + 1, 202))])
            C = cam_matrix(cx, cy, w, rot)
            img = sample("brk", 112, fs, C, 112, 202)
            Cinv = np.linalg.inv(C)
            # local relight around the cup (pulls focus away from hand/background)
            ccx, ccy = to_out(Cinv, np.array([[205, 380]]))[0]
            d = np.sqrt(((XX - ccx) / 620) ** 2 + ((YY - ccy) / 560) ** 2)
            img = img * (0.22 + 0.78 * np.exp(-d ** 2 * 1.6))[..., None]
            img = grade(img, contrast=1.12)
            img = motes(img, t, 0.3)
            # technical callouts tracked to the real filling and crust
            lay = line_layer(); out = 1 - ease(lin(ll, 2.45, 2.85))
            P = to_out(Cinv, np.array([[232, 418], [96, 402]]))
            # reticle + leader for the filling
            r1 = eio3(lin(ll, 0.55, 1.05))
            if r1 > 0 and out > 0:
                rr = int(64 * W / w * 0.62 * 16)
                cv2.ellipse(lay, (int(P[0, 0] * 16), int(P[0, 1] * 16)), (rr, rr), -90, 0, int(360 * r1), out, 2, cv2.LINE_AA, 4)
                cv2.circle(lay, (int(P[0, 0] * 16), int(P[0, 1] * 16)), 4 * 16, out * r1, -1, cv2.LINE_AA, 4)
                end1 = np.array([P[0, 0] + 120, 1290.0]); knee1 = np.array([P[0, 0] + 120, P[0, 1] + rr / 16 * 0.7 + 60])
                start1 = P[0] + np.array([rr / 16 * 0.45, rr / 16 * 0.85])
                tip = poly_partial(lay, np.array([start1, knee1, end1, end1 + [170, 0]]), eio3(lin(ll, 0.85, 1.35)), 2, out)
            # crust leader
            r2 = eio3(lin(ll, 1.25, 1.7))
            if r2 > 0 and out > 0:
                cv2.circle(lay, (int(P[1, 0] * 16), int(P[1, 1] * 16)), 4 * 16, out * r2, -1, cv2.LINE_AA, 4)
                poly_partial(lay, np.array([P[1], [P[1, 0], 330.0], [P[1, 0] + 150, 330.0]]), r2, 2, out)
            img = add_glow_lines(img, lay, GOLD, glow=0.9)
            if out > 0:
                tmp = img.copy()
                draw_text(tmp, "c1", P[0, 0] + 128, 1236, ll, 1.25, stagger=0.02, dur=0.35, center=False, color=CREAM)
                draw_text(tmp, "c2", P[1, 0] + 8, 276, ll, 1.6, stagger=0.03, dur=0.35, center=False, color=CREAM)
                img = mix(img, tmp, out)
            img = img * VIG
            if land > 0: img = zoomblur(img, 0.35 * land, W / 2, H * 0.42)
            fl = 1 - ease(lin(ll, 0.0, 0.25))
            if fl > 0: img = img * (1 - 0.2 * fl) + fl * 0.2 * np.array([1.0, 0.9, 0.75], np.float32)
            pan = 0.0
            if ll > 2.8: pan = -360 * (lin(ll, 2.8, 3.0) ** 2.2)
            if pan:
                img = np.roll(img, int(pan * 0.35), axis=1); img = hblur(img, abs(pan) * 0.6)

    # ===== SCENE 4 — HERO (9–12s): whip-in + speed ramp, hero light sweep, headline =====
    elif t < 12.0:
        lt = t - 9.0
        fs = 253 + 31 * eout3(lt / 3.0)                   # speed ramp: fast -> slow-motion
        pz = eio3(lt / 3.0)
        pan = 380 * (1 - eout3(lin(lt, 0.0, 0.3)))
        img, C, m = stack_shot(t, fs, 418 - 10 * pz, 640 - 10 * pz, mix(640, 600, pz), mix(-1.2, 0.0, pz), pan=pan,
                               relight=0.9, rim=0.85, clamp_frames=[253, 284])
        sw = light_sweep(t, 9.45, 10.55, angle=-58, width=170, strength=0.6)
        if sw is not None: img = img + sw * img * m * 1.7 + sw * 0.03
        img = grade(img)
        img = motes(img, t, 0.55)
        img = img * VIG
        # bottom scrim for type
        sc = np.clip((YY - 1080) / 620, 0, 1)[..., None] ** 1.4
        img = img * (1 - 0.82 * sc)
        if pan > 1: img = hblur(img, pan * 0.55)
        draw_text(img, "h1", W / 2, 1352, t, 9.95, stagger=0.03, dur=0.5)
        draw_text(img, "h2", W / 2, 1446, t, 10.45, stagger=0.035, dur=0.5)
        rl = eio3(lin(t, 10.3, 11.0))
        if rl > 0:
            lay = line_layer(); cv2.line(lay, (int((W / 2 - 90 * rl) * 16), 1318 * 16), (int((W / 2 + 90 * rl) * 16), 1318 * 16), 1.0, 2, cv2.LINE_AA, 4)
            img = add_glow_lines(img, lay, GOLD, glow=0.6)

    # ===== SCENE 5 — FINALE (12–15s): held hero frame, final light sweep, CTA =====
    else:
        lt = t - 12.0
        pz = eio3(lt / 3.0)
        img, C, m = stack_shot(t, 284, 408 - 6 * pz, 630 - 6 * pz, mix(600, 572, pz), 0.0,
                               relight=0.9, rim=0.85, clamp_frames=[284])
        sw = light_sweep(t, 12.55, 13.75, angle=-58, width=200, strength=0.5)
        if sw is not None: img = img + sw * img * m * 1.5 + sw * 0.025
        img = grade(img)
        img = motes(img, t, 0.5 * (1 - 0.6 * ease(lin(lt, 2.0, 3.0))))
        img = img * VIG
        sc = np.clip((YY - 1080) / 620, 0, 1)[..., None] ** 1.4
        img = img * (1 - 0.82 * sc)
        # headline carries over then hands off to the CTA
        draw_text(img, "h1", W / 2, 1352, t, -1, t_out=12.05, out_dur=0.4)
        draw_text(img, "h2", W / 2, 1446, t, -1, t_out=12.12, out_dur=0.4)
        rl = 1 - eio3(lin(t, 12.0, 12.45))
        lay = line_layer()
        if rl > 0: cv2.line(lay, (int((W / 2 - 90 * rl) * 16), 1318 * 16), (int((W / 2 + 90 * rl) * 16), 1318 * 16), 1.0, 2, cv2.LINE_AA, 4)
        rc = eio3(lin(t, 13.0, 13.6))
        if rc > 0:
            y = 1468
            cv2.line(lay, (int((W / 2 - 150 * rc) * 16), (y + 46) * 16), (int((W / 2 + 150 * rc) * 16), (y + 46) * 16), 0.8, 2, cv2.LINE_AA, 4)
        img = add_glow_lines(img, lay, GOLD, glow=0.6)
        draw_text(img, "cta", W / 2, 1410, t, 13.0, stagger=0.025, dur=0.45)

    # ---- finishing: bloom, sharpen, grain ----
    img = np.clip(img, 0, 4)
    hi = np.clip(img - 0.78, 0, None)
    small = cv2.resize(hi, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    bloom = cv2.resize(cv2.GaussianBlur(small, (0, 0), 9), (W, H), interpolation=cv2.INTER_LINEAR)
    img = img + bloom * 0.35
    bl = cv2.GaussianBlur(img, (0, 0), 1.4)
    img = img + (img - bl) * 0.55
    g = np.random.default_rng(fi).normal(0, 0.011, (H // 2, W // 2)).astype(np.float32)
    img = img + cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    img = 1 - np.exp(-img * 1.0) * 0 if False else img
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)

import os
if os.path.exists("campath.json"):
    PATH.update({int(k): v for k, v in json.load(open("campath.json")).items()})

if __name__ == "__main__":
    if sys.argv[1] == "campath":
        from scipy.ndimage import minimum_filter1d, gaussian_filter1d
        PATH.clear(); raw = {}
        orig_fit = fit_cam
        def rec(*a):
            r = orig_fit(*a); raw[CUR["fi"]] = r; return r
        fit_cam = rec  # noqa
        globals()["fit_cam"] = rec
        globals()["warp"] = lambda img, M: np.zeros((H, W) + img.shape[2:], np.float32)
        globals()["motes"] = lambda img, *a, **k: img
        for fi in list(range(0, 150)) + list(range(180, 450)): frame(fi)
        out = {}
        for seg in (range(0, 150), range(180, 270), range(270, 450)):
            ids = list(seg); A = np.array([raw[i] for i in ids])
            wv = gaussian_filter1d(minimum_filter1d(A[:, 2], 17, mode="nearest"), 2.5, mode="nearest")
            cx = gaussian_filter1d(A[:, 0], 3, mode="nearest"); cy = gaussian_filter1d(A[:, 1], 3, mode="nearest")
            for j, i in enumerate(ids): out[i] = [float(cx[j]), float(cy[j]), float(wv[j])]
        json.dump(out, open("campath.json", "w")); print("path saved", len(out))
    elif sys.argv[1] == "preview":
        for fi in map(int, sys.argv[2:]):
            cv2.imwrite("frames/p%03d.jpg" % fi, frame(fi)[:, :, ::-1], [cv2.IMWRITE_JPEG_QUALITY, 90])
    else:
        from multiprocessing import Pool
        out = sys.stdout.buffer
        with Pool(4) as pool:
            for fr in pool.imap(frame, range(N), chunksize=2):
                out.write(fr.tobytes())
