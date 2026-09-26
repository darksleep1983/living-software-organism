# Component provenance

The unified repository was assembled from two independently verified local products and was later published as the active public development home.

## Project Corpus

Imported product snapshot:

facf215b156f1c577618af113fa1018d9af79950

The embedded component is checked against its own MANIFEST_SHA256.json. Protocol 2.0, Runtime 2.2.0, package identity and component license were preserved.

After the unified repository was published, the former standalone Project Corpus repository received only a redirect/archive commit and was archived as a historical/reference source:

6f471fde1e985421ab5b75cf81d8890ae4fe4da1

The embedded component remains provenance-bound to the earlier facf215b snapshot. The later archive/redirect commit is intentionally not folded into the embedded component because it describes the standalone repository's retirement, not a Protocol/Runtime product change.

## Organism component

Pre-unification standalone LSO HEAD:

046557ddf90887d43aa87bb6eeaf84f1b8a2796c

Its accepted v0.1-v0.7 contracts and experimental unversioned Organ Systems were moved into components/organism/ without changing their semantic authority boundary.

## Unified publication

The initial accepted public publication baseline for the unified repository was:

a24aa19072218fcf8c04c63f3a792326e01978e8

Publication verification included successful GitHub CI and a true fresh clone from the public remote. The fresh clone matched committed files/history and passed bounded repository/component/integration checks.

Subsequent documentation commits may advance main beyond that publication-baseline SHA without changing the provenance of the imported components.

## What provenance proves and does not prove

Component hashes and Git commits prove bounded byte identity for the covered snapshots.

The successful fresh remote clone proves that the accepted unified repository could be reacquired from its GitHub remote at verification time.

It does not prove:

- indefinite future availability of that remote;
- bitwise reproduction across every environment;
- recovery of undeclared external services or dependencies;
- fresh-machine recovery for every consuming project;
- restore authority.

Those require their own explicit evidence and authorization.
