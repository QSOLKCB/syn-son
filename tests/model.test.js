"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const ARCHIVE = require(path.join(projectRoot, "js", "primary-sources.js"));
const MODEL = require(path.join(projectRoot, "js", "labs.js"));
const AUDIO = require(path.join(projectRoot, "js", "audio.js"));

function test(name, operation) {
  try {
    operation();
    process.stdout.write(`✓ ${name}\n`);
  } catch (error) {
    process.stderr.write(`✗ ${name}\n`);
    throw error;
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

test("VE shell populations reproduce 12, 42, 92, 162, 252", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5].map(ARCHIVE.veShellPopulation),
    [12, 42, 92, 162, 252]
  );
});

test("cumulative VE populations include the nucleus", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4].map(ARCHIVE.cumulativeVePopulation),
    [1, 13, 55, 147, 309]
  );
});

test("prime inherency equation is implemented for all declared N families", () => {
  const expectedAtF3 = new Map([
    [1, 20],
    [2, 38],
    [3, 56],
    [5, 92],
  ]);
  expectedAtF3.forEach((expected, prime) => {
    assert.equal(ARCHIVE.shellPopulation(3, prime), expected);
  });
});

test("every historical era has a resolvable source trail and boundary", () => {
  assert.equal(ARCHIVE.eras.length, 8);
  ARCHIVE.eras.forEach((era) => {
    assert.ok(era.id);
    assert.ok(era.labId);
    assert.ok(era.record.length > 80);
    assert.ok(era.audible.length > 60);
    assert.ok(era.boundary.length > 60);
    assert.ok(era.sourceIds.length > 0);
    era.sourceIds.forEach((sourceId) => {
      assert.ok(ARCHIVE.sourceById(sourceId), `${era.id} references missing ${sourceId}`);
    });
  });
});

test("the source ledger distinguishes historical and derived records", () => {
  const kinds = new Set(ARCHIVE.sources.map((source) => source.kind));
  ["primary", "institutional", "legacy", "contemporary", "derived"].forEach((kind) => {
    assert.ok(kinds.has(kind), `missing source kind ${kind}`);
  });
  const frequencySource = ARCHIVE.sourceById("fuller-528");
  assert.match(frequencySource.title, /528\.03/);
});

test("all movements compile deterministic, finite, ordered scores", () => {
  MODEL.labs.forEach((lab) => {
    const first = MODEL.compileScore(lab.id, MODEL.defaults);
    const second = MODEL.compileScore(lab.id, MODEL.defaults);
    assert.equal(first.fingerprint, second.fingerprint, `${lab.id} fingerprint drift`);
    assert.equal(
      MODEL.stableSerialize(first.events),
      MODEL.stableSerialize(second.events),
      `${lab.id} event drift`
    );
    assert.ok(first.events.length > 5, `${lab.id} has too few events`);
    assert.ok(first.durationBeats > 0);
    first.events.forEach((event, index) => {
      assert.ok(Number.isFinite(event.time));
      assert.ok(Number.isFinite(event.duration));
      assert.ok(Number.isFinite(event.frequency));
      assert.ok(Number.isFinite(event.gain));
      assert.ok(Number.isFinite(event.pan));
      assert.ok(event.time >= 0 && event.time < first.durationBeats);
      assert.ok(event.duration > 0);
      assert.ok(event.frequency >= 24 && event.frequency <= 12000);
      assert.ok(event.pan >= -1 && event.pan <= 1);
      assert.ok(event.sourceId);
      if (index > 0) {
        assert.ok(first.events[index - 1].time <= event.time, `${lab.id} is not ordered`);
      }
    });
  });
});

test("seed participates in deterministic identity", () => {
  const first = MODEL.compileScore("counterpoint", { ...MODEL.defaults, seed: 1 });
  const second = MODEL.compileScore("counterpoint", { ...MODEL.defaults, seed: 2 });
  assert.notEqual(first.fingerprint, second.fingerprint);
});

test("manifest carries score identity, source IDs, and render format", () => {
  const score = MODEL.compileScore("shells", MODEL.defaults);
  const manifest = MODEL.createManifest(score, { bars: 16, sampleRate: 48000 });
  assert.equal(manifest.deterministicIdentity.scoreFingerprint, score.fingerprint);
  assert.equal(manifest.render.bars, 16);
  assert.equal(manifest.render.sampleRate, 48000);
  assert.equal(manifest.render.channels, 2);
  assert.ok(manifest.sources.some((source) => source.id === "fuller-222"));
  assert.match(manifest.boundary, /contemporary/i);
});

test("WAV encoder writes a valid stereo 16-bit PCM RIFF header", () => {
  const left = Float32Array.from([0, -1, -0.5, 0.5, 1, 0]);
  const right = Float32Array.from([0, 1, 0.5, -0.5, -1, 0]);
  const wav = AUDIO.encodeWaveData([left, right], 48000, true);
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const ascii = (offset, length) =>
    String.fromCharCode(...wav.slice(offset, offset + length));
  assert.equal(ascii(0, 4), "RIFF");
  assert.equal(ascii(8, 4), "WAVE");
  assert.equal(ascii(12, 4), "fmt ");
  assert.equal(ascii(36, 4), "data");
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 2);
  assert.equal(view.getUint32(24, true), 48000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), left.length * 2 * 2);
  assert.equal(wav.byteLength, 44 + left.length * 2 * 2);
});

test("the checked-in app is a complete classic-script static file graph", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /type\s*=\s*["']module["']/i);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)\s*=\s*["']https?:/i);
  assert.doesNotMatch(html, /serviceWorker/i);
  const localSources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(localSources, [
    "js/primary-sources.js",
    "js/labs.js",
    "js/audio.js",
    "js/geometry.js",
    "js/app.js",
  ]);
  localSources.forEach((source) => {
    assert.ok(fs.existsSync(path.join(projectRoot, source)), `missing ${source}`);
  });
  assert.ok(fs.existsSync(path.join(projectRoot, "css", "lab.css")));
});

test("runtime code has no fetch call or server dependency", () => {
  const runtimeFiles = [
    "index.html",
    "js/primary-sources.js",
    "js/labs.js",
    "js/audio.js",
    "js/geometry.js",
    "js/app.js",
  ];
  runtimeFiles.forEach((relativePath) => {
    const source = stripComments(read(relativePath));
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${relativePath} calls fetch()`);
    assert.doesNotMatch(source, /python(?:3)?\s+-m\s+http\.server/i);
    assert.doesNotMatch(source, /\b(?:import|export)\s+(?:from|\{|\*)/);
  });
});

test("documentation contains no local-server command", () => {
  ["README.md", "docs/HISTORICAL-NOTE.md", "docs/SONIFICATION-MAP.md"].forEach(
    (relativePath) => {
      assert.doesNotMatch(read(relativePath), /python(?:3)?\s+-m\s+http\.server/i);
    }
  );
});

process.stdout.write("\nAll Syn-Son invariants passed.\n");
