/**
 * Canvas visual score for Syn-Son.
 *
 * Geometry is intentionally dependency-free and uses a restrained archival
 * palette. Historical diagrams are not copied; these are live schematic views
 * of the project's declared mappings.
 */
(function exposeVisuals(root) {
  "use strict";

  const PALETTE = Object.freeze({
    paper: "#ebe1c5",
    ink: "#121514",
    panel: "#181d1b",
    line: "#44504a",
    faint: "rgba(235,225,197,0.11)",
    brass: "#d5bd83",
    copper: "#c69b62",
    green: "#9fbca6",
    moss: "#bcc68e",
    rust: "#b77d52",
    amber: "#d78a57",
    pale: "#dfc994",
  });

  const SHAPES = Object.freeze({
    tetrahedron: {
      vertices: [
        [1, 1, 1],
        [1, -1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
      ],
      edges: [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3],
      ],
    },
    octahedron: {
      vertices: [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ],
      edges: [
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [1, 2],
        [1, 3],
        [1, 4],
        [1, 5],
        [2, 4],
        [2, 5],
        [3, 4],
        [3, 5],
      ],
    },
    cube: {
      vertices: [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ],
    },
    vectorEquilibrium: createCuboctahedron(),
  });

  function createCuboctahedron() {
    const vertices = [];
    [-1, 1].forEach((a) => {
      [-1, 1].forEach((b) => {
        vertices.push([a, b, 0], [a, 0, b], [0, a, b]);
      });
    });
    const unique = [];
    vertices.forEach((vertex) => {
      if (!unique.some((item) => item.every((value, index) => value === vertex[index]))) {
        unique.push(vertex);
      }
    });
    const edges = [];
    for (let left = 0; left < unique.length; left += 1) {
      for (let right = left + 1; right < unique.length; right += 1) {
        const distance = Math.hypot(
          unique[left][0] - unique[right][0],
          unique[left][1] - unique[right][1],
          unique[left][2] - unique[right][2]
        );
        if (Math.abs(distance - Math.SQRT2) < 1e-8) edges.push([left, right]);
      }
    }
    return { vertices: unique, edges };
  }

  function rotatePoint(point, rotationX, rotationY) {
    const [x, y, z] = point;
    const cy = Math.cos(rotationY);
    const sy = Math.sin(rotationY);
    const cx = Math.cos(rotationX);
    const sx = Math.sin(rotationX);
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    const y1 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;
    return [x1, y1, z2];
  }

  function project(point, centerX, centerY, scale) {
    const depth = 4.5;
    const perspective = depth / (depth + point[2]);
    return [centerX + point[0] * scale * perspective, centerY + point[1] * scale * perspective, point[2]];
  }

  function drawShape(context, shape, options) {
    const rotationX = options.rotationX || 0;
    const rotationY = options.rotationY || 0;
    const points = shape.vertices.map((point) =>
      project(
        rotatePoint(point, rotationX, rotationY),
        options.x,
        options.y,
        options.scale
      )
    );
    context.save();
    context.lineCap = "round";
    shape.edges
      .map((edge) => ({
        edge,
        depth: (points[edge[0]][2] + points[edge[1]][2]) / 2,
      }))
      .sort((left, right) => left.depth - right.depth)
      .forEach(({ edge, depth }) => {
        const alpha = 0.25 + ((depth + 2) / 4) * 0.65;
        context.strokeStyle = colorWithAlpha(options.color, alpha);
        context.lineWidth = options.lineWidth || 1.5;
        context.beginPath();
        context.moveTo(points[edge[0]][0], points[edge[0]][1]);
        context.lineTo(points[edge[1]][0], points[edge[1]][1]);
        context.stroke();
      });
    points.forEach((point) => {
      context.fillStyle = colorWithAlpha(options.color, 0.55 + ((point[2] + 2) / 4) * 0.4);
      context.beginPath();
      context.arc(point[0], point[1], options.pointRadius || 2.4, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  function colorWithAlpha(hex, alpha) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const red = Number.parseInt(hex.slice(1, 3), 16);
    const green = Number.parseInt(hex.slice(3, 5), 16);
    const blue = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${red},${green},${blue},${Math.max(0, Math.min(1, alpha))})`;
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawBackground(context, width, height, time) {
    const gradient = context.createRadialGradient(
      width * 0.47,
      height * 0.42,
      10,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.72
    );
    gradient.addColorStop(0, "#202622");
    gradient.addColorStop(0.58, "#141816");
    gradient.addColorStop(1, "#0d100f");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const spacing = Math.max(28, Math.min(width, height) / 15);
    context.strokeStyle = PALETTE.faint;
    context.lineWidth = 1;
    context.beginPath();
    for (let x = ((time * 3) % spacing) - spacing; x < width + spacing; x += spacing) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }
    for (let y = 0; y < height + spacing; y += spacing) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }
    context.stroke();

    context.strokeStyle = "rgba(213,189,131,0.13)";
    context.beginPath();
    context.moveTo(0, height * 0.5);
    context.lineTo(width, height * 0.5);
    context.moveTo(width * 0.5, 0);
    context.lineTo(width * 0.5, height);
    context.stroke();
  }

  function drawShells(context, width, height, score, beat) {
    const rows = score.visual.rows || [];
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const maximum = Math.max(1, rows.length);
    const activeIndex = Math.min(maximum - 1, Math.floor((beat / score.durationBeats) * maximum));
    rows.forEach((row, index) => {
      const radius = ((index + 1) / (maximum + 1)) * Math.min(width, height) * 0.39;
      const active = index === activeIndex;
      context.strokeStyle = colorWithAlpha(active ? PALETTE.pale : PALETTE.brass, active ? 0.9 : 0.28);
      context.lineWidth = active ? 3 : 1.2;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.stroke();

      const visibleNodes = Math.min(42, Math.max(6, Math.round(Math.sqrt(row.population) * 2.3)));
      for (let node = 0; node < visibleNodes; node += 1) {
        const angle = (node / visibleNodes) * Math.PI * 2 - Math.PI / 2;
        const pulse = active ? 1.5 + Math.sin(beat * 8 + node) * 0.7 : 1.2;
        context.fillStyle = colorWithAlpha(active ? PALETTE.amber : PALETTE.brass, active ? 0.92 : 0.45);
        context.beginPath();
        context.arc(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
          pulse,
          0,
          Math.PI * 2
        );
        context.fill();
      }
      context.fillStyle = active ? PALETTE.paper : colorWithAlpha(PALETTE.paper, 0.55);
      context.font = `${Math.max(10, width / 90)}px ui-monospace, monospace`;
      context.fillText(`F${row.frequency} · ${row.population}`, centerX + radius + 8, centerY + 4);
    });
    context.fillStyle = PALETTE.paper;
    context.beginPath();
    context.arc(centerX, centerY, 4, 0, Math.PI * 2);
    context.fill();
  }

  function drawHierarchy(context, width, height, score, beat, rotation) {
    const rows = score.visual.rows || [];
    const left = width * 0.09;
    const right = width * 0.56;
    const top = height * 0.13;
    const bottom = height * 0.86;
    const activeIndex = Math.min(
      rows.length - 1,
      Math.floor((beat / score.durationBeats) * rows.length)
    );
    const maximumLog = Math.log2(20);

    context.strokeStyle = colorWithAlpha(PALETTE.paper, 0.25);
    context.beginPath();
    context.moveTo(left, bottom);
    context.lineTo(right, bottom);
    context.stroke();

    rows.forEach((row, index) => {
      const cell = (right - left) / rows.length;
      const logValue = Math.log2(Math.max(row.volume, 1 / 24));
      const normalized = (logValue - Math.log2(1 / 24)) / (maximumLog - Math.log2(1 / 24));
      const heightValue = Math.max(4, normalized * (bottom - top));
      const x = left + index * cell + cell * 0.14;
      const y = bottom - heightValue;
      context.fillStyle = colorWithAlpha(row.color, index === activeIndex ? 0.95 : 0.45);
      roundedRect(context, x, y, cell * 0.62, heightValue, 4);
      context.fill();
      context.fillStyle = index === activeIndex ? PALETTE.paper : colorWithAlpha(PALETTE.paper, 0.55);
      context.font = `${Math.max(9, width / 105)}px ui-monospace, monospace`;
      context.save();
      context.translate(x + cell * 0.3, bottom + 7);
      context.rotate(-Math.PI / 3);
      context.fillText(row.id.toUpperCase(), 0, 0);
      context.restore();
    });

    const active = rows[activeIndex] || rows[0];
    const shape =
      active && active.id === "cube"
        ? SHAPES.cube
        : active && active.id === "octa"
          ? SHAPES.octahedron
          : active && active.id === "ve"
            ? SHAPES.vectorEquilibrium
            : SHAPES.tetrahedron;
    drawShape(context, shape, {
      x: width * 0.78,
      y: height * 0.5,
      scale: Math.min(width, height) * 0.16,
      rotationX: 0.45 + rotation.x,
      rotationY: beat * 0.08 + rotation.y,
      color: active ? active.color : PALETTE.brass,
      pointRadius: 2.8,
    });
  }

  function drawCounterpoint(context, width, height, score, beat) {
    const exchanges = score.visual.exchanges || 12;
    const centerY = height * 0.5;
    const leftX = width * 0.18;
    const rightX = width * 0.82;
    const progress = beat / score.durationBeats;

    context.strokeStyle = colorWithAlpha(PALETTE.paper, 0.16);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(leftX, centerY);
    context.lineTo(rightX, centerY);
    context.stroke();

    for (let index = 0; index < exchanges; index += 1) {
      const y = height * (0.12 + (0.76 * index) / Math.max(1, exchanges - 1));
      const phase = (progress * exchanges - index + exchanges) % exchanges;
      const active = phase < 1;
      context.fillStyle = colorWithAlpha(PALETTE.copper, active ? 0.98 : 0.32);
      context.beginPath();
      context.arc(leftX, y, active ? 5 : 2.3, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = colorWithAlpha(PALETTE.green, active ? 0.98 : 0.32);
      context.beginPath();
      context.arc(rightX, y, active ? 5 : 2.3, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = colorWithAlpha(active ? PALETTE.pale : PALETTE.line, active ? 0.7 : 0.28);
      context.beginPath();
      context.moveTo(leftX, y);
      context.bezierCurveTo(width * 0.4, y - 30, width * 0.6, y + 30, rightX, y);
      context.stroke();
    }
    context.fillStyle = PALETTE.paper;
    context.font = `600 ${Math.max(12, width / 70)}px system-ui, sans-serif`;
    context.textAlign = "center";
    context.fillText("FULLER STRAND", leftX, height * 0.07);
    context.fillText("APPLEWHITE STRAND", rightX, height * 0.07);
    context.textAlign = "start";
  }

  function drawFrequency(context, width, height, score, beat) {
    const rows = score.visual.rows || [];
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const primes = [1, 2, 3, 5];
    const activeIndex = Math.min(
      rows.length - 1,
      Math.floor((beat / score.durationBeats) * rows.length)
    );
    primes.forEach((prime, primeIndex) => {
      const angle = -Math.PI / 2 + (primeIndex / primes.length) * Math.PI * 2;
      const laneX = centerX + Math.cos(angle) * Math.min(width, height) * 0.3;
      const laneY = centerY + Math.sin(angle) * Math.min(width, height) * 0.3;
      context.strokeStyle = colorWithAlpha(PALETTE.brass, 0.25);
      context.beginPath();
      context.moveTo(centerX, centerY);
      context.lineTo(laneX, laneY);
      context.stroke();
      context.fillStyle = PALETTE.paper;
      context.font = `600 ${Math.max(12, width / 75)}px ui-monospace, monospace`;
      context.textAlign = "center";
      context.fillText(`N=${prime}`, laneX, laneY - 12);
    });

    rows.forEach((row, index) => {
      const primeIndex = primes.indexOf(row.prime);
      const angle =
        -Math.PI / 2 +
        (primeIndex / primes.length) * Math.PI * 2 +
        (row.frequency - 1) * 0.08;
      const radius =
        Math.min(width, height) * (0.085 + 0.055 * row.frequency);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const active = index === activeIndex;
      context.fillStyle = colorWithAlpha(active ? PALETTE.amber : PALETTE.green, active ? 1 : 0.42);
      context.beginPath();
      context.arc(x, y, active ? 7 : 3, 0, Math.PI * 2);
      context.fill();
      if (active) {
        context.fillStyle = PALETTE.paper;
        context.font = `${Math.max(10, width / 90)}px ui-monospace, monospace`;
        context.textAlign = "left";
        context.fillText(`F=${row.frequency} · X=${row.population}`, x + 10, y + 4);
      }
    });
    context.textAlign = "start";
    context.fillStyle = PALETTE.pale;
    context.beginPath();
    context.arc(centerX, centerY, 4, 0, Math.PI * 2);
    context.fill();
  }

  function drawWeb(context, width, height, score, beat) {
    const nodes = score.visual.sourceNodes || [];
    const links = score.visual.links || [];
    const radius = Math.min(width, height) * 0.32;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const positions = nodes.map((_node, index) => {
      const angle = -Math.PI / 2 + (index / nodes.length) * Math.PI * 2;
      return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
    });
    const activeIndex = Math.floor((beat / score.durationBeats) * nodes.length) % Math.max(1, nodes.length);

    links.forEach(([from, to], index) => {
      const active = index === activeIndex;
      context.strokeStyle = colorWithAlpha(active ? PALETTE.pale : PALETTE.line, active ? 0.88 : 0.24);
      context.lineWidth = active ? 2 : 1;
      context.beginPath();
      context.moveTo(positions[from][0], positions[from][1]);
      context.quadraticCurveTo(centerX, centerY, positions[to][0], positions[to][1]);
      context.stroke();
    });
    positions.forEach((position, index) => {
      const active = index === activeIndex;
      context.fillStyle = colorWithAlpha(index < 6 ? PALETTE.brass : PALETTE.green, active ? 1 : 0.54);
      context.beginPath();
      context.arc(position[0], position[1], active ? 7 : 3.5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = colorWithAlpha(PALETTE.paper, active ? 1 : 0.52);
      context.font = `${Math.max(9, width / 110)}px ui-monospace, monospace`;
      context.textAlign = position[0] < centerX ? "right" : "left";
      context.fillText(`${index + 1}`, position[0] + (position[0] < centerX ? -8 : 8), position[1] + 3);
    });
    context.textAlign = "center";
    context.fillStyle = PALETTE.paper;
    context.font = `600 ${Math.max(13, width / 66)}px system-ui, sans-serif`;
    context.fillText("PRESERVED SECTION NETWORK", centerX, centerY + 5);
    context.textAlign = "start";
  }

  function drawModules(context, width, height, score, beat) {
    const columns = 8;
    const rows = 6;
    const gap = Math.max(4, width * 0.007);
    const cellWidth = Math.min(58, (width * 0.72 - gap * (columns - 1)) / columns);
    const cellHeight = Math.min(46, (height * 0.68 - gap * (rows - 1)) / rows);
    const originX = width * 0.5 - (cellWidth * columns + gap * (columns - 1)) / 2;
    const originY = height * 0.5 - (cellHeight * rows + gap * (rows - 1)) / 2;
    const count = Math.min(columns * rows, score.visual.ticks || 24);
    const active = Math.floor((beat / score.durationBeats) * count) % count;

    for (let index = 0; index < count; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = originX + column * (cellWidth + gap);
      const y = originY + row * (cellHeight + gap);
      const isB = index % 3 === 2;
      const isActive = index === active;
      context.fillStyle = colorWithAlpha(isB ? PALETTE.green : PALETTE.moss, isActive ? 0.95 : 0.25);
      context.strokeStyle = colorWithAlpha(isActive ? PALETTE.paper : PALETTE.line, isActive ? 0.8 : 0.42);
      context.lineWidth = isActive ? 2 : 1;
      roundedRect(context, x, y, cellWidth, cellHeight, 5);
      context.fill();
      context.stroke();
      context.fillStyle = isActive ? PALETTE.ink : colorWithAlpha(PALETTE.paper, 0.62);
      context.font = `600 ${Math.max(9, width / 100)}px ui-monospace, monospace`;
      context.textAlign = "center";
      context.fillText(isB ? "B" : "A", x + cellWidth / 2, y + cellHeight / 2 + 4);
    }
    context.textAlign = "start";
  }

  function drawJitterbug(context, width, height, score, beat, rotation) {
    const phase = beat / score.durationBeats;
    const contraction = 1 - phase * 0.52;
    const shape = SHAPES.vectorEquilibrium;
    const scaled = {
      vertices: shape.vertices.map(([x, y, z], index) => {
        const fold = Math.sin(phase * Math.PI) * (index % 2 ? 0.32 : -0.32);
        return [x * contraction, y * contraction, z * contraction + fold];
      }),
      edges: shape.edges,
    };
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    drawShape(context, scaled, {
      x: centerX,
      y: centerY,
      scale: Math.min(width, height) * 0.24,
      rotationX: 0.5 + rotation.x,
      rotationY: phase * Math.PI * 2 + rotation.y,
      color: PALETTE.rust,
      lineWidth: 2,
      pointRadius: 3,
    });
    context.strokeStyle = colorWithAlpha(PALETTE.pale, 0.32);
    context.lineWidth = 7;
    context.beginPath();
    context.arc(centerX, centerY, Math.min(width, height) * 0.34, -Math.PI / 2, -Math.PI / 2 + phase * Math.PI * 2);
    context.stroke();
    context.fillStyle = PALETTE.paper;
    context.font = `600 ${Math.max(12, width / 72)}px ui-monospace, monospace`;
    context.textAlign = "center";
    context.fillText(`CONTRACTION PHASE ${(phase * 100).toFixed(0)}%`, centerX, height * 0.9);
    context.textAlign = "start";
  }

  function drawCoda(context, width, height, score, beat, rotation) {
    const segments = score.visual.segments || [];
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const radius = Math.min(width, height) * 0.34;
    const phase = beat / score.durationBeats;
    segments.forEach((segment, index) => {
      const angle = -Math.PI / 2 + (index / segments.length) * Math.PI * 2;
      const nextAngle = -Math.PI / 2 + ((index + 1) / segments.length) * Math.PI * 2;
      const active =
        beat >= segment.start &&
        beat < (segments[index + 1] ? segments[index + 1].start : score.durationBeats);
      context.strokeStyle = colorWithAlpha(active ? PALETTE.pale : PALETTE.brass, active ? 1 : 0.28);
      context.lineWidth = active ? 7 : 3;
      context.beginPath();
      context.arc(centerX, centerY, radius, angle + 0.025, nextAngle - 0.025);
      context.stroke();
      const labelX = centerX + Math.cos((angle + nextAngle) / 2) * radius * 1.18;
      const labelY = centerY + Math.sin((angle + nextAngle) / 2) * radius * 1.18;
      context.fillStyle = colorWithAlpha(PALETTE.paper, active ? 1 : 0.52);
      context.font = `${Math.max(9, width / 105)}px ui-monospace, monospace`;
      context.textAlign = "center";
      context.fillText(segment.labId.toUpperCase(), labelX, labelY + 3);
    });
    drawShape(context, SHAPES.tetrahedron, {
      x: centerX,
      y: centerY,
      scale: Math.min(width, height) * (0.11 + Math.sin(phase * Math.PI * 2) * 0.008),
      rotationX: 0.52 + rotation.x,
      rotationY: phase * Math.PI * 2 + rotation.y,
      color: PALETTE.pale,
      lineWidth: 2,
      pointRadius: 3,
    });
    context.textAlign = "start";
  }

  function drawEventReadout(context, width, height, event, score, beat) {
    const padding = Math.max(12, width * 0.018);
    const boxHeight = Math.max(46, height * 0.095);
    context.fillStyle = "rgba(10,12,11,0.78)";
    context.strokeStyle = colorWithAlpha(PALETTE.brass, 0.35);
    roundedRect(context, padding, height - boxHeight - padding, width - padding * 2, boxHeight, 8);
    context.fill();
    context.stroke();
    context.fillStyle = PALETTE.paper;
    context.font = `600 ${Math.max(11, width / 82)}px system-ui, sans-serif`;
    context.fillText(event ? event.label : score.title, padding * 1.7, height - boxHeight * 0.62 - padding);
    context.fillStyle = colorWithAlpha(PALETTE.paper, 0.62);
    context.font = `${Math.max(9, width / 105)}px ui-monospace, monospace`;
    const detail = event
      ? `${event.datum} · ${event.frequency.toFixed(2)} Hz · ${event.sourceId}`
      : `beat ${beat.toFixed(2)} / ${score.durationBeats} · ${score.fingerprint}`;
    context.fillText(detail.slice(0, 118), padding * 1.7, height - boxHeight * 0.27 - padding);
  }

  function draw(canvas, state) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const score = state.score;
    const beat = state.beat || 0;
    const time = state.time || 0;
    const rotation = state.rotation || { x: 0, y: 0 };
    drawBackground(context, width, height, time);

    switch (score.labId) {
      case "shells":
        drawShells(context, width, height, score, beat);
        break;
      case "hierarchy":
        drawHierarchy(context, width, height, score, beat, rotation);
        break;
      case "counterpoint":
        drawCounterpoint(context, width, height, score, beat);
        break;
      case "frequency":
        drawFrequency(context, width, height, score, beat);
        break;
      case "web":
        drawWeb(context, width, height, score, beat);
        break;
      case "modules":
        drawModules(context, width, height, score, beat);
        break;
      case "jitterbug":
        drawJitterbug(context, width, height, score, beat, rotation);
        break;
      case "coda":
        drawCoda(context, width, height, score, beat, rotation);
        break;
      default:
        drawShape(context, SHAPES.tetrahedron, {
          x: width / 2,
          y: height / 2,
          scale: Math.min(width, height) * 0.2,
          rotationX: rotation.x,
          rotationY: rotation.y,
          color: PALETTE.brass,
        });
    }

    drawEventReadout(context, width, height, state.activeEvent || null, score, beat);
  }

  root.SynSonVisuals = Object.freeze({
    palette: PALETTE,
    shapes: SHAPES,
    draw,
  });
})(typeof window !== "undefined" ? window : globalThis);
