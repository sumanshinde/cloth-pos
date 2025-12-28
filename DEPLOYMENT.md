# 🚀 Deployment Guide for Render

This project has two parts: **backend** (Django) and **frontend** (React). You need to deploy them as **two separate services** on Render.

## 1. Backend Deployment (Django)

**Create a "Web Service" on Render.**

| Setting | Value | Note |
| :--- | :--- | :--- |
| **Name** | `cloth-pos-backend` | Or any name you like |
| **Runtime** | **Python 3** | |
| **Root Directory** | `backend` | **CRITICAL:** This tells Render to look inside the backend folder. |
| **Build Command** | `pip install -r requirements.txt` | Installs dependencies. |
| **Start Command** | `gunicorn backend_proj.wsgi:application` | Starts the server. |

### Environment Variables (Advanced)
Add these in the "Environment" tab:
- `PYTHON_VERSION`: `3.9.0` (or `3.10.0`)
- `SECRET_KEY`: (Copy from your settings.py or generate a new one)
- `DEBUG`: `False`

---

## 2. Frontend Deployment (React)

**Create a "Static Site" on Render.**

| Setting | Value | Note |
| :--- | :--- | :--- |
| **Name** | `cloth-pos-frontend` | Or any name you like |
| **Runtime** | **Node** | |
| **Root Directory** | `frontend` | **CRITICAL:** This tells Render to look inside the frontend folder. |
| **Build Command** | `npm install; npm run build` | Installs and builds the React app. |
| **Publish Directory** | `dist` | Vite builds to the `dist` folder by default. |

### Environment Variables
**CRITICAL:** You must verify your Backend URL first!
1. Get your **Backend URL** from Render (e.g., `https://cloth-pos-backend.onrender.com`).
2. Add this variable in Frontend Envirnoment settings:
   - Key: `VITE_API_URL`
   - Value: `https://cloth-pos-backend.onrender.com/api` (Make sure to add `/api` at the end!)

---

## 🐞 Troubleshooting "Status 127"
If you see **Exited with status 127** or **Command not found**:

1.  **Check Root Directory**: Did you set it to `backend`? If you leave it empty (default), Render looks for `requirements.txt` in the main folder, doesn't find it, and fails to install anything. Then `gunicorn` won't be found.
2.  **Check requirements.txt**: Ensure `gunicorn` is listed inside `backend/requirements.txt` (It is already there).
