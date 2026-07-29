/**
 * Lab mode generators — each maps a primary-source structure to sound.
 */

const LABS = {
  list: [
    {
      id: "hierarchy",
      title: "Concentric Hierarchy",
      subtitle: "Tetravolumes → pitch & chord",
      cite: "223.66, 982.00, 986.00",
      blurb:
        "Fuller measures volume with the unit tetrahedron = 1. Whole-number volumes of the concentric hierarchy (1, 3, 4, 5, 6, 20…) become pitches and chords. A & B modules (1/24) tick as quanta.",
    },
    {
      id: "frequency",
      title: "Frequency Shells",
      subtitle: "X = 2 N F² + 2",
      cite: "223.03, 223.21",
      blurb:
        "Prime-number inherency: outer-layer sphere count X = 2NF²+2 with N ∈ {1,2,3,5}. Each shell arrival is a strike; F steps outward as frequency (size = time).",
    },
    {
      id: "packing",
      title: "12-Around-1 Packing",
      subtitle: "VE layers 12, 42, 92…",
      cite: "223.20–223.21, 415.00",
      blurb:
        "Closest packing of equal spheres: nucleus + layers of the vector equilibrium. Layer F has 10F²+2 spheres. Cumulative growth becomes a rising polyrhythm.",
    },
    {
      id: "jitterbug",
      title: "Jitterbug Transform",
      subtitle: "VE → icosa → octa → tet",
      cite: "460.00–465.00",
      blurb:
        "The vector equilibrium contracts through icosahedral and octahedral phases to the tetrahedron. Volume and radius morph continuously; pitch and brightness follow the fold.",
    },
    {
      id: "angular",
      title: "Angular Topology",
      subtitle: "nS + 720° = 360° X",
      cite: "224.00",
      blurb:
        "Every closed polyhedron carries 720° of angular excess — one tetrahedron of angle. Excess and vertex count set harmonic beating and chord spacing.",
    },
    {
      id: "modules",
      title: "A & B Quanta",
      subtitle: "1/24 tetravolume voxels",
      cite: "920.00–924.20, 950.00",
      blurb:
        "A and B modules each have volume 1/24. 24 A-modules fill a tetrahedron; MITE = 2A+1B. Listen to quanta assemble into tet, cube, octa, VE.",
    },
    {
      id: "twoness",
      title: "Two Kinds of Twoness",
      subtitle: "Additive +2 · Multiplicative ×2",
      cite: "223.05–223.12",
      blurb:
        "Additive twoness = polar axis of spin. Multiplicative twoness = inside/outside, convex/concave. Two voices: poles drone; dual surfaces answer in contrary motion.",
    },
    {
      id: "chords",
      title: "Chord Factors",
      subtitle: "Great-circle arcs → beats",
      cite: "905.00, 430.00",
      blurb:
        "Chord factor = 2 sin(θ/2) for central angle θ. VE’s defining 60° (radius = edge) and other synergetic arcs become interval ratios and beating pairs.",
    },
  ],

  /** -------- generators -------- */

  hierarchy(audio, when, step, params) {
    const items = PRIMARY.hierarchy.filter((h) => h.vol >= 1 / 24);
    const idx = step % items.length;
    const it = items[idx];
    params._activeId = it.id;
    params._label = `${it.name}  ·  vol ${formatVol(it.vol)}  ·  §${it.cite}`;

    const freq = audio.volToHz(it.vol);
    const isModule = it.vol < 1;
    audio.tone({
      freq,
      when,
      dur: isModule ? 0.12 : 0.45,
      type: it.id === "ve" ? "ve" : it.id === "tet" ? "tet" : "triangle",
      gain: isModule ? 0.08 : 0.14,
      filterHz: 1200 + it.vol * 80,
      pan: (idx / items.length) * 2 - 1,
      attack: 0.01,
      harmonic: it.prime ? it.prime / 4 : 0,
    });

    // On whole-number volumes, add synergy partials from module count
    if (it.vol >= 1 && step % 2 === 0) {
      const partials = [1, 5 / 4, 3 / 2].map((r) => freq * r);
      audio.chord(partials, {
        when: when + 0.02,
        dur: 0.35,
        type: "sine",
        gain: 0.06,
        panSpread: true,
      });
    }

    // A-module tick every 24 steps (fills a tetra)
    if (step % 24 === 0) {
      audio.tone({
        freq: audio.rootHz * 4,
        when,
        dur: 0.05,
        type: "square",
        gain: 0.05,
        filterHz: 2000,
      });
    }
  },

  frequency(audio, when, step, params) {
    const N = params.N || 5;
    const maxF = params.maxF || 6;
    const F = (step % maxF) + 1;
    const X = PRIMARY.shellSpheres(N, F);
    params._activeF = F;
    params._N = N;
    params._label = `N=${N}  F=${F}  →  X=${X} spheres  ·  X=2NF²+2  ·  §223.03`;

    // Strike for each "batch" of spheres — density from X
    const base = audio.rootHz * (N === 1 ? 1 : N === 2 ? 5 / 4 : N === 3 ? 3 / 2 : 2);
    const freq = base * Math.pow(2, (F - 1) * 0.25);

    audio.tone({
      freq,
      when,
      dur: 0.2 + F * 0.04,
      type: N === 5 ? "ve" : N === 1 ? "tet" : "triangle",
      gain: 0.12,
      filterHz: 800 + F * 400,
      pan: (F / maxF) * 2 - 1,
    });

    // Micro-ticks proportional to shell size (capped)
    const ticks = Math.min(12, Math.max(2, Math.floor(X / 20)));
    for (let i = 0; i < ticks; i++) {
      audio.tone({
        freq: freq * (1 + i * 0.02),
        when: when + i * (0.03 * (params.stepDiv || 0.25)),
        dur: 0.04,
        type: "sine",
        gain: 0.03,
        filterHz: 3000,
        pan: (i / ticks) * 2 - 1,
      });
    }
  },

  packing(audio, when, step, params) {
    const maxF = params.maxF || 5;
    const F = (step % (maxF + 1));
    const layer = PRIMARY.spherePacking.layer(F);
    const cum = PRIMARY.spherePacking.cumulative(F);
    params._activeF = F;
    params._label =
      F === 0
        ? `Nucleus · 1 sphere  ·  §415.00`
        : `Layer F=${F} · ${layer} spheres · cumulative ${cum}  ·  10F²+2  ·  §223.21`;

    if (F === 0) {
      audio.tone({
        freq: audio.rootHz,
        when,
        dur: 0.6,
        type: "sine",
        gain: 0.16,
        filterHz: 600,
      });
      return;
    }

    // Polyrhythm: pulse rate related to layer count
    const fund = audio.rootHz * Math.pow(2, F * 0.2);
    audio.tone({
      freq: fund,
      when,
      dur: 0.3,
      type: "ve",
      gain: 0.12,
      filterHz: 1000 + F * 300,
    });

    // 12-fold symmetry accent for F=1
    const accent = F === 1 ? 12 : Math.min(16, Math.floor(layer / 6));
    for (let i = 0; i < accent; i++) {
      const r = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2][i % 6];
      audio.tone({
        freq: fund * r * 0.5,
        when: when + i * 0.035,
        dur: 0.06,
        type: "triangle",
        gain: 0.035,
        pan: Math.sin((i / accent) * Math.PI * 2),
        filterHz: 2500,
      });
    }
  },

  jitterbug(audio, when, step, params) {
    const stages = PRIMARY.jitterbug.stages;
    const cycle = 64;
    const t = (step % cycle) / cycle;
    params._jitterT = t;
    // find stage label
    let stage = stages[0];
    for (const s of stages) {
      if (t >= s.t) stage = s;
    }
    // interpolate volume along path
    let vol = 20;
    for (let i = 0; i < stages.length - 1; i++) {
      const a = stages[i];
      const b = stages[i + 1];
      if (t >= a.t && t <= b.t) {
        const u = (t - a.t) / (b.t - a.t || 1);
        vol = a.vol + (b.vol - a.vol) * u;
        break;
      }
    }
    if (t > stages[stages.length - 1].t) vol = stages[stages.length - 1].vol;

    params._label = `${stage.name}  ·  t=${t.toFixed(2)}  ·  vol≈${vol.toFixed(2)}  ·  §460.00`;

    const freq = audio.volToHz(vol);
    const brightness = 800 + (1 - t) * 3200;
    audio.tone({
      freq,
      when,
      dur: 0.28,
      type: t < 0.2 ? "ve" : t < 0.5 ? "triangle" : t < 0.75 ? "tet" : "sine",
      gain: 0.13,
      filterHz: brightness,
      pan: Math.sin(t * Math.PI * 2) * 0.7,
      detune: Math.sin(step * 0.5) * 8,
    });

    // Contraction: second voice inverted (multiplicative dual)
    audio.tone({
      freq: audio.volToHz(21 - vol),
      when: when + 0.01,
      dur: 0.22,
      type: "sine",
      gain: 0.06,
      filterHz: 1500,
      pan: -Math.sin(t * Math.PI * 2) * 0.7,
    });
  },

  angular(audio, when, step, params) {
    const systems = PRIMARY.angularTopology.systems;
    const sys = systems[step % systems.length];
    params._activeSys = sys.name;
    // 720° excess is constant — the "tetra of angle"
    const excess = 720;
    const X = sys.X;
    params._label = `${sys.name} · X=${X} · excess ${excess}° · nS+720=360X · §224.00`;

    // Map vertex count to chord
    const root = audio.rootHz * (X / 4);
    // Beat frequency related to excess/X
    const beat = excess / X / 100; // mild detune
    audio.tone({
      freq: root,
      when,
      dur: 0.5,
      type: "sine",
      gain: 0.12,
      filterHz: 2000,
      pan: -0.4,
    });
    audio.tone({
      freq: root * (1 + beat * 0.01),
      when,
      dur: 0.5,
      type: "sine",
      gain: 0.1,
      filterHz: 2000,
      pan: 0.4,
    });
    // 720 Hz partial scaled into range — angular constant as spectral marker
    audio.tone({
      freq: audio.rootHz * (720 / 360), // 2× root related to 720/360
      when: when + 0.05,
      dur: 0.2,
      type: "triangle",
      gain: 0.05,
      filterHz: 3000,
    });
  },

  modules(audio, when, step, params) {
    // Build assemblies: count modules toward target shapes
    const targets = [
      { name: "Tetrahedron", need: 24, kind: "A", vol: 1 },
      { name: "MITE", need: 3, kind: "mixed", vol: 1 / 8 }, // 2A+1B
      { name: "Octahedron", need: 96, kind: "mixed", vol: 4 }, // 48A+48B
      { name: "VE", need: 480, kind: "mixed", vol: 20 }, // 336A+144B
    ];
    const target = targets[Math.floor(step / 48) % targets.length];
    const local = step % 48;
    const isB = target.kind === "mixed" ? local % 3 === 2 : false;
    params._label = `${isB ? "B" : "A"} module → assembling ${target.name} (vol ${formatVol(target.vol)}) · §920–950`;
    params._activeId = isB ? "b-mod" : "a-mod";

    const freq = audio.rootHz * (isB ? 6 / 5 : 1) * 2;
    audio.tone({
      freq,
      when,
      dur: 0.08,
      type: "square",
      gain: 0.07,
      filterHz: isB ? 1800 : 2400,
      pan: isB ? 0.5 : -0.5,
    });

    // Completion chime every assembly quantum
    if (local === 23 || (target.kind === "mixed" && local === 2)) {
      audio.chord(
        [1, 5 / 4, 3 / 2, 2].map((r) => audio.volToHz(target.vol) * r),
        { when: when + 0.02, dur: 0.4, type: "tet", gain: 0.1, panSpread: true }
      );
    }
  },

  twoness(audio, when, step, params) {
    params._label = `Additive poles (+2)  ·  Multiplicative dual (×2)  ·  §223.05–223.12`;
    const root = audio.rootHz;

    // Additive: two poles — steady fifth apart
    if (step % 4 === 0) {
      audio.tone({
        freq: root,
        when,
        dur: 0.8,
        type: "sine",
        gain: 0.08,
        pan: -0.9,
        filterHz: 800,
      });
      audio.tone({
        freq: root * 1.5,
        when,
        dur: 0.8,
        type: "sine",
        gain: 0.08,
        pan: 0.9,
        filterHz: 800,
      });
    }

    // Multiplicative: inside/outside contrary motion
    const phase = (step % 16) / 16;
    const inner = root * 2 * (1 + phase);
    const outer = root * 4 * (2 - phase) / 2;
    audio.tone({
      freq: inner,
      when,
      dur: 0.2,
      type: "triangle",
      gain: 0.07,
      pan: -0.3,
      filterHz: 2000,
    });
    audio.tone({
      freq: outer,
      when,
      dur: 0.2,
      type: "triangle",
      gain: 0.07,
      pan: 0.3,
      filterHz: 2000,
    });
  },

  chords(audio, when, step, params) {
    const arcs = PRIMARY.chordFactors.arcs;
    const arc = arcs[step % arcs.length];
    const cf = PRIMARY.chordFactors.chord(arc.deg);
    params._label = `${arc.name} · θ=${arc.deg.toFixed(2)}° · chord=${cf.toFixed(4)} · §905.00`;
    params._activeArc = arc.name;

    // Sonify: root + root*chord factor as interval; beat from nearby pairs
    const root = audio.rootHz * 2;
    audio.tone({
      freq: root,
      when,
      dur: 0.55,
      type: "sine",
      gain: 0.11,
      pan: -0.35,
      filterHz: 3000,
    });
    audio.tone({
      freq: root * cf,
      when: when + 0.02,
      dur: 0.55,
      type: "sine",
      gain: 0.1,
      pan: 0.35,
      filterHz: 3000,
    });

    // 60° special: perfect radius=edge of VE → cf = 1
    if (Math.abs(arc.deg - 60) < 0.01) {
      audio.tone({
        freq: root * 2,
        when: when + 0.08,
        dur: 0.3,
        type: "ve",
        gain: 0.08,
        filterHz: 4000,
      });
    }
  },
};

function formatVol(v) {
  if (v < 1) {
    // show as fraction if near 1/n
    const inv = Math.round(1 / v);
    if (Math.abs(1 / inv - v) < 1e-9) return `1/${inv}`;
  }
  return Number.isInteger(v) ? String(v) : v.toFixed(3);
}

window.LABS = LABS;
