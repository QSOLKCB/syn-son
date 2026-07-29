/**
 * Shared Web Audio synthesis and server-free WAV export.
 *
 * Live playback and OfflineAudioContext rendering both consume the exact same
 * deterministic event score produced by js/labs.js.
 */
(function exposeAudio(root) {
  "use strict";

  const AudioContextCtor =
    typeof window !== "undefined"
      ? window.AudioContext || window.webkitAudioContext
      : null;
  const OfflineAudioContextCtor =
    typeof window !== "undefined"
      ? window.OfflineAudioContext || window.webkitOfflineAudioContext
      : null;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function beatsToSeconds(beats, bpm) {
    return (beats * 60) / bpm;
  }

  function writeAscii(view, offset, text) {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  }

  function encodeWaveData(channelData, sampleRate, normalize) {
    if (!Array.isArray(channelData) || channelData.length < 1 || channelData.length > 2) {
      throw new Error("WAV encoder expects one or two channels");
    }
    const frameCount = channelData[0].length;
    if (!channelData.every((channel) => channel.length === frameCount)) {
      throw new Error("WAV channels must have equal frame counts");
    }

    let peak = 0;
    channelData.forEach((channel) => {
      for (let index = 0; index < channel.length; index += 1) {
        peak = Math.max(peak, Math.abs(channel[index]));
      }
    });
    const scale = normalize && peak > 0 ? Math.min(4, 0.98 / peak) : 1;
    const channels = channelData.length;
    const bytesPerSample = 2;
    const dataBytes = frameCount * channels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(buffer);

    writeAscii(view, 0, "RIFF");
    view.setUint32(4, 36 + dataBytes, true);
    writeAscii(view, 8, "WAVE");
    writeAscii(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, "data");
    view.setUint32(40, dataBytes, true);

    let offset = 44;
    for (let frame = 0; frame < frameCount; frame += 1) {
      for (let channel = 0; channel < channels; channel += 1) {
        const sample = clamp(channelData[channel][frame] * scale, -1, 1);
        const integer = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
        view.setInt16(offset, integer, true);
        offset += 2;
      }
    }

    return new Uint8Array(buffer);
  }

  function createOutputBus(context, destination, masterGain, withAnalyser) {
    const input = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const master = context.createGain();
    master.gain.value = clamp(masterGain, 0, 1);
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.18;

    input.connect(compressor);
    compressor.connect(master);

    let analyser = null;
    if (withAnalyser) {
      analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.78;
      master.connect(analyser);
      analyser.connect(destination);
    } else {
      master.connect(destination);
    }

    return { input, compressor, master, analyser };
  }

  function scheduleEvent(context, destination, event, startTime, bpm, nodeSink) {
    const eventStart = startTime + beatsToSeconds(event.time, bpm);
    const eventDuration = Math.max(0.02, beatsToSeconds(event.duration, bpm));
    const attack = Math.min(eventDuration * 0.45, Math.max(0.002, event.attack));
    const release = Math.min(eventDuration * 0.65, Math.max(0.008, event.release));
    const sustainEnd = Math.max(eventStart + attack, eventStart + eventDuration - release);
    const stopTime = eventStart + eventDuration + 0.025;

    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const panner =
      typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;

    oscillator.type = ["sine", "triangle", "square", "sawtooth"].includes(event.waveform)
      ? event.waveform
      : "sine";
    oscillator.frequency.setValueAtTime(event.frequency, eventStart);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(event.filterHz, eventStart);
    filter.Q.setValueAtTime(0.72, eventStart);

    envelope.gain.setValueAtTime(0.0001, eventStart);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, event.gain),
      eventStart + attack
    );
    envelope.gain.setValueAtTime(Math.max(0.0002, event.gain * 0.82), sustainEnd);
    envelope.gain.exponentialRampToValueAtTime(0.0001, eventStart + eventDuration);

    oscillator.connect(filter);
    filter.connect(envelope);
    if (panner) {
      panner.pan.setValueAtTime(event.pan, eventStart);
      envelope.connect(panner);
      panner.connect(destination);
    } else {
      envelope.connect(destination);
    }

    oscillator.start(eventStart);
    oscillator.stop(stopTime);
    if (nodeSink) {
      nodeSink.push(oscillator);
      oscillator.addEventListener("ended", () => {
        const index = nodeSink.indexOf(oscillator);
        if (index >= 0) nodeSink.splice(index, 1);
      });
    }
  }

  function scheduleScoreCycle(context, destination, score, cycleStart, nodeSink) {
    score.events.forEach((event) => {
      scheduleEvent(context, destination, event, cycleStart, score.params.bpm, nodeSink);
    });
  }

  class SynSonAudio {
    constructor() {
      this.context = null;
      this.bus = null;
      this.running = false;
      this.score = null;
      this.nodes = [];
      this.timer = null;
      this.liveStart = 0;
      this.nextCycleStart = 0;
      this.playToken = 0;
    }

    get supported() {
      return Boolean(AudioContextCtor);
    }

    get offlineSupported() {
      return Boolean(OfflineAudioContextCtor);
    }

    async ensureContext(gain) {
      if (!AudioContextCtor) {
        throw new Error("Web Audio is not supported by this browser");
      }
      if (!this.context) {
        this.context = new AudioContextCtor();
        this.bus = createOutputBus(this.context, this.context.destination, gain, true);
      }
      this.bus.master.gain.setTargetAtTime(
        clamp(gain, 0, 1),
        this.context.currentTime,
        0.015
      );
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
    }

    async play(score) {
      await this.ensureContext(score.params.gain);
      this.stop();
      this.score = score;
      this.running = true;
      this.playToken += 1;
      const token = this.playToken;
      this.liveStart = this.context.currentTime + 0.075;
      this.nextCycleStart = this.liveStart;

      const scheduleNext = () => {
        if (!this.running || token !== this.playToken) return;
        const now = this.context.currentTime;
        if (this.nextCycleStart < now + 0.025) {
          this.nextCycleStart = now + 0.05;
          if (this.liveStart < now - 0.25) this.liveStart = this.nextCycleStart;
        }
        scheduleScoreCycle(
          this.context,
          this.bus.input,
          score,
          this.nextCycleStart,
          this.nodes
        );
        const cycleSeconds = beatsToSeconds(score.durationBeats, score.params.bpm);
        this.nextCycleStart += cycleSeconds;
        const delayMs = Math.max(
          40,
          (this.nextCycleStart - this.context.currentTime - Math.min(0.35, cycleSeconds / 4)) *
            1000
        );
        this.timer = setTimeout(scheduleNext, delayMs);
      };

      scheduleNext();
    }

    stop() {
      this.running = false;
      this.playToken += 1;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      [...this.nodes].forEach((node) => {
        try {
          node.stop();
        } catch (_error) {
          // An oscillator that has already stopped is harmless.
        }
      });
      this.nodes = [];
    }

    setGain(value) {
      if (!this.bus || !this.context) return;
      this.bus.master.gain.setTargetAtTime(
        clamp(value, 0, 1),
        this.context.currentTime,
        0.015
      );
    }

    positionBeats() {
      if (!this.running || !this.context || !this.score) return 0;
      const elapsedSeconds = Math.max(0, this.context.currentTime - this.liveStart);
      const elapsedBeats = (elapsedSeconds * this.score.params.bpm) / 60;
      return elapsedBeats % this.score.durationBeats;
    }

    activeEvent() {
      if (!this.score || !this.running) return null;
      const beat = this.positionBeats();
      let candidate = null;
      for (const event of this.score.events) {
        if (event.time > beat) break;
        if (beat <= event.time + Math.max(event.duration, 0.16)) candidate = event;
      }
      return candidate;
    }

    waveform(target) {
      if (!this.bus || !this.bus.analyser) return null;
      const array = target || new Uint8Array(this.bus.analyser.fftSize);
      this.bus.analyser.getByteTimeDomainData(array);
      return array;
    }

    spectrum(target) {
      if (!this.bus || !this.bus.analyser) return null;
      const array = target || new Uint8Array(this.bus.analyser.frequencyBinCount);
      this.bus.analyser.getByteFrequencyData(array);
      return array;
    }

    async renderWav(score, options, onProgress) {
      if (!OfflineAudioContextCtor) {
        throw new Error("OfflineAudioContext is not supported by this browser");
      }
      const settings = Object.assign(
        { bars: 8, sampleRate: 48000, normalize: true },
        options || {}
      );
      const bars = clamp(Number.parseInt(settings.bars, 10) || 8, 1, 64);
      const sampleRate = [44100, 48000].includes(Number(settings.sampleRate))
        ? Number(settings.sampleRate)
        : 48000;
      const totalBeats = bars * 4;
      const totalSeconds = beatsToSeconds(totalBeats, score.params.bpm);
      const tailSeconds = 0.4;
      const frameCount = Math.ceil((totalSeconds + tailSeconds) * sampleRate);
      const context = new OfflineAudioContextCtor(2, frameCount, sampleRate);
      const bus = createOutputBus(context, context.destination, score.params.gain, false);
      const cycleSeconds = beatsToSeconds(score.durationBeats, score.params.bpm);
      const cycles = Math.ceil(totalBeats / score.durationBeats);

      if (onProgress) onProgress({ phase: "schedule", progress: 0.08 });
      for (let cycle = 0; cycle < cycles; cycle += 1) {
        const beatOffset = cycle * score.durationBeats;
        score.events.forEach((event) => {
          if (beatOffset + event.time >= totalBeats) return;
          scheduleEvent(
            context,
            bus.input,
            event,
            cycle * cycleSeconds,
            score.params.bpm,
            null
          );
        });
      }

      if (onProgress) onProgress({ phase: "render", progress: 0.25 });
      const rendered = await context.startRendering();
      if (onProgress) onProgress({ phase: "encode", progress: 0.82 });
      const channels = [];
      for (let index = 0; index < rendered.numberOfChannels; index += 1) {
        channels.push(rendered.getChannelData(index));
      }
      const wav = encodeWaveData(channels, sampleRate, Boolean(settings.normalize));
      if (onProgress) onProgress({ phase: "done", progress: 1 });

      return {
        bytes: wav,
        blob: new Blob([wav], { type: "audio/wav" }),
        sampleRate,
        channels: rendered.numberOfChannels,
        frames: rendered.length,
        seconds: rendered.duration,
        bars,
      };
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const API = Object.freeze({
    SynSonAudio,
    encodeWaveData,
    beatsToSeconds,
    downloadBlob,
  });

  root.SynSonAudioAPI = API;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
})(typeof window !== "undefined" ? window : globalThis);
