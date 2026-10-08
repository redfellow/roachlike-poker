# Development deployment on Windows WSL2

Dev container deployed on 2026-10-08; GHCR and public Nginx deployment remain pending. SSH: `ssh windows-dev`. The current working tree has been transferred to `~/projects/torakkapokeri`, and Linux dependency installation plus all 82 tests have passed there. Run commands below from that folder. Docker Desktop must be running with Ubuntu integration enabled. Another host service uses port 3001; this game publishes only loopback port **18889**. Do not change other services.

## Planned registry release flow

The publishing workflow is `.github/workflows/container.yml`. It runs `npm run check`, builds a Linux/amd64 image, and smoke-tests health, browser HTML, and SQLite creation before publishing to `ghcr.io/redfellow/roachlike-poker`. It is prepared locally; no workflow has run and no image is published yet.

- A push to `development` publishes `dev-<full-commit-sha>` and updates `dev`.
- A manual Actions run publishes a dev image from the selected ref. Currently only `main` exists, so this supports the first dev publication without requiring a new branch.
- Publishing a non-prerelease GitHub Release publishes its numeric version tag (for example `v0.2`) and updates `stable`. The workflow rejects stable commits not contained in `main`. Follow AGENTS.md's release sequence before publishing the Release; this workflow does not merge branches or increment versions. The specified `manifest.json` is currently absent and must be resolved before the first stable release.

The workflow uses the repository's `GITHUB_TOKEN` with package-write permission, with no stored personal publishing token. New GHCR packages default to private; verify package visibility and repository access after first publication. Private host pulls require a classic personal access token scoped to `read:packages`; enter it through `docker login ghcr.io --username redfellow` in the remote terminal, never in Git or chat. GitHub Actions usage has its own account limits.

Commit/version tags are not overwritten intentionally by the workflow; GHCR does not enforce tag immutability. For exact replay use the image digest shown after pushing/pulling. Do not delete an image required for rollback. Publishing does not deploy to Windows. Workflow triggers authorize image builds once this automation is intentionally pushed/enabled; the first local dev build was explicitly authorized and completed.

The first local dev image is `torakkapokeri:dev-working-20261008` (image ID `sha256:05be314e7e62f35405c6681f81c44b7b17f6647f075944e7fff85eb53ff75a04`). Remote `.env` selects this tag. Container health, static assets, native SQLite, online backup `/backups/first-deployment-20261008.sqlite`, and persistence across container restart are verified. The backup is an initial-instance snapshot, not evidence of saved-game restoration. Windows Nginx/TLS, Windows loopback reachability, reboot recovery, and browser playtests remain unchecked.

## Pull a published image on Windows/WSL2

Keep both Compose files and a private `.env` in a stable deployment folder. Set `TORAKKA_IMAGE` in `.env` to `ghcr.io/redfellow/roachlike-poker:dev-<full-commit-sha>`, a stable version, or `ghcr.io/redfellow/roachlike-poker@sha256:<digest>`. Prefer an exact version/digest rather than a moving channel for playtest records and rollback.

```bash
docker compose -f compose.yaml -f compose.registry.yaml config --quiet
docker compose -f compose.yaml -f compose.registry.yaml pull game
# Back up the running database before replacing an existing instance.
docker compose -f compose.yaml -f compose.registry.yaml up -d --no-build --wait
curl --fail http://127.0.0.1:18889/api/health
```

The override removes the local build definition; Compose 2.24+ is required. Both deployment paths use project name `torakkapokeri` and the same named data/backup volumes. Use both `-f` arguments for subsequent `exec`, `stop`, `cp`, `logs`, and backup commands when deploying from GHCR. Only one live instance should use this data volume at a time.

For updates, pull the new image first, record the current image digest, then stop and back up the old instance using its old image selection. Change `TORAKKA_IMAGE` and start the new image with the command above. For rollback, restore the matching database backup as described below, set `TORAKKA_IMAGE` to the recorded previous digest, pull if needed, and start with `--no-build --wait`. Verify saved-game recovery and recap before resuming play.

## First deployment

Transfer the intended working tree, including uncommitted application changes, but exclude `.git`, local environment files, keys, databases, dependencies, build outputs, test artifacts, and `conceptart`. Keep dependencies installed inside Linux; never transfer Mac `node_modules`.

Copy `.env.example` to `.env` and choose a unique `TORAKKA_RELEASE` image tag, such as `dev-20261008-1`. The image includes the runtime TypeScript loader and installs locked dependencies. It builds the browser during image creation; execute the build only when explicitly requested.

```bash
npm ci
npm run check
# Once the build/deployment is requested:
docker compose build
docker compose up -d --wait
docker compose ps
curl --fail http://127.0.0.1:18889/api/health
```

The container runs as the unprivileged Node user. Named volumes `torakkapokeri_game-data` and `torakkapokeri_game-backups` persist independently of image replacements. Never use `docker compose down --volumes` on the deployed instance. The database is `/data/torakkapokeri.sqlite`; no data or backups are under the static asset directory.

Forward the port from the Mac with `ssh -N -L 18889:127.0.0.1:18889 windows-dev`, then open `http://127.0.0.1:18889`. Verify Windows can also reach that address before changing Nginx. Adapt `ops/nginx.conf.example` into the existing Windows configuration, validate with `nginx -t`, then reload. Verify DNS, certificate, HTTPS, Socket.IO upgrades/reconnects, invite routes, and independent rooms externally.

Run the deferred clean-checkout checks and full Chrome suite on the deployment machine after the dev version is deployed. Playwright's existing suite starts isolated development servers; separately exercise the actual deployed instance through Nginx. Record narrow/wide desktop layout review and friend-group acceptance at 2, 3, and 6 seats.

## Backup and isolated restore

Use SQLite's online backup API, not a live filesystem copy. Choose a fresh filename each time:

```bash
docker compose exec -T game npm run backup -- /backups/pre-update-20261008-1.sqlite
mkdir -p backups
docker compose cp game:/backups/pre-update-20261008-1.sqlite backups/pre-update-20261008-1.sqlite
```

Keep this exported copy off the Windows host as well. Backup retention and off-machine destination still need choosing. The backup volume alone does not protect against host loss. Do not commit backups.

To rehearse restore, copy the exported snapshot into a separate folder, leaving live data untouched:

```bash
mkdir -p restore-test
cp backups/pre-update-20261008-1.sqlite restore-test/torakkapokeri.sqlite
TORAKKA_DB="$PWD/restore-test/torakkapokeri.sqlite" PORT=18890 npm start
```

Use the same release code and Linux dependencies. Forward 18890, verify health, reopen the saved invite link, reclaim a disconnected seat, and continue a saved game and recap. Stop the isolated process when done. Never expose the restore folder through Nginx.

## Update and rollback

1. Keep the previous tagged image and record its tag. Stop game traffic/application with `docker compose stop game`, then take a consistent backup with `docker compose run --rm --no-deps game npm run backup -- /backups/pre-update-UNIQUE.sqlite`.
2. Export that backup using a temporary container or restart the old service and use `docker compose cp`; stop the service again before replacement.
3. Set a new unique release tag in `.env`, install/check the intended code, and run the explicitly requested image build. Start with `docker compose up -d --wait`. Verify health, saved-game reconnect, and recap.
4. For rollback, stop the game and preserve its current database plus WAL/SHM files. Use a temporary container with the data volume mounted to copy the matching backup to `/data/torakkapokeri.sqlite` and remove stale WAL/SHM files, keeping ownership writable by the Node user. Set the previous release tag and run `docker compose up -d --no-build --wait`. Verify recovery before reopening traffic.

Do not build the previous tag from new source during rollback. Restore both matching code and data if storage has changed. The store currently initializes schema version 1; versioned migration/upgrade testing is still a release gate, not an implemented migration framework.

## Registry credentials over SSH

The configured Windows helper `desktop.exe` failed during the first SSH image build with a WSL interop/vsock error. A temporary empty Docker configuration was used only to pull the public Node base image anonymously; the existing credential configuration was not changed. This is not the private-registry setup.

For SSH-operated WSL, configure a native Linux credential helper such as `docker-credential-pass` with a GPG-backed `pass` store, then log into GHCR using a read-only token. Preserve other Docker settings when editing `credsStore`. Installation, GPG/store initialization, credential migration, and fresh-SSH/reboot verification remain to be completed. Passphrase-protected GPG keys need an explicit unlock strategy for unattended pulls; a cached interactive unlock is not proof of reboot recovery. Do not permanently remove credential storage or put tokens into project environment files. See [Docker credential-store documentation](https://docs.docker.com/reference/cli/docker/login/).

Prerequisites checked on 2026-10-08: both helper packages are available from Ubuntu repositories but not installed; the remote user has no GPG secret key and `sudo` requires interactive authentication. In the remote VS Code terminal or `ssh -t windows-dev`, run:

```bash
sudo apt-get update
sudo apt-get install pass golang-docker-credential-helpers
export GPG_TTY=$(tty)
gpg-connect-agent updatestartuptty /bye
gpg --full-generate-key
gpg --list-secret-keys --keyid-format LONG
pass init <YOUR-GPG-KEY-FINGERPRINT>
```

Choose a key supporting encryption and enter its passphrase directly in the terminal. Replace the placeholder with the full fingerprint shown by GPG. Do not send passwords, private keys, or registry tokens through chat. After initialization, back up the Docker configuration securely and change only `credsStore` to `pass`, preserving any contexts/plugins and reviewing registry-specific `credHelpers` that could override the setting. Log into GHCR when a package is available, then verify an authenticated pull in a fresh SSH session. A running container can restart from its existing local image without fetching it; unattended image updates need the separately tested unlock strategy.

The initial GPG key-generation attempt timed out with the default graphical `pinentry-gnome3` prompt. For this SSH-operated account, `~/.gnupg/gpg-agent.conf` now selects `pinentry-program /usr/bin/pinentry-curses`, and the agent was reloaded. Run the terminal environment commands above in the same interactive terminal as key generation so the prompt reaches that terminal.

The Linux helper is now installed and Docker's `credsStore` is set to `pass`; the previous Docker configuration is backed up privately beside `config.json`. No registry-specific helper overrides were present. A normal public Node image pull succeeded from a fresh SSH session without the temporary configuration. GPG key creation succeeded and the default password store was initialized with that key. The user completed GHCR login; metadata checks confirm an encrypted GHCR entry in `pass` and no inline GHCR credential in Docker's config. Token contents were not read or displayed. Encrypted-token retrieval, private-image pulls, and reboot/unlock behavior remain unverified.

## Availability and logging

`unless-stopped` restarts a crashed container while Docker is running; it does not start Docker Desktop before Windows login or keep a sleeping host available. Test Windows startup, WSL/Docker initialization, crash restart, sleep behavior, and reboot recovery before relying on unattended hosting. Existing WSL limits are 2 GB RAM, 2 CPUs, and 2 GB swap; measure alongside the other containers before changing them.

`docker compose logs --tail=100 game` shows startup/errors. JSON logs rotate at three 10 MB files. Request logging is disabled; do not add private hands, predictions, session credentials, or database contents to logs. Backup cadence, alerting, and remote retention remain operational decisions.
