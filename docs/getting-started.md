# Getting started

Living Software Organism (LSO) adds bounded health and recovery evidence around a project-owned continuity substrate. This is a local npm release candidate (`0.1.0-rc.1`), not a published npm package. Requires Node.js 26+ and npm.

## Five-minute adoption from this source checkout

Build the package from the LSO repository:

```sh
npm pack ./components/organism --pack-destination .
```

Change into the existing project you want to adopt, then install the generated tarball by its absolute path (do not run these install/init commands from the LSO monorepo unless you intend to adopt that repository):

```sh
cd /absolute/path/to/your-project
npm install --no-save /absolute/path/to/living-software-organism-0.1.0-rc.1.tgz
npx lso init --dry-run
npx lso init --yes
npx lso doctor
npx lso status
npx lso context --json
npx lso recover plan
npx lso recover rehearse
```

Review the exact `init` plan first. Interactive `init` asks before writing; `--yes` approves only the deterministic paths printed in the plan. `--dry-run` and `--json` never apply writes. Init refuses partial/incompatible Corpus state and never overwrites canonical files. It does not install project dependencies, commit, push, or modify source files.

The commands work without a Python installation. Project Corpus's optional Python Runtime is not a dependency of this CLI.

## Commands and evidence

- `lso doctor [path] [--json]` reads the adapter/core evidence, maps findings to recommendations and returns 0 for stable, 1 for degraded, 2 for usage errors, 3 for internal errors. It writes nothing.
- `lso status [path] [--json]` is the compact read-only snapshot.
- `lso context [path] --json` emits a bounded handoff envelope. It does not replace the project's mandatory reads.
- `lso findings [path] [--json]` shows proposal-only findings.
- `lso recover plan [path] [--json]` describes verified local canonical inputs, missing items and unproven prerequisites; it executes nothing.
- `lso recover deps [path] [--json]` displays declared dependencies. Edit only descriptive non-secret declarations in `lso.config.json`; there is no arbitrary command field.
- `lso recover rehearse [path] [--json]` uses the existing isolated runtime rehearsal and preserves `restore_authorized: false`.
- `lso origin verify [path] --remote <https-or-ssh-git-url> --commit <40-hex> --file <tracked-path>` (or the `recovery.origin` config declaration) explicitly performs a bounded Git fetch into an owned temporary directory. It requires a clean local worktree/index and exact local HEAD. It compares the declared tracked paths byte-for-byte with blobs at that commit and binds the complete tracked tree inventory digest. Output is a receipt, not authority. Network failures/timeouts, missing coverage and changed/uncommitted files remain unverified. Local `file://` origins are accepted only to exercise the verifier with disposable bare-Git fixtures; they report `LOCAL_GIT_FIXTURE_VERIFIED`, never durable reacquisition.

A successful remote check proves only that the declared source files were reacquired from that URL/commit at the verification time. The current experimental Capsule contract does not consume CLI receipts to claim whole-application `RECONSTRUCTIBLE`; keep broader recovery `PARTIAL / REACQUISITION_VERIFIED_FOR_SOURCE` or `UNPROVEN`. No restore or repair is authorized.

## Development checks and demo

At the repository root:

```sh
npm test
npm run check
npm run demo
npm run pack:organism
```

The demo creates an ordinary temporary consumer, initializes it, demonstrates a real missing-continuity degradation and manual recovery, generates a plan and rehearses in isolation, then removes its owned temp project. Pack smoke runs `npm pack`, installs the tarball offline into a clean temporary consumer and exercises the installed CLI outside the repository.

## Project Corpus only / migration

If you only need durable identity, authority, Tasks, Reports and handoff, use `components/project-corpus` directly; LSO is optional. For an existing Project Corpus V2 project, `lso init` adds only the LSO config if its canonical identity and protocol/policy fields agree. For an existing project without Corpus V2, it proposes the embedded current minimal V2 template and requires explicit confirmation. Partial/incompatible Corpus state is refused; resolve it under the project's owner authority rather than asking LSO to rewrite it.

## Version boundaries and limitations

Package version is not architecture version: the package is `0.1.0-rc.1`; accepted LSO architecture remains v0.1–v0.7; experimental organs remain unversioned. Project Corpus stays Protocol 2.0 and optional Runtime 2.2.0. No npm publication occurs as part of this repository task.

LSO does not prove every unlisted build input, secret, runtime service, external data set, or deployment environment. It does not run project build/test commands. Reacquisition is explicit; `doctor` never fetches. See [the product guide](productization.md), [architecture](architecture.md), [API](../components/organism/docs/api.md), and [safety](../components/organism/docs/safety.md).
