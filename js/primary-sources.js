/**
 * Synergetics primary-source data for the Sonification Lab.
 *
 * Sources (cited by section number throughout the UI):
 *   R. Buckminster Fuller with E.J. Applewhite,
 *   Synergetics: Explorations in the Geometry of Thinking
 *   (Macmillan, 1975 / 1979). Online edition hosted with permission at
 *   rwgrayprojects.com/synergetics/
 *
 * Only well-established numerical tables, formulas, and short attributed
 * quotations are embedded. Full prose remains under copyright of the Estate.
 */

const PRIMARY = Object.freeze({
  work: "Synergetics: Explorations in the Geometry of Thinking",
  author: "R. Buckminster Fuller (with E.J. Applewhite)",
  years: "1975 / 1979",
  online: "http://www.rwgrayprojects.com/synergetics/",

  /**
   * Definition of the field — Synergetics 200.01 (abridged for lab use).
   */
  definition: {
    text:
      "A system of mensuration employing 60-degree vectorial coordination comprehensive to both physics and chemistry, and to both arithmetic and geometry, in rational whole numbers.",
    cite: "200.01",
  },

  quotes: [
    {
      text: "Size and time are synonymous. Frequency and size are the same phenomenon.",
      cite: "528.00",
    },
    {
      text: "Energy has shape.",
      cite: "223.80",
    },
    {
      text: "Synergy means behavior of whole systems unpredicted by the behavior of their parts taken separately.",
      cite: "101.01",
    },
    {
      text: "The tetrahedron is the simplest structural system in Universe.",
      cite: "620.03",
    },
    {
      text: "The vector equilibrium is the true zero reference of energy, the true zero of structural stability.",
      cite: "430.03 (paraphrase of VE zero reference)",
    },
  ],

  /**
   * Concentric hierarchy — tetravolume = 1 when the regular tetrahedron
   * of unit edge is volumetric unity. Canonical whole-number volumes
   * from Fuller's tetrahedral accounting (see Wikipedia summary of
   * Synergetics tables 982 / 986 and Sec. 223.66).
   */
  hierarchy: [
    {
      id: "a-mod",
      name: "A Quanta Module",
      short: "A",
      vol: 1 / 24,
      a: 1,
      b: 0,
      notes: "Asymmetric tetrahedral wedge; 24 fill the unit tetrahedron.",
      cite: "920.00–924.20",
      color: "#e8a0bf",
      prime: null,
    },
    {
      id: "b-mod",
      name: "B Quanta Module",
      short: "B",
      vol: 1 / 24,
      a: 0,
      b: 1,
      notes: "Complement of A; same volume, different edge lengths.",
      cite: "920.00–924.20",
      color: "#c084fc",
      prime: null,
    },
    {
      id: "mite",
      name: "MITE",
      short: "MITE",
      vol: 1 / 8,
      a: 2,
      b: 1,
      notes: "Minimum tetrahedron (space-filler): 2A + 1B.",
      cite: "950.00",
      color: "#a78bfa",
      prime: null,
    },
    {
      id: "tet",
      name: "Tetrahedron",
      short: "Tet",
      vol: 1,
      a: 24,
      b: 0,
      V: 4,
      E: 6,
      F: 4,
      prime: 1,
      shell: (F) => 2 * F * F + 2,
      notes: "Unit of volume; minimum system (4 event foci).",
      cite: "223.20, 620.03",
      color: "#60a5fa",
    },
    {
      id: "coupler",
      name: "Coupler",
      short: "Cpl",
      vol: 1,
      a: 16,
      b: 8,
      notes: "Oblate octahedron; allspace-filling pair half.",
      cite: "954.00",
      color: "#38bdf8",
      prime: null,
    },
    {
      id: "cube",
      name: "Duo-Tet Cube",
      short: "Cube",
      vol: 3,
      a: 48,
      b: 24,
      V: 8,
      E: 12,
      F: 6,
      prime: 3,
      shell: (F) => 6 * F * F + 2,
      notes: "Cube of edge √2 relative to unit tetra; volume 3.",
      cite: "223.20, 990.01",
      color: "#34d399",
    },
    {
      id: "octa",
      name: "Octahedron",
      short: "Octa",
      vol: 4,
      a: 48,
      b: 48,
      V: 6,
      E: 12,
      F: 8,
      prime: 2,
      shell: (F) => 4 * F * F + 2,
      notes: "Complements tetrahedra in the isotropic vector matrix.",
      cite: "223.20, 415.00",
      color: "#4ade80",
    },
    {
      id: "rt5",
      name: "Rhombic Triacontahedron",
      short: "RT",
      vol: 5,
      a: 0,
      b: 0,
      notes: "120 T-modules; radius ≈ unit vector.",
      cite: "986.400, 982.00",
      color: "#fbbf24",
      prime: null,
    },
    {
      id: "rd",
      name: "Rhombic Dodecahedron",
      short: "RD",
      vol: 6,
      a: 96,
      b: 48,
      V: 14,
      E: 24,
      F: 12,
      notes: "Domain of one sphere in CCP packing; dual of VE.",
      cite: "223.20, 426.00",
      color: "#fb923c",
      prime: null,
    },
    {
      id: "icosa",
      name: "Icosahedron",
      short: "Icosa",
      // 5 * sqrt(2) * phi^2  (edge = tetra edge)
      vol: 5 * Math.SQRT2 * Math.pow((1 + Math.sqrt(5)) / 2, 2),
      V: 12,
      E: 30,
      F: 20,
      prime: 5,
      shell: (F) => 10 * F * F + 2,
      notes: "Jitterbug phase between VE and octa; φ-related volume.",
      cite: "460.00, 905.00",
      color: "#f472b6",
    },
    {
      id: "ve",
      name: "Vector Equilibrium",
      short: "VE",
      vol: 20,
      a: 336,
      b: 144,
      V: 12,
      E: 24,
      F: 14, // 8 tri + 6 square
      prime: 5,
      shell: (F) => 10 * F * F + 2,
      notes: "Cuboctahedron of unit radius = unit edge. Zero reference of energy.",
      cite: "223.20, 430.00, 440.00",
      color: "#f87171",
    },
    {
      id: "cube2f",
      name: "2-Frequency Cube",
      short: "2F Cub",
      vol: 24,
      a: 384,
      b: 192,
      notes: "8 × cube volume 3; frequency scaling of volume as F³.",
      cite: "990.00",
      color: "#94a3b8",
      prime: null,
    },
  ],

  /**
   * Equation of Prime Number Inherency — Synergetics 223.03
   *   X = 2 N F² + 2
   * N ∈ {1,2,3,5}; F = edge frequency.
   */
  primeInherency: {
    formula: "X = 2 N F² + 2",
    cite: "223.03",
    N: {
      1: { name: "Tetrahedron", label: "N=1" },
      2: { name: "Octahedron", label: "N=2" },
      3: { name: "Cube (triangulated)", label: "N=3" },
      5: { name: "VE / Icosahedron", label: "N=5" },
    },
    relativeAbundance: {
      rule: "1 nonpolar vertex : 2 faces : 3 edges  (+ additive polar 2)",
      cite: "223.04, 223.18",
    },
  },

  /**
   * Closest-packed sphere shells of the vector equilibrium (12-around-1).
   * Outer layer: 10 F² + 2  (Sec. 223.21).
   * Cumulative nuclear totals for F-frequency VE:
   *   T(F) = (10 F³ + 15 F² + 11 F) / 3 + 1   wait — standard formula:
   *   For FCC/VE: layer L has 10 L² + 2 for L≥1, nucleus 1.
   *   Cumulative to frequency F: 1 + Σ_{L=1..F} (10 L² + 2)
   *     = 1 + 10·F(F+1)(2F+1)/6 + 2F
   *     = (10 F³ + 15 F² + 11 F)/3 + 1
   */
  spherePacking: {
    cite: "223.20–223.21, 415.00, 970.00",
    nucleus: 1,
    layer: (F) => (F <= 0 ? 0 : 10 * F * F + 2),
    cumulative: (F) => {
      if (F <= 0) return 1;
      // 1 + sum_{k=1..F} (10k²+2)
      return 1 + (10 * F * (F + 1) * (2 * F + 1)) / 6 + 2 * F;
    },
    // Classic sequence often cited: 1, 12, 42, 92, 162, 252, ...
    knownLayers: [0, 12, 42, 92, 162, 252, 362],
  },

  /**
   * Angular Topology — Synergetics 224.00
   *   nS + 720° = 360° × X
   * where S = sum of face angles at all vertexes, X = vertex count,
   * and 720° is the angular excess of the tetrahedron (one "tetravolume" of angle).
   */
  angularTopology: {
    formula: "nS + 720° = 360° × X",
    cite: "224.00",
    tetraAngleSum: 720, // degrees — sum of face angles of one tetrahedron
    systems: [
      { name: "Tetrahedron", X: 4, faceAngleSum: 720, excess: 720 },
      { name: "Octahedron", X: 6, faceAngleSum: 1440, excess: 720 },
      { name: "Icosahedron", X: 12, faceAngleSum: 3600, excess: 720 },
      { name: "Cube (triangulated)", X: 8, faceAngleSum: 2160, excess: 720 },
    ],
  },

  /**
   * Jitterbug transformation stages (VE contraction path).
   * Edge length constant; radius shrinks. Volumes relative to unit-edge VE = 20.
   * Stages from Synergetics 460 / jitterbug literature.
   */
  jitterbug: {
    cite: "460.00–465.00",
    stages: [
      { name: "Vector Equilibrium", t: 0.0, vol: 20, faces: "8△ + 6□" },
      { name: "Icosahedral phase", t: 0.35, vol: 18.51, faces: "20△" },
      { name: "Octahedron", t: 0.7, vol: 4, faces: "8△" },
      { name: "Tetrahedron (fold)", t: 1.0, vol: 1, faces: "4△" },
    ],
  },

  /**
   * IVM (Isotropic Vector Matrix) — 60° coordination.
   * Six edges of unit tetra appear as face-diagonals of the cube in XYZ.
   */
  ivm: {
    cite: "420.00, 986.203",
    angle: 60,
    note: "Linearly referenced to unit-vector edges of the regular tetrahedron.",
  },

  /**
   * Chord factors for unit-radius great-circle polyhedra (selected).
   * Chord factor = 2 sin(θ/2) for central angle θ (radians).
   * Used in geodesic / spherical polyhedra work (Synergetics Book IX / geodesics).
   */
  chordFactors: {
    cite: "905.00, geodesic tables",
    // central angles (deg) for common arcs on unit sphere
    arcs: [
      { name: "VE radial = edge", deg: 60, note: "radius = edge in VE" },
      { name: "Tetra dihedral chord", deg: 70.528779, note: "arccos(1/3)" },
      { name: "Octa face diagonal", deg: 90, note: "square face of VE" },
      { name: "Icosa long arc", deg: 63.434949, note: "arctan(2)" },
      { name: "Great circle half", deg: 180, note: "diameter" },
    ],
    chord: (deg) => 2 * Math.sin((deg * Math.PI) / 360),
  },

  /**
   * Two kinds of twoness — for dual-voice sonification.
   */
  twoness: {
    cite: "223.05–223.12",
    additive: "Polar vertexes of spin axis (+2)",
    multiplicative: "Insideness/outsideness, convex/concave (×2)",
  },
});

/** Helpers */
PRIMARY.volumeToMidi = function (vol, rootMidi = 48) {
  // Map tetravolume logarithmically onto pitch: each doubling of volume = +12 semitones / k
  // vol=1 → root; vol=20 → higher
  if (vol <= 0) return rootMidi;
  return rootMidi + 12 * (Math.log(vol) / Math.log(2)) * 0.55;
};

PRIMARY.shellSpheres = function (N, F) {
  return 2 * N * F * F + 2;
};

PRIMARY.phi = (1 + Math.sqrt(5)) / 2;
