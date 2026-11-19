# Production on a laptop

Runs HireFlow in production on a Mac and publishes it through a Cloudflare
Tunnel, so no server is needed and no ports are opened. Merging into `main`
updates production within about five minutes.

```
GitHub main ──(every 5 min, launchd)──> ~/hireflow-prod ──> docker compose
                                                              ├─ api    (NestJS, migrations on start)
                                                              ├─ ui     (nginx + built React app)
                                                              ├─ minio  (CV files)
                                                              └─ tunnel (cloudflared) ──> Cloudflare ──> internet
Postgres.app (host) <── api, database hireflow_prod
```

| Public URL | Tunnel route | What |
|---|---|---|
| `https://hireflow.digital` | `http://ui:3000` | web app |
| `https://api.hireflow.digital` | `http://api:3000` | REST API, email ingestion webhook |
| `https://files.hireflow.digital` | `http://minio:9000` | presigned CV links |

The site is up only while the laptop is awake, Docker Desktop is running and
the laptop is online.

## Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | the production stack |
| `deploy.sh` | pulls `main` if it moved and rebuilds/restarts the stack |
| `launchd.plist.template` | runs `deploy.sh` every 5 minutes |
| `api.env.example` | template for the API configuration |
| `../minio/Dockerfile` | MinIO built from source (no official images any more) |

Configuration with secrets lives **outside the repository**, in
`~/.config/hireflow-prod/` (`api.env`, `minio.env`, `tunnel.env`, plus
`deploy.log`).

## One-time setup

1. **Prerequisites.** Docker Desktop (Settings → General → *Start Docker
   Desktop when you sign in*) and Postgres.app (*Start automatically*).

2. **A dedicated production clone.** Never develop in it; `deploy.sh` refuses
   to run on any branch other than `main` or with uncommitted changes.

   ```bash
   git clone https://github.com/AndrewKozak2/hireflow.git ~/hireflow-prod
   ```

3. **Database.**

   ```bash
   /Applications/Postgres.app/Contents/Versions/latest/bin/psql -h localhost -c 'CREATE DATABASE hireflow_prod'
   ```

4. **Configuration.**

   ```bash
   mkdir -p ~/.config/hireflow-prod && chmod 700 ~/.config/hireflow-prod
   cp ~/hireflow-prod/docker/laptop/api.env.example ~/.config/hireflow-prod/api.env
   ```

   - `api.env`: fill in real values. Use new JWT secrets (`openssl rand -hex 32`),
     not the development ones.
   - `minio.env`: `MINIO_ROOT_USER=…` and `MINIO_ROOT_PASSWORD=…` (at least 8
     characters), the same values as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
     in `api.env`.
   - `tunnel.env`: `TUNNEL_TOKEN=…` (Cloudflare → Zero Trust → Networks →
     Tunnels → your tunnel → the token from the Docker install command).

   Then `chmod 600 ~/.config/hireflow-prod/*.env`.

5. **Tunnel routes** in Cloudflare, on that tunnel: the three routes in the
   table above, with no path restriction. Only one connector may use the
   token: stop any other `cloudflared` started with it, or Cloudflare splits
   traffic between them.

6. **First deploy.**

   ```bash
   ~/hireflow-prod/docker/laptop/deploy.sh --force
   ```

   The first build takes a few minutes (MinIO compiles from source). The
   migrations create the default admin from the main README. **Its password is
   public, so log in at https://hireflow.digital and change it right away.**

7. **Automatic deploys.**

   ```bash
   sed -e "s|__PROD_REPO__|$HOME/hireflow-prod|g" \
       -e "s|__PROD_CONFIG__|$HOME/.config/hireflow-prod|g" \
       ~/hireflow-prod/docker/laptop/launchd.plist.template \
       > ~/Library/LaunchAgents/digital.hireflow.deploy.plist
   launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/digital.hireflow.deploy.plist
   ```

   Check it with `launchctl print gui/$(id -u)/digital.hireflow.deploy`; output
   goes to `~/.config/hireflow-prod/deploy.log`. To remove it:
   `launchctl bootout gui/$(id -u)/digital.hireflow.deploy`.

8. **Email ingestion.** In the Apps Script project set `WEBHOOK_BASE_URL` to
   `https://api.hireflow.digital` and `X_HIRE_FLOW_WEBHOOK_TOKEN` to
   `HIREFLOW_WEBHOOK_TOKEN` from `api.env`.

9. **Keep the laptop awake.** On power, enable *Prevent automatic sleeping when
   the display is off* (System Settings → Battery/Energy), or run
   `caffeinate -dimsu` while you need the site up. A closed lid still sleeps.

## Day to day

| Task | How |
|---|---|
| Ship a change | merge the PR into `main`; deployed within ~5 min |
| See what happened | `tail -f ~/.config/hireflow-prod/deploy.log` |
| Deploy now | `~/hireflow-prod/docker/laptop/deploy.sh --force` |
| API logs | `docker compose -p hireflow-prod logs -f api` |
| Stop production | `docker compose -p hireflow-prod down` (data stays in Postgres and the `minio-data` volume) |
