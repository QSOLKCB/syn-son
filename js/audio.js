/**
 * Offline Web Audio sonification engine for the Synergetics lab.
 * No external samples — pure oscillators, noise, and envelopes.
 */

class SynergeticsAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.reverb = null;
    this.analyser = null;
    this.running = false;
    this.bpm = 90;
    this.rootHz = 110; // A2 — "vector unit" base frequency
    this.tuning = "just60"; // just intervals from 60° / tetrahedral ratios
    this.voices = [];
    this.schedId = null;
    this.nextNoteTime = 0;
    this.lookAhead = 0.1;
    this.scheduleAhead = 0.2;
    this.step = 0;
    this.mode = null;
    this.params = {};
    this.onStep = null;
    this.gain = 0.45;
  }

  async init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.gain;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Simple convolver-free "space" — delay + feedback
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.22;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.28;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.22;
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(this.analyser);
    this.master.connect(delay);
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.reverb = { delay, fb, wet };
  }

  async resume() {
    await this.init();
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  setGain(g) {
    this.gain = g;
    if (this.master) this.master.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05);
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  setRootHz(hz) {
    this.rootHz = hz;
  }

  /** Frequency ratios from synergetic / 60° coordination */
  ratio(interval) {
    const just60 = {
      // Built from small integers that appear in Fuller's hierarchy
      // and pure 3:2, 4:3, 5:4, plus √2, φ related
      unison: 1,
      minor2: 16 / 15,
      major2: 9 / 8,
      minor3: 6 / 5,
      major3: 5 / 4,
      fourth: 4 / 3,
      tritone: Math.SQRT2, // cube diagonal / edge relation
      fifth: 3 / 2,
      minor6: 8 / 5,
      major6: 5 / 3,
      minor7: 9 / 5,
      major7: 15 / 8,
      octave: 2,
      // Synergetics specials
      tetra: 1, // vol 1
      cube: 3, // vol 3 → as partial ratio folded
      octa: 4,
      rd: 6,
      ve: 5 / 1, // 20/4 — VE/octa, or use 20 folded
      phi: (1 + Math.sqrt(5)) / 2,
      invPhi: (Math.sqrt(5) - 1) / 2,
      sqrt2: Math.SQRT2,
      sqrt3: Math.sqrt(3),
      // 60° related: cos(60°)=1/2
      cos60: 0.5,
      // A module = 1/24
      aMod: 1 / 24,
    };
    if (this.tuning === "equal") {
      const eq = {
        unison: 1,
        minor2: Math.pow(2, 1 / 12),
        major2: Math.pow(2, 2 / 12),
        minor3: Math.pow(2, 3 / 12),
        major3: Math.pow(2, 4 / 12),
        fourth: Math.pow(2, 5 / 12),
        tritone: Math.pow(2, 6 / 12),
        fifth: Math.pow(2, 7 / 12),
        minor6: Math.pow(2, 8 / 12),
        major6: Math.pow(2, 9 / 12),
        minor7: Math.pow(2, 10 / 12),
        major7: Math.pow(2, 11 / 12),
        octave: 2,
        tetra: 1,
        cube: Math.pow(2, Math.log2(3) % 1),
        octa: 2,
        rd: Math.pow(2, Math.log2(6) % 1),
        ve: Math.pow(2, Math.log2(5) % 1),
        phi: (1 + Math.sqrt(5)) / 2,
        invPhi: (Math.sqrt(5) - 1) / 2,
        sqrt2: Math.SQRT2,
        sqrt3: Math.sqrt(3),
        cos60: 0.5,
        aMod: 1 / 24,
      };
      return eq[interval] ?? 1;
    }
    return just60[interval] ?? 1;
  }

  /** Map tetravolume → frequency (logarithmic, rooted at rootHz for vol=1) */
  volToHz(vol) {
    if (vol <= 0) return this.rootHz;
    // Each ×2 volume → +1 octave * scale factor; keep musical range
    const octaves = Math.log2(vol) * 0.45;
    return this.rootHz * Math.pow(2, octaves);
  }

  /** Map integer count (shell spheres) into a scale degree */
  countToHz(n, scale = null) {
    const sc =
      scale ||
      [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2].map((r) => r);
    // Fold n into scale with octave wrap using prime-ish steps
    const deg = ((n % sc.length) + sc.length) % sc.length;
    const oct = Math.floor(n / sc.length);
    return this.rootHz * sc[deg] * Math.pow(2, oct * 0.5);
  }

  /**
   * Play a brief tone with optional noise transient.
   * kind: 'sine' | 'triangle' | 'square' | 'sawtooth' | 'tet' | 'noise'
   */
  tone(opts) {
    if (!this.ctx) return;
    const {
      freq = 220,
      dur = 0.25,
      type = "sine",
      when = this.ctx.currentTime,
      gain = 0.15,
      pan = 0,
      attack = 0.01,
      release = 0.12,
      filterHz = 4000,
      detune = 0,
      harmonic = 0, // extra partials for "synergy"
    } = opts;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, when + Math.max(dur, attack + 0.02));

    const filt = this.ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(filterHz, when);
    filt.Q.value = 0.7;

    let panner = null;
    if (this.ctx.createStereoPanner) {
      panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
    }

    const connectOut = (node) => {
      node.connect(filt);
      filt.connect(g);
      if (panner) {
        g.connect(panner);
        panner.connect(this.master);
      } else {
        g.connect(this.master);
      }
    };

    if (type === "noise") {
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      connectOut(src);
      src.start(when);
      src.stop(when + dur + 0.05);
      return;
    }

    // "tet" = four partials at tetrahedral-ish ratios (1, 5/4, 3/2, 2)
    const partials =
      type === "tet"
        ? [
            { r: 1, a: 1 },
            { r: 5 / 4, a: 0.35 },
            { r: 3 / 2, a: 0.28 },
            { r: 2, a: 0.15 },
          ]
        : type === "ve"
          ? [
              { r: 1, a: 1 },
              { r: 1.2, a: 0.25 }, // 6/5-ish
              { r: Math.SQRT2, a: 0.2 },
              { r: 2, a: 0.12 },
              { r: 2.5, a: 0.08 }, // 5/2 related to VE 20/8
            ]
          : [{ r: 1, a: 1 }];

    const oscType = type === "tet" || type === "ve" ? "sine" : type;

    for (const p of partials) {
      const osc = this.ctx.createOscillator();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq * p.r, when);
      if (detune) osc.detune.setValueAtTime(detune, when);
      const pg = this.ctx.createGain();
      pg.gain.value = p.a;
      osc.connect(pg);
      connectOut(pg);
      osc.start(when);
      osc.stop(when + dur + 0.08);
    }

    // Optional synergy partial (whole not predicted by parts)
    if (harmonic > 0) {
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq * harmonic, when);
      const pg = this.ctx.createGain();
      pg.gain.value = 0.08;
      osc.connect(pg);
      connectOut(pg);
      osc.start(when);
      osc.stop(when + dur + 0.05);
    }
  }

  /** Chord from array of frequencies */
  chord(freqs, opts = {}) {
    const when = opts.when ?? this.ctx.currentTime;
    freqs.forEach((f, i) => {
      this.tone({
        ...opts,
        freq: f,
        when: when + i * (opts.spread || 0),
        pan: opts.panSpread ? (i / Math.max(1, freqs.length - 1)) * 2 - 1 : opts.pan || 0,
        gain: (opts.gain || 0.12) / Math.sqrt(freqs.length),
      });
    });
  }

  /** Start scheduler for a lab mode generator */
  start(modeName, generator, params = {}) {
    this.stop();
    this.mode = modeName;
    this.params = params;
    this.generator = generator;
    this.step = 0;
    this.running = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this._tick();
  }

  _tick() {
    if (!this.running) return;
    const beat = 60 / this.bpm;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAhead) {
      if (this.generator) {
        this.generator(this, this.nextNoteTime, this.step, this.params, beat);
      }
      if (this.onStep) {
        try {
          this.onStep(this.step, this.params);
        } catch (_) {}
      }
      this.nextNoteTime += beat * (this.params.stepDiv || 0.25);
      this.step++;
    }
    this.schedId = requestAnimationFrame(() => this._tick());
  }

  stop() {
    this.running = false;
    if (this.schedId) cancelAnimationFrame(this.schedId);
    this.schedId = null;
    this.mode = null;
  }

  getWaveform() {
    if (!this.analyser) return null;
    const n = this.analyser.fftSize;
    const data = new Uint8Array(n);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  getSpectrum() {
    if (!this.analyser) return null;
    const n = this.analyser.frequencyBinCount;
    const data = new Uint8Array(n);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

window.SynergeticsAudio = SynergeticsAudio;
