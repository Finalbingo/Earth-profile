import * as THREE from 'three';
import { createEarth } from './earth.js';
import { buildStation } from './station.js';
import { createHUD } from './hud.js';
import { createAudio } from './audio.js';

const $ = id => document.getElementById(id);
const D2R = Math.PI / 180;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

/* ============================================================
   渲染器：单画布、双场景、双相机分层
   地球层归一化（R=1），站点层以米为单位，各自深度范围小，精度高。
   ============================================================ */
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.autoClear = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x04070d, 1);

const earthScene = new THREE.Scene();
const stationScene = new THREE.Scene();
const camE = new THREE.PerspectiveCamera(55, 1, .001, 30);
const camS = new THREE.PerspectiveCamera(55, 1, 1, 30000);

const earth = createEarth();
earthScene.add(earth.group, earth.stars, earth.sunSprite, earth.sky);
earthScene.add(camE);
/* 镜头眩光属相机伪影：参考构图太阳位于画框左上，与物理太阳方向解耦 */
const glare = earth.sunSprite.clone();
glare.material = earth.sunSprite.material.clone();
glare.material.depthTest = false;
glare.renderOrder = 30;
glare.position.set(-1.15, .78, -1.4);
glare.scale.setScalar(.55);
camE.add(glare);

const station = buildStation();
station.group.visible = false;
stationScene.add(station.group);
const stationLight = new THREE.DirectionalLight(0xfff4e4, 2.4);
stationScene.add(stationLight);
stationScene.add(new THREE.AmbientLight(0x8fa4b8, .5));
const stationFill = new THREE.DirectionalLight(0xbcd2e6, .5);
stationFill.position.set(-1, -.4, -.6);
stationScene.add(stationFill);

const audio = createAudio();
const hud = createHUD(audio);

/* ============================================================
   状态
   ============================================================ */
const DEFAULTS = {
  alt: 400, time: 1, fov: 68, dist: 450, sun: -30,
  cover: 0.75, scatter: 3.4, exp: 1.12, star: 1, hud: 1,
  relief: 1, milky: 1, storm: 0.8,
  grid: false, labels: true, wire: false, spin: true,
};
const S = { ...DEFAULTS };
const look = { yaw: .55, pitch: 30 * D2R, tYaw: .55, tPitch: 30 * D2R };
const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
let dragging = false, lastX = 0, lastY = 0;
let needsRender = true;
const invalidate = () => { needsRender = true; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const demoPass = new URLSearchParams(location.search).has('pass');

/* ============================================================
   相机姿态
   ============================================================ */
const _h = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1);
const _fwd = new THREE.Vector3(), _up = new THREE.Vector3(), _right = new THREE.Vector3();
const _camPos = new THREE.Vector3();

function updateCamera() {
  const r = 1 + S.alt / 6371;
  _camPos.set(0, 0, r);
  const yaw = look.yaw + parallax.x * .012;
  const pitch = clamp(look.pitch + parallax.y * .008, -20 * D2R, 60 * D2R);
  _h.set(Math.sin(yaw), -Math.cos(yaw), 0);
  _fwd.copy(_h).multiplyScalar(Math.cos(pitch)).addScaledVector(_z, -Math.sin(pitch));
  _up.copy(_h).multiplyScalar(Math.sin(pitch)).addScaledVector(_z, Math.cos(pitch));
  _right.crossVectors(_fwd, _up).normalize();
  for (const c of [camE, camS]) {
    c.position.copy(_camPos);
    c.up.copy(_up);
    c.lookAt(_camPos.clone().add(_fwd));
    c.fov = S.fov;
    c.updateProjectionMatrix();
  }
  camS.position.set(0, 0, 0);
  camS.up.copy(_up);
  camS.lookAt(_fwd);
  camS.updateMatrixWorld();
}

/* ============================================================
   过境事件状态机
   ============================================================ */
const pass = {
  state: 'IDLE', t: 0, dur: 14, wait: 22, az0: 0, el0: 0, az1: 0, el1: 0,
  basis: null, dir: new THREE.Vector3(), visible: false, elev: 0,
};
function schedulePass(delay) {
  pass.state = 'IDLE'; pass.t = 0;
  pass.wait = delay ?? (90 + Math.random() * 60);
  $('passState').textContent = '下次过境';
  $('warnSq').classList.remove('hot');
}
function startPass() {
  pass.state = 'PASS'; pass.t = 0;
  pass.dur = demoPass ? 16 : 9 + Math.random() * 11;
  const side = Math.random() < .5 ? 1 : -1;
  pass.az0 = -38 * side; pass.az1 = 38 * side;
  /* 基准仰角相对视线轴（轴本身低于地平 24°），+6°≈贴近地平线，峰值留在天空带内 */
  pass.el0 = 6; pass.el1 = 18 + Math.random() * 10;
  pass.basis = { f: _fwd.clone(), r: _right.clone(), u: _up.clone() };
  $('passState').textContent = '过境中';
  $('warnSq').classList.add('hot');
  hud.say('<b>天宫</b> 进入视野 · 过境开始', true, 3600);
  audio.alert();
}
function passDir(p) {
  const az = lerp(pass.az0, pass.az1, p) * D2R;
  const el = (pass.el0 + (pass.el1 - pass.el0) * Math.sin(p * Math.PI)) * D2R;
  const b = pass.basis;
  return new THREE.Vector3()
    .addScaledVector(b.f, Math.cos(az) * Math.cos(el))
    .addScaledVector(b.r, Math.sin(az) * Math.cos(el))
    .addScaledVector(b.u, Math.sin(el));
}
const _toCenter = new THREE.Vector3(), _sd = new THREE.Vector3();
function updatePass(dt) {
  pass.t += dt * S.time;
  if (pass.state === 'IDLE') {
    const left = Math.max(0, pass.wait - pass.t);
    $('passClock').textContent = fmt(left);
    if (left <= 0) startPass();
    pass.visible = false;
    station.group.visible = false;
    return;
  }
  const p = clamp(pass.t / pass.dur, 0, 1);
  $('passClock').textContent = fmt(Math.max(0, pass.dur - pass.t));
  pass.dir.copy(passDir(p));
  /* 站点世界位置（地球层坐标）→ 站点层以米表示 */
  const distKm = S.dist / 1000;
  const worldPos = _camPos.clone().addScaledVector(pass.dir, distKm / 6371);
  /* 是否落到地平线以下：视线与地球求交 */
  _toCenter.copy(worldPos).sub(_camPos).normalize();
  const b = _toCenter.dot(_camPos);
  const c = _camPos.lengthSq() - 1;
  const disc = b * b - c;
  const blocked = disc > 0 && (-b - Math.sqrt(disc)) > 0 && (-b - Math.sqrt(disc)) < distKm / 6371;
  pass.visible = !blocked;
  pass.elev = Math.asin(clamp(pass.dir.dot(_up), -1, 1)) / D2R;
  station.group.position.copy(pass.dir).multiplyScalar(S.dist);
  station.group.visible = pass.visible;
  /* 缓慢自转 + 太阳翼对日 */
  station.group.rotation.y += dt * .05 * S.time;
  stationLight.position.copy(earth.sun).multiplyScalar(100);
  stationFill.position.copy(earth.sun).multiplyScalar(-60).add(new THREE.Vector3(0, 30, 0));
  if (p >= 1) {
    hud.say('<b>天宫</b> 离开视野 · 过境结束', false, 3200);
    audio.pass();
    schedulePass();
  }
}
function fmt(s) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/* ============================================================
   站点追踪框投影
   ============================================================ */
const _proj = new THREE.Vector3();
function updateReticle() {
  if (!pass.visible || !S.labels || document.body.classList.contains('hud-off')) {
    hud.placeReticle(null); return;
  }
  _proj.copy(station.group.position).project(camS);
  if (_proj.z > 1) { hud.placeReticle(null); return; }
  const W = innerWidth, H = innerHeight;
  const x = (_proj.x * .5 + .5) * W, y = (-_proj.y * .5 + .5) * H;
  const angSize = 56 / S.dist;
  const px = angSize / (2 * Math.tan(S.fov * D2R / 2)) * H;
  const w = clamp(px * 1.5, 60, 420), h = clamp(px * .8, 40, 240);
  hud.placeReticle(x, y, w, h, `${Math.round(S.dist)} M`, pass.state === 'PASS');
}

/* ============================================================
   控件绑定
   ============================================================ */
function bindRange(id, key, fmtFn, apply) {
  const el = $(id), out = $('v' + id.slice(1));
  const run = () => {
    S[key] = +el.value;
    if (out) out.textContent = fmtFn(S[key]);
    apply?.();
    invalidate();
  };
  el.addEventListener('input', run);
  return { el, run, set(v) { el.value = v; run(); } };
}
function bindCheck(id, key, apply) {
  const el = $(id);
  const run = () => { S[key] = el.checked; apply?.(); invalidate(); };
  el.addEventListener('change', run);
  return { el, run, set(v) { el.checked = v; run(); } };
}

const R = {};
R.alt = bindRange('cAlt', 'alt', v => `${v | 0} km`, () => { $('tAlt').textContent = S.alt | 0; });
R.time = bindRange('cTime', 'time', v => `${v.toFixed(1)}×`);
R.fov = bindRange('cFov', 'fov', v => `${v | 0}°`);
R.dist = bindRange('cDist', 'dist', v => `${v | 0} m`);
R.sun = bindRange('cSun', 'sun', v => `${v | 0}°`, () => earth.setSunAzimuth(S.sun));
R.cover = bindRange('cCover', 'cover', v => `${Math.round(v * 100)}%`, () => { earth.params.cover = S.cover; });
R.scatter = bindRange('cScat', 'scatter', v => v.toFixed(1), () => { earth.params.scatter = S.scatter; });
R.exp = bindRange('cExp', 'exp', v => v.toFixed(2), () => { renderer.toneMappingExposure = S.exp; });
R.star = bindRange('cStar', 'star', v => `${Math.round(v * 100)}%`, () => { earth.params.starDensity = S.star; });
R.hud = bindRange('cHud', 'hud', v => `${Math.round(v * 100)}%`, () => { document.documentElement.style.setProperty('--hud', S.hud); });
R.relief = bindRange('cRelief', 'relief', v => v.toFixed(2), () => { earth.params.relief = S.relief; });
R.milky = bindRange('cMilky', 'milky', v => v.toFixed(2), () => { earth.params.milky = S.milky; });
R.storm = bindRange('cStorm', 'storm', v => `${Math.round(v * 100)}%`, () => { earth.params.storm = S.storm; });
R.grid = bindCheck('cGrid', 'grid', () => document.body.classList.toggle('grid', S.grid));
R.labels = bindCheck('cLabels', 'labels');
R.wire = bindCheck('cWire', 'wire', () => { for (const m of station.materials) m.wireframe = S.wire; });
R.spin = bindCheck('cSpin', 'spin');

$('bReset').addEventListener('click', () => {
  audio.click();
  for (const k in R) R[k].set(DEFAULTS[k]);
  look.tYaw = .55; look.tPitch = 24 * D2R;
  schedulePass(22);
  hud.toast('已复位');
});
$('bRandom').addEventListener('click', () => {
  audio.click();
  R.sun.set(Math.round((Math.random() * 360 - 180) / 5) * 5);
  R.alt.set(200 + Math.round(Math.random() * 100) * 10);
  R.scatter.set(+(1.5 + Math.random() * 5).toFixed(1));
  R.cover.set(+(0.3 + Math.random() * .7).toFixed(2));
  look.tYaw = Math.random() * Math.PI * 2;
  look.tPitch = (14 + Math.random() * 18) * D2R;
  hud.toast('随机姿态');
});
$('bPass').addEventListener('click', () => { audio.click(); startPass(); hud.toast('触发过境'); });
$('bExport').addEventListener('click', () => {
  audio.click();
  renderFrame();
  const a = document.createElement('a');
  a.download = `orbit-terminal-${Date.now()}.png`;
  a.href = renderer.domElement.toDataURL('image/png');
  a.click();
  hud.toast('已导出 PNG');
});

/* HUD 总开关 */
$('hudToggle').addEventListener('click', () => {
  audio.click();
  const off = document.body.classList.toggle('hud-off');
  $('hudToggle').querySelector('b').textContent = off ? '开启' : '关闭';
  $('hudToggle').querySelector('i').textContent = off ? 'HUD ON' : 'HUD OFF';
  hud.toast(off ? 'HUD 已关闭 · 再次点击恢复' : 'HUD 已开启');
  invalidate();
});

/* 声音 */
const soundBtn = $('soundBtn');
function syncSound() {
  const on = audio.enabled;
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.classList.toggle('pending', on && !audio.ready);
  $('soundLabel').textContent = on ? (audio.ready ? '声音 开' : '声音 待激活') : '声音 关';
}
soundBtn.addEventListener('click', () => { audio.toggle(); audio.resume(); syncSound(); });
addEventListener('pointerdown', () => { audio.resume(); syncSound(); }, { once: false });
syncSound();

/* ============================================================
   视角交互：拖动环视 / 滚轮变焦 / 双击锁定
   ============================================================ */
canvas.addEventListener('pointerdown', e => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('dragging');
});
canvas.addEventListener('pointermove', e => {
  parallax.tx = (e.clientX / innerWidth - .5) * 2;
  parallax.ty = (e.clientY / innerHeight - .5) * 2;
  if (!dragging) return;
  look.tYaw -= (e.clientX - lastX) * .0032;
  look.tPitch = clamp(look.tPitch + (e.clientY - lastY) * .0022, -20 * D2R, 60 * D2R);
  lastX = e.clientX; lastY = e.clientY;
  invalidate();
});
const endDrag = () => { dragging = false; canvas.classList.remove('dragging'); };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  R.fov.set(clamp(S.fov + Math.sign(e.deltaY) * 3, 35, 85));
}, { passive: false });
canvas.addEventListener('dblclick', () => {
  if (pass.visible) { hud.openPanel('station'); audio.click(); }
});
canvas.addEventListener('keydown', e => {
  const step = .06;
  if (e.key === 'ArrowLeft') look.tYaw += step;
  else if (e.key === 'ArrowRight') look.tYaw -= step;
  else if (e.key === 'ArrowUp') look.tPitch = clamp(look.tPitch - step * .6, -20 * D2R, 60 * D2R);
  else if (e.key === 'ArrowDown') look.tPitch = clamp(look.tPitch + step * .6, -20 * D2R, 60 * D2R);
  else return;
  e.preventDefault(); invalidate();
});

/* ============================================================
   尺寸 / 画质自适应
   ============================================================ */
const DPR_LEVELS = [1.5, 1.25, 1];
let dprIdx = 0, slowWindows = 0, qualityCooldown = 0;
function resize() {
  const W = innerWidth, H = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_LEVELS[dprIdx]));
  renderer.setSize(W, H);
  camE.aspect = camS.aspect = W / H;
  camE.updateProjectionMatrix(); camS.updateProjectionMatrix();
  hud.layoutRails();
  invalidate();
}
addEventListener('resize', resize);

/* ============================================================
   渲染循环
   ============================================================ */
function renderFrame() {
  renderer.clear();
  renderer.render(earthScene, camE);
  renderer.clearDepth();
  renderer.render(stationScene, camS);
}

let last = performance.now(), winT = 0, winFrames = 0;
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const rdt = (now - last) / 1000;
  const dt = Math.min(.1, rdt);
  last = now;
  if (document.hidden) return;

  const k = 1 - Math.pow(.001, dt);
  look.yaw = lerp(look.yaw, look.tYaw, k);
  look.pitch = lerp(look.pitch, look.tPitch, k);
  parallax.x = lerp(parallax.x, parallax.tx, k * .6);
  parallax.y = lerp(parallax.y, parallax.ty, k * .6);

  updateCamera();
  earth.update(dt, S.time, camE, S.spin && !reduced);
  glare.material.opacity = .85 * (1 - THREE.MathUtils.smoothstep(S.sun, -40, 10));
  updatePass(dt);
  updateReticle();

  /* HUD 视差层 */
  const px = parallax.x * -6, py = parallax.y * -4;
  $('arcs').style.transform = `translate(${px}px,${py}px)`;
  $('optics').style.transform = `translate(${px * .4}px,${py * .4}px)`;

  hud.telemetry({
    alt: S.alt | 0,
    vel: (7.66 * Math.sqrt(400 / S.alt)).toFixed(2),
    el: pass.visible ? pass.elev.toFixed(1) : '—',
    dist: pass.visible ? Math.round(S.dist) : '—',
  });

  renderFrame();
  needsRender = false;

  winT += rdt; winFrames++;
  if (winT >= 5) {
    const fps = winFrames / winT;
    $('fps').textContent = Math.round(fps);
    $('dpr').textContent = DPR_LEVELS[dprIdx].toFixed(2);
    if (now > qualityCooldown) {
      if (fps < 45) { slowWindows++; if (slowWindows >= 2 && dprIdx < DPR_LEVELS.length - 1) { dprIdx++; slowWindows = 0; qualityCooldown = now + 15000; resize(); } }
      else slowWindows = 0;
    }
    winT = 0; winFrames = 0;
  }
}

/* ============================================================
   启动序列 / 兜底
   ============================================================ */
const bootLines = [
  ['链路自检', 'ok'], ['图形上下文 WebGL', 'ok'], ['加载 NASA 地表 4096×2048', 'wait'],
  ['加载云图 2048×1024', 'wait'], ['生成夜面灯光', 'ok'], ['装配天宫三舱', 'ok'], ['轨道注入 400 KM', 'ok'],
];
function runBoot() {
  const box = $('bootLines'), bar = $('bootBar');
  let i = 0;
  const step = () => {
    if (i < bootLines.length) {
      const [t, s] = bootLines[i];
      const d = document.createElement('div');
      d.innerHTML = `&gt; ${t} … <span class="${s}">${s === 'ok' ? 'OK' : '…'}</span>`;
      box.appendChild(d);
      bar.style.width = `${(i + 1) / bootLines.length * 100}%`;
      i++;
      setTimeout(step, reduced ? 40 : 150);
    } else {
      setTimeout(() => {
        $('boot').classList.add('gone');
        setTimeout(() => $('boot').remove(), 700);
        hud.say('<b>轨道终端</b> 就绪 · 拖动环视，滚轮变焦', false, 5000);
      }, reduced ? 60 : 320);
    }
  };
  step();
}

function fail(msg) {
  $('fbMsg').textContent = msg;
  $('fallback').hidden = false;
  $('boot')?.remove();
  audio.error();
}
$('fbRetry').addEventListener('click', () => location.reload());

const loadTimeout = setTimeout(() => fail('15 秒内未完成贴图加载。'), 15000);
const checkReady = setInterval(() => {
  const ok = earth.textures.day.image && earth.textures.clouds.image;
  if (ok) {
    clearInterval(checkReady); clearTimeout(loadTimeout);
    invalidate();
  }
}, 200);
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail('图形上下文丢失。'); });

document.addEventListener('visibilitychange', () => { last = performance.now(); invalidate(); });

/* 面板开合时重绘引线 */
hud.onPanelChange = () => { invalidate(); setTimeout(() => hud.drawLeader(), 60); };

/* 初始化 */
for (const k in R) R[k].set(DEFAULTS[k]);
resize();
schedulePass(demoPass ? 2 : 18);
runBoot();
loop();