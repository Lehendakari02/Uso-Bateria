// Claude battery: Clawd beside a pixel battery of your weekly Claude usage, on the Desktop app's background.
// The art is one SVG redrawn each minute and after each answer; its moves are CSS on the compositor, and every
// cycle divides a minute, so a redraw picks each move up where it was.
const GROUND = '#0b1717'
const n2 = x => +x.toFixed(3)
const mix = (x, y, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(x.slice(i, i + 2), 16) * (1 - t) + parseInt(y.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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
  const reset = !Number.isFinite(wIn) ? '' : `resets ${sameDay ? 'at' : DAYS[at.getDay()]} ${clock(wIn)}`
  const sub = week && five, H = sub ? 178 : 154
  const M = 'font-family="ui-monospace,Menlo,monospace" fill="#ffffff"'
  let body = `<rect width="300" height="${H}" rx="24" fill="${GROUND}" fill-opacity="${CARD_OPACITY}" stroke="#ffffff" stroke-opacity=".12"/>`
    + `<g class="cbw">${CB_CSS}<style>.cbw *{animation-delay:calc(var(--d,0s) - ${n2((now % 60000) / 1000)}s)!important}</style>`
    + `<text x="24" y="33" font-size="11" font-weight="600" letter-spacing="1.3" opacity=".62" ${M}>${week ? 'CLAUDE · WEEKLY' : five ? 'CLAUDE · 5 HOURS' : 'CLAUDE · CONTEXT'}</text>`
    + (reset ? `<text x="276" y="33" font-size="11" text-anchor="end" opacity=".62" ${M}>${reset}</text>` : '')
    + `<g transform="translate(16 74)">${clawd(5, mood)}</g>`
    + battery(116, 60, 150, 48, left, col)
    + pixelText(`${left}%`, 116, 122, 4.5, col)
    + `<text x="${n2(116 + String(left).length * 18 + 26)}" y="144" font-size="11" letter-spacing="1.4" opacity=".55" ${M}>LEFT</text>`
  if (sub) {
    const f = pct(five), fc = f > 50 ? '#6fe08a' : f > 20 ? '#ffc94d' : '#ff5e57', fIn = resetsIn(five)
    body += `<line x1="24" x2="276" y1="156" y2="156" stroke="#ffffff" stroke-opacity=".08"/>`
      + `<text x="24" y="171" font-size="10.5" letter-spacing="1.2" opacity=".55" ${M}>5H</text>`
      + `<g shape-rendering="crispEdges">${Array.from({ length: 10 }, (_, i) => `<rect x="${46 + i * 9}" y="163" width="7" height="8" fill="${i < Math.ceil(f / 10) ? fc : '#ffffff'}" opacity="${i < Math.ceil(f / 10) ? 1 : 0.1}"/>`).join('')}</g>`
      + `<text x="276" y="171" font-size="10.5" text-anchor="end" opacity=".62" ${M}>${f}%${Number.isFinite(fIn) ? ` · refills ${clock(fIn)}` : ''}</text>`
  }
  return { h: H, body: body + '</g>', left }
}

// ---------- the scene: ONLY the card, the rest of the window stays transparent ----------
let CARD_OPACITY = 0.9
// where each spot sits in the 1600 × 1000 scene, and which edges it hugs (the left ones clear the sidebar)
const SPOT_AT = { 'top-right': { x: 1552, y: 48, h: 'r', v: 't' }, right: { x: 1552, y: 380, h: 'r', v: 'm' }, left: { x: 360, y: 380, h: 'l', v: 'm' }, 'bottom-right': { x: 1552, y: 790, h: 'r', v: 'b' }, 'top-left': { x: 360, y: 48, h: 'l', v: 't' }, 'bottom-left': { x: 360, y: 790, h: 'l', v: 'b' } }
const SIZES = { tiny: 0.6, small: 0.8, medium: 1, large: 1.3, xlarge: 1.6 }
const RATIOS = [[0.5, 1], [1, 1.15], [1.15, 1.3], [1.3, 1.45], [1.45, 1.6], [1.6, 1.8], [1.8, 2.05], [2.05, 2.4], [2.4, 3.2], [3.2, 9]]
const ratio = r => `${Math.round(r * 1000)}/1000`
function scene(u, now, spot, size, opacity) {
  CARD_OPACITY = { solid: 1, normal: 0.9, glass: 0.62 }[opacity] ?? 0.9
  const at = SPOT_AT[spot] ?? SPOT_AT['top-right'], k = SIZES[size] ?? 1
  let fg = '', css = ''
  if (u) {
    const c = card(u, now), w = 300 * k, h = c.h * k
    const x = at.h === 'r' ? at.x - w : at.x, y = at.v === 'b' ? at.y + 160 - h : at.v === 'm' ? 500 - h / 2 : at.y
    fg = `<g class="cb-at"><g transform="translate(${n2(x)} ${n2(y)}) scale(${k})">${c.body}</g></g>`
    // a window narrower than the scene cuts its sides; a wider one, its top and foot: keep the card in the corner
    for (const [lo, hi] of RATIOS) {
      const dx = hi <= 1.6 ? (at.h === 'r' ? 500 * lo - 800 : 800 - 500 * lo) : 0
      const dy = lo >= 1.6 ? (at.v === 't' ? 500 - 800 / hi : at.v === 'b' ? 800 / hi - 500 : 0) : 0
      if (dx || dy) css += `@media (min-aspect-ratio:${ratio(lo)}) and (max-aspect-ratio:${ratio(hi)}){.cb-at{transform:translate(${n2(dx)}px,${n2(dy)}px)}}`
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">'
    + `<style>${css}</style><g font-family="-apple-system,system-ui,sans-serif">${fg}</g></svg>`
}

// ---------- the mod ----------
const SCENE = 'usage-battery-solo'
let timer = null
export const register = (on, options) => {
  on('session.start', async ($, e, next) => {
    // the theme is set once: a set replaces the whole theme, so setting it again would wipe another mod's colors
    // no green ground and no forced dark mode: the app keeps its own colors and light/dark mode
    await $.theme.set({ backdrop: { scene: SCENE, glass: false } })
    timer ??= $.clock.every(60000, () => $.ui.invalidate('ui.render')) // the reset clock moves each minute
    return next(e)
  })
  // the figures moved (after each answer, or a window moved a point): draw the battery again
  on('session.measure', ($, e, next) => { $.ui.invalidate('ui.render'); return next(e) })
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== $.plugin.name || e.props.scene !== SCENE) return next(e)
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    let u = null
    try { u = await $.session.usage() } catch {} // no figures yet: the ground alone
    const { Svg } = $.ui.resolve(e)
    return Svg({ source: scene(u, await $.clock.now(), options?.position, options?.size, options?.opacity), alt: 'Claude battery: your weekly usage left', isInteractive: true })
  })
}
export { card, scene }
