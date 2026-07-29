/**
 * Historical and provenance ledger for Syn-Son.
 *
 * This file intentionally separates:
 *   1. statements present in, or bibliographic facts about, historical sources;
 *   2. later web preservation and teaching lineages; and
 *   3. the sonification mappings introduced by this project.
 *
 * It is a classic script rather than an ES module so the complete application
 * can be opened from file:// without a server, build step, fetch(), or CDN.
 */
(function exposeArchive(root) {
  "use strict";

  const SOURCE_KINDS = Object.freeze({
    primary: {
      label: "Primary text",
      description: "Fuller/Applewhite text or an archival Fuller lecture transcript.",
    },
    institutional: {
      label: "Institutional record",
      description: "Bibliographic or historical context from the Buckminster Fuller Institute or Estate.",
    },
    legacy: {
      label: "Legacy web",
      description: "A historically useful independent teaching page preserved as web archaeology.",
    },
    contemporary: {
      label: "Contemporary project",
      description: "A recent QSOL-IMC implementation or documentation layer.",
    },
    derived: {
      label: "Derived mapping",
      description: "An explicit interpretive choice made by this sonification project.",
    },
  });

  const SOURCES = Object.freeze([
    {
      id: "fuller-222",
      kind: "primary",
      year: "1975 / web ed. 1997",
      title: "Synergetics §§222.00–222.43 · closest-packed shells",
      creator: "R. Buckminster Fuller with E.J. Applewhite",
      url: "https://www.rwgrayprojects.com/synergetics/s02/p2000.html",
      archiveUrl: "https://web.archive.org/web/*/http://www.rwgrayprojects.com/synergetics/s02/p2000.html",
      note: "Defines 10F² + 2 for VE shell populations and records Fuller's own account that he found the relationship in the late 1930s and published it in 1944.",
    },
    {
      id: "fuller-223",
      kind: "primary",
      year: "1975 / web ed. 1997",
      title: "Synergetics §§223.00–223.80 · prime inherency and energy shape",
      creator: "R. Buckminster Fuller with E.J. Applewhite",
      url: "https://www.rwgrayprojects.com/synergetics/s02/p2300.html",
      archiveUrl: "https://web.archive.org/web/*/http://www.rwgrayprojects.com/synergetics/s02/p2300.html",
      note: "Contains X = 2NF² + 2, the two kinds of twoness, the primary-system shell equations, the concentric hierarchy, and the heading “Energy Has Shape.”",
    },
    {
      id: "fuller-224",
      kind: "primary",
      year: "1975 / web ed. 1997",
      title: "Synergetics §224 · angular topology",
      creator: "R. Buckminster Fuller with E.J. Applewhite",
      url: "https://www.rwgrayprojects.com/synergetics/s02/p2400.html",
      archiveUrl: "https://web.archive.org/web/*/http://www.rwgrayprojects.com/synergetics/s02/p2400.html",
      note: "Source trail for the constant 720-degree angular excess used by the Angular Topology movement.",
    },
    {
      id: "fuller-460",
      kind: "primary",
      year: "1975 / 1979",
      title: "Synergetics §§460–465 · jitterbug transformation",
      creator: "R. Buckminster Fuller with E.J. Applewhite",
      url: "https://www.rwgrayprojects.com/synergetics/s04/p6000.html",
      archiveUrl: "https://web.archive.org/web/*/http://www.rwgrayprojects.com/synergetics/s04/p6000.html",
      note: "Historical source family for the vector-equilibrium contraction commonly called the jitterbug.",
    },
    {
      id: "fuller-528",
      kind: "primary",
      year: "1975 / web ed. 1997",
      title: "Synergetics §528.03 · size, time, and frequency",
      creator: "R. Buckminster Fuller with E.J. Applewhite",
      url: "https://www.rwgrayprojects.com/synergetics/s05/p2800.html",
      archiveUrl: "https://web.archive.org/web/*/http://www.rwgrayprojects.com/synergetics/s05/p2800.html",
      note: "The primary-text anchor for Fuller's statement that size and time are synonymous and that frequency and size are the same phenomenon.",
    },
    {
      id: "fuller-920",
      kind: "primary",
      year: "1979 / web ed. 1997",
      title: "Synergetics §§910–924 · A/B quantum modules",
      creator: "R. Buckminster Fuller with E.J. Applewhite",
      url: "https://www.rwgrayprojects.com/synergetics/s09/p0570.html",
      archiveUrl: "https://web.archive.org/web/*/http://www.rwgrayprojects.com/synergetics/s09/p0570.html",
      note: "Primary-text entry point for A and B modules and the tetrahedral accounting developed in Book IX.",
    },
    {
      id: "bfi-synergetics",
      kind: "institutional",
      year: "1975 / 1979",
      title: "Synergetics · Buckminster Fuller Institute overview",
      creator: "Buckminster Fuller Institute",
      url: "https://www.bfi.org/about-fuller/big-ideas/synergetics/",
      archiveUrl: null,
      note: "Confirms the two Macmillan volumes, their 1975 and 1979 publication dates, E.J. Applewhite's collaboration, Arthur Loeb's preface, and the later web edition.",
    },
    {
      id: "applewhite-cosmic-fishing",
      kind: "institutional",
      year: "1977",
      title: "Cosmic Fishing · an account of writing Synergetics",
      creator: "E.J. Applewhite",
      url: "https://www.bfi.org/resource/cosmic-fishing-an-account-of-writing-synergetics-with-buckminster-fuller/",
      archiveUrl: null,
      note: "Bibliographic record for Applewhite's account of the collaboration. The stereo counterpoint in this lab is interpretive; it is not an audio reconstruction of the book.",
    },
    {
      id: "fuller-everything-i-know",
      kind: "primary",
      year: "1975 lectures",
      title: "Everything I Know · Section 11",
      creator: "R. Buckminster Fuller",
      url: "https://www.bfi.org/about-fuller/everything-i-know/section-11/",
      archiveUrl: null,
      note: "Archival lecture transcript in which Fuller discusses Synergetics, geodesic frequency, Applewhite's minute-by-minute notes, and the arrival of the first printed book.",
    },
    {
      id: "rwgray-web-edition",
      kind: "legacy",
      year: "1997–present",
      title: "R.W. Gray Synergetics web edition",
      creator: "R.W. Gray Projects / Fuller Estate permission",
      url: "https://www.rwgrayprojects.com/synergetics/",
      archiveUrl: "https://web.archive.org/web/*/http://www.rwgrayprojects.com/synergetics/",
      note: "The linked edition is preserved as a navigable historical object. Syn-Son links to it and does not mirror the copyrighted prose.",
    },
    {
      id: "grunch-modules",
      kind: "legacy",
      year: "legacy web",
      title: "Synergetics modules · preserved teaching page",
      creator: "Kirby Urner",
      url: "https://www.grunch.net/synergetics/modules.html",
      archiveUrl: "https://web.archive.org/web/*/http://www.grunch.net/synergetics/modules.html",
      note: "Independent pedagogical lineage. Its age and presentation are preserved as provenance rather than silently modernized into a primary source.",
    },
    {
      id: "school-of-tomorrow",
      kind: "legacy",
      year: "ongoing",
      title: "School of Tomorrow repository",
      creator: "4dsolutions contributors",
      url: "https://github.com/4dsolutions/School_of_Tomorrow",
      archiveUrl: null,
      note: "Independent educational code and notebooks in the wider Synergetics teaching lineage.",
    },
    {
      id: "synergetics-viz",
      kind: "contemporary",
      year: "2026",
      title: "Synergetics Presenter Lab · Hypertext Coda",
      creator: "Trent Slade / QSOL-IMC",
      url: "https://qsolkcb.github.io/synergetics-viz/",
      archiveUrl: "https://github.com/QSOLKCB/synergetics-viz",
      note: "The visual companion and preservation model for source drawers, lore trails, namespace boundaries, deep links, and browser-native presentation.",
    },
    {
      id: "syn-son",
      kind: "derived",
      year: "2026",
      title: "Syn-Son · History of Sonification in Synergetics",
      creator: "Trent Slade / QSOL-IMC",
      url: "https://github.com/QSOLKCB/syn-son",
      archiveUrl: null,
      note: "This project. All audible mappings are declared contemporary interpretations unless a source explicitly says otherwise.",
    },
  ]);

  const ERAS = Object.freeze([
    {
      id: "shell-discovery",
      range: "late 1930s–1944",
      shortYear: "1930s–44",
      title: "Counting shells before digital sound",
      subtitle: "The formula becomes a score only much later",
      labId: "shells",
      sourceIds: ["fuller-222", "fuller-everything-i-know"],
      record:
        "In §222.43 Fuller says he discovered the closest-packed shell relationship in the late 1930s and published it in 1944. The documented object is a geometric counting rule, not a musical composition.",
      audible:
        "Each shell number becomes event density, pitch height, and a spatial ring. Counts remain visible while the audible density is scaled to avoid hundreds of simultaneous tones.",
      boundary:
        "X = 10F² + 2 is source material. Turning X into rhythm, pitch, stereo position, and timbre is a 2026 Syn-Son mapping.",
      formula: "X = 10F² + 2",
      quote: null,
    },
    {
      id: "synergetics-one",
      range: "1975",
      shortYear: "1975",
      title: "Synergetics enters print",
      subtitle: "A tetrahedral unit of volume becomes audible hierarchy",
      labId: "hierarchy",
      sourceIds: ["bfi-synergetics", "fuller-223", "fuller-everything-i-know"],
      record:
        "Macmillan published Synergetics in 1975 after Fuller's long development and close collaboration with E.J. Applewhite. The concentric hierarchy accounts volumes relative to a unit tetrahedron.",
      audible:
        "Tetravolume is mapped logarithmically to pitch. Small modules sit below the reference; tetrahedron, cube, octahedron, rhombic dodecahedron, and vector equilibrium rise through the register.",
      boundary:
        "The volumes and section trail are historical. The logarithmic pitch law and declared 108 Hz root (one quarter of 432 Hz) are project choices, not Fuller-derived tuning.",
      formula: "tet = 1 · cube = 3 · octa = 4 · VE = 20",
      quote: "Energy has shape.",
    },
    {
      id: "editorial-counterpoint",
      range: "1977",
      shortYear: "1977",
      title: "Applewhite records the collaboration",
      subtitle: "Cosmic Fishing as historical counterpoint",
      labId: "counterpoint",
      sourceIds: ["applewhite-cosmic-fishing", "bfi-synergetics", "fuller-everything-i-know"],
      record:
        "E.J. Applewhite published Cosmic Fishing, an account of writing Synergetics with Fuller. Fuller also credited Applewhite's detailed notes and insistence on cleaner definitions in his 1975 lecture series.",
      audible:
        "Two stereo voices exchange a call-and-response pattern. A shared center tone appears whenever the strands reach a common structural count.",
      boundary:
        "The collaboration is historical. The left/right musical dialogue is an interpretive memorial device, not a reconstruction of either person's voice.",
      formula: "two voices · one shared ledger",
      quote: null,
    },
    {
      id: "synergetics-two",
      range: "1979",
      shortYear: "1979",
      title: "Synergetics 2 expands the field",
      subtitle: "Frequency, twoness, angular topology, and transformation",
      labId: "frequency",
      sourceIds: ["bfi-synergetics", "fuller-223", "fuller-224", "fuller-528"],
      record:
        "Synergetics 2 appeared in 1979. Across the combined work, “frequency” often names modular subdivision or shell count rather than acoustic frequency.",
      audible:
        "Prime N selects a timbre family, edge frequency F advances the rhythm, and X = 2NF² + 2 selects event density and pitch contour.",
      boundary:
        "The application never silently equates Fuller's geometric frequency with Hertz. The conversion to audible frequency is displayed as a separate mapping.",
      formula: "X = 2NF² + 2 · N ∈ {1,2,3,5}",
      quote: "Size and time are synonymous. Frequency and size are the same phenomenon.",
    },
    {
      id: "web-edition",
      range: "1997–present",
      shortYear: "1997→",
      title: "The books become navigable web archaeology",
      subtitle: "Sections, diagrams, hyperlinks, and fragile continuity",
      labId: "web",
      sourceIds: ["rwgray-web-edition", "bfi-synergetics"],
      record:
        "A posthumous web edition made the two volumes addressable by section and hyperlink. It is historically valuable precisely as a legacy web object.",
      audible:
        "Section nodes pulse across a stereo network. Cross-links sound as short connecting tones; archival gaps remain rests rather than being invented away.",
      boundary:
        "Syn-Son does not scrape, mirror, or republish the books. It keeps a compact citation ledger and sends readers back to the preserved edition.",
      formula: "section → node · cross-link → interval · gap → rest",
      quote: null,
    },
    {
      id: "teaching-lineage",
      range: "legacy web era",
      shortYear: "web lore",
      title: "Independent teaching lineages",
      subtitle: "Modules, Quadrays, notebooks, and source caution",
      labId: "modules",
      sourceIds: ["fuller-920", "grunch-modules", "school-of-tomorrow"],
      record:
        "Independent teachers extended Synergetics through module pages, Quadray explanations, notebooks, models, and code. These are lineages of interpretation, not substitutes for primary definitions.",
      audible:
        "A and B modules form distinct ticks and pans. Larger assemblies arrive as cadence markers. Unverified module relations stay muted or explicitly labelled provisional.",
      boundary:
        "No exact T/E/S/K mesh is invented. The visual tiles are schematic and the audio encodes documented counts or declared teaching relationships only.",
      formula: "24 A → unit tetrahedron · A/B voices remain distinct",
      quote: null,
    },
    {
      id: "hypertext-coda",
      range: "2026",
      shortYear: "2026 viz",
      title: "The Hypertext Coda preservation model",
      subtitle: "Visual scenes gain lore trails and provenance drawers",
      labId: "jitterbug",
      sourceIds: ["synergetics-viz", "fuller-460"],
      record:
        "The Synergetics Presenter Lab joined live geometry to historical context, source-status labels, deep links, capture, and independent-work boundaries.",
      audible:
        "The jitterbug path becomes a continuous pitch and brightness morph while fixed cadences mark named structural stations.",
      boundary:
        "The historical transformation is source-linked. The interpolation curve, tempo, tuning, and sound design are contemporary and schematic.",
      formula: "VE → contraction → octa/tet station markers",
      quote: null,
    },
    {
      id: "syn-son-2026",
      range: "2026",
      shortYear: "2026 audio",
      title: "Syn-Son makes the boundary audible",
      subtitle: "One deterministic score drives Web Audio and WAV",
      labId: "coda",
      sourceIds: ["syn-son", "synergetics-viz", "fuller-222", "fuller-223", "fuller-528"],
      record:
        "Syn-Son is a new, independent QSOL-IMC instrument. Its historical claim is modest: the source trail existed; this particular audible mapping did not.",
      audible:
        "A deterministic coda combines shell counts, hierarchy intervals, editorial counterpoint, modules, web-link pulses, and transformation markers.",
      boundary:
        "Every WAV includes a downloadable manifest identifying the source IDs, parameters, mapping version, seed, and declared 432 Hz reference.",
      formula: "same event score → live Web Audio + offline WAV",
      quote: null,
    },
  ]);

  const MAPPINGS = Object.freeze([
    {
      sourceQuantity: "Tetravolume",
      audioParameter: "Pitch ratio",
      rule: "ratio = 2^(0.45 × log₂(volume))",
      status: "derived",
      sourceIds: ["fuller-223"],
    },
    {
      sourceQuantity: "Edge frequency F",
      audioParameter: "Rhythmic position",
      rule: "successive F values advance equal beat cells",
      status: "derived",
      sourceIds: ["fuller-222", "fuller-223"],
    },
    {
      sourceQuantity: "Shell population X",
      audioParameter: "Density and register",
      rule: "density is scaled; log₂(X) shapes pitch",
      status: "derived",
      sourceIds: ["fuller-222"],
    },
    {
      sourceQuantity: "Prime family N",
      audioParameter: "Oscillator family",
      rule: "1 sine · 2 triangle · 3 square · 5 sawtooth",
      status: "derived",
      sourceIds: ["fuller-223"],
    },
    {
      sourceQuantity: "Additive / balanced twoness",
      audioParameter: "Stereo poles / shared center",
      rule: "opposed pans resolve to a center cadence",
      status: "derived",
      sourceIds: ["fuller-223"],
    },
    {
      sourceQuantity: "A / B module identity",
      audioParameter: "Tick timbre and pan",
      rule: "A left triangle · B right square",
      status: "derived",
      sourceIds: ["fuller-920", "grunch-modules"],
    },
    {
      sourceQuantity: "Web section link",
      audioParameter: "Short connecting interval",
      rule: "node index sets time; linked node sets pitch",
      status: "derived",
      sourceIds: ["rwgray-web-edition"],
    },
    {
      sourceQuantity: "Reference tuning",
      audioParameter: "Root frequency",
      rule: "108 Hz default = declared quarter of 432 Hz",
      status: "derived",
      sourceIds: ["syn-son"],
    },
  ]);

  const VOLUMES = Object.freeze([
    { id: "a", name: "A module", volume: 1 / 24, cite: "Book IX", color: "#a9b8a0" },
    { id: "mite", name: "MITE", volume: 1 / 8, cite: "§950 family", color: "#bcc68e" },
    { id: "tet", name: "Tetrahedron", volume: 1, cite: "§§221–223", color: "#d5bd83" },
    { id: "cube", name: "Duo-tet cube", volume: 3, cite: "§223.20", color: "#c69b62" },
    { id: "octa", name: "Octahedron", volume: 4, cite: "§223.20", color: "#b77d52" },
    { id: "rt", name: "Rhombic triacontahedron", volume: 5, cite: "Book IX", color: "#9fbca6" },
    { id: "rd", name: "Rhombic dodecahedron", volume: 6, cite: "hierarchy tables", color: "#7fa39d" },
    { id: "ve", name: "Vector equilibrium", volume: 20, cite: "§222.30", color: "#d78a57" },
  ]);

  function sourceById(id) {
    return SOURCES.find((source) => source.id === id) || null;
  }

  function eraById(id) {
    return ERAS.find((era) => era.id === id) || null;
  }

  const ARCHIVE = Object.freeze({
    version: "2.0.0",
    title: "History of Sonification in Synergetics",
    sourceKinds: SOURCE_KINDS,
    sources: SOURCES,
    eras: ERAS,
    mappings: MAPPINGS,
    volumes: VOLUMES,
    phi: (1 + Math.sqrt(5)) / 2,
    sourceById,
    eraById,
    shellPopulation: (frequency, prime = 5) => 2 * prime * frequency * frequency + 2,
    veShellPopulation: (frequency) => 10 * frequency * frequency + 2,
    cumulativeVePopulation: (frequency) => {
      if (frequency <= 0) return 1;
      return 1 + (10 * frequency * (frequency + 1) * (2 * frequency + 1)) / 6 + 2 * frequency;
    },
  });

  root.SYNERGETICS_ARCHIVE = ARCHIVE;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ARCHIVE;
  }
})(typeof window !== "undefined" ? window : globalThis);
