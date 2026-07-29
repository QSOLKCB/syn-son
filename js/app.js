/**
 * Syn-Son application shell.
 *
 * This page is deliberately compatible with file://. Do not introduce module
 * imports, fetch(), workers, service workers, or runtime asset requests here.
 */
(function startApplication() {
  "use strict";

  const ARCHIVE = window.SYNERGETICS_ARCHIVE;
  const MODEL = window.SynSonModel;
  const AUDIO_API = window.SynSonAudioAPI;
  const VISUALS = window.SynSonVisuals;
  const audio = new AUDIO_API.SynSonAudio();

  const state = {
    eraIndex: 0,
    score: null,
    guided: false,
    renderBusy: false,
    rotation: { x: 0, y: 0 },
    pointer: null,
    frame: null,
    previewOrigin: performance.now(),
    resizeObserver: null,
    controlTimer: null,
    toastTimer: null,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };

  const $ = (selector) => document.querySelector(selector);

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function numericValue(id) {
    return Number($(id).value);
  }

  function currentParams() {
    return {
      rootHz: numericValue("#rootHz"),
      bpm: numericValue("#bpm"),
      gain: numericValue("#gain"),
      complexity: numericValue("#complexity"),
      maxFrequency: numericValue("#maxFrequency"),
      seed: numericValue("#seed"),
    };
  }

  function currentEra() {
    return ARCHIVE.eras[state.eraIndex];
  }

  function initialize() {
    setCapabilities();
    buildTimeline();
    buildMappingLedger();
    bindControls();
    bindCanvasOrbit();
    applyHashState();
    selectEra(state.eraIndex, { updateHash: false, preservePlayback: false });
    resizeCanvases();
    if ("ResizeObserver" in window) {
      state.resizeObserver = new ResizeObserver(resizeCanvases);
      state.resizeObserver.observe($("#stage"));
      state.resizeObserver.observe($("#wave"));
    } else {
      window.addEventListener("resize", resizeCanvases);
    }
    startVisualLoop();
  }

  function setCapabilities() {
    const audioBadge = $("#audioCapability");
    const wavBadge = $("#wavCapability");
    audioBadge.textContent = audio.supported ? "Web Audio: ready" : "Web Audio: unavailable";
    audioBadge.dataset.state = audio.supported ? "good" : "warning";
    wavBadge.textContent = audio.offlineSupported ? "Offline WAV: ready" : "Offline WAV: unavailable";
    wavBadge.dataset.state = audio.offlineSupported ? "good" : "warning";
    $("#playButton").disabled = !audio.supported;
    $("#renderButton").disabled = !audio.offlineSupported;
  }

  function buildTimeline() {
    const timeline = $("#timeline");
    timeline.innerHTML = "";
    ARCHIVE.eras.forEach((era, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-button";
      button.dataset.index = String(index);
      button.innerHTML = `
        <span class="timeline-year">${escapeHtml(era.shortYear)}</span>
        <span class="timeline-title">${escapeHtml(era.title)}</span>
      `;
      button.addEventListener("click", () => selectEra(index, { updateHash: true }));
      timeline.appendChild(button);
    });
  }

  function buildMappingLedger() {
    $("#mappingGrid").innerHTML = ARCHIVE.mappings
      .map(
        (mapping) => `
          <article class="mapping-card">
            <h3>${escapeHtml(mapping.sourceQuantity)}</h3>
            <span class="mapping-arrow" aria-hidden="true">↓</span>
            <h3 class="audio-target">${escapeHtml(mapping.audioParameter)}</h3>
            <p>${escapeHtml(mapping.rule)}</p>
            <span class="derived-tag">${escapeHtml(mapping.status)} mapping</span>
          </article>
        `
      )
      .join("");
  }

  function applyHashState() {
    const params = new URLSearchParams(location.hash.slice(1));
    const eraId = params.get("era");
    const eraIndex = ARCHIVE.eras.findIndex((era) => era.id === eraId);
    if (eraIndex >= 0) state.eraIndex = eraIndex;

    const controlMap = {
      bpm: "#bpm",
      root: "#rootHz",
      gain: "#gain",
      detail: "#complexity",
      maxF: "#maxFrequency",
      seed: "#seed",
    };
    Object.entries(controlMap).forEach(([parameter, selector]) => {
      const value = params.get(parameter);
      const control = $(selector);
      if (value !== null && Number.isFinite(Number(value))) {
        const minimum = control.min === "" ? -Infinity : Number(control.min);
        const maximum = control.max === "" ? Infinity : Number(control.max);
        control.value = String(Math.min(maximum, Math.max(minimum, Number(value))));
      }
    });
    updateControlOutputs();
  }

  function updateHash() {
    const era = currentEra();
    const params = currentParams();
    const hash = new URLSearchParams({
      era: era.id,
      bpm: String(params.bpm),
      root: String(params.rootHz),
      gain: String(params.gain),
      detail: String(params.complexity),
      maxF: String(params.maxFrequency),
      seed: String(params.seed >>> 0),
    });
    try {
      history.replaceState(null, "", `#${hash.toString()}`);
    } catch (_error) {
      location.hash = hash.toString();
    }
  }

  function selectEra(index, options) {
    const settings = Object.assign(
      { updateHash: true, preservePlayback: true },
      options || {}
    );
    const wasRunning = audio.running;
    if (wasRunning) audio.stop();
    state.eraIndex = (index + ARCHIVE.eras.length) % ARCHIVE.eras.length;
    state.previewOrigin = performance.now();
    state.rotation = { x: 0, y: 0 };
    compileCurrentScore();
    updateTimeline();
    updateHistoryPanel();
    updateScoreTable();
    updateStageBadges();
    if (settings.updateHash) updateHash();
    if (state.guided) updateGuidedPanel();
    if (wasRunning && settings.preservePlayback) playCurrent();
  }

  function compileCurrentScore() {
    const era = currentEra();
    state.score = MODEL.compileScore(era.labId, currentParams());
    $("#fingerprintLabel").textContent = state.score.fingerprint;
  }

  function updateTimeline() {
    document.querySelectorAll(".timeline-button").forEach((button, index) => {
      const active = index === state.eraIndex;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "step" : "false");
    });
  }

  function updateHistoryPanel() {
    const era = currentEra();
    $("#historyRange").textContent = era.range;
    $("#historyTitle").textContent = era.title;
    $("#historySubtitle").textContent = era.subtitle;
    $("#historicalRecord").textContent = era.record;
    $("#audibleMapping").textContent = era.audible;
    $("#boundaryText").textContent = era.boundary;
    $("#formulaText").textContent = era.formula;
    renderSources(era.sourceIds);
  }

  function renderSources(sourceIds) {
    const list = $("#sourceList");
    list.innerHTML = sourceIds
      .map((id) => ARCHIVE.sourceById(id))
      .filter(Boolean)
      .map((source) => {
        const kind = ARCHIVE.sourceKinds[source.kind];
        const archiveLink = source.archiveUrl
          ? `<a href="${escapeHtml(source.archiveUrl)}" target="_blank" rel="noopener noreferrer">Archive trail</a>`
          : "";
        return `
          <article class="source-item">
            <div class="source-head">
              <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(source.title)}
              </a>
              <span class="source-status" data-kind="${escapeHtml(source.kind)}">
                ${escapeHtml(kind.label)}
              </span>
            </div>
            <p>${escapeHtml(source.creator)} · ${escapeHtml(source.year)}</p>
            <p>${escapeHtml(source.note)}</p>
            <div class="source-links">
              <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">Open source</a>
              ${archiveLink}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function updateStageBadges() {
    const era = currentEra();
    $("#movementBadge").textContent = state.score.title;
    $("#eraBadge").textContent = era.range;
    $("#sourceBadge").textContent = `${era.sourceIds.length} source${era.sourceIds.length === 1 ? "" : "s"}`;
  }

  function updateScoreTable() {
    const events = state.score.events.slice(0, 18);
    $("#scoreBody").innerHTML = events
      .map(
        (event) => `
          <tr>
            <td class="mono">${event.time.toFixed(3)}</td>
            <td>${escapeHtml(event.label)}</td>
            <td>${escapeHtml(event.datum)}</td>
            <td class="mono">${event.frequency.toFixed(2)}</td>
            <td class="mono">${escapeHtml(event.waveform)}</td>
            <td class="mono">${event.pan.toFixed(2)}</td>
            <td class="mono">${escapeHtml(event.sourceId)}</td>
          </tr>
        `
      )
      .join("");
  }

  function bindControls() {
    $("#playButton").addEventListener("click", () => {
      if (audio.running) stopPlayback();
      else playCurrent();
    });
    $("#stopButton").addEventListener("click", stopPlayback);
    $("#renderButton").addEventListener("click", renderWav);
    $("#manifestButton").addEventListener("click", exportManifest);
    $("#captureButton").addEventListener("click", captureStage);
    $("#copyLinkButton").addEventListener("click", copyStateLink);
    $("#presentButton").addEventListener("click", togglePresenter);
    $("#guidedButton").addEventListener("click", () => setGuided(!state.guided));
    $("#guidedPrevious").addEventListener("click", () =>
      selectEra(state.eraIndex - 1, { updateHash: true })
    );
    $("#guidedNext").addEventListener("click", () =>
      selectEra(state.eraIndex + 1, { updateHash: true })
    );
    $("#guidedExit").addEventListener("click", () => setGuided(false));

    const controls = [
      ["#bpm", "#bpmValue"],
      ["#rootHz", "#rootHzValue"],
      ["#gain", "#gainValue"],
      ["#complexity", "#complexityValue"],
      ["#maxFrequency", "#maxFrequencyValue"],
    ];
    controls.forEach(([inputSelector, outputSelector]) => {
      $(inputSelector).addEventListener("input", (event) => {
        $(outputSelector).textContent = event.target.value;
        if (inputSelector === "#gain") audio.setGain(Number(event.target.value));
        scheduleRecompile();
      });
    });
    $("#seed").addEventListener("input", scheduleRecompile);
    $("#seed").addEventListener("change", scheduleRecompile);

    window.addEventListener("keydown", (event) => {
      if (event.target.matches("input, select, textarea, button")) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (audio.running) stopPlayback();
        else playCurrent();
      } else if (event.key === "[") {
        selectEra(state.eraIndex - 1, { updateHash: true });
      } else if (event.key === "]") {
        selectEra(state.eraIndex + 1, { updateHash: true });
      } else if (event.key.toLowerCase() === "w") {
        renderWav();
      } else if (event.key.toLowerCase() === "c") {
        captureStage();
      } else if (event.key.toLowerCase() === "p") {
        togglePresenter();
      } else if (event.key === "Escape" && document.body.classList.contains("presenter")) {
        togglePresenter(false);
      }
    });
  }

  function updateControlOutputs() {
    $("#bpmValue").textContent = $("#bpm").value;
    $("#rootHzValue").textContent = $("#rootHz").value;
    $("#gainValue").textContent = $("#gain").value;
    $("#complexityValue").textContent = $("#complexity").value;
    $("#maxFrequencyValue").textContent = $("#maxFrequency").value;
  }

  function scheduleRecompile() {
    clearTimeout(state.controlTimer);
    state.controlTimer = setTimeout(() => {
      const wasRunning = audio.running;
      if (wasRunning) audio.stop();
      compileCurrentScore();
      updateScoreTable();
      updateStageBadges();
      updateHash();
      if (wasRunning) playCurrent();
    }, 70);
  }

  async function playCurrent() {
    if (!audio.supported) {
      showToast("Web Audio is unavailable in this browser.");
      return;
    }
    try {
      await audio.play(state.score);
      $("#playButton").textContent = "Pause movement";
      $("#playButton").classList.add("active");
      $("#playButton").setAttribute("aria-pressed", "true");
      $("#transportStatus").textContent =
        `Playing ${state.score.title} · ${state.score.events.length} deterministic events · loop ${state.score.durationBeats} beats`;
    } catch (error) {
      $("#transportStatus").textContent = `Audio error: ${error.message}`;
      showToast(`Audio error: ${error.message}`);
    }
  }

  function stopPlayback() {
    audio.stop();
    $("#playButton").textContent = "Play movement";
    $("#playButton").classList.remove("active");
    $("#playButton").setAttribute("aria-pressed", "false");
    $("#transportStatus").textContent = "Stopped. The visual preview remains active.";
    state.previewOrigin = performance.now();
  }

  async function renderWav() {
    if (state.renderBusy) return;
    if (!audio.offlineSupported) {
      showToast("Offline WAV rendering is unavailable in this browser.");
      return;
    }
    state.renderBusy = true;
    const button = $("#renderButton");
    const status = $("#renderStatus");
    button.disabled = true;
    status.dataset.state = "busy";
    status.textContent = "Preparing the deterministic score…";
    const settings = {
      bars: numericValue("#renderBars"),
      sampleRate: numericValue("#sampleRate"),
      normalize: $("#normalize").checked,
    };
    try {
      const result = await audio.renderWav(state.score, settings, (progress) => {
        const percent = Math.round(progress.progress * 100);
        status.textContent = `${capitalize(progress.phase)} · ${percent}% · all processing remains in this browser`;
      });
      const era = currentEra();
      const filename = [
        "syn-son",
        era.id,
        state.score.fingerprint,
        `${result.bars}bars`,
        `${result.sampleRate}hz.wav`,
      ].join("-");
      AUDIO_API.downloadBlob(result.blob, filename);
      status.dataset.state = "done";
      status.textContent =
        `Rendered ${result.seconds.toFixed(2)} s stereo PCM WAV · ${formatBytes(result.bytes.byteLength)} · ${state.score.fingerprint}`;
      showToast("WAV rendered locally. No server was involved.");
    } catch (error) {
      status.dataset.state = "error";
      status.textContent = `WAV render failed: ${error.message}`;
      showToast(`WAV render failed: ${error.message}`);
    } finally {
      state.renderBusy = false;
      button.disabled = false;
    }
  }

  function exportManifest() {
    const settings = {
      bars: numericValue("#renderBars"),
      sampleRate: numericValue("#sampleRate"),
    };
    const manifest = MODEL.createManifest(state.score, settings);
    manifest.history = {
      eraId: currentEra().id,
      range: currentEra().range,
      historicalRecord: currentEra().record,
      audibleMapping: currentEra().audible,
      interpretiveBoundary: currentEra().boundary,
    };
    manifest.mappingLedger = ARCHIVE.mappings;
    downloadText(
      JSON.stringify(manifest, null, 2),
      `syn-son-${currentEra().id}-${state.score.fingerprint}-manifest.json`,
      "application/json"
    );
    showToast("Provenance manifest exported.");
  }

  function downloadText(text, filename, type) {
    AUDIO_API.downloadBlob(new Blob([text], { type: type || "text/plain" }), filename);
  }

  function captureStage() {
    const canvas = $("#stage");
    const filename = `syn-son-${currentEra().id}-${state.score.fingerprint}.png`;
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast("PNG capture was not available.");
          return;
        }
        AUDIO_API.downloadBlob(blob, filename);
        showToast("Visual score captured as PNG.");
      }, "image/png");
    } else {
      const anchor = document.createElement("a");
      anchor.href = canvas.toDataURL("image/png");
      anchor.download = filename;
      anchor.click();
    }
  }

  async function copyStateLink() {
    updateHash();
    const link = location.href;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Deep link copied.");
    } catch (_error) {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      textArea.remove();
      showToast(copied ? "Deep link copied." : "Copy unavailable; use the address bar.");
    }
  }

  function togglePresenter(force) {
    const enable =
      typeof force === "boolean"
        ? force
        : !document.body.classList.contains("presenter");
    document.body.classList.toggle("presenter", enable);
    $("#presentButton").setAttribute("aria-pressed", String(enable));
    $("#presentButton").textContent = enable ? "Exit presenter" : "Presenter mode";
    requestAnimationFrame(resizeCanvases);
  }

  function setGuided(enable) {
    state.guided = Boolean(enable);
    $("#guidedPanel").hidden = !state.guided;
    $("#guidedButton").setAttribute("aria-pressed", String(state.guided));
    if (state.guided) {
      updateGuidedPanel();
      $("#guidedPanel").scrollIntoView({ behavior: state.reducedMotion ? "auto" : "smooth", block: "nearest" });
    }
  }

  function updateGuidedPanel() {
    const era = currentEra();
    $("#guidedTitle").textContent = `${state.eraIndex + 1} / ${ARCHIVE.eras.length} · ${era.title}`;
    $("#guidedSummary").textContent = era.subtitle;
    $("#guidedRecord").textContent = era.record;
    $("#guidedListen").textContent = era.audible;
    $("#guidedBoundary").textContent = era.boundary;
  }

  function bindCanvasOrbit() {
    const canvas = $("#stage");
    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture(event.pointerId);
      state.pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!state.pointer || state.pointer.id !== event.pointerId) return;
      const deltaX = event.clientX - state.pointer.x;
      const deltaY = event.clientY - state.pointer.y;
      state.rotation.y += deltaX * 0.008;
      state.rotation.x += deltaY * 0.008;
      state.pointer.x = event.clientX;
      state.pointer.y = event.clientY;
    });
    const clearPointer = (event) => {
      if (state.pointer && state.pointer.id === event.pointerId) state.pointer = null;
    };
    canvas.addEventListener("pointerup", clearPointer);
    canvas.addEventListener("pointercancel", clearPointer);
  }

  function resizeCanvases() {
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    ["#stage", "#wave"].forEach((selector) => {
      const canvas = $(selector);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    });
  }

  function startVisualLoop() {
    const stage = $("#stage");
    const wave = $("#wave");
    const frame = (time) => {
      if (!state.score) {
        state.frame = requestAnimationFrame(frame);
        return;
      }
      const beat = audio.running
        ? audio.positionBeats()
        : state.reducedMotion
          ? 0
          : ((((time - state.previewOrigin) / 1000) * state.score.params.bpm) / 60) %
            state.score.durationBeats;
      const activeEvent = audio.running
        ? audio.activeEvent()
        : findActiveEvent(state.score, beat);
      VISUALS.draw(stage, {
        score: state.score,
        beat,
        activeEvent,
        time: state.reducedMotion ? 0 : time / 1000,
        rotation: state.rotation,
      });
      drawWave(wave, beat);
      if (audio.running && activeEvent) {
        $("#transportStatus").textContent =
          `${activeEvent.label} · ${activeEvent.datum} · ${activeEvent.frequency.toFixed(2)} Hz · source ${activeEvent.sourceId}`;
      }
      state.frame = requestAnimationFrame(frame);
    };
    state.frame = requestAnimationFrame(frame);
  }

  function findActiveEvent(score, beat) {
    let event = null;
    for (const candidate of score.events) {
      if (candidate.time > beat) break;
      if (beat <= candidate.time + Math.max(candidate.duration, 0.16)) event = candidate;
    }
    return event;
  }

  function drawWave(canvas, beat) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0b0e0c";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(213,189,131,0.09)";
    context.lineWidth = 1;
    context.beginPath();
    for (let index = 1; index < 8; index += 1) {
      const x = (index / 8) * width;
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();

    if (audio.running) {
      const waveform = audio.waveform();
      const spectrum = audio.spectrum();
      if (spectrum) {
        const bars = 72;
        const stride = Math.max(1, Math.floor(spectrum.length / bars));
        for (let index = 0; index < bars; index += 1) {
          let sum = 0;
          for (let bin = 0; bin < stride; bin += 1) sum += spectrum[index * stride + bin];
          const value = sum / stride / 255;
          const barWidth = width / bars;
          context.fillStyle = `rgba(159,188,166,${0.08 + value * 0.46})`;
          context.fillRect(
            index * barWidth,
            height - value * height * 0.78,
            Math.max(1, barWidth - 1),
            value * height * 0.78
          );
        }
      }
      if (waveform) {
        context.strokeStyle = "rgba(223,201,148,0.92)";
        context.lineWidth = Math.max(1.2, width / 900);
        context.beginPath();
        waveform.forEach((value, index) => {
          const x = (index / Math.max(1, waveform.length - 1)) * width;
          const y = (value / 255) * height;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      }
      return;
    }

    const maximumFrequency = Math.max(...state.score.events.map((event) => event.frequency), 1);
    state.score.events.forEach((event) => {
      const x = (event.time / state.score.durationBeats) * width;
      const barHeight = (event.frequency / maximumFrequency) * height * 0.68;
      const active =
        beat >= event.time && beat <= event.time + Math.max(event.duration, 0.12);
      context.strokeStyle = active ? "rgba(223,201,148,0.95)" : "rgba(198,155,98,0.28)";
      context.lineWidth = active ? 2.5 : 1;
      context.beginPath();
      context.moveTo(x, height);
      context.lineTo(x, height - barHeight);
      context.stroke();
    });
    const cursorX = (beat / state.score.durationBeats) * width;
    context.strokeStyle = "rgba(159,188,166,0.84)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(cursorX, 0);
    context.lineTo(cursorX, height);
    context.stroke();
  }

  function capitalize(value) {
    const text = String(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
