import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const CHROME = '/Users/Admin/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const chrome = spawn(CHROME, ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars', '--remote-debugging-port=9335', `--user-data-dir=/tmp/oh-sun-${Date.now()}`, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try {
    const l = await (await fetch('http://127.0.0.1:9335/json/list')).json();
    const p = l.find(t => t.type === 'page');
    if (p?.webSocketDebuggerUrl) { ws = new WebSocket(p.webSocketDebuggerUrl); break; }
  } catch {}
  await sleep(300);
}
await new Promise(r => { ws.onopen = r; });
let id = 0; const pending = new Map(); const errs = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(m.params.args.map(a => a.value || a.description).join(' ').slice(0, 600));
  else if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + JSON.stringify(m.params.exceptionDetails?.exception?.description || m.params).slice(0, 600));
};
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: 'http://localhost:8731/orbit-home/index.html' });
for (let i = 0; i < 100; i++) { if (!(await ev(`!!document.getElementById("boot")`))) break; await sleep(1000); } await sleep(1500);
for (const v of [-30]) {
  await ev(`(() => { const el = document.getElementById('cSun'); el.value = ${v}; el.dispatchEvent(new Event('input')); })()`);
  await sleep(1500);
  const s = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`/Users/Admin/Documents/Qoder/2026-11-10/7416ea54/test-shots/oh-sun-default.png`, Buffer.from(s.result.data, 'base64'));
  console.log('SHOT', v);
}
console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
ws.close(); chrome.kill('SIGKILL'); process.exit(0);
