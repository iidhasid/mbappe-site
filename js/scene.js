/* ============================================================
   MBAPPE — scene.js  (Three.js ambient layer)
   Golden ember drift · ghost Eye of Horus watermark · scroll parallax
   ============================================================ */
import * as THREE from "three";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("threeCanvas");
const stage = document.getElementById("stage");

if (!canvas || !stage || !window.WebGLRenderingContext) {
  if (stage) stage.style.display = "none";
} else {
  init();
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 13;

  /* ---- ember particles (desert sand turned to gold) ---- */
  const COUNT = reduced ? 120 : 420;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const drift = new Float32Array(COUNT);
  const sway = new Float32Array(COUNT);
  const golds = [
    new THREE.Color(0xc9a06b),
    new THREE.Color(0xf5f1e8),
    new THREE.Color(0x8b0000),
    new THREE.Color(0x7fc8e8),
  ];
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
    pos[i * 3 + 2] = -6 + Math.random() * 10;
    const g = golds[(Math.random() * golds.length) | 0];
    col[i * 3] = g.r * (0.5 + Math.random() * 0.5);
    col[i * 3 + 1] = g.g * (0.5 + Math.random() * 0.5);
    col[i * 3 + 2] = g.b * (0.5 + Math.random() * 0.5);
    drift[i] = 0.15 + Math.random() * 0.5;
    sway[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

  const ringTexture = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    return t;
  })();

  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      map: ringTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  scene.add(points);

  /* ---- ghost Eye of Horus watermark ---- */
  let watermark = null;
  new THREE.TextureLoader().load(
    "assets/img/logo.png",
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const w = 13;
      const h = (13 * tex.image.height) / tex.image.width;
      watermark = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      watermark.position.z = -8;
      scene.add(watermark);
      tick();
    },
    undefined,
    () => {
      tick();
    }
  );

  /* ---- mouse + scroll parallax ---- */
  const mouse = { x: 0, y: 0 };
  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = (e.clientX / innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  let scrollP = 0;
  function readScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    scrollP = Math.min(1, Math.max(0, window.scrollY / max));
  }
  window.addEventListener("scroll", readScroll, { passive: true });
  readScroll();

  const clock = new THREE.Clock();

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  window.addEventListener("resize", resize);
  resize();

  let raf = 0;
  function tick() {
    if (!reduced) raf = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    // embers: slow rise + sway
    const p = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      p[i * 3 + 1] += drift[i] * 0.0025;
      p[i * 3] += Math.sin(t * 0.3 + sway[i]) * 0.0012;
      if (p[i * 3 + 1] > 9.5) p[i * 3 + 1] = -9.5;
    }
    geo.attributes.position.needsUpdate = true;

    // camera parallax
    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 0.35 - scrollP * 2.2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    if (watermark) {
      watermark.rotation.x = Math.sin(t * 0.05) * 0.06;
      watermark.rotation.y = Math.sin(t * 0.07) * 0.1;
      const sc = 1 + scrollP * 1.1;
      watermark.scale.setScalar(sc);
      watermark.position.z = -8 - scrollP * 1.5;
    }

    renderer.render(scene, camera);
  }

  if (reduced) {
    tick();
    renderer.render(scene, camera);
  } else {
    tick();
  }

  stage.classList.add("on");

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduced) tick();
  });
}