import { expect, mock, test } from 'claude-code/testing'
import { scene } from '../hooks/register.js'

const NOW = Date.UTC(2026, 10, 17, 12)
const usage = (week: number) => ({
  context: { window: 200000, percent: 30 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 40, resetsAt: new Date(NOW + 3 * 3600e3).toISOString() },
    { kind: 'seven_day', percentUsed: week, resetsAt: new Date(NOW + 3 * 86400e3).toISOString() },
  ],
})
const PANE = {
  plugin: 'uso-bateria',
  component: 'Pane',
  requestId: 'bateria',
  props: { title: 'Batería', isFocused: false, bodyColumns: 40, placement: 'widget', anchoredEdges: ['bottom', 'right'], scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const
const BACKDROP = { plugin: 'uso-bateria', component: 'Backdrop', props: { scene: 'uso-bateria', plugin: 'uso-bateria', glass: false } } as const
const source = async (ui: { drawn: () => Promise<any> }) => String((await ui.drawn()).props?.source ?? '')
const engine = (on: any, week: () => number) => {
  on('session.usage', () => ({ value: usage(week()) }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('session.measure', (_: unknown, e: any) => ({ changed: e.changed }))
  on('command.register', () => ({ value: undefined }))
  mock.store(on)
}

test('auto mode: opens a small panel and, shown, sets no theme', { options: { mode: 'auto' } }, async ($, on) => {
  mock.clock(on, { now: NOW })
  let opened: any = null, sets = 0
  on('ui.open', (_: unknown, e: any) => ((opened = e), { value: { isPlaced: true } }))
  on('theme.set', () => (sets++, { value: { isDrawn: true, requestId: 'bg' } }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(opened?.placement).toBe('widget')
  expect(sets).toBe(0) // any background stays as it is

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })
  expect(svg?.props?.width).toBe(220)
  expect(String(svg?.props?.source)).toContain('USO SEMANAL')
  await ui.unmount()

})

test('panel mode in the terminal: one line of text', { options: { mode: 'auto' } }, async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.settle()
  const term = await $.ui.mount({ ...PANE, props: { ...PANE.props, placement: 'dock', anchoredEdges: undefined }, surface: 'terminal' } as any)
  await clock.settle()
  expect((await term.find({ type: 'Text' }))?.text).toContain('70%')
  await term.unmount()
})

test('fondo mode (the default): the theme is set once, and the battery redraws when usage moves', { options: { mode: 'fondo' } }, async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  let sets = 0, week = 8
  on('theme.set', () => (sets++, { value: { isDrawn: true, requestId: 'bg' } }))
  engine(on, () => week)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  const first = await source(ui)
  expect(first).toContain('USO SEMANAL')
  expect(first.length).toBeLessThan(131072)

  week = 85 // 15% left: a different battery
  await $.session.measure({ ...usage(week), changed: ['rateLimits'] } as any)
  await clock.settle()
  expect(await source(ui)).not.toBe(first)

  await clock.advance(5 * 60000) // five minutes of the reset clock
  expect(sets).toBe(1) // never set again: another mod's colors would go
  await ui.unmount()
})

test('fondo mode: the terminal, another scene and the phone are left alone', { options: { mode: 'fondo' } }, async ($, on) => {
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e as any); return Text({ children: 'engine' }) })
  for (const [surface, props] of [['terminal', BACKDROP.props], ['desktop', { ...BACKDROP.props, scene: 'lagoon' }], ['mobile', BACKDROP.props]] as const) {
    const ui = await $.ui.mount({ ...BACKDROP, props, surface } as any)
    expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
    await ui.unmount()
  }
})

test('a spot chosen with /bateria-mover puts the card there, in any shape of window', () => {
  const svg = scene(usage(30), NOW, 'bottom-right', 'small', 'normal', 'es', 'compact', { fx: 0.75, fy: 0.9 })
  expect(svg).toContain('translate(1107') // 0.75 x 1600, less half the small compact card (93)
  expect(svg).toContain('min-aspect-ratio') // corrected for windows of other shapes
  expect(svg.length).toBeLessThan(131072)
})

test('while /bateria-mover waits, the card says so', () => {
  const svg = scene(usage(30), NOW, 'bottom-right', 'small', 'normal', 'es', 'full', null, 'Haz clic donde quieras ponerme')
  expect(svg).toContain('Haz clic donde quieras ponerme')
  expect(svg).toContain('cb-move')
})

test('/bateria-mover shows the hint, and typed again calls the move off', { options: { mode: 'fondo' } }, async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'bg' } }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  expect(await source(ui)).not.toContain('Haz clic donde quieras ponerme')

  const first = await $.command.run({ command: 'bateria-mover', args: '' } as any)
  expect(String((first as any)?.text)).toContain('Haz clic en un hueco vacío')
  await clock.settle()
  expect(await source(ui)).toContain('Haz clic donde quieras ponerme')

  const again = await $.command.run({ command: 'bateria-mover', args: '' } as any)
  expect(String((again as any)?.text)).toContain('cancelado')
  await clock.settle()
  expect(await source(ui)).not.toContain('Haz clic donde quieras ponerme')
  await ui.unmount()
})

test('panel mode: the first message opens the panel again, once', { options: { mode: 'auto' } }, async ($, on) => {
  mock.clock(on, { now: NOW })
  let opens = 0
  on('ui.open', () => (opens++, { value: { isPlaced: true } }))
  on('prompt.submit', (_: unknown, e: any) => ({ text: e.text }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(opens).toBe(1)
  await $.prompt.submit({ text: 'hola' } as any)
  await $.prompt.submit({ text: 'otra' } as any)
  expect(opens).toBe(2)
})

test('auto mode: where the app shows no panel, the card goes on the background', { options: { mode: 'auto' } }, async ($, on) => {
  mock.clock(on, { now: NOW })
  let sets = 0
  on('ui.open', () => ({ value: { isPlaced: false, reason: 'no panes here' } }))
  on('theme.set', () => (sets++, { value: { isDrawn: true, requestId: 'bg' } }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets).toBe(1)
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  expect(await source(ui)).toContain('USO SEMANAL')
  await ui.unmount()
})

test('/bateria-ajustes lists the settings and changes them, in Spanish words too', { options: { mode: 'auto' } }, async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'bg' } }))
  on('ui.close', () => ({}))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const list = String(((await $.command.run({ command: 'bateria-ajustes', args: '' } as any)) as any)?.text)
  expect(list).toContain('tamaño: pequeño')

  const changed = String(((await $.command.run({ command: 'bateria-ajustes', args: 'tamaño grande estilo compacto' } as any)) as any)?.text)
  expect(changed).toContain('tamaño: grande')
  expect(changed).toContain('estilo: compacto')
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Svg' }))?.props?.width).toBe(300)
  await ui.unmount()

  const bad = String(((await $.command.run({ command: 'bateria-ajustes', args: 'tamaño gigante' } as any)) as any)?.text)
  expect(bad).toContain('no vale para tamaño')

  const reset = String(((await $.command.run({ command: 'bateria-ajustes', args: 'reset' } as any)) as any)?.text)
  expect(reset).toContain('borrados')
})

test('/bateria-diagnostico says what the app answered', { options: { mode: 'auto' } }, async ($, on) => {
  mock.clock(on, { now: NOW })
  on('ui.open', () => ({ value: { isPlaced: false, reason: 'no panes here' } }))
  on('theme.set', () => ({ value: { isDrawn: false, reason: 'no look drawn' } }))
  on('ui.panes', () => ({ value: [] }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const text = String(((await $.command.run({ command: 'bateria-diagnostico', args: '' } as any)) as any)?.text)
  expect(text).toContain('no panes here')
  expect(text).toContain('no look drawn')
  expect(text).toContain('seven_day: 70% queda')
})

test('before any usage figures, the background shows a waiting card', () => {
  const svg = scene(null, NOW, 'bottom-right', 'small', 'normal', 'es', 'full')
  expect(svg).toContain('esperando datos de uso')
})

test('a window that attaches later gets the panel', { options: { mode: 'auto' } }, async ($, on) => {
  mock.clock(on, { now: NOW })
  let placed = false, opens = 0
  on('ui.open', () => (opens++, { value: placed ? { isPlaced: true } : { isPlaced: false, reason: 'no-surface' } }))
  on('theme.set', () => ({ value: { isDrawn: false, requestId: 'backdrop', reason: 'none attached' } }))
  on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId ?? 'c1' }))
  on('ui.panes', () => ({ value: [] }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  placed = true
  await $.session.attach({ surface: 'desktop', clientId: 'c1' } as any)
  expect(opens).toBe(2)
  const text = String(((await $.command.run({ command: 'bateria-diagnostico', args: '' } as any)) as any)?.text)
  expect(text).toContain('mini panel mostrado: sí')
})

test('in a side panel the card is centred', { options: { mode: 'auto' } }, async ($, on) => {
  mock.clock(on, { now: NOW })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, placement: 'dock', anchoredEdges: undefined }, surface: 'desktop' } as any)
  const box = await ui.find({ type: 'Box' })
  expect(box?.props?.alignItems).toBe('center')
  expect((await ui.find({ type: 'Svg' }))?.props?.width).toBe(220)
  await ui.unmount()
})

test('the settings page Spanish words work: pequeño, compacto, abajo-izquierda', { options: { size: 'grande', style: 'compacto', position: 'abajo-izquierda', mode: 'panel' } }, async ($, on) => {
  mock.clock(on, { now: NOW })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  engine(on, () => 30)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const text = String(((await $.command.run({ command: 'bateria-ajustes', args: '' } as any)) as any)?.text)
  expect(text).toContain('tamaño: grande')
  expect(text).toContain('estilo: compacto')
  expect(text).toContain('posición: abajo-izquierda')
})

const noLimits = { context: { window: 200000, percent: 7 }, rateLimits: [] }
const lastLimits = (resetsIn: number) => ({ lastLimits: { at: NOW, limits: [{ kind: 'seven_day', percentUsed: 98, resetsAt: new Date(NOW + resetsIn).toISOString() }] } })

test('reopened before the first answer: the remembered week shows, not the context', async ($, on) => {
  mock.clock(on, { now: NOW })
  mock.store(on, lastLimits(86400e3))
  on('session.usage', () => ({ value: noLimits }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'bg' } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: undefined }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  const svg = await source(ui)
  expect(svg).toContain('USO SEMANAL')
  expect(svg).not.toContain('CONTEXTO')
  await ui.unmount()
})

test('remembered limits that renewed since: the waiting card, never a wrong figure', async ($, on) => {
  mock.clock(on, { now: NOW })
  mock.store(on, lastLimits(-3600e3))
  on('session.usage', () => ({ value: noLimits }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'bg' } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: undefined }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  expect(await source(ui)).toContain('esperando datos de uso')
  await ui.unmount()
})

test('never had plan limits (an API key): the context window', async ($, on) => {
  mock.clock(on, { now: NOW })
  mock.store(on)
  on('session.usage', () => ({ value: noLimits }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'bg' } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: undefined }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  expect(await source(ui)).toContain('CONTEXTO')
  await ui.unmount()
})

test('once Claude answered with no plan limits (an API key), the context shows, remembered limits or not', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  mock.store(on, lastLimits(86400e3))
  on('session.usage', () => ({ value: noLimits }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'bg' } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: undefined }))
  on('turn.complete', () => ({ text: 'hola' }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  expect(await source(ui)).toContain('USO SEMANAL') // before the first answer: the remembered week
  await $.turn.complete({ reason: 'answer', answer: 'hola', durationMs: 10, isAborted: false, turnId: 't1' } as any)
  await clock.settle()
  expect(await source(ui)).toContain('CONTEXTO') // answered without limits: the context window
  await ui.unmount()
})

test('a gateway spend limit shows as LÍMITE, not as the context', () => {
  const u = { context: { window: 200000, percent: 7 }, rateLimits: [{ kind: 'spend_limit', percentUsed: 40, resetsAt: new Date(NOW + 86400e3).toISOString() }] }
  const svg = scene(u, NOW, 'bottom-right', 'small', 'normal', 'es', 'full')
  expect(svg).toContain('LÍMITE')
  expect(svg).not.toContain('CONTEXTO')
})

test('limits seen in one session are remembered in the next, before its first answer', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  mock.store(on)
  let live = true
  on('session.usage', () => ({ value: live ? usage(98) : noLimits }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'bg' } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('session.measure', (_: unknown, e: any) => ({ changed: e.changed }))
  on('command.register', () => ({ value: undefined }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.session.measure({ ...usage(98), changed: ['rateLimits'] } as any)
  await clock.settle()
  live = false // the app reopened: no limits until the first answer
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  const svg = await source(ui)
  expect(svg).toContain('USO SEMANAL')
  await ui.unmount()
})
