# Windows Deployment — Not Yet Executed

The Windows host and its existing Nginx configuration are unavailable from the current MacBook. This runbook is a preparation artifact, not proof of a deployed application.

## Install and run

1. Install Node.js 24 LTS and copy the repository to an application directory, for example `C:\Torakkapokeri\app`.
2. Run `npm ci` and `npm run check`. Verify that the native SQLite dependency loads on Windows.
3. When a production build is explicitly requested, run `npm run build`.
4. Store the database outside the release directory. In PowerShell, set `$env:TORAKKA_DB = "C:\Torakkapokeri\data\torakkapokeri.sqlite"` and optionally `$env:PORT = "3001"`.
5. Run `npm start`. Verify `http://127.0.0.1:3001/api/health` and the application locally.
6. Configure a Windows service/task manager to start the same command in the application directory with those environment variables, restart after failure, and start after boot. The service wrapper choice depends on the existing host setup.
7. Adapt `nginx.conf.example` into the existing Nginx configuration. Install the certificate, check DNS and firewall reachability, run `nginx -t`, then reload Nginx.
8. Verify the actual public hostname with clients outside the hosting network. Check the five-second lobby countdown, socket reconnect, and complete a game.

The application binds to loopback; Nginx is the public entry point. The database and backups must stay outside static/public directories. Do not commit certificates, session data, or private keys.

## Backup and restore

Use `npm run backup -- C:\Torakkapokeri\backups\snapshot.sqlite` with the same `TORAKKA_DB` environment. The backup uses SQLite's online backup API so an active WAL database is copied consistently. Keep dated backups; choose a retention schedule and off-machine destination before deployment.

Restore only while the application is stopped. Save the current database and its WAL/SHM files together in a rollback directory, then replace the database with the backup and ensure stale WAL/SHM files are not beside the restored database. Restart and verify a previously saved match and recap. Test restoration into a separate directory/port before relying on a backup.

## Updates and rollback

Keep release directories separate from data. Stop the application, back up the database, switch to the new release, install dependencies, run requested checks/build, and restart. Confirm health and a saved-game reconnect. Retain the previous release and its matching database backup. If a future schema migration changes storage, rollback requires both compatible code and the corresponding database snapshot.

## Acceptance still required on Windows

- Node/native SQLite install and persistent directory permissions.
- Certificate and public DNS correctness; Socket.IO proxy upgrades and reconnects.
- Service restart after process crash and Windows reboot.
- Isolated backup restoration and saved-match continuation.
- External friend-group playtests at 2, 3, and 6 players.

Proxy references: [Nginx WebSocket forwarding](https://nginx.org/en/docs/http/websocket.html) and [Socket.IO proxy timeouts](https://socket.io/docs/v4/reverse-proxy/).
