# Batch 02 — 18 September 2026

## Changes

Added shared/nfc-transport.js and connected the active juice-cinema.html entry and the ESM NFC manager to it. Reading installs handlers before scanning, closes scans after success/error/timeout and marks simulations. Writing uses NDEFReader.write. The ESM profile count tolerates unavailable/corrupt storage.

## Preservation and rollback

Baseline: `07394c491d2fe61d1f5a0d5c444a2dea6bb50079` on main.
Rollback branch: `rollback/batch-02-2026-09-18`.

All HTML entry paths and profile query parameters retained. V4 Character Engine, audio engines, mixers, visualizers, recipient profiles and existing storage keys retained. Historical root nfc-manager.js is preserved but is not loaded by the active demo and is not certified as migrated.

Recover with a normal revert of this batch commit, preserving subsequent commits. Do not reset/force-push main. For COCKATOO rollback, publish the restored worker with a fresh cache version and use the normal update path.

## Verification

Run `node --test tests/batch-02.test.cjs`. Tests use browser/API simulations, not physical hardware. Changed JavaScript and inline scripts passed Node syntax checks. See the canonical portfolio report for published commit and deployment evidence:
https://github.com/jujubeans85/jujubeans85.github.io/blob/main/portfolio/batch-02.md

## Remaining gates

Shared transport is browser NFC plumbing, not authentication. Explicit simulation remains a test path. Physical NFC, iOS recipient experience and Mac audio/runtime checks remain open. This batch does not implement True Stem, Performance Capture or the newer Voice Control module. Audio-module consolidation remains pending.

