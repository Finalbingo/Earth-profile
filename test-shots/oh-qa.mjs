import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const CHROME = '/Users/Admin/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const PORT = 9333;
const OUT = '/Users/Admin/Documents/Qoder/2026-11-10/7416ea54/test-shots/';
const URL_PAGE = 'http://localhost:8731/orbit-home/index.html';
mkdirSync('/tmp/oh-dl', { recursive: true });

const chrome = spawn(CHROME, [
  '--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/oh-cdp-${Date.now()}`, '--window-size=1600,1000', 'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });
let stderr = '';
chrome.stderr.on('data', d => { stderr += d; });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getWS() {
  for (let i = 0; i < 60; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = l.find(t => t.type === 'page');
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error('devtools not reachable');
}

const ws = new WebSocket(await getWS());
await new Promise(r => { ws.onopen = r; });
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') consoleErrors.push('EXC ' + JSON.stringify(m.params.exceptionDetails?.exception?.description || m.params));
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push('ERR ' + m.params.args.map(a => a.value || a.description).join(' '));
};
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expression => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error('EVAL ' + JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails));
  return r.result?.result?.value;
};
const shot = async name => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(OUT + name, Buffer.from(r.result.data, 'base64'));
  console.log('SHOT', name);
};
const check = (name, ok, extra = '') => console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' · ' + extra : ''}`);

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: URL_PAGE });
for (let i = 0; i < 100; i++) { if (!(await ev(`!!document.getElementById("boot")`))) break; await sleep(1000); }
await sleep(1500);

/* 1 默认视图 */
await shot('oh-10-default.png');
const s1 = await ev(`({
  clock: document.getElementById('clock').textContent,
  boot: !!document.getElementById('boot'),
  rails: [...document.querySelectorAll('.rail-item')].map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right)]; }),
  overflow: document.documentElement.scrollWidth > innerWidth,
  fps: document.getElementById('fps').textContent,
})`);
check('boot removed', !s1.boot);
check('clock ticking', /\d\d:\d\d:\d\d UTC/.test(s1.clock), s1.clock);
check('no h-overflow', !s1.overflow);
const rights = s1.rails.slice(4);
check('right rail on screen', rights.every(([l, , r]) => l > 1000 && r <= 1600), JSON.stringify(rights));
check('fps meter live', s1.fps !== '—', s1.fps);

/* 2 过境 */
await ev(`document.getElementById('bPass').click()`);
await sleep(7000);
const s2 = await ev(`({
  state: document.getElementById('passState').textContent,
  reticle: !document.getElementById('reticle').hidden,
  rt: document.getElementById('rtDist').textContent,
  el: document.getElementById('tEl').textContent,
  dist: document.getElementById('tDist').textContent,
  hot: document.getElementById('warnSq').classList.contains('hot'),
})`);
check('pass running', s2.state === '过境中', s2.state);
check('reticle visible', s2.reticle, s2.rt);
check('telemetry elev/dist', s2.el !== '—' && s2.dist !== '—', `${s2.el}° / ${s2.dist}m`);
check('warn square hot', s2.hot);
await shot('oh-11-pass.png');
await ev(`(() => { const el = document.getElementById('cTime'); el.value = 6; el.dispatchEvent(new Event('input')); })()`);
let ended = false;
for (let i = 0; i < 60; i++) {
  await sleep(1000);
  if (await ev(`document.getElementById('passState').textContent`) === '下次过境') { ended = true; break; }
}
await ev(`(() => { const el = document.getElementById('cTime'); el.value = 1; el.dispatchEvent(new Event('input')); })()`);
await sleep(1500);
const s3 = await ev(`({ state: document.getElementById('passState').textContent, reticle: !document.getElementById('reticle').hidden })`);
check('pass ends & hides', ended && s3.state === '下次过境' && !s3.reticle, s3.state);

/* 3 面板 + 抽屉 */
await ev(`document.querySelector('[data-panel="works"]').click()`);
await sleep(700);
const s4 = await ev(`({ open: !document.getElementById('panel').hidden, lead: !!document.querySelector('#arcs .lead'), items: document.querySelectorAll('.work').length })`);
check('works panel open', s4.open && s4.items === 4, `${s4.items} works`);
check('leader line drawn', s4.lead);
await shot('oh-12-works.png');
await ev(`document.querySelector('.work').click()`);
await sleep(700);
check('drawer open', await ev(`!document.getElementById('drawer').hidden`));
await shot('oh-13-drawer.png');
await ev(`dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
await sleep(300);
check('esc closes drawer', await ev(`document.getElementById('drawer').hidden`));
await ev(`dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
await sleep(300);
check('esc closes panel', await ev(`document.getElementById('panel').hidden`));

/* 4 首页编辑 */
await ev(`document.querySelector('[data-panel="home"]').click()`);
await sleep(500);
await ev(`document.querySelector('[data-edit="callsign"]').click()`);
await sleep(200);
await ev(`(() => { const i = document.querySelector('.edit-input'); i.value = 'QA-TEST'; i.dispatchEvent(new Event('blur')); })()`);
await sleep(400);
const s5 = await ev(`({ txt: document.querySelector('[data-edit="callsign"]')?.textContent, ls: localStorage.getItem('orbit-home.profile.v1') })`);
check('inline edit persists', s5.txt === 'QA-TEST' && /QA-TEST/.test(s5.ls || ''), s5.txt);
await shot('oh-14-home.png');
await ev(`document.getElementById('pClose').click()`);
await sleep(300);

/* 5 滑杆 / 复位 */
await ev(`(() => { const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input')); }; set('cSun', -100); set('cAlt', 900); })()`);
await sleep(1200);
await shot('oh-15-night-alt.png');
const s6 = await ev(`({ sun: document.getElementById('vSun').textContent, alt: document.getElementById('vAlt').textContent, tAlt: document.getElementById('tAlt').textContent })`);
check('sliders live', s6.sun === '-100°' && s6.alt === '900 km' && s6.tAlt === '900', JSON.stringify(s6));
await ev(`(() => { const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input')); }; set('cRelief', 1.6); set('cMilky', 0.4); set('cStorm', 0.3); })()`);
await sleep(600);
const s6b = await ev(`({
  relief: document.getElementById('vRelief').textContent,
  milky: document.getElementById('vMilky').textContent,
  storm: document.getElementById('vStorm').textContent,
  fit: (() => { const c = document.getElementById('console'); return c.scrollHeight <= c.clientHeight + 2; })(),
})`);
check('render sliders live', s6b.relief === '1.60' && s6b.milky === '0.40' && s6b.storm === '30%', JSON.stringify(s6b));
check('console rows fit', s6b.fit);
await ev(`document.getElementById('bReset').click()`);
await sleep(800);
const s7 = await ev(`({ sun: document.getElementById('cSun').value, alt: document.getElementById('cAlt').value, fov: document.getElementById('cFov').value, relief: document.getElementById('cRelief').value, milky: document.getElementById('cMilky').value, storm: document.getElementById('cStorm').value })`);
check('reset restores', s7.sun === '-30' && s7.alt === '400' && s7.fov === '68' && s7.relief === '1' && s7.milky === '1' && s7.storm === '0.8', JSON.stringify(s7));

/* 6 拖拽 / 滚轮 / 键盘 */
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 800, y: 400, button: 'left', clickCount: 1 });
for (let i = 1; i <= 10; i++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 800 + i * 30, y: 400 + i * 6, button: 'left', buttons: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1100, y: 460, button: 'left' });
await sleep(900);
await shot('oh-16-drag.png');
await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 800, y: 400, deltaX: 0, deltaY: -240 });
await sleep(500);
const fovAfter = await ev(`document.getElementById('cFov').value`);
check('wheel zooms', +fovAfter < 68, fovAfter);
await ev(`document.getElementById('gl').focus()`);
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
await sleep(400);

/* 7 HUD / 声音 / 导出 */
await ev(`document.getElementById('hudToggle').click()`);
await sleep(600);
check('hud off', await ev(`document.body.classList.contains('hud-off')`));
await shot('oh-17-hudoff.png');
await ev(`document.getElementById('hudToggle').click()`);
await sleep(400);
await ev(`document.getElementById('soundBtn').click()`);
const snd1 = await ev(`document.getElementById('soundBtn').getAttribute('aria-pressed')`);
await ev(`document.getElementById('soundBtn').click()`);
const snd2 = await ev(`document.getElementById('soundBtn').getAttribute('aria-pressed')`);
check('sound toggle', snd1 === 'false' && snd2 === 'true', `${snd1}->${snd2}`);
await ev(`document.getElementById('bExport').click()`);
await sleep(600);
const s8 = await ev(`({ toast: document.getElementById('toast').textContent, png: document.getElementById('gl').toDataURL('image/png').length })`);
check('export png', s8.toast === '已导出 PNG' && s8.png > 200000, `${(s8.png / 1024) | 0}KB`);

/* 8 窄窗直轨 fallback */
await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false });
await sleep(1200);
const s9 = await ev(`[...document.querySelectorAll('.rail-item')].map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; })`);
const lt = s9.slice(0, 4).map(([, t]) => t), rt = s9.slice(4).map(([, t]) => t);
check('narrow rails stacked', new Set(lt).size === 4 && new Set(rt).size === 4 && s9.every(([l]) => l >= 0 && l < 1000), JSON.stringify(s9));
await shot('oh-18-narrow.png');
await send('Emulation.clearDeviceMetricsOverride');
await sleep(800);

console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors.join('\n') : 'none');
ws.close();
chrome.kill('SIGKILL');
process.exit(0);
