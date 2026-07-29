/**
 * Unit polyhedra for canvas wireframe drawing.
 * Coordinates chosen so tetra / octa / cube / VE share the IVM edge length scale
 * where possible (VE radius = edge = 1 in Fuller's convention).
 */

const GEOM = (() => {
  const PHI = (1 + Math.sqrt(5)) / 2;
  const inv = 1 / Math.SQRT2;

  // Regular tetrahedron (unit midradius-ish; edge ≈ √2)
  const tet = {
    verts: [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ].map((v) => scale(v, 1 / Math.sqrt(3))),
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ],
  };

  // Octahedron dual of cube; edge √2 if verts at unit axes
  const octa = {
    verts: [
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
  };

  // Cube
  const cube = {
    verts: [
      [1, 1, 1],
      [1, 1, -1],
      [1, -1, 1],
      [1, -1, -1],
      [-1, 1, 1],
      [-1, 1, -1],
      [-1, -1, 1],
      [-1, -1, -1],
    ].map((v) => scale(v, inv)),
    edges: [
      [0, 1],
      [0, 2],
      [0, 4],
      [1, 3],
      [1, 5],
      [2, 3],
      [2, 6],
      [3, 7],
      [4, 5],
      [4, 6],
      [5, 7],
      [6, 7],
    ],
  };

  // Vector Equilibrium = cuboctahedron, radius = edge = 1
  // Vertices: all permutations of (±1, ±1, 0)
  const veVerts = [];
  for (const a of [1, -1]) {
    for (const b of [1, -1]) {
      veVerts.push([a, b, 0], [a, 0, b], [0, a, b]);
    }
  }
  // Unique & normalize to radius 1 (already √2 mid — scale by 1/√2 for unit radius)
  const veUnique = uniqueVerts(veVerts).map((v) => scale(v, inv));
  const ve = {
    verts: veUnique,
    edges: edgesByLength(veUnique, 1, 0.08),
  };

  // Icosahedron (unit circumradius approx)
  const icoRaw = [];
  for (const s of [1, -1]) {
    for (const t of [1, -1]) {
      icoRaw.push([0, s, t * PHI], [s, t * PHI, 0], [t * PHI, 0, s]);
    }
  }
  const icoScale = 1 / Math.hypot(0, 1, PHI);
  const icosa = {
    verts: icoRaw.map((v) => scale(v, icoScale)),
    edges: null,
  };
  // Icosahedron: 5 edges per vertex
  icosa.edges = nearestEdges(icosa.verts, 5);

  // Rhombic dodecahedron (simplified wireframe — dual of VE)
  // Vertices: cube verts + octa verts scaled
  const rdVerts = [
    ...[1, -1].flatMap((x) =>
      [1, -1].flatMap((y) => [1, -1].map((z) => scale([x, y, z], inv)))
    ),
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  // Actually cube verts at (±1,±1,±1)/√3 and octa at (±√(2/3)?,0,0) — standard RD:
  // verts: all perm of (±1,±1,±1) and (±2,0,0)
  const rd = {
    verts: [
      ...[1, -1].flatMap((x) =>
        [1, -1].flatMap((y) => [1, -1].map((z) => [x, y, z]))
      ),
      [2, 0, 0],
      [-2, 0, 0],
      [0, 2, 0],
      [0, -2, 0],
      [0, 0, 2],
      [0, 0, -2],
    ].map((v) => scale(v, 0.4)),
    edges: null,
  };
  rd.edges = nearestEdges(rd.verts, 4);

  function scale(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
  }

  function uniqueVerts(list, eps = 1e-9) {
    const out = [];
    for (const v of list) {
      if (!out.some((u) => dist(u, v) < eps)) out.push(v);
    }
    return out;
  }

  function dist(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  function edgeLen(a, b) {
    return dist(a, b);
  }

  function edgesByLength(verts, target, tol) {
    const e = [];
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        if (Math.abs(dist(verts[i], verts[j]) - target) < tol) e.push([i, j]);
      }
    }
    return e;
  }

  function nearestEdges(verts, k) {
    const set = new Set();
    const edges = [];
    for (let i = 0; i < verts.length; i++) {
      const d = verts
        .map((v, j) => ({ j, d: dist(verts[i], v) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, k);
      for (const { j } of d) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!set.has(key)) {
          set.add(key);
          edges.push([i, j]);
        }
      }
    }
    return edges;
  }

  /**
   * Jitterbug: rotate triangular faces of VE.
   * Parameter t in [0,1]: 0 = VE, ~0.35 icosa-ish, ~0.7 octa, 1 collapsed.
   * Simplified model: scale square diagonals / rotate triangles.
   */
  function jitterbugMesh(t) {
    // Start from VE verts; rotate each triangular set about its normal
    // Practical approach: lerp VE → octa by contracting along square axes
    // while rotating. Use explicit interpolation of known stages.
    const veV = ve.verts;
    // Octa: 6 verts — map 12 VE verts toward 6 octa poles by pairing
    // Simpler visual: rotate VE verts around axes with scale factor
    const angle = t * (Math.PI / 2) * 0.85;
    const radScale = 1 - t * 0.55;
    const out = veV.map((v, i) => {
      // Alternate rotation sense for dual tetrahedral sets
      const sense = i % 2 === 0 ? 1 : -1;
      const [x, y, z] = v;
      // Approximate jitterbug twist in XY then YZ
      const c = Math.cos(angle * sense);
      const s = Math.sin(angle * sense);
      let nx = x * c - y * s;
      let ny = x * s + y * c;
      let nz = z;
      // second axis twist
      const c2 = Math.cos(angle * 0.5 * sense);
      const s2 = Math.sin(angle * 0.5 * sense);
      const ny2 = ny * c2 - nz * s2;
      const nz2 = ny * s2 + nz * c2;
      return scale([nx, ny2, nz2], radScale);
    });
    return { verts: out, edges: ve.edges };
  }

  /** Jitterbug mesh with fixed VE edge topology */
  function jitterbug(t) {
    return jitterbugMesh(t);
  }

  const shapes = {
    tet,
    octa,
    cube,
    ve,
    icosa,
    rd,
    "a-mod": tet, // visual proxy
    "b-mod": tet,
    mite: tet,
    coupler: octa,
    rt5: icosa,
    cube2f: cube,
  };

  function rotateX(v, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
  }
  function rotateY(v, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
  }
  function rotateZ(v, a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  }

  function project(v, w, h, scale = 140) {
    // perspective
    const z = v[2] + 3.2;
    const f = scale / z;
    return [w / 2 + v[0] * f, h / 2 - v[1] * f, z];
  }

  function drawPolyhedron(ctx, shape, opts = {}) {
    const {
      rotX = 0.4,
      rotY = 0.6,
      color = "#7dd3fc",
      alpha = 0.9,
      scale = 140,
      highlightVerts = [],
      pulse = 0,
    } = opts;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    let verts = shape.verts.map((v) => rotateY(rotateX(v, rotX), rotY));
    const projected = verts.map((v) => project(v, w, h, scale * (1 + pulse * 0.05)));
    // depth-sort edges
    const edges = (shape.edges || []).map(([a, b]) => {
      const za = projected[a][2];
      const zb = projected[b][2];
      return { a, b, z: (za + zb) / 2 };
    });
    edges.sort((p, q) => q.z - p.z);

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    for (const e of edges) {
      const pa = projected[e.a];
      const pb = projected[e.b];
      const depth = 1 - (e.z - 2) / 4;
      ctx.strokeStyle = hexAlpha(color, alpha * Math.max(0.2, Math.min(1, depth)));
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();
    }
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      const hi = highlightVerts.includes(i);
      ctx.beginPath();
      ctx.arc(p[0], p[1], hi ? 5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = hi ? "#fef08a" : hexAlpha(color, 0.85);
      ctx.fill();
    }
    ctx.restore();
  }

  function hexAlpha(hex, a) {
    const h = hex.replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  /** Draw concentric sphere-pack shells as rings of dots */
  function drawShells(ctx, freq, opts = {}) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const color = opts.color || "#38bdf8";
    const active = opts.activeLayer ?? freq;
    ctx.save();
    // nucleus
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#fef08a";
    ctx.fill();
    for (let F = 1; F <= freq; F++) {
      const n = 10 * F * F + 2;
      const R = 18 + F * 28;
      const hi = F === active;
      for (let i = 0; i < n; i++) {
        // Fibonacci-ish sphere projection to 2D ring with slight radial jitter
        const ang = (i / n) * Math.PI * 2 + F * 0.15;
        const rr = R + Math.sin(i * 1.7 + F) * 3;
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr * 0.72;
        ctx.beginPath();
        ctx.arc(x, y, hi ? 3.2 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(hi ? "#f472b6" : color, hi ? 0.95 : 0.35 + F * 0.08);
        ctx.fill();
      }
      // ring
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * 0.72, 0, 0, Math.PI * 2);
      ctx.strokeStyle = hexAlpha(color, hi ? 0.45 : 0.12);
      ctx.lineWidth = hi ? 1.5 : 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Volume bar chart for hierarchy */
  function drawVolumeBars(ctx, items, activeId, opts = {}) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const pad = 40;
    const maxVol = Math.max(...items.map((i) => i.vol));
    const barW = (w - pad * 2) / items.length;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = "rgba(148,163,184,0.15)";
    ctx.fillStyle = "rgba(148,163,184,0.5)";
    ctx.font = "11px ui-monospace, monospace";
    for (const mark of [1, 4, 6, 20]) {
      const y = h - pad - (mark / maxVol) * (h - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
      ctx.fillText(String(mark), 8, y + 3);
    }
    items.forEach((it, i) => {
      const bh = (it.vol / maxVol) * (h - pad * 2);
      const x = pad + i * barW + 4;
      const y = h - pad - bh;
      const active = it.id === activeId;
      ctx.fillStyle = active ? it.color : hexAlpha(it.color, 0.45);
      ctx.fillRect(x, y, barW - 8, bh);
      if (active) {
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barW - 8, bh);
      }
      ctx.save();
      ctx.translate(x + barW / 2 - 4, h - pad + 12);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = active ? "#f1f5f9" : "#94a3b8";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(it.short, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  return {
    shapes,
    jitterbug,
    drawPolyhedron,
    drawShells,
    drawVolumeBars,
    rotateX,
    rotateY,
    PHI,
  };
})();

window.GEOM = GEOM;
