// Fictional demo data for VibeX. Deterministic (seeded PRNG) and stored in
// localStorage on first run. Replace with API calls when wiring a backend.
import { SAMPLE_SRc, SHORT_SRCS, svgThumb, avatarSVG, CAT_THUMBS } from '../lib/media'
import { CATEGORIES, catById } from '../config/brand'
import { mulberry32, uid } from '../lib/format'

const H = 3600e3
const D = 86400e3
const now = Date.now()

// ── Users ──────────────────────────────────────────────────────
const CREATOR_SPEC = [
  ['Nova Rivera', 'novamakes', 262, 'Tech reviews, keyboards & cozy desk setups. New video every Friday. 💜', 'technology', 841000],
  ['Kai Tanaka', 'kaibuilds', 300, 'Speedruns, indie gems & game dev logs.', 'gaming', 1204000],
  ['Luna Sky', 'lunasky', 150, 'Synth-pop artist. Midnight drives & studio diaries 🎧', 'music', 967000],
  ['Marco Vitale', 'marcoeats', 20, 'Home cook. Big flavors, tiny kitchen.', 'cooking', 456000],
  ['Aria Bennett', 'ariafit', 160, 'Skateboarding, strength & 5AM routines.', 'sports', 702000],
  ['Theo Park', 'theovlogs', 190, 'Travel & slow living. Currently in Japan 🇯🇵', 'vlogs', 534000],
  ['Dr. Iris Chen', 'iriscience', 185, 'Physicist explaining the universe, one video at a time.', 'science', 1890000],
  ['Jax Monroe', 'jaxlaughs', 35, 'Sketch comedy & impressions. Sorry in advance.', 'comedy', 2103000],
  ['Sofia Almeida', 'sofiastyles', 325, 'Stage lights, backstage chaos, pop culture.', 'entertainment', 389000],
  ['Dario Fontana', 'dariotalks', 215, 'Tech & city news — minus the noise.', 'news', 167000],
]

export function buildUsers() {
  const demo = {
    id: 'u_demo', username: 'rinwaves', displayName: 'Rin Alvarez',
    avatar: avatarSVG('Rin Alvarez', 288), bio: 'Just here for the vibes ✨',
    followers: 128, following: 64, joined: now - 420 * D, isAdmin: false,
  }
  const admin = {
    id: 'u_admin', username: 'vibexadmin', displayName: 'VibeX Admin',
    avatar: avatarSVG('VibeX Admin', 210), bio: 'Official moderation account.',
    followers: 15400, following: 12, joined: now - 900 * D, isAdmin: true,
  }
  const creators = CREATOR_SPEC.map(([name, un, hue, bio, cat, fol], i) => ({
    id: `u${i + 1}`, username: un, displayName: name,
    avatar: avatarSVG(name, hue), bio,
    followers: fol, following: 80 + ((i * 137) % 420), joined: now - (300 + i * 41) * D,
    isCreator: true, verified: fol > 500000, favCategory: cat,
  }))
  return [demo, admin, ...creators]
}
const CID = (i) => `u${i + 1}` // creator ids u1..u10

function poster(title, catId) {
  const file = CAT_THUMBS[catId]
  if (file) return file
  const c = catById(catId === 'cooking' ? 'entertainment' : catId)
  return svgThumb(title, c.c1, c.c2)
}

// ── Videos ─────────────────────────────────────────────────────
const VIDEO_SPEC = [
  // [creatorIdx, title, category, views, likes, daysAgo, srcKey, duration, description, tags]
  [0, 'I Tested Every Foldable Phone So You Don’t Have To', 'technology', 1240300, 48200, 2, 'gti', 742,
    'Three weeks, five foldables, one very tired reviewer. Here is the honest ranking after real-world use — battery, crease, cameras and the stuff brands never mention.\n\nTimestamps:\n0:00 Why foldables again\n1:40 The contenders\n6:12 Crease & durability\n12:48 Battery torture test\n17:02 Final ranking',
    ['tech', 'foldable', 'review', 'smartphones']],
  [1, 'Speedrunning Neon District — World Record Pace Breakdown', 'gaming', 2304000, 96100, 4, 'dream', 653,
    'Frame-by-frame analysis of the new WR-pace run, including the pipe skip discovered last week.', ['speedrun', 'gaming', 'neon district']],
  [2, 'Midnight Drive — Synthwave Mix Vol. 3', 'music', 1892000, 112400, 6, 'sintel', 888,
    '45 minutes of neon-soaked synthwave for late night drives. Tracklist in the pinned comment.', ['synthwave', 'mix', 'chill']],
  [3, '15-Minute Pasta That Tastes Like a Restaurant', 'cooking', 864000, 51200, 3, 'outback', 594,
    'Pantry staples + one pan. The secret is the starchy pasta water — do not skip step 3!\n\nFull recipe in the description of my saved collection.', ['pasta', 'recipe', 'easy meals']],
  [4, 'Skate Lines Through Barcelona (4K)', 'sports', 612000, 44800, 5, 'bullrun', 541,
    'Two days, one board, endless marble. Spot list at the end.', ['skate', 'barcelona', '4k']],
  [5, '48 Hours in Kyoto — Temples, Trains & Late-Night Ramen', 'vlogs', 938000, 72400, 1, 'tears', 726,
    'A slow travel vlog through Kyoto. Itinerary + budget breakdown in the description.', ['kyoto', 'travel vlog', 'japan']],
  [6, 'What’s Actually Inside a Black Hole?', 'science', 4501000, 218000, 8, 'bbb', 634,
    'Event horizons, singularities, and why your physics teacher was slightly wrong. Sources: linked below.', ['black hole', 'physics', 'space']],
  [7, 'When the Group Chat Plans a Trip', 'comedy', 3208000, 304500, 2, 'grand', 348,
    'Every group chat has THAT one person. Tag them.\n\nWritten & performed with the Tuesday sketch crew.', ['sketch', 'comedy', 'group chat']],
  [8, 'Behind The Scenes: Neon Nights Tour', 'entertainment', 445000, 22900, 9, 'blazes', 402,
    'Three months on the road compressed into seven minutes of glitter and chaos.', ['tour', 'backstage', 'concert']],
  [9, 'This Week in AI, Explained in 10 Minutes', 'news', 198000, 8400, 0, 'meltdowns', 601,
    'The three stories that mattered this week — no hype, no doom, just context.', ['ai', 'news', 'weekly']],
  [0, 'Build a Mechanical Keyboard With Me (ASMR-ish)', 'technology', 773000, 42800, 12, 'outback', 980,
    'Lubing switches for 16 minutes straight. You will fall asleep or buy a keyboard. No in-between.', ['keyboard', 'asmr', 'build']],
  [1, 'Top 10 Indie Games You Slept On This Year', 'gaming', 1102000, 51400, 15, 'bullrun', 719,
    'Number 4 made me cry at 2AM. Wishlist everything in the description.', ['indie games', 'top 10']],
  [2, 'How I Produced “Glass Ocean” in 48 Hours', 'music', 356000, 19800, 20, 'joyrides', 512,
    'Full project breakdown — drums first, always.', ['production', 'music', 'behind the song']],
  [4, 'The 5AM Routine Nobody Asked For (But Works)', 'sports', 528000, 33600, 18, 'fun', 446,
    'Cold water, iron, silence. Try it for a week.', ['routine', 'fitness', 'discipline']],
  [6, 'The Physics Hiding in Everyday Things', 'science', 1345000, 68200, 25, 'dream', 607,
    'Why mirrors flip horizontally (they don’t), why ice is slippery, and more.', ['physics', 'everyday science']],
  [5, 'A Week Off-Grid in the Mountains', 'vlogs', 1205000, 97400, 30, 'sintel', 845,
    'No signal, no schedule. Just a cabin, a lake and too much coffee.', ['off grid', 'cabin', 'slow living']],
  [7, 'Impressions Nobody Asked For Vol. 9', 'comedy', 1876000, 201400, 6, 'grand', 385,
    'You keep watching them, I keep making them.', ['impressions', 'comedy']],
  [9, 'City Transit Just Got a Green Upgrade — Here’s What Changes', 'news', 96000, 4100, 1, 'fun', 388,
    'New electric fleet, new routes, and why your commute might get shorter.', ['city', 'transit', 'news']],
  [8, 'Rating Award-Show Fits With Zero Mercy', 'entertainment', 689000, 47600, 4, 'meltdowns', 441,
    'Fashion police speedrun, any%. No look is safe tonight.', ['fashion', 'award show', 'reaction']],
  [6, 'Learn CSS Grid in 20 Minutes (Actually)', 'education', 958000, 55200, 40, 'outback', 1213,
    'Everything you need: tracks, areas, auto-flow, and the two mistakes everyone makes.\n\nCode: link in description. Chapters included.', ['css', 'webdev', 'tutorial']],
  [0, 'How Your Memory Actually Works — Explained Simply', 'education', 672000, 38900, 55, 'bullrun', 936,
    'Encoding, storage, retrieval — plus why you forget why you walked into rooms.', ['memory', 'learning', 'psychology']],
]

const EXTRA_TITLES = {
  technology: ['The App I Can’t Stop Recommending', 'Desk Setup Tour (Budget Edition)', 'Why Creators Are Switching to This Camera', 'I Automated My Whole Apartment', 'Tablets vs Laptops in 2026'],
  gaming: ['This Boss Fight Broke Me', 'Ranking Every Boss From Worst to Best', 'The Update That Changed Everything', 'Cozy Games for Rainy Days', 'My First 100 Hours — Honest Review'],
  music: ['Lo-fi Session: Rainy Window Beats', 'Studio Diary: Mixing “Glass Ocean”', 'Covering Your Requests Live', 'Gear I Actually Use (No Sponsorships)', 'Writing a Hook in Under 10 Minutes'],
  cooking: ['One Pan, Zero Effort Dinner', 'Rating Gas Station Snacks Blindfolded', 'The Crispiest Potatoes, Guaranteed', 'Meal Prep for People Who Hate Meal Prep', 'Street Food Recreated at Home'],
  sports: ['Learning Kickflips in 30 Days', 'Full Body Session — No Talking', 'Recovery Day Done Right', 'I Tried Pro Training for a Week', 'Skatepark Etiquette 101'],
  vlogs: ['Slow Morning in a Rainy City', 'Packing My Life Into One Backpack', 'Hidden Cafés Worth the Train Ride', '24 Hours With No Phone', 'What I Actually Spend in a Week'],
  science: ['Why the Ocean Is Still Unexplored', 'The Math Behind Music', 'We Grew Crystals for 30 Days', 'What Myths Did You Believe?', 'Experiments You Can Do at Home'],
  comedy: ['Reading Your Unhinged Comments', 'Types of People at the Gym', 'If Apps Were Honest', 'The Family Group Chat Experience', 'Dating App Bios Be Like'],
  entertainment: ['Recap: The Finale Everyone Argued About', 'Set Secrets From Your Favorite Shows', 'The Comeback Nobody Saw Coming', 'Tour Diary: City #12', 'Unhinged Fan Theories, Ranked'],
  news: ['The Housing Update, Minus the Noise', 'New Privacy Rules Explained Simply', 'Startup Layoffs — What the Data Says', 'This Week in Space Launches', 'Markets, Briefly'],
  education: ['Study Techniques That Are Actually Proven', 'Excel Skills That Feel Illegal to Know', 'How to Read Faster (Backed by Science)', 'Language Learning Myths, Busted', 'The Feynman Technique, Demonstrated'],
}

function buildVideos() {
  const out = VIDEO_SPEC.map(([ci, title, cat, views, likes, days, src, dur, desc, tags], i) => ({
    id: `v${i + 1}`, creatorId: CID(ci), title, category: cat, views, likes,
    createdAt: now - days * D - i * 7 * H, src: SAMPLE_SRc[src], duration: dur,
    description: desc, tags, visibility: 'public', poster: poster(title, cat),
    hashtags: tags.map((t) => t.replace(/\s+/g, '')),
    commentCount: Math.floor(likes * 0.06),
  }))
  // Generated long-tail so infinite scroll has depth
  const rnd = mulberry32(7)
  const cats = CATEGORIES.map((c) => c.id).concat('cooking')
  let n = out.length
  for (let i = 0; i < 26; i++) {
    const cat = cats[i % cats.length]
    const pool = EXTRA_TITLES[cat === 'cooking' ? 'cooking' : cat] || EXTRA_TITLES.technology
    const title = pool[i % pool.length]
    const creatorsForCat = CREATOR_SPEC.map((s, idx) => [s[4], idx]).filter(([c]) => c === cat || (cat === 'cooking' && c === 'cooking'))
    const ci = creatorsForCat.length ? creatorsForCat[i % creatorsForCat.length][1] : i % 10
    const views = Math.floor(30000 + rnd() * 1500000)
    const likes = Math.floor(views * (0.03 + rnd() * 0.05))
    const key = ['outback', 'bullrun', 'grand', 'gti', 'fun', 'joyrides'][i % 6]
    n++
    out.push({
      id: `v${n}`, creatorId: CID(ci), title, category: cat === 'cooking' ? 'cooking' : cat,
      views, likes, createdAt: now - Math.floor(rnd() * 300) * D,
      src: SAMPLE_SRc[key], duration: 300 + Math.floor(rnd() * 900),
      description: `${title} — full breakdown inside. Subscribe for weekly uploads.\n\n#${cat} #vibex`,
      tags: [cat, 'vibex', 'featured'], visibility: 'public',
      poster: poster(title, cat === 'cooking' ? 'cooking' : cat), hashtags: [cat, 'vibex'],
      commentCount: Math.floor(likes * 0.05),
    })
  }
  return out
}

// ── Shorts ─────────────────────────────────────────────────────
const SHORT_SPEC = [
  [0, 'POV: your keyboard finally sounds right ⌨️', 'switch go clack', ['keyboard', 'asmr'], 412000],
  [1, 'This skip shouldn’t be possible 💀', 'Neon District OST — “Overdrive”', ['speedrun', 'glitch'], 1204000],
  [2, 'new song snippet — be honest 🌊', 'Glass Ocean (demo) — Luna Sky', ['newmusic', 'synthpop'], 892000],
  [3, 'The pasta water trick nobody believes 🍝', 'original audio — marcoeats', ['recipe', 'foodtok'], 667000],
  [4, 'kickflip → bs tail, first try? almost 🛹', 'Bass Theory — KAYLO', ['skate', 'bts'], 388000],
  [5, 'Kyoto at 6am hits different ⛩️', 'rain & lofi — sleepy tapes', ['kyoto', 'travel'], 754000],
  [6, 'Your brain on 4 hours of sleep 🧠⚡', 'original audio — iriscience', ['science', 'facts'], 2103000],
  [7, 'That ONE friend in the group chat 😭', 'original audio — jaxlaughs', ['comedy', 'relatable'], 3400000],
  [8, 'backstage 30 seconds before doors ✨', 'Neon Nights — Sofia A.', ['backstage', 'tour'], 296000],
  [9, 'The AI headline you missed today 🤖', 'original audio — dariotalks', ['ai', 'news'], 118000],
  [4, '5am cold plunge: week 3 🥶', 'Motions — Aria B.', ['routine', 'gym'], 508000],
  [2, 'harmonies > everything 🎧', 'Stardust (acoustic) — Luna Sky', ['acoustic', 'cover'], 445000],
  [6, 'Why mirrors don’t actually flip 🔍', 'original audio — iriscience', ['physics', 'mindblown'], 1785000],
  [1, 'ranking my own deaths 💀 part 12', 'chipwrecked — 8bit dash', ['gaming', 'fails'], 903000],
  [5, 'airplane window core ✈️☁️', 'windowseat — cloud fm', ['travel', 'aesthetic'], 612000],
  [8, 'that transition tho 🔥', 'Pyro — NOVA9', ['transition', 'fits'], 527000],
  [0, 'cable management but make it art 🎛️', 'original audio — novamakes', ['setup', 'satisfying'], 341000],
  [7, 'impressions: customer service edition ☎️', 'original audio — jaxlaughs', ['impressions', 'comedy'], 1520000],
]

const EXTRA_SHORTS = [
  'day in my life (chaotic edition)', 'things that just make sense ✨', 'rating viewer setups pt.4',
  'unspoken rules of the internet', 'this took 47 takes 😮‍💨', 'satisfying loop — trust the process',
  'reply to a comment with a video 🎬', 'before vs after (6 months)', 'the algorithm brought you here',
  'hidden detail you missed 👀', 'one take wonder 🎯', 'sound on for this one 🔊',
]

function buildShorts() {
  const out = SHORT_SPEC.map(([ci, caption, music, tags, views], i) => ({
    id: `s${i + 1}`, creatorId: CID(ci), caption, music, views,
    likes: Math.floor(views * 0.11), createdAt: now - ((i * 19) % 240) * H,
    src: SAMPLE_SRc[SHORT_SRCS[i % SHORT_SRCS.length]], hashtags: tags,
    visibility: 'public', commentCount: Math.floor(views * 0.004),
    poster: svgThumb(caption.slice(0, 26), '#7c3aed', '#06d6a0', 360, 640),
  }))
  const rnd = mulberry32(21)
  for (let i = 0; i < EXTRA_SHORTS.length; i++) {
    const ci = i % 10
    const views = Math.floor(50000 + rnd() * 1900000)
    out.push({
      id: `s${out.length + 1}`, creatorId: CID(ci), caption: EXTRA_SHORTS[i],
      music: ['night loop — velvet fm', 'original audio', 'hyperfocus — KAZE', 'sunset drive — PALMS'][i % 4],
      views, likes: Math.floor(views * (0.07 + rnd() * 0.06)),
      createdAt: now - Math.floor(rnd() * 480) * H,
      src: SAMPLE_SRc[SHORT_SRCS[(i + 3) % SHORT_SRCS.length]],
      hashtags: ['vibes', ['fyp', 'viral', 'trending', 'daily'][i % 4]], visibility: 'public',
      commentCount: Math.floor(views * 0.004),
      poster: svgThumb(EXTRA_SHORTS[i].slice(0, 24), '#0ea5e9', '#a855f7', 360, 640),
    })
  }
  return out
}

// ── Posts ──────────────────────────────────────────────────────
function buildPosts() {
  const A = (n) => (CAT_THUMBS[n] || svgThumb(n, '#8b5cf6', '#4f8cff'))
  const spec = [
    [5, 'carousel', [A('travel'), A('science'), A('music')], 'Kyoto photo dump 📸 swipe for the shrine at sunrise ⛩️', 12400, 1 * D, ['kyoto', 'photodump']],
    [3, 'image', [A('cooking')], 'Tonight’s 15-minute pasta. Recipe video drops Friday 🍝', 8200, 2 * D, ['pasta', 'dinner']],
    [7, 'text', [], 'Hot take: the group chat trip never leaves the group chat. New sketch about it is live 😭', 31200, 3 * D, ['sketch']],
    [2, 'image', [A('music')], 'Studio night. “Glass Ocean” is 80% mixed 🌊', 15800, 4 * D, ['studio']],
    [0, 'carousel', [A('tech'), A('gaming')], 'Rebuild day. Before → after. Cable tax included.', 9800, 5 * D, ['desksetup']],
    [6, 'text', [], 'Reminder: you are made of atoms that were forged in dying stars. Have a great Tuesday.', 27600, 6 * D, ['space']],
    [4, 'image', [A('sports')], 'New deck, who dis 🛹', 7400, 7 * D, ['skate']],
    [1, 'text', [], 'Devlog tomorrow: the wall-jump is finally FUN. Also I drank 4 coffees, these two facts are unrelated.', 5100, 8 * D, ['gamedev']],
    [5, 'image', [A('travel')], 'Mornings like this ☕⛰️', 18900, 9 * D, ['slowliving', 'mountains']],
    [8, 'text', [], 'Tour city #12 tonight. I still get nervous every single time. See you in the pit ✨', 9600, 10 * D, ['tour']],
    [3, 'image', [A('cooking')], 'Crispiest potatoes I have ever made. Technique in the comments 🥔', 11300, 11 * D, ['potatoes']],
    [9, 'text', [], 'Working on an explainer about the new transit map. What confuses YOU about it? Genuine question.', 2300, 12 * D, ['city']],
  ]
  return spec.map(([ci, type, media, caption, likes, age, tags], i) => ({
    id: `p${i + 1}`, creatorId: CID(ci), type, media, caption, likes,
    createdAt: now - age - i * H, hashtags: tags, commentCount: Math.floor(likes * 0.03),
    visibility: 'public',
  }))
}

// ── Comments ───────────────────────────────────────────────────
const COMMENT_POOL = [
  'This deserves way more views honestly', 'The editing on this is INSANE 🔥',
  'Watched this three times already', 'Instant classic. Saving this one.',
  'Okay but the part at 2:14 sent me 😭', 'How is this free content?',
  'Been waiting for this all week — did not disappoint', 'The production quality keeps leveling up 👏',
  'Tutorial exactly when I needed it, thank you!', 'Not me watching this at 3am again',
  'This popped up at the perfect time', 'Underrated channel, fr',
  'Who else is here before this blows up? 📈', 'The attention to detail is unmatched',
  'Instantly shared with my group chat', 'More of this exact energy please',
]
const REPLY_POOL = [
  'Couldn’t agree more!', 'This!! 🙌', 'Fr, underrated comment',
  'Same here honestly', 'Came here to say exactly this',
]

function buildComments() {
  const rnd = mulberry32(99)
  const out = []
  const videoIds = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'v20', 'v21']
  const shortIds = ['s1', 's2', 's3', 's7', 's8']
  const postIds = ['p1', 'p3', 'p6']
  let id = 1
  const add = (type, contentId, count) => {
    for (let i = 0; i < count; i++) {
      const cid = `c${id++}`
      const cu = CID(Math.floor(rnd() * 10))
      out.push({
        id: cid, userId: cu, contentType: type, contentId,
        text: COMMENT_POOL[Math.floor(rnd() * COMMENT_POOL.length)],
        parentId: null, likes: Math.floor(rnd() * 900),
        createdAt: now - Math.floor(rnd() * 72) * H,
      })
      if (rnd() > 0.6) {
        out.push({
          id: `c${id++}`, userId: CID(Math.floor(rnd() * 10)), contentType: type, contentId,
          text: REPLY_POOL[Math.floor(rnd() * REPLY_POOL.length)],
          parentId: cid, likes: Math.floor(rnd() * 200),
          createdAt: now - Math.floor(rnd() * 40) * H,
        })
      }
    }
  }
  videoIds.forEach((v, i) => add('video', v, 3 + (i % 5)))
  shortIds.forEach((s, i) => add('short', s, 2 + (i % 4)))
  postIds.forEach((p, i) => add('post', p, 2 + (i % 3)))
  return out
}

// ── Notifications (for demo user) ──────────────────────────────
function buildNotifications() {
  const mk = (type, actorIdx, contentType, contentId, ageH, read) => ({
    id: uid('n'), userId: 'u_demo', type, actorId: CID(actorIdx),
    contentType, contentId, read, createdAt: now - ageH * H,
  })
  return [
    mk('like', 7, 'post', 'p1', 1, false),
    mk('follower', 2, null, null, 3, false),
    mk('comment', 3, 'video', 'v5', 5, false),
    mk('upload', 5, 'video', 'v6', 8, false),
    mk('reply', 0, 'video', 'v6', 12, false),
    mk('upload', 6, 'short', 's7', 26, true),
    mk('like', 4, 'video', 'v7', 30, true),
    mk('upload', 1, 'short', 's14', 33, true),
    mk('follower', 8, null, null, 50, true),
    mk('comment', 9, 'short', 's3', 60, true),
    mk('upload', 0, 'video', 'v11', 80, true),
    mk('like', 1, 'post', 'p3', 96, true),
  ]
}

// ── Conversations ──────────────────────────────────────────────
function buildConversations() {
  const mk = (otherIdx, msgs) => ({
    id: uid('cv'), participantIds: ['u_demo', CID(otherIdx)], messages: msgs.map(([from, text, ageMin, read]) => ({
      id: uid('m'), senderId: from === 0 ? 'u_demo' : CID(otherIdx),
      text, createdAt: now - ageMin * 60e3, read,
    })),
  })
  return [
    mk(7, [
      [1, 'Ahhh your comment about the group chat sketch 😭 I needed that', 12, true],
      [0, 'It was TOO real. The friend who picks the dates then vanishes 💀', 10, true],
      [1, 'That is literally my cousin. Part 2 is filming this weekend 👀', 8, true],
      [1, 'You better be in the credits as inspiration', 2, false],
    ]),
    mk(2, [
      [0, 'The Glass Ocean breakdown was incredible, the drum layer trick 🤯', 190, true],
      [1, 'Thank you!! Full project file is going up for supporters soon', 180, true],
      [0, 'Instant save. Any chance of a synth preset pack?', 175, true],
      [1, 'Funny you ask… dropped it in the community tab just now 🌊', 60, false],
    ]),
    mk(5, [
      [1, 'Kyoto recommendations thread is live!', 1500, true],
      [0, 'The 6am temple walk looked unreal', 1400, true],
      [1, 'Go on a weekday. You will have the whole path to yourself ⛩️', 1380, true],
    ]),
    mk(0, [
      [0, 'Your keyboard build video got me into the hobby. Wallet says thanks (it does not)', 2900, true],
      [1, 'HAHA welcome to the rabbit hole ⌨️', 2880, true],
    ]),
  ]
}

// ── Reports (for admin demo) ───────────────────────────────────
function buildReports() {
  return [
    { id: 'r1', type: 'video', targetId: 'v14', reason: 'Spam or misleading', reporterId: 'u5', createdAt: now - 5 * H, status: 'open' },
    { id: 'r2', type: 'comment', targetId: 'c3', reason: 'Harassment', reporterId: 'u2', createdAt: now - 9 * H, status: 'open' },
    { id: 'r3', type: 'user', targetId: 'u9', reason: 'Impersonation', reporterId: 'u3', createdAt: now - 2 * D, status: 'open' },
    { id: 'r4', type: 'video', targetId: 'v9', reason: 'Copyright claim', reporterId: 'u6', createdAt: now - 3 * D, status: 'open' },
  ]
}

// ── Trending searches ──────────────────────────────────────────
export const TRENDING_SEARCHES = [
  'kyoto travel vlog', 'synthwave mix', 'speedrun world record', 'css grid tutorial',
  'black hole explained', 'foldable phones 2026', 'kickflip progression', 'group chat sketch',
  '15 minute pasta', 'keyboard asmr',
]

export function buildSeed() {
  return {
    users: buildUsers(),
    videos: buildVideos(),
    shorts: buildShorts(),
    posts: buildPosts(),
    comments: buildComments(),
    notifications: buildNotifications(),
    conversations: buildConversations(),
    reports: buildReports(),
    seededAt: now,
  }
}
