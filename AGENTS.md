# Living Software Organism — project protocol

This file governs work in this repository. The product is an experimental public extraction and reference implementation; it does not grant authority to modify a consuming project's canonical state or to perform external actions.

## Authority order

1. System/developer instructions and the current explicit Owner request.
2. This `AGENTS.md` for workflow, boundaries, and safety.
3. `.project-corpus/state/PROJECT.md` for durable project identity, invariants, scope, and non-goals.
4. `.project-corpus/state/STATUS.md` for current lifecycle, active Task, verified baseline, blockers, and exact next action.
5. The referenced active Task and only the Reports it names, when needed.
6. `README.md`, `docs/`, package metadata, source, tests, and examples for their respective product details.
7. Fresh filesystem, Git, command, and test evidence for mutable facts.

Reports and executor summaries are claims until checked against direct files or command output. Fresh evidence overrides stale status or documentation for mutable facts; record material discrepancies in the next bounded Report and update STATUS to current reality.

## START

Before substantive changes:

1. Confirm the current directory is the repository root by locating this file and checking the local Git top-level when Git is initialized.
2. Read this file, `.project-corpus/state/PROJECT.md`, `.project-corpus/state/STATUS.md`, `.project-corpus/policy.toml`, and the exact active Task in full. Read only its referenced Reports that are needed for the work.
3. Read each relevant public contract or module in full, then inspect fresh source, tests, and Git status for the requested scope.
4. Keep the Project Corpus continuity shell distinct from the public product. `.project-corpus/` is ignored by product Git and carries local working continuity; it is not required at runtime.
5. For a question or small edit, do not load unrelated architecture. For material implementation, record a concise load receipt and semantic summary in the Task or Report.

START is read-only unless the same Owner request explicitly authorizes edits. This protocol does not authorize publication.

## RELOAD

On a reload request, discard prior mutable conclusions and repeat START from fresh files and Git/runtime evidence. Do not reconstruct current state from chat history or old Reports. Stable authority already freshly read during the same active session need not be reread unless it changed.

## CLOSE

When asked to close the session:

1. Fresh-read this file and the local PROJECT, STATUS, policy, active Task, and required Reports.
2. Check the exact repository root, Git HEAD/status, and task-relevant source/test evidence.
3. Record only work completed in this session in a bounded Report; update STATUS to current reality, blockers, evidence, and one exact next action. If no work remains, set lifecycle to `PAUSED`, active Task to `NONE`, and next action to `NONE`.
4. Read back changed continuity files and verify the content. Do not add continuity data to product Git unless an Owner explicitly changes that boundary.

## Evidence and safety

- Health and readiness are derived evidence, never project authority.
- Repair and capability modules may create or validate bounded contracts. They do not execute or dispatch repairs. `repair.verify` may issue an `ACCEPTED` or `REJECTED` receipt from fresh derived Homeostasis evidence; this is a product-level evidence result, not supervising-Owner acceptance or authority to execute.
- Executor output alone is not acceptance. Generic fallback never grants capability authority; consuming-project Owner/local gates remain external.
- Immune Memory is candidate evidence from accepted bounded work; it never writes canonical identity, policy, or status automatically.
- Missing budgets and unavailable evidence remain explicitly unconfigured/unknown; recurrence is not causation.
- Recovery readiness, byte binding, and rehearsal receipts do not authorize backup, restore, overwrite, or claims of fresh-machine reconstruction.
- No implicit shell, network, listener, background polling, deletion, restore, automatic repair/dispatch, provider/model switch, billing, or publication action is allowed.
- Path inputs must be relative to an explicit project root and fail closed on traversal, links/reparse points, ambiguous path classification, and platform cases the implementation cannot safely verify.
- Keep runtime/evidence in the configured project-local runtime directory. Do not store secrets, conversations, raw logs, or unnecessary user data.

## Project boundary and public/private separation

The software project owns its identity and durable state. LSO is a library of bounded diagnostic and evidence contracts; it does not become semantic authority over Project Corpus or any adapter's project. The Project Corpus reference adapter is optional and has no Python runtime dependency. Private GRAPH was the first reference environment; no private control-plane, project, account, machine, or runtime data belongs in this repository.

## Git and publication

- Product Git is local to this exact repository. Before staging, check top-level, HEAD, status, and the complete diff.
- Stage only exact reviewed files for the current authorized change. Never stage the whole tree or a directory wholesale. Review the staged diff and staged file list before committing; verify HEAD and status afterward.
- `.project-corpus/` is local continuity and remains ignored by product Git. Never clean unrelated files or other repositories.
- Local Git commits are allowed only when the active Owner Task authorizes them. No remote, push, tag, release, registry publication, public announcement, or service/account setting change without explicit Owner authorization and supervisory review where required.
- A missing license decision is a publication blocker. Do not create a license file or imply a license by copying one from an integration substrate.

## Cleanup

Remove only temporary files created by the current Task, after checking their exact resolved paths and preserving any required evidence. Keep canonical state, source, tests, Tasks, Reports, and unknown data. Report unresolved cleanup debt instead of guessing.
