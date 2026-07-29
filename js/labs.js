/**
 * Pure deterministic score compiler.
 *
 * The score is the single source of truth for both live Web Audio playback and
 * offline WAV rendering. No browser API is used here, so the model can be
 * tested directly with Node.
 */
(function exposeModel(root) {
  "use strict";

  const ARCHIVE =
    root.SYNERGETICS_ARCHIVE ||
    (typeof require === "function" ? require("./primary-sources.js") : null);

  const MODEL_VERSION = "2.0.0";
  const DEFAULTS = Object.freeze({
    rootHz: 108,
    bpm: 96,
    gain: 0.72,
    seed: 19751979,
    complexity: 2,
    maxFrequency: 5,
  });

  const LABS = Object.freeze([
    { id: "shells", title: "Closest-packed shells", color: "#d5bd83" },
    { id: "hierarchy", title: "Concentric hierarchy", color: "#c69b62" },
    { id: "counterpoint", title: "Editorial counterpoint", color: "#9fbca6" },
    { id: "frequency", title: "Prime-frequency field", color: "#d78a57" },
    { id: "web", title: "Web archaeology", color: "#8ca5a0" },
    { id: "modules", title: "Module workshop", color: "#bcc68e" },
    { id: "jitterbug", title: "Jitterbug coda", color: "#b77d52" },
    { id: "coda", title: "Historical synthesis", color: "#dfc994" },
  ]);

  const WAVEFORM_BY_PRIME = Object.freeze({
    1: "sine",
    2: "triangle",
    3: "square",
    5: "sawtooth",
  });

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function integer(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizedParams(input) {
    const params = input || {};
    return Object.freeze({
      rootHz: clamp(number(params.rootHz, DEFAULTS.rootHz), 40, 432),
      bpm: clamp(number(params.bpm, DEFAULTS.bpm), 30, 240),
      gain: clamp(number(params.gain, DEFAULTS.gain), 0, 1),
      seed: integer(params.seed, DEFAULTS.seed) >>> 0,
      complexity: clamp(integer(params.complexity, DEFAULTS.complexity), 1, 4),
      maxFrequency: clamp(integer(params.maxFrequency, DEFAULTS.maxFrequency), 2, 8),
    });
  }

  function hashSeed(seed, salt) {
    let hash = (seed >>> 0) ^ 0x9e3779b9;
    const text = String(salt);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function next() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function volumeRatio(volume) {
    return Math.pow(2, 0.45 * Math.log2(Math.max(volume, 1 / 96)));
  }

  function safeFrequency(rootHz, ratio) {
    return clamp(rootHz * ratio, 24, 12000);
  }

  function makeEvent(params, data) {
    const event = {
      id: data.id,
      time: Math.max(0, number(data.time, 0)),
      duration: clamp(number(data.duration, 0.25), 0.025, 16),
      frequency: safeFrequency(params.rootHz, number(data.ratio, 1)),
      waveform: data.waveform || "sine",
      gain: clamp(number(data.gain, 0.12), 0, 0.8),
      pan: clamp(number(data.pan, 0), -1, 1),
      filterHz: clamp(number(data.filterHz, 3200), 80, 16000),
      attack: clamp(number(data.attack, 0.008), 0.001, 2),
      release: clamp(number(data.release, 0.12), 0.005, 4),
      label: data.label || "",
      datum: data.datum || "",
      sourceId: data.sourceId || "syn-son",
      color: data.color || "#d5bd83",
      noiseSeed: hashSeed(params.seed, data.id),
    };
    return Object.freeze(event);
  }

  function finalize(labId, params, durationBeats, rawEvents, extra) {
    const events = rawEvents
      .map((event, index) =>
        event.id ? event : Object.assign({ id: `${labId}-${index}` }, event)
      )
      .map((event) => makeEvent(params, event))
      .sort((left, right) => left.time - right.time || left.frequency - right.frequency);

    const lab = LABS.find((entry) => entry.id === labId);
    const score = {
      modelVersion: MODEL_VERSION,
      mappingVersion: "syn-son-map/2",
      labId,
      title: lab ? lab.title : labId,
      durationBeats,
      params,
      events,
      sourceIds: [...new Set(events.map((event) => event.sourceId))],
      visual: Object.freeze(extra || {}),
    };
    score.fingerprint = fingerprintScore(score);
    return Object.freeze(score);
  }

  function shellScore(params) {
    const events = [];
    const rows = [];
    const count = params.maxFrequency;
    const cell = 16 / count;

    for (let frequency = 1; frequency <= count; frequency += 1) {
      const population = ARCHIVE.veShellPopulation(frequency);
      const cumulative = ARCHIVE.cumulativeVePopulation(frequency);
      const voices = Math.min(3 + params.complexity + frequency, 11);
      const ratio = Math.pow(2, Math.log2(population) / 8);
      rows.push({ frequency, population, cumulative });

      for (let voice = 0; voice < voices; voice += 1) {
        const phase = voices === 1 ? 0 : voice / (voices - 1);
        events.push({
          id: `shell-f${frequency}-v${voice}`,
          time: (frequency - 1) * cell + phase * cell * 0.72,
          duration: 0.14 + 0.04 * frequency,
          ratio: ratio * (1 + (voice % 3) * 0.125),
          waveform: frequency % 2 ? "triangle" : "sine",
          gain: 0.055 + 0.012 * params.complexity,
          pan: -0.88 + 1.76 * phase,
          filterHz: 900 + population * 9,
          label: `F=${frequency} shell`,
          datum: `X=${population} · cumulative=${cumulative}`,
          sourceId: "fuller-222",
          color: "#d5bd83",
        });
      }

      events.push({
        id: `shell-marker-${frequency}`,
        time: (frequency - 1) * cell,
        duration: 0.7,
        ratio: volumeRatio(frequency * frequency),
        waveform: "sine",
        gain: 0.12,
        pan: 0,
        filterHz: 1800 + frequency * 500,
        label: `Shell ${frequency} marker`,
        datum: `10×${frequency}²+2=${population}`,
        sourceId: "fuller-222",
        color: "#dfc994",
      });
    }

    return finalize("shells", params, 16, events, { rows });
  }

  function hierarchyScore(params) {
    const events = [];
    const rows = ARCHIVE.volumes;
    const step = 16 / rows.length;

    rows.forEach((item, index) => {
      const ratio = volumeRatio(item.volume);
      const time = index * step;
      events.push({
        id: `hierarchy-${item.id}`,
        time,
        duration: Math.min(1.35, step * 0.82),
        ratio,
        waveform: index % 3 === 0 ? "triangle" : "sine",
        gain: 0.12,
        pan: -0.75 + (1.5 * index) / Math.max(1, rows.length - 1),
        filterHz: 1200 + index * 500,
        label: item.name,
        datum: `tetravolume ${fractionLabel(item.volume)}`,
        sourceId: item.id === "a" || item.id === "mite" ? "fuller-920" : "fuller-223",
        color: item.color,
      });
      if (params.complexity >= 2 && item.volume >= 1) {
        events.push({
          id: `hierarchy-${item.id}-fifth`,
          time: time + 0.08,
          duration: Math.min(1.1, step * 0.7),
          ratio: ratio * 1.5,
          waveform: "sine",
          gain: 0.055,
          pan: 0.6,
          filterHz: 2800,
          label: `${item.name} fifth`,
          datum: "derived harmonic support",
          sourceId: "syn-son",
          color: item.color,
        });
      }
      if (params.complexity >= 4 && item.volume >= 3) {
        events.push({
          id: `hierarchy-${item.id}-octave`,
          time: time + 0.16,
          duration: 0.72,
          ratio: ratio * 2,
          waveform: "triangle",
          gain: 0.035,
          pan: -0.25,
          filterHz: 4200,
          label: `${item.name} octave`,
          datum: "derived register marker",
          sourceId: "syn-son",
          color: item.color,
        });
      }
    });

    return finalize("hierarchy", params, 16, events, { rows });
  }

  function counterpointScore(params) {
    const events = [];
    const random = mulberry32(hashSeed(params.seed, "counterpoint"));
    const exchanges = 8 + params.complexity * 2;
    const step = 16 / exchanges;

    for (let index = 0; index < exchanges; index += 1) {
      const leftRatio = 1 + (index % 4) * 0.125;
      const rightRatio = 1.5 + ((index + 2) % 5) * 0.1;
      const humanOffset = (random() - 0.5) * 0.018;
      events.push({
        id: `counterpoint-fuller-${index}`,
        time: index * step,
        duration: step * 0.55,
        ratio: leftRatio,
        waveform: "triangle",
        gain: 0.095,
        pan: -0.78,
        filterHz: 1700 + index * 90,
        label: "Fuller strand",
        datum: `exchange ${index + 1}`,
        sourceId: "fuller-everything-i-know",
        color: "#c69b62",
      });
      events.push({
        id: `counterpoint-applewhite-${index}`,
        time: index * step + step * 0.43 + humanOffset,
        duration: step * 0.48,
        ratio: rightRatio,
        waveform: "sine",
        gain: 0.09,
        pan: 0.78,
        filterHz: 2300 + index * 70,
        label: "Applewhite strand",
        datum: `definition / note ${index + 1}`,
        sourceId: "applewhite-cosmic-fishing",
        color: "#9fbca6",
      });
      if (index % 4 === 3) {
        events.push({
          id: `counterpoint-ledger-${index}`,
          time: index * step + step * 0.82,
          duration: step * 0.9,
          ratio: 2,
          waveform: "sine",
          gain: 0.13,
          pan: 0,
          filterHz: 3600,
          label: "Shared ledger cadence",
          datum: "interpretive convergence marker",
          sourceId: "syn-son",
          color: "#dfc994",
        });
      }
    }

    return finalize("counterpoint", params, 16, events, { exchanges });
  }

  function frequencyScore(params) {
    const events = [];
    const rows = [];
    const primes = [1, 2, 3, 5];
    const usableF = Math.min(params.maxFrequency, 4 + (params.complexity > 2 ? 1 : 0));
    const total = primes.length * usableF;
    const step = 16 / total;
    let index = 0;

    primes.forEach((prime) => {
      for (let frequency = 1; frequency <= usableF; frequency += 1) {
        const population = ARCHIVE.shellPopulation(frequency, prime);
        const ratio = Math.pow(2, Math.log2(population) / 9) * (1 + prime / 20);
        const time = index * step;
        rows.push({ prime, frequency, population });
        events.push({
          id: `prime-${prime}-f${frequency}`,
          time,
          duration: step * 0.72,
          ratio,
          waveform: WAVEFORM_BY_PRIME[prime],
          gain: prime === 3 ? 0.05 : 0.075,
          pan: -0.9 + (1.8 * primes.indexOf(prime)) / (primes.length - 1),
          filterHz: 700 + population * 55,
          label: `N=${prime} · F=${frequency}`,
          datum: `X=2×${prime}×${frequency}²+2=${population}`,
          sourceId: "fuller-223",
          color: prime === 1 ? "#d5bd83" : prime === 2 ? "#9fbca6" : prime === 3 ? "#b77d52" : "#d78a57",
        });
        if (params.complexity >= 3) {
          events.push({
            id: `prime-${prime}-f${frequency}-pole`,
            time: time + step * 0.32,
            duration: 0.07,
            ratio: ratio * 2,
            waveform: "sine",
            gain: 0.045,
            pan: index % 2 ? 0.95 : -0.95,
            filterHz: 5400,
            label: "Additive-two pole",
            datum: "+2 marker",
            sourceId: "fuller-223",
            color: "#dfc994",
          });
        }
        index += 1;
      }
    });

    return finalize("frequency", params, 16, events, { rows });
  }

  function webScore(params) {
    const sourceNodes = [
      "fuller-222",
      "fuller-223",
      "fuller-224",
      "fuller-460",
      "fuller-528",
      "fuller-920",
      "bfi-synergetics",
      "applewhite-cosmic-fishing",
      "rwgray-web-edition",
      "grunch-modules",
      "school-of-tomorrow",
      "synergetics-viz",
    ];
    const random = mulberry32(hashSeed(params.seed, "web"));
    const events = [];
    const links = [];
    const step = 16 / sourceNodes.length;

    sourceNodes.forEach((sourceId, index) => {
      const target = (index + 1 + Math.floor(random() * 4)) % sourceNodes.length;
      const ratio = 1 + (index % 7) * 0.18;
      links.push([index, target]);
      events.push({
        id: `web-node-${index}`,
        time: index * step,
        duration: 0.16 + params.complexity * 0.025,
        ratio,
        waveform: index < 6 ? "sine" : "triangle",
        gain: 0.075,
        pan: Math.sin((index / sourceNodes.length) * Math.PI * 2) * 0.88,
        filterHz: 1000 + index * 360,
        label: ARCHIVE.sourceById(sourceId).title,
        datum: `archive node ${index + 1}`,
        sourceId,
        color: index < 6 ? "#d5bd83" : "#8ca5a0",
      });
      events.push({
        id: `web-link-${index}-${target}`,
        time: index * step + step * 0.48,
        duration: step * 0.42,
        ratio: ratio * (1 + target / 18),
        waveform: "sine",
        gain: 0.045,
        pan: Math.cos((target / sourceNodes.length) * Math.PI * 2) * 0.82,
        filterHz: 2800,
        label: "Cross-link",
        datum: `${index + 1} → ${target + 1}`,
        sourceId: "rwgray-web-edition",
        color: "#9fbca6",
      });
    });

    return finalize("web", params, 16, events, { sourceNodes, links });
  }

  function modulesScore(params) {
    const events = [];
    const ticks = 24 * (params.complexity >= 4 ? 2 : 1);
    const step = 16 / ticks;
    const rows = [];

    for (let index = 0; index < ticks; index += 1) {
      const isB = index % 3 === 2;
      const moduleIndex = (index % 24) + 1;
      rows.push({ index, module: isB ? "B" : "A", moduleIndex });
      events.push({
        id: `module-${index}-${isB ? "b" : "a"}`,
        time: index * step,
        duration: Math.max(0.035, step * 0.32),
        ratio: isB ? 2.4 : 2,
        waveform: isB ? "square" : "triangle",
        gain: isB ? 0.04 : 0.055,
        pan: isB ? 0.7 : -0.7,
        filterHz: isB ? 2100 : 3400,
        label: `${isB ? "B" : "A"} module ${moduleIndex}`,
        datum: moduleIndex === 24 ? "unit-tetra cadence" : "schematic assembly tick",
        sourceId: "fuller-920",
        color: isB ? "#9fbca6" : "#bcc68e",
      });
      if (moduleIndex === 24) {
        [1, 1.25, 1.5, 2].forEach((ratio, chordIndex) => {
          events.push({
            id: `module-cadence-${index}-${chordIndex}`,
            time: index * step,
            duration: 1.25,
            ratio,
            waveform: "sine",
            gain: 0.055,
            pan: -0.6 + chordIndex * 0.4,
            filterHz: 3200,
            label: "24-module cadence",
            datum: "24 A modules → unit tetrahedron",
            sourceId: "fuller-920",
            color: "#dfc994",
          });
        });
      }
    }

    return finalize("modules", params, 16, events, { rows, ticks });
  }

  function jitterbugScore(params) {
    const events = [];
    const stations = [];
    const steps = 12 + params.complexity * 4;
    const cell = 16 / steps;

    for (let index = 0; index < steps; index += 1) {
      const phase = index / Math.max(1, steps - 1);
      const volume = 20 * Math.pow(1 / 20, phase);
      const station =
        phase < 0.12 ? "VE" : phase > 0.88 ? "tetra station" : phase > 0.58 && phase < 0.72 ? "octa station" : "contraction";
      stations.push({ phase, volume, station });
      events.push({
        id: `jitterbug-${index}`,
        time: index * cell,
        duration: cell * 1.5,
        ratio: volumeRatio(volume),
        waveform: index % 2 ? "triangle" : "sine",
        gain: 0.065,
        pan: Math.sin(phase * Math.PI * 2) * 0.72,
        filterHz: 700 + (1 - phase) * 5600,
        attack: 0.03,
        release: 0.24,
        label: station,
        datum: `phase ${phase.toFixed(2)} · mapping volume ${volume.toFixed(3)}`,
        sourceId: "fuller-460",
        color: "#b77d52",
      });
      if (station !== "contraction") {
        events.push({
          id: `jitterbug-station-${index}`,
          time: index * cell,
          duration: 0.55,
          ratio: station === "VE" ? 2 : station === "octa station" ? 1.5 : 1,
          waveform: "sine",
          gain: 0.06,
          pan: 0,
          filterHz: 4200,
          label: `${station} marker`,
          datum: "named station; curve remains interpretive",
          sourceId: "syn-son",
          color: "#dfc994",
        });
      }
    }

    return finalize("jitterbug", params, 16, events, { stations });
  }

  function codaScore(params) {
    const movements = [
      shellScore(params),
      hierarchyScore(params),
      counterpointScore(params),
      frequencyScore(params),
      webScore(params),
      modulesScore(params),
      jitterbugScore(params),
    ];
    const segmentLength = 4;
    const events = [];
    const segments = [];

    movements.forEach((movement, movementIndex) => {
      const sourceLength = movement.durationBeats;
      const scale = segmentLength / sourceLength;
      segments.push({
        labId: movement.labId,
        title: movement.title,
        start: movementIndex * segmentLength,
      });
      movement.events.forEach((event, eventIndex) => {
        if (eventIndex % Math.max(1, 5 - params.complexity) !== 0) return;
        events.push({
          id: `coda-${movement.labId}-${eventIndex}`,
          time: movementIndex * segmentLength + event.time * scale,
          duration: Math.max(0.04, event.duration * scale),
          ratio: event.frequency / params.rootHz,
          waveform: event.waveform,
          gain: event.gain * 0.72,
          pan: event.pan,
          filterHz: event.filterHz,
          attack: event.attack,
          release: event.release,
          label: `${movement.title}: ${event.label}`,
          datum: event.datum,
          sourceId: event.sourceId,
          color: event.color,
        });
      });
    });

    [0, 7, 14, 21, 28].forEach((time, index) => {
      events.push({
        id: `coda-spine-${index}`,
        time,
        duration: 2.8,
        ratio: [1, 1.25, 1.5, 2, 1][index],
        waveform: "sine",
        gain: 0.07,
        pan: 0,
        filterHz: 1800,
        label: "Historical spine",
        datum: "contemporary continuity marker",
        sourceId: "syn-son",
        color: "#dfc994",
      });
    });

    return finalize("coda", params, 32, events, { segments });
  }

  const COMPILERS = Object.freeze({
    shells: shellScore,
    hierarchy: hierarchyScore,
    counterpoint: counterpointScore,
    frequency: frequencyScore,
    web: webScore,
    modules: modulesScore,
    jitterbug: jitterbugScore,
    coda: codaScore,
  });

  function compileScore(labId, inputParams) {
    const params = normalizedParams(inputParams);
    const compiler = COMPILERS[labId] || COMPILERS.shells;
    return compiler(params);
  }

  function fractionLabel(value) {
    if (value > 0 && value < 1) {
      const denominator = Math.round(1 / value);
      if (Math.abs(1 / denominator - value) < 1e-10) return `1/${denominator}`;
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }

  function stableSerialize(value) {
    if (Array.isArray(value)) {
      return `[${value.map(stableSerialize).join(",")}]`;
    }
    if (value && typeof value === "object") {
      return `{${Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
        .join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function fnv1a(text) {
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function fingerprintScore(score) {
    const portable = {
      modelVersion: score.modelVersion,
      labId: score.labId,
      durationBeats: score.durationBeats,
      params: score.params,
      events: score.events.map((event) => ({
        id: event.id,
        time: event.time,
        duration: event.duration,
        frequency: event.frequency,
        waveform: event.waveform,
        gain: event.gain,
        pan: event.pan,
        filterHz: event.filterHz,
        sourceId: event.sourceId,
      })),
    };
    return `fnv1a-${fnv1a(stableSerialize(portable))}`;
  }

  function createManifest(score, renderSettings) {
    const settings = renderSettings || {};
    const era = ARCHIVE.eras.find((entry) => entry.labId === score.labId) || null;
    return {
      schema: "https://qsolkcb.github.io/syn-son/schema/render-manifest-v1.json",
      application: "Syn-Son · History of Sonification in Synergetics",
      applicationVersion: MODEL_VERSION,
      mappingVersion: score.mappingVersion,
      generatedAt: new Date().toISOString(),
      deterministicIdentity: {
        scoreFingerprint: score.fingerprint,
        seed: score.params.seed,
        note: "generatedAt is provenance metadata and is excluded from the deterministic score fingerprint",
      },
      movement: {
        labId: score.labId,
        title: score.title,
        historicalEra: era ? era.range : null,
      },
      parameters: score.params,
      render: {
        bars: integer(settings.bars, 8),
        sampleRate: integer(settings.sampleRate, 48000),
        channels: 2,
        format: "PCM WAV · signed 16-bit little-endian",
      },
      sourceIds: score.sourceIds,
      sources: score.sourceIds
        .map((id) => ARCHIVE.sourceById(id))
        .filter(Boolean)
        .map((source) => ({
          id: source.id,
          kind: source.kind,
          title: source.title,
          url: source.url,
        })),
      boundary:
        "The source quantities are historical; the audible mappings, declared 432 Hz reference, synthesis, and WAV are contemporary QSOL-IMC interpretations.",
    };
  }

  const API = Object.freeze({
    version: MODEL_VERSION,
    defaults: DEFAULTS,
    labs: LABS,
    compileScore,
    normalizedParams,
    createManifest,
    fingerprintScore,
    stableSerialize,
    fractionLabel,
  });

  root.SynSonModel = API;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
})(typeof window !== "undefined" ? window : globalThis);
