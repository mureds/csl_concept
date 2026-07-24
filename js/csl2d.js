// csl2d.js — minimal 2D CSL engine (dependency-free).
// Same-lattice Coincidence Site Lattice: rotate one copy of a lattice by θ,
// find coincident sites, quantify with Σ. Also the Ranganathan Σ–θ series and
// the Brandon criterion for the famous CSL scatter plot.

// Generate 2D square-lattice points (spacing a) within a half-window R, rotated θ°.
export function lattice2D(a, rotDeg, R) {
  const t = rotDeg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  const n = Math.ceil(R * 1.6 / a) + 1, pts = [];
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const x = i * a, y = j * a;
      const X = x * c - y * s, Y = x * s + y * c;
      if (Math.abs(X) <= R && Math.abs(Y) <= R) pts.push([X, Y]);
    }
  return pts;
}

// Coincidences: B points within tol of some A point (uniform hash, ~O(N)).
export function coincidences2D(A, B, tol) {
  const cell = Math.max(tol, 1e-6), grid = new Map();
  const key = (x, y) => x + ',' + y, gc = (v) => Math.round(v / cell);
  for (const p of A) { const k = key(gc(p[0]), gc(p[1])); (grid.get(k) || grid.set(k, []).get(k)).push(p); }
  const out = [], t2 = tol * tol;
  for (const b of B) {
    const bx = gc(b[0]), by = gc(b[1]); let best = null, bd = t2;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const arr = grid.get(key(bx + dx, by + dy)); if (!arr) continue;
      for (const a of arr) { const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2; if (d < bd) { bd = d; best = b; } }
    }
    if (best) out.push(best);
  }
  return out;
}

// Ranganathan CSL for a cubic rotation axis. Σ = (m² + N·p²) with 2-factors
// removed; θ = 2·atan(p·√N / m).  N = h²+k²+l² of the axis.
// axis '001' → N=1 (also the 2D square-lattice twist series).
export function sigmaSeries(axisN, maxSigma = 51) {
  const N = axisN, out = [], seen = new Set();
  for (let m = 1; m <= 30; m++)
    for (let p = 0; p <= 30; p++) {
      if (m === 0 && p === 0) continue;
      let sigma = m * m + p * p * N;
      while (sigma % 2 === 0) sigma /= 2;
      if (sigma < 1 || sigma > maxSigma) continue;
      const theta = 2 * Math.atan2(p * Math.sqrt(N), m) * 180 / Math.PI;
      if (theta < 0.01 || theta > 90.001) continue;
      const k = sigma + '@' + theta.toFixed(2);
      if (seen.has(k)) continue; seen.add(k);
      out.push({ sigma, theta });
    }
  out.sort((x, y) => x.theta - y.theta);
  return out;
}

// Brandon criterion: maximum deviation still counted as a Σ boundary.
export const brandon = (sigma, theta0 = 15) => theta0 / Math.sqrt(sigma);

// Nearest CSL (from a series) to a given angle, and whether within Brandon band.
export function nearestCSL(series, theta) {
  let best = null;
  for (const s of series) {
    const d = Math.abs(s.theta - theta);
    if (!best || d < best.d) best = { ...s, d };
  }
  if (!best) return null;
  best.withinBrandon = best.d <= brandon(best.sigma);
  return best;
}

// CSL cell area factor for the current angle = Σ if it is an exact CSL angle.
// (Area of coincidence superlattice / area of primitive cell.)
