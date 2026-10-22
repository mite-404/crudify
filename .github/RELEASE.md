# Release process

Releases are automated with [semantic-release](https://semantic-release.gitbook.io/).

## Flow

1. A commit is pushed to `main` (or the `Release` workflow is started manually).
2. The workflow runs the build and the test suite on Node.js 20, 22 and 24.
3. `semantic-release` analyzes the Conventional Commits since the last tag.
4. If the commits require a release, it:
   - updates `CHANGELOG.md`, `package.json` and `package-lock.json`;
   - publishes the package to npm with provenance through OIDC;
   - creates the Git tag `vX.Y.Z` and the GitHub Release;
   - commits the release changes back to `main` with `[skip ci]`.

Commits that do not produce a release (`docs`, `chore`, `ci`, `test`, etc.) do not change the version.

> **First release (bootstrap):** the latest Git tag is `v1.4.0`, npm is at `1.4.1`, and `CHANGELOG.md` already contains a curated `1.5.0` section. After configuring the npm trusted publisher, run the `Release` workflow manually on `main` with the `bootstrap` input enabled. It publishes the current `package.json` version (`1.5.0`), creates the `v1.5.0` tag and the GitHub Release, and skips semantic-release so the curated changelog is not duplicated. The bootstrap is idempotent: already-published versions, tags and releases are skipped.
>
> Then create the `RELEASE_ENABLED` variable. Future `feat`/`fix` commits are released automatically. If you prefer semantic-release to publish `1.5.0`, remove the manual `## [1.5.0]` section first and push a `feat` commit instead.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Commit                                   | Release |
| ---------------------------------------- | ------- |
| `fix: handle empty filters`              | patch   |
| `feat: add audit user extractor`         | minor   |
| `feat!: remove deprecated option`        | major   |
| `fix!: change response shape`            | major   |
| `docs: update audit examples`            | none    |
| `chore: update dev dependencies`         | none    |

A breaking change can also be declared with a `BREAKING CHANGE:` footer.

## npm trusted publishing

The workflow authenticates to npm with OIDC. No `NPM_TOKEN` secret is required.

Configure the trusted publisher on npmjs.com:

1. Open the `ncrudify` package settings on npmjs.com.
2. Go to **Trusted Publisher** and choose **GitHub Actions**.
3. Set:
   - Organization or user: `mite-404`
   - Repository: `crudify`
   - Workflow filename: `release.yml`
   - Environment: leave empty
   - Allowed actions: enable **npm publish** (direct publish). New trusted publishers created after September 2026 allow only `npm stage publish` by default.
4. Save the configuration.
5. Run the `Release` workflow manually with `bootstrap` enabled to publish `1.5.0`.
6. On GitHub, open **Settings → Secrets and variables → Actions → Variables** and create `RELEASE_ENABLED` with value `true`. Until this variable exists, automatic releases on push are skipped and only the test job runs.

Trusted publishing requires npm CLI `11.5.1` or later and Node.js `22.14.0` or later. The release job uses Node.js 24.

## GitHub token and branch protection

The release commit and tag are pushed with `GITHUB_TOKEN` by default. If `main` is protected and `GITHUB_TOKEN` is not allowed to bypass the rules, add a repository secret named `RELEASE_TOKEN` with a token that has `contents: write` and permission to bypass the branch protection. The workflow automatically uses `RELEASE_TOKEN` when it exists.

## Manual run

Start the `Release` workflow from the Actions tab. It always runs the tests first.

- Leave `bootstrap` unchecked for a normal semantic-release run. If there are no releasable commits, semantic-release exits without publishing.
- Enable `bootstrap` only for the one-time baseline release of the current `package.json` version. It publishes that version, creates the matching tag and GitHub Release, and skips semantic-release.

To preview locally:

```bash
GITHUB_TOKEN=... npm run release:dry
```

## Troubleshooting

### `403 OIDC permission denied for this action`

The trusted publisher is not allowed to run a direct `npm publish`. Open the `ncrudify` package settings on npmjs.com, find the GitHub Actions trusted publisher and verify that **Allowed actions** includes **npm publish**. Configurations created after September 2026 allow only `npm stage publish` by default.

If the allowed actions cannot be edited, delete the trusted publisher and create it again with the same repository, workflow filename and environment, this time enabling **npm publish**.

### Tag and GitHub Release exist but npm has no matching version

Push again or rerun the `Release` workflow. The workflow checks whether `package.json` has an existing tag missing from npm and publishes that version before semantic-release runs.
