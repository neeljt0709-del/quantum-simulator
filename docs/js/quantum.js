// quantum.js
// Minimal complex-number single-qubit gate math, mirroring the gate
// definitions in the Python Statevector class (H, X, Y, Z, RX, RY, RZ).
// Complex numbers are represented as [re, im] pairs. A state is [alpha, beta].

(function (global) {
  const SQRT1_2 = 1 / Math.sqrt(2);

  function cmul(a, b) {
    return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  }
  function cadd(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
  }

  function applyMatrix(state, m) {
    const newAlpha = cadd(cmul(m[0][0], state[0]), cmul(m[0][1], state[1]));
    const newBeta = cadd(cmul(m[1][0], state[0]), cmul(m[1][1], state[1]));
    return [newAlpha, newBeta];
  }

  const gates = {
    H: [
      [[SQRT1_2, 0], [SQRT1_2, 0]],
      [[SQRT1_2, 0], [-SQRT1_2, 0]],
    ],
    X: [
      [[0, 0], [1, 0]],
      [[1, 0], [0, 0]],
    ],
    Y: [
      [[0, 0], [0, -1]],
      [[0, 1], [0, 0]],
    ],
    Z: [
      [[1, 0], [0, 0]],
      [[0, 0], [-1, 0]],
    ],
  };

  function RX(theta) {
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    return [
      [[c, 0], [0, -s]],
      [[0, -s], [c, 0]],
    ];
  }
  function RY(theta) {
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    return [
      [[c, 0], [-s, 0]],
      [[s, 0], [c, 0]],
    ];
  }
  function RZ(theta) {
    return [
      [[Math.cos(theta / 2), -Math.sin(theta / 2)], [0, 0]],
      [[0, 0], [Math.cos(theta / 2), Math.sin(theta / 2)]],
    ];
  }

  // Bloch vector from state: x = 2 Re(a*conj)(alpha)*beta, etc.
  function blochVector(state) {
    const [a0, a1] = state[0]; // alpha = a0 + i a1
    const [b0, b1] = state[1]; // beta  = b0 + i b1
    const x = 2 * (a0 * b0 + a1 * b1);
    const y = 2 * (a0 * b1 - a1 * b0);
    const z = a0 * a0 + a1 * a1 - (b0 * b0 + b1 * b1);
    return { x, y, z };
  }

  function probabilities(state) {
    const p0 = state[0][0] ** 2 + state[0][1] ** 2;
    const p1 = state[1][0] ** 2 + state[1][1] ** 2;
    return [p0, p1];
  }

  global.Quantum = {
    applyMatrix,
    gates,
    RX,
    RY,
    RZ,
    blochVector,
    probabilities,
    initialState: () => [[1, 0], [0, 0]],
  };
})(window);
