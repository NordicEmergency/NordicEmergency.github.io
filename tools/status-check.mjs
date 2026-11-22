#!/usr/bin/env node
// Checks every service in docs/data/status.json from outside and writes the status page's data:
//   node tools/status-check.mjs <previous status.json or -> <output status.json>
// Run every few minutes by .github/workflows/status.yml, which keeps the file on the status-data branch.
// A probe passes on a 2xx answer within TIMEOUT_MS (redirects followed); a failed probe is retried once.
// A service is ok when all its probes pass, down when none does, degraded otherwise or when slow.
// The file holds the current state, a count per day (90 days, Danish time) and the latest incidents.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/status.json'), 'utf8'))
const [prevPath, outPath] = process.argv.slice(2)
if (!outPath) {
  console.error('Usage: node tools/status-check.mjs <previous status.json or -> <output status.json>')
  process.exit(2)
}

const TIMEOUT_MS = 10_000
const SLOW_MS = 5_000
const RETRY_DELAY_MS = 5_000
const DAYS_KEPT = 90
const INCIDENTS_KEPT = 30
const RANK = { ok: 0, degraded: 1, down: 2 }

function readPrevious() {
  if (!prevPath || prevPath === '-' || !fs.existsSync(prevPath)) return {}
  try {
    return JSON.parse(fs.readFileSync(prevPath, 'utf8'))
  } catch {
    return {}
  }
}

async function probeOnce(url) {
  const started = performance.now()
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'NES status check (+https://nordicemergency.dk/status/)', 'Cache-Control': 'no-cache' },
    })
    await res.arrayBuffer()
    return { ok: res.ok, ms: Math.round(performance.now() - started), code: res.status }
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - started), error: e.name }
  }
}

async function probe(url) {
  const first = await probeOnce(url)
  if (first.ok) return first
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
  return probeOnce(url)
}

async function checkService(service) {
  const results = await Promise.all(service.probes.map(probe))
  const passed = results.filter((r) => r.ok)
  const ms = Math.max(...results.map((r) => r.ms))
  let status = 'degraded'
  if (passed.length === 0) status = 'down'
  else if (passed.length === results.length) status = ms > SLOW_MS ? 'degraded' : 'ok'
  for (const [i, r] of results.entries()) {
    console.log(`${service.id} ${service.probes[i]} ${r.ok ? 'ok' : 'FAIL'} ${r.code ?? r.error} ${r.ms} ms`)
  }
  return { status, ms }
}

/** The calendar day in Denmark, as YYYY-MM-DD. */
const danishDay = (date) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)

const prev = readPrevious()
const now = new Date()
const nowIso = now.toISOString()
const today = danishDay(now)

const checked = await Promise.all(config.services.map(async (s) => [s.id, await checkService(s)]))

const services = {}
const days = prev.days || {}
const incidents = prev.incidents || []
days[today] ||= {}

for (const [id, { status, ms }] of checked) {
  const before = prev.services?.[id]
  const since = before && before.status === status ? before.since : nowIso
  services[id] = { status, since, ms }

  // Per day: [checks, degraded, down]
  const count = (days[today][id] ||= [0, 0, 0])
  count[0]++
  if (status === 'degraded') count[1]++
  if (status === 'down') count[2]++

  const open = incidents.find((x) => x.id === id && !x.end)
  if (status === 'ok') {
    if (open) open.end = nowIso
  } else if (open) {
    if (RANK[status] > RANK[open.status]) open.status = status
  } else {
    incidents.unshift({ id, status, start: nowIso })
  }
}

// Services no longer in the config drop out of the current state but keep their history.
const keepDays = Object.keys(days).sort().slice(-DAYS_KEPT)
const oldest = keepDays[0]
const data = {
  checkedAt: nowIso,
  intervalMinutes: config.interval_minutes,
  services,
  days: Object.fromEntries(keepDays.map((d) => [d, days[d]])),
  incidents: incidents.filter((x) => !x.end || danishDay(new Date(x.end)) >= oldest).slice(0, INCIDENTS_KEPT),
}

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(data) + '\n')
console.log(`Wrote ${outPath}: ${checked.map(([id, r]) => `${id}=${r.status}`).join(', ')}`)
