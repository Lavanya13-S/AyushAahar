# ⚡ Quick 404 Fix Reference Card

## 🚨 Quick Diagnosis (30 seconds)

```bash
# Is backend running on port 8000?
netstat -ano | find ":8000"

# Is frontend running on port 3000?
netstat -ano | find ":3000"

# Can you reach backend?
http://localhost:8000/api
```

---

## ✅ Most Common Fixes

### Fix #1: Backend Not Running (90% of 404 errors)

```powershell
# Terminal 1
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload
```

**Wait for:** "Application startup complete"

---

### Fix #2: Frontend .env Wrong (8% of 404 errors)

**File:** `frontend/.env`

```bash
# CHANGE THIS:
REACT_APP_BACKEND_URL=http://localhost:5000

# TO THIS:
REACT_APP_BACKEND_URL=http://localhost:8000
```

**Then restart frontend:**
```powershell
# Terminal 2
cd frontend
npm start
```

---

### Fix #3: .env File Missing (1% of 404 errors)

**Create:** `frontend/.env`

```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000/api
WDS_SOCKET_PORT=443
```

**Create:** `backend/.env`

```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=ayushaahar_db
CORS_ORIGINS=*
OPENWEATHER_API_KEY=your_key
OCR_API_KEY=your_key
```

---

## 🔍 Finding The Problem

### In Browser DevTools:

1. Press **F12**
2. Click **Network** tab
3. Reload page (**Ctrl+R**)
4. Look for **RED** items
5. **Click** on red item
6. Check **"Request URL"** in Headers
7. Try URL in new tab

---

## 📊 404 Error Types

| Error | Cause | Fix |
|-------|-------|-----|
| `GET http://localhost:8000/api/* → 404` | Backend not running | Start backend |
| `GET http://undefined/api/* → 404` | .env not set | Set REACT_APP_BACKEND_URL |
| `GET http://localhost:3000/static/* → 404` | Build error | npm install && npm start |
| `GET http://localhost:3000/logo.png → 404` | Wrong path | Check file exists |

---

## 🎯 What To Check First

```
☑️  Backend running?        → uvicorn server:app --reload
☑️  Frontend running?       → npm start
☑️  frontend/.env correct?  → REACT_APP_BACKEND_URL=http://localhost:8000
☑️  frontend/.env exists?   → Create if missing
☑️  backend/.env exists?    → Create if missing
☑️  http://localhost:8000/api works? → If not, backend issue
☑️  MongoDB running?        → mongod (if needed)
```

---

## 💡 Pro Tips

**Tip 1:** Backend port wrong?
```powershell
uvicorn server:app --reload --port 8001
# Then update frontend/.env to port 8001
```

**Tip 2:** Port already in use?
```powershell
# Find what's using port 8000
netstat -ano | find ":8000"

# Kill the process
taskkill /PID <PID> /F
```

**Tip 3:** Fresh build needed?
```powershell
cd frontend
del node_modules
del package-lock.json
npm install
npm start
```

---

## 🚀 Full Startup Command

**Open 2 terminals:**

**Terminal 1 - Backend:**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install
npm start
```

**Then:** Open http://localhost:3000

---

## ❌ What NOT To Do

```
❌ Don't use port 5000 (that's Flask, not FastAPI)
❌ Don't forget to restart frontend after changing .env
❌ Don't assume error is permanent - try restarting
❌ Don't ignore backend logs - they show the real error
❌ Don't assume database is running - check MongoDB
```

---

## ✨ You're Good When:

```
✅ Backend: "Application startup complete"
✅ Frontend: "Compiled successfully!"
✅ Browser: http://localhost:3000 loads
✅ DevTools: Network tab shows mostly 200s
✅ No RED items in Network tab
```

---

## 📝 If You Still Have Issues

Run the diagnostic script:
```powershell
.\DIAGNOSE_404_ERRORS.bat
```

Read the full guides:
- `404_ERROR_FIX.md` - Configuration fix
- `404_COMPLETE_DEBUG_GUIDE.md` - Detailed troubleshooting
- `404_VISUAL_DEBUG_GUIDE.md` - Visual walkthrough

---

**Remember:** The #1 cause of 404 errors is **backend not running!**

Start with: `uvicorn server:app --reload`

Then if it still fails, check frontend `.env` file.

99% of the time, one of these two fixes it! ✅
