# Synergetics Sonification Lab

An **offline** HTML/JavaScript/CSS laboratory that turns Buckminster Fuller’s *Synergetics* geometry into sound.

Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge). No build step, no network, no CDN.

## Primary sources

Numbers, formulas, and short attributed lines are taken from:

- **R. Buckminster Fuller** with **E.J. Applewhite**, *Synergetics: Explorations in the Geometry of Thinking* (Macmillan, 1975 / 1979)
- Online edition (with Estate permission): [rwgrayprojects.com/synergetics](http://www.rwgrayprojects.com/synergetics/)

Section citations (e.g. §223.03) appear throughout the UI. Full prose remains under copyright; this project embeds only standard tables, equations, and brief quotations for educational sonification.

## Laboratories

| Lab | What you hear | Source |
|-----|----------------|--------|
| **Concentric Hierarchy** | Tetravolumes (1, 3, 4, 5, 6, 20…) as pitches/chords; A-module ticks every 24 | §223.66, 982, 986 |
| **Frequency Shells** | `X = 2 N F² + 2` shell growth, N ∈ {1,2,3,5} | §223.03, 223.21 |
| **12-Around-1 Packing** | VE layers 12, 42, 92… as polyrhythms | §223.20–21, 415 |
| **Jitterbug Transform** | VE → icosa → octa → tet; volume morphs pitch & filter | §460–465 |
| **Angular Topology** | `nS + 720° = 360° X`; constant 720° excess as beating | §224.00 |
| **A & B Quanta** | 1/24 modules assembling tet / MITE / octa / VE | §920–950 |
| **Two Kinds of Twoness** | Additive poles (+2) vs multiplicative dual (×2) | §223.05–12 |
| **Chord Factors** | `2 sin(θ/2)` arcs as intervals (VE 60° = radius = edge) | §905, 430 |

## Controls

- **Play / Stop** — or press `Space`
- **Tempo, gain, root Hz** — global tuning (default root 110 Hz = “vector unit”)
- **Step** — subdivision of the beat
- **Tuning** — just/60° ratios vs equal temperament
- **Strike** — one-shot random hierarchy tone
- Lab-specific: **N** (prime) and **max F** on frequency/packing modes

## Sonification map

- **Volume → pitch** — `Hz = root × 2^(0.45 · log₂(tetravolume))`
- **Frequency F → layer index** — size and time as the same phenomenon (§528.00)
- **Prime N → timbre family** — tet / octa / cube / VE partial sets
- **720° → spectral marker** — angular topology constant
- **A/B modules → short ticks** — quanta of 1/24 tetravolume
- **Chord factor → frequency ratio** — great-circle chords

## Files

```
index.html              App shell
css/lab.css             Styles
js/primary-sources.js   Hierarchy, formulas, quotes, packing tables
js/audio.js             Web Audio engine (oscillators only)
js/geometry.js          Wireframe polyhedra + shell drawing
js/labs.js              Lab generators
js/app.js               UI wiring
```

## Local server (optional)

Browsers allow `file://` for this project. If a browser restricts modules or audio autoplay, serve the folder:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Click **Play** after load — browsers require a user gesture to start audio.
