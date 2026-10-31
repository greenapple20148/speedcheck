# VPS measurement setup (no git clone required)

Use this when you only have `/opt/speedcheck/services/speedtest` and a `.env` on the server.

## 1. Directory layout

```text
/opt/speedcheck/
  .env                          # your SPEEDTEST_* variables
  docker-compose.yml            # copy from deploy/docker-compose.production.yml
  services/speedtest/           # Go source + Dockerfile (already there)
```

## 2. Create `docker-compose.yml`

From your laptop (replace with your droplet IP):

```bash
scp deploy/docker-compose.production.yml root@64.227.14.83:/opt/speedcheck/docker-compose.yml
```

Or on the VPS, create `/opt/speedcheck/docker-compose.yml` with the same contents as `deploy/docker-compose.production.yml` in this repo.

## 3. Ensure `.env` is at the repo root

```bash
cd /opt/speedcheck
ls -la .env
grep SPEEDTEST_SERVER .env
```

Required keys (example):

```bash
SPEEDTEST_PUBLIC_URL=http://64.227.14.83:18443
SPEEDTEST_HMAC_SECRET=...
SPEEDTEST_ADMIN_TOKEN=...
SPEEDTEST_CORS_ORIGINS=https://myspeedgauge.com
SPEEDTEST_SERVER_ID=do-mkc1-1
SPEEDTEST_SERVER_NAME=MySpeedGauge US
SPEEDTEST_SERVER_REGION=us
SPEEDTEST_SERVER_LOCATION=Kansas City
```

## 4. Build and run

```bash
cd /opt/speedcheck
docker compose up -d --build speedtest
```

## 5. Verify env inside container

```bash
docker compose exec speedtest printenv | grep SPEEDTEST_SERVER
curl -sS http://127.0.0.1:18443/servers
```

You should **not** see `Local Dev` / `local-1` if `.env` is loaded.

## Alternative: `docker run` (no compose file)

```bash
cd /opt/speedcheck
docker build -t speedcheck-measure ./services/speedtest
docker stop speedcheck-measure 2>/dev/null; docker rm speedcheck-measure 2>/dev/null
docker run -d --name speedcheck-measure --restart unless-stopped \
  -p 18443:18443 \
  --env-file /opt/speedcheck/.env \
  -e SPEEDTEST_LISTEN_ADDR=:18443 \
  speedcheck-measure
```

## If an old container is still running

List containers and stop the one on port 18443 before starting compose:

```bash
docker ps
docker stop <container_id>
```
