// Meteor-hits-island previz. Low-poly, flat-shaded, pastel — same look as the ship reference.
// window.setT(t) renders the scene at time t (seconds, 0..10).
(function () {
  const W = 1280, H = 720, TI = 3.3, DUR = 10;       // TI = moment of impact
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const easeOut = x => 1 - Math.pow(1 - clamp(x, 0, 1), 2.2);
  function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = rng(11);
  const C = h => new THREE.Color(h);

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.useLegacyLights = true;

  const scene = new THREE.Scene();
  const HORIZON = C(0xcfdad0), SKYTOP = C(0x9fb6ba), FIRE = C(0xff8d2e), SMOKE = C(0x7a6c61);
  scene.fog = new THREE.Fog(HORIZON.getHex(), 900, 4800);
  const camera = new THREE.PerspectiveCamera(44, W / H, 1, 20000);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(0xe3ece4, 0x6f9396, 0.85); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 0.85); sun.position.set(-400, 600, 500); scene.add(sun);
  const fireLight = new THREE.PointLight(0xff8a30, 0, 4500, 1.1); scene.add(fireLight);

  // ---------- sky ----------
  const skyGeo = new THREE.SphereGeometry(9000, 40, 20);
  const skyCol = new Float32Array(skyGeo.attributes.position.count * 3);
  skyGeo.setAttribute('color', new THREE.BufferAttribute(skyCol, 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  scene.add(sky);
  const skyDirs = [];
  for (let i = 0; i < skyGeo.attributes.position.count; i++) skyDirs.push(new THREE.Vector3().fromBufferAttribute(skyGeo.attributes.position, i).normalize());
  const toIsland = new THREE.Vector3(0, 0.03, -1).normalize();
  const tmpC = new THREE.Color();
  function updateSky(glow) {
    skyDirs.forEach((v, i) => {
      const up = clamp(v.y, 0, 1);
      tmpC.copy(HORIZON).lerp(SKYTOP, Math.pow(up, 0.55));
      if (v.y < 0) tmpC.copy(HORIZON);
      const ang = Math.acos(clamp(v.dot(toIsland), -1, 1));
      const g = glow * Math.exp(-ang * ang / 0.55) * (1 - 0.5 * up);
      tmpC.lerp(FIRE, clamp(g * 0.75, 0, 1));
      skyCol[i * 3] = tmpC.r; skyCol[i * 3 + 1] = tmpC.g; skyCol[i * 3 + 2] = tmpC.b;
    });
    skyGeo.attributes.color.needsUpdate = true;
  }

  // ---------- sea ----------
  const SEA = 6400, SEG = 160;
  const seaGeo = new THREE.PlaneGeometry(SEA, SEA, SEG, SEG); seaGeo.rotateX(-Math.PI / 2);
  const seaBase = seaGeo.attributes.position.array.slice();
  const seaMat = new THREE.MeshLambertMaterial({ color: 0x86aaac, flatShading: true, emissive: 0x000000 });
  const sea = new THREE.Mesh(seaGeo, seaMat); scene.add(sea);
  function updateSea(t, glow) {
    const p = seaGeo.attributes.position.array;
    const r = TI < t ? 150 + 470 * (1 - Math.exp(-(t - TI) / 2.5)) : -1;
    const amp = 18 * Math.exp(-(t - TI) / 4);
    for (let i = 0; i < p.length; i += 3) {
      const x = seaBase[i], z = seaBase[i + 2];
      let y = 1.4 * Math.sin(x * 0.011 + t * 0.9) * Math.cos(z * 0.013 + t * 0.7) + 0.7 * Math.sin((x + z) * 0.03 + t * 1.6);
      if (r > 0) { const d = Math.hypot(x, z + 700) - r; y += amp * Math.exp(-d * d / 2600); }
      p[i + 1] = y;
    }
    seaGeo.attributes.position.needsUpdate = true; seaGeo.computeVertexNormals();
    seaMat.emissive.setRGB(0.55, 0.2, 0.05).multiplyScalar(0.16 * glow);
  }

  // fire reflection path on the water
  function streakTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 512);
    const rr = rng(5);
    for (let k = 0; k < 900; k++) {
      const y = Math.pow(rr(), 0.8) * 512, off = (rr() - 0.5) * 2, x = 128 + off * 128 * (0.25 + 0.75 * (y / 512));
      const w = 6 + rr() * 44, a = (1 - Math.abs(off)) * (0.25 + rr() * 0.55);
      g.fillStyle = `rgba(255,${150 + (rr() * 90) | 0},${60 + (rr() * 60) | 0},${a * (1 - 0.92 * Math.pow(y / 512, 1.6))})`; g.fillRect(x - w / 2, y, w, 1 + rr() * 2);
    }
    const t = new THREE.CanvasTexture(c); return t;
  }
  const streakMat = new THREE.MeshBasicMaterial({ map: streakTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 });
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(400, 520), streakMat);
  streak.rotation.x = -Math.PI / 2; streak.position.set(0, 1.2, -300); scene.add(streak);

  // ---------- island ----------
  const IC = new THREE.Vector3(0, 0, -700);
  const island = new THREE.Group(); island.position.copy(IC); scene.add(island);
  const jungle = new THREE.MeshLambertMaterial({ color: 0x6e9c70, flatShading: true });
  const rock = new THREE.MeshLambertMaterial({ color: 0x8b9a82, flatShading: true });
  const sand = new THREE.MeshLambertMaterial({ color: 0xd8d0b0, flatShading: true });
  const JUNGLE0 = C(0x6e9c70), JUNGLE1 = C(0x3b312c), ROCK0 = C(0x8b9a82), ROCK1 = C(0x4a403a);
  function jitterGeo(g, k, seed) {
    const r2 = rng(seed), p = g.attributes.position, map = new Map();
    for (let i = 0; i < p.count; i++) {
      const key = [p.getX(i), p.getY(i), p.getZ(i)].map(v => v.toFixed(3)).join();
      if (!map.has(key)) map.set(key, [(r2() - 0.5) * k, (r2() - 0.5) * k * 0.5, (r2() - 0.5) * k]);
      const o = map.get(key); p.setXYZ(i, p.getX(i) + o[0], p.getY(i) + o[1], p.getZ(i) + o[2]);
    }
    g.computeVertexNormals(); return g;
  }
  const beach = new THREE.Mesh(jitterGeo(new THREE.CylinderGeometry(150, 165, 8, 18, 1), 14, 3), sand); beach.position.y = 2; island.add(beach);
  const isl = new THREE.Mesh(jitterGeo(new THREE.CylinderGeometry(55, 138, 62, 16, 3), 16, 4), jungle); isl.position.y = 36; island.add(isl);
  const peak = new THREE.Mesh(jitterGeo(new THREE.ConeGeometry(70, 44, 8, 2), 10, 8), rock); peak.position.set(-6, 82, 4); island.add(peak);
  const trees = [];
  for (let i = 0; i < 70; i++) {
    const a = R() * Math.PI * 2, rad = Math.sqrt(R()) * 120, h = 14 + R() * 16;
    const hh = 66 * (1 - clamp((rad - 20) / 120, 0, 1)) ; // height of island at that radius, roughly
    const tr = new THREE.Mesh(new THREE.ConeGeometry(8 + R() * 6, h, 5), jungle);
    tr.position.set(Math.cos(a) * rad, clamp(hh, 8, 74) + h / 2 - 4, Math.sin(a) * rad); island.add(tr); trees.push(tr);
  }
  function updateIsland(t) {
    const b = sm((t - TI - 0.1) / 1.6);
    jungle.color.copy(JUNGLE0).lerp(JUNGLE1, b); rock.color.copy(ROCK0).lerp(ROCK1, b);
    jungle.emissive.setRGB(0.6, 0.22, 0.04).multiplyScalar(0.55 * Math.exp(-Math.max(0, t - TI - 0.5) / 1.8) * (t > TI ? 1 : 0));
    rock.emissive.copy(jungle.emissive);
    const f = sm((t - TI) / 1.0);
    trees.forEach(tr => tr.scale.y = lerp(1, 0.08, f));
    island.scale.y = lerp(1, 0.82, sm((t - TI) / 0.6));
  }

  // ---------- clouds ----------
  const blobGeo = new THREE.IcosahedronGeometry(1, 1);
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f1, flatShading: true, emissive: 0x2a312e });
  const clouds = new THREE.Group(); scene.add(clouds);
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(blobGeo, cloudMat);
    const s = 55 + R() * 105;
    m.scale.set(s * 1.7, s * 0.4, s * 0.9);
    m.position.set(lerp(-1500, 1500, R()), lerp(420, 640, R()), lerp(-1800, -1000, R()));
    m.rotation.y = R() * 3; clouds.add(m);
  }
  for (let i = 0; i < 6; i++) { // low distant clouds near horizon
    const m = new THREE.Mesh(blobGeo, cloudMat);
    const s = 110 + R() * 90; m.scale.set(s * 2.2, s * 0.3, s * 0.8);
    m.position.set(lerp(-2400, 2400, R()), lerp(140, 230, R()), lerp(-2600, -2000, R())); clouds.add(m);
  }

  // ---------- ship (foreground silhouette) ----------
  const ship = new THREE.Group();
  const hullM = new THREE.MeshLambertMaterial({ color: 0x4a5a61, flatShading: true });
  const supM = new THREE.MeshLambertMaterial({ color: 0x66767b, flatShading: true });
  const winM = new THREE.MeshBasicMaterial({ color: 0x2c383d });
  const add = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); ship.add(o); return o; };
  add(new THREE.BoxGeometry(34, 4.5, 8.5), hullM, 0, 2, 0);
  const bow = add(new THREE.ConeGeometry(4.25, 8, 4), hullM, -20.5, 2, 0); bow.rotation.z = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 1);
  add(new THREE.BoxGeometry(22, 4, 7), supM, 2, 6.2, 0);
  add(new THREE.BoxGeometry(22.2, 0.9, 7.2), winM, 2, 6.6, 0);
  add(new THREE.BoxGeometry(9, 3.6, 6), supM, 6, 10, 0);
  add(new THREE.BoxGeometry(9.2, 0.9, 6.2), winM, 6, 10.3, 0);
  add(new THREE.CylinderGeometry(1.5, 1.8, 4, 8), supM, 9, 13.6, 0);
  ship.rotation.y = -0.45; ship.scale.setScalar(1.35);
  scene.add(ship);
  const wakeM = new THREE.MeshBasicMaterial({ color: 0xe8f0ee, transparent: true, opacity: 0.7, side: THREE.DoubleSide, fog: false });
  const wakeGeo = new THREE.PlaneGeometry(1, 1); wakeGeo.rotateX(-Math.PI / 2);
  const wake = new THREE.Mesh(wakeGeo, wakeM); scene.add(wake);

  // ---------- meteor ----------
  const TE = TI + 0.25;
  const mStart = new THREE.Vector3(330, 640, -980), mEnd = new THREE.Vector3(0, 90, -700);
  const mDir = mEnd.clone().sub(mStart).normalize();
  const meteorGroup = new THREE.Group(); scene.add(meteorGroup);
  meteorGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mDir);
  let mg = new THREE.IcosahedronGeometry(128, 2);
  { // rocky shape: consistent noise displacement + elongation
    const p = mg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = 1 + 0.2 * Math.sin(x * 0.045 + 1.3) * Math.sin(y * 0.041 + .7) * Math.sin(z * 0.05 + 2.1) + 0.1 * Math.sin(x * .11 + y * .09 + z * .13);
      p.setXYZ(i, x * n, y * n * 1.2, z * n);
    }
    mg.computeVertexNormals();
    const col = new Float32Array(p.count * 3), r3 = rng(21), hotC = C(0xff7a1c), yel = C(0xffd36b), dark = C(0x3a312d), c = new THREE.Color();
    const nrm = mg.attributes.normal;
    for (let f = 0; f < p.count; f += 3) {
      const n = new THREE.Vector3(); for (let k = 0; k < 3; k++) n.add(new THREE.Vector3().fromBufferAttribute(nrm, f + k)); n.normalize();
      const front = clamp(-n.y, -1, 1);                                  // faces toward flight direction (-Y local = forward, trail is +Y local)
      let hot = clamp(0.08 + 0.85 * Math.max(front, 0) + (r3() - 0.5) * 0.6, 0, 1);
      c.copy(dark).lerp(hotC, Math.pow(hot, 1.4)); if (hot > 0.88) c.lerp(yel, 0.7);
      const shade = 0.72 + 0.28 * clamp(n.x * 0.4 + n.y * 0.2 + n.z * 0.9, -1, 1);
      c.multiplyScalar(shade);
      for (let k = 0; k < 3; k++) { col[(f + k) * 3] = c.r; col[(f + k) * 3 + 1] = c.g; col[(f + k) * 3 + 2] = c.b; }
    }
    mg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const meteorMesh = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  // local frame: group +Y == flight direction. Rock is built with its "front" facing -Y, so flip it.
  meteorMesh.rotation.x = Math.PI; meteorGroup.add(meteorMesh);
  const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(185, 1), new THREE.MeshBasicMaterial({ color: 0xff9a40, transparent: true, opacity: 0.22, depthWrite: false, fog: false }));
  meteorGroup.add(halo);
  // fire trail trails behind: local -Y
  const trailParts = [];
  function cone(rad, len, color, op, add) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    m.rotation.x = Math.PI; m.position.y = -len / 2; meteorGroup.add(m); m.userData = { op, len }; trailParts.push(m); return m;
  }
  const trailSmoke = cone(1, 1, 0x000000, 0); trailSmoke.visible = false;
  const smokeTrail = [];
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshLambertMaterial({ color: 0x7d6f64, flatShading: true, transparent: true, opacity: 0.5, emissive: 0x2b1608 }));
    const k = i / 22; m.userData = { k, s: lerp(80, 175, k) * (0.8 + R() * 0.5), lx: (R() - .5) * 150, lz: (R() - .5) * 150 };
    m.position.set(m.userData.lx * k, -300 - k * 1250, m.userData.lz * k); m.scale.setScalar(m.userData.s); meteorGroup.add(m); smokeTrail.push(m);
  }
  const trailMid = cone(125, 1000, 0xff6a14, 0.75);
  const trailCore = cone(80, 560, 0xffc467, 0.9);
  const flames = [];
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffa238 : 0xff6a14, transparent: true, opacity: 0.85, fog: false, depthWrite: false }));
    const k = i / 26, s = lerp(105, 24, k) * (0.8 + R() * 0.4);
    m.scale.setScalar(s); m.userData = { k, s, ph: R() * 6, lx: (R() - .5) * 60, lz: (R() - .5) * 60 };
    m.position.set(0, -80 - k * 760, 0); meteorGroup.add(m); flames.push(m);
  }
  function updateMeteor(t) {
    const u = clamp(t / TE, 0, 1), e = Math.pow(u, 1.7);
    meteorGroup.position.copy(mStart).lerp(mEnd, e);
    const live = t < TE;
    meteorMesh.visible = live; halo.visible = live;
    meteorMesh.rotation.y = t * 0.9;
    const after = Math.max(0, t - TI);
    const fl = 1 - sm(after / 1.0);                                  // flames die after impact
    const smokeK = 1 - 0.6 * sm((t - TI) / 5);
    trailCore.material.opacity = 0.9 * fl; trailMid.material.opacity = 0.75 * fl; smokeTrail.forEach(m => { m.material.opacity = 0.5 * smokeK; m.material.emissive.setRGB(0.17, 0.085, 0.03).multiplyScalar(fl + 0.2); });
    trailCore.visible = trailMid.visible = fl > 0.01;
    trailParts.forEach((m, i) => { const w = 1 + 0.06 * Math.sin(t * 38 + i * 2); m.scale.set(w, 1, w); });
    flames.forEach((m, i) => {
      const d = m.userData; m.visible = fl > 0.01;
      m.position.set(d.lx * d.k * Math.sin(t * 9 + d.ph), -80 - d.k * 760, d.lz * d.k * Math.cos(t * 8 + d.ph));
      m.scale.setScalar(d.s * (0.85 + 0.25 * Math.sin(t * 22 + d.ph)) * fl + 0.01); m.material.opacity = 0.85 * fl;
    });
  }

  // ---------- explosion ----------
  const BASE = new THREE.Vector3(0, 100, -700);
  const explo = new THREE.Group(); scene.add(explo);
  const smokeBlobs = [];
  function mkBlob(group, o) {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshLambertMaterial({ color: 0x777777, flatShading: true }));
    m.userData = o; group.add(m); smokeBlobs.push(m); return m;
  }
  const capBlobs = [], skirt = [], inner = [];
  for (let i = 0; i < 34; i++) {
    let v; do { v = new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); } while (v.lengthSq() > 1 || v.lengthSq() < 0.1);
    v.normalize(); if (v.y < -0.1) v.y = -v.y * 0.3;
    capBlobs.push(mkBlob(explo, { v, rad: 0.3 + R() * 0.16, low: R(), shell: 1 }));
  }
  for (let i = 0; i < 12; i++) {
    const v = new THREE.Vector3(R() * 2 - 1, R() * 1 - 0.3, R() * 2 - 1).normalize().multiplyScalar(0.55);
    inner.push(mkBlob(explo, { v, rad: 0.34 + R() * 0.12, low: R() * 0.5, shell: 0.55 }));
  }
  for (let i = 0; i < 20; i++) skirt.push(mkBlob(explo, { a: (i / 20) * 6.283 + R() * 0.3, rad: 30 + R() * 28, y: 12 + R() * 45, low: R() * 0.8, rr: 0.55 + R() * 0.5 }));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(62, 96, 1, 9, 1, true), new THREE.MeshLambertMaterial({ color: 0x777777, flatShading: true, side: THREE.DoubleSide }));
  explo.add(stem);
  const hotC2 = new THREE.Color(), smokeC2 = new THREE.Color();
  function heatColor(mat, heat, shade) {
    smokeC2.copy(SMOKE).multiplyScalar(shade); hotC2.copy(FIRE);
    mat.color.copy(smokeC2).lerp(hotC2, Math.pow(heat, 0.8));
    mat.emissive.copy(FIRE).multiplyScalar(0.9 * heat);
  }
  function updateExplosion(t) {
    const a = t - TI; explo.visible = a > 0;
    if (a <= 0) return;
    const g = easeOut(a / 4.2), h = BASE.y + 20 + 275 * easeOut(a / 6.7), Rr = 38 + 190 * easeOut(a / 4.6);
    capBlobs.forEach(m => { const d = m.userData;
      m.position.set(d.v.x * Rr * 1.05, h + d.v.y * Rr * 0.72, BASE.z - IC.z + d.v.z * Rr * 1.05); m.position.x += 0;
      m.scale.setScalar(Rr * d.rad * (0.5 + 0.5 * easeOut(a / 0.9)));
      heatColor(m.material, clamp(1 - a / (2.4 + 3.2 * (1 - d.low) + 1.2 * (1 - clamp(d.v.y, 0, 1)))), 0.8 + 0.5 * clamp(d.v.y, 0, 1));
    });
    inner.forEach(m => { const d = m.userData;
      m.position.set(d.v.x * Rr, h + d.v.y * Rr * 0.7, d.v.z * Rr); m.scale.setScalar(Rr * d.rad * (0.5 + 0.5 * easeOut(a / 0.9)));
      heatColor(m.material, clamp(1 - a / (4.4 + 2 * d.low)), 0.7);
    });
    skirt.forEach(m => { const d = m.userData, rs = 40 + 300 * easeOut(a / 4.0) * d.rr;
      m.position.set(Math.cos(d.a) * rs, d.y, Math.sin(d.a) * rs);
      m.scale.setScalar(d.rad * (0.35 + 0.9 * easeOut(a / 3)) * (0.7 + 0.3 * sm(a / 0.3)));
      heatColor(m.material, clamp(1 - a / (2.4 + 3.4 * d.low)), 0.85);
    });
    const hs = Math.max(1, h - 20 - 40);
    stem.scale.set(lerp(1.4, 1, g) * (0.4 + 0.6 * easeOut(a / 0.8)), hs, lerp(1.4, 1, g) * (0.4 + 0.6 * easeOut(a / 0.8)));
    stem.position.set(0, 40 + hs / 2, 0);
    heatColor(stem.material, clamp(1 - a / 3.4), 0.8);
    explo.position.copy(IC); explo.position.y = 0;
    explo.children.forEach(c => { /* positions are local to IC.x/z */ });
  }

  // flash sphere
  const flash = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshBasicMaterial({ color: 0xfff6dc, transparent: true, fog: false, depthWrite: false }));
  flash.position.copy(BASE); scene.add(flash);
  function updateFlash(t) {
    const a = t - TI; flash.visible = a > 0 && a < 1.8; if (!flash.visible) return;
    flash.scale.setScalar(Math.max(1, 560 * easeOut(a / 0.55)));
    flash.material.opacity = a < 0.35 ? 1 : 1 - sm((a - 0.35) / 1.3);
  }

  // debris
  const debris = [], r4 = rng(77), dbGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 130; i++) {
    const az = r4() * 6.283, el = lerp(0.9, 1.5, r4()), sp = lerp(160, 430, Math.pow(r4(), 0.8));
    const m = new THREE.Mesh(dbGeo, new THREE.MeshBasicMaterial({ color: 0xff8a2a, fog: false }));
    m.userData = { v: new THREE.Vector3(Math.cos(az) * Math.cos(el) * sp, Math.sin(el) * sp, Math.sin(az) * Math.cos(el) * sp), s: lerp(5, 26, Math.pow(r4(), 2)), spin: r4() * 6, off: r4() * 0.25 };
    scene.add(m); debris.push(m);
  }
  const dcol = new THREE.Color();
  function updateDebris(t) {
    const a = t - TI;
    debris.forEach(m => { const d = m.userData, tt = a - d.off;
      if (tt <= 0) { m.visible = false; return; }
      const y = BASE.y + d.v.y * tt - 0.5 * 175 * tt * tt;
      m.visible = y > 4; m.position.set(BASE.x + d.v.x * tt, y, BASE.z + d.v.z * tt);
      m.rotation.set(tt * d.spin, tt * d.spin * 0.7, 0); m.scale.setScalar(d.s * (0.6 + 0.4 * sm(tt / 0.4)));
      dcol.set(0xff9a30).lerp(C(0x2c2623), sm(tt / 3.2)); m.material.color.copy(dcol);
    });
  }

  // shockwave
  const wallMat = new THREE.MeshBasicMaterial({ color: 0xff7a22, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 56, 1, true), wallMat); scene.add(wall);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 56, 1, true), rimMat); scene.add(rim);
  const waveBlobs = [];
  for (let i = 0; i < 46; i++) {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff9a30 : 0xff6a18, fog: false, transparent: true }));
    m.userData = { a: (i / 46) * 6.283 + R() * 0.1, s: 20 + R() * 28, y: 14 + R() * 34, ph: R() * 6 }; scene.add(m); waveBlobs.push(m);
  }
  function updateWave(t) {
    const a = t - TI, vis = a > 0.08; wall.visible = rim.visible = vis; waveBlobs.forEach(m => m.visible = vis);
    if (!vis) return;
    const r = 150 + 470 * (1 - Math.exp(-a / 2.5)), hh = 18 + 46 * Math.exp(-a / 2.2), fade = Math.exp(-a / 5.5);
    wall.scale.set(r, hh, r); wall.position.set(0, hh / 2, IC.z); wallMat.opacity = 0.06 + 0.2 * fade;
    rim.scale.set(r * 1.01, 10, r * 1.01); rim.position.set(0, 5, IC.z); rimMat.opacity = 0.35 + 0.55 * fade;
    waveBlobs.forEach(m => { const d = m.userData;
      m.position.set(Math.cos(d.a) * r, d.y * (0.4 + 0.6 * fade) + 6 * Math.sin(t * 6 + d.ph), IC.z + Math.sin(d.a) * r);
      m.scale.setScalar(d.s * (0.5 + 0.7 * fade)); m.material.opacity = 0.3 + 0.7 * fade; });
  }

  // ---------- timeline ----------
  const ov = document.getElementById('flash'), fadeEl = document.getElementById('fade');
  const smoothstepTime = x => sm(x);
  window.setT = function (t) {
    const a = t - TI;
    const glow = t < TI ? 0.12 * sm((t - 1.2) / 2.1) : 0.12 + 0.88 * sm(a / 0.9) * (1 - 0.3 * sm((a - 2) / 4.5));
    updateSky(glow); updateSea(t, glow); updateIsland(t); updateMeteor(t); updateExplosion(t); updateFlash(t); updateDebris(t); updateWave(t);
    // lights follow the fire
    if (t < TI) { fireLight.position.copy(meteorGroup.position); fireLight.intensity = 0.15 + 1.4 * sm(t / TI); }
    else { fireLight.position.set(0, 150, -700); fireLight.intensity = lerp(4.5, 1.8, sm(a / 5)); }
    sun.intensity = 0.85 - 0.3 * glow; hemi.intensity = 0.85 - 0.25 * glow;
    cloudMat.emissive.setRGB(0.165, 0.19, 0.18).lerp(new THREE.Color(0.55, 0.25, 0.08), glow * 0.55);
    streakMat.opacity = t < 1.5 ? 0 : (t < TI ? 0.35 * sm((t - 1.5) / 1.8) : lerp(0.35, 1.0, sm(a / 0.5)) * (1 - 0.45 * sm((a - 1.5) / 5)));
    streak.scale.x = t < TI ? 0.5 : lerp(0.5, 1.15, sm(a / 2));

    // ship
    const s = t / DUR, hd = new THREE.Vector3(-Math.cos(ship.rotation.y), 0, Math.sin(ship.rotation.y));
    ship.position.set(-60 + hd.x * 3.6 * t, 0.5 * Math.sin(t * 1.1), -125 + hd.z * 3.6 * t);
    ship.rotation.z = 0.025 * Math.sin(t * 1.3); ship.rotation.x = 0.02 * Math.sin(t * 0.9 + 1);
    wake.rotation.y = ship.rotation.y; wake.scale.set(90, 1, 10);
    wake.position.set(ship.position.x - hd.x * 68, 0.6, ship.position.z - hd.z * 68);

    // camera: slow pull-back + crane up, target rises with the cloud
    const e = sm(s), e2 = sm((t - 2.0) / 8);
    camera.position.set(lerp(0, 14, e), lerp(18, 40, e), lerp(60, 290, e));
    camera.lookAt(lerp(10, 0, e2), lerp(110, 235, e2), -700);
    const shk = t > TI + 0.05 ? 0.011 * Math.exp(-(t - TI - 0.05) / 1.4) : 0;
    camera.rotateX(shk * Math.sin(t * 61) + 0.0012 * Math.sin(t * 1.7));
    camera.rotateY(shk * Math.sin(t * 53 + 1) + 0.0012 * Math.sin(t * 1.3 + 2));
    renderer.render(scene, camera);

    // overlays: impact flash and fade to black
    const fo = t < TI - 0.04 ? 0 : (a < 0.12 ? sm((a + 0.04) / 0.16) : Math.exp(-(a - 0.12) / 0.55));
    ov.style.opacity = clamp(fo, 0, 1).toFixed(3);
    fadeEl.style.opacity = sm((t - 8.6) / 1.4).toFixed(3);
  };
  window.__dbg = { renderer, scene, camera };
  window.setT(0);

})();
