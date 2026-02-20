---
description: Deploy FastAPI backend with Docker to Render.com
---

# Overview
This workflow outlines the steps to host the **School Management API** (FastAPI) and its SQLite database on **Render.com** using Docker. It covers:
- Preparing the Docker image.
- Setting up a Render service.
- Configuring environment variables.
- Persisting the SQLite database.
- (Optional) Setting up a custom domain.

## Prerequisites
1. **Render account** – sign up at https://render.com.
2. **Git repository** – push the current project to a Git provider (GitHub, GitLab, or Bitbucket). Render pulls from the repo.
3. **Dockerfile** – already present in `backend/Dockerfile`.
4. **Docker Compose** – optional for local testing (`docker-compose.yml`).

## Step‑by‑step Instructions

### 1. Push the project to a Git repository
```bash
# From the project root
git init
git add .
git commit -m "Initial commit for Render deployment"
# Create a remote on GitHub (replace <USERNAME>/<REPO>)
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin master
```

### 2. Create a new **Web Service** on Render
1. Log in to Render and click **New → Web Service**.
2. Connect the GitHub repository you just pushed.
3. **Environment**: Choose **Docker**.
4. **Build Command**: Leave blank (Render will use the Dockerfile).
5. **Start Command**: Leave blank – the Dockerfile’s `CMD` runs `uvicorn`.
6. **Port**: Set to `8000` (the port exposed in the Dockerfile).
7. Click **Create Web Service**.

### 3. Configure Environment Variables
In the service settings, add the following variables:
| Name | Value | Description |
|------|-------|-------------|
| `SECRET_KEY` | *generate a strong secret* (e.g., `openssl rand -hex 32`) | Used for JWT signing. |
| `ALGORITHM` | `HS256` | JWT algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `43200` | 30‑day token expiry. |
| `DATABASE_URL` | `sqlite:///./school.db` | Path to SQLite DB (Render will mount a persistent disk). |

> **Note:** The current code uses the constant `SECRET_KEY` directly. For a production‑ready setup, replace the hard‑coded value in `backend/main.py` with `os.getenv("SECRET_KEY")` and import `os`.

### 4. Persist the SQLite Database
Render provides a **Persistent Disk** for each service.
1. In the service dashboard, go to **Disk** → **Add Disk**.
2. Choose a size (e.g., **1 GB**) and mount path `/data`.
3. Update the `DATABASE_URL` to point to the mounted location:
```env
DATABASE_URL=sqlite:////data/school.db
```
4. Modify `backend/database.py` to use the env variable:
```python
import os
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./school.db")
```
5. Redeploy the service.

### 5. Verify the Deployment
After the build finishes, open the service URL (e.g., `https://school-api.onrender.com`).
- Test the root endpoint: `curl https://<service>.onrender.com/`
- Test an authenticated route (you’ll need a JWT token).

### 6. (Optional) Add a Custom Domain
1. In the service dashboard, click **Custom Domains** → **Add Custom Domain**.
2. Follow Render’s DNS instructions to point your domain to the service.

### 7. (Optional) Set Up a Front‑end
If you have a React/Vite front‑end in the `frontend/` folder, you can create a **Static Site** on Render that points to the built assets and proxies API calls to the backend service.

## TL;DR Command Summary
```bash
# 1. Push to Git
git init && git add . && git commit -m "Deploy" && git remote add origin <repo-url> && git push -u origin master

# 2. Generate secret key (run locally)
openssl rand -hex 32
```

## References
- Render Docker docs: https://render.com/docs/docker
- FastAPI deployment guide: https://fastapi.tiangolo.com/deployment/docker/

---
*This workflow can be executed step‑by‑step. If you would like any step automated (e.g., creating the Git repo, generating the secret key, or updating code), let me know and I can run the necessary commands.*
