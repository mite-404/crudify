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

> **First automated release:** the latest Git tag is `v1.4.0`, npm is at `1.4.1`, and `CHANGELOG.md` already contains a curated `1.5.0` section. To avoid a duplicate changelog entry, commit the automation with a non-releasing message and publish `1.5.0` once manually before pushing:
>
> ```bash
> git add .
> git commit -m "ci: add release automation"
> npm test
> npm run build
> npm publish --access public
> git tag v1.5.0
> git push origin main
> git push origin v1.5.0
> ```
>
> Future `feat`/`fix` commits are released automatically. If you prefer semantic-release to publish `1.5.0`, remove the manual `## [1.5.0]` section first and push a `feat` commit instead.

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
4. Save the configuration.
5. On GitHub, open **Settings → Secrets and variables → Actions → Variables** and create `RELEASE_ENABLED` with value `true`. Until this variable exists, the release job is skipped and only the test job runs.

Trusted publishing requires npm CLI `11.5.1` or later and Node.js `22.14.0` or later. The release job uses Node.js 24.

## GitHub token and branch protection

The release commit and tag are pushed with `GITHUB_TOKEN` by default. If `main` is protected and `GITHUB_TOKEN` is not allowed to bypass the rules, add a repository secret named `RELEASE_TOKEN` with a token that has `contents: write` and permission to bypass the branch protection. The workflow automatically uses `RELEASE_TOKEN` when it exists.

## Manual run

Start the `Release` workflow from the Actions tab. It always runs the tests first and then attempts a release. If there are no releasable commits, semantic-release exits without publishing.

To preview locally:

```bash
GITHUB_TOKEN=... npm run release:dry
```
