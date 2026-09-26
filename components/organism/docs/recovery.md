# Recovery and source provenance

LSO distinguishes local integrity, declared dependency readiness, and durable source reacquisition. These are different claims and must not be collapsed.

## What a local check can show

A recovery manifest can report whether a bounded set of declared canonical inputs is present and coherent. A local rehearsal can copy that bounded substrate into an isolated location and verify inventory, bytes, and identity bindings. Such evidence concerns only the declared files and the source state observed during the rehearsal.

For experimental Rebirth Capsule contracts, `BOUND` means the current declared bytes are present and match their recorded digests. A Git HEAD describes only bytes covered by that exact commit. Modified or untracked files do not inherit provenance from a base HEAD. No arbitrary source-tree or secret discovery is performed.

## What remains unproven

Local byte integrity does not prove a durable origin can reacquire those bytes. A declaration cannot make itself `VERIFIED`; a local hash, export, or commit alone cannot promote reacquisition. Fresh-machine reconstructibility requires an independently verified durable origin that covers every exact declared byte. No such verifier is supplied by the experimental candidate, so full fresh-machine reconstruction remains `UNPROVEN`.

A clean local clone, when demonstrated, proves repository self-containment from that machine's local Git state. It does not prove remote availability, cross-machine recovery, cross-OS behavior, bitwise builds, or external reacquisition. Reproducible Phenotype describes explicitly declared properties only; it is not a universal bitwise identity claim.

## Authority and actions

Recovery readiness is non-authoritative evidence. There is no live restore, overwrite, automatic backup, or restore authorization in LSO. An isolated rehearsal receipt is not permission to alter live canonical state. Recipe references are project-owned hashed documents/configuration; LSO does not execute them. Missing, stale, tampered, or unverified required inputs must fail closed rather than being replaced by a fallback project or assumed dependency.
