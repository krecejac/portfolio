# Running the app in dev

Three pieces must run: **database → backend → frontend**.

## 1. Database (Docker) — the part that's easy to forget

From `surf-backend/`:

```bash
docker compose up -d db      # start Postgres in the background (-d = detached)
docker compose ps            # verify: the `db` row should say "Up"
```

You start this once. It keeps running in the background even after you close
the terminal.

To stop it later:

```bash
docker compose stop db       # pause it (data kept)
# or
docker compose down          # stop + remove the container (named-volume data kept)
```

## 2. Backend

From `surf-backend/`

```bash
npm run dev
```

## 3. Frontend

From `surf-frontend/`

```bash
npm run dev
```

---

## TL;DR — full cold start

```bash
# terminal 1
cd surf-backend && docker compose up -d db && npm run dev

# terminal 2
cd surf-frontend && npm run dev
```

If a page shows no data or login fails with a connection error, the DB
container probably isn't up. Check with `docker compose ps` in `surf-backend/`.
