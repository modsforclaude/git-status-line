import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const OID = '# branch.oid 391bb54aa0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5'

const AHEAD_AND_DIRTY = [
  OID,
  '# branch.head main',
  '# branch.upstream origin/main',
  '# branch.ab +2 -1',
  '1 .M N... 100644 100644 100644 abc abc README.md',
  '? notes.txt',
  '',
].join('\n')

const CLEAN = [OID, '# branch.head feature/x', ''].join('\n')

const DETACHED = [OID, '# branch.head (detached)', ''].join('\n')

const START = { cwd: '/repo', surface: null, isInteractive: false }

// Stands in for git and the status line: answers `git status` with `stdout`
// and records every status line the mod sets and every command it runs.
const fake = (on: On, stdout: string, exitCode = 0) => {
  const seen = { status: [] as (string | undefined)[], commands: [] as string[] }

  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('process.run', (_, e) => {
    seen.commands.push(e.argv.join(' '))

    return { value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.status', (_, e) => {
    seen.status.push(e.text)

    return { value: undefined }
  })

  return seen
}

test('shows branch, ahead/behind and uncommitted changes at session start', async ($, on) => {
  const seen = fake(on, AHEAD_AND_DIRTY)

  await $.session.start(START)

  expect(seen.status).toEqual(['main ↑2 ↓1 · 2 uncommitted'])
  expect(seen.commands).toEqual(['git --no-optional-locks status --porcelain=v2 --branch'])
})

test('shows a clean branch without an upstream', async ($, on) => {
  const seen = fake(on, CLEAN)

  await $.session.start(START)

  expect(seen.status).toEqual(['feature/x · clean'])
})

test('shows the short commit for a detached HEAD', async ($, on) => {
  const seen = fake(on, DETACHED)

  await $.session.start(START)

  expect(seen.status).toEqual(['detached at 391bb54 · clean'])
})

test('clears the status line outside a git repository', async ($, on) => {
  const seen = fake(on, '', 128)

  await $.session.start(START)

  expect(seen.status).toEqual([undefined])
})

test('refreshes after a tool call that can change the working tree, not after a read', async ($, on) => {
  const seen = fake(on, CLEAN)

  await $.tool.call({ tool: 'Read', file_path: '/repo/README.md' })
  expect(seen.commands.length).toBe(0)

  await $.tool.call({ tool: 'Bash', command: 'git checkout -b feature/x' })
  expect(seen.commands.length).toBe(1)
  expect(seen.status).toEqual(['feature/x · clean'])
})
