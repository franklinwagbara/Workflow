# FlowForge – Deploy to Render.com

## Quick Deploy (Blueprint)

1. Push this repo to GitHub/GitLab.
2. Go to [Render Dashboard → Blueprints](https://dashboard.render.com/blueprints).
3. Click **New Blueprint Instance** → connect the repo.
4. Render detects `render.yaml` and creates both services automatically.
5. Wait for builds to finish (~5-8 min first time).

Your app will be live at:

| Service  | URL                                       |
| -------- | ----------------------------------------- |
| API      | `https://flowforge-api.onrender.com`      |
| Frontend | `https://flowforge-frontend.onrender.com` |

> **Note:** If you use different service names, update the `ALLOWED_ORIGINS` env
> var on the API and the `NEXT_PUBLIC_API_URL` env var on the frontend accordingly.

---

## Manual Deploy (per-service)

### Backend API

1. **New Web Service** → Docker
2. **Root Directory:** (leave blank – repo root)
3. **Dockerfile Path:** `./Dockerfile.api`
4. **Docker Context:** `.`
5. **Health Check Path:** `/health`
6. Add a **Disk**:
   - Mount Path: `/data`
   - Size: 1 GB
7. **Environment Variables:**

   | Key                                    | Value                                  |
   | -------------------------------------- | -------------------------------------- |
   | `ASPNETCORE_ENVIRONMENT`               | `Production`                           |
   | `ConnectionStrings__DefaultConnection` | `Data Source=/data/flowforge.db`       |
   | `ALLOWED_ORIGINS`                      | `https://<your-frontend>.onrender.com` |

### Frontend

1. **New Web Service** → Docker
2. **Root Directory:** (leave blank – repo root)
3. **Dockerfile Path:** `./Dockerfile.frontend`
4. **Docker Context:** `.`
5. **Environment Variables:**

   | Key                   | Value                                 |
   | --------------------- | ------------------------------------- |
   | `NEXT_PUBLIC_API_URL` | `https://<your-api>.onrender.com/api` |

> `NEXT_PUBLIC_API_URL` is a **build-time** variable — it gets baked into the JS
> bundle. If you change it, trigger a redeploy.

---

## Architecture on Render

```
Browser → [flowforge-frontend] → (client-side fetch) → [flowforge-api] → SQLite on Disk
```

- **Backend** stores data in `/data/flowforge.db` on a Render persistent disk.
- **Frontend** is a standalone Next.js server (`node server.js`).
- Both services auto-deploy on every push to the default branch.

## Free Tier Notes

- Free services **spin down after 15 min of inactivity** and cold-start on next request (~30-60 s).
- The persistent disk (1 GB) is included with paid plans; on free tier, data may be lost on redeploy.
- To avoid cold starts, upgrade to the **Starter** plan ($7/mo per service).
