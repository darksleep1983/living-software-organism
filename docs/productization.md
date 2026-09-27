# Product CLI, recovery and agent workflow

LSO CLI is a dependency-light, read-only-by-default view over project-owned Project Corpus V2 evidence. Package `0.1.0-rc.1` is a local release candidate; it does not mean architecture v0.8. Stable architecture remains v0.1–v0.7; experimental organ systems are unversioned; Project Corpus remains Protocol 2.0 with optional Runtime 2.2.0.

## Adoption

From an ordinary existing project, install the local package candidate (see [Getting started](getting-started.md)). Run `lso init --dry-run` to inspect exact files, then `lso init` and approve interactively or use `--yes` to approve that deterministic plan. Init creates only the minimal Corpus substrate and `lso.config.json`; it does not install dependencies, execute scripts, or commit. Existing partial/incompatible Corpus state and canonical-file conflicts fail closed. `--json` is machine readable; dry-run makes no writes.

## Command reference

- `lso --help`, `lso version`: help and independent version dimensions.
- `lso doctor [path] [--json]`: read-only health, readiness, findings, recommendations and honest unknowns. Exit codes: 0 acceptable, 1 degraded/invalid, 2 usage, 3 internal failure.
- `lso status [path] [--json]`: compact snapshot.
- `lso context [path] --json`: bounded project/evidence handoff; read the actual mandatory authority files before acting.
- `lso findings [path] [--json]`: bounded findings; repair is proposal only.
- `lso recover plan [path] [--json]`: deterministic evidence plan, no commands run.
- `lso recover deps [path] [--json]`: descriptive declared requirements, never captures secrets.
- `lso recover rehearse [path] [--json]`: isolated rehearsal; never restores canonical state and always retains `restore_authorized: false`.
- `lso origin verify [path] --remote <https-or-ssh-url> --commit <40-hex> --file <tracked-path>`: explicit network action. Uses bounded argv-based Git fetch in owned temp storage; requires matching clean local HEAD/index/worktree and exact tracked-file bytes. Receipts bind explicit files and tracked-tree inventory. URL credentials are rejected/redacted. Remote errors/timeouts and gaps remain UNPROVEN. `file://` is fixture-only and yields `LOCAL_GIT_FIXTURE_VERIFIED`.

A source receipt is not a recovery authorization and does not prove runtime/toolchain, package availability, secrets, services, or data. Whole-system `RECONSTRUCTIBLE` is not derived from Git verification; full recovery remains UNPROVEN/PARTIAL unless every declared requirement is independently evidenced by a sound contract.

## Configuration

`lso.config.json` has a versioned JSON Schema in `components/organism/schemas/lso.config.schema.json`. It binds project ID, the Project Corpus adapter and confined runtime path; optional recovery declarations are descriptive. Unknown keys, unsafe paths and secret-looking values are rejected. Do not place credentials or executable commands in this file. Corpus identity, STATUS and policy remain authoritative in Corpus, not duplicated here.

## Model-neutral agent workflow

1. Start with `lso context --json` for pointers and bounded evidence.
2. Read `AGENTS.md`, current PROJECT/STATUS/policy, and the active Task in the project itself; context output never replaces authority.
3. Work within that authority; create/update only project-owned Tasks/Reports through the project's normal process.
4. Run `lso doctor`, `lso status`, and `lso findings` to inspect results; they do not repair.

Codex: `npx lso context --json` then read the listed project authority before changes. Claude: same CLI envelope and mandatory reads. Gemini/OpenHands or another agent: consume the versioned JSON, then independently read project authority. No provider SDK is needed.

## Safety and troubleshooting

LSO does not auto-repair, execute shell, poll, listen, delete, install dependencies, overwrite canonical files, restore live state, switch providers, bill, or publish. `origin verify` is the sole explicit network verifier. Inspect the exact error/findings and resolve inconsistent Corpus under project authority; do not force-init around it. Project Corpus-only adoption is fully supported without LSO. See [safety](../components/organism/docs/safety.md), [recovery model](../components/organism/docs/recovery.md), and [migration](getting-started.md#project-corpus-only--migration).
