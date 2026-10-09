# Release Guide

Publishing and deployment are separate steps. GitHub builds the image; the deployment machine explicitly chooses when to start it.

## Development Release

Use this for a test build without a Git tag or GitHub Release.

### Publish

1. Commit and push the intended code to `main`.
2. Open **GitHub → Actions → Publish container**.
3. Select **Run workflow**, choose `main`, and run it.
4. Wait for the workflow to finish successfully.

The workflow publishes the newest development image as `:dev`. It also creates a commit-specific tag internally for auditing, but normal deployment does not require copying it.

### Deploy

On the deployment machine, from the repository directory:

```sh
npm run deploy:dev
```

This pulls the current `:dev` image, recreates the game container, waits for it to become healthy, and prints the image that is running.

## Versioned Release

Use this for a named release such as `0.9.0`.

### Prepare

Start from a clean, current `main` branch. Update both package files with one command:

```sh
npm run release:prepare -- 0.9.0
```

Run the checks, commit the changed package files, and push:

```sh
npm run check
git add package.json package-lock.json
git commit -m "[CHORE] Prepare v0.9.0 release"
git push origin main
```

### Publish

1. Open **GitHub → Releases → Draft a new release**.
2. Create the tag `v0.9.0` from `main`.
3. Use `v0.9.0` as the release title and generate or write the release notes.
4. Publish the release.
5. Wait for the automatically started **Publish container** workflow to finish successfully.

The package version, Git tag, GitHub Release, and container version should all match. Publishing creates `:v0.9.0` and also updates the moving `:stable` tag.

### Deploy

On the deployment machine:

```sh
npm run deploy:version -- 0.9.0
```

Use the numbered version rather than `:stable` so it is always clear which release is running.

## Roll Back

Deploy an earlier version using the same command:

```sh
npm run deploy:version -- 0.8.0
```

Restore the matching database backup too if the newer release changed the database schema.

## Advanced: Exact Image

Normal releases do not need this. To deploy a commit-specific tag or digest while diagnosing a problem:

```sh
npm run deploy:image -- ghcr.io/redfellow/roachlike-poker:dev-COMMIT_SHA
```

## Important Details

- Pulling an image alone does not restart the game. The deployment commands pull and recreate it together.
- Plain `docker compose up` uses the local image definition. Use the npm deployment commands for published images.
- Running **Publish container** manually creates a development build. Publishing a GitHub Release creates the matching versioned build.
