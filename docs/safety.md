# Safety boundaries

LSO is diagnostic and evidence-oriented. It does not own the project it observes. A result can inform a human or a separately authorized workflow; it cannot grant itself permission to act.

## Authority and repair

- Derived health, readiness, history, and recovery status are non-authoritative.
- A repair contract is frozen intent, not a command. The repair and capability APIs intentionally have no execute or dispatch operation.
- `repair.verify` may produce an `ACCEPTED` or `REJECTED` receipt by checking fresh derived Homeostasis evidence. This records a product-level evidence result; it is not supervising-Owner acceptance or authority to execute. Executor output alone is not acceptance.
- Generic fallback is never a repair-capable adapter. Capability use needs exact project opt-in.
- Immune Memory is candidate evidence from accepted work. It never writes canonical identity, policy, or current state.
- Missing budgets remain `UNCONFIGURED`; unavailable observations remain unknown. Recurrence does not establish causation.

## Actions absent from core

Core has no generic shell execution, network access, listener, background polling, automatic repair or dispatch, provider/model switching, purchase or billing action, arbitrary deletion, backup, live restore, overwrite, or publication authority. The library does not execute recipe text. External publication requires a separate Owner-controlled process.

## Paths and local runtime

Every file operation is rooted at an explicit project root. Relative references reject traversal, absolute paths, Windows alternate data stream syntax, unsafe separator forms, and reserved or ambiguous names. Path traversal checks classify each existing parent entry and compare it with filesystem metadata, then confirm the resolved target remains within the root. Symbolic links and unsupported/ambiguous entry types fail closed. On Windows, the implementation must also reject junction/reparse escapes, including cases where link metadata is restricted; when that guarantee cannot be made, the operation must refuse.

No confinement check is a substitute for OS permissions or a security boundary against a hostile process with write access to the same tree. Do not place secrets or raw conversation/log payloads in receipts. Runtime evidence defaults to the project-local `.lso-runtime` directory.

## Evidence limits

A hash detects changes to covered bytes; it does not prove who supplied them or whether a durable source can be reacquired. A self-hashed receipt can detect accidental corruption, not a hostile author who can rewrite both data and hash. Explicit traces record references and digests, not source contents; lexical sensitive-name checks are not content DLP. Health history records observations and does not infer what happened between them.

Read [recovery and provenance](recovery.md) before interpreting any readiness or reconstruction claim.
