# PR #5 deployment diagnosis — 22 September 2026

## Finding

Both failures predate the Safari dependency refresh. Do not revert PR #5.
PR #5 changes asset/import query versions in seven files; it does not change
package scripts, deployment paths, or build configuration. There is no `main/`
directory in the repository. `main` is the branch name, not a directory.

| Site | PR #5 evidence | Previous PR #4 evidence | Smallest setting correction |
| --- | --- | --- | --- |
| cinemajuice | Base directory does not exist: `/opt/build/repo/main` | Same configuration parsing error | Base directory: `main` → repository root (blank) |
| bossjuice | Deploy directory `main` does not exist; resolved `publish: /opt/build/repo/main`, `publishOrigin: ui` | Same missing publish-directory error | Publish directory: `main` → `.` (repository root) |

These are PREVIEW failures on PR head `d8b6931d85443b8288f8daef6ca1cc356e127d95`,
not evidence that merge commit `8fa98fc5f2c680fc92129f04e1a9a5d8c368c4f2`
ran and failed. PR #4 head was `66416a7e36df9991e5a9ed65484cd1b9fa980bff`.

Evidence:
- https://app.netlify.com/projects/cinemajuice/deploys/6ab220d11f03c80008baeb9a
- https://app.netlify.com/projects/cinemajuice/deploys/6ab220196fbe090008c4c586
- https://app.netlify.com/projects/bossjuice/deploys/6ab220d1f0eb0a000889083d
- https://app.netlify.com/projects/bossjuice/deploys/6ab22019889a1c0008f536d0

## Prepared settings fix — not applied

1. Record the existing build settings for each site before changing anything.
2. In cinemajuice, clear only the Base directory `main` field. Keep the branch
   named `main`; do not rename the branch or create a dummy directory.
3. In bossjuice, change only Publish directory `main` to `.`. The repository
   already contains the static site. Do not add a bundler or placeholder build.
4. Retry the same failed PR preview revisions to isolate the setup correction
   from the new Help/layout work. Check the resolved settings and a ready deploy.
5. Check `/collections/maker/`, its relative `../../shared/` assets, and a sample
   existing collection. Do not publish production as part of this diagnosis.

Site-wide build settings also affect future production builds. Applying this
plan must preserve the currently published deployments and avoid a concurrent
production build. Check the other fields before saving; they were not fully
exposed by the project-reader tool. A further bad field on cinemajuice could
be masked by its earlier base-directory failure. Reassess any new error rather
than claiming that the whole deployment has been verified.

Rollback: restore the recorded field values (`main` for each changed field).
No Netlify configuration or production deployment was changed during this work.
A root netlify.toml override is deliberately not included because it would
change shared deployment behavior for both sites beyond the identified fields.

## Help and compact controls

Moved 14 static guidance blocks and the postal guide link to `help.html`.
Help opens in another tab so the current unsaved composition stays open.
Utility controls use two-column layouts and at least 44px targets; the approved
64px front/back buttons remain. Dynamic errors, photo quality, QR destination,
and text-fit feedback remain in the maker. Render, QR, saving, shelf, and export
modules are unchanged. CSS URL was bumped so Safari loads the compact layout.

Checks: 19 Node tests and 3 Python tests passed; whitespace check passed.
The local browser regression attempt could not launch Chromium (SIGSEGV).
The cloud browser cannot reach the local preview. Browser CI and physical iPhone
acceptance remain required; no visual acceptance is claimed.
