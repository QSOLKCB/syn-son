## History of Sonification in Synergetics Lab 

#Syn-Son v1.0.0

A zero-install historical archive, visual score, Web Audio instrument, and deterministic WAV renderer.

### [Launch the live lab →](https://qsolkcb.github.io/syn-son/)

No account, package manager, build step, CDN, cloud runtime, or local server is required.

## What changed in v1.0.0

The original proof of concept has been rebuilt as a historical sonification instrument rather than a collection of disconnected geometry-to-sound modes.

- eight navigable historical movements, from Fuller's late-1930s/1944 shell-count account to the 2026 Syn-Son implementation;
- historical-record, audible-mapping, and interpretive-boundary panels for every movement;
- per-movement source, lore-trail, archive, and provenance drawers;
- primary, institutional, legacy-web, contemporary-project, and derived-mapping source labels;
- deterministic event scores shared by live Web Audio and offline WAV rendering;
- stereo 16-bit PCM WAV export at 44.1 or 48 kHz;
- downloadable JSON provenance manifests with seed, score fingerprint, source IDs, mappings, and render settings;
- direct `file://` support using classic scripts—no modules, `fetch()`, workers, or runtime requests;
- deep-linked state, guided history, presenter mode, PNG capture, keyboard control, and pointer orbit;
- restrained archive-instrument visuals with no external graphics or fonts;
- Node-based invariants, determinism tests, static-hosting checks, and a GitHub Pages Actions workflow.

## The historical boundary

Fuller and E.J. Applewhite documented geometric uses of terms including **frequency**, **size**, **time**, **energy**, **twoness**, **topology**, **modules**, and **transformation**.

They did **not** document this Web Audio composition.

Syn-Son therefore keeps three things visibly separate:

1. the historical or bibliographic record;
2. the source quantity or relationship;
3. the contemporary rule that converts it into pitch, rhythm, density, timbre, pan, or filter movement.

In particular:

- “frequency” in *Synergetics* often means modular edge subdivision or shell count, not Hertz;
- the default 108 Hz root is one quarter of a **declared 432 Hz reference**, not a tuning derived from Fuller;
- the jitterbug interpolation, musical counterpoint, web-link pulses, and sound design are interpretive;
- schematic module graphics do not claim exact T/E/S/K meshes;
- legacy teaching pages are preserved as lineage and web archaeology, not silently promoted to primary sources.

## Historical movements

| Era | Movement | Historical object | Contemporary audible mapping |
|---|---|---|---|
| late 1930s–1944 | Closest-packed shells | Fuller's account of discovering and publishing the `10F² + 2` relationship | shell population → scaled density and register |
| 1975 | Concentric hierarchy | first Macmillan *Synergetics* volume and tetrahedral volume accounting | tetravolume → logarithmic pitch |
| 1977 | Editorial counterpoint | Applewhite's *Cosmic Fishing* and the recorded collaboration | two historical strands → stereo call and response |
| 1979 | Prime-frequency field | combined work's prime inherency, twoness, angular, and frequency language | `N` → timbre; `F` → time; `X` → density/register |
| 1997–present | Web archaeology | posthumous, section-addressable R.W. Gray web edition | section → node; link → interval; gap → rest |
| legacy web era | Module workshop | Book IX plus independent module and Quadray pedagogy | A/B identity → distinct tick timbre and pan |
| 2026 | Jitterbug coda | source-linked transformation plus the Presenter Lab preservation model | phase → pitch/filter morph and station cadence |
| 2026 | Historical synthesis | the present independent Syn-Son project | all movements → one deterministic archive score |

## Server-free Web Audio and WAV

Open `index.html` directly.

The application deliberately uses ordinary `<script>` tags and local relative paths. It does not call `fetch()` and does not rely on browser module loading, so the same checked-in files run from:

- a double-clicked local `index.html`;
- GitHub Pages;
- any ordinary static host.

Live playback uses `AudioContext`. WAV export uses `OfflineAudioContext`, schedules the same deterministic events through the same synthesis function, and encodes the rendered stereo buffer as signed 16-bit little-endian PCM entirely inside the page.

Nothing is uploaded. There is no hidden audio service.

## Controls

- **Play movement / Stop** — live Web Audio transport;
- **Render WAV** — choose 4, 8, 16, or 32 bars and 44.1 or 48 kHz;
- **Export manifest** — save the render and provenance recipe as JSON;
- **Tempo / root / gain / detail / maximum F / seed** — deterministic score parameters;
- **Guided history** — step through record, mapping, and boundary together;
- **Capture PNG** — download the visual score;
- **Copy state link** — preserve era and parameters in the URL hash;
- **Presenter mode** — stage-and-signal fullscreen layout;
- drag the stage — orbit supported geometry.

Keyboard:

| Key | Action |
|---|---|
| `Space` | play / stop |
| `[` / `]` | previous / next historical movement |
| `W` | render WAV |
| `C` | capture PNG |
| `P` | presenter mode |
| `Esc` | leave presenter mode |

## Mapping ledger

The complete ledger is shown in the interface and exported with manifests. Core rules include:

| Source quantity | Audio parameter | Declared rule |
|---|---|---|
| tetravolume | pitch ratio | `2^(0.45 × log₂(volume))` |
| edge frequency `F` | rhythmic position | successive `F` values occupy equal beat cells |
| shell population `X` | density and register | scaled density; `log₂(X)` shapes pitch |
| prime family `N` | oscillator family | `1` sine · `2` triangle · `3` square · `5` sawtooth |
| two kinds of twoness | stereo motion | opposed pans resolve to a center cadence |
| A/B module identity | tick timbre and pan | A left/triangle · B right/square |
| web section link | connecting interval | node index sets time; linked node sets pitch |
| declared reference | root frequency | 108 Hz default = one quarter of 432 Hz |

These are **derived mappings**, not claims that the source quantities are acoustic quantities.

## Primary and preservation sources

The in-app ledger links each movement to the relevant source trail. Principal anchors include:

- R. Buckminster Fuller with E.J. Applewhite, *Synergetics* (Macmillan, 1975) and *Synergetics 2* (1979);
- the Estate-permitted [R.W. Gray web edition](https://www.rwgrayprojects.com/synergetics/);
- [Buckminster Fuller Institute's Synergetics overview](https://www.bfi.org/about-fuller/big-ideas/synergetics/);
- E.J. Applewhite's 1977 [*Cosmic Fishing* bibliographic record](https://www.bfi.org/resource/cosmic-fishing-an-account-of-writing-synergetics-with-buckminster-fuller/);
- Fuller's archived [*Everything I Know*, Section 11](https://www.bfi.org/about-fuller/everything-i-know/section-11/);
- Kirby Urner's preserved [Synergetics modules page](https://www.grunch.net/synergetics/modules.html);
- the independent [School of Tomorrow repository](https://github.com/4dsolutions/School_of_Tomorrow);
- QSOL-IMC's [Synergetics Presenter Lab](https://qsolkcb.github.io/synergetics-viz/).

Short phrases, formulas, and section references are used for educational navigation. Full copyrighted prose and historical diagrams are not copied into the project.

## Repository layout

```text
index.html                 Static application shell
css/lab.css                Archive-instrument interface
js/primary-sources.js      Historical eras and provenance ledger
js/labs.js                 Pure deterministic score compiler
js/audio.js                Shared Web Audio and OfflineAudioContext renderer
js/geometry.js             Dependency-free schematic visual score
js/app.js                  UI, deep links, exports, capture, and presentation
docs/HISTORICAL-NOTE.md    Historical and namespace boundaries
docs/SONIFICATION-MAP.md   Mapping specification and reproducibility contract
tests/model.test.js        Math, data, score, WAV, and static-hosting checks
.github/workflows/pages.yml Validation and Pages deployment
```

## Validation

Run:

```bash
node --check js/primary-sources.js
node --check js/labs.js
node --check js/audio.js
node --check js/geometry.js
node --check js/app.js
node tests/model.test.js
```

The tests verify:

- VE shell populations `12, 42, 92, 162, 252`;
- cumulative shell populations;
- `X = 2NF² + 2` across the four declared prime families;
- deterministic score reproduction and seed sensitivity;
- finite, ordered, audible event parameters;
- source coverage and boundary text for every historical era;
- valid 16-bit PCM WAV headers and byte counts;
- a static file graph with no module scripts, `fetch()`, CDN, or local-server dependency.

## GitHub Pages

The Pages workflow validates JavaScript and model invariants on pull requests and pushes. It deploys the repository root after a successful push to `main`.

The workflow uses current Pages actions and explicitly opts JavaScript actions into the Node 24 runtime.

## Independence

Independent work by Trent Slade / QSOL-IMC, informed by public source material, preserved web resources, and earlier independent teaching projects.

No affiliation or endorsement is claimed from the Buckminster Fuller Institute, Fuller Estate, R.W. Gray Projects, E.J. Applewhite's estate, Kirby Urner, School of Tomorrow contributors, Macmillan, or any linked institution or contributor.

## License

Software code is licensed under the repository's MIT License. Linked texts, names, archival media, and third-party source material retain their respective rights.
