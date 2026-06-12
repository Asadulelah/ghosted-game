/* GHOSTED - the engine. A day-loop management sim where deals die
   the way they really die. Seedable RNG for deterministic tests. */

const $ = id => document.getElementById(id);

/* ---------- seedable rng ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const seedParam = new URLSearchParams(location.search).get('seed');
const rng = seedParam ? mulberry32(+seedParam) : Math.random;
const R = (a, b) => a + rng() * (b - a);
const RI = (a, b) => Math.floor(R(a, b + 1));
const pick = arr => arr[Math.floor(rng() * arr.length)];

/* ---------- state ---------- */
const G = {
  day: 1, cash: 0, goal: 10000, energy: 3, energyMax: 3,
  rep: 10, burnout: 20, steel: 0, streak: 0,
  prospects: [], ghosted: 0, won: 0, over: false,
  voiceUsed: false, pid: 0,
};

/* ---------- log ---------- */
function log(txt, cls) {
  const d = document.createElement('div');
  d.className = 'line ' + (cls || '');
  d.innerHTML = `<span>D${G.day}</span><p>${txt}</p>`;
  $('log').prepend(d);
  while ($('log').children.length > 60) $('log').lastChild.remove();
}

/* ---------- prospects ---------- */
function spawnProspect(forcedType) {
  const types = Object.entries(ARCHETYPES);
  let type = forcedType;
  if (!type) {
    const total = types.reduce((a, [, v]) => a + v.weight, 0);
    let roll = rng() * total;
    for (const [k, v] of types) { roll -= v.weight; if (roll <= 0) { type = k; break; } }
  }
  const A = ARCHETYPES[type];
  const p = {
    id: ++G.pid, type, name: pick(FIRST), biz: pick(BIZ),
    ticket: RI(A.ticket[0], A.ticket[1]),
    stage: 'lead', artifacts: 0, stageAge: 0, decisionCall: false, haggled: false,
  };
  G.prospects.push(p);
  log(`<b>${A.label}</b> - ${A.intro(p)}`, 'good');
  AudioFX.ping();
  return p;
}

/* ---------- actions ---------- */
function spend(n) { if (G.energy < n) return false; G.energy -= n; return true; }

const ACTIONS = {
  outreach() {
    if (!spend(1)) return;
    const chance = 0.42 + G.rep / 220;
    if (rng() < chance) spawnProspect();
    else log(pick(LOG.outreachMiss));
    render();
  },
  content() {
    if (!spend(1)) return;
    G.rep = Math.min(100, G.rep + RI(2, 4)); G.streak++;
    log(pick(LOG.content));
    if (G.streak >= 3) { G.streak = 0; log('Your content streak paid off - an INBOUND lead just appeared. This is the compounding they talk about.', 'gold'); spawnProspect(); }
    render();
  },
  polish() {
    if (!spend(1)) return;
    G.burnout = Math.max(0, G.burnout - 8);
    log(pick(LOG.polish), 'dim');
    render();
  },
  rest() {
    if (G.energy < 1) return;
    showVoice();
  },
};

function buildFor(p) {
  if (!spend(1)) return;
  p.artifacts++;
  if (p.artifacts >= 3) log(`That's artifact #${p.artifacts} for ${p.name}. He has engaged with: zero. You're hiding in the workshop.`, 'bad');
  else log(pick(LOG.build));
  render();
}

function takeCall(p) {
  if (!spend(1)) return;
  if (p.type === 'skeptic' && p.artifacts < 1) {
    p.stage = 'soured'; p.stageAge = 0;
    log(`${p.name} (THE SKEPTIC) sat through your pitch with a flat face: <b>"this looks like AI slop. do you even have a demo?"</b> Build him something REAL and you might recover this.`, 'bad');
    G.rep = Math.max(0, G.rep - 2);
    AudioFX.bad(); render(); return;
  }
  p.stage = 'proposal'; p.stageAge = 0;
  log(pick(LOG.call));
  openDecision(p);
  render();
}

function recoverSkeptic(p) {
  if (!spend(1)) return;
  p.artifacts++; p.stage = 'proposal'; p.stageAge = 0;
  log(`You sent ${p.name} a working demo, no commentary. Two hours later: "ok. this is actually good. talk numbers?"`, 'gold');
  openDecision(p); render();
}

function openDecision(p) {
  $('dcName').textContent = p.name + ' · $' + p.ticket.toLocaleString();
  $('dcModal').classList.add('on');
  $('dcYes').onclick = () => { p.decisionCall = true; $('dcModal').classList.remove('on'); log(`Decision call locked with ${p.name} for the proposal walk-through. The thread cannot drift now.`, 'good'); render(); };
  $('dcNo').onclick = () => { $('dcModal').classList.remove('on'); log(`Proposal sent to ${p.name}. No call scheduled. It's "in their inbox." So are 4,000 other things.`, 'dim'); render(); };
}

function closeDeal(p) {
  if (!spend(1)) return;
  let chance = (p.decisionCall ? 0.78 : 0.30) + G.steel * 0.02;
  if (p.type === 'whale' && p.artifacts < 2) chance = 0.15;
  if (p.type === 'oldfriend') chance = 0;
  if (p.type === 'barter') {
    p.stage = 'dead';
    log(`${p.name}'s "payment": a story mention to his 412 followers. You politely declined. Rep intact, dignity intact, wallet unchanged.`, 'dim');
    render(); return;
  }
  if (p.type === 'negotiator' && !p.haggled) {
    p.haggled = true; p.ticket = Math.round(p.ticket * 0.9);
    log(`${p.name} counters: "your competitor quoted 10% less." This is the MATCH-POINT. Close it NOW or watch it evaporate.`, 'bad');
    p.matchpoint = 2; render(); return;
  }
  if (rng() < chance) {
    p.stage = 'won'; G.won++; G.cash += p.ticket;
    log(`✦ <b>CLOSED. ${p.name} paid $${p.ticket.toLocaleString()}.</b> ${p.decisionCall ? 'The decision call did the work.' : 'Closed WITHOUT a decision call. Lottery ticket. Do not learn from this.'}`, 'gold');
    AudioFX.win();
  } else {
    p.stage = 'dead'; G.ghosted++;
    log(`${p.name} "needs to think about it." ${p.decisionCall ? 'Even good process loses some. Log it, move on.' : 'No decision call, no decision. The silence begins.'}`, 'bad');
    AudioFX.bad();
  }
  render();
}

/* ---------- the voice ---------- */
function showVoice() {
  $('voiceLine').textContent = '"' + pick(VOICE_LINES) + '"';
  document.body.classList.add('voiced');
  $('voiceModal').classList.add('on');
  AudioFX.voice();
  $('vRest').onclick = () => {
    G.energy -= 1;
    G.burnout = Math.max(0, G.burnout - 32);
    G.steel++;
    closeVoice();
    log(`You rested ANYWAY. The voice hated it. <b>+1 STEEL</b> - you close ${2}% better now, permanently. Funny how that works.`, 'gold');
    render();
  };
  $('vWork').onclick = () => {
    G.pendingBurnout = (G.pendingBurnout || 0) + 14;
    G.energy = Math.min(G.energyMax, G.energy + 1);
    closeVoice();
    log('You gave in. +1 energy now. The bill arrives tomorrow, with interest. It always does.', 'bad');
    render();
  };
}
function closeVoice() { $('voiceModal').classList.remove('on'); document.body.classList.remove('voiced'); }

/* ---------- day tick ---------- */
function endDay() {
  if (G.over) return;
  G.day++;
  G.energy = G.energyMax;
  G.burnout = Math.min(100, G.burnout + 7 + (G.pendingBurnout || 0));
  G.pendingBurnout = 0;
  G.rep = Math.max(0, G.rep - 1);

  for (const p of G.prospects) {
    if (['won', 'dead'].includes(p.stage)) continue;
    p.stageAge++;
    if (p.matchpoint != null) {
      p.matchpoint--;
      if (p.matchpoint <= 0 && p.stage === 'proposal') {
        p.stage = 'dead'; G.ghosted++;
        log(`${p.name} went silent at the match-point. The price was agreed. The call never happened. <b>$${p.ticket.toLocaleString()} evaporated.</b>`, 'bad');
        continue;
      }
    }
    const slow = p.type === 'whale' ? 2 : 1;
    if (p.stage === 'lead' && p.stageAge > 4 * slow) {
      p.stage = 'dead'; G.ghosted++;
      log(`${p.name} cooled off before you ever took the call. Leads are milk, not wine.`, 'bad');
    } else if (p.stage === 'proposal' && !p.decisionCall && p.stageAge > 3 * slow) {
      p.stage = 'dead'; G.ghosted++;
      log(`${p.name} ghosted. He was ready. <b>You never scheduled the call.</b>`, 'bad');
    } else if (p.stage === 'soured' && p.stageAge > 3) {
      p.stage = 'dead'; G.ghosted++;
      log(`${p.name} (the skeptic) found someone with a demo. Gone.`, 'bad');
    } else if (p.type === 'oldfriend' && p.stageAge === 6) {
      log(`${p.name} replied "bro 100% next week for sure" for the ${RI(3, 9)}th time. He is a friend, not a deal. Stop spending energy here.`, 'dim');
    }
  }
  G.prospects = G.prospects.filter(p => !(p.stage === 'dead' && rng() < 0.5));

  const ev = pick(EVENTS);
  log(ev.t, 'dim');
  for (const k in ev.fx) {
    if (k === 'cash') G.cash += ev.fx[k];
    if (k === 'rep') G.rep = Math.max(0, Math.min(100, G.rep + ev.fx[k]));
    if (k === 'burnout') G.burnout = Math.max(0, Math.min(100, G.burnout + ev.fx[k]));
  }
  if (G.day % 4 === 0) log('<i>note to self: ' + pick(TIPS) + '</i>', 'dim');

  if (G.burnout >= 100) return gameOver(false);
  if (G.cash >= G.goal) return gameOver(true);
  render();
}

/* ---------- end states ---------- */
function gameOver(winner) {
  G.over = true;
  $('endTitle').textContent = winner ? 'YOU MADE IT.' : 'BURNOUT.';
  $('endTitle').className = winner ? 'gold' : 'red';
  $('endBody').innerHTML = winner
    ? `$${G.cash.toLocaleString()} in <b>${G.day} days</b>. ${G.won} closed, ${G.ghosted} ghosted, ${G.steel} steel earned.<br><br>Notice what actually worked: small fast yeses, demos for skeptics, decision calls on everything - and resting anyway.`
    : `Day ${G.day}. Cash: $${G.cash.toLocaleString()}. The work didn't kill you. <b>Never stopping did.</b><br><br>${G.steel === 0 ? 'You never once rested through the voice. Steel: 0. There is a lesson in that.' : 'You had ' + G.steel + ' steel. You needed more rest, not more hours.'}`;
  $('endModal').classList.add('on');
  $('shareEnd').onclick = () => shareCard(winner);
  $('againEnd').onclick = () => location.reload();
  if (winner) AudioFX.win(); else AudioFX.bad();
}

function shareCard(winner) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const x = c.getContext('2d');
  x.fillStyle = '#0B0A08'; x.fillRect(0, 0, 1080, 1350);
  x.strokeStyle = '#2A2620'; x.lineWidth = 2; x.strokeRect(40, 40, 1000, 1270);
  x.fillStyle = '#6B6357'; x.font = '500 30px "Sometype Mono"'; x.fillText('GHOSTED · AN AGENCY SIMULATOR', 80, 130);
  x.fillStyle = winner ? '#FFB454' : '#E05A4E'; x.font = '700 110px "Unbounded"';
  x.fillText(winner ? 'I MADE IT.' : 'BURNOUT.', 80, 420);
  x.fillStyle = '#EDE6DA'; x.font = '500 44px "Sometype Mono"';
  const lines = [`days survived: ${G.day}`, `cash closed: $${G.cash.toLocaleString()}`, `deals won: ${G.won}`, `times ghosted: ${G.ghosted}`, `steel earned: ${G.steel}`];
  lines.forEach((l, i) => x.fillText(l, 80, 560 + i * 78));
  x.fillStyle = '#6B6357'; x.font = '500 30px "Sometype Mono"';
  x.fillText('survive yours → ghosted-game.vercel.app', 80, 1240);
  const a = document.createElement('a'); a.download = 'ghosted-run.png'; a.href = c.toDataURL('image/png'); a.click();
}

/* ---------- render ---------- */
function render() {
  $('stDay').textContent = G.day;
  $('stCash').textContent = '$' + G.cash.toLocaleString();
  $('cashBar').style.width = Math.min(100, G.cash / G.goal * 100) + '%';
  $('stRep').textContent = G.rep;
  $('stSteel').textContent = G.steel;
  $('burnBar').style.width = G.burnout + '%';
  $('burnBar').classList.toggle('hot', G.burnout > 65);
  $('stEnergy').innerHTML = '●'.repeat(G.energy) + '<i>' + '●'.repeat(Math.max(0, G.energyMax - G.energy)) + '</i>';

  const live = G.prospects.filter(p => !['won', 'dead'].includes(p.stage));
  $('pipeCount').textContent = live.length + ' LIVE';
  $('pipeline').innerHTML = live.length ? '' : '<div class="empty">Pipeline empty. That outreach button is right there.</div>';
  for (const p of live) {
    const A = ARCHETYPES[p.type];
    const el = document.createElement('div');
    el.className = 'pcard';
    const stageTxt = { lead: 'REPLIED · wants a call', proposal: p.decisionCall ? 'PROPOSAL · decision call SET' : 'PROPOSAL · ⚠ no call scheduled', soured: '⚠ SOURED · needs a real demo' }[p.stage] || p.stage;
    el.innerHTML = `
      <div class="ph2"><b>${p.name}</b><span>$${p.ticket.toLocaleString()}</span></div>
      <div class="parch">${A.label} · ${p.biz}</div>
      <div class="pstage ${p.stage === 'soured' || (p.stage === 'proposal' && !p.decisionCall) ? 'warn' : ''}">${stageTxt}${p.matchpoint != null && p.stage === 'proposal' ? ' · MATCH-POINT: ' + p.matchpoint + 'd left' : ''}</div>
      <div class="pmeta">${'▰'.repeat(p.artifacts)}${p.artifacts ? ' artifacts · ' : ''}age ${p.stageAge}d</div>
      <div class="pbtns"></div>`;
    const btns = el.querySelector('.pbtns');
    const mk = (label, fn, cls) => { const b = document.createElement('button'); b.className = 'pbtn ' + (cls || ''); b.textContent = label; b.onclick = () => fn(p); btns.appendChild(b); };
    if (p.stage === 'lead') { mk('TAKE THE CALL', takeCall, 'hot'); mk('BUILD FIRST', buildFor); }
    if (p.stage === 'proposal') { mk('CLOSE IT', closeDeal, 'hot'); if (!p.decisionCall) mk('SCHEDULE CALL', pp => { pp.decisionCall = true; log(`Decision call booked with ${pp.name}. Better late than ghosted.`, 'good'); render(); }); mk('BUILD MORE', buildFor); }
    if (p.stage === 'soured') mk('SEND A DEMO', recoverSkeptic, 'hot');
    $('pipeline').appendChild(el);
  }

  document.querySelectorAll('[data-act]').forEach(b => b.disabled = G.energy < 1 || G.over);
}

/* ---------- boot ---------- */
document.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ACTIONS[b.dataset.act]());
$('endDay').onclick = endDay;
$('startBtn').onclick = () => {
  $('intro').classList.add('gone');
  AudioFX.init();
  log('Day 1. An empty pipeline, a laptop, and a number in your head: <b>$10,000</b>. Energy is the only currency you actually control. Spend it like it\'s real, because it is.', 'gold');
  spawnProspect('quickyes');
  render();
};
$('sndTgl').onclick = e => { const on = AudioFX.toggle(); e.target.textContent = on ? 'SOUND ON' : 'SOUND OFF'; e.target.classList.toggle('on', on); };
render();
