"""Original soundtrack for the showreel (v4), synthesised from scratch (no samples).

72 BPM in F minor (one beat = 0.833 s, one bar = 3.33 s). The v1 cut ran at 120 BPM and
was watched at 0.6×, so every v1 event time `t` maps to master seconds ×1/0.6: M() for the
projects up to Café Bông, BP() for Plans & Ambiances (its finished plan holds 5 s) and F()
for the finale, shifted after GIDEON. GIDEON — the Discord bot, the boss addon, the name —
is scored directly in master seconds on the same grid, over a low electronic bed with one
impact per part. Event times mirror reel.js.

    python3 audio.py            # → out/soundtrack.wav (48 kHz, 24-bit stereo, 57.5 s)

Needs numpy + scipy.
"""
import os
import wave

import numpy as np
from scipy import signal

SR = 48000
SLOW = 0.6
BEAT = 60 / 72
PA, GA, GB, FB = 27, 36, 60, 57        # beats: Plans opens · GIDEON bed GA → GB · finale anchor
P0, P1 = PA * BEAT, GA * BEAT          # 22.5 s, 30.0 s
A0, B0, C0 = P1, 47 * BEAT, 56 * BEAT  # GIDEON: the bot, the addon, the name
WB = FB * BEAT                         # 47.5 s — master time of the finale's reel 14.0
GE = WB + 1.36 / SLOW                  # 49.77 s — GIDEON fades to night, the wall comes in
HOLD1 = P1 - 0.45                      # the finished plan holds until here
DUR = WB + 6 / SLOW
N = int(round(SR * DUR))
rng = np.random.default_rng(7)


def M(t):
    """v1 reel time → master seconds (the projects, up to Café Bông)."""
    return t / SLOW


def BP(t):
    """Plans & Ambiances reel time → master seconds (the finished plan holds 5 s)."""
    return P0 + (t - 14.4) / SLOW if t <= 15.25 + 1e-9 else HOLD1 + (t - 15.25) / SLOW


def F(t):
    """Finale reel time (selected work → outro) → master seconds."""
    return WB + (t - 14.0) / SLOW


def D(d):
    """Stretch a duration tied to an on-screen move."""
    return d / SLOW


def b(n):
    """Master seconds of beat n."""
    return n * BEAT


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



# ─────────────────────────── music (master beats) ───────────────────────────
# bar start (beat) → chord, F minor. The café bar is 3 beats long; Plans & Ambiances grooves
# on, with a slow arp over the held plan; GIDEON (beats GA → GB) sits on a low electronic
# bed, one chord per part; the groove comes back with the wall.
BARS = [(4, 'Fm'), (8, 'Db'), (12, 'Ab'), (16, 'Eb'), (20, 'Fm'), (24, 'Db'),
        (PA, 'Fm'), (31, 'Db'), (35, 'Eb'),
        (GA, 'Fm'), (40, 'Fm'), (44, 'Db'), (47, 'Ab'), (51, 'Ab'), (54, 'Eb'), (56, 'Fm'),
        (59, 'Ab'), (61, 'Eb'), (63, 'C7'), (65, 'end')]
CHORD = {'Fm': [53, 56, 60, 63], 'Db': [49, 53, 56, 60], 'Ab': [56, 60, 63, 67], 'Eb': [51, 55, 58, 62], 'C7': [48, 52, 55, 58]}
ROOT = {'Fm': 41, 'Db': 37, 'Ab': 44, 'Eb': 39, 'C7': 36}


def chord_at(n):
    """Chord name at master beat n."""
    name = BARS[0][1]
    for start, c in BARS:
        if n >= start - 1e-9:
            name = c
    return name


def in_gideon(n):
    return GA <= n < GB


music = np.zeros((2, N))


def madd(buf, t0, gain, pan=0.0):
    add(buf, t0, gain, pan, bus=music)


IMPACT_BEATS = {4, 8, 16, PA, GA, 47, 56}   # downbeats carried by an impact instead of a kick
GIDEON_KICKS = {38, 40, 42, 44, 46, 49, 51, 53, 55, 58}   # soft half-time pulse under the bed
kick_beats = []
for n in range(4, FB + 7):
    if n in IMPACT_BEATS:
        continue
    if 24 <= n < 27 and n not in (24, 26):   # Café Bông: half-time
        continue
    if in_gideon(n):
        if n in GIDEON_KICKS:
            kick_beats.append(n)
            add(kick(), b(n), 0.5)
        continue
    kick_beats.append(n)
    add(kick(), b(n), 0.8)
for n in kick_beats + sorted(IMPACT_BEATS):
    i = int(b(n) * SR)
    tail = np.arange(N - i) / SR
    duck[i:] = np.minimum(duck[i:], 1 - (0.3 if in_gideon(n) else 0.55) * np.exp(-tail / 0.16))

for n in list(range(5, 24, 2)) + [28, 30, 32, 34, 60, 62]:   # claps on 2 and 4 (none in the GIDEON bed)
    add(clap(), b(n), 0.35, 0.05, send=0.25)
for k in range(int((FB + 6 - 8) * 4)):      # 16th hats; light offbeats only under the bot and the addon
    n = 8 + k / 4
    if 23.2 < n < 24:
        continue
    if in_gideon(n):
        if n < 56 and k % 2 == 1:
            add(hat(), b(n), 0.035, 0.25)
        continue
    accent = 1.0 if k % 2 else 0.55
    open_ = k % 4 == 2 and 16 <= n < 24
    add(hat(open_=open_), b(n), 0.08 * accent, 0.25 if k % 2 else -0.2)

# bass: off-beat 8ths on the root, sidechained — a held sub under the GIDEON bed
for k in range(int((FB + 7 - 4) * 2)):
    n = 4 + k / 2
    if k % 2 == 0 or in_gideon(n):
        continue
    r = ROOT[chord_at(n)]
    d = 0.3
    y = saw(midi(r), d) + 0.6 * sine(midi(r - 12), d)
    y = sweep(y, 'lowpass', lambda s: 180 + 1500 * np.exp(-s / 0.06))
    y *= env(d, 0.003, 0.12)
    madd(y, b(n), 0.42 if n >= 8 else 0.25)
for idx, (start, name) in enumerate(BARS[:-1]):
    if not in_gideon(start):
        continue
    d = b(min(BARS[idx + 1][0], GB)) - b(start)
    r = ROOT[name]
    y = sine(midi(r - 12), d) + 0.35 * filt(saw(midi(r), d), 'lowpass', 220)
    y *= np.minimum(1, tt(d) / 0.3) * np.minimum(1, (d - tt(d)) / 0.3)
    madd(y, b(start), 0.22)

# pads, one chord per bar (a warmer, slower bed through GIDEON)
for idx, (start, name) in enumerate(BARS[:-1]):
    end = BARS[idx + 1][0]
    d = b(end) - b(start)
    y = sum(saw(midi(nn), d, dt) for nn in CHORD[name] for dt in (-0.007, 0.0, 0.007))
    cut = 900 if (name == 'Db' and start == 24) else (1100 if in_gideon(start) else 1800)
    y = sweep(y, 'lowpass', lambda s: cut * (0.6 + 0.4 * np.sin(np.pi * s / d)))
    y = filt(y, 'highpass', 160)
    y *= np.minimum(1, tt(d) / 0.1) * np.minimum(1, (d - tt(d)) / 0.06)
    madd(np.vstack([y, np.roll(y, 311)]), b(start), 0.075 if in_gideon(start) else 0.05)

# plucked arps: HAUUM (16–20), Chợ Vỉa Hè pentatonic (20–24), the build into the wall
PENTA = [65, 68, 70, 72, 75, 77, 80]
for lo, hi in ((16, 24), (FB + 3, FB + 6)):
    for k in range(int((hi - lo) * 4)):
        n = lo + k / 4
        notes = CHORD[chord_at(n)]
        if 20 <= n < 24:
            note, g = PENTA[(k * 3) % len(PENTA)], 0.13
        elif n >= FB:
            note, g = notes[k % 4] + 12 + (12 if k >= 6 else 0), 0.08 + 0.05 * k / 12
        else:
            note, g = notes[k % 4] + 12, 0.1
        pluck(b(n), note, g, pan=0.35 * np.sin(k * 0.9))
# the Plans hold: a slow arp in 8ths over the finished plan
for k in range(int((35 - 29) * 2)):
    n = 29 + k / 2
    pluck(b(n), CHORD[chord_at(n)][(0, 2, 1, 3)[k % 4]] + 12, 0.075, pan=0.3 * np.sin(k * 0.7), d=0.45)
# Café Bông: warm electric-piano chords on the half-time bar
for tc, notes in [(12.0, [49, 56, 60, 65]), (12.75, [49, 56, 60, 63]), (13.0, [49, 53, 58, 63])]:
    for j, nn in enumerate(notes):
        bell(M(tc) + j * 0.015, nn + 12, 0.07, 1.8, pan=-0.3 + j * 0.2)

music[:, :] *= duck
w0 = int(M(11.95) * SR)
music[:, w0:w0 + int(0.08 * SR)] *= np.linspace(1, 0.4, int(0.08 * SR))
f0, f1 = int((GE - 0.6) * SR), int((GE + 0.5) * SR)            # GIDEON fading to night dips the bed
music[:, f0:f1] *= np.concatenate([np.linspace(1, 0.25, int(0.6 * SR)), np.linspace(0.25, 1, f1 - f0 - int(0.6 * SR))])
add(music, 0.0, 1.0, send=0.15)

# ─────────────────────────── sound design ───────────────────────────
# 00 boot — drone, grid ticks, glyph blips, riser, wipe
d = D(2.0)
t = tt(d)
drone = sum(saw(midi(nn), d, dt) for nn in (29, 41, 48) for dt in (-0.004, 0.004))
drone = sweep(drone, 'lowpass', lambda s: 120 + 900 * (s / d) ** 2) * np.minimum(1, t / 0.6) * 0.05
add(np.vstack([drone, np.roll(drone, 400)]), 0.0, 1.0, send=0.4)
for i in range(13):
    tick(M(0.04 + i * 0.022), 0.08, 6000, pan=-0.9 + i * 0.15)
for j in range(7):
    tick(M(0.1 + j * 0.03), 0.06, 3000, pan=0.8 - j * 0.25)
for i in range(11):
    if i == 4:
        continue
    blip(M(0.32 + i * 0.042), midi([77, 80, 84, 87, 89, 92, 94, 96, 99, 101, 104][i]), 0.07, 0.06, pan=-0.6 + i * 0.12)
    blip(M(0.32 + i * 0.042 + 0.24), midi(89), 0.05, 0.035, pan=-0.6 + i * 0.12)
for k in range(24):
    tick(M(0.88 + k * 0.021), 0.035, 5000, pan=0.3)
blip(0.0, 880, 0.08, 0.06)
blip(M(0.2), 880, 0.08, 0.06)
riser(M(0.3), D(1.7), 0.28)
whoosh(M(1.62), D(0.4), 200, 4000, 0.45, -0.3, 0.3, 0.85)

# 01 manifesto — one stab per word, on the beat
impact(M(2.0), gain=0.9)
stab(M(2.0), [53, 60, 65, 68], 0.3, 0.45)
stab(M(2.5), [53, 60, 65, 70], 0.3, 0.45, bright=5000)
stab(M(3.0), [53, 54, 60, 66], 0.3, 0.45, bright=6000)
stab(M(3.5), [53, 60, 65, 72], 0.34, 0.45, bright=7000)
whoosh(M(2.0), D(0.35), 400, 3000, 0.25)
for i in range(5):
    tick(M(2.51 + i * 0.03), 0.18, 2500, pan=-0.5 + i * 0.25)
    tick(M(2.6 + i * 0.03), 0.12, 1800, pan=-0.5 + i * 0.25)
gd = D(0.22)
g = noise(gd)
g = np.round(g * 3) / 3 * (rng.random(len(g)) > 0.5)
g = filt(g, 'bandpass', [800, 9000]) * env(gd, 0.001, 0.12)
add(g, M(3.0), 0.22, send=0.1)
for k in range(8):
    blip(M(3.0 + k * 0.022), 300 + rng.random() * 2500, 0.05, 0.02, pan=rng.random() * 2 - 1)
whoosh(M(3.5), D(0.25), 3000, 300, 0.3, peak=0.2)
riser(M(3.72), D(0.28), 0.35, 600, 12000)

# 02 Donatello
impact(M(4.0))
ping = sine(1175, 1.2) * env(1.2, 0.001, 0.25)
add(ping, M(4.0), 0.12, send=0.8)
add(ping, M(4.25), 0.05, 0.5, send=0.8)
for k in range(19):
    tick(M(4.26 + k * 0.033 + rng.random() * 0.01), 0.07 + 0.04 * rng.random(), 3000 + rng.random() * 2000, pan=-0.2 + 0.4 * rng.random())
sd = D(0.42)
scan = sweep(noise(sd), 'bandpass', lambda s: [2500 * (1 - s / sd) + 400, 5000 * (1 - s / sd) + 900])
add(scan * env(sd, 0.2, 0.3), M(4.92), 0.2, send=0.2)
for k, f in enumerate([880, 660, 880, 660]):
    blip(M(5.14 + k * 0.07), f, 0.09, 0.08)
whoosh(M(5.42), D(0.32), 600, 2500, 0.2, -0.4, 0.4)
for j, nn in enumerate([77, 80, 84, 89]):
    bell(M(5.56 + j * 0.05), nn, 0.09, 1.2, pan=-0.3 + j * 0.2)
for k in range(22):
    tick(M(5.96 + 0.72 * (k / 22) ** 1.8), 0.12, 2200, pan=-0.3)
whoosh(M(5.9), D(0.3), 3000, 500, 0.2, peak=0.2)
PENT = [65, 68, 70, 72, 75, 77, 80, 82, 84, 87, 89, 92]
for k in range(24):
    blip(M(6.8 + k * 0.013), midi(PENT[k % 12] + (12 if k >= 12 else 0)), 0.05, 0.06, pan=np.sin(k * 1.7) * 0.8)
whoosh(M(7.28), D(0.4), 300, 1800, 0.22)
whoosh(M(7.74), D(0.3), 500, 5000, 0.35, -0.8, 0.8, 0.9)

# 03 HAUUM
impact(M(8.0), gain=0.7)
for ts in (8.24, 8.46, 8.68, 8.90):
    whoosh(M(ts), D(0.22), 800, 3500, 0.22, 0.6, -0.6, 0.55)
    tick(M(ts + 0.1), 0.15, 1500)
whoosh(M(9.1), D(0.5), 4000, 300, 0.22, peak=0.3)
for j in range(4):
    pop(M(9.26 + j * 0.05), 700 + j * 60, 0.12)
whoosh(M(9.68), D(0.34), 2500, 6000, 0.3, 0.9, -0.3, 0.8)  # page turn

# 04 Chợ Vỉa Hè
for i in range(10):
    pop(M(10.14 + i * 0.035), 520 + 40 * i, 0.1, pan=0.4)
for ts, f, p in [(10.04, 300, 0.4), (10.38, 380, -0.8), (10.46, 420, 0.8), (10.5, 460, 0.3), (10.56, 520, 0.5), (10.8, 600, 0.2)]:
    pop(M(ts), f, 0.3, p)
rattle = sum(filt(noise(0.8), 'bandpass', [3000, 7000]) * env(0.8, 0.002, 0.05 + 0.03 * k) for k in range(3))
add(rattle, M(10.1), 0.08, 0.5, send=0.3)
d = D(1.3)
t = tt(d)
xpos = np.linspace(-1, 1, len(t))                      # the scooter drives left → right
dop = 1 + 0.08 * np.tanh(-xpos * 3)
eng = saw(88 * dop * (1 + 0.02 * np.sin(2 * np.pi * 23 * t)), d) + 0.5 * saw(176 * dop, d, 0.01)
eng = filt(eng, 'lowpass', 900) * (1 - np.abs(xpos) ** 2) * 0.9
a = (xpos + 1) * np.pi / 4
add(np.vstack([eng * np.cos(a), eng * np.sin(a)]), M(10.62), 0.12, send=0.2)
tick(M(11.3), 0.4, 1800)
tick(M(11.3), 0.25, 600)
whoosh(M(11.56), D(0.3), 500, 4000, 0.3)
whoosh(M(11.7), D(0.3), 300, 2500, 0.3)

# 05 Café Bông — warm hit, the coffee drop and its splash
add(sub_drop(1.4, 55, 40), M(12.0), 0.35)
dd = D(0.22)
td = tt(dd)
fall = sine(1400 * np.exp(-td / 0.3), dd) * np.minimum(1, td / 0.05) * 0.3
add(fall, M(13.1), 0.12, send=0.4)
td = tt(0.12)
drop = sine(420 * np.exp(td / 0.035), 0.12) * env(0.12, 0.0005, 0.03)
add(drop, M(13.31), 0.4, send=0.6)
add(filt(noise(0.3), 'bandpass', [1500, 6000]) * env(0.3, 0.001, 0.05), M(13.32), 0.12, send=0.5)

# 06 Plans & Ambiances — circle wipe, pen, dimensions, rooms; the finished plan holds 5 s
whoosh(BP(14.38), D(0.34), 300, 3000, 0.3)
pd = D(0.46)
pen = filt(noise(pd), 'bandpass', [2500, 6000]) * (0.5 + 0.5 * np.abs(np.sin(np.arange(int(pd * SR)) / SR * 2 * np.pi * 11)))
add(pen * env(pd, 0.03, 0.5), BP(14.56), 0.07, send=0.1)
for k in range(9):                           # the dimensions count up to 8,40 m × 5,60 m
    tick(BP(14.8 + k * 0.04), 0.05, 2600 + 120 * k, -0.3)
for k in range(5):
    pop(BP(15.0 + k * 0.045), 600 + k * 70, 0.13, pan=-0.4 + k * 0.2)
pop(BP(15.1), 900, 0.14, 0.6)
riser(P1 - 1.6, 1.6, 0.2, 300, 7000)         # out of the hold…
whoosh(BP(15.26), D(0.3), 400, 5000, 0.3, peak=0.8)

# 07 GIDEON (master seconds) — A · the Discord bot: the journey of one command
impact(A0, gain=0.6)
whoosh(A0 + 0.05, 0.6, 300, 2400, 0.12, -0.4, 0.2, 0.4)
whoosh(A0 + 0.9, 0.4, 1500, 6000, 0.06, -0.7, 0.7, 0.8)      # the timeline draws itself
CARD = [A0 + 1.0 + i * 0.85 for i in range(5)]
CPAN = [(300 + 330 * i) / 960 - 1 for i in range(5)]
for i, tc in enumerate(CARD):                # one pop per step, its node lights up
    pop(tc, 460 + 70 * i, 0.16, CPAN[i])
    blip(tc + 0.1, midi([72, 75, 77, 80, 84][i]), 0.06, 0.08, CPAN[i])
for k in range(1, 16):                       # `!greport <code>` types itself…
    tick(A0 + 1.15 + 0.6 * k / 15 + rng.random() * 0.008, 0.1 + 0.05 * rng.random(), 2200 + rng.random() * 1800, CPAN[0])
tick(A0 + 1.8, 0.22, 1400, CPAN[0])          # …and is sent
th = CARD[1] + 0.5                           # the hourglass flips every half second
while th < B0 - 0.3:
    tick(th, 0.04 if th < CARD[4] + 0.2 else 0.016, 1200, CPAN[1])
    th += 0.5
for k in range(14):                          # the Warcraft Logs API answers
    blip(CARD[2] + 0.12 + k * 0.025, 900 + rng.random() * 2600, 0.03, 0.02, pan=CPAN[2] + (rng.random() - 0.5) * 0.4)
whoosh(CARD[3] - 0.05, 0.35, 500, 3500, 0.1, CPAN[3] - 0.2, CPAN[3] + 0.2, 0.6)   # a thread opens
for j, nn in enumerate((84, 91)):            # the summary + HTML report land
    bell(CARD[4] + 0.12 + j * 0.09, nn, 0.07, 1.2, pan=CPAN[4])
rd = 3.4                                     # the runner travels the timeline, left → right
air = sweep(noise(rd), 'bandpass', lambda s: [1200 + 1500 * s / rd, 2400 + 3000 * s / rd])
air *= np.minimum(1, tt(rd) / 0.3) * np.minimum(1, (rd - tt(rd)) / 0.3) / (np.abs(air).max() + 1e-9)
a = (np.linspace(CPAN[0], CPAN[4], len(air)) + 1) * np.pi / 4
add(np.vstack([air * np.cos(a), air * np.sin(a)]), A0 + 1.0, 0.03, send=0.3)
pop(A0 + 5.6, 380, 0.1, -0.5)                # "…un verdict chiffré."
for j, nn in enumerate((77, 84)):            # "Chaque chiffre est traçable…" (gold)
    bell(A0 + 6.2 + j * 0.06, nn, 0.06, 1.6, pan=-0.4)
whoosh(B0 - 0.35, 0.4, 3000, 400, 0.12, peak=0.3)

# B · the boss addon: one click, one role
impact(B0, gain=0.7)
whoosh(B0 + 0.05, 0.6, 300, 2400, 0.12, 0.2, -0.4, 0.4)
clac = filt(noise(0.05), 'bandpass', [1800, 6000]) * env(0.05, 0.0003, 0.006)
clac += sine(210 * np.exp(-tt(0.05) / 0.02), 0.05) * env(0.05, 0.0005, 0.012) * 0.8
add(clac, B0 + 0.9, 0.55, -0.7, send=0.2)    # the panel opens by itself: "clac"
for i in range(3):
    tick(B0 + 0.95 + i * 0.05, 0.06, 3200 + 300 * i, -0.7)
whoosh(B0 + 1.4, 0.6, 800, 1600, 0.035, 0.0, -0.7, 0.6)      # the cursor travels
tick(B0 + 1.95, 0.08, 4500, -0.7)            # hover on 1 vert + 3 rouges
tick(B0 + 2.08, 0.3, 1600, -0.7)             # click
tick(B0 + 2.15, 0.15, 2400, -0.7)
whoosh(B0 + 2.25, 0.4, 1500, 4000, 0.08, -0.7, -0.3, 0.7)    # the panel becomes one line
for j, nn in enumerate((80, 84)):            # ANCHOR — reste sur place, ping toi-même
    bell(B0 + 2.5 + j * 0.08, nn, 0.09, 1.4, pan=-0.5)
for i in range(3):                           # the role legend
    tick(B0 + 3.0 + i * 0.4, 0.05, 3500, -0.6)
for r in range(2):                           # the pairs balance: 4 verts + 4 rouges
    tr0 = B0 + 2.9 + r * 0.55
    pop(tr0, 520 + 80 * r, 0.14, 0.45)
    for j, nn in enumerate((84, 88, 91)):
        bell(tr0 + 0.35 + j * 0.05, nn, 0.06, 1.2, pan=0.45)
tick(B0 + 4.8, 0.05, 3000, 0.3)              # CurseForge · GitHub
rd = 0.75                                    # reverse swell into the name
rev = crash(rd)[::-1] * np.linspace(0, 1, int(rd * SR)) ** 2
add(np.vstack([rev, np.roll(rev, 90)]), C0 - rd, 0.3)

# C · the name
impact(C0, gain=0.85)
for j, nn in enumerate((77, 81, 84, 89, 93)):
    bell(C0 + 0.05 + j * 0.04, nn, 0.06, 2.2, pan=-0.4 + j * 0.2)
for i in range(6):                           # G-I-D-E-O-N rise
    tick(C0 + 0.1 + i * 0.05, 0.05, 2400 + 150 * i, -0.5 + i * 0.2)
for i in range(3):                           # un bot, un addon, une guilde
    pop(C0 + 0.8 + i * 0.15, 700 + i * 80, 0.06, -0.3 + 0.3 * i)
whoosh(GE - 0.4, 0.5, 300, 3000, 0.25, peak=0.8)             # night → the wall

# 08 selected work — build, snare roll, hyper-cut hits
riser(F(15.4), D(1.6), 0.3, 200, 8000)
tr = 16.0
k = 0
while tr < 17.0:
    add(clap(), F(tr), 0.1 + 0.25 * (tr - 16.0), pan=0.1 * np.sin(k), send=0.2)
    tr += 0.125 if tr < 16.5 else (0.0625 if tr < 16.75 else 0.03125)
    k += 1
for k in range(8):
    tc = F(17.0 + k * 0.0625)
    add(kick(), tc, 0.55)
    stab(tc, [nn + 12 for nn in CHORD['C7']], 0.12, 0.08, bright=2500 + 800 * k)
    tick(tc, 0.2, 3000 + 400 * k)

# silence gate: everything stops dead at the flash, a reverse swell pulls into the drop
pre_mix, pre_verb = mix.copy(), verb.copy()
mix[:], verb[:] = 0, 0
rd = D(0.28)
rev = crash(rd)[::-1] * np.linspace(0, 1, int(rd * SR)) ** 2
add(np.vstack([rev, np.roll(rev, 90)]), F(17.72), 0.5)
tick(F(17.72), 0.08, 5000)
tick(F(17.86), 0.08, 5000)

# 09 outro — the drop, the resolve
impact(F(18.0), big=True)
d = D(2.0)
fin = sum(saw(midi(nn), d, dt) for nn in (41, 53, 56, 60, 67) for dt in (-0.006, 0.0, 0.006))
fin = sweep(fin, 'lowpass', lambda s: 400 + 2600 * np.exp(-s / 0.8))
fin *= np.minimum(1, tt(d) / 0.01) * np.exp(-tt(d) / 2.2)
add(np.vstack([fin, np.roll(fin, 311)]), F(18.0), 0.06, send=0.5)
for i in range(11):
    tick(F(18.0 + abs(i - 5) * 0.024), 0.06, 2500 + 200 * i, pan=-0.8 + i * 0.16)
whoosh(F(18.14), D(0.4), 800, 4000, 0.18, -0.6, 0.6, 0.3)
for j, nn in enumerate([72, 77, 80, 84]):
    bell(F(18.38 + j * 0.07), nn, 0.07, 2.0, pan=-0.3 + j * 0.2)
for tc in (18.5, 19.0, 19.5):
    tick(F(tc), 0.035, 5000)

# ─────────────────────────── reverb + master ───────────────────────────
ir_n = int(2.4 * SR)
ir_t = np.arange(ir_n) / SR
ir = np.vstack([filt(rng.standard_normal(ir_n), 'lowpass', 6000) * np.exp(-ir_t / 0.55) for _ in range(2)])
ir[:, :int(0.012 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def reverb(x):
    return np.vstack([signal.fftconvolve(x[c], ir[c])[:N] for c in range(2)]) * 0.55


pre = pre_mix + reverb(pre_verb)
g0, fade = int(F(17.5) * SR), int(0.012 * SR)
pre[:, g0:g0 + fade] *= np.linspace(1, 0, fade)
pre[:, g0 + fade:] = 0
out = pre + mix + reverb(verb)
out = filt(out, 'highpass', 28)
f0 = int(F(19.6) * SR)
out[:, f0:] *= np.linspace(1, 0, N - f0) ** 1.5
out /= np.abs(out).max()
out = np.tanh(out * 1.8) / np.tanh(1.8)
out *= 0.89 / np.abs(out).max()
rms = np.sqrt((out ** 2).mean())
print(f'rms {20 * np.log10(rms):.1f} dBFS')

os.makedirs(os.path.join(os.path.dirname(__file__) or '.', 'out'), exist_ok=True)
path = os.path.join(os.path.dirname(__file__) or '.', 'out', 'soundtrack.wav')
pcm = (np.clip(out.T, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
raw = pcm.astype('<i4').tobytes()
raw = b''.join(raw[i:i + 3] for i in range(0, len(raw), 4))
with wave.open(path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(raw)
print('wrote', path, f'{DUR:.2f}s peak', float(np.abs(out).max()))
