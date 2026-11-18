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

test('panel mode (the default): opens a small panel and sets no theme', async ($, on) => {
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

test('panel mode in the terminal: one line of text', async ($, on) => {
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

test('fondo mode: the theme is set once, and the battery redraws when usage moves', { options: { mode: 'fondo' } }, async ($, on) => {
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
