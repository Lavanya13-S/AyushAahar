# 🎯 Visual 404 Error Debugging Guide

## Part 1: WHERE TO LOOK - DevTools Network Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ Network Tab Layout                                              │
├─────────────────────────────────────────────────────────────────┤
│ Filter: All  Fetch/XHR  JS  CSS  Img  Media  Font  Doc  ...   │
├──────┬──────────┬──────────┬────────────┬──────────────────────┤
│ Name │  Status  │  Type    │  Size      │ Time                 │
├──────┼──────────┼──────────┼────────────┼──────────────────────┤
│ ✅ patients   │ 200    │ xhr      │ 2.4 KB     │ 45 ms    │
│ ❌ patients   │ 404    │ xhr      │ (failed)   │ 120 ms   │  ← LOOK FOR RED
│ ✅ main.js    │ 200    │ js       │ 145 KB     │ 230 ms   │
│ ❌ style.css  │ 404    │ css      │ (failed)   │ 80 ms    │  ← RED MEANS 404
└──────┴──────────┴──────────┴────────────┴──────────────────────┘
```

### Red = 404 Error  |  Green = Success (200, 201, etc.)

---

## Part 2: CLICK ON RED ITEM TO SEE DETAILS

```
┌─────────────────────────────────────────────────────────────┐
│ Click on failing request (red item)                         │
├─────────────────────────────────────────────────────────────┤
│ Headers │ Response │ Timing │ Cookies │ ...                │
├─────────────────────────────────────────────────────────────┤
│ REQUEST URL:                                                │
│ http://localhost:8000/api/patients  ← THIS IS THE URL      │
│                                                              │
│ REQUEST METHOD:                                              │
│ GET                                                          │
│                                                              │
│ STATUS CODE:                                                │
│ 404 Not Found                                               │
│                                                              │
│ RESPONSE:                                                   │
│ {                                                            │
│   "detail": "Not Found"                                     │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 3: WHAT EACH 404 SOURCE MEANS

### 📡 API 404s (from Network tab)

```
❌ GET http://localhost:8000/api/patients → 404
   ↓
   DIAGNOSIS:
   ├─ Backend not running?
   ├─ Route doesn't exist?
   └─ Wrong URL?
   
   SOLUTION:
   1. Start backend: uvicorn server:app --reload
   2. Check route exists in backend/server.py
   3. Verify http://localhost:8000/api works
```

### 🎨 CSS 404s

```
❌ GET http://localhost:3000/static/css/main.123.css → 404
   ↓
   DIAGNOSIS:
   ├─ Build issue with React
   ├─ Cache problem
   └─ File didn't build properly
   
   SOLUTION:
   1. Delete node_modules and package-lock.json
   2. npm install
   3. npm start (fresh build)
   4. Clear browser cache (Ctrl+Shift+Delete)
```

### 📦 JS Bundle 404s

```
❌ GET http://localhost:3000/static/js/main.456.js → 404
   ↓
   SOLUTION:
   Same as CSS - run fresh build
```

### 🖼️ Image/Asset 404s

```
❌ GET http://localhost:3000/logo.png → 404
   ↓
   DIAGNOSIS:
   ├─ Image path wrong in code
   ├─ Image file missing
   └─ Image not in public folder
   
   SOLUTION:
   1. Check path in your component: src="/logo.png"
   2. Verify file exists in frontend/public/
   3. Use absolute path: src="/assets/images/logo.png"
```

---

## Part 4: QUICK FIX DECISION TREE

```
                        ❌ 404 ERROR
                            │
                            ├─ API endpoint? (xhr type)
                            │   ├─ Backend running?
                            │   │   ├─ NO → Start: uvicorn server:app --reload
                            │   │   └─ YES → Check route exists
                            │   └─ Route exists?
                            │       ├─ NO → Add route to server.py
                            │       └─ YES → Check .env config
                            │
                            ├─ Static file? (css, js, img)
                            │   ├─ Build issue?
                            │   │   ├─ YES → npm install && npm start
                            │   │   └─ NO → Check file path
                            │   └─ File path wrong?
                            │       ├─ YES → Fix path in code
                            │       └─ NO → Check file exists
                            │
                            └─ Connection issue?
                                ├─ Can't reach localhost:8000?
                                │   ├─ YES → Start backend
                                │   └─ NO → Check firewall
                                └─ Can't reach localhost:3000?
                                    ├─ YES → Start frontend
                                    └─ NO → Port already in use
```

---

## Part 5: STEP-BY-STEP DEBUGGING

### Scenario 1: API Returns 404

```
STEP 1: Copy URL from Network tab
        http://localhost:8000/api/patients

STEP 2: Test in browser address bar
        - If blank page or error → Backend not running
        - If JSON data → Route exists but frontend issue
        - If error message → Check MongoDB

STEP 3: Check backend logs (terminal where uvicorn is running)
        Look for errors like:
        - KeyError: 'MONGO_URL'
        - FileNotFoundError: datasets/patients.json
        - No module named 'pydantic'

STEP 4: If MongoDB error:
        → Install MongoDB or update MONGO_URL in backend/.env
        → Start MongoDB: mongod (or use Atlas cloud)

STEP 5: If missing module error:
        → Run: pip install -r requirements.txt
        → Restart: uvicorn server:app --reload

STEP 6: If route error:
        → Check backend/server.py for @api_router.get("/patients")
        → If missing, add the route
```

### Scenario 2: Frontend Loading Wrong

```
STEP 1: Check Network tab, find which resource failed
        (Look for red items)

STEP 2: Note the URL
        Example: http://undefined/api/patients

STEP 3: "undefined" means REACT_APP_BACKEND_URL not set
        → Check frontend/.env exists
        → Contains: REACT_APP_BACKEND_URL=http://localhost:8000
        → Restart frontend after editing

STEP 4: If REACT_APP_BACKEND_URL=http://localhost:5000
        → Change to port 8000 (FastAPI default)
        → Restart frontend

STEP 5: Test backend is running on port 8000
        → Run: netstat -ano | find ":8000"
        → Or: uvicorn server:app --reload
```

---

## Part 6: COMMON ERROR RESPONSES

### What Backend Sends Back:

```json
// 404 - Not Found (route doesn't exist)
{
  "detail": "Not Found"
}

// 500 - Server Error (route exists but crashed)
{
  "detail": "Internal Server Error"
}

// 422 - Validation Error (wrong request format)
{
  "detail": [
    {
      "loc": ["body", "patient_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}

// 405 - Method Not Allowed (using POST instead of GET)
{
  "detail": "Method Not Allowed"
}
```

---

## Part 7: VERIFICATION COMMANDS

### Test Backend Is Responsive

**PowerShell:**
```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:8000/api" -Method GET

# Get patients
Invoke-WebRequest -Uri "http://localhost:8000/api/patients" -Method GET

# Check response code
$resp = Invoke-WebRequest -Uri "http://localhost:8000/api/patients"
$resp.StatusCode  # Should be 200
```

### Test Frontend Config

**Open browser console (F12) and run:**
```javascript
// Check if REACT_APP_BACKEND_URL is set
console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL)

// Try fetching
fetch('http://localhost:8000/api/patients')
  .then(r => r.json())
  .then(data => console.log('Success:', data))
  .catch(e => console.log('Error:', e))
```

---

## Part 8: ULTIMATE CHECKLIST

```
Before you panic about 404 errors, verify:

BACKEND
  [ ] Backend running? (uvicorn server:app --reload)
  [ ] Port 8000 listening? (netstat -ano | find ":8000")
  [ ] backend/.env exists with correct values
  [ ] MongoDB running (if required)
  [ ] All packages installed (pip install -r requirements.txt)
  [ ] No syntax errors in server.py
  [ ] Routes decorated with @api_router.get() or similar

FRONTEND
  [ ] Frontend running? (npm start)
  [ ] Port 3000 listening? (netstat -ano | find ":3000")
  [ ] frontend/.env has REACT_APP_BACKEND_URL=http://localhost:8000
  [ ] Frontend restarted after .env changes
  [ ] All packages installed (npm install)
  [ ] No build errors in npm start output

NETWORK
  [ ] Can reach backend from browser? (http://localhost:8000/api)
  [ ] DevTools Network tab shows requests
  [ ] Correct request URL (not "undefined")
  [ ] Correct HTTP method (GET vs POST)

THEN:
  [ ] Open DevTools (F12)
  [ ] Go to Network tab
  [ ] Reload page (Ctrl+R)
  [ ] Look for RED items (404s)
  [ ] If found, follow decision tree above
```

---

## 🎬 Visual Workflow

```
START
  │
  ├─→ Backend running?
  │    YES ✅ → Continue
  │    NO ❌ → Start backend
  │
  ├─→ Frontend running?
  │    YES ✅ → Continue
  │    NO ❌ → Start frontend
  │
  ├─→ Open http://localhost:3000
  │    │
  │    ├─→ See 404 in DevTools?
  │    │    YES ❌ → Find in Network tab (RED)
  │    │    NO ✅ → Might be data/logic issue
  │    │
  │    ├─→ API endpoint or static file?
  │    │    API → Check route exists in backend/server.py
  │    │    STATIC → Check file exists in frontend/public/
  │    │
  │    └─→ Fix issue and retry
  │
  └─→ END
```

---

**Remember:** The Network tab is your best friend for debugging 404s!

Look for RED items, click on them, and check the REQUEST URL.

99% of 404 errors are due to:
1. ❌ Backend not running
2. ❌ Frontend .env misconfigured  
3. ❌ Route not defined
4. ❌ File doesn't exist
5. ❌ Typo in URL/path
