/* WebAudio 合成：无外部音频资产。所有声音都绑定可见事件。 */

export function createAudio() {
  let ctx = null, master = null, hum = null, humGain = null;
  let enabled = true, ready = false;

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? .5 : 0;
    master.connect(ctx.destination);
    return true;
  }

  function startHum() {
    if (!ctx || hum) return;
    humGain = ctx.createGain();
    humGain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 220; lp.Q.value = .7;
    hum = [];
    for (const f of [55, 58.3, 110.7]) {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = f > 100 ? .12 : .3;
      o.connect(g); g.connect(lp); o.start();
      hum.push(o);
    }
    const lfo = ctx.createOscillator(); lfo.frequency.value = .13;
    const lfoG = ctx.createGain(); lfoG.gain.value = .035;
    lfo.connect(lfoG); lfoG.connect(humGain.gain); lfo.start();
    hum.push(lfo);
    lp.connect(humGain); humGain.connect(master);
    humGain.gain.setTargetAtTime(.16, ctx.currentTime, 1.4);
  }

  function resume() {
    if (!ensure()) return false;
    if (ctx.state === 'suspended') ctx.resume();
    ready = ctx.state === 'running';
    if (ready && enabled) startHum();
    return ready;
  }

  function blip(freq = 880, dur = .05, type = 'square', vol = .12) {
    if (!ready || !enabled || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .006);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + .02);
  }

  function sweep(dur = .22, vol = .07) {
    if (!ready || !enabled || !ctx) return;
    const t = ctx.currentTime, n = ctx.sampleRate * dur | 0;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + dur);
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t);
  }

  return {
    get enabled() { return enabled; },
    get ready() { return ready; },
    resume,
    toggle() {
      enabled = !enabled;
      if (master) master.gain.setTargetAtTime(enabled ? .5 : 0, ctx.currentTime, .08);
      if (enabled) { resume(); startHum(); }
      return enabled;
    },
    click() { blip(880, .045, 'square', .09); },
    hover() { blip(1320, .025, 'sine', .035); },
    open() { sweep(.24, .06); blip(660, .07, 'sine', .07); },
    close() { sweep(.16, .04); blip(440, .06, 'sine', .06); },
    alert() { blip(660, .1, 'square', .1); setTimeout(() => blip(880, .14, 'square', .1), 130); },
    pass() { blip(523, .09, 'sine', .08); setTimeout(() => blip(784, .12, 'sine', .08), 110); setTimeout(() => blip(1046, .16, 'sine', .07), 240); },
    error() { blip(180, .18, 'sawtooth', .09); },
  };
}