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
const BACKDROP = { plugin: 'usage-battery-solo', component: 'Backdrop', props: { scene: 'usage-battery-solo', plugin: 'usage-battery-solo', glass: false } } as const
const source = async (ui: { drawn: () => Promise<any> }) => String((await ui.drawn()).props?.source ?? '')

test('the theme is set once, and the battery redraws when usage moves', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  let sets = 0, week = 8
  on('theme.set', () => (sets++, { value: { isDrawn: true, requestId: 'bg' } }))
  on('session.usage', () => ({ value: usage(week) }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: undefined }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  const first = await source(ui)
  expect(first).toContain('QUEDA')
  expect(first.length).toBeLessThan(131072)

  week = 85 // 15% left: a different battery
  await $.session.measure({ ...usage(week), changed: ['rateLimits'] } as any)
  await clock.settle()
  expect(await source(ui)).not.toBe(first)

  await clock.advance(5 * 60000) // five minutes of the reset clock
  expect(sets).toBe(1) // never set again: another mod's colors would go
  await ui.unmount()
})

test('the terminal and another scene are left alone', async ($, on) => {
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e as any); return Text({ children: 'engine' }) })
  const term = await $.ui.mount({ ...BACKDROP, surface: 'terminal' })
  expect((await term.find({ type: 'Text' }))?.text).toBe('engine')
  await term.unmount()
  const other = await $.ui.mount({ ...BACKDROP, props: { scene: 'lagoon', plugin: 'usage-battery-solo', glass: false }, surface: 'desktop' })
  expect((await other.find({ type: 'Text' }))?.text).toBe('engine')
  await other.unmount()
})

test('on the phone the card stays hidden unless turned on', async ($, on) => {
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e as any); return Text({ children: 'engine' }) })
  const phone = await $.ui.mount({ ...BACKDROP, surface: 'mobile' })
  expect((await phone.find({ type: 'Text' }))?.text).toBe('engine')
  await phone.unmount()
})

test('a spot chosen with a double click puts the card there, in any shape of window', async () => {
  const svg = scene(usage(30), NOW, 'bottom-right', 'small', 'normal', 'es', 'compact', { fx: 0.75, fy: 0.9 })
  expect(svg).toContain('translate(1107') // 0.75 x 1600, less half the small card (93)
  expect(svg).toContain('min-aspect-ratio') // corrected for windows of other shapes
  expect(svg.length).toBeLessThan(131072)
})
