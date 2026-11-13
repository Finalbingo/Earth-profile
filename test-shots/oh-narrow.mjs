import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const CHROME = '/Users/Admin/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const chrome = spawn(CHROME, ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars', '--remote-debugging-port=9334', `--user-data-dir=/tmp/oh-nar-${Date.now()}`, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try {
    const l = await (await fetch('http://127.0.0.1:9334/json/list')).json();
    const p = l.find(t => t.type === 'page');
    if (p?.webSocketDebuggerUrl) { ws = new WebSocket(p.webSocketDebuggerUrl); break; }
  } catch {}
  await sleep(300);
}
await new Promise(r => { ws.onopen = r; });
let id = 0; const pending = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: 'http://localhost:8731/orbit-home/index.html' });
await sleep(5000);
await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false });
await sleep(1200);
console.log(JSON.stringify(await ev(`(() => {
  const r = s => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); const c = getComputedStyle(el); return [s, Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height), c.display, c.visibility, c.opacity]; };
  return ['#console', '.cs-status', '.cs-sliders', '.sg', '.sg-h', '.sg-row', '.ctl', '#cAlt', '.cs-actions'].map(r);
})()`), null, 1));
const s = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('/Users/Admin/Documents/Qoder/2026-11-10/7416ea54/test-shots/oh-19-narrow-debug.png', Buffer.from(s.result.data, 'base64'));
ws.close(); chrome.kill('SIGKILL'); process.exit(0);
