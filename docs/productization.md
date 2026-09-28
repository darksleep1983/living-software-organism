# CLI and agent workflow

LSO is read-only by default. Its job is to keep project-owned continuity inspectable and provide bounded diagnostics and recovery evidence.

You do not need the biological vocabulary to use the CLI.

## Everyday workflow

Once per project:

```sh
npm install living-software-organism@0.1.0-rc.3
npx lso init --dry-run
npx lso init --yes
```

Then, for normal work:

1. The agent reads `AGENTS.md`, `.project-corpus/state/PROJECT.md` and `.project-corpus/state/STATUS.md`.
2. If STATUS names an active Task, read that exact Task and only the evidence it references.
3. Make the requested project change under the project's own authority.
4. Use `lso doctor` or `lso status` as a fresh consistency check.

A Task/Report is **not** required for every tiny change by LSO itself. Use one when the local project protocol requires it or the work is substantial, delegated, risky, resumable, or needs durable verification.

## Human-facing commands

- `lso doctor [path]`: project identity, continuity, health and recovery evidence.
- `lso status [path]`: compact snapshot.
- `lso findings [path]`: proposal-only issues and next actions.

Add `--json` for stable machine-readable output.

## Agent handoff

`lso context [path] --json` returns bounded pointers, fingerprints, health and findings. It is an index into project-owned authority, not a replacement for it.

A model-neutral sequence is:

```text
context pointers
-> read project authority
-> perform bounded work
-> fresh verification
```

Codex, Claude, Gemini, OpenHands and other agents can use the same flow without provider SDK integration.

## Recovery evidence

- `recover plan` describes known/missing inputs and does not execute commands.
- `recover deps` shows descriptive dependency declarations.
- `recover rehearse` copies the declared substrate into isolated runtime storage and verifies it. It never restores live state.
- `origin verify` is an explicit network action that verifies declared Git source bytes against an exact commit.

Source verification is not whole-system recovery. Toolchains, secrets, services, durable data and deployment environments need their own evidence.

## Configuration

`lso.config.json` binds the project ID, adapter and confined runtime path. Optional recovery declarations are descriptive. Executable commands and secret-looking values are rejected.

Project identity and current state remain owned by the project files, not duplicated into LSO configuration.

## Plain language and architecture names

The stable implementation keeps existing API names for compatibility:

| API/architecture name | Plain meaning |
|---|---|
| `homeostasis` | Project health |
| `repair` | Frozen supervised repair intent and verification |
| `capabilities` | Explicit capability eligibility/binding |
| `immune` | Verified reusable lesson evidence |
| `metabolism` | Resource budgets and observations |
| `history` | Change-only health history |
| `recovery` | Recovery readiness and isolated rehearsal |
| experimental hygiene/autophagy | Cleanup planning only |
| capsule | Bounded reconstruction evidence |
| trace | Causal evidence tracing |
| phenotype | Declared property comparison |

These names are advanced architecture vocabulary. They are not required for the everyday CLI path.

## Safety

LSO does not automatically repair, dispatch work, execute arbitrary shell commands, run a daemon, delete files, restore live state, switch providers, spend money or publish. `origin verify` is the only explicit network verifier in the CLI.

Package `0.1.0-rc.3` is a prerelease. Architecture remains v0.1-v0.7; experimental Organ Systems remain unversioned; Project Corpus remains Protocol 2.0 with optional Runtime 2.2.0.

See [Getting started](getting-started.md), [architecture](architecture.md), [safety](../components/organism/docs/safety.md), and [recovery](../components/organism/docs/recovery.md).
