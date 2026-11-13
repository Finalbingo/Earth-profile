import { DEFAULT_PROFILE, loadProfile, saveProfile, WORKS, LOGS, SKILLS, TIMELINE, CONTACTS, STATION_INFO } from './profile.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function createHUD(audio) {
  const svg = $('arcs');
  const panel = $('panel'), pBody = $('pBody'), pTitle = $('pTitle'), pSub = $('pSub'), pCode = $('pCode');
  const drawer = $('drawer'), dBody = $('dBody'), dTitle = $('dTitle'), dCode = $('dCode');
  const comms = $('comms'), toastEl = $('toast');
  const reticle = $('reticle');
  let profile = loadProfile();
  let current = null, toastTimer = 0, commsTimer = 0;
  let onPanelChange = () => {};

  const PANEL_META = {
    home: ['首页', 'HOME', 'SEC-00'],
    works: ['作品', 'WORK', 'SEC-01'],
    logs: ['日志', 'LOG', 'SEC-02'],
    about: ['关于', 'ABOUT', 'SEC-03'],
    contact: ['联系', 'CONTACT', 'SEC-04'],
    cv: ['简历', 'CV', 'SEC-05'],
    station: ['天宫', 'CSS', 'SEC-06'],
  };

  /* ---------- 弧形导航 ---------- */
  function layoutRails() {
    const W = innerWidth, H = innerHeight;
    const consoleH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--console-h')) || 132;
    const straight = W < 1100;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    const y0 = 118, y1 = H - consoleH - 64;
    const bow = straight ? 0 : Math.min(30, (y1 - y0) * .07);
    const xL = straight ? 26 : 46, xR = W - xL;

    const mk = (d, cls) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d); if (cls) p.setAttribute('class', cls);
      svg.appendChild(p); return p;
    };
    const pathL = mk(`M ${xL} ${y0} Q ${xL - bow} ${(y0 + y1) / 2} ${xL} ${y1}`);
    const pathR = mk(`M ${xR} ${y0} Q ${xR + bow} ${(y0 + y1) / 2} ${xR} ${y1}`);

    /* 四角注册标记 */
    const m = 18, L = 16;
    for (const [cx, cy, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - consoleH - m, 1, -1], [W - m, H - consoleH - m, -1, -1]]) {
      mk(`M ${cx + sx * L} ${cy} L ${cx} ${cy} L ${cx} ${cy + sy * L}`, 'reg');
    }

    const place = (nav, path, side) => {
      const items = [...nav.querySelectorAll('.rail-item')];
      const ox = nav.getBoundingClientRect().left;
      const len = path.getTotalLength();
      items.forEach((el, i) => {
        const t = (i + .5) / items.length;
        const p = path.getPointAtLength(len * t);
        const a = path.getPointAtLength(Math.max(0, len * t - 2));
        const b = path.getPointAtLength(Math.min(len, len * t + 2));
        let ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI - 90;
        ang = Math.max(-12, Math.min(12, ang)) * (side === 'r' ? -1 : 1);
        if (straight) ang = 0;
        const w = el.offsetWidth, h = el.offsetHeight;
        const xv = side === 'l' ? p.x + 12 : p.x - 12 - w;
        el.style.transform = `translate(${xv - ox}px, ${p.y - h / 2}px) rotate(${ang}deg)`;
      });
    };
    place($('navL'), pathL, 'l');
    place($('navR'), pathR, 'r');
    drawLeader();
  }

  function drawLeader() {
    svg.querySelectorAll('.lead').forEach(n => n.remove());
    if (!current || panel.hidden) return;
    const el = document.querySelector(`.rail-item[data-panel="${current}"]`);
    if (!el) return;
    const r = panel.querySelector('.p-frame').getBoundingClientRect();
    const r0 = el.getBoundingClientRect();
    const side = el.closest('#navR') ? 'r' : 'l';
    const x0 = side === 'l' ? r0.right : r0.left;
    const y0 = r0.top + r0.height / 2;
    const x1 = side === 'l' ? r.left : r.right;
    const y1 = r.top + 28;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('class', 'lead');
    p.setAttribute('d', `M ${x0} ${y0} L ${(x0 + x1) / 2} ${y0} L ${(x0 + x1) / 2} ${y1} L ${x1} ${y1}`);
    svg.appendChild(p);
  }

  /* ---------- 面板内容 ---------- */
  function editable(field, value, cls) {
    return `<span class="${cls}" data-edit="${field}" tabindex="0" role="button" title="点击编辑">${esc(value)}</span>`;
  }

  function renderHome() {
    return `
      <div class="id-block">
        <div class="id-sig"><b>01</b></div>
        <div class="id-main">
          ${editable('callsign', profile.callsign, 'id-call')}
          ${editable('name', profile.name, 'id-name')}
          <div class="id-role">${esc(profile.role)} · ${esc(profile.base)}</div>
          <div class="status-row"><span class="dot"></span>${esc(profile.status)}</div>
        </div>
      </div>
      <div class="sec-h">简介 <i>BIO</i></div>
      <p class="lede">${esc(profile.bio)}</p>
      <div class="sec-h">当前在轨 <i>ACTIVE</i></div>
      <div class="kv">
        <i>最近作品</i><b>${esc(WORKS[WORKS.length - 1].title)}</b>
        <i>最新日志</i><b>${esc(LOGS[0].date)} · ${esc(LOGS[0].title)}</b>
        <i>渲染链路</i><b>WebGL · 双相机分层</b>
      </div>
      <p class="note">呼号与姓名可直接点击编辑，保存在本机。地球贴图为 NASA Blue Marble 历史合成影像，非实时观测。</p>`;
  }

  function renderWorks() {
    return `<div class="work-list">${WORKS.map((w, i) => `
      <button class="work" data-work="${w.id}">
        <span class="idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="wt"><b>${esc(w.title)}</b><span>${esc(w.summary)}</span></span>
        <span class="wm"><i>${esc(w.tag)}</i><u>${esc(w.metric)}</u></span>
      </button>`).join('')}</div>
      <p class="note">点击任一条目展开详情。所有条目均为实际工作，不含占位内容。</p>`;
  }

  function renderLogs() {
    return LOGS.map(l => `
      <div class="log-item"><time>${esc(l.date)}</time><div><b>${esc(l.title)}</b><p>${esc(l.body)}</p></div></div>`).join('');
  }

  function renderAbout() {
    return `
      <p class="lede">${esc(profile.bio)}</p>
      <div class="sec-h">能力矩阵 <i>CAPABILITY</i></div>
      ${SKILLS.map(s => `
        <div class="skill"><div class="sk-h"><span>${esc(s.name)}</span><u>${Math.round(s.level * 100)}</u></div>
        <div class="bar"><i style="width:${s.level * 100}%"></i></div></div>`).join('')}
      <div class="sec-h">尺度说明 <i>SCALE</i></div>
      <p class="note">${esc(STATION_INFO.note)}</p>`;
  }

  function renderContact() {
    return `<div class="ct-list">${CONTACTS.map(c => c.href
      ? `<a class="ct" href="${esc(c.href)}" target="_blank" rel="noopener"><i>${esc(c.label)}</i><b>${esc(c.value)}</b><span class="go">↗</span></a>`
      : `<div class="ct"><i>${esc(c.label)}</i><b>${esc(c.value)}</b></div>`).join('')}</div>
      <p class="note">邮件与站点链接为示例地址，可在 profile.js 中替换为真实联系方式。</p>`;
  }

  function renderCV() {
    return TIMELINE.map(t => `
      <div class="tl-item"><time>${esc(t.period)}</time><div><b>${esc(t.org)}</b><span>${esc(t.role)}</span><p>${esc(t.note)}</p></div></div>`).join('') +
      `<div class="sec-h">教育 / 其它 <i>MISC</i></div>
       <p class="lede">长期关注商用车智能化与车路协同的数据链路；业余从事三维可视化与文创生产。</p>`;
  }

  function renderStation() {
    return `<div class="kv">${STATION_INFO.rows.map(([k, v]) => `<i>${esc(k)}</i><b>${esc(v)}</b>`).join('')}</div>
      <p class="note">${esc(STATION_INFO.note)}</p>`;
  }

  const RENDER = { home: renderHome, works: renderWorks, logs: renderLogs, about: renderAbout, contact: renderContact, cv: renderCV, station: renderStation };

  function bindPanelBody() {
    pBody.querySelectorAll('[data-work]').forEach(b => b.addEventListener('click', () => {
      audio.click(); openDrawer(b.dataset.work);
    }));
    pBody.querySelectorAll('[data-edit]').forEach(el => {
      const start = () => {
        const field = el.dataset.edit;
        const input = document.createElement('input');
        input.className = 'edit-input';
        input.value = profile[field];
        el.replaceWith(input);
        input.focus(); input.select();
        const commit = () => {
          const v = input.value.trim();
          if (v) { profile[field] = v; saveProfile(profile); }
          audio.click();
          openPanel(current, true);
        };
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') input.blur();
          if (e.key === 'Escape') { input.value = profile[field]; input.blur(); }
        });
      };
      el.addEventListener('click', start);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } });
    });
  }

  function openPanel(name, silent) {
    if (!RENDER[name]) return;
    current = name;
    const [t, s, c] = PANEL_META[name];
    pTitle.textContent = t; pSub.textContent = s; pCode.textContent = c;
    pBody.innerHTML = RENDER[name]();
    pBody.scrollTop = 0;
    panel.hidden = false;
    document.querySelectorAll('.rail-item[data-panel]').forEach(b => {
      if (b.dataset.panel === name) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    bindPanelBody();
    if (!silent) audio.open();
    requestAnimationFrame(drawLeader);
    onPanelChange(name);
  }

  function closePanel() {
    if (panel.hidden) return;
    panel.hidden = true; current = null;
    document.querySelectorAll('.rail-item[data-panel]').forEach(b => b.removeAttribute('aria-current'));
    audio.close();
    drawLeader();
    onPanelChange(null);
  }

  function openDrawer(id) {
    const w = WORKS.find(x => x.id === id);
    if (!w) return;
    dTitle.textContent = w.title; dCode.textContent = w.code;
    dBody.innerHTML = `
      <div class="d-meta"><i>${esc(w.tag)}</i><i>${esc(w.year)}</i>${w.stack.map(s => `<i>${esc(s)}</i>`).join('')}</div>
      <div class="d-metric">${esc(w.metric)}</div>
      <p class="lede">${esc(w.detail)}</p>
      <div class="sec-h">摘要 <i>SUMMARY</i></div>
      <p class="lede">${esc(w.summary)}</p>`;
    dBody.scrollTop = 0;
    drawer.hidden = false;
  }

  function closeDrawer() { drawer.hidden = true; }

  /* ---------- 通讯 / 提示 ---------- */
  function say(html, alert, ms = 4200) {
    comms.innerHTML = `<span class="line${alert ? ' alert' : ''}">${html}</span>`;
    clearTimeout(commsTimer);
    commsTimer = setTimeout(() => { comms.innerHTML = ''; }, ms);
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 1800);
  }

  /* ---------- 遥测 / 追踪框 ---------- */
  function telemetry({ alt, vel, el, dist }) {
    $('tAlt').textContent = alt;
    $('tVel').textContent = vel;
    $('tEl').textContent = el;
    $('tDist').textContent = dist;
  }

  function placeReticle(x, y, w, h, dist, lock) {
    if (x == null) { reticle.hidden = true; return; }
    reticle.hidden = false;
    reticle.style.left = `${x - w / 2}px`;
    reticle.style.top = `${y - h / 2}px`;
    reticle.style.width = `${w}px`;
    reticle.style.height = `${h}px`;
    $('rtDist').textContent = dist;
    reticle.classList.toggle('lock', !!lock);
  }

  /* ---------- 事件绑定 ---------- */
  document.querySelectorAll('.rail-item[data-panel]').forEach(b => {
    b.addEventListener('click', () => {
      audio.click();
      if (current === b.dataset.panel && !panel.hidden) closePanel();
      else openPanel(b.dataset.panel);
    });
    b.addEventListener('pointerenter', () => audio.hover());
  });
  $('pClose').addEventListener('click', () => { audio.click(); closePanel(); });
  $('dClose').addEventListener('click', () => { audio.click(); closeDrawer(); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (!drawer.hidden) closeDrawer(); else closePanel(); }
  });
  addEventListener('resize', layoutRails);

  /* 顶栏刻度 */
  const ticks = $('ticks');
  for (let i = 0; i < 40; i++) { const t = document.createElement('i'); if (i % 5 === 0) t.className = 'on'; ticks.appendChild(t); }

  const clockEl = $('clock');
  const tickClock = () => { clockEl.textContent = `${new Date().toISOString().slice(11, 19)} UTC`; };
  tickClock();
  setInterval(tickClock, 1000);

  layoutRails();

  return {
    layoutRails, openPanel, closePanel, closeDrawer, say, toast, telemetry, placeReticle, drawLeader,
    get current() { return current; },
    get profile() { return profile; },
    set onPanelChange(fn) { onPanelChange = fn; },
  };
}