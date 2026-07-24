// main.js
// Wires gate buttons to the quantum math + Bloch sphere renderer, and keeps
// the amplitude/probability readout and the circuit strip in sync.

(function () {
  let state = window.Quantum.initialState();
  let history = [];

  const circuitStrip = document.getElementById('circuitStrip');
  const readout = {
    alphaRe: document.getElementById('alphaRe'),
    alphaIm: document.getElementById('alphaIm'),
    betaRe: document.getElementById('betaRe'),
    betaIm: document.getElementById('betaIm'),
    p0: document.getElementById('p0'),
    p1: document.getElementById('p1'),
    p0bar: document.getElementById('p0bar'),
    p1bar: document.getElementById('p1bar'),
    theta: document.getElementById('thetaVal'),
    phi: document.getElementById('phiVal'),
  };

  const thetaSlider = document.getElementById('thetaSlider');
  const thetaLabel = document.getElementById('thetaSliderLabel');

  function fmt(n) {
    return (Math.abs(n) < 0.0005 ? 0 : n).toFixed(3);
  }

  function updateReadout() {
    const [p0, p1] = window.Quantum.probabilities(state);
    readout.alphaRe.textContent = fmt(state[0][0]);
    readout.alphaIm.textContent = fmt(state[0][1]);
    readout.betaRe.textContent = fmt(state[1][0]);
    readout.betaIm.textContent = fmt(state[1][1]);
    readout.p0.textContent = fmt(p0);
    readout.p1.textContent = fmt(p1);
    readout.p0bar.style.width = `${p0 * 100}%`;
    readout.p1bar.style.width = `${p1 * 100}%`;

    const v = window.Quantum.blochVector(state);
    const theta = Math.acos(Math.max(-1, Math.min(1, v.z))) * (180 / Math.PI);
    const phi = Math.atan2(v.y, v.x) * (180 / Math.PI);
    readout.theta.textContent = `${theta.toFixed(1)}°`;
    readout.phi.textContent = `${phi.toFixed(1)}°`;
  }

  function appendChip(label) {
    if (circuitStrip.querySelector('.circuit-empty')) {
      circuitStrip.innerHTML = '';
    }
    const chip = document.createElement('span');
    chip.className = 'gate-chip';
    chip.textContent = label;
    circuitStrip.appendChild(chip);
    circuitStrip.scrollLeft = circuitStrip.scrollWidth;
  }

  function applyGate(matrix, label) {
    state = window.Quantum.applyMatrix(state, matrix);
    history.push(label);
    const v = window.Quantum.blochVector(state);
    window.Bloch.setState(v, true);
    updateReadout();
    appendChip(label);
  }

  function resetAll() {
    state = window.Quantum.initialState();
    history = [];
    window.Bloch.reset();
    updateReadout();
    circuitStrip.innerHTML = '<span class="circuit-empty">|0⟩ — no gates applied yet</span>';
  }

  document.querySelectorAll('[data-gate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const g = btn.getAttribute('data-gate');
      applyGate(window.Quantum.gates[g], g);
    });
  });

  document.querySelectorAll('[data-rotation]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const axis = btn.getAttribute('data-rotation');
      const multiple = parseFloat(thetaSlider.value);
      const theta = multiple * Math.PI;
      const matrixFn = { RX: window.Quantum.RX, RY: window.Quantum.RY, RZ: window.Quantum.RZ }[axis];
      applyGate(matrixFn(theta), `${axis}(${multiple.toFixed(2)}π)`);
    });
  });

  if (thetaSlider) {
    const syncLabel = () => {
      thetaLabel.textContent = `θ = ${parseFloat(thetaSlider.value).toFixed(2)}π`;
    };
    thetaSlider.addEventListener('input', syncLabel);
    syncLabel();
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetAll);

  // mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // init
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('blochContainer');
    if (container) {
      window.Bloch.init(container);
      updateReadout();
    }
  });
})();
