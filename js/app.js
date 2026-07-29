/**
 * Synergetics Sonification Lab — app shell
 */

(function () {
  const audio = new SynergeticsAudio();
  let currentLab = "hierarchy";
  let animId = null;
  let rotY = 0.5;
  let rotX = 0.35;
  let quoteIdx = 0;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  function init() {
    buildLabNav();
    bindControls();
    selectLab("hierarchy");
    startVisualLoop();
    rotateQuote();
    setInterval(rotateQuote, 12000);

    $("#source-meta").textContent = `${PRIMARY.author} — ${PRIMARY.work} (${PRIMARY.years})`;
  }

  function buildLabNav() {
    const nav = $("#lab-nav");
    nav.innerHTML = "";
    LABS.list.forEach((lab) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lab-tab";
      btn.dataset.lab = lab.id;
      btn.innerHTML = `<span class="tab-title">${lab.title}</span><span class="tab-cite">§${lab.cite.split(",")[0]}</span>`;
      btn.addEventListener("click", () => selectLab(lab.id));
      nav.appendChild(btn);
    });
  }

  function selectLab(id) {
    currentLab = id;
    const lab = LABS.list.find((l) => l.id === id);
    $$(".lab-tab").forEach((b) => b.classList.toggle("active", b.dataset.lab === id));
    $("#lab-title").textContent = lab.title;
    $("#lab-subtitle").textContent = lab.subtitle;
    $("#lab-blurb").textContent = lab.blurb;
    $("#lab-cite").textContent = `Primary source: Synergetics §${lab.cite}`;
    $("#status-label").textContent = "Ready — press Play";

    // mode-specific controls
    const extra = $("#extra-controls");
    extra.innerHTML = "";
    if (id === "frequency") {
      extra.appendChild(makeSelect("N (prime)", "param-N", [
        { v: 1, t: "N=1 Tetrahedron" },
        { v: 2, t: "N=2 Octahedron" },
        { v: 3, t: "N=3 Cube" },
        { v: 5, t: "N=5 VE / Icosa" },
      ], 5));
    }
    if (id === "frequency" || id === "packing") {
      extra.appendChild(makeRange("Max frequency F", "param-maxF", 2, 8, 1, 5));
    }

    if (audio.running) play(); // restart with new mode
    drawOnce();
  }

  function makeSelect(label, id, options, selected) {
    const wrap = document.createElement("label");
    wrap.className = "ctrl";
    wrap.innerHTML = `<span>${label}</span>`;
    const sel = document.createElement("select");
    sel.id = id;
    options.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.v;
      opt.textContent = o.t;
      if (o.v === selected) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => {
      if (audio.running) play();
    });
    wrap.appendChild(sel);
    return wrap;
  }

  function makeRange(label, id, min, max, step, value) {
    const wrap = document.createElement("label");
    wrap.className = "ctrl";
    wrap.innerHTML = `<span>${label}: <em id="${id}-val">${value}</em></span>`;
    const input = document.createElement("input");
    input.type = "range";
    input.id = id;
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.addEventListener("input", () => {
      $(`#${id}-val`).textContent = input.value;
      if (audio.running) play();
    });
    wrap.appendChild(input);
    return wrap;
  }

  function getParams() {
    const p = {
      stepDiv: parseFloat($("#step-div").value) || 0.25,
    };
    const nEl = $("#param-N");
    if (nEl) p.N = parseInt(nEl.value, 10);
    const fEl = $("#param-maxF");
    if (fEl) p.maxF = parseInt(fEl.value, 10);
    return p;
  }

  function bindControls() {
    $("#btn-play").addEventListener("click", play);
    $("#btn-stop").addEventListener("click", stop);

    $("#bpm").addEventListener("input", (e) => {
      $("#bpm-val").textContent = e.target.value;
      audio.setBpm(+e.target.value);
    });
    $("#gain").addEventListener("input", (e) => {
      $("#gain-val").textContent = e.target.value;
      audio.setGain(+e.target.value);
    });
    $("#root-hz").addEventListener("input", (e) => {
      $("#root-hz-val").textContent = e.target.value;
      audio.setRootHz(+e.target.value);
    });
    $("#tuning").addEventListener("change", (e) => {
      audio.tuning = e.target.value;
    });
    $("#step-div").addEventListener("change", () => {
      if (audio.running) play();
    });

    // One-shot hierarchy note
    $("#btn-strike").addEventListener("click", async () => {
      await audio.resume();
      const items = PRIMARY.hierarchy.filter((h) => h.vol >= 1);
      const it = items[Math.floor(Math.random() * items.length)];
      audio.tone({
        freq: audio.volToHz(it.vol),
        dur: 0.6,
        type: it.id === "ve" ? "ve" : "tet",
        gain: 0.15,
        filterHz: 2500,
      });
      $("#status-label").textContent = `Strike: ${it.name} vol=${it.vol}`;
    });

    // Keyboard
    window.addEventListener("keydown", (e) => {
      if (e.target.matches("input, select, textarea")) return;
      if (e.code === "Space") {
        e.preventDefault();
        audio.running ? stop() : play();
      }
    });
  }

  async function play() {
    await audio.resume();
    const gen = LABS[currentLab];
    if (!gen) return;
    const params = getParams();
    audio.setBpm(+$("#bpm").value);
    audio.setRootHz(+$("#root-hz").value);
    audio.setGain(+$("#gain").value);
    audio.tuning = $("#tuning").value;

    audio.onStep = (step, p) => {
      if (p._label) $("#status-label").textContent = p._label;
    };

    audio.start(currentLab, gen, params);
    $("#btn-play").classList.add("active");
    $("#btn-stop").classList.remove("active");
  }

  function stop() {
    audio.stop();
    $("#btn-play").classList.remove("active");
    $("#status-label").textContent = "Stopped";
  }

  function rotateQuote() {
    const q = PRIMARY.quotes[quoteIdx % PRIMARY.quotes.length];
    $("#quote-text").textContent = `“${q.text}”`;
    $("#quote-cite").textContent = `— Synergetics §${q.cite}`;
    quoteIdx++;
  }

  function startVisualLoop() {
    const canvas = $("#viz");
    const wave = $("#wave");
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      for (const c of [canvas, wave]) {
        const r = c.getBoundingClientRect();
        c.width = Math.floor(r.width * dpr);
        c.height = Math.floor(r.height * dpr);
      }
    }
    resize();
    window.addEventListener("resize", resize);

    function frame() {
      rotY += 0.006;
      rotX = 0.35 + Math.sin(rotY * 0.3) * 0.08;
      drawViz(canvas);
      drawWave(wave);
      animId = requestAnimationFrame(frame);
    }
    frame();
  }

  function drawOnce() {
    const canvas = $("#viz");
    if (canvas.width) drawViz(canvas);
  }

  function drawViz(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // background grid subtle
    ctx.fillStyle = "rgba(15,23,42,0.3)";
    ctx.fillRect(0, 0, w, h);

    const p = audio.params || {};
    const scale = Math.min(w, h) * 0.22;

    if (currentLab === "hierarchy" || currentLab === "modules") {
      // volume bars on left half concept — full hierarchy bars
      const items = PRIMARY.hierarchy.filter((x) => x.vol >= 1 / 8);
      GEOM.drawVolumeBars(ctx, items, p._activeId || "tet");
      // overlay polyhedron
      const id = p._activeId || "tet";
      const shape = GEOM.shapes[id] || GEOM.shapes.tet;
      const color = (PRIMARY.hierarchy.find((x) => x.id === id) || {}).color || "#7dd3fc";
      ctx.save();
      ctx.globalAlpha = 0.95;
      GEOM.drawPolyhedron(ctx, shape, {
        rotX,
        rotY,
        color,
        scale: scale * 0.9,
        pulse: audio.running ? Math.sin(performance.now() / 200) : 0,
      });
      ctx.restore();
    } else if (currentLab === "frequency") {
      const N = p.N || 5;
      const map = { 1: "tet", 2: "octa", 3: "cube", 5: "ve" };
      const shape = GEOM.shapes[map[N] || "ve"];
      const F = p._activeF || 1;
      GEOM.drawPolyhedron(ctx, shape, {
        rotX,
        rotY,
        color: N === 5 ? "#f87171" : N === 1 ? "#60a5fa" : N === 2 ? "#4ade80" : "#34d399",
        scale: scale * (0.7 + F * 0.08),
        pulse: audio.running ? 1 : 0,
      });
      // frequency rings
      ctx.save();
      ctx.strokeStyle = "rgba(125,211,252,0.2)";
      for (let i = 1; i <= (p.maxF || 5); i++) {
        const R = scale * 0.5 * i;
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, R, R * 0.7, 0, 0, Math.PI * 2);
        ctx.lineWidth = i === F ? 2 : 1;
        ctx.strokeStyle = i === F ? "rgba(251,191,36,0.6)" : "rgba(125,211,252,0.15)";
        ctx.stroke();
      }
      ctx.restore();
    } else if (currentLab === "packing") {
      GEOM.drawShells(ctx, p.maxF || 5, {
        activeLayer: p._activeF ?? 0,
        color: "#38bdf8",
      });
    } else if (currentLab === "jitterbug") {
      const t = p._jitterT ?? (Math.sin(performance.now() / 3000) * 0.5 + 0.5);
      const mesh = GEOM.jitterbug(t);
      GEOM.drawPolyhedron(ctx, mesh, {
        rotX,
        rotY,
        color: "#f472b6",
        scale: scale * 1.1,
      });
      // progress arc
      ctx.save();
      ctx.strokeStyle = "rgba(251,191,36,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w - 40 * (window.devicePixelRatio || 1), 40 * (window.devicePixelRatio || 1), 16 * (window.devicePixelRatio || 1), -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (currentLab === "angular") {
      const name = (p._activeSys || "Tetrahedron").toLowerCase();
      let shape = GEOM.shapes.tet;
      if (name.includes("octa")) shape = GEOM.shapes.octa;
      else if (name.includes("icosa")) shape = GEOM.shapes.icosa;
      else if (name.includes("cube")) shape = GEOM.shapes.cube;
      GEOM.drawPolyhedron(ctx, shape, {
        rotX,
        rotY,
        color: "#fbbf24",
        scale,
      });
    } else if (currentLab === "twoness") {
      GEOM.drawPolyhedron(ctx, GEOM.shapes.tet, {
        rotX,
        rotY: rotY,
        color: "#60a5fa",
        scale: scale * 0.7,
      });
      GEOM.drawPolyhedron(ctx, GEOM.shapes.tet, {
        rotX: rotX + 0.5,
        rotY: -rotY,
        color: "#f472b6",
        scale: scale * 0.7,
        alpha: 0.5,
      });
    } else if (currentLab === "chords") {
      GEOM.drawPolyhedron(ctx, GEOM.shapes.ve, {
        rotX,
        rotY,
        color: "#f87171",
        scale,
      });
      // great circle
      ctx.save();
      ctx.strokeStyle = "rgba(254,240,138,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, scale * 0.95, scale * 0.55, rotY, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      GEOM.drawPolyhedron(ctx, GEOM.shapes.ve, {
        rotX,
        rotY,
        color: "#7dd3fc",
        scale,
      });
    }
  }

  function drawWave(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
    ctx.fillRect(0, 0, w, h);

    const wave = audio.getWaveform();
    const spec = audio.getSpectrum();

    if (wave) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(125, 211, 252, 0.9)";
      ctx.lineWidth = 2;
      const mid = h / 2;
      for (let i = 0; i < wave.length; i++) {
        const x = (i / wave.length) * w;
        const y = mid + ((wave[i] - 128) / 128) * (h * 0.4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (spec) {
      const bars = 64;
      const step = Math.floor(spec.length / bars);
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += spec[i * step + j];
        const v = sum / step / 255;
        const bw = w / bars;
        ctx.fillStyle = `rgba(244, 114, 182, ${0.15 + v * 0.5})`;
        ctx.fillRect(i * bw, h - v * h * 0.5, bw - 1, v * h * 0.5);
      }
    }
  }

  // Hierarchy table
  function fillTable() {
    const body = $("#hierarchy-body");
    body.innerHTML = PRIMARY.hierarchy
      .map(
        (h) => `<tr>
        <td><span class="swatch" style="background:${h.color}"></span>${h.name}</td>
        <td class="num">${formatVol(h.vol)}</td>
        <td class="num">${h.V ?? "—"}</td>
        <td class="num">${h.E ?? "—"}</td>
        <td class="num">${h.F ?? "—"}</td>
        <td class="num">${h.prime ?? "—"}</td>
        <td class="cite">§${h.cite}</td>
      </tr>`
      )
      .join("");
  }

  function formatVol(v) {
    if (v < 1) {
      const inv = Math.round(1 / v);
      if (Math.abs(1 / inv - v) < 1e-9) return `1/${inv}`;
    }
    return Number.isInteger(v) ? String(v) : v.toFixed(3);
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    fillTable();
  });
})();
