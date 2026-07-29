# Syn-Son Sonification Map

## Reproducibility contract

One pure score compiler creates an ordered event ledger. That ledger is consumed by:

- `AudioContext` for live playback;
- `OfflineAudioContext` for WAV rendering;
- the on-screen event table;
- the visual score;
- the JSON provenance manifest.

No renderer is allowed to invent a second musical interpretation.

Given the same:

- application and mapping version;
- movement;
- root frequency;
- tempo;
- gain;
- detail level;
- maximum geometric frequency `F`;
- deterministic seed;

the compiled event ledger and its fingerprint are identical.

The WAV also depends on render length, sample rate, browser Web Audio implementation, and normalization setting. The score fingerprint identifies the event recipe; it is not presented as a cross-browser bit-identical audio hash.

## Event schema

Each compiled event contains:

| Field | Unit / domain | Purpose |
|---|---|---|
| `id` | stable string | event identity and deterministic noise seed |
| `time` | beats | onset inside the movement loop |
| `duration` | beats | envelope duration |
| `frequency` | Hz | already-resolved audible oscillator frequency |
| `waveform` | sine / triangle / square / sawtooth | oscillator family |
| `gain` | 0–0.8 | event amplitude before the master stage |
| `pan` | −1…1 | stereo position |
| `filterHz` | Hz | low-pass cutoff |
| `attack` | seconds | amplitude rise |
| `release` | seconds | amplitude fall |
| `label` | text | human-readable event name |
| `datum` | text | source quantity or derived calculation |
| `sourceId` | ledger key | provenance link |
| `color` | CSS color | visual-score identity |

## Core mapping laws

### Tetravolume → pitch

For positive tetravolume \(V\):

\[
r(V)=2^{0.45\log_2 V}
\]

\[
f(V)=\operatorname{clamp}(f_0r(V),24,12000)
\]

where \(f_0\) is the user-selected root in Hertz.

The source supplies volume accounting. The coefficient `0.45`, audible clamp, harmonic support, and tuning reference are Syn-Son choices.

### Closest-packed shell population

For the vector-equilibrium family:

\[
X(F)=10F^2+2
\]

The exact count remains visible. Audible voice count is bounded:

\[
D(F)=\min(3+C+F,11)
\]

where \(C\) is the detail setting. This preserves progression without creating hundreds of simultaneous oscillators.

### Prime-number inherency family

The source equation is:

\[
X=2NF^2+2,\qquad N\in\{1,2,3,5\}
\]

Syn-Son assigns:

| `N` | oscillator |
|---:|---|
| 1 | sine |
| 2 | triangle |
| 3 | square |
| 5 | sawtooth |

This timbre table is derived. The numbers do not historically encode oscillator types.

### Editorial counterpoint

The Fuller strand is placed predominantly left and uses triangle waves. The Applewhite strand is placed predominantly right and uses sine waves. Shared ledger cadences are centered.

This is an interpretive memorial structure. It is not voice synthesis and not a reconstruction of any conversation.

### Web archaeology

Source-ledger entries occupy nodes around a ring. A deterministic seeded link selects a target. Node onset becomes a short tone; the link becomes a second connecting interval. The absence of source material is represented as a rest, not synthetic historical content.

### Modules

A and B are kept as distinct tick identities:

- A: triangle oscillator, left pan;
- B: square oscillator, right pan.

A 24-step cadence marks the unit-tetrahedron accounting used by the movement. Visual tiles remain schematic.

### Jitterbug

Named endpoints and source relationships anchor the movement. Intermediate pitch and filter values follow a contemporary interpolation curve:

\[
V(t)=20\left(\frac{1}{20}\right)^t,\qquad 0\leq t\leq1
\]

This equation is a smooth musical mapping, not a claimed exact physical volume law for every jitterbug phase.

## Tuning declaration

Default:

\[
f_0=108\text{ Hz}=\frac{432\text{ Hz}}{4}
\]

The user may select any root from 54 to 216 Hz. The 432 Hz relationship is metadata and artistic intent, not a mathematical result of Synergetics.

## WAV format

- `OfflineAudioContext`;
- two channels;
- 44,100 or 48,000 samples per second;
- signed 16-bit little-endian PCM;
- optional peak normalization to 0.98;
- 4, 8, 16, or 32 four-beat bars;
- RIFF/WAVE header written directly in JavaScript.

The complete render occurs in the browser. No samples, streams, uploads, encoders, or server endpoints are used.

## Fingerprint

The score fingerprint is FNV-1a over a stable serialization of:

- model version;
- movement identifier;
- duration;
- normalized parameters;
- ordered audible event fields.

The timestamp in the JSON manifest is provenance metadata and is deliberately excluded from the deterministic identity.
