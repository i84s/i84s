"""Original score + SFX, synthesized from scratch (no third-party samples). 15.000 s, 48 kHz stereo."""
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000; DUR = 15.0; N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(3)
L = np.zeros(N); R = np.zeros(N)

def env_ar(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    nr = max(1, int(r * SR)); e[-nr:] *= np.linspace(1, 0, nr) ** 2; return e

def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); j = min(N, i + len(sig)); s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt(0.5 * (1 - pan)); R[i:j] += s * np.sqrt(0.5 * (1 + pan))

def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'high', fs=SR, output='sos'), x)
def hz(n): return 440 * 2 ** ((n - 69) / 12)

# ---------- pad (warm, slowly evolving chords) ----------
chords = [(0.0, 5.0, [38, 45, 54, 61, 64]),      # Dmaj9
          (5.0, 9.0, [35, 42, 50, 57, 61]),      # Bm9
          (9.0, 12.0, [31, 43, 50, 54, 59, 61]), # Gmaj7(#11 colour)
          (12.0, 15.0, [38, 45, 50, 54, 57, 64])]# Dmaj9 resolve
padL = np.zeros(N); padR = np.zeros(N)
for (a, b, notes) in chords:
    i0, i1 = int(max(0, a - 0.35) * SR), int(min(DUR, b + 0.9) * SR)
    tt = t[i0:i1] - t[i0]; n = i1 - i0
    e = np.minimum(1, tt / 0.7) * np.minimum(1, (n / SR - tt) / 0.9).clip(0, 1)
    for k, m in enumerate(notes):
        f = hz(m)
        for det, side in ((-0.06, padL), (0.06, padR)):
            ph = 2 * np.pi * f * (1 + det / 100 * (k + 1)) * tt + rng.uniform(0, 6)
            v = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
            side[i0:i1] += v * e * (0.9 if m < 45 else 0.42) / len(notes)
swell = np.interp(t, [0, 0.4, 2.0, 5, 9, 11.8, 12.4, 14.2, 15], [0, 0.25, 0.55, 0.62, 0.72, 0.7, 0.85, 0.6, 0.0])
L += lp(padL, 2400) * swell * 0.5; R += lp(padR, 2400) * swell * 0.5

# ---------- pulse (120 bpm, beats land on every scene boundary) ----------
def kick(g=1.0, f0=95, f1=42, dec=0.32):
    n = int(0.6 * SR); tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt / dec) * g
for b in np.arange(5.0, 9.0, 0.5): place(kick(0.42), b)
for b in np.arange(9.5, 12.0, 0.5): place(kick(0.55), b)
place(kick(0.4), 12.5)

def tick(g=1.0, f=2600):
    n = int(0.09 * SR); tt = np.arange(n) / SR
    s = hp(rng.normal(0, 1, n), 3000) * np.exp(-tt / 0.012) * 0.5 + np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.03)
    return s * g
for k, b in enumerate(np.arange(6.0, 9.0, 0.25)):
    place(tick(0.05 + 0.03 * (k % 2), 2600 if k % 2 else 3100), b + 0.25 * 0.0, pan=0.35 if k % 2 else -0.35)
for b in np.arange(9.25, 12.0, 0.5): place(tick(0.06, 3300), b, pan=0.3)

# ---------- impacts / booms ----------
def boom(g=1.0, f0=70, f1=30, dec=1.4, noise=0.35):
    n = int(3.0 * SR); tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 6); ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-tt / dec)
    air = lp(rng.normal(0, 1, n), 900) * np.exp(-tt / 0.5) * noise
    return (body + air) * g
place(boom(0.95), 0.33)
place(boom(1.0, 80, 32, 1.6, 0.45), 9.0)
place(boom(0.45, 60, 32, 1.2, 0.2), 12.0)
place(boom(0.55, 66, 30, 1.8, 0.25), 13.0)

# ---------- whooshes ----------
def whoosh(length=0.5, peak=0.7, lo=300, hi=5000, g=1.0, rev=False):
    n = int(length * SR); tt = np.linspace(0, 1, n)
    x = rng.normal(0, 1, n)
    fc = lo * (hi / lo) ** np.sin(np.pi * np.clip(tt / (2 * peak), 0, 0.5) * (1 if tt.mean() else 1))
    out = np.zeros(n); blk = 1024; zi = None
    for i in range(0, n, blk):
        f = float(fc[min(i, n - 1)]); sos = signal.butter(2, [max(80, f * 0.5), min(20000, f * 1.6)], 'band', fs=SR, output='sos')
        if zi is None: zi = signal.sosfilt_zi(sos) * 0
        out[i:i + blk], zi = signal.sosfilt(sos, x[i:i + blk], zi=zi)
    e = np.where(tt < peak, (tt / peak) ** 2.2, np.exp(-(tt - peak) / (1 - peak) * 4))
    s = out * e * g
    return s[::-1] if rev else s
place(whoosh(0.9, 0.5, 200, 2500, 0.9), 1.6, pan=-0.2)          # pull-back into reveal
place(whoosh(0.42, 0.62, 400, 6000, 1.3), 4.70, pan=-0.6)        # whip out (left)
place(whoosh(0.35, 0.3, 500, 7000, 1.0), 5.0, pan=0.6)           # whip in (right)
place(whoosh(0.5, 0.8, 250, 4500, 1.2), 5.55, pan=0.0)           # zoom through window
place(whoosh(0.42, 0.62, 400, 6000, 1.3), 8.70, pan=-0.6)        # whip out
place(whoosh(0.35, 0.3, 500, 7000, 1.0), 9.0, pan=0.6)           # whip in

# ---------- riser into the hero ----------
n = int(1.6 * SR); tt = np.arange(n) / SR
rz = bp(rng.normal(0, 1, n), 1500, 7000) * (tt / 1.6) ** 3 * 0.35
sweep = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (tt / 1.6 * 2)) / SR) * (tt / 1.6) ** 2.5 * 0.12
place(rz + sweep, 7.4)

# ---------- metallic accents (inharmonic bell) ----------
def ting(f=1760, g=1.0, dec=1.1):
    n = int(2.2 * SR); tt = np.arange(n) / SR
    parts = [(1, 1), (2.76, .5), (5.4, .25), (8.93, .12)]
    s = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / (dec / r ** 0.5)) for r, a in parts)
    return s * np.minimum(1, tt / 0.002) * g
place(ting(1568, 0.10), 0.36, pan=0.2)
for at, f in ((6.55, 2349), (7.05, 2637), (7.25, 2349), (7.6, 2093)): place(ting(f, 0.05, 0.5), at, pan=0.4)
place(ting(1760, 0.12), 9.95, pan=-0.25); place(ting(2217, 0.10), 10.45, pan=0.25)
place(ting(1175, 0.10, 1.6), 12.6, pan=0.0)
place(ting(1760, 0.13, 1.8), 13.0, pan=-0.15); place(ting(2637, 0.07, 1.8), 13.03, pan=0.2)

# ---------- reverb (stereo decorrelated exponential IR) ----------
def ir(seed):
    r = np.random.default_rng(seed); n = int(2.2 * SR); tt = np.arange(n) / SR
    return lp(r.normal(0, 1, n), 6000) * np.exp(-tt / 0.55) * 0.02
wetL = signal.fftconvolve(L, ir(1))[:N]; wetR = signal.fftconvolve(R, ir(2))[:N]
L = L * 0.82 + wetL * 0.9; R = R * 0.82 + wetR * 0.9

# ---------- master: HPF rumble, soft limit, fades, exact length ----------
mix = np.stack([L, R], 1)
mix = signal.sosfilt(signal.butter(2, 25, 'high', fs=SR, output='sos'), mix, axis=0)
mix = mix / np.max(np.abs(mix)) * 1.25
mix = np.tanh(mix) / np.tanh(1.25)            # gentle glue, no hard clipping
fi = int(0.02 * SR); fo = int(0.9 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= (np.linspace(1, 0, fo) ** 2)[:, None]
mix *= 10 ** (-1.0 / 20)                      # -1 dBFS ceiling
assert mix.shape[0] == N
wavfile.write("out/score.wav", SR, (mix * 32767).astype(np.int16))
print("peak dBFS %.2f" % (20 * np.log10(np.max(np.abs(mix)))))
