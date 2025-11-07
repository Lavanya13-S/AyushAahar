# 404 Error - Root Cause & Solution

## ❌ Problem Identified

**Frontend .env configuration was pointing to wrong backend URL:**
- **Was:** `REACT_APP_BACKEND_URL=http://localhost:5000`
- **Should be:** `REACT_APP_BACKEND_URL=http://localhost:8000`

## Why This Happened

1. **FastAPI uses port 8000 by default** (not Flask's 5000)
2. **Your backend is FastAPI**, not Flask
3. Frontend couldn't reach the API endpoints because it was looking at the wrong port
4. Result: **404 errors** when trying to fetch `/api/patients`, `/api/appointments`, etc.

## ✅ Solution Applied

### 1. **Updated Frontend Configuration**
```
File: frontend/.env
Change: REACT_APP_BACKEND_URL=http://localhost:8000
Added: REACT_APP_API_URL=http://localhost:8000/api
```

### 2. **Backend Configuration Already Correct**
```
File: backend/.env
- MONGO_URL configured
- DB_NAME set
- CORS_ORIGINS configured
- API keys set
```

## 🚀 Steps to Run Application

### Terminal 1 - Start Backend (FastAPI on port 8000)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
uvicorn server:app --reload  # Starts on port 8000
```

### Terminal 2 - Start Frontend (React on port 3000)
```bash
cd frontend
npm install
npm start  # Starts on port 3000
```

## 🔍 Verification Checklist

After starting both servers:

1. **Open Browser DevTools** (F12)
2. **Check Network tab** for requests
3. **Verify API URLs** match your backend:
   - `http://localhost:8000/api/patients` ✅
   - `http://localhost:8000/api/appointments` ✅

4. **Check if requests return 200** (not 404)

## 📝 Common API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients` | GET | Fetch all patients |
| `/api/patients/{id}` | GET | Get patient by ID |
| `/api/patients` | POST | Create new patient |
| `/api/appointments` | GET | Get all appointments |
| `/api/appointments/today` | GET | Today's appointments |
| `/api/generate-enhanced-diet-chart` | POST | Generate diet plan |

## 💡 Additional Tips

- **Port 8000 is in use?** Change in backend:
  ```bash
  uvicorn server:app --reload --port 8001
  ```
  Then update `.env`: `REACT_APP_BACKEND_URL=http://localhost:8001`

- **CORS Issues?** Already handled in backend with:
  ```python
  allow_origins=os.environ.get('CORS_ORIGINS', '*').split(',')
  ```

- **MongoDB not running?** Start it:
  ```bash
  mongod  # or use MongoDB Atlas cloud
  ```

## ✨ After Fix

The 404 errors should disappear! Your frontend will successfully communicate with:
- Patient data endpoints
- Appointment management
- Diet chart generation
- Recipe parsing
- Smart swaps
- Weather integration
