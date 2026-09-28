# Getting started

Living Software Organism (LSO) keeps project-owned continuity and gives you read-only health and recovery evidence that can survive a switch between AI agents.

Current public release candidate: `0.1.0-rc.3`. Requires Node.js 26+ and npm.

## Five-minute npm adoption

From the project you want to adopt:

```sh
npm install living-software-organism@0.1.0-rc.3
npx lso init --dry-run
npx lso init --yes
npx lso doctor
```

Start with `--dry-run`. It shows exactly what would be created. `--yes` approves only that deterministic plan.

`init` does not install your application dependencies, run project scripts, modify source files, create a Git commit, push, publish, or overwrite an existing compatible canonical file.

The CLI does not require Python. The optional Project Corpus Python Runtime is a separate component.

## What gets added

For a project that does not already have Project Corpus V2, `init` creates the minimal continuity substrate:

```text
AGENTS.md
.project-corpus/state/PROJECT.md
.project-corpus/state/STATUS.md
.project-corpus/policy.toml
.project-corpus/tasks/
.project-corpus/reports/
.project-corpus/history/
lso.config.json
```

The three human-readable files you normally care about first are `AGENTS.md`, `PROJECT.md`, and `STATUS.md`.

The policy and config files bind the tooling safely. Empty Tasks/Reports/history directories are continuity locations, not paperwork quotas.

## Everyday workflow

For small day-to-day work:

1. Keep `AGENTS.md`, `PROJECT.md`, and `STATUS.md` accurate.
2. Let the agent read those files before acting.
3. Use a Task/Report only when the local project protocol requires it or when work is substantial, delegated, risky, resumable across sessions, or needs durable evidence.
4. Run `npx lso doctor` or `npx lso status` when you want a fresh consistency check.

LSO does not require a Task/Report for every trivial edit.

## Main commands

### Everyday

- `lso doctor [path] [--json]` checks project identity, continuity, health and recovery readiness. It writes nothing.
- `lso status [path] [--json]` gives a compact read-only snapshot.
- `lso context [path] --json` gives an agent bounded pointers and evidence. It never replaces reading the actual project authority.
- `lso findings [path] [--json]` shows current proposal-only findings.

### Recovery evidence

- `lso recover plan [path] [--json]` shows verified local inputs, missing items and unproven prerequisites. It executes nothing.
- `lso recover deps [path] [--json]` shows declared recovery dependencies.
- `lso recover rehearse [path] [--json]` performs an isolated rehearsal and always preserves `restore_authorized: false`.
- `lso origin verify [path] --remote <https-or-ssh-git-url> --commit <40-hex> --file <tracked-path>` performs an explicit bounded Git fetch into owned temporary storage and verifies exact declared source bytes.

A successful origin check proves source reacquisition only for the declared files at that URL/commit and time. It does not prove secrets, toolchains, services, data, deployment state or whole-application reconstruction.

## Plain terms first

You can use LSO without learning the biological vocabulary.

- Project identity: what this project is and what rules apply.
- Current state: what is true now and what work is active.
- Health: whether those declarations agree with fresh evidence.
- Recovery evidence: what can actually be verified about the declared project substrate.

Advanced architecture terms such as Homeostasis, Immune Memory, Metabolism, Autophagy and Rebirth Capsule are documented in [architecture](architecture.md). Stable JSON/API names remain unchanged.

## Existing Project Corpus projects

If the project already has a compatible Project Corpus V2 layout, `lso init` adds only the missing LSO configuration. Partial or incompatible Corpus state fails closed rather than being overwritten.

If all you need is durable identity/current-state handoff, Project Corpus can still be used by itself. LSO is optional.

## From a source checkout

From the LSO repository:

```sh
npm pack ./components/organism --pack-destination .
```

Then install that tarball in the project you want to adopt:

```sh
cd /absolute/path/to/your-project
npm install --no-save /absolute/path/to/living-software-organism-0.1.0-rc.3.tgz
npx lso init --dry-run
```

## Repository verification

From the repository root:

```sh
npm test
npm run check
npm run demo
npm run pack:organism
```

## Version and safety boundaries

Package version is `0.1.0-rc.3`. Accepted LSO architecture remains v0.1-v0.7. Experimental Organ Systems remain unversioned. Project Corpus remains Protocol 2.0 with optional Runtime 2.2.0.

LSO does not autonomously repair, execute arbitrary shell commands, poll in the background, delete project files, perform live restore, switch providers, spend money or publish. `doctor` never fetches from the network.

See [CLI and agent workflow](productization.md), [architecture](architecture.md), [API](../components/organism/docs/api.md), and [safety](../components/organism/docs/safety.md).
