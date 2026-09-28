# Living Software Organism - repository protocol

This repository contains the unified Living Software Organism stack.

## Architecture boundary

Project Corpus is the durable project-owned substrate for identity, continuity, authority and context. It remains independently usable.

The organism component derives bounded health, supervised repair, recovery, history and experimental organ-system evidence through explicit adapters. It never becomes semantic authority over Project Corpus or a consuming project.

The software project is the durable organism. AI models, providers and executors are replaceable temporary organs.

## Authority order

1. System/developer instructions and the explicit current Owner request.
2. This AGENTS.md for repository workflow and safety.
3. Local ignored .project-corpus/state/PROJECT.md and STATUS.md for repository-maintenance continuity.
4. The exact active local Task and its referenced Reports.
5. Public component contracts, source, tests and documentation.
6. Fresh filesystem, Git, runtime and test evidence for mutable facts.

Reports and executor summaries are claims until checked against direct evidence.

## START

Before substantive work:

1. confirm this exact repository root and local Git top-level;
2. read this file and local ignored PROJECT, STATUS, policy and active Task in full;
3. identify which component owns the requested responsibility;
4. read relevant component contracts/source/tests in full;
5. fresh-check Git status and task-relevant runtime/test evidence.

Do not infer publication authority from local implementation authority.

## Component ownership

- components/project-corpus owns Project Corpus Protocol, optional Python Runtime, templates, docs and component release history.
- components/organism owns LSO stable v0.1-v0.7 contracts and experimental unversioned Organ Systems.
- root docs and examples own the integration story and monorepo developer experience.
- Project Corpus and organism versioning remain separate unless the Owner explicitly changes that architecture.

## Safety

Derived health, repair intent, readiness, traces, capsules, history and phenotype are evidence only.

No implicit shell, network listener, background polling, deletion, live restore, automatic repair/dispatch, provider switching, billing or publication authority is allowed.

Path-sensitive organism operations remain confined to an explicit project root and fail closed on traversal and link/reparse ambiguity.

## Git

- Work only in this exact repository.
- Check top-level, HEAD, status and complete task diff before staging.
- Stage only exact reviewed files. Do not use blanket add.
- Local commits require an Owner-authorized Task.
- Push, remote creation, tag, release, registry publication, repository archive/delete and settings changes require separate explicit Owner authority.
- Local .project-corpus continuity is root-only and ignored by product Git.
- Nested .project-corpus directories inside the Project Corpus component are public templates/fixtures and must remain versioned.

## Licensing

The umbrella repository and organism layer are MIT-licensed under the root LICENSE; the organism package also carries its MIT component license.

The embedded Project Corpus component retains its own MIT license and attribution. Licensing does not grant publication authority: push, tags, releases and registry publication remain separately Owner-controlled under the Git gates above.

## CLOSE

Fresh-check Git, tests and active continuity. Record direct evidence, current blockers and one exact next action. If no work remains, set local lifecycle PAUSED, Active Task NONE and next action NONE. Publication is never implied by CLOSE.
