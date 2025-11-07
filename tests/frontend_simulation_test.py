#!/usr/bin/env python3
"""
Simulate frontend request to test the exact scenario causing "Failed to load patients"
"""

import requests
import json

def test_frontend_simulation():
    """Simulate the exact request the frontend makes"""
    
    # This is the exact URL and headers the frontend would use
    frontend_url = "http://localhost:3001"
    api_url = f"{frontend_url}/api/patients"
    
    # Headers that a browser would send
    headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Origin': frontend_url,
        'Referer': f"{frontend_url}/patients",
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print("🧪 Frontend Request Simulation Test")
    print("=" * 50)
    print(f"Simulating request from: {frontend_url}")
    print(f"Target API: {api_url}")
    print(f"Headers: {json.dumps(headers, indent=2)}")
    
    try:
        # Make the request exactly as the frontend would
        response = requests.get(api_url, headers=headers, timeout=15)
        
        print(f"\n📊 Response Details:")
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"\n✅ SUCCESS: Request successful")
                print(f"Response Type: {type(data)}")
                print(f"Data Length: {len(data) if isinstance(data, list) else 'Not a list'}")
                
                if isinstance(data, list) and len(data) > 0:
                    print(f"Sample Patient: {data[0].get('PatientID', 'No ID')} - {data[0].get('Name', 'No Name')}")
                    return True
                else:
                    print(f"❌ ISSUE: Empty or invalid response data")
                    return False
                    
            except json.JSONDecodeError:
                print(f"❌ ISSUE: Response is not valid JSON")
                print(f"Raw response: {response.text[:200]}...")
                return False
        else:
            print(f"❌ ISSUE: HTTP Error {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ ISSUE: Request timeout")
        return False
    except requests.exceptions.ConnectionError:
        print(f"❌ ISSUE: Connection error")
        return False
    except Exception as e:
        print(f"❌ ISSUE: Unexpected error: {str(e)}")
        return False

def test_preflight_request():
    """Test CORS preflight request"""
    
    frontend_url = "http://localhost:3001"
    api_url = f"{frontend_url}/api/patients"
    
    print(f"\n🔍 Testing CORS Preflight Request")
    print("=" * 50)
    
    # CORS preflight headers
    preflight_headers = {
        'Origin': frontend_url,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'accept, cache-control'
    }
    
    try:
        response = requests.options(api_url, headers=preflight_headers, timeout=10)
        
        print(f"Preflight Status: {response.status_code}")
        print(f"Preflight Headers:")
        for key, value in response.headers.items():
            if 'access-control' in key.lower():
                print(f"  {key}: {value}")
        
        # Check if CORS is properly configured
        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        cors_methods = response.headers.get('Access-Control-Allow-Methods')
        cors_headers = response.headers.get('Access-Control-Allow-Headers')
        
        if cors_origin and ('*' in cors_origin or frontend_url in cors_origin):
            print(f"✅ CORS Origin OK: {cors_origin}")
        else:
            print(f"❌ CORS Origin Issue: {cors_origin}")
            
        if cors_methods and 'GET' in cors_methods:
            print(f"✅ CORS Methods OK: {cors_methods}")
        else:
            print(f"❌ CORS Methods Issue: {cors_methods}")
            
        return response.status_code in [200, 204]
        
    except Exception as e:
        print(f"❌ Preflight request failed: {str(e)}")
        return False

def test_axios_simulation():
    """Test using axios-like request (what the frontend actually uses)"""
    
    print(f"\n📡 Testing Axios-like Request")
    print("=" * 50)
    
    frontend_url = "http://localhost:3001"
    api_url = f"{frontend_url}/api/patients"
    
    # Axios default headers
    axios_headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Origin': frontend_url,
        'Referer': f"{frontend_url}/patients"
    }
    
    try:
        response = requests.get(api_url, headers=axios_headers, timeout=15)
        
        print(f"Axios-like Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Axios-like request successful")
                print(f"Patients found: {len(data) if isinstance(data, list) else 'Invalid data'}")
                return True
            except:
                print(f"❌ Axios-like request: Invalid JSON response")
                return False
        else:
            print(f"❌ Axios-like request failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Axios-like request error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Diagnosing 'Failed to load patients' Error")
    print("=" * 60)
    
    results = []
    
    # Test 1: Basic frontend simulation
    results.append(("Frontend Simulation", test_frontend_simulation()))
    
    # Test 2: CORS preflight
    results.append(("CORS Preflight", test_preflight_request()))
    
    # Test 3: Axios simulation
    results.append(("Axios Simulation", test_axios_simulation()))
    
    print(f"\n📊 FINAL DIAGNOSIS")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    if passed == total:
        print(f"\n✅ CONCLUSION: API is working correctly")
        print(f"   The 'Failed to load patients' error is likely due to:")
        print(f"   1. Frontend JavaScript errors")
        print(f"   2. Network connectivity issues")
        print(f"   3. Browser-specific issues")
        print(f"   4. Authentication/session issues")
    else:
        print(f"\n❌ CONCLUSION: API has issues that could cause 'Failed to load patients'")
        print(f"   Check the failed tests above for specific problems")