/* GHOSTED - data layer. Every archetype is a real way deals die,
   harvested from a real agency's pipeline autopsy and turned into satire.
   All names are fiction. */

const FIRST = ['Arjun', 'Priya', 'Marcus', 'Elena', 'Tariq', 'Sofia', 'Dmitri', 'Chloe', 'Hassan', 'Nina', 'Jake', 'Yuki', 'Omar', 'Greta', 'Leo', 'Fatima', 'Carlos', 'Ingrid'];
const BIZ = ['a coaching business', 'a D2C brand', 'a recruiting firm', 'a fitness studio chain', 'a SaaS startup', 'a wedding planning company', 'a real-estate brokerage', 'a marketing agency', 'an online academy', 'a logistics company'];

const ARCHETYPES = {
  quickyes: {
    label: 'THE QUICK YES', weight: 14, ticket: [300, 900],
    blurb: 'Small ticket. Decisive. Suspicious of nothing.',
    intro: n => `${n.name} runs ${n.biz}. Wants something small, wants it now.`,
  },
  skeptic: {
    label: 'THE SKEPTIC', weight: 16, ticket: [2000, 4000],
    blurb: 'Builds things himself. Will call your deck "AI slop" unless you SHOW him something real first.',
    intro: n => `${n.name} (${n.biz}) replies: "send me something REAL, not a pitch."`,
  },
  negotiator: {
    label: 'THE NEGOTIATOR', weight: 14, ticket: [4000, 6500],
    blurb: 'Haggles to a match-point, then evaporates if you leave the thread open.',
    intro: n => `${n.name} from ${n.biz} asks for your "best price" in the first message.`,
  },
  whale: {
    label: 'THE WHALE', weight: 8, ticket: [8000, 14000],
    blurb: 'Huge ticket. Moves like a glacier. Needs serious proof.',
    intro: n => `${n.name} runs ${n.biz} doing 8 figures. Replies once every few days, from an airport.`,
  },
  barter: {
    label: 'THE EXPOSURE GUY', weight: 9, ticket: [0, 0],
    blurb: 'Will pay you in "exposure." His audience is 412 people.',
    intro: n => `${n.name} (${n.biz}) loves your work and has a "win-win" idea that involves no money.`,
  },
  oldfriend: {
    label: 'THE OLD FRIEND', weight: 9, ticket: [400, 700],
    blurb: 'Warm forever. Replies instantly. Will decide absolutely never.',
    intro: n => `${n.name}! From school! Running ${n.biz} now! "bro we should definitely do this" (he will not do this)`,
  },
  enthusiast: {
    label: 'THE ENTHUSIAST', weight: 16, ticket: [1500, 3500],
    blurb: 'Loves everything you send. Vanishes precisely when money is mentioned.',
    intro: n => `${n.name} from ${n.biz}: "this is EXACTLY what we need!!" (three exclamation marks. note that.)`,
  },
};

/* one per day, flavored chaos. effect: {cash, rep, burnout, energy} */
const EVENTS = [
  { t: 'Your transcription tool renamed a client "Greg" to "780NATS". You almost emailed 780NATS.', fx: {} },
  { t: 'Your laptop fan made a sound laptops should not make. It stopped. You are choosing to believe it is fine.', fx: { burnout: 4 } },
  { t: 'A competitor posted "we closed $40K this week!!" It is not true. It still ruined your morning.', fx: { burnout: 6 } },
  { t: 'Someone found your old portfolio and said "this is clean." Rep up.', fx: { rep: 3 } },
  { t: 'The platform changed its API pricing overnight. Everyone is screaming. You use it for exactly one feature.', fx: {} },
  { t: 'You opened the analytics dashboard 14 times today. The number did not change 14 times.', fx: { burnout: 3 } },
  { t: 'A stranger DMed: "how do you do the thing you do?" You wrote a 9-paragraph reply. They said "cool."', fx: { rep: 1, burnout: 2 } },
  { t: 'Power cut. Your machine survived on battery while you held your breath for 40 minutes.', fx: { burnout: 4 } },
  { t: 'You found a typo in a proposal you sent 3 days ago. Nobody noticed. You will think about it forever.', fx: { burnout: 3 } },
  { t: 'An old client referred someone. Quietly. The way real reputation works.', fx: { rep: 4 } },
  { t: 'You watched one (1) video about productivity instead of working. The algorithm now thinks you are in crisis.', fx: {} },
  { t: 'Invoice from last month actually got paid. On time. Frame it.', fx: { cash: 250 } },
  { t: 'Family asked how "the computer business" is going. You said "good." The word held 4,000 pounds.', fx: { burnout: 5 } },
  { t: 'You rebuilt your task system at 2 AM. It is beautiful. It contains the same tasks.', fx: { burnout: -2 } },
  { t: 'Slow day. Nothing happened. Nothing happening is also data.', fx: {} },
  { t: 'A meme you posted did numbers. Your serious post from yesterday: 11 views.', fx: { rep: 2 } },
];

const VOICE_LINES = [
  'you should be working.',
  'everyone else is working right now.',
  'rest is for after. it was always for after.',
  'one more task. then you can stop. (you know that is not true.)',
  'the deadline does not rest.',
];

const LOG = {
  outreachHit: ['A reply. An actual reply.', 'Someone bit. Stay calm.', 'New conversation opened. Don\'t scare them off.'],
  outreachMiss: ['Sent 10 DMs into the void. The void left you on read.', 'Outreach done. Silence, but a disciplined silence.', 'No replies today. The pipeline is a garden, you tell yourself. A dead garden.'],
  content: ['Posted. It\'s out there doing quiet work.', 'Content shipped. Somewhere, a future client just saw your name for the first time.', 'Posted. Refreshing the likes won\'t make it grow faster. You refresh anyway.'],
  build: ['Artifact shipped. It\'s genuinely good. Now make sure a HUMAN sees it.', 'Built. The work was the easy part. It always was.', 'Demo done. This one might actually land.'],
  polish: ['The deck is now 4% more navy. Revenue impact: zero. It felt nice though.', 'You kerned a heading for 25 minutes. The prospect will look at it for 6 seconds.', 'Deck polished. The deck was not the problem. The deck is never the problem.'],
  call: ['Call done. You talked 60%. Next time make it 40.', 'Good call. They used the word "definitely." Do not bank a "definitely."', 'Call finished. Proposal is the next move - and proposals need decision calls.'],
};

const TIPS = [
  'a proposal without a scheduled decision call is a letter to nobody.',
  'the skeptic buys demos, not decks.',
  'small first ticket, fast yes, expand later. friction kills.',
  'rest is a stat, not a sin. steel only comes from resting ANYWAY.',
  'three artifacts for one prospect is hiding, not working.',
];
