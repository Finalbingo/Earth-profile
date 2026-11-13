import * as THREE from 'three';

/* 天宫三舱 T 字构型建造器 —— 1 单位 = 1 米
   天和轴 = Z（节点舱朝 +Z），实验舱沿 ±X，径向 = Y */

/* ============================================================
   中国空间站「天宫」三舱 T 字基本构型
   1 单位 = 1 米；尺寸依据公开资料（天和 16.6 / 问天 17.9 / 梦天 17.88，⌀4.2）
   坐标：天和轴 = Z（节点舱朝 +Z），实验舱沿 ±X，径向 = Y
   ============================================================ */

const D2R = Math.PI / 180;

/* ---------- 确定性随机 ---------- */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   1. 程序化贴图
   ============================================================ */
function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(canvas, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

/* 白色蒙皮：分段环缝 + 壁板 + 紧固件 + 设备补丁 */
function hullTexture(seed = 7, tint = '#d9d5cc') {
  const W = 1024, H = 512;
  const [c, g] = cv(W, H);
  const rnd = mulberry(seed);
  g.fillStyle = tint; g.fillRect(0, 0, W, H);

  // 大面积明暗不匀（蒙皮老化 / 隔热层差异）
  for (let i = 0; i < 90; i++) {
    const x = rnd() * W, y = rnd() * H, w = 40 + rnd() * 190, h = 24 + rnd() * 110;
    const v = rnd();
    g.fillStyle = v > .5 ? `rgba(255,253,247,${.05 + rnd() * .12})` : `rgba(150,143,130,${.04 + rnd() * .1})`;
    g.fillRect(x, y, w, h);
  }
  // 纵向壁板缝
  g.lineWidth = 1;
  for (let x = 0; x < W; x += 64) {
    g.strokeStyle = 'rgba(120,113,100,.30)';
    g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke();
    g.strokeStyle = 'rgba(255,255,250,.35)';
    g.beginPath(); g.moveTo(x + 1.5, 0); g.lineTo(x + 1.5, H); g.stroke();
  }
  // 环向分段缝
  for (let y = 0; y < H; y += 86) {
    g.strokeStyle = 'rgba(105,98,86,.42)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke();
    g.strokeStyle = 'rgba(255,255,250,.4)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y + 2.5); g.lineTo(W, y + 2.5); g.stroke();
  }
  // 紧固件
  for (let i = 0; i < 900; i++) {
    const x = rnd() * W, y = rnd() * H;
    g.fillStyle = `rgba(110,103,92,${.18 + rnd() * .3})`;
    g.fillRect(x, y, 1.6, 1.6);
  }
  // 设备补丁 / 检修口
  for (let i = 0; i < 34; i++) {
    const x = rnd() * W, y = rnd() * H, w = 12 + rnd() * 46, h = 10 + rnd() * 30;
    g.fillStyle = `rgba(${170 + rnd() * 40 | 0},${168 + rnd() * 38 | 0},${158 + rnd() * 34 | 0},.55)`;
    g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(105,98,86,.4)'; g.lineWidth = 1;
    g.strokeRect(x + .5, y + .5, w, h);
  }
  return c;
}

/* 柔性太阳翼：橙棕三结砷化镓电池阵 + 银灰加强带 */
function flexWingTexture(cols, rows) {
  const cw = 16, ch = 16, W = cols * cw, H = rows * ch;
  const [c, g] = cv(W, H);
  const rnd = mulberry(91);
  g.fillStyle = '#2a1a12'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const v = rnd();
      const r = 104 + v * 40 | 0, gg = 46 + v * 22 | 0, b = 24 + v * 14 | 0;
      g.fillStyle = `rgb(${r},${gg},${b})`;
      g.fillRect(i * cw + 1, j * ch + 1, cw - 2, ch - 2);
      // 电池片高光斜纹
      g.fillStyle = `rgba(255,190,130,${.05 + v * .09})`;
      g.fillRect(i * cw + 2, j * ch + 2, cw - 4, 2);
      g.fillStyle = 'rgba(40,20,12,.5)';
      g.fillRect(i * cw + cw / 2 - .5, j * ch + 1, 1, ch - 2);
    }
  }
  // 横向银灰加强带
  const bandEvery = Math.max(4, Math.round(rows / 5));
  for (let j = bandEvery; j < rows; j += bandEvery) {
    g.fillStyle = '#b9bcc0'; g.fillRect(0, j * ch - 3, W, 6);
    g.fillStyle = 'rgba(70,72,76,.6)'; g.fillRect(0, j * ch - 3, W, 1);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, j * ch + 2, W, 1);
  }
  // 边框
  g.strokeStyle = '#c2622c'; g.lineWidth = 5;
  g.strokeRect(2.5, 2.5, W - 5, H - 5);
  return c;
}

/* 刚性太阳翼（神舟 / 天舟）：深蓝电池阵 */
function rigidWingTexture(cols, rows) {
  const cw = 20, ch = 20, W = cols * cw, H = rows * ch;
  const [c, g] = cv(W, H);
  const rnd = mulberry(33);
  g.fillStyle = '#0d1526'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const v = rnd();
    g.fillStyle = `rgb(${18 + v * 16 | 0},${32 + v * 22 | 0},${64 + v * 30 | 0})`;
    g.fillRect(i * cw + 1.5, j * ch + 1.5, cw - 3, ch - 3);
    g.fillStyle = `rgba(150,190,240,${.05 + v * .1})`;
    g.fillRect(i * cw + 3, j * ch + 3, cw - 6, 2);
  }
  g.strokeStyle = '#8d949c'; g.lineWidth = 4;
  g.strokeRect(2, 2, W - 4, H - 4);
  for (let i = 1; i < 3; i++) {
    g.fillStyle = '#9aa1a8'; g.fillRect(i * W / 3 - 3, 0, 6, H);
  }
  return c;
}

/* 多层隔热毯 / 机械臂包覆布：褶皱法线 */
function crinkleNormal(seed = 5, scale = 1) {
  const S = 512;
  const [c, g] = cv(S, S);
  const rnd = mulberry(seed);
  const h = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) h[i] = rnd();
  // 平滑 + 条纹褶皱
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x;
    const s = Math.sin((x * .09 + Math.sin(y * .05) * 2.2)) * .5 + Math.sin(y * .21 + x * .03) * .3;
    h[i] = h[i] * .35 + s * .5 + .5;
  }
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x;
    const l = h[y * S + ((x - 1 + S) % S)], r = h[y * S + ((x + 1) % S)];
    const u = h[((y - 1 + S) % S) * S + x], d = h[((y + 1) % S) * S + x];
    const nx = (l - r) * scale, ny = (u - d) * scale, nz = 1;
    const len = Math.hypot(nx, ny, nz);
    img.data[i * 4] = (nx / len * .5 + .5) * 255;
    img.data[i * 4 + 1] = (ny / len * .5 + .5) * 255;
    img.data[i * 4 + 2] = (nz / len * .5 + .5) * 255;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* 金色隔热毯色图 */
function mliTexture() {
  const S = 512; const [c, g] = cv(S, S);
  const rnd = mulberry(19);
  g.fillStyle = '#b99a52'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * S, y = rnd() * S, w = 20 + rnd() * 120, h = 8 + rnd() * 40;
    g.fillStyle = rnd() > .5 ? `rgba(240,222,168,${.08 + rnd() * .22})` : `rgba(110,86,34,${.06 + rnd() * .2})`;
    g.save(); g.translate(x, y); g.rotate((rnd() - .5) * .5); g.fillRect(0, 0, w, h); g.restore();
  }
  for (let y = 0; y < S; y += 42) {
    g.strokeStyle = 'rgba(96,66,12,.35)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke();
  }
  return c;
}

/* 国旗 */
function flagTexture() {
  const [c, g] = cv(300, 200);
  g.fillStyle = '#de2910'; g.fillRect(0, 0, 300, 200);
  const star = (cx, cy, r, rot) => {
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = rot + i * 4 * Math.PI / 5;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath(); g.fillStyle = '#ffde00'; g.fill();
  };
  star(50, 50, 30, -Math.PI / 2);
  [[100, 20], [120, 45], [120, 80], [100, 105]].forEach(([x, y]) => star(x, y, 10, -Math.PI / 2));
  return c;
}

/* 地球（纸感淡彩：海洋 + 云带 + 气旋） */
function earthTexture() {
  const W = 2048, H = 1024; const [c, g] = cv(W, H);
  const rnd = mulberry(101);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#b9cdd9'); grd.addColorStop(.3, '#7fa2bd');
  grd.addColorStop(.55, '#6d94b3'); grd.addColorStop(.8, '#7fa2bd');
  grd.addColorStop(1, '#b9cdd9');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);

  // 洋流深浅
  for (let i = 0; i < 90; i++) {
    const x = rnd() * W, y = rnd() * H, r = 90 + rnd() * 260;
    g.fillStyle = `rgba(${40 + rnd() * 30 | 0},${80 + rnd() * 40 | 0},${115 + rnd() * 40 | 0},.10)`;
    g.beginPath(); g.ellipse(x, y, r, r * (.25 + rnd() * .4), rnd() * 3, 0, Math.PI * 2); g.fill();
  }
  // 陆地（暖褐，低对比）
  for (let i = 0; i < 34; i++) {
    const x = rnd() * W, y = 120 + rnd() * (H - 240), r = 60 + rnd() * 210;
    g.fillStyle = `rgba(${168 + rnd() * 34 | 0},${158 + rnd() * 30 | 0},${124 + rnd() * 26 | 0},.55)`;
    g.beginPath();
    for (let a = 0; a < Math.PI * 2; a += .22) {
      const rr = r * (.5 + rnd() * .8);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * .58;
      a ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath(); g.fill();
  }
  // 云带：沿纬向拉伸的絮状云
  for (let b = 0; b < 7; b++) {
    const by = 90 + b * (H - 180) / 6 + (rnd() - .5) * 60;
    const drift = (rnd() - .5) * 40;
    for (let i = 0; i < 130; i++) {
      const x = rnd() * W;
      const y = by + Math.sin(x / W * Math.PI * (2 + b % 3)) * 46 + drift + (rnd() - .5) * 70;
      const r = 22 + rnd() * 90;
      g.fillStyle = `rgba(255,253,247,${.07 + rnd() * .3})`;
      g.beginPath(); g.ellipse(x, y, r, r * (.18 + rnd() * .26), (rnd() - .5) * .5, 0, Math.PI * 2); g.fill();
    }
  }
  // 气旋
  for (let k = 0; k < 5; k++) {
    const cx = rnd() * W, cy = 180 + rnd() * (H - 360), R = 70 + rnd() * 90;
    for (let i = 0; i < 150; i++) {
      const a = i * .26, rr = R * (i / 150);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * .62;
      g.fillStyle = `rgba(255,255,252,${.30 * (1 - i / 190)})`;
      g.beginPath(); g.ellipse(x, y, 16 + rr * .16, 9 + rr * .09, a, 0, Math.PI * 2); g.fill();
    }
  }
  return c;
}

/* ============================================================
   2. 材质
   ============================================================ */
const allMats = [];
const clipMats = [];
function reg(m, { clip = false } = {}) {
  allMats.push(m);
  if (clip) clipMats.push(m);
  return m;
}

const hullTexA = tex(hullTexture(7), { repeat: [3, 1] });
const hullTexB = tex(hullTexture(23, '#d4d0c6'), { repeat: [2, 1] });
const crinkleTex = tex(crinkleNormal(5, 1.6), { srgb: false, repeat: [4, 2] });
const crinkleTexFine = tex(crinkleNormal(11, 1.1), { srgb: false, repeat: [8, 3] });
const mliTex = tex(mliTexture(), { repeat: [2, 1] });

const M = {
  hull: reg(new THREE.MeshStandardMaterial({
    map: hullTexA, color: 0xffffff, roughness: .62, metalness: .07,
    envMapIntensity: .28, normalMap: crinkleTexFine, normalScale: new THREE.Vector2(.12, .12)
  }), { clip: true }),
  hullB: reg(new THREE.MeshStandardMaterial({
    map: hullTexB, color: 0xffffff, roughness: .68, metalness: .06,
    envMapIntensity: .25, normalMap: crinkleTexFine, normalScale: new THREE.Vector2(.14, .14)
  }), { clip: true }),
  hullDark: reg(new THREE.MeshStandardMaterial({
    color: 0xb8b3a8, roughness: .74, metalness: .1, envMapIntensity: .22
  }), { clip: true }),
  mli: reg(new THREE.MeshStandardMaterial({
    map: mliTex, color: 0xffffff, roughness: .46, metalness: .55,
    envMapIntensity: .4, normalMap: crinkleTex, normalScale: new THREE.Vector2(.5, .5)
  }), { clip: true }),
  capsule: reg(new THREE.MeshStandardMaterial({
    color: 0xd6d6d2, roughness: .28, metalness: .62, envMapIntensity: .55,
    normalMap: crinkleTexFine, normalScale: new THREE.Vector2(.1, .1)
  }), { clip: true }),
  metal: reg(new THREE.MeshStandardMaterial({
    color: 0x9ba1a7, roughness: .34, metalness: .92, envMapIntensity: .6
  })),
  metalDark: reg(new THREE.MeshStandardMaterial({
    color: 0x5d6167, roughness: .45, metalness: .85, envMapIntensity: .45
  })),
  truss: reg(new THREE.MeshStandardMaterial({
    color: 0xa8aeb4, roughness: .38, metalness: .88, envMapIntensity: .55
  })),
  dock: reg(new THREE.MeshStandardMaterial({
    color: 0x8e9a90, roughness: .4, metalness: .8, envMapIntensity: .5
  })),
  blanket: reg(new THREE.MeshStandardMaterial({
    color: 0xe6e3db, roughness: .88, metalness: .02, envMapIntensity: .18,
    normalMap: crinkleTex, normalScale: new THREE.Vector2(.7, .7)
  })),
  glass: reg(new THREE.MeshStandardMaterial({
    color: 0x2b3a44, roughness: .12, metalness: .5, envMapIntensity: .9
  })),
  radiator: reg(new THREE.MeshStandardMaterial({
    color: 0xe8e6e0, roughness: .3, metalness: .25, envMapIntensity: .4, side: THREE.DoubleSide
  })),
  flag: reg(new THREE.MeshStandardMaterial({
    map: tex(flagTexture()), roughness: .7, metalness: 0, envMapIntensity: .2
  })),
  interior: reg(new THREE.MeshStandardMaterial({ color: 0xcfcabb, roughness: .85, metalness: .05 })),
  interiorAccent: reg(new THREE.MeshStandardMaterial({ color: 0x7f9aa8, roughness: .8, metalness: .05 })),
  interiorWarm: reg(new THREE.MeshStandardMaterial({ color: 0xc4a06a, roughness: .8, metalness: .05 })),
  ghost: new THREE.MeshStandardMaterial({
    color: 0xbdb6a6, roughness: .9, metalness: 0, transparent: true, opacity: .16,
    depthWrite: false, envMapIntensity: .1
  })
};

function wingMat(canvas, emissiveHex) {
  const t = tex(canvas);
  return reg(new THREE.MeshStandardMaterial({
    map: t, color: 0xffffff, roughness: .44, metalness: .22,
    envMapIntensity: .45, side: THREE.DoubleSide,
    emissive: new THREE.Color(emissiveHex), emissiveIntensity: .12, emissiveMap: t
  }));
}
const MAT_FLEX_BIG = wingMat(flexWingTexture(150, 11), 0x3a1408);   // 实验舱 27m × 2.0m
const MAT_FLEX_TH = wingMat(flexWingTexture(64, 15), 0x3a1408);     // 天和 12m × 2.8m
const MAT_RIGID_SZ = wingMat(rigidWingTexture(24, 7), 0x0a1830);
const MAT_RIGID_TZ = wingMat(rigidWingTexture(28, 8), 0x0a1830);

/* ============================================================
   3. 几何助手
   ============================================================ */
const G = {
  // 沿 Z 轴的圆柱，z0→z1
  cylZ(d, z0, z1, seg = 40, dEnd = null) {
    const len = z1 - z0;
    const g = new THREE.CylinderGeometry(d / 2, (dEnd ?? d) / 2, len, seg, 1, false);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, z0 + len / 2);
    return g;
  },
  cylX(d, x0, x1, seg = 20) {
    const len = x1 - x0;
    const g = new THREE.CylinderGeometry(d / 2, d / 2, len, seg);
    g.rotateZ(Math.PI / 2);
    g.translate(x0 + len / 2, 0, 0);
    return g;
  },
  cylY(d, y0, y1, seg = 20) {
    const len = y1 - y0;
    const g = new THREE.CylinderGeometry(d / 2, d / 2, len, seg);
    g.translate(0, y0 + len / 2, 0);
    return g;
  },
  box(w, h, d) { return new THREE.BoxGeometry(w, h, d); },
  sphere(r, seg = 32) { return new THREE.SphereGeometry(r, seg, seg / 2); },
  ringZ(d, tube, z, seg = 40) {
    const g = new THREE.TorusGeometry(d / 2, tube, 8, seg);
    g.translate(0, 0, z);
    return g;
  }
};

function mesh(geo, mat, parent, pos, rot) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

/* 舱表设备散布（确定性） */
function greebles(parent, { r, z0, z1, n, seed, mat = M.hullDark, size = [.26, .11, .38] }) {
  const rnd = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const z = z0 + rnd() * (z1 - z0);
    const w = size[0] * (.5 + rnd()), h = size[1] * (.4 + rnd() * 1.4), d = size[2] * (.4 + rnd());
    const m = mesh(G.box(w, h, d), mat, parent);
    m.position.set(Math.cos(a) * (r + h / 2), Math.sin(a) * (r + h / 2), z);
    m.rotation.z = a - Math.PI / 2;
    m.rotation.y = (rnd() - .5) * .3;
    m.userData.detail = true;
  }
}

/* 舱外扶手（黄色栏杆） */
const MAT_HANDRAIL = reg(new THREE.MeshStandardMaterial({
  color: 0xd8b23c, roughness: .5, metalness: .35, envMapIntensity: .35
}));
function handrails(parent, { r, z0, z1, n, seed }) {
  const rnd = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const z = z0 + rnd() * (z1 - z0);
    const len = .5 + rnd() * .5;
    const g = new THREE.Group();
    const bar = mesh(G.cylZ(.055, -len / 2, len / 2, 8), MAT_HANDRAIL, g);
    bar.userData.detail = true;
    for (const s of [-1, 1]) {
      const leg = mesh(G.cylY(.05, -.16, 0, 6), MAT_HANDRAIL, g);
      leg.position.set(0, 0, s * len / 2 * .9);
      leg.userData.detail = true;
    }
    g.position.set(Math.cos(a) * (r + .16), Math.sin(a) * (r + .16), z);
    g.rotation.z = a - Math.PI / 2;
    parent.add(g);
  }
}

/* 对接机构 */
function dockingPort(parent, z, d = 1.35, facing = 1) {
  const g = new THREE.Group();
  mesh(G.cylZ(d, 0, .22 * facing, 28), M.metalDark, g);
  mesh(G.ringZ(d * .96, .075, .2 * facing, 28), M.dock, g);
  mesh(G.cylZ(d * .62, .2 * facing, .34 * facing, 24), M.metal, g);
  mesh(G.ringZ(d * .6, .05, .33 * facing, 24), M.metalDark, g);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const p = mesh(G.box(.14, .1, .18), M.metal, g);
    p.position.set(Math.cos(a) * d * .42, Math.sin(a) * d * .42, .26 * facing);
    p.rotation.z = a;
  }
  g.position.z = z;
  parent.add(g);
  return g;
}

/* 国旗贴片 */
function flagPatch(parent, pos, rot, w = .9) {
  const m = mesh(new THREE.PlaneGeometry(w, w * 2 / 3), M.flag, parent, pos, rot);
  m.castShadow = false;
  return m;
}

/* ============================================================
   4. 太阳翼
   canonical: 展向 = 局部 X，驱动轴 = 局部 X，阵面法线 = 局部 Y
   ============================================================ */
const wingSpins = [];

function flexPanel(len, wid, mat, segs = 30) {
  const g = new THREE.PlaneGeometry(len, wid, segs, 5);
  g.rotateX(-Math.PI / 2);           // 法线 +Y，长边沿 X
  g.userData.base = g.attributes.position.array.slice();
  return g;
}
const flexPanels = [];

function buildWingPair({ style, mastFrom, mastTo, panelLen, panelWid, offset, mat, frameMat = M.truss }) {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  root.add(spin);
  wingSpins.push(spin);

  for (const side of [1, -1]) {
    // 桅杆 + 桁架
    const mast = mesh(G.cylX(.22, mastFrom * side, mastTo * side, 12), frameMat, spin);
    mast.castShadow = true;
    const nBrace = 4;
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < nBrace; i++) {
      const t0 = mastFrom + (mastTo - mastFrom) * i / nBrace;
      const t1 = mastFrom + (mastTo - mastFrom) * (i + 1) / nBrace;
      for (const s of [1, -1]) {
        const a = new THREE.Vector3(t0 * side, 0, s * .16);
        const b = new THREE.Vector3(t1 * side, 0, -s * .16);
        const dir = b.clone().sub(a);
        const br = mesh(new THREE.CylinderGeometry(.045, .045, dir.length(), 6), frameMat, spin);
        br.position.copy(a).add(b).multiplyScalar(.5);
        br.quaternion.setFromUnitVectors(up, dir.normalize());
      }
    }
    // 旋转关节
    mesh(G.cylX(.42, (mastFrom - .18) * side, (mastFrom + .18) * side, 16), M.metalDark, spin);

    // 阵面
    const cx = (mastTo + panelLen / 2) * side;
    if (style === 'tianhe') {
      // 2 块子阵沿 Z 排列
      for (const s of [1, -1]) {
        const geo = flexPanel(panelLen, panelWid, mat);
        const p = mesh(geo, mat, spin, [cx, 0, s * offset]);
        p.userData.flex = { amp: .3, phase: s };
        flexPanels.push(p);
        // 边框
        const fr = mesh(G.box(panelLen + .1, .07, .1), frameMat, spin, [cx, 0, s * offset + s * panelWid / 2]);
        const fr2 = mesh(G.box(panelLen + .1, .07, .1), frameMat, spin, [cx, 0, s * offset - s * panelWid / 2]);
        fr.castShadow = fr2.castShadow = false;
      }
      // 中间张紧梁
      mesh(G.cylX(.1, mastTo * side, (mastTo + panelLen) * side, 8), frameMat, spin);
    } else {
      // 2 列子阵沿 Z 并排
      for (const s of [1, -1]) {
        const geo = flexPanel(panelLen, panelWid, mat, 44);
        const p = mesh(geo, mat, spin, [cx, 0, s * offset]);
        p.userData.flex = { amp: .5, phase: s * 1.7 };
        flexPanels.push(p);
        const fr = mesh(G.box(panelLen + .1, .08, .09), frameMat, spin, [cx, 0, s * offset + s * panelWid / 2]);
        fr.castShadow = false;
      }
      mesh(G.cylX(.12, mastTo * side, (mastTo + panelLen) * side, 8), frameMat, spin);
      // 端部横梁
      mesh(G.cylZ(.1, -offset - panelWid / 2, offset + panelWid / 2, 8), frameMat, spin)
        .position.x = (mastTo + panelLen) * side;
    }
  }
  return root;
}

/* 刚性翼（神舟 / 天舟）：3 折板 */
function rigidWingPair({ mastTo, panelLen, panelWid, mat }) {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  root.add(spin);
  wingSpins.push(spin);
  for (const side of [1, -1]) {
    mesh(G.cylX(.14, .3 * side, mastTo * side, 10), M.truss, spin);
    const n = 3, gap = .12;
    const each = (panelLen - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const x0 = mastTo + i * (each + gap);
      const p = mesh(new THREE.PlaneGeometry(each, panelWid), mat, spin,
        [(x0 + each / 2) * side, 0, 0], [-Math.PI / 2, 0, 0]);
      p.castShadow = true; p.receiveShadow = true;
      const fr = mesh(G.box(each, .06, .07), M.truss, spin, [(x0 + each / 2) * side, 0, panelWid / 2]);
      fr.castShadow = false;
    }
    mesh(G.cylX(.08, mastTo * side, (mastTo + panelLen) * side, 6), M.truss, spin);
  }
  return root;
}

/* ============================================================
   5. 舱段
   ============================================================ */

/* ---- 天和核心舱 16.6 m ---- */
function buildTianhe() {
  const g = new THREE.Group();
  // 节点舱（球段），中心 Z=0
  const node = mesh(G.sphere(1.6, 40), M.hull, g);
  node.scale.set(1, 1, 1.05);
  // 节点舱三个对接环：前向 +Z、径向 +Y、两侧 ±X
  dockingPort(g, 1.55, 1.4, 1);
  const radial = dockingPort(g, 0, 1.4, 1);
  radial.rotation.x = -Math.PI / 2; radial.position.set(0, 1.55, 0);
  for (const s of [1, -1]) {
    const lat = dockingPort(g, 0, 1.5, 1);
    lat.rotation.y = s * Math.PI / 2; lat.position.set(s * 1.5, 0, 0);
  }
  // 节点舱舷窗
  for (const a of [0.6, 2.2, 3.9, 5.4]) {
    const w = mesh(G.cylY(.34, 0, .1, 16), M.glass, g);
    w.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, .55);
    w.rotation.z = a - Math.PI / 2;
    w.rotation.x = Math.PI / 2;
  }
  // 小柱段 ⌀2.8
  mesh(G.cylZ(2.8, -4.6, -1.5, 36), M.hull, g);
  mesh(G.ringZ(2.82, .06, -2.4, 36), M.metalDark, g);
  mesh(G.ringZ(2.82, .06, -3.6, 36), M.metalDark, g);
  // 锥过渡
  mesh(G.cylZ(2.8, -5.3, -4.6, 36, 4.2), M.hullB, g);
  // 大柱段 ⌀4.2
  mesh(G.cylZ(4.2, -10.6, -5.3, 44), M.hull, g);
  for (const z of [-6.4, -7.8, -9.2]) mesh(G.ringZ(4.22, .055, z, 44), M.metalDark, g);
  // 后端通道
  mesh(G.cylZ(4.2, -11.3, -10.6, 36, 2.6), M.hullB, g);
  mesh(G.cylZ(2.6, -11.9, -11.3, 30), M.hullDark, g);
  // 资源舱 ⌀3.3
  mesh(G.cylZ(2.6, -12.4, -11.9, 30, 3.3), M.hullB, g);
  mesh(G.cylZ(3.3, -15.0, -12.4, 36), M.hullB, g);
  for (const z of [-13.0, -13.7, -14.4]) mesh(G.ringZ(3.32, .07, z, 36), M.metal, g);
  // 资源舱贮箱（外露球）
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    mesh(G.sphere(.52, 20), M.hull, g, [Math.cos(a) * 1.55, Math.sin(a) * 1.55, -11.0]);
  }
  // 后向对接口（天舟）
  dockingPort(g, -15.0, 1.5, -1);
  // 发动机喷管
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const nz = mesh(G.cylZ(.22, -15.35, -15.0, 12, .42), M.metalDark, g);
    nz.position.set(Math.cos(a) * .95, Math.sin(a) * .95, 0);
  }
  // 中继天线（抛物面）
  const dish = new THREE.Group();
  const dg = new THREE.SphereGeometry(.72, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.6);
  const dm = mesh(dg, M.radiator, dish);
  dm.rotation.x = Math.PI;
  mesh(G.cylY(.07, 0, .5, 8), M.metal, dish, [0, -.25, 0]);
  mesh(G.cylY(.05, .1, .55, 6), M.metalDark, dish, [0, 0, 0]);
  dish.position.set(1.1, 1.9, -6.9);
  dish.rotation.set(-.5, 0, -.4);
  g.add(dish);
  // 鞭状天线
  for (const [x, y, z] of [[-1.6, 1.4, -8.4], [1.7, -1.2, -9.6], [-1.2, -1.7, -6.2]]) {
    mesh(G.cylY(.035, 0, 1.5, 6), M.metal, g, [x, y, z]);
  }
  // 国旗
  flagPatch(g, [0, 2.11, -7.4], [-Math.PI / 2, 0, 0], 1.0);
  flagPatch(g, [2.11, 0, -8.6], [0, Math.PI / 2, 0], .9);

  greebles(g, { r: 2.1, z0: -10.3, z1: -5.6, n: 46, seed: 3 });
  greebles(g, { r: 1.4, z0: -4.4, z1: -1.8, n: 22, seed: 8, size: [.24, .14, .36] });
  greebles(g, { r: 1.65, z0: -14.8, z1: -12.5, n: 30, seed: 15, mat: M.mli, size: [.22, .09, .3] });
  handrails(g, { r: 2.1, z0: -10.2, z1: -5.8, n: 16, seed: 21 });
  handrails(g, { r: 1.4, z0: -4.3, z1: -1.9, n: 8, seed: 27 });

  // 太阳翼：2 副，每副 2 块子阵沿 Z 排列，单翼约 67 m²
  const wings = buildWingPair({
    style: 'tianhe', mastFrom: 2.05, mastTo: 3.4,
    panelLen: 12.0, panelWid: 2.8, offset: 1.75, mat: MAT_FLEX_TH
  });
  wings.position.set(0, 0, -7.0);
  g.add(wings);

  // 舱内（剖切可见）
  const inner = new THREE.Group();
  mesh(G.box(3.4, .1, 5.4), M.interior, inner, [0, -.7, -7.9]);
  for (let i = 0; i < 3; i++) {
    mesh(G.box(.9, 1.5, .7), M.interiorAccent, inner, [-1.2, .1, -6.2 - i * 1.1]);
  }
  mesh(G.box(1.1, .8, 1.0), M.interiorWarm, inner, [1.1, -.2, -6.6]);
  mesh(G.box(1.0, 1.2, .8), M.interiorAccent, inner, [1.2, 0, -8.6]);
  for (let i = 0; i < 5; i++) {
    mesh(G.box(.5, 1.6, .8), M.interior, inner, [1.55, .2, -5.9 - i * 1.0]);
    mesh(G.box(.5, 1.6, .8), M.interior, inner, [-1.55, .2, -5.9 - i * 1.0]);
  }
  g.add(inner);

  return g;
}

/* ---- 实验舱通用（问天 17.9 / 梦天 17.88） ---- */
function buildLab({ length, kind }) {
  const g = new THREE.Group();
  const workLen = 8.0, airlockLen = 5.5;
  const resLen = length - .6 - workLen - airlockLen;
  // 对接过渡
  mesh(G.cylZ(1.5, 0, .6, 24), M.metalDark, g);
  // 工作舱 ⌀4.2
  mesh(G.cylZ(4.2, .6, .6 + workLen, 44), M.hull, g);
  for (const z of [2.0, 3.6, 5.2, 6.8]) mesh(G.ringZ(4.22, .055, z, 44), M.metalDark, g);
  // 中段（气闸舱 / 载荷舱）
  const zMid0 = .6 + workLen, zMid1 = zMid0 + airlockLen;
  mesh(G.cylZ(4.2, zMid0, zMid1, 44), M.hullB, g);
  mesh(G.ringZ(4.24, .07, zMid0 + .1, 44), M.metal, g);
  mesh(G.ringZ(4.24, .07, zMid1 - .1, 44), M.metal, g);
  // 资源舱（锥形收口）
  mesh(G.cylZ(4.2, zMid1 + .7, zMid1, 36, 3.0), M.hullB, g);
  mesh(G.cylZ(3.0, length - .5, zMid1 + .7, 36), M.hullB, g);
  mesh(G.cylZ(3.0, length, length - .5, 30, 2.4), M.hullDark, g);
  for (const z of [zMid1 + 1.4, zMid1 + 2.2]) mesh(G.ringZ(3.02, .06, z, 36), M.metal, g);
  // 尾部发动机
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const nz = mesh(G.cylZ(.18, length + .3, length, 10, .34), M.metalDark, g);
    nz.position.set(Math.cos(a) * .8, Math.sin(a) * .8, 0);
  }

  if (kind === 'wentian') {
    // 气闸舱出舱舱门（圆形）
    const hatch = mesh(G.cylY(1.5, 0, .16, 28), M.hullDark, g);
    hatch.position.set(0, 2.05, zMid0 + 2.4);
    mesh(G.ringZ(1.5, .09, 0, 28), M.dock, g).position.set(0, 2.16, zMid0 + 2.4);
    g.children[g.children.length - 1].rotation.x = Math.PI / 2;
    // 小机械臂基座
    mesh(G.cylY(.4, 0, .35, 16), M.metalDark, g, [0, 2.05, 4.2]);
    // 暴露实验平台
    for (let i = 0; i < 3; i++) {
      mesh(G.box(1.0, .22, 1.4), M.mli, g, [-1.9, .9, zMid0 + 1.0 + i * 1.6]);
    }
    flagPatch(g, [0, 2.11, 3.2], [-Math.PI / 2, 0, 0], 1.0);
  } else {
    // 梦天：货物气闸舱方形舱门
    const door = mesh(G.box(1.9, .18, 2.3), M.hullDark, g, [0, 2.06, zMid0 + 2.6]);
    mesh(G.box(2.05, .1, 2.45), M.metal, g, [0, 2.0, zMid0 + 2.6]);
    // 暴露实验平台（方格阵列）
    const grid = new THREE.Group();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      mesh(G.box(.42, .16, .42), M.mli, grid, [-.75 + i * .5, 0, -.5 + j * .5]);
    }
    grid.position.set(-1.95, .95, zMid0 + 2.4);
    grid.rotation.z = .35;
    g.add(grid);
    // 微小飞行器释放机构
    mesh(G.box(.7, .5, .9), M.metalDark, g, [1.85, -.6, zMid1 - 1.2]);
    flagPatch(g, [0, 2.11, 3.2], [-Math.PI / 2, 0, 0], 1.0);
  }

  greebles(g, { r: 2.1, z0: 1.0, z1: zMid0 - .4, n: 40, seed: kind === 'wentian' ? 41 : 57 });
  greebles(g, { r: 2.1, z0: zMid0 + .3, z1: zMid1 - .3, n: 38, seed: kind === 'wentian' ? 63 : 71, mat: M.mli, size: [.24, .1, .34] });
  greebles(g, { r: 1.5, z0: zMid1 + .9, z1: length - .7, n: 34, seed: kind === 'wentian' ? 83 : 97, mat: M.mli, size: [.22, .09, .3] });
  handrails(g, { r: 2.1, z0: 1.2, z1: zMid0 - .6, n: 14, seed: kind === 'wentian' ? 103 : 109 });

  // 太阳翼：2 副，每副 2 列子阵，单翼 110 m²，展开 27 m
  const wings = buildWingPair({
    style: 'lab', mastFrom: .3, mastTo: 1.0,
    panelLen: 27.0, panelWid: 2.0, offset: 1.15, mat: MAT_FLEX_BIG
  });
  wings.position.set(0, 0, length);
  g.add(wings);

  // 舱内
  const inner = new THREE.Group();
  mesh(G.box(3.4, .1, workLen - 1), M.interior, inner, [0, -.7, .6 + workLen / 2]);
  for (let i = 0; i < 6; i++) {
    mesh(G.box(.5, 1.7, .85), M.interior, inner, [1.55, .2, 1.4 + i * 1.1]);
    mesh(G.box(.5, 1.7, .85), M.interiorAccent, inner, [-1.55, .2, 1.4 + i * 1.1]);
  }
  g.add(inner);

  return g;
}

/* ---- 神舟载人飞船 ---- */
function buildShenzhou() {
  const g = new THREE.Group();
  // 轨道舱 ⌀2.25
  mesh(G.cylZ(2.25, 0, 2.8, 30), M.hullB, g);
  mesh(G.ringZ(2.27, .06, 1.0, 30), M.metalDark, g);
  mesh(G.ringZ(2.27, .06, 2.0, 30), M.metalDark, g);
  // 返回舱（钟形）
  mesh(G.cylZ(2.25, 3.4, 2.8, 30, 2.5), M.capsule, g);
  mesh(G.cylZ(2.5, 5.1, 3.4, 30, 1.5), M.capsule, g);
  mesh(G.sphere(.75, 20), M.capsule, g, [0, 0, 5.1]).scale.set(1, 1, .6);
  // 推进舱 ⌀2.8
  mesh(G.cylZ(1.5, 5.5, 5.1, 24, 2.8), M.hullB, g);
  mesh(G.cylZ(2.8, 8.6, 5.5, 32), M.hullB, g);
  mesh(G.cylZ(2.8, 9.0, 8.6, 32, 2.2), M.hullDark, g);
  for (const z of [6.2, 7.2, 8.2]) mesh(G.ringZ(2.82, .06, z, 32), M.metal, g);
  // 发动机
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const nz = mesh(G.cylZ(.2, 9.35, 9.0, 10, .4), M.metalDark, g);
    nz.position.set(Math.cos(a) * .8, Math.sin(a) * .8, 0);
  }
  // 刚性太阳翼 2 副
  const wings = rigidWingPair({ mastTo: 1.5, panelLen: 6.2, panelWid: 1.5, mat: MAT_RIGID_SZ });
  wings.position.set(0, 0, 7.0);
  g.add(wings);
  greebles(g, { r: 1.4, z0: 5.7, z1: 8.4, n: 22, seed: 131, size: [.22, .12, .3] });
  greebles(g, { r: 1.12, z0: .3, z1: 2.6, n: 14, seed: 137, size: [.2, .1, .26] });
  flagPatch(g, [0, 1.14, 1.6], [-Math.PI / 2, 0, 0], .7);
  return g;
}

/* ---- 天舟货运飞船 ---- */
function buildTianzhou() {
  const g = new THREE.Group();
  // 货物舱 ⌀3.35
  mesh(G.cylZ(1.5, 0, .5, 24), M.metalDark, g);
  mesh(G.cylZ(3.35, .5, 6.0, 36), M.hull, g);
  for (const z of [1.6, 3.0, 4.4, 5.6]) mesh(G.ringZ(3.37, .06, z, 36), M.metalDark, g);
  // 推进舱 ⌀2.8
  mesh(G.cylZ(3.35, 6.6, 6.0, 32, 2.8), M.hullB, g);
  mesh(G.cylZ(2.8, 10.2, 6.6, 32), M.hullB, g);
  mesh(G.cylZ(2.8, 10.6, 10.2, 32, 2.2), M.hullDark, g);
  for (const z of [7.4, 8.6, 9.6]) mesh(G.ringZ(2.82, .06, z, 32), M.metal, g);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const nz = mesh(G.cylZ(.22, 11.0, 10.6, 10, .44), M.metalDark, g);
    nz.position.set(Math.cos(a) * .85, Math.sin(a) * .85, 0);
  }
  const wings = rigidWingPair({ mastTo: 1.6, panelLen: 7.4, panelWid: 1.7, mat: MAT_RIGID_TZ });
  wings.position.set(0, 0, 8.4);
  g.add(wings);
  greebles(g, { r: 1.67, z0: .8, z1: 5.8, n: 26, seed: 149, size: [.26, .14, .4] });
  greebles(g, { r: 1.4, z0: 6.8, z1: 10.0, n: 22, seed: 151, mat: M.mli });
  flagPatch(g, [0, 1.69, 2.4], [-Math.PI / 2, 0, 0], .9);
  return g;
}

/* ---- 大机械臂 10 m 七自由度 ---- */
function buildBigArm() {
  const root = new THREE.Group();
  const joints = {};
  const seg = (parent, len, r) => {
    const m = mesh(G.cylY(r * 2, 0, len, 16), M.blanket, parent);
    // 包覆布分段缝
    for (let i = 1; i < Math.floor(len / .8); i++) {
      const t = mesh(G.ringZ(r * 2.04, .035, 0, 16), M.hullDark, parent);
      t.rotation.x = Math.PI / 2; t.position.y = i * .8;
    }
    return m;
  };
  const jointBox = (parent, s = .42) => {
    mesh(G.box(s, s * .9, s), M.hullDark, parent);
    mesh(G.box(s * .7, .04, s * .7), M.metalDark, parent, [0, s * .46, 0]);
  };

  // 基座
  mesh(G.cylY(.5, 0, .35, 20), M.metalDark, root);
  const j1 = new THREE.Group(); j1.position.y = .35; root.add(j1); joints.yaw = j1;
  jointBox(j1, .5);
  const j2 = new THREE.Group(); j2.position.y = .3; j1.add(j2); joints.shoulder = j2;
  jointBox(j2, .46);
  seg(j2, 4.6, .19);
  const j3 = new THREE.Group(); j3.position.y = 4.6; j2.add(j3); joints.elbow = j3;
  jointBox(j3, .44);
  seg(j3, 4.6, .17);
  const j4 = new THREE.Group(); j4.position.y = 4.6; j3.add(j4); joints.wrist = j4;
  jointBox(j4, .38);
  // 末端执行器
  mesh(G.cylY(.3, 0, .4, 16), M.metal, j4, [0, .2, 0]);
  mesh(G.cylY(.34, .4, .55, 16), M.metalDark, j4, [0, 0, 0]);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    mesh(G.box(.07, .22, .07), M.metal, j4, [Math.cos(a) * .16, .62, Math.sin(a) * .16]);
  }
  // 目标适配器
  mesh(G.cylY(.16, 0, .3, 12), M.metalDark, root, [0, -.3, 0]);
  root.userData.joints = joints;
  return root;
}

/* ---- 小机械臂 3 m ---- */
function buildSmallArm() {
  const root = new THREE.Group();
  mesh(G.cylY(.3, 0, .25, 14), M.metalDark, root);
  const j1 = new THREE.Group(); j1.position.y = .25; root.add(j1);
  mesh(G.box(.3, .28, .3), M.hullDark, j1);
  const j2 = new THREE.Group(); j2.position.y = .18; j1.add(j2);
  mesh(G.cylY(.22, 0, 1.4, 12), M.blanket, j2);
  const j3 = new THREE.Group(); j3.position.y = 1.4; j2.add(j3);
  mesh(G.box(.26, .24, .26), M.hullDark, j3);
  mesh(G.cylY(.2, 0, 1.3, 12), M.blanket, j3);
  mesh(G.cylY(.22, 1.3, 1.5, 12), M.metal, j3);
  root.userData.joints = { shoulder: j2, elbow: j3 };
  return root;
}

export function buildStation() {
  const group = new THREE.Group();
  const parts = {};
  parts.tianhe = buildTianhe();
  group.add(parts.tianhe);
  parts.wentian = buildLab({ length: 17.9, kind: 'wentian' });
  parts.wentian.rotation.y = Math.PI / 2;
  parts.wentian.position.set(1.6, 0, 0);
  group.add(parts.wentian);
  parts.mengtian = buildLab({ length: 17.88, kind: 'mengtian' });
  parts.mengtian.rotation.y = -Math.PI / 2;
  parts.mengtian.position.set(-1.6, 0, 0);
  group.add(parts.mengtian);
  parts.shenzhou = buildShenzhou();
  parts.shenzhou.position.set(0, 0, 1.9);
  group.add(parts.shenzhou);
  parts.tianzhou = buildTianzhou();
  parts.tianzhou.rotation.y = Math.PI;
  parts.tianzhou.position.set(0, 0, -15.3);
  group.add(parts.tianzhou);
  parts.arm = buildBigArm();
  parts.arm.position.set(1.5, 1.55, -8.2);
  parts.arm.rotation.set(0, 0, -.5);
  group.add(parts.arm);
  parts.armSmall = buildSmallArm();
  parts.armSmall.position.set(5.8, 2.35, 0);
  parts.armSmall.rotation.set(0, 0, -.6);
  group.add(parts.armSmall);
  group.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return { group, parts, wingSpins, flexPanels, materials: allMats, mats: M };
}

export { mulberry, cv, tex };
