# git-status-line

A Claude Code mod that shows the state of your git repository as a status line entry under the prompt:

```
main ↑2 ↓1 · 3 uncommitted
feature/login · clean
detached at 391bb54 · clean
```

- the current branch (or the short commit when HEAD is detached)
- `↑n` commits ahead of and `↓n` commits behind the upstream branch, when there is one
- the number of uncommitted changes (staged, unstaged and untracked files), or `clean`

Outside a git repository, or when git is not installed, it shows nothing.

## Events it hooks into

| Event | Why |
| --- | --- |
| `session.start` | Shows the status as soon as the session starts. |
| `tool.call` for `Bash`, `PowerShell`, `Edit`, `Write` and `NotebookEdit` | These tools can change the working tree or the branch, so the status is refreshed after each of them finishes. Other tools are not hooked. |

It calls `$.process.run` to run git and `$.ui.status` to set the status line. Site categories: UI, Tool call.

## What it can see

- The output of one command, run in the session's working directory: `git --no-optional-locks status --porcelain=v2 --branch`. That output contains the branch name, the commit id and the paths of changed files. The mod only keeps the branch, the counts and the short commit id.
- It receives the tool calls it hooks (for example the command of a `Bash` call) but does not read, change, block or store them. It passes every call through unchanged.

No network calls, no dependencies, nothing written to disk. Changes you make outside Claude Code (in your editor or another terminal) show up at the next refresh, not immediately.

## Privacy

This mod collects no data. It sends nothing over the network, has no telemetry and writes nothing to disk. What it reads, listed under "What it can see", stays inside your Claude Code session and is gone when the session ends.

Questions or problems: open an issue on GitHub.

## Loading it

Mods are an early-access Claude Code feature and need a recent version (built and tested on 2.1.286).

```bash
git clone https://github.com/modsforclaude/git-status-line
```

```bash
claude --plugin-dir ./git-status-line
```

Listed on [modsforClaude.com](https://modsforclaude.com/mods/git-status-line/), with its review and pinned commit.

## Configuration

None.

## Development

```bash
claude plugin validate /path/to/git-status-line
```

```bash
claude plugin test /path/to/git-status-line
```

The whole mod is [hooks/register.ts](hooks/register.ts).

## License

MIT, see [LICENSE](LICENSE).

Unofficial community mod, not affiliated with Anthropic.
