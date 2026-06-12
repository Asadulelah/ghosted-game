/* GHOSTED - night-office audio. Synthesized, zero assets.
   Warm room tone (the 2 AM hum), soft pings, a win chime,
   a loss thunk, and the voice's low dissonant swell. */

const AudioFX = (() => {
  let ctx = null, master = null, enabled = false, humOn = false;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }
  function hum() {
    if (humOn || !ctx) return; humOn = true;
    const g = ctx.createGain(); g.gain.value = 0.035; g.connect(master);
    [55, 55.6, 110.3].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = i === 2 ? 0.25 : 1;
      o.connect(og); og.connect(g); o.start();
    });
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.12;
    const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
    n.connect(lp); lp.connect(g); n.start();
  }
  function env(g, t, a, p, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(p, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(freq, type, peak, dur, delay = 0) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain(); o.connect(g); g.connect(master);
    env(g, t, 0.01, peak, dur);
    o.start(t); o.stop(t + dur + 0.1);
  }
  return {
    init() { if (ensure()) { enabled = true; ctx.resume(); hum(); master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.6); document.getElementById('sndTgl').textContent = 'SOUND ON'; document.getElementById('sndTgl').classList.add('on'); } },
    toggle() { if (!ensure()) return false; enabled = !enabled; if (enabled) { ctx.resume(); hum(); master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.3); } else master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2); return enabled; },
    ping() { tone(740, 'sine', 0.07, 0.4); tone(988, 'sine', 0.05, 0.5, 0.09); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.08, 0.5, i * 0.1)); },
    bad() { tone(180, 'sawtooth', 0.05, 0.5); tone(124, 'sine', 0.08, 0.6, 0.05); },
    voice() { if (!enabled || !ctx) return; [196, 207.6].forEach(f => { const t = ctx.currentTime; const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = ctx.createGain(); o.connect(g); g.connect(master); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 1.4); g.gain.linearRampToValueAtTime(0.0001, t + 3); o.start(t); o.stop(t + 3.1); }); },
  };
})();
