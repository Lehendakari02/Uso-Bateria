// Uso-Bateria: Clawd beside a pixel battery of your weekly Claude usage, in a small panel of the Desktop app
// (or painted on its background). The pixel art and animations come from Handsher/usage-battery (MIT).
// The art is one SVG redrawn each minute and after each answer; its moves are CSS on the compositor, and every
// cycle divides a minute, so a redraw picks each move up where it was.
const GROUND = '#0b1717'
const n2 = x => +x.toFixed(3)
const mix = (x, y, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(x.slice(i, i + 2), 16) * (1 - t) + parseInt(y.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')
// the card's words, in Spanish (default) or English
const TEXT = {
  es: { days: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], week: 'USO SEMANAL', five: 'USO · 5 HORAS', ctx: 'CONTEXTO', resets: (d, t) => `renueva ${d ?? 'hoy'} ${t}`, waiting: 'esperando datos de uso…', left: 'QUEDA', refills: 'recarga', alt: 'Batería de Claude: lo que te queda de uso semanal' },
  en: { days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], week: 'CLAUDE · WEEKLY', five: 'CLAUDE · 5 HOURS', ctx: 'CLAUDE · CONTEXT', resets: (d, t) => `resets ${d ?? 'at'} ${t}`, waiting: 'waiting for usage figures…', left: 'LEFT', refills: 'refills', alt: 'Claude battery: your weekly usage left' },
}
let L = TEXT.es
// ---------- the Claude battery: Clawd beside a pixel battery of the week's usage ----------
// Clawd on a 16 × 8 grid, lit from the top left: H light, B body, S shade, E eye, a/b arms, 1/2 the two leg pairs
const CLAWD = ['...HHHHHHHHHB...', '...HBBBBBBBBS...', '...HBEBBBBEBS...', '.aaBBEBBBBEBSbb.', '...BBBBBBBBBS...', '...SSSSSSSSSS...', '...1.2....1.2...', '...1.2....1.2...']
const CLC = { H: '#f4a585', B: '#d97757', S: '#b5583c', E: '#d97757', a: '#d97757', b: '#c9694b', 1: '#a94f35', 2: '#a94f35' }
// each move runs on the compositor (transforms and opacity only), so it is as smooth as the screen
const CB_CSS = `<style>
.cbw *{transform-box:fill-box}
.cb-sq{transform-origin:50% 100%}.cb-sh{transform-origin:50% 50%}.cb-al{transform-origin:100% 50%}.cb-ar{transform-origin:0 50%}.cb-bl,.cb-sp,.cb-z{transform-origin:50% 50%}
.cb-bl{animation:cb-blink 5s infinite}
@keyframes cb-blink{0%,45%,51%,100%{transform:scaleY(1)}48%{transform:scaleY(.08)}}
.happy .cb-hop{animation:cb-hop 1.2s infinite}
@keyframes cb-hop{0%,14%{transform:translateY(0);animation-timing-function:cubic-bezier(.15,.7,.4,1)}52%{transform:translateY(-15px);animation-timing-function:cubic-bezier(.6,0,.85,.3)}88%,100%{transform:translateY(0)}}
.happy .cb-sq{animation:cb-squash 1.2s infinite}
@keyframes cb-squash{0%{transform:scale(1.14,.84)}10%{transform:scale(.9,1.12)}30%,70%{transform:scale(1,1)}86%{transform:scale(.94,1.07)}92%{transform:scale(1.16,.82)}100%{transform:scale(1.14,.84)}}
.happy .cb-sh{animation:cb-shadow 1.2s infinite}
@keyframes cb-shadow{0%,14%,88%,100%{transform:scale(1);opacity:.4}52%{transform:scale(.55);opacity:.14}}
.happy .cb-al{animation:cb-wl .4s ease-in-out infinite alternate}.happy .cb-ar{animation:cb-wr .4s ease-in-out infinite alternate}
@keyframes cb-wl{from{transform:rotate(-8deg)}to{transform:rotate(42deg)}}@keyframes cb-wr{from{transform:rotate(8deg)}to{transform:rotate(-42deg)}}
.cb-sp{animation:cb-spark 2s ease-in-out infinite;opacity:0}
@keyframes cb-spark{0%,100%{transform:scale(0) rotate(0);opacity:0}40%{transform:scale(1.1) rotate(45deg);opacity:1}70%{transform:scale(.6) rotate(90deg);opacity:.6}}
.walk .cb-walk{animation:cb-walk 7.5s ease-in-out infinite}
@keyframes cb-walk{0%,100%{transform:translateX(0)}45%,50%{transform:translateX(12px)}95%{transform:translateX(0)}}
.walk .cb-hop{animation:cb-bob .4s ease-in-out infinite alternate}
@keyframes cb-bob{from{transform:translateY(0)}to{transform:translateY(-2.6px)}}
.walk .cb-l1{animation:cb-step .4s ease-in-out infinite alternate}.walk .cb-l2{animation:cb-step .4s ease-in-out infinite alternate}
@keyframes cb-step{from{transform:translateY(0)}to{transform:translateY(-3px)}}
.walk .cb-al{animation:cb-wl2 .75s ease-in-out infinite alternate}.walk .cb-ar{animation:cb-wr2 .75s ease-in-out infinite alternate}
@keyframes cb-wl2{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}@keyframes cb-wr2{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
.walk .cb-look{animation:cb-look 7.5s ease-in-out infinite}
@keyframes cb-look{0%,40%{transform:translateX(1.6px)}50%,90%{transform:translateX(-1.6px)}100%{transform:translateX(1.6px)}}
.tired .cb-hop{animation:cb-sag 3s ease-in-out infinite}
@keyframes cb-sag{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(2px) rotate(-2.5deg)}}
.tired .cb-sq,.sleep .cb-sq{animation:cb-breathe 3s ease-in-out infinite}
@keyframes cb-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.045,.95)}}
.tired .cb-al,.sleep .cb-al{transform:rotate(-28deg)}.tired .cb-ar,.sleep .cb-ar{transform:rotate(28deg)}
.cb-drop{animation:cb-drop 2s cubic-bezier(.5,0,.9,.6) infinite}
@keyframes cb-drop{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(16px);opacity:0}}
.sleep .cb-sq{animation-duration:4s}
.cb-z{animation:cb-z 3s ease-out infinite;opacity:0}
@keyframes cb-z{0%{transform:translate(0,0) scale(.5);opacity:0}20%{opacity:.9}100%{transform:translate(16px,-24px) scale(1.25);opacity:0}}
.cb-shine{animation:cb-shine 3s cubic-bezier(.45,0,.2,1) infinite}
@keyframes cb-shine{0%{transform:translateX(-40px)}55%,100%{transform:translateX(170px)}}
.cb-bub{animation:cb-bub 2.4s ease-in infinite;opacity:0}
@keyframes cb-bub{0%{transform:translateY(0);opacity:0}20%{opacity:.75}100%{transform:translateY(-24px);opacity:0}}
.cb-alarm{animation:cb-alarm 1s ease-in-out infinite alternate}
@keyframes cb-alarm{from{opacity:.08}to{opacity:.7}}
@media (prefers-reduced-motion:reduce){.cbw *{animation:none!important}}
</style>`
function clawd(p, mood) {
  const part = { body: '', eyes: '', a: '', b: '', 1: '', 2: '' }
  const px = (x, y, w, h, fill, extra = '') => `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" fill="${fill}"${extra}/>`
  CLAWD.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return
    const r = px(x * p, y * p, p + 0.35, p + 0.35, CLC[c]) // a hair of overlap: no seams while it moves
    if (c === 'a' || c === 'b' || c === '1' || c === '2') part[c] += r; else part.body += r
    if (c !== 'E') return
    // the eyes: open with a glint, half shut when tired, a line asleep
    if (mood === 'sleep') { if (y === 3) part.eyes += px(x * p - 0.5, y * p + p * 0.45, p + 1, p * 0.32, '#2a140c') }
    else if (mood === 'tired') { if (y === 3) part.eyes += px(x * p, y * p, p + 0.35, p * 0.75, '#2a140c') + px(x * p - 0.5, y * p - 0.6, p + 1, 1.4, '#8c3f27') }
    else part.eyes += px(x * p, y * p, p + 0.35, p + 0.35, '#2a140c') + (y === 2 ? px(x * p + p * 0.18, y * p + p * 0.15, p * 0.38, p * 0.38, '#ffffff', ' opacity=".9"') : '')
  }))
  const W = 16 * p, foot = 8 * p
  let extra = ''
  if (mood === 'happy') extra += px(4 * p, 4.1 * p, p, p * 0.55, '#ff8fa3', ' opacity=".75"') + px(11 * p, 4.1 * p, p, p * 0.55, '#ff8fa3', ' opacity=".75"')
  if (mood === 'tired') extra += `<g class="cb-drop">${px(13.4 * p, 0.6 * p, p * 0.55, p * 0.55, '#8fd3ff')}${px(13.4 * p, 1.15 * p, p * 0.55, p * 0.4, '#5fb6f0')}</g>`
  const spark = (x, y, k, delay) => `<g class="cb-sp" style="--d:${delay}s" fill="#fff3b0">${px(x - k / 2, y - k * 1.5, k, k * 3, '#fff3b0')}${px(x - k * 1.5, y - k / 2, k * 3, k, '#fff3b0')}</g>`
  const zs = mood === 'sleep' ? [0, 1, 2].map(t => `<g class="cb-z" style="--d:${t}s">${pixelText('z', 12.6 * p, -1.2 * p, 1.8, '#ffffff')}</g>`).join('') : ''
  return `<g class="${mood}"><g class="cb-walk">`
    + `<ellipse class="cb-sh" cx="${n2(W / 2)}" cy="${n2(foot + 2)}" rx="${n2(5.4 * p)}" ry="${n2(p * 0.55)}" fill="#000000" opacity=".4"/>`
    + `<g class="cb-hop"><g class="cb-sq">`
    + `<g class="cb-l1">${part[1]}</g><g class="cb-l2" style="--d:-.4s">${part[2]}</g>`
    + `<g class="cb-al">${part.a}</g><g class="cb-ar">${part.b}</g>`
    + part.body + `<g class="cb-look"><g class="cb-bl">${part.eyes}</g></g>` + extra
    + `</g></g>` + zs
    + (mood === 'happy' ? spark(-0.6 * p, 0.4 * p, 1.6, 0) + spark(16.4 * p, -0.8 * p, 1.4, 0.6) + spark(15.4 * p, 4.6 * p, 1.2, 1.2) : '')
    + `</g></g>`
}
// a pixel battery: stepped corners, a nub, the charge as a lit gradient cut into ten cells, a glint sweeping over it
function battery(x, y, w, h, left, col) {
  const ix = x + 8, iy = y + 8, iw = w - 16, ih = h - 16, fw = Math.round((iw * left) / 100)
  const light = mix(col, '#ffffff', 0.4), dark = mix(col, '#000000', 0.28)
  let out = `<defs><linearGradient id="cbg${left}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset=".45" stop-color="${col}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`
    + `<clipPath id="cbclip${left}"><rect x="${ix}" y="${iy}" width="${fw}" height="${ih}"/></clipPath></defs>`
  if (left <= 20) out += `<rect class="cb-alarm" x="${x - 4}" y="${y - 4}" width="${w + 16}" height="${h + 8}" rx="6" fill="none" stroke="${col}" stroke-width="3"/>`
  out += `<g fill="#ffffff" shape-rendering="crispEdges"><rect x="${x + 4}" y="${y}" width="${w - 8}" height="4"/><rect x="${x + 4}" y="${y + h - 4}" width="${w - 8}" height="4"/>`
    + `<rect x="${x}" y="${y + 4}" width="4" height="${h - 8}"/><rect x="${x + w - 4}" y="${y + 4}" width="4" height="${h - 8}"/>`
    + `<rect x="${x + w}" y="${y + 14}" width="5" height="${h - 28}"/><rect x="${x + w + 5}" y="${y + 18}" width="3" height="${h - 36}"/></g>`
    + `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="#ffffff" opacity=".06"/>`
  if (fw > 0) {
    out += `<rect x="${ix}" y="${iy}" width="${fw}" height="${ih}" fill="url(#cbg${left})"/>`
      + `<rect x="${ix}" y="${iy + 2}" width="${fw}" height="3" fill="#ffffff" opacity=".35"/>`
      + `<g clip-path="url(#cbclip${left})"><g class="cb-shine"><path d="M${ix} ${iy + ih}l12 -${ih}h14l-12 ${ih}z" fill="#ffffff" opacity=".38"/></g>`
      + (fw > 24 ? [0.2, 0.5, 0.8].map((f, n) => `<rect class="cb-bub" style="--d:${n * 0.8}s" x="${n2(ix + fw * f)}" y="${iy + ih - 5}" width="3" height="3" fill="#ffffff"/>`).join('') : '')
      + `</g>`
  }
  for (let i = 1; i < 10; i++) out += `<rect x="${n2(ix + (iw * i) / 10 - 1)}" y="${iy}" width="2" height="${ih}" fill="${GROUND}" opacity=".7"/>`
  return out
}
// a 3 × 5 pixel font for the figure
const PIX = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111', '%': '101001010100101', z: '111001010100111' }
function pixelText(t, x, y, p, fill) {
  let out = ''
  ;[...String(t)].forEach((ch, n) => [...(PIX[ch] ?? '')].forEach((b, i) => {
    if (b === '1') out += `<rect x="${n2(x + (n * 4 + (i % 3)) * p)}" y="${n2(y + Math.floor(i / 3) * p)}" width="${p}" height="${p}"/>`
  }))
  return `<g fill="${fill}" shape-rendering="crispEdges">${out}</g>`
}

// ---------- the card: 300 wide at its origin ----------
function card(u, now) {
  // the week's limit fills the battery; the 5-hour window rides under it; off a subscription, the context window
  const lim = u.rateLimits ?? [], five = lim.find(r => /five|5/.test(r.kind)), week = lim.find(r => /seven|7|week/.test(r.kind))
  const main = week ?? five, pct = r => Math.max(0, Math.min(100, Math.round(100 - r.percentUsed)))
  const left = main ? pct(main) : Math.max(0, Math.min(100, Math.round(100 - (u.context?.percent ?? 0))))
  const col = left > 50 ? '#6fe08a' : left > 20 ? '#ffc94d' : '#ff5e57'
  const mood = left === 0 ? 'sleep' : left <= 20 ? 'tired' : left > 60 ? 'happy' : 'walk'
  const resetsIn = r => { const ms = r?.resetsAt ? Date.parse(r.resetsAt) - now : NaN; return Number.isFinite(ms) && ms > 0 ? ms : NaN }
  const clock = ms => { const t = new Date(now + ms); return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` }
  const wIn = resetsIn(main), at = new Date(now + wIn), sameDay = at.toDateString() === new Date(now).toDateString()
  const reset = !Number.isFinite(wIn) ? '' : L.resets(sameDay ? undefined : L.days[at.getDay()], clock(wIn))
  const sub = week && five, H = sub ? 178 : 154
  const M = 'font-family="ui-monospace,Menlo,monospace" fill="#ffffff"'
  let body = `<rect width="300" height="${H}" rx="24" fill="${GROUND}" fill-opacity="${CARD_OPACITY}" stroke="#ffffff" stroke-opacity=".12"/>`
    + `<g class="cbw">${CB_CSS}<style>.cbw *{animation-delay:calc(var(--d,0s) - ${n2((now % 60000) / 1000)}s)!important}</style>`
    + `<text x="24" y="33" font-size="11" font-weight="600" letter-spacing="1.3" opacity=".62" ${M}>${week ? L.week : five ? L.five : L.ctx}</text>`
    + (reset ? `<text x="276" y="33" font-size="11" text-anchor="end" opacity=".62" ${M}>${reset}</text>` : '')
    + `<g transform="translate(16 74)">${clawd(5, mood)}</g>`
    + battery(116, 60, 150, 48, left, col)
    + pixelText(`${left}%`, 116, 122, 4.5, col)
    + `<text x="${n2(116 + String(left).length * 18 + 26)}" y="144" font-size="11" letter-spacing="1.4" opacity=".55" ${M}>${L.left}</text>`
  if (sub) {
    const f = pct(five), fc = f > 50 ? '#6fe08a' : f > 20 ? '#ffc94d' : '#ff5e57', fIn = resetsIn(five)
    body += `<line x1="24" x2="276" y1="156" y2="156" stroke="#ffffff" stroke-opacity=".08"/>`
      + `<text x="24" y="171" font-size="10.5" letter-spacing="1.2" opacity=".55" ${M}>5H</text>`
      + `<g shape-rendering="crispEdges">${Array.from({ length: 10 }, (_, i) => `<rect x="${46 + i * 9}" y="163" width="7" height="8" fill="${i < Math.ceil(f / 10) ? fc : '#ffffff'}" opacity="${i < Math.ceil(f / 10) ? 1 : 0.1}"/>`).join('')}</g>`
      + `<text x="276" y="171" font-size="10.5" text-anchor="end" opacity=".62" ${M}>${f}%${Number.isFinite(fIn) ? ` · ${L.refills} ${clock(fIn)}` : ''}</text>`
  }
  return { h: H, body: body + '</g>', left }
}

// ---------- the scene: ONLY the card, the rest of the window stays transparent ----------
let CARD_OPACITY = 0.9
// ---------- the compact card: 300 x 84, one low strip that sits well beside the prompt box ----------
function compactCard(u, now) {
  const lim = u.rateLimits ?? [], five = lim.find(r => /five|5/.test(r.kind)), week = lim.find(r => /seven|7|week/.test(r.kind))
  const main = week ?? five, pct = r => Math.max(0, Math.min(100, Math.round(100 - r.percentUsed)))
  const left = main ? pct(main) : Math.max(0, Math.min(100, Math.round(100 - (u.context?.percent ?? 0))))
  const col = left > 50 ? '#6fe08a' : left > 20 ? '#ffc94d' : '#ff5e57'
  const mood = left === 0 ? 'sleep' : left <= 20 ? 'tired' : left > 60 ? 'happy' : 'walk'
  const resetsIn = r => { const ms = r?.resetsAt ? Date.parse(r.resetsAt) - now : NaN; return Number.isFinite(ms) && ms > 0 ? ms : NaN }
  const clock = ms => { const t = new Date(now + ms); return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` }
  const wIn = resetsIn(main), at = new Date(now + wIn), sameDay = at.toDateString() === new Date(now).toDateString()
  const reset = !Number.isFinite(wIn) ? '' : L.resets(sameDay ? undefined : L.days[at.getDay()], clock(wIn))
  const f = week && five ? pct(five) : null
  const H = 84, M = 'font-family="ui-monospace,Menlo,monospace" fill="#ffffff"'
  const body = `<rect width="300" height="${H}" rx="20" fill="${GROUND}" fill-opacity="${CARD_OPACITY}" stroke="#ffffff" stroke-opacity=".12"/>`
    + `<g class="cbw">${CB_CSS}<style>.cbw *{animation-delay:calc(var(--d,0s) - ${n2((now % 60000) / 1000)}s)!important}</style>`
    + `<g transform="translate(10 36)">${clawd(4, mood)}</g>`
    + battery(84, 14, 104, 40, left, col)
    + pixelText(`${left}%`, 218, 20, 3.4, col)
    + `<text x="218" y="52" font-size="9.5" letter-spacing="1.3" opacity=".55" ${M}>${L.left}</text>`
    + (reset ? `<text x="84" y="72" font-size="9.5" opacity=".62" ${M}>${reset}</text>` : '')
    + (f !== null ? `<text x="286" y="72" font-size="9.5" text-anchor="end" opacity=".62" ${M}>5H ${f}%</text>` : '')
  return { h: H, body: body + '</g>', left }
}

// ---------- the card before any usage figures came: Clawd walks beside an empty battery ----------
function waitingCard(now) {
  const H = 154, M = 'font-family="ui-monospace,Menlo,monospace" fill="#ffffff"'
  const body = `<rect width="300" height="${H}" rx="24" fill="${GROUND}" fill-opacity="${CARD_OPACITY}" stroke="#ffffff" stroke-opacity=".12"/>`
    + `<g class="cbw">${CB_CSS}<style>.cbw *{animation-delay:calc(var(--d,0s) - ${n2((now % 60000) / 1000)}s)!important}</style>`
    + `<text x="24" y="33" font-size="11" font-weight="600" letter-spacing="1.3" opacity=".62" ${M}>${L.week}</text>`
    + `<g transform="translate(16 74)">${clawd(5, 'walk')}</g>`
    + battery(116, 60, 150, 48, 0, '#ffffff')
    + `<text x="116" y="138" font-size="11" letter-spacing="1" opacity=".62" ${M}>${L.waiting}</text>`
  return { h: H, body: body + '</g>', left: null }
}

// where each spot sits in the 1600 x 1000 scene: cx is the card's centre, in the free strip beside the chat column
// (right of it, or left of it between the sidebar and the chat), never in the far corner or under the header;
// the bottom ones sit level with the prompt box (their foot 18 above the window's foot)
const SPOT_AT = {
  right: { cx: 1385, y: 500, h: 'r', v: 'm' }, 'top-right': { cx: 1385, y: 120, h: 'r', v: 't' }, 'bottom-right': { cx: 1385, y: 831, h: 'r', v: 'b' },
  left: { cx: 410, y: 500, h: 'l', v: 'm' }, 'top-left': { cx: 410, y: 120, h: 'l', v: 't' }, 'bottom-left': { cx: 410, y: 831, h: 'l', v: 'b' },
}
const SIZES = { tiny: 0.5, small: 0.62, medium: 0.75, large: 0.88, xlarge: 1 }
// the window shapes, in narrow bands: each moves the card by the crop of a window of its middle shape
const BANDS = Array.from({ length: 60 }, (_, i) => [0.5 + i * 0.05, i === 59 ? 9 : 0.55 + i * 0.05])
// a spot the person chose with a double click: { fx, fy }, the card's centre as fractions of the window
const ratio = r => `${Math.round(r * 1000)}/1000`
function scene(u, now, spot, size, opacity, lang, style, place, hint) {
  L = TEXT[lang] ?? TEXT.es
  CARD_OPACITY = { solid: 1, normal: 0.9, glass: 0.62 }[opacity] ?? 0.9
  const at = SPOT_AT[spot] ?? SPOT_AT['bottom-right'], k = SIZES[size] ?? SIZES.small
  let fg = '', css = ''
  {
    const c = !u ? waitingCard(now) : style === 'compact' ? compactCard(u, now) : card(u, now), w = 300 * k, h = c.h * k
    // while /bateria-mover waits: a pulsing frame round the card and a label over it
    if (hint) c.body += `<g class="cb-move"><rect x="-8" y="-8" width="316" height="${c.h + 16}" rx="30" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="10 8"/>`
      + `<rect x="10" y="-52" width="280" height="34" rx="17" fill="#ffffff"/><text x="150" y="-29" font-size="16" font-weight="600" text-anchor="middle" fill="#0b1717">${hint}</text></g>`
    if (place) {
      // the scene is 1600 x 1000 cut to the window: the point (fx, fy) of the window lands somewhere else
      // in the scene for each shape of window, so each band of shapes moves the card to the right place
      const fx = Math.max(0.05, Math.min(0.95, place.fx)), fy = Math.max(0.05, Math.min(0.95, place.fy))
      fg = `<g class="cb-at"><g transform="translate(${n2(fx * 1600 - w / 2)} ${n2(fy * 1000 - h / 2)}) scale(${k})">${c.body}</g></g>`
      for (const [lo, hi] of BANDS) {
        const r = hi > 5 ? 3.6 : (lo + hi) / 2
        const dx = r < 1.6 ? (fx - 0.5) * (1000 * r - 1600) : 0, dy = r > 1.6 ? (fy - 0.5) * (1600 / r - 1000) : 0
        if (Math.abs(dx) + Math.abs(dy) > 0.5) css += `@media (min-aspect-ratio:${ratio(lo)}) and (max-aspect-ratio:${ratio(hi)}){.cb-at{transform:translate(${n2(dx)}px,${n2(dy)}px)}}`
      }
      return wrap(css, fg)
    }
    const x = at.cx - w / 2, y = at.v === 'b' ? at.y + 160 - h : at.v === 'm' ? 500 - h / 2 : at.y
    fg = `<g class="cb-at"><g class="cb-nudge"><g transform="translate(${n2(x)} ${n2(y)}) scale(${k})">${c.body}</g></g></g>`
    // a window narrower than the scene cuts its sides; a wider one, its top and foot: keep the card in the corner
    for (const [lo, hi] of BANDS) {
      const r = hi > 5 ? 3.6 : (lo + hi) / 2
      const dx = r < 1.6 ? (at.h === 'r' ? 500 * r - 800 : 800 - 500 * r) : 0
      const dy = r > 1.6 ? (at.v === 't' ? 500 - 800 / r : at.v === 'b' ? 800 / r - 500 : 0) : 0
      if (dx || dy) css += `@media (min-aspect-ratio:${ratio(lo)}) and (max-aspect-ratio:${ratio(hi)}){.cb-at{transform:translate(${n2(dx)}px,${n2(dy)}px)}}`
    }
    // the chat column keeps its width in pixels, so in a narrow window the strip on its right is thinner:
    // there the card moves a little toward the window's edge to keep clear of the chat
    if (at.h === 'r') css += '@media (min-aspect-ratio:1600/1000) and (max-width:1500px){.cb-nudge{transform:translateX(28px)}}'
      + '@media (min-aspect-ratio:1600/1000) and (max-width:1300px){.cb-nudge{transform:translateX(51px)}}'
  }
  return wrap(css, fg)
}
const wrap = (css, fg) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">'
  + `<style>${css}.cb-move{animation:cb-move 1s ease-in-out infinite alternate}@keyframes cb-move{from{opacity:.4}to{opacity:1}}</style><g font-family="-apple-system,system-ui,sans-serif">${fg}</g></svg>`

// ---------- the card alone, for the panel: its own small SVG, a fixed width in pixels ----------
const PANEL_W = { tiny: 180, small: 220, medium: 260, large: 300, xlarge: 340 }
function cardSvg(u, now, opacity, lang, style) {
  L = TEXT[lang] ?? TEXT.es
  CARD_OPACITY = { solid: 1, normal: 0.9, glass: 0.62 }[opacity] ?? 0.9
  const c = style === 'compact' ? compactCard(u, now) : card(u, now)
  // a margin of 16 all round leaves room for Clawd's hop and the sleeping z's
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -16 332 ${c.h + 32}"><g font-family="-apple-system,system-ui,sans-serif">${c.body}</g></svg>`
}
// a line of text, where no SVG is drawn (the terminal, where an Svg draws as nothing)
function cardLine(u, now, lang) {
  L = TEXT[lang] ?? TEXT.es
  const lim = u.rateLimits ?? [], week = lim.find(r => /seven|7|week/.test(r.kind)), five = lim.find(r => /five|5/.test(r.kind)), main = week ?? five
  const left = main ? Math.max(0, Math.min(100, Math.round(100 - main.percentUsed))) : Math.max(0, Math.min(100, Math.round(100 - (u.context?.percent ?? 0))))
  return `${week ? L.week : five ? L.five : L.ctx}: ${left}% ${L.left.toLowerCase()}`
}
// ---------- the settings: the plugin's options, with what /bateria-ajustes changed on top ----------
const CHOICES = {
  mode: ['auto', 'panel', 'fondo'],
  position: ['bottom-right', 'right', 'top-right', 'bottom-left', 'left', 'top-left'],
  size: ['tiny', 'small', 'medium', 'large', 'xlarge'],
  style: ['full', 'compact'],
  opacity: ['solid', 'normal', 'glass'],
  language: ['es', 'en'],
  mobile: ['hide', 'show'],
}
const DEFAULTS = { mode: 'auto', position: 'bottom-right', size: 'small', style: 'full', opacity: 'normal', language: 'es', mobile: 'hide' }
// the Spanish words a person may type for a setting or a value
const KEY_ALIAS = { modo: 'mode', posicion: 'position', 'posición': 'position', sitio: 'position', 'tamaño': 'size', tamano: 'size', estilo: 'style', opacidad: 'opacity', fondo: 'opacity', idioma: 'language', movil: 'mobile', 'móvil': 'mobile' }
const VALUE_ALIAS = {
  automatico: 'auto', 'automático': 'auto',
  'abajo-derecha': 'bottom-right', derecha: 'right', 'arriba-derecha': 'top-right', 'abajo-izquierda': 'bottom-left', izquierda: 'left', 'arriba-izquierda': 'top-left',
  diminuto: 'tiny', 'pequeño': 'small', pequeno: 'small', mediano: 'medium', grande: 'large', 'muy-grande': 'xlarge', enorme: 'xlarge',
  completo: 'full', compacto: 'compact', solido: 'solid', 'sólido': 'solid', cristal: 'glass',
  ocultar: 'hide', oculto: 'hide', mostrar: 'show', visible: 'show', 'español': 'es', espanol: 'es', 'inglés': 'en', ingles: 'en',
}
const SETTINGS = 'settings' // $.store: what /bateria-ajustes changed
const LABEL = { mode: 'modo', position: 'posición', size: 'tamaño', style: 'estilo', opacity: 'opacidad', language: 'idioma', mobile: 'móvil' }
async function settingsOf($, options) {
  let saved = {}
  try { const v = await $.store.get(SETTINGS); if (v && typeof v === 'object') saved = v } catch {}
  const out = {}
  for (const k of Object.keys(CHOICES)) {
    const v = saved[k] ?? options?.[k]
    out[k] = CHOICES[k].includes(v) ? v : DEFAULTS[k]
  }
  return out
}
const sayIn = (lang, es, en) => (lang === 'en' ? en : es)

// ---------- the mod ----------
const SCENE = 'uso-bateria'
const PANE = 'bateria'
const PLACE = 'place' // $.store: { fx, fy, position }, where /bateria-mover put the background card
const MOVING = 'moving' // $.store: true while /bateria-mover waits for the click
let timer = null
// the panel asks to start small (a widget in a corner of the chat area) and paints nothing under the card
function openPane($, lang) {
  return $.ui.open({ id: PANE, title: sayIn(lang, 'Batería', 'Battery'), placement: 'widget', backgroundColor: 'transparent' })
}
// the background needs the theme's backdrop: set once a session, as a set replaces the whole theme
function setBackdrop($) {
  return $.theme.set({ backdrop: { scene: SCENE, glass: false } })
}
export const register = (on, options) => {
  // this session's state: whether the backdrop is set, and whether the app shows the panel
  let fondoOn = false, paneShown = false, askedOpen = false
  // what the app answered, for /bateria-diagnostico
  const diag = { open: 'sin pedir', theme: 'sin pedir' }
  const seen = r => (r == null ? 'sin respuesta' : r.error ? 'error: ' + r.error : JSON.stringify(r))

  on('session.start', async ($, e, next) => {
    const s = await settingsOf($, options)
    if (s.mode === 'fondo') { diag.theme = seen(await setBackdrop($).catch(err => ({ error: String(err?.message ?? err) }))); fondoOn = true }
    else {
      // the panel touches no theme: it sits beside any background, and the app moves it as panels open and close
      const r = await openPane($, s.language).catch(err => ({ error: String(err?.message ?? err) })); diag.open = seen(r)
      paneShown = r?.isPlaced === true
      // auto: where the app does not show the panel, the card goes on the background instead
      if (s.mode === 'auto' && !paneShown) { diag.theme = seen(await setBackdrop($).catch(err => ({ error: String(err?.message ?? err) }))); fondoOn = true }
    }
    await $.store.delete(MOVING) // a move left waiting in an earlier session is dropped
    const l = s.language
    await $.command.register({ name: 'bateria', description: sayIn(l, 'Abre la batería si la cerraste', 'Open the battery if you closed it') })
    await $.command.register({ name: 'bateria-ajustes', description: sayIn(l, 'Cambia la batería: tamaño, posición, estilo, modo, idioma…', 'Change the battery: size, position, style, mode, language…'), argumentHint: sayIn(l, '[ajuste valor]', '[setting value]') })
    await $.command.register({ name: 'bateria-mover', description: sayIn(l, 'Mueve la batería: el siguiente clic en un hueco vacío la coloca (en el fondo)', 'Move the battery: the next click on an empty spot places it (on the background)') })
    await $.command.register({ name: 'bateria-diagnostico', description: sayIn(l, 'Explica por qué no se ve la batería: qué contesta la app', 'Why the battery does not show: what the app answered') })
    await $.command.register({ name: 'bateria-reset', description: sayIn(l, 'Devuelve la batería a la posición de los ajustes', 'Put the battery back where the settings say') })
    timer ??= $.clock.every(60000, () => $.ui.invalidate('ui.render')) // the reset clock moves each minute
    return next(e)
  })

  on('command.run', { command: 'bateria' }, async $ => {
    const s = await settingsOf($, options), l = s.language
    if (s.mode === 'fondo') return { text: sayIn(l, 'La batería está en el fondo de la ventana (modo fondo). Para cambiarla de sitio, usa /bateria-mover.', 'The battery is on the window background (fondo mode). To move it, use /bateria-mover.') }
    const r = await openPane($, l).catch(err => ({ error: String(err?.message ?? err) })); diag.open = seen(r)
    if (r?.isPlaced === true) { paneShown = true; $.ui.invalidate('ui.render'); return { text: sayIn(l, 'Batería abierta.', 'Battery opened.') } }
    if (!fondoOn) { diag.theme = seen(await setBackdrop($).catch(err => ({ error: String(err?.message ?? err) }))); fondoOn = true }
    $.ui.invalidate('ui.render')
    return { text: sayIn(l, 'La app no muestra paneles aquí, así que la batería va en el fondo de la ventana.', 'The app shows no panels here, so the battery goes on the window background.') }
  })

  on('command.run', { command: 'bateria-ajustes' }, async ($, e) => {
    const before = await settingsOf($, options)
    const words = String(e.args ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean)
    let saved = {}
    try { const v = await $.store.get(SETTINGS); if (v && typeof v === 'object') saved = { ...v } } catch {}
    const l0 = before.language
    if (words[0] === 'reset' || words[0] === 'restablecer') {
      await $.store.delete(SETTINGS)
      $.ui.invalidate('ui.render')
      return { text: sayIn(l0, 'Ajustes de /bateria-ajustes borrados: vuelven los del plugin.', 'Settings from /bateria-ajustes cleared: the plugin options are back.') }
    }
    const errors = []
    for (let n = 0; n + 1 < words.length; n += 2) {
      const key = KEY_ALIAS[words[n]] ?? words[n], value = VALUE_ALIAS[words[n + 1]] ?? words[n + 1]
      if (!CHOICES[key]) { errors.push(sayIn(l0, `No conozco el ajuste "${words[n]}".`, `Unknown setting "${words[n]}".`)); continue }
      if (!CHOICES[key].includes(value)) { errors.push(sayIn(l0, `"${words[n + 1]}" no vale para ${LABEL[key]}: usa ${CHOICES[key].join(', ')}.`, `"${words[n + 1]}" is not a ${key}: use ${CHOICES[key].join(', ')}.`)); continue }
      saved[key] = value
    }
    if (words.length % 2 === 1) errors.push(sayIn(l0, `Falta el valor de "${words[words.length - 1]}".`, `"${words[words.length - 1]}" needs a value.`))
    if (words.length > 1) await $.store.set(SETTINGS, saved)
    const s = await settingsOf($, options), l = s.language
    // a new mode takes effect at once
    if (s.mode !== before.mode) {
      if (s.mode === 'fondo') { await $.ui.close({ id: PANE }).catch(() => {}); paneShown = false; if (!fondoOn) { diag.theme = seen(await setBackdrop($).catch(err => ({ error: String(err?.message ?? err) }))); fondoOn = true } }
      else {
        const r = await openPane($, l).catch(err => ({ error: String(err?.message ?? err) })); diag.open = seen(r)
        paneShown = r?.isPlaced === true
        if (s.mode === 'auto' && !paneShown && !fondoOn) { diag.theme = seen(await setBackdrop($).catch(err => ({ error: String(err?.message ?? err) }))); fondoOn = true }
      }
    }
    $.ui.invalidate('ui.render')
    const list = Object.keys(CHOICES).map(k => `  ${sayIn(l, LABEL[k], k)}: ${s[k]}   (${CHOICES[k].join(' · ')})`).join('\n')
    const help = sayIn(l,
      'Para cambiar uno: /bateria-ajustes tamaño medium (o grande, mediano, pequeño…). Varios a la vez: /bateria-ajustes tamaño large estilo compact. Para volver a los del plugin: /bateria-ajustes reset.',
      'To change one: /bateria-ajustes size medium. Several at once: /bateria-ajustes size large style compact. Back to the plugin options: /bateria-ajustes reset.')
    return { text: [...errors, sayIn(l, 'Ajustes de la batería:', 'Battery settings:'), list, help].join('\n') }
  })

  on('command.run', { command: 'bateria-mover' }, async $ => {
    const s = await settingsOf($, options), l = s.language
    if (!fondoOn || paneShown) return { text: sayIn(l, 'La batería está en un mini panel, que coloca la app y que se mueve solo cuando abres o cierras paneles. Para elegir tú el sitio con el ratón, cambia al fondo: /bateria-ajustes modo fondo.', 'The battery is in a small panel the app places and moves as panels open and close. To choose the spot with the mouse, switch to the background: /bateria-ajustes mode fondo.') }
    if ((await $.store.get(MOVING)) === true) { // typed again: the move is called off
      await $.store.delete(MOVING)
      $.ui.invalidate('ui.render')
      return { text: sayIn(l, 'Movimiento cancelado: la batería se queda donde estaba.', 'Move cancelled: the battery stays where it was.') }
    }
    await $.store.set(MOVING, true)
    $.ui.invalidate('ui.render')
    return { text: sayIn(l, 'Haz clic en un hueco vacío de la ventana y la batería se colocará ahí. Para cancelar, vuelve a escribir /bateria-mover.', 'Click an empty spot of the window and the battery goes there. To cancel, type /bateria-mover again.') }
  })
  on('command.run', { command: 'bateria-diagnostico' }, async $ => {
    const s = await settingsOf($, options)
    let usage = 'sin datos'
    try {
      const u = await $.session.usage()
      if (u) usage = (u.rateLimits ?? []).map(r => `${r.kind}: ${Math.round(100 - r.percentUsed)}% queda`).join(', ') || `sin límites de plan; contexto usado ${u.context?.percent ?? '?'}%`
    } catch (err) { usage = 'error: ' + String(err?.message ?? err) }
    let panes = '?'
    try { panes = JSON.stringify(await $.ui.panes()) } catch (err) { panes = 'error: ' + String(err?.message ?? err) }
    return { text: [
      'Diagnóstico de la batería:',
      `  modo: ${s.mode} · tamaño: ${s.size} · estilo: ${s.style} · posición: ${s.position}`,
      `  mini panel pedido → la app contestó: ${diag.open}`,
      `  mini panel mostrado: ${paneShown ? 'sí' : 'no'} · paneles: ${panes}`,
      `  fondo pedido → la app contestó: ${diag.theme}`,
      `  datos de uso: ${usage}`,
    ].join('\n') }
  })
  on('command.run', { command: 'bateria-reset' }, async $ => {
    const s = await settingsOf($, options)
    await $.store.delete(PLACE)
    await $.store.delete(MOVING)
    $.ui.invalidate('ui.render')
    return { text: sayIn(s.language, 'La batería vuelve a la posición de los ajustes.', 'The battery is back where the settings say.') }
  })
  // while /bateria-mover waits, the next click on the bare background places the card there
  on('ui.pointer', async ($, e, next) => {
    if (e.scene !== SCENE || e.surface !== 'desktop') return next(e)
    if ((await $.store.get(MOVING)) === true) {
      const s = await settingsOf($, options)
      await $.store.set(PLACE, { fx: e.x, fy: e.y, position: s.position })
      await $.store.delete(MOVING)
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })
  // an app may leave a pane opened unasked undrawn; one opened with the person's first message is theirs
  // whatever happens here, the message always goes on: next(e) runs outside the try
  on('prompt.submit', async ($, e, next) => {
    if (!askedOpen) {
      askedOpen = true
      try {
        const s = await settingsOf($, options)
        if (s.mode !== 'fondo') {
          const r = await openPane($, s.language).catch(err => ({ error: String(err?.message ?? err) })); diag.open = seen(r)
          if (r?.isPlaced === true && !paneShown) { paneShown = true; $.ui.invalidate('ui.render') }
        }
      } catch {}
    }
    return next(e)
  })
  // the figures moved (after each answer, or a window moved a point): draw the battery again
  on('session.measure', ($, e, next) => { $.ui.invalidate('ui.render'); return next(e) })

  // the panel: the card alone, at a fixed width, wherever the app seats the pane
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Text, Svg } = $.ui.resolve(e)
    const s = await settingsOf($, options), l = s.language
    let u = null
    try { u = await $.session.usage() } catch {}
    const now = await $.clock.now()
    if (!u) return Text({ dimColor: true, children: sayIn(l, 'La batería aparece tras la primera respuesta.', 'The battery shows after the first answer.') })
    if (e.surface === 'terminal' || (e.surface === 'mobile' && s.mobile !== 'show')) return Text({ children: cardLine(u, now, l) })
    return Svg({ source: cardSvg(u, now, s.opacity, l, s.style), alt: (TEXT[l] ?? TEXT.es).alt, width: PANEL_W[s.size], isInteractive: true })
  })

  // the background: the card painted in the window's backdrop (mode "fondo", or "auto" where no panel shows)
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== $.plugin.name || e.props.scene !== SCENE) return next(e)
    const s = await settingsOf($, options), l = s.language
    if (s.mode === 'panel' || (s.mode === 'auto' && paneShown)) return next(e) // the panel shows it: an empty background
    // a phone has no free strip beside the chat: there the card would sit behind the messages, so it shows
    // on the desktop app only, unless the person turns it on for the phone too
    if (e.surface !== 'desktop' && !(e.surface === 'mobile' && s.mobile === 'show')) return next(e)
    let u = null
    try { u = await $.session.usage() } catch {} // no figures yet: nothing drawn
    // a spot chosen with /bateria-mover holds until the person picks another position
    let place = null, moving = false
    try { const p = await $.store.get(PLACE); if (p && typeof p.fx === 'number' && p.position === s.position) place = p } catch {}
    try { moving = e.surface === 'desktop' && (await $.store.get(MOVING)) === true } catch {}
    const { Svg } = $.ui.resolve(e)
    const source = scene(u, await $.clock.now(), s.position, s.size, s.opacity, l, s.style, e.surface === 'desktop' ? place : null, moving ? sayIn(l, 'Haz clic donde quieras ponerme', 'Click where you want me') : null)
    return Svg({ source, alt: (TEXT[l] ?? TEXT.es).alt, isInteractive: true })
  })
}
export { card, compactCard, scene, cardSvg }
