// main.js — CSL concept visualizer: 2D coincidence lattice + Σ–θ scatter.
import { lattice2D, coincidences2D, sigmaSeries, brandon, nearestCSL } from './csl2d.js';

const $ = (id) => document.getElementById(id);
const cvLat = $('cvLat'), gL = cvLat.getContext('2d');
const cvSc = $('cvScatter'), gS = cvSc.getContext('2d');

const state = { theta: 0, region: 8, tol: 0.12, axisN: 1, showCoin: true };
let seriesLat = sigmaSeries(1, 49);          // 2D square viz always uses [001]/square
let seriesSc = sigmaSeries(1, 49);           // scatter series (axis-selectable)

function fitCanvas(cv, g) {
  const dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect();
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: r.width, h: r.height };
}

// ---------- 2D coincidence lattice ----------
function drawLattice() {
  const { w, h } = fitCanvas(cvLat, gL);
  gL.clearRect(0, 0, w, h);
  const R = state.region, sc = (Math.min(w, h) / 2 - 12) / R, cx = w / 2, cy = h / 2;
  const A = lattice2D(1, 0, R), B = lattice2D(1, state.theta, R);
  const tol = state.tol;
  const coin = state.showCoin ? coincidences2D(A, B, tol) : [];
  const X = (p) => cx + p[0] * sc, Y = (p) => cy - p[1] * sc;
  const dot = (p, r, fill) => { gL.beginPath(); gL.arc(X(p), Y(p), r, 0, 7); gL.fillStyle = fill; gL.fill(); };
  for (const p of A) dot(p, 3.4, 'rgba(232,138,58,.92)');
  for (const p of B) dot(p, 2.7, 'rgba(90,160,255,.85)');
  for (const p of coin) { gL.beginPath(); gL.arc(X(p), Y(p), 8, 0, 7); gL.strokeStyle = 'rgba(80,230,140,.95)'; gL.lineWidth = 2; gL.stroke(); }
  // readout
  const near = nearestCSL(seriesLat, state.theta);
  $('r-theta').textContent = state.theta.toFixed(1) + '°';
  $('r-coin').textContent = coin.length;
  if (near) {
    $('r-sigma').textContent = 'Σ' + near.sigma + (near.withinBrandon ? '' : ' (밖)');
    $('r-dev').textContent = near.d.toFixed(2) + '° / ±' + brandon(near.sigma).toFixed(2) + '°';
  }
}

// ---------- Σ–θ scatter (the famous CSL plot) ----------
function drawScatter() {
  const { w, h } = fitCanvas(cvSc, gS);
  gS.clearRect(0, 0, w, h);
  const mL = 42, mR = 12, mT = 12, mB = 30, maxSig = 49;
  const px = (t) => mL + (t / 90) * (w - mL - mR);
  const py = (sig) => mT + (Math.log(sig) / Math.log(maxSig)) * (h - mT - mB); // low Σ on top
  // axes
  gS.strokeStyle = 'rgba(255,255,255,.18)'; gS.lineWidth = 1; gS.fillStyle = '#8b97a8'; gS.font = '11px system-ui';
  gS.beginPath(); gS.moveTo(mL, mT); gS.lineTo(mL, h - mB); gS.lineTo(w - mR, h - mB); gS.stroke();
  for (const t of [0, 15, 30, 45, 60, 75, 90]) { const x = px(t); gS.strokeStyle = 'rgba(255,255,255,.06)'; gS.beginPath(); gS.moveTo(x, mT); gS.lineTo(x, h - mB); gS.stroke(); gS.fillText(t + '°', x - 8, h - mB + 16); }
  for (const sg of [1, 3, 5, 9, 13, 25, 49]) { const y = py(sg); gS.fillText('Σ' + sg, 6, y + 3); }
  gS.fillText('misorientation θ →', w / 2 - 40, h - 4);
  // Brandon band (horizontal ± in θ) + points
  for (const s of seriesSc) {
    const x = px(s.theta), y = py(s.sigma), bw = (brandon(s.sigma) / 90) * (w - mL - mR);
    gS.strokeStyle = 'rgba(110,168,254,.25)'; gS.lineWidth = 4;
    gS.beginPath(); gS.moveTo(x - bw, y); gS.lineTo(x + bw, y); gS.stroke();
    const rad = Math.max(3, 8 - Math.log(s.sigma) * 1.5);
    gS.beginPath(); gS.arc(x, y, rad, 0, 7);
    gS.fillStyle = s.sigma <= 9 ? 'rgba(80,230,140,.95)' : 'rgba(90,160,255,.9)'; gS.fill();
  }
  // current θ marker
  const xt = px(state.theta);
  gS.strokeStyle = 'rgba(232,138,58,.95)'; gS.lineWidth = 2;
  gS.beginPath(); gS.moveTo(xt, mT); gS.lineTo(xt, h - mB); gS.stroke();
}

function refresh() { drawLattice(); drawScatter(); }

// ---------- controls ----------
function fillSnap() {
  const sel = $('snap'); sel.innerHTML = '<option value="">— Σ 각도로 이동 —</option>' +
    seriesLat.filter(s => s.sigma <= 25).map(s => `<option value="${s.theta}">Σ${s.sigma} — ${s.theta.toFixed(2)}°</option>`).join('');
}
$('theta').addEventListener('input', e => { state.theta = parseFloat(e.target.value); $('theta-v').textContent = state.theta.toFixed(1) + '°'; refresh(); });
$('region').addEventListener('input', e => { state.region = parseFloat(e.target.value); $('region-v').textContent = state.region + ' cells'; refresh(); });
$('tol').addEventListener('input', e => { state.tol = parseFloat(e.target.value); $('tol-v').textContent = (state.tol * 100).toFixed(0) + '%'; refresh(); });
$('axis').addEventListener('change', e => { state.axisN = parseInt(e.target.value); seriesSc = sigmaSeries(state.axisN, 49); refresh(); });
$('tg-coin').addEventListener('change', e => { state.showCoin = e.target.checked; refresh(); });
$('snap').addEventListener('change', e => { if (e.target.value) { state.theta = parseFloat(e.target.value); $('theta').value = state.theta; $('theta-v').textContent = state.theta.toFixed(1) + '°'; refresh(); } });
// click scatter to jump θ
cvSc.addEventListener('click', e => {
  const r = cvSc.getBoundingClientRect(), mL = 42, mR = 12;
  const t = ((e.clientX - r.left - mL) / (r.width - mL - mR)) * 90;
  if (t >= 0 && t <= 90) { state.theta = Math.round(t * 10) / 10; $('theta').value = state.theta; $('theta-v').textContent = state.theta.toFixed(1) + '°'; refresh(); }
});
window.addEventListener('resize', refresh);

fillSnap();
$('region-v').textContent = state.region + ' cells';
$('tol-v').textContent = (state.tol * 100).toFixed(0) + '%';
requestAnimationFrame(() => { refresh(); requestAnimationFrame(refresh); });
window.addEventListener('load', refresh);
