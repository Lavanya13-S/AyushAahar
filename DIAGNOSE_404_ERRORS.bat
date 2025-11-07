@echo off
REM 404 Error Diagnostic Script for AyushAahar
REM This script helps identify and troubleshoot 404 errors

TITLE AyushAahar 404 Diagnostics
COLOR 0A

echo.
echo =========================================================
echo     AyushAahar 404 Error Diagnostic Tool
echo =========================================================
echo.

REM Check if backend is running
echo [1] Checking if backend is running on port 8000...
netstat -ano | find ":8000" >nul
if errorlevel 1 (
    echo     ❌ Backend NOT running on port 8000
    echo     FIX: Start backend with: uvicorn server:app --reload
) else (
    echo     ✅ Backend is running on port 8000
)

echo.

REM Check if frontend is running
echo [2] Checking if frontend is running on port 3000...
netstat -ano | find ":3000" >nul
if errorlevel 1 (
    echo     ❌ Frontend NOT running on port 3000
    echo     FIX: Start frontend with: npm start
) else (
    echo     ✅ Frontend is running on port 3000
)

echo.

REM Check if MongoDB is running
echo [3] Checking if MongoDB is running on port 27017...
netstat -ano | find ":27017" >nul
if errorlevel 1 (
    echo     ⚠️  MongoDB NOT running on port 27017
    echo     NOTE: Backend may fail if MongoDB is required
) else (
    echo     ✅ MongoDB is running
)

echo.

REM Check backend .env file
echo [4] Checking backend configuration...
if exist "backend\.env" (
    echo     ✅ backend\.env exists
    findstr "MONGO_URL" backend\.env >nul
    if errorlevel 1 (
        echo     ❌ MONGO_URL not configured
    ) else (
        echo     ✅ MONGO_URL configured
    )
) else (
    echo     ❌ backend\.env NOT found
    echo     FIX: Create backend\.env with required variables
)

echo.

REM Check frontend .env file
echo [5] Checking frontend configuration...
if exist "frontend\.env" (
    echo     ✅ frontend\.env exists
    findstr "REACT_APP_BACKEND_URL" frontend\.env >nul
    if errorlevel 1 (
        echo     ❌ REACT_APP_BACKEND_URL not configured
    ) else (
        echo     ✅ REACT_APP_BACKEND_URL configured
        findstr "localhost:8000" frontend\.env >nul
        if errorlevel 1 (
            echo     ⚠️  WARNING: Not pointing to localhost:8000
        ) else (
            echo     ✅ Pointing to localhost:8000
        )
    )
) else (
    echo     ❌ frontend\.env NOT found
    echo     FIX: Create frontend\.env with REACT_APP_BACKEND_URL
)

echo.

REM Check if dataset files exist
echo [6] Checking backend dataset files...
if exist "backend\datasets\food_dataset.json" (
    echo     ✅ food_dataset.json found
) else (
    echo     ❌ food_dataset.json NOT found
)

if exist "backend\datasets\patients.json" (
    echo     ✅ patients.json found
) else (
    echo     ❌ patients.json NOT found
)

if exist "backend\datasets\allergy_map.json" (
    echo     ✅ allergy_map.json found
) else (
    echo     ❌ allergy_map.json NOT found
)

echo.

REM Test API endpoint
echo [7] Testing API endpoints...
echo     Testing: http://localhost:8000/api
powershell -Command "Try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/api' -Method GET -ErrorAction Stop; Write-Host '    ✅ Health check passed' } Catch { Write-Host '    ❌ Cannot reach backend:' $_.Exception.Message }"

echo.
echo [8] Recommendations:
echo.
echo If you see ❌ marks above, follow these steps:
echo.
echo 1. START BACKEND:
echo    cd backend
echo    python -m venv venv
echo    venv\Scripts\activate
echo    pip install -r requirements.txt
echo    uvicorn server:app --reload
echo.
echo 2. IN ANOTHER TERMINAL, START FRONTEND:
echo    cd frontend
echo    npm install
echo    npm start
echo.
echo 3. VERIFY FRONTEND .env HAS:
echo    REACT_APP_BACKEND_URL=http://localhost:8000
echo.
echo 4. RESTART FRONTEND AFTER CHANGING .env
echo.
echo 5. OPEN http://localhost:3000 IN BROWSER
echo.
echo 6. PRESS F12, GO TO NETWORK TAB
echo.
echo 7. LOOK FOR RED ITEMS (404 errors)
echo.
echo =========================================================
echo.
pause
