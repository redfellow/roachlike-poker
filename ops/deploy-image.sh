#!/bin/sh

set -eu

repository="ghcr.io/redfellow/roachlike-poker"
mode="${1:-}"

case "$mode" in
	dev)
		[ "$#" -eq 1 ] || { echo "Usage: npm run deploy:dev" >&2; exit 2; }
		image="$repository:dev"
		;;
	version)
		[ "$#" -eq 2 ] || { echo "Usage: npm run deploy:version -- 0.9.0" >&2; exit 2; }
		version="${2#v}"
		case "$version" in
			[0-9]*.[0-9]*.[0-9]*) ;;
			*) echo "Expected a semantic version such as 0.9.0, got: $2" >&2; exit 2 ;;
		esac
		image="$repository:v$version"
		;;
	image)
		[ "$#" -eq 2 ] || { echo "Usage: npm run deploy:image -- ghcr.io/OWNER/REPOSITORY:TAG" >&2; exit 2; }
		image="$2"
		case "$image" in
			ghcr.io/*:* | ghcr.io/*@sha256:*) ;;
			*) echo "Expected an exact ghcr.io image tag or digest, got: $image" >&2; exit 2 ;;
		esac
		;;
	*)
		echo "Use npm run deploy:dev or npm run deploy:version -- 0.9.0" >&2
		exit 2
		;;
esac

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required." >&2
	exit 1
fi

unlock_registry_credentials()
{
	if ! command -v docker-credential-pass >/dev/null 2>&1; then
		return
	fi

	if [ ! -t 0 ]; then
		echo "GHCR credentials may require an interactive terminal. Run this command directly in the deployment terminal." >&2
		return
	fi

	GPG_TTY="$(tty)"
	export GPG_TTY
	gpg-connect-agent updatestartuptty /bye >/dev/null 2>&1 || true

	echo "Unlocking GHCR credentials (enter the GPG passphrase if prompted)..."
	if ! printf '%s' 'ghcr.io' | docker-credential-pass get >/dev/null; then
		echo "Could not unlock the stored GHCR credentials." >&2
		exit 1
	fi
}

compose()
{
	TORAKKA_IMAGE="$image" docker compose -f compose.yaml -f compose.registry.yaml "$@"
}

echo "Deploying $image"
unlock_registry_credentials
compose config --quiet
compose pull game
compose up -d --no-build --force-recreate --wait game

container_id="$(compose ps -q game)"

if [ -z "$container_id" ]; then
	echo "The game container did not start." >&2
	exit 1
fi

echo "Running container:"
docker inspect "$container_id" --format 'image={{.Config.Image}} id={{.Image}} status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}'
