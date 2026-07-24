// bloch.js
// Renders a 3D Bloch sphere with a state-point that animates along the true
// geodesic (slerp) between quantum states, colored by its own phase angle,
// leaving a trace of every gate applied so far.

(function (global) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let scene, camera, renderer, container;
  let tipMesh, tipLine, traceLine;
  let tracePoints = [];
  let currentVec = { x: 0, y: 0, z: 1 };
  let animId = null;

  // simple manual orbit camera
  let orbit = { theta: 1.0, phi: 1.15, radius: 3.4 };
  let dragging = false;
  let lastX = 0, lastY = 0;

  function hueColor(x, y) {
    const hue = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    return new THREE.Color(`hsl(${hue.toFixed(1)}, 72%, 62%)`);
  }

  function makeLabelSprite(text, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '600 40px Space Grotesk, sans-serif';
    ctx.fillStyle = colorHex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.55, 0.28, 1);
    return sprite;
  }

  function updateCameraPosition() {
    const { theta, phi, radius } = orbit;
    camera.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    camera.lookAt(0, 0, 0);
  }

  function onPointerDown(e) {
    dragging = true;
    lastX = e.touches ? e.touches[0].clientX : e.clientX;
    lastY = e.touches ? e.touches[0].clientY : e.clientY;
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x;
    lastY = y;
    orbit.theta -= dx * 0.006;
    orbit.phi = Math.min(Math.max(orbit.phi - dy * 0.006, 0.15), Math.PI - 0.15);
    updateCameraPosition();
  }
  function onPointerUp() {
    dragging = false;
  }
  function onWheel(e) {
    e.preventDefault();
    orbit.radius = Math.min(Math.max(orbit.radius + e.deltaY * 0.002, 2.2), 5.5);
    updateCameraPosition();
  }

  function init(containerEl) {
    container = containerEl;
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    updateCameraPosition();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(3, 4, 2);
    scene.add(dir);

    // sphere shell
    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x1c2a2e,
      transparent: true,
      opacity: 0.12,
      shininess: 10,
    });
    scene.add(new THREE.Mesh(sphereGeo, sphereMat));

    const wireGeo = new THREE.SphereGeometry(1, 20, 14);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x6f8286, wireframe: true, transparent: true, opacity: 0.22 });
    scene.add(new THREE.Mesh(wireGeo, wireMat));

    // axes
    function axisLine(dir, color) {
      const points = [dir.clone().multiplyScalar(-1.35), dir.clone().multiplyScalar(1.35)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
      return new THREE.Line(geo, mat);
    }
    scene.add(axisLine(new THREE.Vector3(1, 0, 0), 0xe7a23a)); // x -> amber
    scene.add(axisLine(new THREE.Vector3(0, 0, 1), 0xe2637e)); // y -> rose (three's z = bloch y)
    scene.add(axisLine(new THREE.Vector3(0, 1, 0), 0x3fb6a8)); // z -> teal (three's y = bloch z, up)

    scene.add(makeLabelSprite('|0⟩', '#3fb6a8').translateY(1.55));
    scene.add(makeLabelSprite('|1⟩', '#3fb6a8').translateY(-1.55));
    scene.add(makeLabelSprite('x', '#e7a23a').translateX(1.55));
    scene.add(makeLabelSprite('y', '#e2637e').translateZ(1.55));

    // state arrow + tip
    const tipGeo = new THREE.SphereGeometry(0.06, 16, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x746ff2 });
    tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.set(0, 1, 0);
    scene.add(tipMesh);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)]);
    tipLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x746ff2, linewidth: 2 }));
    scene.add(tipLine);

    // trace
    tracePoints = [new THREE.Vector3(0, 1, 0)];
    const traceGeo = new THREE.BufferGeometry().setFromPoints(tracePoints);
    traceLine = new THREE.Line(traceGeo, new THREE.LineBasicMaterial({ color: 0x746ff2, transparent: true, opacity: 0.45 }));
    scene.add(traceLine);

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    window.addEventListener('resize', onResize);

    renderer.render(scene, camera);
  }

  function onResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.render(scene, camera);
  }

  // map bloch (x,y,z) -> three.js (x, z_up, y) so +z (|0>) is "up" on screen
  function toThree(v) {
    return new THREE.Vector3(v.x, v.z, v.y);
  }

  function slerp(a, b, t) {
    const dot = Math.max(-1, Math.min(1, a.dot(b)));
    const omega = Math.acos(dot);
    if (omega < 1e-4) return a.clone();
    const sinOmega = Math.sin(omega);
    const wa = Math.sin((1 - t) * omega) / sinOmega;
    const wb = Math.sin(t * omega) / sinOmega;
    return a.clone().multiplyScalar(wa).add(b.clone().multiplyScalar(wb));
  }

  function setState(blochVec, animate) {
    const target = toThree(blochVec).normalize();
    const start = toThree(currentVec).normalize();
    currentVec = blochVec;

    if (animId) cancelAnimationFrame(animId);

    if (!animate || reduceMotion) {
      applyPoint(target);
      pushTrace(target);
      renderer.render(scene, camera);
      return;
    }

    const durationMs = 550;
    const t0 = performance.now();
    function frame(now) {
      const t = Math.min((now - t0) / durationMs, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
      const p = slerp(start, target, eased);
      applyPoint(p);
      renderer.render(scene, camera);
      if (t < 1) {
        animId = requestAnimationFrame(frame);
      } else {
        pushTrace(target);
      }
    }
    animId = requestAnimationFrame(frame);
  }

  function applyPoint(p) {
    tipMesh.position.copy(p);
    tipMesh.material.color.copy(hueColor(p.x, p.z)); // hue from bloch x,y -> three x,z
    const geo = tipLine.geometry;
    geo.setFromPoints([new THREE.Vector3(0, 0, 0), p]);
    tipLine.material.color.copy(tipMesh.material.color);
  }

  function pushTrace(p) {
    tracePoints.push(p.clone());
    if (tracePoints.length > 400) tracePoints.shift();
    traceLine.geometry.dispose();
    traceLine.geometry = new THREE.BufferGeometry().setFromPoints(tracePoints);
  }

  function reset() {
    tracePoints = [new THREE.Vector3(0, 1, 0)];
    traceLine.geometry.dispose();
    traceLine.geometry = new THREE.BufferGeometry().setFromPoints(tracePoints);
    currentVec = { x: 0, y: 0, z: 1 };
    applyPoint(new THREE.Vector3(0, 1, 0));
    if (renderer) renderer.render(scene, camera);
  }

  global.Bloch = { init, setState, reset };
})(window);
