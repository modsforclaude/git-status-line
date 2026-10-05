import type { EngineInterface, Register } from 'claude-code'

// Tools that can change the working tree or the branch.
const CHANGING_TOOLS = ['Bash', 'PowerShell', 'Edit', 'Write', 'NotebookEdit']

// Turns `git status --porcelain=v2 --branch` output into one status line.
const format = (stdout: string): string => {
  let branch = ''
  let commit = ''
  let sync = ''
  let changes = 0

  for (const line of stdout.split('\n')) {
    if (line.startsWith('# branch.head ')) {
      branch = line.slice('# branch.head '.length).trim()
    } else if (line.startsWith('# branch.oid ')) {
      commit = line.slice('# branch.oid '.length).trim().slice(0, 7)
    } else if (line.startsWith('# branch.ab ')) {
      const [ahead = '+0', behind = '-0'] = line.slice('# branch.ab '.length).trim().split(' ')
      sync = (ahead === '+0' ? '' : ` ↑${ahead.slice(1)}`) + (behind === '-0' ? '' : ` ↓${behind.slice(1)}`)
    } else if (line.trim() !== '' && !line.startsWith('#')) {
      changes += 1
    }
  }

  const name = branch === '(detached)' ? `detached at ${commit}` : branch

  return `${name}${sync} · ${changes === 0 ? 'clean' : `${changes} uncommitted`}`
}

const refresh = async ($: EngineInterface): Promise<void> => {
  try {
    const { exitCode, stdout } = await $.process.run(
      ['git', '--no-optional-locks', 'status', '--porcelain=v2', '--branch'],
      { timeoutMs: 5000 },
    )

    // A non-zero exit code means this is not a git repository: show nothing.
    $.ui.status(exitCode === 0 ? format(stdout) : undefined)
  } catch {
    // Git is not installed or took too long.
    $.ui.status(undefined)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await refresh($)

    return next(e)
  })

  on('tool.call', { tool: CHANGING_TOOLS }, async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })
}
