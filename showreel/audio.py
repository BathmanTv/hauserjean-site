"""Original soundtrack for the showreel, synthesised from scratch (no samples).

120 BPM in F minor: one beat = 0.5 s, one bar = 2 s, so every cut in reel.js lands on
the grid. Event times below mirror the timeline in reel.js.

    python3 audio.py            # → out/soundtrack.wav (48 kHz, 24-bit stereo, 20 s)

Needs numpy + scipy.
"""
import os
import wave

import numpy as np
from scipy import signal

SR = 48000
DUR = 20.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)

mix = np.zeros((2, N))      # dry bus
verb = np.zeros((2, N))     # reverb send
duck = np.ones(N)           # sidechain gain applied to music parts


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def add(buf, t0, gain=1.0, pan=0.0, send=0.0, bus=None):
    """Place a mono or stereo buffer at t0 seconds with equal-power pan."""
    bus = mix if bus is None else bus
    i0 = int(round(t0 * SR))
    if i0 >= N:
        return
    if buf.ndim == 1:
        a = (pan + 1) * np.pi / 4
        buf = np.vstack([buf * np.cos(a), buf * np.sin(a)])
    n = min(buf.shape[1], N - i0)
    if i0 < 0:
        buf, n, i0 = buf[:, -i0:], n + i0, 0
    bus[:, i0:i0 + n] += buf[:, :n] * gain
    if send:
        verb[:, i0:i0 + n] += buf[:, :n] * gain * send


def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output='sos')


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


def sweep(x, kind, f_of_t, block=256):
    """Time-varying Butterworth filter (cutoff re-computed every block)."""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        f = f_of_t(s / SR)
        if np.ndim(f) == 0:
            f = float(np.clip(f, 20, SR / 2 - 200))
        else:
            f = [float(np.clip(v, 20, SR / 2 - 200)) for v in f]
        so = sos(kind, f)
        if zi is None:
            zi = np.zeros((so.shape[0], 2))
        y[s:s + block], zi = signal.sosfilt(so, x[s:s + block], zi=zi)
    return y


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def saw(freq, dur, detune=0.0):
    """PolyBLEP band-limited sawtooth; freq may be a scalar or per-sample array."""
    n = int(dur * SR)
    f = np.broadcast_to(np.asarray(freq, float) * (1 + detune), (n,))
    dt = f / SR
    ph = (np.cumsum(dt) + rng.random()) % 1.0
    y = 2 * ph - 1
    lo, hi = ph < dt, ph > 1 - dt
    x = ph[lo] / dt[lo]
    y[lo] -= x + x - x * x - 1
    x = (ph[hi] - 1) / dt[hi]
    y[hi] -= x * x + x + x + 1
    return y


def sine(freq, dur, phase=0.0):
    n = int(dur * SR)
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def env(dur, a=0.002, d=0.2):
    t = tt(dur)
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


# ─────────────────────────── instruments ───────────────────────────
def kick(big=False):
    d = 0.9 if big else 0.45
    t = tt(d)
    f = 43 + (170 if big else 150) * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.5 if big else 0.28))
    click = filt(noise(d), 'highpass', 2500) * np.exp(-t / 0.003) * 0.5
    return np.tanh(1.8 * (body + click))


def clap():
    d = 0.35
    x = np.zeros(int(d * SR))
    for k, off in enumerate([0, 0.009, 0.018]):
        i0 = int(off * SR)
        m = len(x) - i0
        t = np.arange(m) / SR
        x[i0:] += rng.standard_normal(m) * np.minimum(1, t / 0.0005) * np.exp(-t / (0.012 if k < 2 else 0.09))
    return filt(x, 'bandpass', [900, 5000]) * 0.9


def hat(open_=False):
    d = 0.25 if open_ else 0.06
    return filt(noise(d), 'highpass', 7500) * env(d, 0.0005, 0.08 if open_ else 0.018)


def crash(d=2.2):
    t = tt(d)
    x = filt(noise(d), 'highpass', 3500) * np.exp(-t / 0.7)
    metal = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) for f in [3120, 4270, 5510, 6930, 8120]) * 0.04
    return (x + metal * np.exp(-t / 0.5)) * 0.5


def sub_drop(d=1.6, f0=62, f1=30):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.4)
    return sine(f, d) * np.exp(-t / 0.7) * np.minimum(1, t / 0.005)


def impact(t0, big=False, gain=1.0):
    add(kick(big), t0, 0.9 * gain)
    add(sub_drop(2.4 if big else 1.4), t0, (0.75 if big else 0.55) * gain)
    c = crash(3.0 if big else 1.8)
    add(np.vstack([c, np.roll(c, 173)]), t0, (0.55 if big else 0.35) * gain, send=0.35)
    boom = filt(noise(1.2), 'lowpass', 400) * env(1.2, 0.002, 0.25)
    add(boom, t0, 0.5 * gain, send=0.4)


def whoosh(t0, d, f0, f1, gain=0.5, pan0=0.0, pan1=0.0, peak=0.7):
    t = tt(d)
    shape = np.where(t < d * peak, (t / (d * peak)) ** 2, np.exp(-(t - d * peak) / (d * (1 - peak) * 0.35)))
    x = sweep(noise(d), 'bandpass', lambda s: [max(30, f0 * (f1 / f0) ** (s / d)) * 0.7, max(60, f0 * (f1 / f0) ** (s / d)) * 1.4])
    x *= shape / (np.abs(x).max() + 1e-9)
    pan = np.linspace(pan0, pan1, len(x))
    a = (pan + 1) * np.pi / 4
    add(np.vstack([x * np.cos(a), x * np.sin(a)]), t0, gain, send=0.25)


def riser(t0, d, gain=0.4, f0=300, f1=9000):
    t = tt(d)
    x = sweep(noise(d), 'bandpass', lambda s: [f0 * (f1 / f0) ** (s / d) * 0.6, f0 * (f1 / f0) ** (s / d) * 1.6])
    pitch = sum(saw(midi(n) * 2 ** (1.0 * t / d), d, dt) for n, dt in [(53, 0), (53, 0.004), (60, -0.003)])
    pitch = sweep(pitch, 'lowpass', lambda s: 300 + 5000 * (s / d) ** 2)
    y = (x / (np.abs(x).max() + 1e-9) + 0.12 * pitch) * (t / d) ** 2.2
    add(np.vstack([y, np.roll(y, 211)]), t0, gain, send=0.3)


def blip(t0, f, gain=0.18, d=0.09, pan=0.0, glide=1.0):
    t = tt(d)
    y = sine(f * glide ** (t / d), d) * env(d, 0.001, d / 3)
    add(y, t0, gain, pan, send=0.2)


def tick(t0, gain=0.12, f=4000, pan=0.0):
    y = filt(noise(0.012), 'bandpass', [f * 0.7, f * 1.4]) * env(0.012, 0.0002, 0.002)
    add(y, t0, gain, pan)


def pop(t0, f=520, gain=0.35, pan=0.0):
    d = 0.14
    t = tt(d)
    y = sine(f * (0.55 + 1.2 * (1 - np.exp(-t / 0.02))), d) * env(d, 0.001, 0.04)
    add(y, t0, gain, pan, send=0.15)


def bell(t0, n, gain=0.2, d=1.6, pan=0.0):
    t = tt(d)
    f = midi(n)
    y = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.2)
         + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.08)) * env(d, 0.001, d / 4)
    add(y, t0, gain, pan, send=0.45)


def pluck(t0, n, gain=0.16, pan=0.0, d=0.3):
    t = tt(d)
    y = saw(midi(n), d) + saw(midi(n), d, 0.006)
    y = sweep(y, 'lowpass', lambda s: 300 + 5200 * np.exp(-s / 0.06))
    y *= env(d, 0.001, 0.09)
    add(y, t0, gain, pan, send=0.3)


def stab(t0, notes, gain=0.22, d=0.32, bright=4000):
    t = tt(d)
    y = sum(saw(midi(n), d, dt) for n in notes for dt in (-0.005, 0.005))
    y = sweep(y, 'lowpass', lambda s: 200 + bright * np.exp(-s / 0.07))
    y *= env(d, 0.002, 0.12)
    add(np.vstack([y, np.roll(y, 97)]), t0, gain / len(notes), send=0.35)


# ─────────────────────────── music ───────────────────────────
# chord per 2-s bar from t = 2.0 (F minor: i – VI – III – VII)
CHORDS = {2: [53, 56, 60, 63], 4: [49, 53, 56, 60], 6: [56, 60, 63, 67], 8: [51, 55, 58, 61],
          10: [53, 56, 60, 63], 12: [49, 53, 56, 60], 14: [56, 60, 63, 67], 16: [51, 55, 58, 62]}
ROOT = {2: 41, 4: 37, 6: 44, 8: 39, 10: 41, 12: 37, 14: 44, 16: 39}


def chord_at(t):
    b = int(t // 2 * 2)
    if t >= 17.0:
        return [48, 52, 55, 58], 36          # C7 — the dominant pulls hard into the final F minor
    return CHORDS.get(b, CHORDS[2]), ROOT.get(b, 41)


music = np.zeros((2, N))


def madd(buf, t0, gain, pan=0.0):
    add(buf, t0, gain, pan, bus=music)


kicks = [2.0 + BEAT * k for k in range(int((17.5 - 2.0) / BEAT))]
for tk in kicks:
    if abs(tk - 8.0) < 1e-6 or abs(tk - 4.0) < 1e-6 or abs(tk - 13.5) < 1e-6 or abs(tk - 2.0) < 1e-6:
        continue                                       # impacts cover these downbeats
    if 12.0 <= tk < 13.5 and (tk - 12.0) % 1.0 > 0.01:
        continue                                       # half-time feel for Café Bông
    add(kick(), tk, 0.8)
for tk in kicks + [2.0, 4.0, 8.0, 13.5]:
    i = int(tk * SR)
    tail = np.arange(N - i) / SR
    duck[i:] = np.minimum(duck[i:], 1 - 0.55 * np.exp(-tail / 0.13))

for b in np.arange(2.0, 17.5, 2 * BEAT):          # clap on 2 and 4
    if 12.0 <= b + BEAT < 13.5:
        continue
    add(clap(), b + BEAT, 0.35, 0.05, send=0.25)
for k in range(int((17.0 - 4.0) / (BEAT / 4))):   # 16th hats from the Donatello groove on
    th = 4.0 + k * BEAT / 4
    if 11.6 < th < 12.0:
        continue
    accent = 1.0 if k % 2 else 0.55
    add(hat(open_=(k % 4 == 2 and 8 <= th < 12)), th, 0.09 * accent, 0.25 if k % 2 else -0.2)

# bass: off-beat 8ths, root + octave, sidechained
for k in range(int((17.5 - 2.0) / (BEAT / 2))):
    tb = 2.0 + k * BEAT / 2
    if k % 2 == 0:
        continue
    _, r = chord_at(tb)
    d = 0.22
    y = saw(midi(r), d) + 0.6 * sine(midi(r - 12), d)
    y = sweep(y, 'lowpass', lambda s: 180 + 1600 * np.exp(-s / 0.05))
    y *= env(d, 0.003, 0.09)
    madd(y, tb, 0.42 if tb >= 4 else 0.25)

# pad: detuned saws, slow filter, one chord per bar
for b in range(2, 18, 2):
    notes, _ = chord_at(b)
    d = 2.0 if b < 16 else 1.0
    y = sum(saw(midi(n), d, dt) for n in notes for dt in (-0.007, 0.0, 0.007))
    cut = 900 if b in (12,) else 1800
    y = sweep(y, 'lowpass', lambda s: cut * (0.6 + 0.4 * np.sin(np.pi * s / d)))
    y = filt(y, 'highpass', 160)
    y *= np.minimum(1, tt(d) / 0.08) * np.minimum(1, (d - tt(d)) / 0.05)
    madd(np.vstack([y, np.roll(y, 311)]), b, 0.05)
    if b == 16:
        c7, _ = chord_at(17.0)
        y = sum(saw(midi(n), 0.5, dt) for n in c7 for dt in (-0.007, 0.007))
        y = sweep(y, 'lowpass', lambda s: 1200 + 6000 * s)
        madd(np.vstack([y, np.roll(y, 311)]), 17.0, 0.05)

# pluck arps: HAUUM (8–10), Chợ Vỉa Hè (10–12, pentatonic), the build (15.5–17)
PENTA = [65, 68, 70, 72, 75, 77, 80]
for k in range(int(4.0 / (BEAT / 4))):
    tp = 8.0 + k * BEAT / 4
    notes, _ = chord_at(tp)
    n = (PENTA[(k * 3) % len(PENTA)] if tp >= 10 else notes[k % 4] + 12)
    pluck(tp, n, 0.13 if tp >= 10 else 0.1, pan=0.35 * np.sin(k * 0.9))
for k in range(int(1.5 / (BEAT / 4))):
    tp = 15.5 + k * BEAT / 4
    notes, _ = chord_at(tp)
    pluck(tp, notes[k % 4] + 12 + (12 if k >= 12 else 0), 0.08 + 0.06 * k / 24, pan=0.4 * np.sin(k))
# Café Bông: warm electric-piano chords on the half-time bar
for tc, notes in [(12.0, [49, 56, 60, 65]), (12.75, [49, 56, 60, 63]), (13.0, [49, 53, 58, 63])]:
    for j, n in enumerate(notes):
        bell(tc + j * 0.012, n + 12, 0.07, 1.4, pan=-0.3 + j * 0.2)

music[:, :] *= duck
music[:, int(11.95 * SR):int(12.0 * SR)] *= np.linspace(1, 0.4, int(0.05 * SR))
add(music, 0.0, 1.0, send=0.15)

# ─────────────────────────── sound design ───────────────────────────
# 00 boot — drone, grid ticks, glyph blips, riser, wipe
t = tt(2.0)
drone = sum(saw(midi(n), 2.0, dt) for n in (29, 41, 48) for dt in (-0.004, 0.004))
drone = sweep(drone, 'lowpass', lambda s: 120 + 900 * (s / 2.0) ** 2) * np.minimum(1, t / 0.4) * 0.05
add(np.vstack([drone, np.roll(drone, 400)]), 0.0, 1.0, send=0.4)
for i in range(13):
    tick(0.04 + i * 0.022, 0.08, 6000, pan=-0.9 + i * 0.15)
for j in range(7):
    tick(0.1 + j * 0.03, 0.06, 3000, pan=0.8 - j * 0.25)
for i in range(11):
    if i == 4:
        continue
    blip(0.32 + i * 0.042, midi([77, 80, 84, 87, 89, 92, 94, 96, 99, 101, 104][i]), 0.07, 0.05, pan=-0.6 + i * 0.12)
    blip(0.32 + i * 0.042 + 0.24, midi(89), 0.05, 0.03, pan=-0.6 + i * 0.12)
for k in range(24):
    tick(0.88 + k * 0.021, 0.035, 5000, pan=0.3)
blip(0.0, 880, 0.08, 0.06)
blip(0.2, 880, 0.08, 0.06)
riser(0.3, 1.7, 0.28)
whoosh(1.62, 0.4, 200, 4000, 0.45, -0.3, 0.3, 0.85)

# 01 manifesto — one stab per word on the beat
impact(2.0, gain=0.9)
stab(2.0, [53, 60, 65, 68], 0.3)
stab(2.5, [53, 60, 65, 70], 0.3, bright=5000)
stab(3.0, [53, 54, 60, 66], 0.3, bright=6000)
stab(3.5, [53, 60, 65, 72], 0.34, bright=7000)
whoosh(2.0, 0.35, 400, 3000, 0.25)
for i in range(5):
    tick(2.51 + i * 0.03, 0.18, 2500, pan=-0.5 + i * 0.25)
    tick(2.6 + i * 0.03, 0.12, 1800, pan=-0.5 + i * 0.25)
g = noise(0.22)
g = np.round(g * 3) / 3 * (rng.random(len(g)) > 0.5)
g = filt(g, 'bandpass', [800, 9000]) * env(0.22, 0.001, 0.08)
add(g, 3.0, 0.22, send=0.1)
for k in range(8):
    blip(3.0 + k * 0.022, 300 + rng.random() * 2500, 0.05, 0.02, pan=rng.random() * 2 - 1)
whoosh(3.5, 0.25, 3000, 300, 0.3, peak=0.2)
riser(3.72, 0.28, 0.35, 600, 12000)

# 02 Donatello
impact(4.0)
ping = sine(1175, 1.2) * env(1.2, 0.001, 0.25)
add(ping, 4.0, 0.12, send=0.8)
add(ping, 4.25, 0.05, 0.5, send=0.8)
for k in range(19):
    tick(4.26 + k * 0.033 + rng.random() * 0.01, 0.07 + 0.04 * rng.random(), 3000 + rng.random() * 2000, pan=-0.2 + 0.4 * rng.random())
scan = sweep(noise(0.42), 'bandpass', lambda s: [2500 * (1 - s) + 400, 5000 * (1 - s) + 900])
add(scan * env(0.42, 0.15, 0.2), 4.92, 0.2, send=0.2)
for k, f in enumerate([880, 660, 880, 660]):
    blip(5.14 + k * 0.07, f, 0.09, 0.06)
whoosh(5.42, 0.32, 600, 2500, 0.2, -0.4, 0.4)
for j, n in enumerate([77, 80, 84, 89]):
    bell(5.56 + j * 0.05, n, 0.09, 1.0, pan=-0.3 + j * 0.2)
for k in range(22):
    tick(5.96 + 0.72 * (k / 22) ** 1.8, 0.12, 2200, pan=-0.3)
whoosh(5.9, 0.3, 3000, 500, 0.2, peak=0.2)
PENT = [65, 68, 70, 72, 75, 77, 80, 82, 84, 87, 89, 92]
for k in range(24):
    blip(6.8 + k * 0.013, midi(PENT[k % 12] + (12 if k >= 12 else 0)), 0.05, 0.05, pan=np.sin(k * 1.7) * 0.8)
whoosh(7.28, 0.4, 300, 1800, 0.22)
whoosh(7.74, 0.3, 500, 5000, 0.35, -0.8, 0.8, 0.9)

# 03 HAUUM
impact(8.0, gain=0.7)
for k, ts in enumerate([8.24, 8.46, 8.68, 8.90]):
    whoosh(ts, 0.22, 800, 3500, 0.22, 0.6, -0.6, 0.55)
    tick(ts + 0.1, 0.15, 1500)
whoosh(9.1, 0.5, 4000, 300, 0.22, peak=0.3)
for j in range(4):
    pop(9.26 + j * 0.05, 700 + j * 60, 0.12)
whoosh(9.68, 0.34, 2500, 6000, 0.3, 0.9, -0.3, 0.8)  # page turn

# 04 Chợ Vỉa Hè
for i in range(10):
    pop(10.14 + i * 0.035, 520 + 40 * i, 0.1, pan=0.4)
for ts, f, p in [(10.04, 300, 0.4), (10.38, 380, -0.8), (10.46, 420, 0.8), (10.5, 460, 0.3), (10.56, 520, 0.5), (10.8, 600, 0.2)]:
    pop(ts, f, 0.3, p)
rattle = sum(filt(noise(0.5), 'bandpass', [3000, 7000]) * env(0.5, 0.002, 0.03 + 0.02 * k) for k in range(3))
add(rattle, 10.1, 0.08, 0.5, send=0.3)
d = 1.3
t = tt(d)
xpos = np.linspace(-1, 1, len(t))                      # scooter drives left → right
dop = 1 + 0.08 * np.tanh(-xpos * 3)
eng = saw(88 * dop * (1 + 0.02 * np.sin(2 * np.pi * 23 * t)), d) + 0.5 * saw(176 * dop, d, 0.01)
eng = filt(eng, 'lowpass', 900) * (1 - np.abs(xpos) ** 2) * 0.9
a = (xpos + 1) * np.pi / 4
add(np.vstack([eng * np.cos(a), eng * np.sin(a)]), 10.62, 0.12, send=0.2)
tick(11.3, 0.4, 1800)
tick(11.3, 0.25, 600)
whoosh(11.56, 0.3, 500, 4000, 0.3)
whoosh(11.7, 0.3, 300, 2500, 0.3)

# 05 Café Bông — warm hit, the coffee drop and its splash
add(sub_drop(1.0, 55, 40), 12.0, 0.35)
dd = 0.22
td = tt(dd)
fall = sine(1400 * np.exp(-td / 0.2), dd) * np.minimum(1, td / 0.05) * 0.3
add(fall, 13.1, 0.12, send=0.4)
td = tt(0.12)
drop = sine(420 * np.exp(td / 0.035), 0.12) * env(0.12, 0.0005, 0.03)
add(drop, 13.31, 0.4, send=0.6)
add(filt(noise(0.3), 'bandpass', [1500, 6000]) * env(0.3, 0.001, 0.05), 13.32, 0.12, send=0.5)

# 06 GIDEON + Plans & Ambiances
impact(13.5, gain=0.8)
shimmer = sum(sine(midi(n), 1.2) * np.exp(-tt(1.2) / 0.5) for n in (89, 96, 101)) * np.minimum(1, tt(1.2) / 0.1)
add(np.vstack([shimmer, np.roll(shimmer, 700)]), 13.52, 0.05, send=0.7)
for i in range(6):
    zap = sine(2000 * np.exp(-tt(0.08) / 0.03) + 200, 0.08) * env(0.08, 0.001, 0.03)
    add(zap, 13.62 + i * 0.035, 0.08, pan=-0.8 if i < 3 else 0.8)
for k in range(10):
    tick(13.9 + k * 0.05, 0.05, 7000, pan=np.sin(k) * 0.7)
whoosh(14.38, 0.34, 300, 3000, 0.3)
pen = filt(noise(0.46), 'bandpass', [2500, 6000]) * (0.5 + 0.5 * np.abs(np.sin(np.arange(int(0.46 * SR)) / SR * 2 * np.pi * 17)))
add(pen * env(0.46, 0.02, 0.3), 14.56, 0.07, send=0.1)
for k in range(5):
    pop(15.0 + k * 0.045, 600 + k * 70, 0.13, pan=-0.4 + k * 0.2)
pop(15.1, 900, 0.14, 0.6)
whoosh(15.26, 0.3, 400, 5000, 0.3, peak=0.8)

# 07 selected work — build, snare roll, hyper-cut hits
riser(15.4, 1.6, 0.3, 200, 8000)
roll_t = []
tr = 16.0
while tr < 17.0:
    roll_t.append(tr)
    tr += 0.125 if tr < 16.5 else (0.0625 if tr < 16.75 else 0.03125)
for k, tr in enumerate(roll_t):
    add(clap(), tr, 0.1 + 0.25 * (tr - 16.0), pan=0.1 * np.sin(k), send=0.2)
for k in range(8):
    tc = 17.0 + k * 0.0625
    add(kick(), tc, 0.55)
    stab(tc, [n + 12 for n in chord_at(17.0)[0]], 0.12, 0.06, bright=2500 + 800 * k)
    tick(tc, 0.2, 3000 + 400 * k)

# silence gate: everything stops dead at the flash (17.5), a reverse swell pulls into the drop
pre_mix, pre_verb = mix.copy(), verb.copy()
mix[:], verb[:] = 0, 0
rev = crash(0.28)[::-1] * np.linspace(0, 1, int(0.28 * SR)) ** 2
add(np.vstack([rev, np.roll(rev, 90)]), 17.72, 0.5)
tick(17.72, 0.08, 5000)
tick(17.86, 0.08, 5000)

# 08 outro — the drop, the resolve
impact(18.0, big=True)
d = 2.0
fin = sum(saw(midi(n), d, dt) for n in (41, 53, 56, 60, 67) for dt in (-0.006, 0.0, 0.006))
fin = sweep(fin, 'lowpass', lambda s: 400 + 2600 * np.exp(-s / 0.5))
fin *= np.minimum(1, tt(d) / 0.01) * np.exp(-tt(d) / 1.4)
add(np.vstack([fin, np.roll(fin, 311)]), 18.0, 0.06, send=0.5)
for i in range(11):
    tick(18.0 + abs(i - 5) * 0.024, 0.06, 2500 + 200 * i, pan=-0.8 + i * 0.16)
whoosh(18.14, 0.4, 800, 4000, 0.18, -0.6, 0.6, 0.3)
for j, n in enumerate([72, 77, 80, 84]):
    bell(18.38 + j * 0.07, n, 0.07, 1.6, pan=-0.3 + j * 0.2)
for tc in (18.5, 19.0, 19.5):
    tick(tc, 0.035, 5000)

# ─────────────────────────── reverb + master ───────────────────────────
ir_n = int(2.4 * SR)
ir_t = np.arange(ir_n) / SR
ir = np.vstack([filt(rng.standard_normal(ir_n), 'lowpass', 6000) * np.exp(-ir_t / 0.55) for _ in range(2)])
ir[:, :int(0.012 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def reverb(x):
    return np.vstack([signal.fftconvolve(x[c], ir[c])[:N] for c in range(2)]) * 0.55


pre = pre_mix + reverb(pre_verb)
g0, fade = int(17.5 * SR), int(0.012 * SR)
pre[:, g0:g0 + fade] *= np.linspace(1, 0, fade)
pre[:, g0 + fade:] = 0
out = pre + mix + reverb(verb)
out = filt(out, 'highpass', 28)
out[:, int(19.6 * SR):] *= np.linspace(1, 0, N - int(19.6 * SR)) ** 1.5
out /= np.abs(out).max()
out = np.tanh(out * 1.25) / np.tanh(1.25)
out *= 0.89 / np.abs(out).max()
rms = np.sqrt((out ** 2).mean())
print(f'rms {20 * np.log10(rms):.1f} dBFS')

os.makedirs(os.path.join(os.path.dirname(__file__) or '.', 'out'), exist_ok=True)
path = os.path.join(os.path.dirname(__file__) or '.', 'out', 'soundtrack.wav')
pcm = (np.clip(out.T, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
b = pcm.astype('<i4').tobytes()
b = b''.join(b[i:i + 3] for i in range(0, len(b), 4))
with wave.open(path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(b)
print('wrote', path, f'{DUR:.1f}s peak', float(np.abs(out).max()))
