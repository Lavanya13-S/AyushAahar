# 🔍 Complete 404 Error Debugging Guide for AyushAahar

## 📋 Quick Reference: What Could Be Causing Your 404s

| Category | Possible 404 Sources |
|----------|---------------------|
| **API Endpoints** | `/api/patients`, `/api/appointments`, `/api/generate-enhanced-diet-chart` |
| **Static Assets** | CSS files, JS bundles, images, fonts |
| **Frontend Routes** | Wrong navigation URLs, typos in page paths |
| **Backend Routes** | Missing route definitions, wrong HTTP methods |

---

## 🛠️ Step-by-Step Debugging Process

### Step 1: Open DevTools Network Tab

```
1. Press F12 (or Right-click → Inspect)
2. Click on "Network" tab
3. Reload the page (Ctrl+R or F5)
4. Look for RED items with "404" status
```

### Step 2: Identify the Failing Resource

**Check the table columns:**
- **Name**: The filename or API endpoint
- **Status**: Should show "404 Not Found"
- **Type**: (xhr, img, js, css, etc.)
- **Size**: Should show an error message

### Step 3: Copy the Exact URL

```
1. Click on the failing request
2. Go to "Headers" tab
3. Find "Request URL"
4. Copy the full URL
```

### Step 4: Test the URL Directly

Paste it in your browser address bar:
- **If you get JSON response**: Endpoint exists but might have other issues
- **If you get HTML error page**: Resource doesn't exist
- **If you get connection refused**: Backend is not running

---

## 🔧 Common 404 Issues in AyushAahar

### Issue 1: Backend Not Running

**Symptoms:**
- All `/api/*` endpoints return 404
- Error: `localhost:8000 refused to connect`

**Solution:**
```bash
# Terminal 1 - Start FastAPI backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload
```

**Verify it's running:**
- Open `http://localhost:8000/api` in browser
- Should show: `{"message": "AyushAahar API - Intelligent Ayurvedic Diet Chart Generator"}`

---

### Issue 2: Frontend .env Not Set

**Symptoms:**
- Frontend making requests to wrong URL
- Network shows: `GET http://undefined/api/patients`

**Solution:**
```bash
# File: frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000/api
WDS_SOCKET_PORT=443
```

**After editing .env:**
```bash
# Terminal 2 - Restart frontend (IMPORTANT)
cd frontend
npm start  # Stops and restarts to reload .env
```

---

### Issue 3: Missing API Routes

**Symptoms:**
- GET `/api/patients` returns 404
- Other endpoints work

**Check in backend/server.py:**
```python
# Should exist somewhere in the file:
@api_router.get("/patients")
async def get_patients():
    """Get all patients from dataset and database"""
    # ... implementation ...
```

**If route is missing:**
Add it to backend/server.py

---

### Issue 4: CORS Issues (Different Domain)

**Symptoms:**
- Request gets blocked by CORS
- Console error mentions CORS

**Backend Configuration (backend/.env):**
```
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Backend Code (server.py):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue 5: Static Asset Paths

**Symptoms:**
- CSS files return 404
- JS bundles return 404
- Images return 404

**Check paths in HTML/CSS:**
```html
<!-- Incorrect (relative path wrong) -->
<img src="logo.png" alt="Logo">

<!-- Correct (from public folder) -->
<img src="/logo.png" alt="Logo">
```

---

## 📊 Testing API Endpoints

### Using Browser Address Bar

```
http://localhost:8000/api/patients
→ Should show JSON array of patients

http://localhost:8000/api/appointments
→ Should show JSON array of appointments
```

### Using cURL (PowerShell)

```powershell
# Test if backend is running
Invoke-WebRequest -Uri "http://localhost:8000/api" -Method GET

# Get patients
Invoke-WebRequest -Uri "http://localhost:8000/api/patients" -Method GET

# Check response status
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/patients"
$response.StatusCode  # Should be 200
```

### Using axios in Browser Console

```javascript
// Open DevTools Console and run:
axios.get('http://localhost:8000/api/patients')
  .then(res => console.log('Success:', res.data))
  .catch(err => console.log('Error:', err.response.status, err.message))
```

---

## ✅ Verification Checklist

Before assuming you have a 404 error, verify:

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 3000
- [ ] `frontend/.env` has `REACT_APP_BACKEND_URL=http://localhost:8000`
- [ ] Frontend was restarted after .env changes
- [ ] MongoDB is running (if backend needs it)
- [ ] All required Python packages are installed (`pip install -r requirements.txt`)
- [ ] All required Node packages are installed (`npm install`)
- [ ] DevTools Network tab shows the exact failing URL
- [ ] You tested the URL directly in browser or with curl

---

## 🚨 If You Still See 404s

### Gather Debug Information

1. **Note the exact URL from Network tab**
2. **Check response body** (click Request → Response tab)
3. **Check the error in browser console**
4. **Verify backend logs** for any error messages

### Common Backend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `KeyError: 'MONGO_URL'` | Missing .env file | Create backend/.env with all keys |
| `FileNotFoundError: food_dataset.json` | Dataset missing | Check backend/datasets/ folder |
| `CORS origin not allowed` | Frontend domain not in CORS_ORIGINS | Update backend/.env |
| `Module not found` | Missing Python package | Run `pip install -r requirements.txt` |

---

## 📝 API Endpoints Reference

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api` | GET | Health check | ✅ |
| `/api/patients` | GET | Get all patients | ✅ |
| `/api/patients` | POST | Create patient | ✅ |
| `/api/patients/{id}` | GET | Get patient by ID | ✅ |
| `/api/patients/{id}/diet-charts` | GET | Get patient's diet charts | ✅ |
| `/api/appointments` | GET | Get all appointments | ✅ |
| `/api/appointments/today` | GET | Today's appointments | ✅ |
| `/api/appointments` | POST | Create appointment | ✅ |
| `/api/generate-enhanced-diet-chart` | POST | Generate diet chart | ✅ |
| `/api/parse-recipe` | POST | Parse recipe text/image | ✅ |
| `/api/smart-swaps/{food_key}` | GET | Get food alternatives | ✅ |
| `/api/weather/{location}` | GET | Get weather data | ✅ |

---

## 💡 Pro Tips

### Tip 1: Use VS Code REST Client Extension
```
Install: REST Client extension in VS Code
Create: requests.rest file with:

GET http://localhost:8000/api/patients

Click: "Send Request" button
```

### Tip 2: Enable Verbose Logging
```python
# In backend/server.py
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
```

### Tip 3: Test with Simple Endpoints First
```
1. Test: http://localhost:8000/api
   (Should always work - health check)
2. Test: http://localhost:8000/api/patients
   (If fails, check database connection)
```

---

## 🎯 Quick Fix Workflow

```
1. ❌ See 404 error
   ↓
2. ✅ Open DevTools (F12)
   ↓
3. ✅ Go to Network tab, reload
   ↓
4. ✅ Find red 404 request
   ↓
5. ✅ Click on it, check URL
   ↓
6. ✅ Try URL in new tab / curl
   ↓
7. ✅ Check backend logs for errors
   ↓
8. ✅ Verify .env files correct
   ↓
9. ✅ Restart frontend/backend
   ↓
10. ✅ Reload application
```

---

## 📞 Need Help?

When reporting a 404 issue, provide:
1. **Exact URL** from Network tab
2. **HTTP Method** (GET/POST/etc)
3. **Response body** (if any)
4. **Status code** (should be 404)
5. **Backend logs** output
6. **Browser console errors**

---

**Remember:** Most 404 errors are due to:
- Backend not running ❌
- Wrong .env configuration ❌
- Missing files ❌
- Typos in URLs ❌
- Frontend/backend port mismatch ❌

Check these first! ✅
