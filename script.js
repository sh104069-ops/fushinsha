/* =========================================================
   あんぜんクエスト  script.js
   不審者対応を「いかのおすし」で学ぶRPG
   ========================================================= */
'use strict';

/* ---------- 小さな道具 ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let uidN = 0;
const uid = () => 'u' + (++uidN);
function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (p / 100) * 255)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* =========================================================
   1. ルール・区分
   ========================================================= */
const TAGS = {
  ika:  { k: 'い', label: '行かない',       desc: '知らない人について行かない',                       color: '#e0404f' },
  no:   { k: 'の', label: '乗らない',       desc: '知らない人の車に乗らない・近づかない',               color: '#f28c28' },
  o:    { k: 'お', label: '大声を出す',     desc: '「たすけて！」「いやです！」とはっきり言う',         color: '#d4a100' },
  su:   { k: 'す', label: 'すぐ逃げる',     desc: 'すぐにはなれて、人のいる所へ逃げる',                 color: '#2bb673' },
  shi:  { k: 'し', label: '知らせる',       desc: '家の人・先生・警察に知らせる',                       color: '#2f7fd8' },
  info: { k: '秘', label: '教えない',       desc: '名前・住所・学校・電話番号・家のるすを教えない',     color: '#6a4fb6' },
  call: { k: '切', label: '切る・返信しない', desc: 'あやしい電話は切る。あやしいメッセージには返信しない', color: '#607d8b' },
  door: { k: '扉', label: '開けない',       desc: '留守番中はドアを開けない',                           color: '#8d6e63' },
  help: { k: '助', label: '大人・110番',    desc: '一人で立ち向かわず、大人や110番に知らせる',          color: '#e91e63' },
};
const IKA_KEYS = ['ika', 'no', 'o', 'su', 'shi'];

const CATEGORIES = {
  town:  { name: '町の中での声かけ',        icon: '🏘️', color: '#4caf50' },
  car:   { name: '車からの声かけ',          icon: '🚗', color: '#2196f3' },
  yami:  { name: '闇バイトのさそい',        icon: '💰', color: '#9c27b0' },
  phone: { name: 'あやしい電話',            icon: '📞', color: '#ff9800' },
  rusu:  { name: '留守番中の訪問者',        icon: '🏠', color: '#a1887f' },
  kanyu: { name: 'しつこい勧誘（宗教など）', icon: '📄', color: '#78909c' },
  help:  { name: '困っている人を見つけたら', icon: '🆘', color: '#e91e63' },
};

const TYPES = {
  obvious: { label: 'いかにもあやしい人',     msg: '見るからにあやしい人だったね。近づかない、すぐにはなれる、が大切。' },
  normal:  { label: 'ふつうに見える人',       msg: '見た目はふつうの人。でも言っていることはあやしかったね。見た目だけでは分からないよ。' },
  kind:    { label: 'やさしそうに見える人',   msg: 'やさしそうでも「ついて来て」「教えて」はあやしいサイン。やさしさにだまされないで。' },
  friend:  { label: '友だち',                 msg: '友だちがあぶないときは、ひみつにしないで大人に相談しよう。それが友だちを守ることになるよ。' },
};

const LEVELS = {
  b: { name: '初級', desc: 'あやしい人に会ったとき、どう行動するかをえらぼう。', exp: 10 },
  m: { name: '中級', desc: 'えらんだあとも、あやしい人はしつこく追いこんでくる。さいごまで安全な行動をえらびつづけよう。', exp: 20 },
  a: { name: '上級', desc: '何と言うか、どうするかを自分のことばで書いて答えよう。', exp: 30 },
};

const RANKS = ['みならいぼうけんしゃ', 'あんぜんルーキー', 'ぼうはんファイター', 'まちのまもりびと', 'あんぜんナイト', 'あんぜんマスター', 'でんせつのあんぜんマスター'];

const OUT_INFO = '個人情報を教えるとアウト。名前や住所、家のるすが分かると、待ちぶせされたり、何度も連絡されたりする危険があるよ。';
const OUT_GO = 'ついて行く・車に乗る・ドアを開けると、連れ去られる危険がとても高いよ。';

/* =========================================================
   2. 人物イラスト（SVG）
   ========================================================= */
const AVATARS = {
  hood:        { skin: '#e0b48f', hair: '#222222', hairStyle: 'none',  top: '#2d2f36', topStyle: 'hoodie', hood: true, sunglasses: true, mask: true },
  suit:        { skin: '#f0c8a6', hair: '#1f1a17', hairStyle: 'side',  top: '#26324a', topStyle: 'suit', tie: '#7a2530', glasses: true, mouth: 'smile' },
  dogLady:     { skin: '#f6d2b8', hair: '#6b4226', hairStyle: 'long',  top: '#e79bb0', topStyle: 'cardigan', inner: '#fff8ee', eyes: 'smile', mouth: 'smile', blush: true, brows: 'kind', earrings: true },
  survey:      { skin: '#eec39f', hair: '#2a211b', hairStyle: 'short', top: '#3d8a6e', topStyle: 'polo', badge: true, item: 'clipboard', mouth: 'smile' },
  carMan:      { skin: '#e8bd98', hair: '#333333', hairStyle: 'short', top: '#5b6470', topStyle: 'jacket', inner: '#dddddd', mouth: 'smirk', beard: true },
  carWoman:    { skin: '#f3cdb0', hair: '#3a2a20', hairStyle: 'bob',   top: '#8a6fb3', topStyle: 'cardigan', inner: '#ffffff', mouth: 'open', brows: 'kind', earrings: true },
  yamiDM:      { skin: '#f2c9a8', hair: '#8a5a2b', hairStyle: 'spiky', top: '#f4f4f4', topStyle: 'tshirt', eyes: 'smile', mouth: 'grin' },
  yamiStreet:  { skin: '#eec29c', hair: '#1c1c1c', hairStyle: 'spiky', top: '#7d8f69', topStyle: 'jacket', inner: '#222222', eyes: 'smile', mouth: 'smile', earrings: true },
  cityCall:    { skin: '#ecc3a0', hair: '#2b2b2b', hairStyle: 'side',  top: '#5a5f6b', topStyle: 'suit', tie: '#3f5a7a', mouth: 'smirk' },
  teacherCall: { skin: '#efc6a3', hair: '#555555', hairStyle: 'side',  top: '#8c7b64', topStyle: 'cardigan', inner: '#ffffff', glasses: true, eyes: 'smile', mouth: 'smile', brows: 'kind' },
  delivery:    { skin: '#e6b791', hair: '#222222', hairStyle: 'short', top: '#4b6fa5', topStyle: 'uniform', cap: '#4b6fa5', badge: true, mouth: 'smile' },
  neighbor:    { skin: '#e9c09e', hair: '#bdbdbd', hairStyle: 'gray',  top: '#a0784f', topStyle: 'cardigan', inner: '#f1efe9', eyes: 'smile', mouth: 'smile', wrinkles: true, brows: 'kind' },
  kanyuWoman:  { skin: '#f5d0b5', hair: '#4a3528', hairStyle: 'bun',   top: '#6fa3c7', topStyle: 'cardigan', inner: '#ffffff', eyes: 'smile', mouth: 'smile', blush: true, item: 'pamphlet', brows: 'kind' },
  kanyuDoor:   { skin: '#eec5a2', hair: '#2d2d2d', hairStyle: 'side',  top: '#3b3b3b', topStyle: 'suit', tie: '#35506e', mouth: 'smile', item: 'pamphlet' },
  capMan:      { skin: '#dcae88', hair: '#222222', hairStyle: 'none',  cap: '#1d1d1d', top: '#161616', topStyle: 'jacket', inner: '#333333', mask: true, maskColor: '#3a3a3a', eyes: 'narrow', brows: 'angry' },
  clerk:       { skin: '#f4cfb2', hair: '#3b2a20', hairStyle: 'bob',   top: '#2f9e6e', topStyle: 'uniform', badge: true, eyes: 'normal', mouth: 'smile', brows: 'kind' },
  child:       { skin: '#f7d6bf', hair: '#2a1d15', hairStyle: 'bob',   top: '#f0b429', topStyle: 'tshirt', mouth: 'open', tear: true, brows: 'kind' },
  friend:      { skin: '#f0c8a6', hair: '#1b1b1b', hairStyle: 'short', top: '#1f2a44', topStyle: 'jersey', mouth: 'grin' },
  hero0:       { skin: '#f3cfb1', hair: '#1d1d1d', hairStyle: 'short', top: '#2f5fb3', topStyle: 'jersey', mouth: 'smile' },
  hero1:       { skin: '#f6d4bb', hair: '#2b1b12', hairStyle: 'bob',   top: '#c9364a', topStyle: 'jersey', mouth: 'smile', blush: true, brows: 'kind' },
  hero2:       { skin: '#eec39f', hair: '#3a2415', hairStyle: 'spiky', top: '#2a8a5a', topStyle: 'jersey', mouth: 'grin' },
  hero3:       { skin: '#f5d0b5', hair: '#1a1a1a', hairStyle: 'long',  top: '#6b4fb0', topStyle: 'jersey', mouth: 'smile', blush: true, brows: 'kind' },
};
const HEROES = [
  { key: 'hero0', name: 'ソラ' }, { key: 'hero1', name: 'ヒナ' },
  { key: 'hero2', name: 'リク' }, { key: 'hero3', name: 'ミオ' },
];

function clothes(c, top) {
  const dk = shade(top, -30);
  switch (c.topStyle) {
    case 'suit':
      return `<path d="M84 184 L100 226 L116 184 Z" fill="#f7f7f7"/><path d="M96 190 L104 190 L108 232 L100 244 L92 232 Z" fill="${c.tie || '#883333'}"/><path d="M78 186 L100 236 L92 262 M122 186 L100 236 L108 262" stroke="${dk}" stroke-width="3" fill="none"/>`;
    case 'cardigan':
      return `<path d="M82 184 L100 222 L118 184 Z" fill="${c.inner || '#ffffff'}"/><path d="M100 222 L100 262" stroke="${dk}" stroke-width="2"/><circle cx="105" cy="234" r="3" fill="${dk}"/><circle cx="105" cy="250" r="3" fill="${dk}"/>`;
    case 'polo':
      return `<path d="M80 184 L100 200 L92 212 Z M120 184 L100 200 L108 212 Z" fill="${shade(top, 20)}"/><path d="M100 200 L100 232" stroke="${dk}" stroke-width="2"/><circle cx="100" cy="212" r="2.5" fill="#fff"/><circle cx="100" cy="224" r="2.5" fill="#fff"/>`;
    case 'hoodie':
      return `<path d="M62 188 Q100 214 138 188" stroke="${dk}" stroke-width="8" fill="none"/><path d="M90 200 L88 236 M110 200 L112 236" stroke="#cfcfcf" stroke-width="2.5"/><path d="M68 262 L74 236 L126 236 L132 262 Z" fill="${shade(top, -10)}"/>`;
    case 'jacket':
      return `<path d="M84 184 L100 214 L116 184 Z" fill="${c.inner || '#dddddd'}"/><path d="M100 214 L100 262" stroke="${dk}" stroke-width="3"/><path d="M76 188 L92 222 M124 188 L108 222" stroke="${dk}" stroke-width="3" fill="none"/>`;
    case 'uniform':
      return `<path d="M80 184 L100 204 L120 184 L114 196 L100 208 L86 196 Z" fill="${shade(top, 18)}"/><path d="M100 206 L100 262" stroke="${dk}" stroke-width="2"/>`;
    case 'jersey':
      return `<path d="M84 184 L100 200 L116 184" stroke="#fff" stroke-width="5" fill="none"/><path d="M100 200 L100 262" stroke="#dddddd" stroke-width="3"/><path d="M30 262 L46 198 M170 262 L154 198" stroke="#fff" stroke-width="5"/>`;
    default:
      return `<path d="M80 186 Q100 204 120 186" stroke="${dk}" stroke-width="4" fill="none"/>`;
  }
}
function hairFront(c, H) {
  switch (c.hairStyle) {
    case 'short': return `<path d="M50 104 Q46 44 100 42 Q154 44 150 104 Q146 76 126 68 Q104 80 82 70 Q58 76 50 104 Z" fill="${H}"/>`;
    case 'side':  return `<path d="M50 106 Q46 46 100 44 Q156 46 150 106 Q148 80 132 70 Q98 64 66 84 Q56 92 50 106 Z" fill="${H}"/><path d="M70 60 Q96 55 124 62" stroke="#fff" stroke-width="1.5" opacity=".2" fill="none"/>`;
    case 'long':  return `<path d="M50 112 Q46 44 100 44 Q154 44 150 112 Q142 80 124 72 Q108 90 86 76 Q64 86 50 112 Z" fill="${H}"/>`;
    case 'bob':   return `<path d="M46 100 Q44 44 100 42 Q156 44 154 100 L156 158 Q146 164 138 158 L138 100 Q126 78 100 78 Q74 78 62 100 L62 158 Q54 164 44 158 Z" fill="${H}"/>`;
    case 'bun':   return `<circle cx="100" cy="40" r="20" fill="${H}"/><path d="M50 104 Q46 50 100 48 Q154 50 150 104 Q140 72 100 68 Q60 72 50 104 Z" fill="${H}"/>`;
    case 'gray':  return `<path d="M52 104 Q50 62 70 56 Q100 48 130 56 Q150 62 148 104 Q144 80 132 74 Q118 66 100 66 Q82 66 68 74 Q56 80 52 104 Z" fill="${H}"/>`;
    case 'spiky': return `<path d="M50 104 Q44 60 62 50 L66 34 L80 46 L92 28 L104 44 L118 30 L124 48 L140 40 L138 56 Q156 66 150 104 Q144 78 124 70 Q100 82 78 70 Q56 78 50 104 Z" fill="${H}"/>`;
    default: return '';
  }
}
function brows(c) {
  if (c.sunglasses) return '';
  const col = shade(c.hair || '#333333', -10);
  if (c.brows === 'angry') return `<path d="M64 94 L92 101 M136 94 L108 101" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
  if (c.brows === 'kind') return `<path d="M66 97 Q78 90 92 96 M108 96 Q122 90 134 97" stroke="${col}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  return `<path d="M66 96 L92 95 M108 95 L134 96" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
}
function eyes(c) {
  if (c.sunglasses) return '';
  const iris = '#3a2618';
  if (c.eyes === 'smile') return `<path d="M70 114 Q80 104 90 114 M110 114 Q120 104 130 114" stroke="${iris}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  if (c.eyes === 'narrow') return `<ellipse cx="80" cy="112" rx="10" ry="3.5" fill="#fff"/><ellipse cx="120" cy="112" rx="10" ry="3.5" fill="#fff"/><circle cx="82" cy="112" r="3.2" fill="${iris}"/><circle cx="122" cy="112" r="3.2" fill="${iris}"/><path d="M69 109 L91 109 M109 109 L131 109" stroke="${iris}" stroke-width="2.5"/>`;
  return `<ellipse cx="80" cy="112" rx="9" ry="6" fill="#fff"/><ellipse cx="120" cy="112" rx="9" ry="6" fill="#fff"/><circle cx="80" cy="112" r="4.5" fill="${iris}"/><circle cx="120" cy="112" r="4.5" fill="${iris}"/><circle cx="81.5" cy="110.5" r="1.5" fill="#fff"/><circle cx="121.5" cy="110.5" r="1.5" fill="#fff"/><path d="M70 108 Q80 103 90 108 M110 108 Q120 103 130 108" stroke="${iris}" stroke-width="2" fill="none"/>`;
}
function mouth(c) {
  const m = '#9a4a3a';
  switch (c.mouth) {
    case 'grin':  return `<path d="M84 142 Q100 162 116 142 Z" fill="#7a2e2a"/><path d="M86 143 L114 143 L112 148 L88 148 Z" fill="#fff"/>`;
    case 'open':  return `<ellipse cx="100" cy="148" rx="8" ry="6" fill="#7a2e2a"/>`;
    case 'smirk': return `<path d="M86 148 Q102 152 116 142" stroke="${m}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'smile': return `<path d="M86 144 Q100 156 114 144" stroke="${m}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    default:      return `<path d="M88 148 L112 148" stroke="${m}" stroke-width="3" stroke-linecap="round"/>`;
  }
}
function items(c) {
  let s = '';
  if (c.badge) s += `<rect x="124" y="208" width="32" height="20" rx="3" fill="#fff" stroke="#bbbbbb"/><path d="M129 214 L151 214 M129 220 L145 220" stroke="#999" stroke-width="2"/>`;
  if (c.item === 'clipboard') s += `<g transform="rotate(-8 60 230)"><rect x="34" y="200" width="54" height="66" rx="4" fill="#8a5a2b"/><rect x="40" y="208" width="42" height="54" fill="#fff"/><rect x="52" y="196" width="18" height="8" rx="2" fill="#aaaaaa"/><path d="M46 220 L76 220 M46 230 L76 230 M46 240 L70 240" stroke="#99aaaa" stroke-width="2"/></g>`;
  if (c.item === 'pamphlet') s += `<g transform="rotate(-10 60 232)"><rect x="36" y="204" width="50" height="62" rx="3" fill="#fff"/><rect x="36" y="204" width="50" height="22" fill="#7fb3d5"/><circle cx="61" cy="244" r="9" fill="#f6c86b"/></g>`;
  return s;
}

/** 人物の中身（200×260座標）を返す */
function avatarInner(c, id) {
  const skin = c.skin, sk2 = shade(skin, -14), hair = c.hair || '#222222', top = c.top || '#555566';
  const g = 'a' + id;
  let s = `<defs>
    <radialGradient id="sk${g}" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="${shade(skin, 6)}"/><stop offset="1" stop-color="${shade(skin, -10)}"/></radialGradient>
    <linearGradient id="cl${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(top, 8)}"/><stop offset="1" stop-color="${shade(top, -22)}"/></linearGradient>
    <linearGradient id="hr${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hair, 12)}"/><stop offset="1" stop-color="${hair}"/></linearGradient>
  </defs>`;
  const H = `url(#hr${g})`;
  if (c.hairStyle === 'long') s += `<path d="M50 96 Q40 180 58 222 L142 222 Q160 180 150 96 Z" fill="${H}"/>`;
  if (c.hood) s += `<path d="M36 128 Q34 34 100 32 Q166 34 164 128 L170 210 L30 210 Z" fill="${shade(top, -8)}"/>`;
  s += `<path d="M82 148 L82 184 Q100 196 118 184 L118 148 Z" fill="${sk2}"/>`;
  s += `<path d="M8 262 Q12 204 58 188 Q80 180 100 182 Q120 180 142 188 Q188 204 192 262 Z" fill="url(#cl${g})"/>`;
  s += clothes(c, top);
  s += `<ellipse cx="52" cy="112" rx="8" ry="13" fill="${sk2}"/><ellipse cx="148" cy="112" rx="8" ry="13" fill="${sk2}"/>`;
  s += `<path d="M52 100 Q52 44 100 44 Q148 44 148 100 Q148 150 122 166 Q100 178 78 166 Q52 150 52 100 Z" fill="url(#sk${g})"/>`;
  if (c.wrinkles) s += `<path d="M78 76 Q100 70 122 76 M82 84 Q100 79 118 84" stroke="${shade(skin, -22)}" stroke-width="1.5" fill="none" opacity=".6"/><path d="M66 120 l-6 4 M134 120 l6 4 M84 160 Q100 166 116 160" stroke="${shade(skin, -25)}" stroke-width="1.5" fill="none"/>`;
  if (c.beard) s += `<path d="M62 126 Q64 164 100 172 Q136 164 138 126 Q132 150 100 156 Q68 150 62 126 Z" fill="${shade(skin, -40)}" opacity=".35"/>`;
  s += hairFront(c, H);
  s += brows(c) + eyes(c);
  s += `<path d="M100 112 Q96 128 99 133 Q103 135 107 132" stroke="${shade(skin, -28)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if (c.blush) s += `<ellipse cx="72" cy="132" rx="9" ry="5" fill="#ff8a8a" opacity=".3"/><ellipse cx="128" cy="132" rx="9" ry="5" fill="#ff8a8a" opacity=".3"/>`;
  if (!c.mask) s += mouth(c);
  if (c.tear) s += `<path d="M76 120 Q71 131 76 136 Q81 131 76 120 Z" fill="#7cc4ff"/>`;
  if (c.glasses) s += `<g fill="none" stroke="#2b2b2b" stroke-width="3"><rect x="64" y="100" width="30" height="22" rx="8"/><rect x="106" y="100" width="30" height="22" rx="8"/><path d="M94 110 Q100 106 106 110 M64 108 L54 104 M136 108 L146 104"/></g>`;
  if (c.sunglasses) s += `<path d="M60 100 L96 100 Q96 124 80 124 Q62 124 60 100 Z M104 100 L140 100 Q138 124 120 124 Q104 124 104 100 Z" fill="#111"/><path d="M96 104 Q100 100 104 104 M60 102 L52 100 M140 102 L148 100" stroke="#111" stroke-width="3" fill="none"/><path d="M66 105 L78 105 M110 105 L122 105" stroke="#fff" stroke-width="2" opacity=".45"/>`;
  if (c.mask) s += `<path d="M60 122 Q100 116 140 122 L138 150 Q100 176 62 150 Z" fill="${c.maskColor || '#f2f2f2'}" stroke="${shade(c.maskColor || '#f2f2f2', -12)}"/><path d="M66 132 Q100 128 134 132 M68 142 Q100 140 132 142" stroke="${shade(c.maskColor || '#f2f2f2', -14)}" fill="none"/><path d="M60 124 L50 114 M140 124 L150 114" stroke="#e5e5e5" stroke-width="2"/>`;
  if (c.hood) s += `<path d="M42 136 Q38 42 100 40 Q162 42 158 136" fill="none" stroke="${shade(top, -18)}" stroke-width="12" stroke-linecap="round"/>`;
  if (c.cap) s += `<path d="M50 86 Q50 38 100 36 Q150 38 150 86 Z" fill="${c.cap}"/><path d="M48 86 Q100 74 164 92 Q158 102 48 94 Z" fill="${shade(c.cap, -18)}"/><circle cx="100" cy="38" r="4" fill="${shade(c.cap, -25)}"/>`;
  if (c.earrings) s += `<circle cx="52" cy="128" r="3.5" fill="#ffd54a"/><circle cx="148" cy="128" r="3.5" fill="#ffd54a"/>`;
  s += items(c);
  return s;
}
/** 単体のSVG（viewBoxで顔アップなども可） */
function avatarSVG(key, viewBox = '0 0 200 260') {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${avatarInner(AVATARS[key], uid())}</svg>`;
}

/* 写真差しかえ：images/<key>.png または .jpg があればそちらを使う */
const photoCache = {};
function findPhoto(key) {
  return new Promise((resolve) => {
    if (key in photoCache) return resolve(photoCache[key]);
    const exts = ['png', 'jpg'];
    let i = 0;
    const next = () => {
      if (i >= exts.length) { photoCache[key] = null; return resolve(null); }
      const url = `images/${key}.${exts[i++]}`;
      const img = new Image();
      img.onload = () => { photoCache[key] = url; resolve(url); };
      img.onerror = next;
      img.src = url;
    };
    next();
  });
}

/* =========================================================
   3. 背景
   ========================================================= */
const SKY = (id, a = '#8ec5ee', b = '#dff1fb') =>
  `<defs><linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="250" fill="url(#sky${id})"/>`;

function buildings(list, base = 200) {
  return list.map(([x, w, h, col]) => {
    let s = `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${col}"/>`;
    for (let yy = base - h + 12; yy < base - 14; yy += 22)
      for (let xx = x + 8; xx < x + w - 12; xx += 18)
        s += `<rect x="${xx}" y="${yy}" width="10" height="12" fill="#eef5fb" opacity=".7"/>`;
    return s;
  }).join('');
}
function tree(x, y, s = 1, col = '#5aa05a') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="0" width="12" height="46" fill="#7a5433"/><circle cx="0" cy="-10" r="30" fill="${col}"/><circle cx="-20" cy="4" r="20" fill="${shade(col, -6)}"/><circle cx="20" cy="2" r="22" fill="${shade(col, 6)}"/></g>`;
}
function house(x, w, h, wall, roof, base = 150) {
  return `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${wall}"/><path d="M${x - 8} ${base - h} L${x + w / 2} ${base - h - 30} L${x + w + 8} ${base - h} Z" fill="${roof}"/><rect x="${x + 12}" y="${base - h + 14}" width="18" height="16" fill="#dfeefa"/><rect x="${x + w - 30}" y="${base - h + 14}" width="18" height="16" fill="#dfeefa"/>`;
}
function tiles(y0 = 196) {
  let s = '';
  for (let y = y0 + 16; y < 250; y += 18) s += `<path d="M0 ${y} L400 ${y}" stroke="#bfb7aa" stroke-width="1"/>`;
  for (let x = 20; x < 400; x += 44) s += `<path d="M${x} ${y0} L${x - 10} 250" stroke="#bfb7aa" stroke-width="1"/>`;
  return s;
}

const BG = {
  street: (id) => SKY(id) +
    `<ellipse cx="330" cy="36" rx="40" ry="11" fill="#fff" opacity=".7"/><ellipse cx="90" cy="26" rx="30" ry="8" fill="#fff" opacity=".6"/>` +
    buildings([[0, 70, 120, '#b7c2cf'], [74, 60, 150, '#9fb0c2'], [140, 90, 100, '#c9b8a6'], [236, 64, 140, '#a7b6a0'], [304, 96, 115, '#bfc6d4']]) +
    `<rect x="0" y="190" width="400" height="60" fill="#d6cfc3"/><rect x="0" y="188" width="400" height="6" fill="#a39b8f"/>${tiles(194)}
     <rect x="30" y="40" width="9" height="152" fill="#8b8b8b"/><path d="M0 60 Q120 72 400 58 M0 70 Q140 84 400 68" stroke="#555" stroke-width="1.5" fill="none"/>
     <rect x="14" y="82" width="41" height="18" rx="3" fill="#2f7fd8"/><text x="34.5" y="95" font-size="10" fill="#fff" text-anchor="middle">通学路</text>`,

  park: (id) => SKY(id) +
    `<ellipse cx="80" cy="190" rx="170" ry="52" fill="#a8d494"/><ellipse cx="330" cy="196" rx="170" ry="56" fill="#93c47f"/>` +
    tree(40, 130, 1.1) + tree(370, 128, 1.2, '#4e944e') + tree(300, 140, .8, '#66ad60') +
    `<rect x="0" y="186" width="400" height="64" fill="#86bb70"/><ellipse cx="210" cy="238" rx="190" ry="26" fill="#e3d2a8"/>
     <g><rect x="290" y="186" width="80" height="8" rx="3" fill="#9b6b3f"/><rect x="290" y="172" width="80" height="6" rx="3" fill="#9b6b3f"/><rect x="296" y="194" width="5" height="16" fill="#555"/><rect x="359" y="194" width="5" height="16" fill="#555"/></g>
     <g><path d="M70 186 L100 120 L112 120 L82 186 Z" fill="#e8574a"/><rect x="106" y="120" width="6" height="66" fill="#999"/></g>`,

  station: (id) => SKY(id) +
    `<rect x="16" y="56" width="368" height="140" fill="#e9e2d4"/><path d="M6 60 L394 60 L380 40 L20 40 Z" fill="#6d7f99"/>
     <rect x="150" y="66" width="100" height="26" rx="4" fill="#244a86"/><text x="200" y="85" font-size="16" fill="#fff" text-anchor="middle" font-weight="700">えき</text>
     <circle cx="300" cy="80" r="14" fill="#fff" stroke="#555" stroke-width="3"/><path d="M300 80 L300 71 M300 80 L307 84" stroke="#333" stroke-width="2"/>
     <rect x="40" y="100" width="60" height="96" fill="#9fc3d9"/><rect x="300" y="100" width="60" height="96" fill="#9fc3d9"/>
     <rect x="0" y="194" width="400" height="56" fill="#cfc9bf"/>${tiles(194)}
     <g fill="#7b8599" opacity=".55"><circle cx="60" cy="140" r="8"/><rect x="52" y="148" width="16" height="44" rx="6"/><circle cx="340" cy="138" r="8"/><rect x="332" y="146" width="16" height="46" rx="6"/><circle cx="366" cy="146" r="7"/><rect x="359" y="153" width="14" height="40" rx="6"/></g>`,

  road: (id) => SKY(id, '#f4a978', '#fde2c4') +
    `<circle cx="340" cy="70" r="26" fill="#ffd08a" opacity=".9"/>` +
    house(10, 90, 70, '#f0e3cf', '#8a4b3b') + house(130, 80, 60, '#e4ecef', '#44617a') + house(250, 110, 80, '#f3e9e2', '#6d5a48') +
    `<rect x="0" y="150" width="400" height="42" fill="#d9d2c6"/><g stroke="#bdb5a8">${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 40} 150 L${i * 40} 192"/>`).join('')}<path d="M0 171 L400 171"/></g>
     <rect x="0" y="192" width="400" height="58" fill="#6d6f75"/><rect x="0" y="198" width="400" height="3" fill="#f2f2f2"/>
     <rect width="400" height="250" fill="#ff9a4a" opacity=".08"/>`,

  store: () =>
    `<rect width="400" height="250" fill="#f5f4ee"/><rect x="0" y="0" width="400" height="18" fill="#2f9e6e"/>
     ${[0, 1, 2].map((r) => `<rect x="10" y="${40 + r * 46}" width="380" height="6" fill="#b9bdc4"/>` +
        Array.from({ length: 14 }, (_, i) => `<rect x="${16 + i * 27}" y="${18 + r * 46}" width="20" height="22" rx="2" fill="${['#e8574a', '#f0b429', '#4caf50', '#2f7fd8', '#9c27b0'][(i + r) % 5]}" opacity=".85"/>`).join('')).join('')}
     <rect x="0" y="176" width="400" height="74" fill="#dcd8cc"/>`,

  hall: () =>
    `<rect width="400" height="250" fill="#efe6d8"/><rect x="0" y="170" width="400" height="80" fill="#c9a77f"/><rect x="0" y="166" width="400" height="6" fill="#a4815a"/>
     <rect x="8" y="10" width="72" height="240" fill="#8a6a4a"/><rect x="16" y="18" width="56" height="232" fill="#a98359"/><circle cx="62" cy="140" r="5" fill="#e0c07a"/>
     <rect x="320" y="120" width="70" height="60" fill="#b38b62"/><rect x="326" y="126" width="58" height="22" fill="#c69d72"/>`,

  room: () =>
    `<rect width="400" height="250" fill="#f3ede4"/><rect x="0" y="190" width="400" height="60" fill="#c8a97e"/>
     <rect x="24" y="30" width="96" height="90" fill="#bfe0f5" stroke="#fff" stroke-width="6"/><path d="M24 30 Q40 80 30 120 L24 120 Z M120 30 Q104 80 114 120 L120 120 Z" fill="#f2c6a0"/>
     <rect x="286" y="130" width="104" height="60" rx="10" fill="#7c93b5"/><rect x="280" y="112" width="116" height="30" rx="10" fill="#8ea6c6"/>`,
};

/* ---------- 前景・特別レイアウト ---------- */
function carFront(id, color = '#c9ced6') {
  const d = shade(color, -25);
  return `<defs><linearGradient id="car${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, 10)}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
    <path d="M112 62 Q128 32 176 30 L286 30 Q330 32 346 64 L336 66 Q320 44 286 42 L176 42 Q138 44 124 66 Z" fill="url(#car${id})"/>
    <path d="M112 62 L124 66 L126 142 L106 142 Z" fill="${d}"/><path d="M336 66 L346 64 L362 142 L340 142 Z" fill="${d}"/>
    <path d="M124 66 Q138 44 176 42 L286 42 Q320 44 336 66 L340 142 L126 142 Z" fill="#a9cfe8" opacity=".16"/>
    <path d="M150 50 L132 132" stroke="#fff" stroke-width="6" opacity=".16"/>
    <path d="M22 236 L22 172 Q24 146 70 142 L372 142 Q394 150 396 180 L396 236 Z" fill="url(#car${id})"/>
    <path d="M126 142 L126 230 M240 142 L240 230" stroke="${d}" stroke-width="2"/><rect x="200" y="158" width="24" height="6" rx="3" fill="${d}"/>
    <path d="M98 128 L84 122 Q76 122 76 132 L80 140 L100 140 Z" fill="${d}"/>
    <rect x="22" y="180" width="18" height="10" rx="2" fill="#ffd27a"/>
    <circle cx="80" cy="236" r="28" fill="#222"/><circle cx="80" cy="236" r="12" fill="#999"/>
    <circle cx="330" cy="236" r="28" fill="#222"/><circle cx="330" cy="236" r="12" fill="#999"/>`;
}
function intercomBack(id) {
  return `<defs><clipPath id="clip${id}"><rect x="120" y="34" width="160" height="124" rx="4"/></clipPath>
    <linearGradient id="scr${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d9a9a"/><stop offset="1" stop-color="#3b5354"/></linearGradient></defs>
    <rect x="104" y="20" width="192" height="210" rx="14" fill="#f7f7f5" stroke="#c9c9c4" stroke-width="2"/>
    <rect x="120" y="34" width="160" height="124" rx="4" fill="url(#scr${id})"/>`;
}
function intercomFront(id) {
  let lines = '';
  for (let y = 36; y < 158; y += 4) lines += `<rect x="120" y="${y}" width="160" height="1" fill="#000" opacity=".08"/>`;
  return `<g clip-path="url(#clip${id})"><rect x="120" y="34" width="160" height="124" fill="#9fe0b0" opacity=".12"/>${lines}</g>
    <text x="126" y="48" font-size="9" fill="#e6ffe9">● げんかん</text>
    <circle cx="164" cy="190" r="15" fill="#2bb673"/><text x="164" y="218" font-size="9" fill="#555" text-anchor="middle">通話</text>
    <circle cx="236" cy="190" r="15" fill="#b0b4bb"/><text x="236" y="218" font-size="9" fill="#555" text-anchor="middle">モニター</text>`;
}
function callPhone(sc, id) {
  return `<defs><linearGradient id="ph${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d3e75"/><stop offset="1" stop-color="#121a3a"/></linearGradient></defs>
    <g stroke="#ffcf3f" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"><path d="M128 70 Q114 100 128 130"/><path d="M114 60 Q94 100 114 140"/><path d="M272 70 Q286 100 272 130"/><path d="M286 60 Q306 100 286 140"/></g>
    <rect x="148" y="14" width="104" height="222" rx="16" fill="#1a1a1a"/>
    <rect x="155" y="28" width="90" height="194" rx="8" fill="url(#ph${id})"/>
    <text x="200" y="58" font-size="11" fill="#cfd8ff" text-anchor="middle">着信中…</text>
    <circle cx="200" cy="108" r="26" fill="#5b6690"/><text x="200" y="119" font-size="30" fill="#fff" text-anchor="middle" font-weight="700">?</text>
    <text x="200" y="160" font-size="12" fill="#fff" text-anchor="middle">${esc(sc.caller || '非通知')}</text>
    <circle cx="176" cy="196" r="12" fill="#e0404f"/><circle cx="224" cy="196" r="12" fill="#2bb673"/>`;
}
function witnessFront(id) {
  const man = AVATARS.capMan;
  return `<path d="M166 204 Q210 192 262 188" stroke="${man.top}" stroke-width="16" stroke-linecap="round" fill="none"/><circle cx="266" cy="188" r="9" fill="${man.skin}"/>
    <g transform="translate(236 110) scale(.52)">${avatarInner(AVATARS.child, id + 'c')}</g>
    <g stroke="#e0404f" stroke-width="4" stroke-linecap="round"><path d="M336 96 L344 76 M350 102 L366 90 M352 116 L372 114"/></g>`;
}
function snsHTML(sc, steps, idx) {
  const msgs = steps.slice(0, idx + 1).filter((s) => s.npc);
  return `<div class="phone-ui"><div class="phone-frame">
    <div class="phone-bar"><div class="ic">${avatarSVG(sc.avatar, '40 40 120 120')}</div>${esc(sc.snsName || '')}</div>
    <div class="phone-msgs">${msgs.map((s, i) => `<div class="bubble ${i < msgs.length - 1 ? 'old' : ''}">${esc(s.npc)}</div>`).join('')}</div>
  </div></div>`;
}

/* =========================================================
   4. クエスト（シナリオ）
   ========================================================= */
const G = (t, tags, fb) => ({ t, r: 'good', tags, fb });
const B = (t, fb) => ({ t, r: 'bad', fb });
const O = (t, fb) => ({ t, r: 'out', fb });

const SCENARIOS = [
  /* ---------- 町の中 ---------- */
  {
    id: 'town1', cat: 'town', type: 'obvious', title: '公園の帰り道', bg: 'park', avatar: 'hood', who: 'フードの男の人',
    intro: '学校の帰り道。公園の横を一人で歩いていると、フードをかぶった男の人が近づいてきた。',
    steps: [
      { npc: 'ねえ、ちょっとこっちに来て。いいもの見せてあげるよ。',
        choices: [
          G('「いやです！」とはっきり言って、すぐにその場をはなれる', ['o', 'su'], 'はっきり断って、すぐにはなれたね。知らない人の「いいもの」に近づく必要はないよ。'),
          B('何を見せてくれるのか、近づいて聞いてみる', '近づくと、うでをつかまれるかもしれないよ。知らない人とは、手がとどかない距離（2メートル以上）をとろう。'),
          B('こわくて、だまってその場に立っている', 'こわくて動けなくなるのは自然なこと。でも立ち止まると相手は近づいてくるよ。「いやです」と言って、はなれよう。'),
        ] },
      { narr: '男の人が早足で追いかけてきた！', npc: 'おい、待てよ。すぐ終わるからさ。',
        choices: [
          G('「たすけて！」と大声を出しながら、人のいるコンビニへ走る', ['o', 'su'], '大声は、まわりの大人に気づいてもらう合図。人のいる明るい場所へ逃げたのも正解！'),
          B('人のいない細い道にかくれる', '人のいない所は、かえってあぶないよ。お店や「こども110番の家」など、人のいる所へ逃げよう。'),
          B('立ち止まって「なんですか？」と話を聞く', '話を聞くために止まると、つかまる危険が高くなるよ。止まらずに逃げよう。'),
        ] },
      { narr: 'コンビニに逃げこんだ。男の人はどこかへ行ったようだ。このあと、どうする？', avatar: 'clerk', bg: 'store', who: 'コンビニの店員さん', safe: true,
        npc: 'どうしたの？ だいじょうぶ？',
        choices: [
          G('店員さんに何があったか話して、家の人や学校に連絡してもらう', ['shi'], 'すぐに大人に知らせることで、あなたも、ほかの子も守られるよ。'),
          B('もう大丈夫だと思って、だれにも言わずに帰る', '帰り道にまた会うかもしれないよ。何もなかったように見えても、必ず大人に知らせよう。'),
        ] },
    ],
  },
  {
    id: 'town2', cat: 'town', type: 'kind', title: '迷子の子犬', bg: 'street', avatar: 'dogLady', who: 'やさしそうな女の人',
    intro: '休みの日、近所の道を歩いていると、やさしそうな女の人が困った顔で話しかけてきた。',
    steps: [
      { npc: 'うちの子犬が迷子になっちゃったの。あっちの公園の裏、いっしょにさがしてくれない？',
        choices: [
          G('「大人の人にたのんでください」と言って、その場をはなれる', ['ika', 'su'], '困っている大人は、ふつう大人に助けを求めるもの。子どもに「いっしょに来て」と言うのはあやしいサインだよ。'),
          O('かわいそうなので、いっしょについて行く', 'やさしい気持ちを利用して連れて行こうとする人もいるよ。' + OUT_GO),
          B('犬の写真を見せてもらうために、近づく', '近づくと、手をつかまれるかもしれないよ。距離をとったまま断ろう。'),
        ] },
      { narr: '女の人が、あなたの手をつかもうとしてきた！', npc: 'おねがい、すぐそこだから！ お礼にお菓子もあげるよ。',
        choices: [
          G('手をふりはらって防犯ブザーを鳴らし、人の多い方へ逃げる', ['o', 'su'], '防犯ブザーは大声のかわりになるよ。ふだんからすぐ鳴らせる場所につけておこう。'),
          O('お菓子がもらえるなら…と手をつなぐ', 'お菓子やゲームで気を引くのは、よくある手口だよ。' + OUT_GO),
          B('「ちょっとだけなら」と答える', '「ちょっとだけ」でも、ついて行ったら連れ去られるかもしれないよ。はっきり断ろう。'),
        ] },
      { npc: 'ねえ、ところであなたのお名前は？ どこの学校？',
        choices: [
          G('何も答えずにはなれ、家に帰って家の人に話す', ['info', 'shi'], '名前も学校も答えなくていいんだよ。そして家の人に知らせたね。'),
          O('名前と学校名を答える', OUT_INFO),
          O('「〇〇中学校の近くです」とヒントだけ言う', 'ヒントだけでも、学校や家の場所が分かってしまうよ。' + OUT_INFO),
        ] },
    ],
  },
  {
    id: 'town3', cat: 'town', type: 'normal', title: '駅前のアンケート', bg: 'station', avatar: 'survey', who: '名札の男の人',
    intro: '駅前を歩いていると、名札をつけた男の人がボードを持って声をかけてきた。',
    steps: [
      { npc: 'こんにちは！ かんたんなアンケートに答えてくれたら、ゲームのカードをプレゼントするよ。ここに名前と住所を書いてね。',
        choices: [
          G('「書きません」と断って、立ち止まらずに進む', ['o', 'info', 'su'], 'プレゼントより、自分の安全がいちばん。名前や住所は書かなくていいよ。'),
          O('プレゼントがほしいので、名前と住所を書く', OUT_INFO),
          O('名前だけなら大丈夫だと思い、名前だけ書く', '名前だけでも大切な個人情報。名前が分かると「〇〇ちゃん」と呼んで近づきやすくなるよ。'),
        ] },
      { narr: '男の人がボードを持ったまま、横についてきた。', npc: 'じゃあ、電話番号だけでいいよ！ あとでカードを送るからさ。',
        choices: [
          G('「いりません！」ともう一度はっきり断り、駅員さんのいる所へ行く', ['o', 'su'], '何度言われても、答えは「いりません」。近くの大人のいる所へ行ったのもいいね。'),
          O('電話番号だけ教える', '電話番号が分かると、何度も電話がかかってきたり、住所を調べられたりするよ。' + OUT_INFO),
          B('しつこいので、しかたなく少し話を聞く', '話を聞くほど、断りにくくなるよ。はっきり断って、はなれよう。'),
        ] },
      { narr: '駅員さんのいる所まで来た。男の人は、ほかの人に声をかけ始めた。このあと、どうする？',
        choices: [
          G('駅員さんや、家に帰ってから家の人に、このことを話す', ['shi'], '知らせることで、ほかの人がねらわれるのを防げるよ。'),
          B('自分は何も教えなかったから、だれにも言わなくていい', '自分が無事でも、ほかの子がねらわれるかもしれないよ。大人に知らせよう。'),
        ] },
    ],
  },

  /* ---------- 車 ---------- */
  {
    id: 'car1', cat: 'car', type: 'normal', title: '車からの道案内', layout: 'car', bg: 'road', avatar: 'carMan', carColor: '#d8dde4', who: '車の男の人',
    intro: '夕方、家の近くの道を歩いていると、車が横に止まり、窓が開いた。',
    steps: [
      { npc: 'すみません、〇〇駅に行きたいんだけど道が分からなくて。車に乗って案内してくれない？',
        choices: [
          G('車に近づかず、「分かりません」と言ってその場をはなれる', ['no', 'su'], '車の人とは話さなくていいよ。車のドアから2メートル以上はなれよう。'),
          B('地図を見るために、車の窓に近づく', '窓に近づくと、車の中に引っぱりこまれる危険があるよ。'),
          O('困っているみたいなので、車に乗って案内する', OUT_GO),
        ] },
      { narr: '車がゆっくりと、あなたの横についてくる。', npc: 'お礼にお金あげるよ。ちょっとだけ乗ってよ。',
        adv: [{ tag: 'su', re: /(反対|はんたい|逆|ぎゃく)/ }],
        choices: [
          G('車が進む向きと反対の方向へ走って逃げる', ['su'], '車は急に向きを変えられないから、反対方向へ逃げるのが効果的！'),
          B('車と同じ方向に、そのまま歩き続ける', '同じ方向に歩くと、車はずっとついてこられるよ。'),
          B('立ち止まって、お金を受け取る', 'お金を受け取るために近づくと、引っぱりこまれる危険があるよ。'),
        ] },
      { narr: 'なんとか家に着いた。車はどこかへ行った。このあと、どうする？',
        choices: [
          G('家の人に、車の色・形・ナンバーなど覚えていることを話し、警察に知らせてもらう', ['shi'], '車の特ちょうは、警察が調べるための大切な手がかりになるよ。'),
          B('こわかったけど、忘れることにする', 'こわかったことこそ、大人に話そう。あなたの話が、ほかの子を守るよ。'),
        ] },
    ],
  },
  {
    id: 'car2', cat: 'car', type: 'kind', title: '「お母さんが事故に…」', layout: 'car', bg: 'road', avatar: 'carWoman', carColor: '#f2f2f2', who: '車の女の人',
    intro: '下校中、一台の車が止まって、女の人があわてた様子で声をかけてきた。',
    steps: [
      { npc: 'たいへん！ あなたのお母さんが事故にあって、病院に運ばれたの。私が連れて行くから、すぐ乗って！',
        choices: [
          G('「家の人に確認します」と言って乗らず、その場をはなれる', ['no', 'shi'], '家族の急な知らせでも、知らない人の車には絶対に乗らない。本当かどうかは家の人や学校に確認しよう。'),
          O('あわてて車に乗る', 'あわてさせて考える時間をなくすのは、よくある手口だよ。' + OUT_GO),
          O('「お母さんの名前は〇〇ですか？」と名前を言って確かめる', 'こちらから名前を言うと、相手に情報をあげることになるよ。' + OUT_INFO),
        ] },
      { narr: '女の人が車のドアを開けて、こちらに出てきた！', npc: '時間がないのよ！ お母さんがあなたを呼んでるの！',
        choices: [
          G('大声で「たすけて！」とさけび、近くのお店やこども110番の家にかけこむ', ['o', 'su'], '大声を出して、人のいる所へ逃げたね。「こども110番の家」の場所を、ふだんから確かめておこう。'),
          O('泣きながら車に乗る', OUT_GO),
          O('家の電話番号を教えて、確認してもらう', OUT_INFO),
        ] },
      { narr: '近くのお店にかけこんだ。お店の人が話を聞いてくれている。このあと、どうする？',
        choices: [
          G('お店の人に電話をかしてもらい、家の人に確認する。警察にも知らせてもらう', ['shi'], '家の人に確認すれば、本当かうそかすぐに分かるよ。'),
          B('一人で病院までさがしに行く', '一人で動くと、また声をかけられるかもしれないよ。大人といっしょに確認しよう。'),
        ] },
    ],
  },

  /* ---------- 闇バイト ---------- */
  {
    id: 'yami1', cat: 'yami', type: 'normal', title: 'SNSの「高収入バイト」', layout: 'sns', avatar: 'yamiDM', snsName: '【即日】高収入ワーク', who: 'SNSのメッセージ',
    intro: '夜、スマホでSNSを見ていると、知らないアカウントからメッセージが届いた。',
    steps: [
      { npc: '【高収入】荷物を受け取って運ぶだけ！ 1日5万円！ 中学生もOK。くわしくはDMで👍',
        choices: [
          G('返信しないでブロックし、画面を家の人や先生に見せて相談する', ['call', 'shi'], '「かんたん・高収入」はうそのサイン。これは「闇バイト」のさそいだよ。返信せず、大人に相談しよう。'),
          B('「くわしく教えてください」と返信する', '一度返信すると、相手はもっとしつこく連絡してくるよ。'),
          O('「やりたいです」と応募する', '闇バイトは犯罪。一度関わると、個人情報でおどされてぬけられなくなるよ。'),
        ] },
      { npc: '既読ついてるよね？ みんなやってるよ。今日中に返事くれたら、すぐ始められるよ。',
        choices: [
          G('返信しないで画面を保存し、すぐに大人に見せる', ['call', 'shi'], '画面を保存しておくと、警察や大人が対応するときに役立つよ。'),
          O('「少しだけならやってみたい」と返信する', '「少しだけ」でも犯罪の手伝いになってしまうよ。'),
          O('言われたとおり、学生証の写真と住所を送る', '身分証や住所をにぎられると、「家に行くぞ」とおどされてぬけられなくなるよ。' + OUT_INFO),
        ] },
      { narr: '相手がおどしてきた…。', npc: '無視するなら、きみの学校にバラすよ？ 困るのはきみだよ。',
        choices: [
          G('こわくても返信しない。家の人・先生・警察にすぐ相談する', ['call', 'shi'], 'おどしは相手の作戦。一人でなやまず相談すれば、大人と警察が守ってくれるよ。（警察の相談電話「#9110」もあるよ）'),
          O('おどされたので、言うことを聞く', 'おどしに従うと、どんどん悪いことをさせられてしまうよ。'),
          B('だれにも言えず、一人でなやむ', '一人でかかえこまないで。相談することは、はずかしいことじゃないよ。'),
        ] },
    ],
  },
  {
    id: 'yami2', cat: 'yami', type: 'kind', title: '駅前のやさしいお兄さん', bg: 'station', avatar: 'yamiStreet', who: 'やさしそうなお兄さん',
    intro: '駅前で、おしゃれでやさしそうなお兄さんが声をかけてきた。',
    steps: [
      { npc: 'ねえ、スマホがあればできる、かんたんなお仕事があるんだ。そこのカフェで話だけでも聞かない？ おごるよ。',
        choices: [
          G('「けっこうです」と断って、すぐにはなれる', ['o', 'su'], '「かんたん」「おごるよ」は、あやしいさそいのサイン。はっきり断ったね。'),
          O('おごってもらえるなら、とカフェについて行く', '二人きりで話すと、断れない空気を作られてしまうよ。' + OUT_GO),
          B('「どんな仕事ですか？」と立ち止まって話を聞く', '話を聞くと、断りにくくなるよ。立ち止まらないのがコツ。'),
        ] },
      { npc: '話を聞くだけでいいからさ。じゃあLINEだけ交換しよ？',
        choices: [
          G('「交換しません」と断り、家の人や先生に話す', ['info', 'shi'], '連絡先は、知らない人に教えないのが鉄則。そして大人に話したね。'),
          O('LINEのIDを教える', '連絡先を知られると、しつこく連絡されたり、どんどん断れなくなったりするよ。' + OUT_INFO),
          B('「あとで連絡します」と言って、連絡先の紙をもらう', '連絡するつもりがなくても、つながりを作るのはあぶないよ。受け取らずに断ろう。'),
        ] },
    ],
  },

  /* ---------- 電話 ---------- */
  {
    id: 'phone1', cat: 'phone', type: 'normal', title: '市役所を名乗る電話', layout: 'call', bg: 'room', avatar: 'cityCall', caller: '非通知', who: '電話の相手',
    intro: '留守番中、家の電話が鳴った。画面には「非通知」と出ている。',
    steps: [
      { npc: 'もしもし、市役所の者です。お金が戻ってくるお知らせです。お父さんかお母さんはいますか？ きみのお名前は？',
        adv: [{ tag: 'call', re: /(かけなお|掛けなお|かけ直|折り返|おりかえ)/ }],
        choices: [
          G('「今、電話に出られません。あとで家の人からかけます」と言って切る', ['call', 'info'], '家にだれがいるか、自分の名前は言わずに、すぐ切ったね。'),
          O('「今、家にだれもいません」と答える', '家に子どもだけだと知られると、家に来られる危険があるよ。' + OUT_INFO),
          O('自分の名前を答える', OUT_INFO),
        ] },
      { narr: 'しばらくして、また電話が鳴った。', npc: 'さっきの市役所の者だけど、急いでるんだ。住所だけ確認させてくれる？',
        choices: [
          G('何も答えずに電話を切り、帰ってきた家の人に知らせる', ['call', 'shi'], '本物の市役所なら、子どもに住所を聞いたりしないよ。'),
          O('住所を答える', OUT_INFO),
          B('「本当に市役所ですか？」と、長く話を続ける', '話を続けるほど、情報を取られやすくなるよ。すぐに切ってOK！'),
        ] },
    ],
  },
  {
    id: 'phone2', cat: 'phone', type: 'kind', title: '先生を名乗る電話', layout: 'call', bg: 'room', avatar: 'teacherCall', caller: '090-XXXX-XXXX', who: '電話の相手',
    intro: '家族が出かけている間、スマホに知らない番号から電話がかかってきた。',
    steps: [
      { npc: 'もしもし、〇〇学校の先生です。緊急連絡の確認で、おうちの住所と電話番号を教えてくれるかな？',
        adv: [{ tag: 'call', re: /(かけなお|かけ直|折り返|おりかえ)/ }],
        choices: [
          G('「家の人から学校に電話してもらいます」と言って切る', ['call', 'shi'], '本物かどうか分からないときは、家の人から学校にかけてもらえば安心だよ。'),
          O('先生なら大丈夫だと思って、住所と電話番号を教える', '「先生」「市役所」「警察」と名乗っても、電話で個人情報は言わないよ。' + OUT_INFO),
          B('だまって、ずっと話を聞いている', '聞いているうちに答えてしまうかもしれないよ。すぐに切ろう。'),
        ] },
      { npc: '今すぐじゃないと困るんだよ。先生の言うことが聞けないのかな？',
        choices: [
          G('電話を切り、家の人に話す。家の人から学校に確認してもらう', ['call', 'shi'], '本物の先生なら、家の人にきちんと連絡してくれるよ。おこられそうでも、切っていいんだよ。'),
          O('しかられるのがこわいので、住所を言う', OUT_INFO),
        ] },
    ],
  },

  /* ---------- 留守番 ---------- */
  {
    id: 'rusu1', cat: 'rusu', type: 'normal', title: '宅配便です', layout: 'intercom', bg: 'hall', avatar: 'delivery', who: 'インターホンの人',
    intro: '一人で留守番をしていると、インターホンが鳴った。モニターに制服の人がうつっている。',
    steps: [
      { npc: 'お届け物です。ハンコをお願いします。ドアを開けてもらえますか？',
        choices: [
          G('ドアは開けず、「今、出られません」と答える（または出ない）', ['door'], '留守番中は、だれが来てもドアを開けないのが約束。'),
          O('ドアを開ける', OUT_GO),
          O('「家に子どもしかいません」と答える', '子どもだけだと知られると、ねらわれる危険があるよ。' + OUT_INFO),
        ] },
      { npc: '冷凍の荷物なので、今受け取ってもらわないと困るんですよ。開けてください。',
        choices: [
          G('ドアを開けずに、家の人に電話して聞く', ['door', 'shi'], '本物の宅配便なら「不在票」を入れて、あとで届けてくれるよ。'),
          B('ドアチェーンをかけたまま、少しだけ開ける', 'チェーンは道具で外されることもあるよ。開けないのがいちばん。'),
          O('しかたなくドアを開ける', OUT_GO),
        ] },
      { narr: 'しばらくして、ドアノブを回す音がした！', npc: '（ガチャ…ガチャ…）',
        choices: [
          G('ドアからはなれ、家の人に電話。つながらなければ110番する', ['shi', 'door'], 'こわいと感じたら、110番していいんだよ。'),
          O('様子を見るため、ドアを開ける', OUT_GO),
          B('こわいので、音がやむまでじっとしている', 'じっとするのは悪くないけど、必ず連絡しよう。こういうときは110番してOK！'),
        ] },
    ],
  },
  {
    id: 'rusu2', cat: 'rusu', type: 'kind', title: '近所の人を名乗るおじさん', layout: 'intercom', bg: 'hall', avatar: 'neighbor', who: 'インターホンの人',
    intro: '留守番中、インターホンが鳴った。やさしそうなおじさんが笑顔でうつっている。',
    steps: [
      { npc: 'こんにちは、近所の者だよ。お母さんにたのまれて、忘れ物を取りに来たんだ。ちょっと上がらせてくれる？',
        choices: [
          G('「ドアは開けられません」と言い、お母さんに電話で確認する', ['door', 'shi'], '「家の人にたのまれた」と言われても、開けずに確認。これで安心だね。'),
          O('近所の人なら大丈夫だと思い、ドアを開ける', OUT_GO),
          B('インターホンで長く話して、どんな忘れ物か聞く', '話が長くなるほど、家のことを知られてしまうよ。短く断ろう。'),
        ] },
      { npc: 'そっか。じゃあ、お母さんは何時ごろ帰ってくるのかな？',
        choices: [
          G('「分かりません」とだけ答えてインターホンを切り、家の人に知らせる', ['info', 'shi'], '帰る時間は教えなくていいよ。すぐ家の人に知らせたね。'),
          O('「6時ごろに帰ってきます」と答える', '帰る時間を教えると、一人でいる時間が分かってしまうよ。' + OUT_INFO),
          O('お母さんの携帯の番号を教えてあげる', OUT_INFO),
        ] },
    ],
  },

  /* ---------- 勧誘 ---------- */
  {
    id: 'kanyu1', cat: 'kanyu', type: 'kind', title: '「心が軽くなるお話会」', bg: 'street', avatar: 'kanyuWoman', who: '笑顔の女の人',
    intro: '学校の帰り、笑顔の女の人がパンフレットを持って話しかけてきた。',
    steps: [
      { npc: 'こんにちは。何か悩みはない？ 心が軽くなるお話会があるの。今からいっしょに行かない？',
        choices: [
          G('「けっこうです」とはっきり断り、立ち止まらずにはなれる', ['o', 'ika', 'su'], '何を信じるかは自由。でも、知らない人に「今からいっしょに」とさそわれたら、断ってOKだよ。'),
          O('やさしそうなので、ついて行く', '行った先で、帰りにくくされることもあるよ。' + OUT_GO),
          B('断りにくくて、ずっと話を聞いている', '断るのは失礼じゃないよ。「けっこうです」と言ってはなれよう。'),
        ] },
      { npc: 'じゃあ、連絡先だけ教えて？ 今度お菓子を送ってあげるね。',
        choices: [
          G('何も教えずにはなれ、家の人に話す', ['info', 'shi'], '連絡先は教えなくていい。家の人に話しておけば、また会ったときも安心だよ。'),
          O('LINEのIDを教える', OUT_INFO),
          O('パンフレットに名前と住所を書く', OUT_INFO),
        ] },
    ],
  },
  {
    id: 'kanyu2', cat: 'kanyu', type: 'normal', title: '家に来た勧誘', layout: 'intercom', bg: 'hall', avatar: 'kanyuDoor', who: 'インターホンの人',
    intro: '休みの日、家族が出かけている時にインターホンが鳴った。スーツの男の人がうつっている。',
    steps: [
      { npc: 'こんにちは。みなさんの幸せのための大切なお話をお届けしています。おうちの方はいらっしゃいますか？',
        choices: [
          G('「今、出られません」と言ってインターホンを切る', ['door', 'info'], '家族がいないことは言わずに、短く断れたね。'),
          O('「今、家族はいません」と答える', OUT_INFO),
          B('えらい人かと思い、話を長く聞く', '話を長く聞く必要はないよ。短く断ろう。'),
        ] },
      { npc: 'では、この本だけでも受け取ってください。ドアを少し開けてもらえますか？',
        choices: [
          G('ドアは開けず、「いりません」と断る。あとで家の人に話す', ['door', 'o', 'shi'], '物を受け取るためでも、ドアは開けない。はっきり断れたね。'),
          O('本を受け取るため、ドアを開ける', OUT_GO),
        ] },
    ],
  },

  /* ---------- 困っている人を見つけたら ---------- */
  {
    id: 'help1', cat: 'help', type: 'obvious', title: '連れて行かれそうな子', layout: 'witness', bg: 'park', avatar: 'capMan', who: '小さな子',
    intro: '公園で、小さな子が知らない男の人にうでを引っぱられて泣いている！',
    steps: [
      { npc: 'いやだ！ はなして！',
        choices: [
          G('近くの大人（お店の人など）にすぐ知らせる。または110番に電話する', ['help'], '見つけたときは、自分だけで何とかしようとせず、大人や警察の力を借りよう。'),
          B('一人で止めに入る', 'あなたもまきこまれて、けがをするかもしれないよ。まず大人・110番！'),
          B('こわいので、見なかったことにする', 'だれかが知らせないと、その子は助からないかもしれない。「だれか来て！」と大声を出すだけでも力になるよ。'),
        ] },
      { narr: 'スマホで110番に電話した。', who: '警察', safe: true, npc: 'はい、110番です。事件ですか、事故ですか？',
        adv: [{ tag: 'help', re: /(事件|じけん|公園|こうえん|場所|ばしょ|服|ふく|男|おとこ|子ども|こども|特ちょう|特徴|とくちょう)/ }],
        choices: [
          G('「事件です。〇〇公園で、小さい子が黒い服の男の人に連れて行かれそうです」と伝える', ['help'], '「何があったか」「どこで」「どんな人か」を落ち着いて伝えられたね！'),
          B('「たいへんです！ たいへんです！」とだけ言う', 'あわてても大丈夫。「どこで」「何があった」「どんな人」をゆっくり話そう。警察の人が質問してくれるよ。'),
          B('こわくなって、電話を切ってしまう', 'とちゅうで切ってしまっても、もう一度かけ直せばいいよ。警察の人は話を聞いてくれるよ。'),
        ] },
      { narr: '男の人は子どもの手をはなし、走って行った。このあと、どうする？',
        adv: [{ tag: 'help', re: /(覚え|おぼえ|服|ふく|方向|ほうこう|特ちょう|特徴|とくちょう)/ }],
        choices: [
          G('男の人の服や逃げた方向を覚えておき、警察や大人に伝える', ['help'], 'あなたの見たことが、犯人をつかまえる手がかりになるよ。'),
          B('あとを追いかけて、どこへ行くか確かめる', '追いかけるのはとてもあぶないよ。見たことを伝えるだけで十分。'),
        ] },
    ],
  },
  {
    id: 'help2', cat: 'help', type: 'friend', title: '友だちがさそわれている', layout: 'sns', avatar: 'friend', snsName: '友だち', who: '友だちのメッセージ',
    intro: '友だちから、こんなメッセージが来た。',
    steps: [
      { npc: 'SNSで、荷物運ぶだけで1日3万円のバイト見つけた！ 楽にかせげるって。おまえもいっしょにやる？',
        choices: [
          G('「それ、闇バイトかも。あぶないから、いっしょに先生に相談しよう」と返す', ['help'], '友だちを止めて、大人につなげようとしたね。'),
          O('お金がほしいので、いっしょにやる', '闇バイトは犯罪。友だちといっしょでも、ぬけられなくなるよ。'),
          B('自分はやらないけど、友だちには何も言わない', '友だちがあぶない目にあうかもしれないよ。止めることも、大人に知らせることも大切。'),
        ] },
      { npc: 'えー、大丈夫だって。先生には言わないでよ！ ひみつな！',
        choices: [
          G('友だちを守るために、信頼できる大人（先生・家の人）に相談する', ['help'], '「ひみつ」でも、犯罪や命にかかわることは大人に話していいんだよ。それが本当の友だち。'),
          B('約束したので、だれにも言わない', '友だちが犯罪にまきこまれてからでは、おそいよ。大人に相談しよう。'),
        ] },
    ],
  },
];
const SC_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

/* =========================================================
   5. 上級：自分のことばの判定（キーワード）
   ========================================================= */
// 「言わない・教えない」などが後ろにあれば、個人情報を話したことにはしない
const NEG = '(?![^。！!？?]{0,10}?(教えな|おしえな|教えませ|おしえませ|言わな|いわな|言いませ|いいませ|答えな|こたえな|答えませ|こたえませ|書かな|かかな|書きませ|かきませ|送らな|おくらな|送りませ|おくりませ|交換しな|こうかんしな|交換しませ|こうかんしませ|ひみつ|秘密|ないしょ|内緒|だめ|ダメ|いけな))';
const OUT_RULES = [
  { re: new RegExp('(名前|なまえ)は' + NEG), why: '名前を教えてしまっている' },
  { re: new RegExp('(住所|じゅうしょ)は' + NEG), why: '住所を教えてしまっている' },
  { re: /([0-9]+|[一二三四五六七八九十]+)(丁目|ちょうめ|番地|ばんち)/, why: '住所を書いてしまっている' },
  { re: /[0-9]{2,4}-?[0-9]{2,4}-?[0-9]{3,4}/, why: '電話番号のような数字を書いている' },
  { re: /(中学校|小学校|支援学校|高校|中学|小学)(です|だよ|に通|にかよ|の生徒|の[1-6一二三四五六]年)|[1-6一二三四五六]年生(です|だよ)/, why: '学校や学年を教えてしまっている' },
  { re: new RegExp('(親|おや|母|はは|父|ちち|お母さん|おかあさん|お父さん|おとうさん|ママ|まま|パパ|ぱぱ|家の人|いえのひと|家族|かぞく|だれも|誰も)(は|が|も)?(今|いま)?(いない|いません|留守|るす|出かけて|でかけて|仕事|しごと)' + NEG), why: '家に子どもしかいないと教えてしまっている' },
  { re: /(ひとり|一人|1人)(です|だよ|しかいない|しかいません)|子ども(だけ|しか)(です|だよ|いない|いません)|こども(だけ|しか)(です|だよ|いない|いません)/, why: '一人でいることを教えてしまっている' },
  { re: /([0-9]+|[一二三四五六七八九十]+)時(ごろ|頃|くらい|に)?(帰|かえ)/, why: '家族の帰る時間を教えてしまっている' },
  { re: new RegExp('(LINE|ライン|らいん|ID|アイディー|メアド|メール|インスタ|連絡先|れんらくさき)(は|を)' + NEG, 'i'), why: '連絡先を教えようとしている' },
];
const COMPLY = /(いいよ|いいですよ|行きます|いきます|ついて(いき|行き)ます|乗ります|のります|開けます|あけます|開けるよ|あけるよ|入っていい|はいっていい|教えます|おしえます|やります|やってみたい|応募します|おうぼします|会いましょう|あいましょう)/;
const GOOD_RULES = [
  { tag: 'ika', re: /(行かない|いかない|行きません|いきません|ついて(行|い)かない|行けません|いけません)/ },
  { tag: 'no',  re: /(乗らない|のらない|乗りません|のりません|近づかない|ちかづかない|近よらない|ちかよらない|はなれて歩|離れて歩)/ },
  { tag: 'o',   re: /(助けて|たすけて|大声|おおごえ|叫|さけ|ブザー|ぶざー|やめて|いやだ|いやです|嫌です|嫌だ|結構です|けっこうです|いりません|いらない|だめ|ダメ|しません|できません|断|ことわ|無理|むり)/ },
  { tag: 'su',  re: /(逃げ|にげ|走っ|はしっ|走る|はしる|離れ|はなれ|お店|おみせ|コンビニ|こんびに|110番の家|110ばんのいえ|人の多い|ひとのおおい|人がいる|ひとがいる|立ち去|たちさ)/ },
  { tag: 'shi', re: /(知らせ|しらせ|相談|そうだん|話す|はなす|伝え|つたえ|報告|ほうこく|先生|せんせい|親|おや|お母さん|おかあさん|お父さん|おとうさん|家の人|いえのひと|家族|かぞく|大人|おとな|警察|けいさつ|110|交番|こうばん)/ },
  { tag: 'call', re: /(電話を切|でんわをき|切ります|きります|切る|切って|きって|返信しない|へんしんしない|返信しません|へんしんしません|返事しない|へんじしない|無視|むし|ブロック|ぶろっく|保存|ほぞん|スクショ|すくしょ)/ },
  { tag: 'info', re: /(教えない|おしえない|教えません|おしえません|言わない|いわない|言いません|いいません|答えない|こたえない|答えません|こたえません|書かない|かかない|書きません|かきません|交換しない|こうかんしない|ひみつ|秘密|ないしょ|内緒)/ },
  { tag: 'door', re: /(開けない|あけない|開けません|あけません|出ない|でない|出ません|でません|入れない|いれない|入れません|いれません|鍵|かぎ|カギ)/ },
];
const HELP_GOOD = [
  { tag: 'help', re: /(大人|おとな|先生|せんせい|店の人|みせのひと|お店|おみせ|110|警察|けいさつ|通報|つうほう|知らせ|しらせ|呼ぶ|よぶ|呼んで|よんで|助けを|たすけを|相談|そうだん|家の人|いえのひと|親|おや)/ },
  { tag: 'o', re: /(大声|おおごえ|叫|さけ|だれか|誰か|ブザー|ぶざー)/ },
];
const HELP_BAD = [
  { re: /(ひとりで|一人で|自分で|じぶんで|自分が|じぶんが)(止め|とめ|助け|たすけ|戦|たたか|注意|ちゅうい)(?!ず|ない|ません)|殴|なぐる|なぐって|蹴|けとば|やっつけ|追いかけ(?!ない|ず|ません)|おいかけ(?!ない|ず|ません)|戦う|たたかう/, why: '一人で立ち向かうのはとてもあぶない' },
  { re: /(いっしょに|一緒に)(やる|やろ|やります)|ひみつにする|秘密にする|だまっておく|黙っておく|言わないでおく|いわないでおく|だれにも言わない|誰にも言わない|だれにもいわない/, why: 'それでは友だちを守れない' },
];

function normalize(s) {
  return s.replace(/\s/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[－ー―‐]/g, (c, i, str) => (/[0-9]/.test(str[i - 1] || '') ? '-' : c));
}
const toHira = (s) => s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

function evaluate(raw, sc, st) {
  const t = normalize(raw);
  const h = toHira(t);
  const test = (re) => re.test(t) || re.test(h);
  for (const r of OUT_RULES) if (test(r.re)) return { grade: 'out', why: r.why };
  const isHelp = sc.cat === 'help';
  if (isHelp) for (const r of HELP_BAD) if (test(r.re)) return { grade: 'bad', why: r.why };
  const rules = (isHelp ? HELP_GOOD : GOOD_RULES).concat(st.adv || []);
  const tags = [...new Set(rules.filter((r) => test(r.re)).map((r) => r.tag))];
  const comply = test(COMPLY);
  if (comply && tags.length === 0) return { grade: 'bad', tags, why: '相手の言うとおりにしてしまっている' };
  if (comply) return { grade: 'weak', tags, why: '断ることばと、言うとおりにすることばがまざっているよ' };
  if (tags.length >= 2 || (isHelp && tags.includes('help'))) return { grade: 'great', tags };
  if (tags.length === 1) return { grade: 'good', tags };
  return { grade: 'weak', tags };
}

/* =========================================================
   6. セーブデータ
   ========================================================= */
const SAVE_KEY = 'anzenQuestSave_v1';
function loadSave() {
  const def = { exp: 0, hero: null, level: 'b', clears: {}, settings: { speech: false, big: false, type: true } };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { ...def, ...d, settings: { ...def.settings, ...(d.settings || {}) } };
    }
  } catch (e) { /* 保存できない環境でも動かす */ }
  return def;
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S.save)); } catch (e) { /* noop */ } }

const S = { save: loadSave(), q: null };
function lvInfo(exp) {
  const lv = Math.floor(exp / 50) + 1;
  return { lv, rank: RANKS[Math.min(lv - 1, RANKS.length - 1)], cur: exp % 50 };
}

/* =========================================================
   7. 読み上げ・文字送り
   ========================================================= */
function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[【】👍]/g, ''));
  u.lang = 'ja-JP';
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
function stopSpeak() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

let typeTimer = null, typing = false, typeDone = null;
function typeText(el, text, done) {
  clearInterval(typeTimer);
  typeDone = done;
  if (!S.save.settings.type || !text) {
    el.textContent = text; typing = false; done && done(); return;
  }
  let i = 0; typing = true; el.textContent = '';
  typeTimer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) { clearInterval(typeTimer); typing = false; done && done(); }
  }, 35);
}
function skipType(fullText) {
  if (!typing) return;
  clearInterval(typeTimer); typing = false;
  $('#msgText').textContent = fullText;
  typeDone && typeDone();
}

/* =========================================================
   8. 画面
   ========================================================= */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
  $('#topbar').classList.toggle('hidden', name === 'title' || name === 'hero');
  stopSpeak();
  window.scrollTo(0, 0);
}
function updateStatus() {
  const info = lvInfo(S.save.exp);
  $('#lvText').textContent = info.lv;
  $('#rankText').textContent = info.rank;
  $('#expFill').style.width = (info.cur / 50) * 100 + '%';
  $('#expText').textContent = `${info.cur} / 50`;
  const hero = S.save.hero || 'hero0';
  $('#heroMini').innerHTML = avatarSVG(hero, '40 40 120 120');
}
function chip(tag) {
  const t = TAGS[tag];
  return `<span class="chip" style="--chip:${t.color}"><b>${t.k}</b>${t.label}</span>`;
}

/* ---------- タイトル ---------- */
function renderTitle() {
  const id = uid();
  const hero = S.save.hero || 'hero0';
  $('#titleScene').innerHTML = `<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
    ${BG.street(id)}
    <g opacity=".95"><g transform="translate(250 50) scale(.66)">${avatarInner(AVATARS.hood, id + 'h')}</g></g>
    <g transform="translate(30 70) scale(.62)">${avatarInner(AVATARS[hero], id + 'p')}</g>
    <g transform="translate(222 34)"><rect x="0" y="0" width="54" height="40" rx="12" fill="#fff" stroke="#1c2550" stroke-width="3"/><path d="M40 38 L50 52 L30 38 Z" fill="#fff"/><text x="27" y="30" font-size="26" text-anchor="middle" font-weight="900" fill="#e0404f">!?</text></g>
  </svg>`;
}

/* ---------- 主人公 ---------- */
let heroPick = null;
function renderHero() {
  heroPick = S.save.hero;
  $('#heroGrid').innerHTML = HEROES.map((h) => `
    <button class="hero-card ${heroPick === h.key ? 'selected' : ''}" data-hero="${h.key}">
      ${avatarSVG(h.key, '20 30 160 200')}<span>${h.name}</span>
    </button>`).join('');
  $('#btnHeroOk').disabled = !heroPick;
}

/* ---------- マップ ---------- */
function renderMap() {
  const lvl = S.save.level;
  $('#levelTabs').innerHTML = Object.entries(LEVELS).map(([k, v]) =>
    `<button class="level-tab" role="tab" aria-selected="${k === lvl}" data-level="${k}">${v.name}</button>`).join('');
  $('#levelDesc').textContent = LEVELS[lvl].desc;
  $('#mapBody').innerHTML = Object.entries(CATEGORIES).map(([ck, c]) => {
    const list = SCENARIOS.filter((s) => s.cat === ck);
    return `<section class="area" style="--area-color:${c.color}">
      <h3 class="area-name"><i>${c.icon}</i>${c.name}</h3>
      <div class="quest-list">${list.map((s) => {
        const cl = S.save.clears[s.id] || {};
        const stars = ['b', 'm', 'a'].map((k) => `<span class="${cl[k] ? 'on' : ''}">★</span>`).join('');
        return `<button class="quest-card ${cl[lvl] ? 'cleared' : ''}" data-quest="${s.id}">
          <span class="thumb">${avatarSVG(s.avatar, '40 40 120 120')}</span>
          <span><b>${esc(s.title)}</b><span class="stars" aria-label="クリア状況">${stars}</span></span>
        </button>`;
      }).join('')}</div>
    </section>`;
  }).join('');
}

/* ---------- クエスト ---------- */
function startQuest(id) {
  const sc = SC_BY_ID[id];
  const lvl = S.save.level;
  S.q = { sc, lvl, steps: lvl === 'b' ? [sc.steps[0]] : sc.steps, idx: 0, hearts: 3, lost: 0, tags: new Set(), weak: 0 };
  $('#questCat').textContent = CATEGORIES[sc.cat].icon + ' ' + CATEGORIES[sc.cat].name;
  $('#questTitle').textContent = sc.title;
  $('#questLevel').textContent = LEVELS[lvl].name;
  showScreen('quest');
  renderHearts();
  renderStep();
}
function renderHearts() {
  const q = S.q;
  $('#hearts').innerHTML = [0, 1, 2].map((i) => `<span class="${i < q.hearts ? '' : 'lost'}">❤️</span>`).join('');
}

let currentFull = '';
function renderStep() {
  const q = S.q, st = q.steps[q.idx];
  q.weak = 0;
  $('#stepInfo').textContent = q.steps.length > 1 ? `${q.idx + 1} / ${q.steps.length}` : '';
  renderScene(q.sc, q.idx);

  const sp = $('#speaker');
  sp.className = 'speaker' + (st.safe ? ' safe' : '') + (st.npc ? '' : ' narr');
  sp.textContent = st.npc ? (st.who || q.sc.who) : 'ナレーション';

  let narr = [q.idx === 0 ? q.sc.intro : '', st.narr || ''].filter(Boolean).join(' ');
  let msg = st.npc ? `「${st.npc}」` : '';
  if (!msg) { msg = narr; narr = ''; }
  $('#narrText').textContent = narr;
  currentFull = msg;
  $('#nextMark').classList.remove('show');

  const choicesEl = $('#choices');
  choicesEl.innerHTML = '';
  $('#freeInput').classList.add('hidden');
  $('#commandQ').textContent = st.npc ? 'どうする？' : 'このあと、どうする？';

  typeText($('#msgText'), msg, showCommand);
  if (S.save.settings.speech) speak(narr + '。' + msg);
}

function renderScene(sc, idx) {
  const st = S.q.steps[idx];
  const el = $('#scene');
  const layout = st.avatar ? 'portrait' : (sc.layout || 'portrait');
  const avKey = st.avatar || sc.avatar;
  const id = uid();
  if (layout === 'sns') { el.innerHTML = snsHTML(sc, S.q.steps, idx); return; }

  const bgKey = st.bg || sc.bg || 'street';
  let back = BG[bgKey](id), front = '', actor = null;
  switch (layout) {
    case 'car':      actor = { x: 170, y: 46, s: 0.55 }; front = carFront(id, sc.carColor); break;
    case 'intercom': actor = { x: 144, y: 30, s: 0.56, clip: `clip${id}` }; back += intercomBack(id); front = intercomFront(id); break;
    case 'call':     back += callPhone(sc, id); break;
    case 'witness':  actor = { x: 30, y: 18, s: 0.92 }; front = witnessFront(id); break;
    default:         actor = { x: 112, y: 20, s: 0.9 };
  }
  const actorSvg = actor
    ? `<g class="actor-in"><g id="act${id}" ${actor.clip ? `clip-path="url(#${actor.clip})"` : ''}><g transform="translate(${actor.x} ${actor.y}) scale(${actor.s})">${avatarInner(AVATARS[avKey], id)}</g></g></g>`
    : '';
  el.innerHTML = `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${back}${actorSvg}${front}</svg>`;

  if (actor) {
    findPhoto(avKey).then((url) => {
      const g = document.getElementById('act' + id);
      if (!url || !g) return;
      g.innerHTML = `<image href="${url}" x="${actor.x}" y="${actor.y}" width="${200 * actor.s}" height="${260 * actor.s}" preserveAspectRatio="xMidYMin slice"/>`;
    });
  }
}

function showCommand() {
  const q = S.q, st = q.steps[q.idx];
  $('#nextMark').classList.add('show');
  if (q.lvl === 'a') {
    const good = st.choices.find((c) => c.r === 'good');
    $('#freeHint').innerHTML = 'ヒント：' + good.tags.map(chip).join('');
    $('#answerText').value = '';
    $('#freeInput').classList.remove('hidden');
    return;
  }
  const keys = ['ア', 'イ', 'ウ', 'エ'];
  $('#choices').innerHTML = shuffle(st.choices).map((c, i) =>
    `<button class="choice" data-i="${st.choices.indexOf(c)}" style="animation-delay:${i * 80}ms"><span class="key">${keys[i]}</span><span>${esc(c.t)}</span></button>`).join('');
}

function loseHeart() {
  const q = S.q;
  q.hearts = Math.max(0, q.hearts - 1);
  q.lost++;
  renderHearts();
  const sc = $('#scene');
  sc.classList.remove('shake'); void sc.offsetWidth; sc.classList.add('shake');
}

function onChoice(i, btn) {
  const q = S.q, st = q.steps[q.idx], ch = st.choices[i];
  const isLast = q.idx >= q.steps.length - 1;
  if (ch.r === 'good') {
    ch.tags.forEach((t) => q.tags.add(t));
    showFeedback({
      kind: 'good', mark: '⭕', title: pick(['いい判断！', 'ナイス！', 'そのとおり！']),
      text: ch.fb, tags: ch.tags,
      actions: [{ label: isLast ? 'クエストクリア！' : 'つぎへすすむ', primary: true, fn: nextStep }],
    });
  } else if (ch.r === 'bad') {
    btn.disabled = true;
    loseHeart();
    const over = q.hearts <= 0;
    showFeedback({
      kind: 'bad', mark: '⚠️', title: 'あぶない！', text: ch.fb,
      actions: [over
        ? { label: 'けっかを見る', primary: true, fn: () => finish('gameover') }
        : { label: 'もう一度えらぶ', primary: true, fn: closeFeedback }],
    });
  } else {
    showFeedback({
      kind: 'out', mark: '❌', title: 'アウト！', text: ch.fb,
      actions: [{ label: 'けっかを見る', primary: true, fn: () => finish('out', ch.fb) }],
    });
  }
}

function onSubmit() {
  const q = S.q, st = q.steps[q.idx];
  const txt = $('#answerText').value.trim();
  if (txt.length < 2) { $('#answerText').focus(); $('#answerText').placeholder = '言うこと・することを書いてみよう'; return; }
  const good = st.choices.find((c) => c.r === 'good');
  const model = `<b>こたえの例</b>${esc(good.t)}`;
  const isLast = q.idx >= q.steps.length - 1;
  const ev = evaluate(txt, q.sc, st);

  if (ev.grade === 'out') {
    showFeedback({ kind: 'out', mark: '❌', title: 'アウト！', text: `${ev.why}よ。${OUT_INFO}`,
      actions: [{ label: 'けっかを見る', primary: true, fn: () => finish('out', `あなたの答え：「${txt}」\n${ev.why}。`) }] });
    return;
  }
  if (ev.grade === 'bad') {
    loseHeart();
    const over = q.hearts <= 0;
    showFeedback({ kind: 'bad', mark: '⚠️', title: 'あぶない！', text: `${ev.why}よ。もう一度考えてみよう。`, model,
      actions: [over ? { label: 'けっかを見る', primary: true, fn: () => finish('gameover') } : { label: 'もう一度書く', primary: true, fn: closeFeedback }] });
    return;
  }
  if (ev.grade === 'weak') {
    q.weak++;
    const acts = [{ label: 'もう一度書く', primary: true, fn: closeFeedback }];
    if (q.weak >= 2) acts.push({ label: 'こたえの例をたしかめて、つぎへ', fn: nextStep });
    showFeedback({ kind: 'bad', mark: '🤔', title: 'おしい！',
      text: (ev.why ? ev.why + '。' : '') + '何と言うか、どうするかを、もう少しくわしく書いてみよう。ヒントのことばを使ってみてね。',
      tags: good.tags, model: q.weak >= 2 ? model : '', actions: acts });
    return;
  }
  ev.tags.forEach((t) => q.tags.add(t));
  const missing = good.tags.filter((t) => !ev.tags.includes(t));
  const more = ev.grade === 'good' && missing.length
    ? `さらに「${missing.map((t) => TAGS[t].label).join('」「')}」も入れると、もっと安全だよ。` : '';
  showFeedback({ kind: 'good', mark: '⭕', title: ev.grade === 'great' ? 'すばらしい！' : 'いいね！',
    text: `自分のことばで、安全な行動が書けたね。${more}`, tags: ev.tags, model,
    actions: [{ label: isLast ? 'クエストクリア！' : 'つぎへすすむ', primary: true, fn: nextStep }] });
}

function nextStep() {
  closeFeedback();
  const q = S.q;
  q.idx++;
  if (q.idx >= q.steps.length) finish('clear');
  else renderStep();
}

/* ---------- フィードバック ---------- */
function showFeedback({ kind, mark, title, text, tags = [], model = '', actions = [] }) {
  $('#fbCard').className = 'fb-card ' + kind;
  $('#fbMark').textContent = mark;
  $('#fbTitle').textContent = title;
  $('#fbText').textContent = text || '';
  $('#fbTags').innerHTML = tags.map(chip).join('');
  $('#fbModel').innerHTML = model;
  $('#fbModel').classList.toggle('hidden', !model);
  const box = $('#fbActions');
  box.innerHTML = '';
  actions.forEach((a) => {
    const b = document.createElement('button');
    b.className = 'big-btn ' + (a.primary ? 'primary' : 'ghost');
    b.textContent = a.label;
    b.addEventListener('click', a.fn);
    box.appendChild(b);
  });
  $('#feedback').classList.remove('hidden');
  if (S.save.settings.speech) speak(title + '。' + (text || ''));
  box.querySelector('button')?.focus();
}
function closeFeedback() { $('#feedback').classList.add('hidden'); stopSpeak(); }

/* ---------- 結果 ---------- */
function finish(kind, reason = '') {
  closeFeedback();
  const q = S.q, sc = q.sc, type = TYPES[sc.type];
  let head = '', body = '';
  if (kind === 'clear') {
    const before = lvInfo(S.save.exp).lv;
    const base = LEVELS[q.lvl].exp, bonus = q.lost === 0 ? 5 : 0;
    S.save.exp += base + bonus;
    S.save.clears[sc.id] = { ...(S.save.clears[sc.id] || {}), [q.lvl]: true };
    persist();
    const after = lvInfo(S.save.exp);
    head = `<h2>クエストクリア！</h2>`;
    body = `<p class="gain">けいけんち +${base}${bonus ? `（ノーミスボーナス +${bonus}）` : ''}</p>
      ${after.lv > before ? `<div class="levelup">レベルアップ！ Lv ${after.lv}「${after.rank}」</div>` : ''}
      <p>このクエストで使った身の守り方</p>
      <div class="learned">${[...q.tags].map(chip).join('')}</div>`;
  } else if (kind === 'out') {
    head = `<h2>アウト…</h2>`;
    body = `<div class="out-reason">${esc(reason).replace(/\n/g, '<br>')}</div>
      <p>名前・住所・学校・電話番号・家のるす・帰る時間は教えない。ついて行かない、乗らない、開けない。</p>`;
  } else {
    head = `<h2>ハートがなくなった…</h2>`;
    body = `<p>あぶない行動が続いてしまったね。「いかのおすし」をたしかめて、もう一度ちょうせんしよう。</p>`;
  }
  const reveal = `<div class="reveal">
      <div class="pic" id="revealPic">${avatarSVG(sc.avatar)}</div>
      <div><span class="kind ${sc.type === 'friend' ? 'normal' : sc.type}">${type.label}</span>
        <p>${sc.cat === 'help' && sc.type !== 'friend' ? '困っている人を見つけたら、一人で立ち向かわず、近くの大人や110番に知らせよう。' : type.msg}</p></div>
    </div>`;
  const next = { b: 'm', m: 'a' }[q.lvl];
  $('#resultPanel').className = 'panel result ' + (kind === 'clear' ? 'clear' : 'out');
  $('#resultPanel').innerHTML = head + reveal + body + `
    ${kind === 'clear' && next ? `<button class="big-btn primary" id="rNext">${LEVELS[next].name}でちょうせん</button>` : ''}
    <button class="big-btn ${kind === 'clear' && next ? 'ghost' : 'primary'}" id="rRetry">もう一度ちょうせん</button>
    <button class="big-btn ghost" id="rMap">マップにもどる</button>`;
  showScreen('result');
  updateStatus();
  findPhoto(sc.avatar).then((url) => { if (url && $('#revealPic')) $('#revealPic').innerHTML = `<img src="${url}" alt="">`; });
  $('#rRetry').onclick = () => startQuest(sc.id);
  $('#rMap').onclick = goMap;
  if ($('#rNext')) $('#rNext').onclick = () => { S.save.level = next; persist(); startQuest(sc.id); };
}

function goMap() { renderMap(); updateStatus(); showScreen('map'); }

/* ---------- いかのおすし・設定 ---------- */
function renderGuide() {
  $('#ikaList').innerHTML = IKA_KEYS.map((k) => {
    const t = TAGS[k];
    return `<div class="ika"><div class="big" style="background:${t.color}">${t.k}</div><div><strong>${t.label}</strong><span>${t.desc}</span></div></div>`;
  }).join('');
}
function openOverlay(id) { $('#' + id).classList.remove('hidden'); }
function applySettings() {
  const st = S.save.settings;
  document.body.classList.toggle('big', !!st.big);
  $('#optSpeech').checked = !!st.speech;
  $('#optBig').checked = !!st.big;
  $('#optType').checked = !!st.type;
}

/* =========================================================
   9. イベント
   ========================================================= */
function bind() {
  $('#btnStart').onclick = () => {
    if (S.save.hero) goMap();
    else { renderHero(); showScreen('hero'); }
  };
  $('#btnTitleGuide').onclick = () => openOverlay('guide');
  $('#btnGuide').onclick = () => openOverlay('guide');
  $('#btnSettings').onclick = () => openOverlay('settings');
  document.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => $('#' + b.dataset.close).classList.add('hidden'); });

  $('#heroGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-hero]');
    if (!b) return;
    heroPick = b.dataset.hero;
    document.querySelectorAll('.hero-card').forEach((c) => c.classList.toggle('selected', c === b));
    $('#btnHeroOk').disabled = false;
  });
  $('#btnHeroOk').onclick = () => { S.save.hero = heroPick; persist(); goMap(); };

  $('#levelTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (!b) return;
    S.save.level = b.dataset.level; persist(); renderMap();
  });
  $('#mapBody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-quest]');
    if (b) startQuest(b.dataset.quest);
  });

  $('#choices').addEventListener('click', (e) => {
    const b = e.target.closest('.choice');
    if (b && !b.disabled) onChoice(Number(b.dataset.i), b);
  });
  $('.msg-window').addEventListener('click', (e) => {
    if (e.target.closest('#btnSpeak')) return;
    skipType(currentFull);
  });
  $('#btnSpeak').onclick = () => {
    const q = S.q;
    if (!q) return;
    const st = q.steps[q.idx];
    let t = $('#narrText').textContent + '。' + currentFull;
    if (q.lvl !== 'a') {
      const btns = [...document.querySelectorAll('.choice')];
      t += '。どうする？ ' + btns.map((b) => b.querySelector('.key').textContent + '、' + st.choices[Number(b.dataset.i)].t).join('。');
    }
    speak(t);
  };
  $('#btnSubmit').onclick = onSubmit;
  $('#btnQuit').onclick = goMap;

  $('#optSpeech').onchange = (e) => { S.save.settings.speech = e.target.checked; persist(); };
  $('#optBig').onchange = (e) => { S.save.settings.big = e.target.checked; persist(); applySettings(); };
  $('#optType').onchange = (e) => { S.save.settings.type = e.target.checked; persist(); };
  $('#btnReset').onclick = () => {
    if (!confirm('レベル・クリア記録・主人公をすべて消します。よろしいですか？')) return;
    const settings = S.save.settings;
    S.save = { exp: 0, hero: null, level: 'b', clears: {}, settings };
    persist();
    $('#settings').classList.add('hidden');
    renderTitle(); showScreen('title');
  };

  // キーボード（1〜4で選択）
  document.addEventListener('keydown', (e) => {
    if (!$('#screen-quest').classList.contains('active') || !$('#feedback').classList.contains('hidden')) return;
    if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
    const n = Number(e.key);
    const btns = document.querySelectorAll('.choice');
    if (n >= 1 && n <= btns.length && !btns[n - 1].disabled) btns[n - 1].click();
  });
}

/* ---------- 起動 ---------- */
renderTitle();
renderGuide();
applySettings();
updateStatus();
bind();
