#!/usr/bin/env python3
"""
Focused test for patient loading functionality that's causing "Failed to load patients" error
"""

import requests
import json
import sys
from datetime import datetime

class PatientLoadingTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.issues_found = []

    def log_issue(self, issue):
        """Log an issue found during testing"""
        self.issues_found.append(issue)
        print(f"❌ ISSUE: {issue}")

    def log_success(self, message):
        """Log a successful test"""
        print(f"✅ SUCCESS: {message}")

    def test_cors_and_connectivity(self):
        """Test CORS and basic connectivity to the API"""
        print(f"\n🌐 Testing CORS and Connectivity...")
        
        try:
            # Test basic connectivity
            response = requests.get(f"{self.api_url}/", timeout=10)
            print(f"   API Root Status: {response.status_code}")
            
            if response.status_code == 200:
                self.log_success("API is accessible and responding")
                
                # Check CORS headers
                cors_headers = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
                }
                
                print(f"   CORS Headers: {cors_headers}")
                
                if cors_headers['Access-Control-Allow-Origin']:
                    self.log_success(f"CORS configured: {cors_headers['Access-Control-Allow-Origin']}")
                else:
                    self.log_issue("CORS headers not found - this could cause frontend access issues")
                    
                return True
            else:
                self.log_issue(f"API not accessible - Status: {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            self.log_issue("API request timeout - connectivity issues")
            return False
        except Exception as e:
            self.log_issue(f"API connectivity error: {str(e)}")
            return False

    def test_get_patients_endpoint(self):
        """Test GET /api/patients endpoint in detail"""
        print(f"\n👥 Testing GET /api/patients Endpoint...")
        
        try:
            response = requests.get(f"{self.api_url}/patients", timeout=15)
            print(f"   Status Code: {response.status_code}")
            print(f"   Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                self.log_success("GET /api/patients endpoint is accessible")
                
                try:
                    data = response.json()
                    print(f"   Response Type: {type(data)}")
                    print(f"   Response Length: {len(data) if isinstance(data, list) else 'Not a list'}")
                    
                    if isinstance(data, list):
                        self.log_success(f"Response is a list with {len(data)} items")
                        
                        if len(data) >= 10:
                            self.log_success(f"Found {len(data)} patients (expected at least 10)")
                            
                            # Check first few patients structure
                            for i, patient in enumerate(data[:3]):
                                print(f"\n   Patient {i+1} Structure:")
                                print(f"     Keys: {list(patient.keys())}")
                                
                                required_fields = ["PatientID", "Name", "Age", "Gender", "City"]
                                missing_fields = [field for field in required_fields if field not in patient]
                                
                                if missing_fields:
                                    self.log_issue(f"Patient {i+1} missing required fields: {missing_fields}")
                                else:
                                    self.log_success(f"Patient {i+1} has all required fields")
                                    print(f"     Sample: {patient.get('PatientID')} - {patient.get('Name')}")
                            
                            # Check for expected patient IDs
                            expected_ids = ["PS001", "RK002", "MP003", "AS004", "KN005", "DG006", "ST007", "VR008", "AN009", "RM010"]
                            found_ids = [p.get("PatientID", "") for p in data]
                            
                            missing_expected = [pid for pid in expected_ids if pid not in found_ids]
                            if missing_expected:
                                self.log_issue(f"Missing expected patient IDs: {missing_expected}")
                            else:
                                self.log_success("All expected patient IDs found")
                                
                            return True, data
                        else:
                            self.log_issue(f"Too few patients returned: {len(data)} (expected at least 10)")
                            return False, data
                    else:
                        self.log_issue(f"Response is not a list: {type(data)}")
                        print(f"   Actual response: {data}")
                        return False, data
                        
                except json.JSONDecodeError as e:
                    self.log_issue(f"Response is not valid JSON: {str(e)}")
                    print(f"   Raw response: {response.text[:500]}...")
                    return False, None
                    
            else:
                self.log_issue(f"GET /api/patients failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error details: {error_data}")
                except:
                    print(f"   Raw error: {response.text}")
                return False, None
                
        except Exception as e:
            self.log_issue(f"GET /api/patients request failed: {str(e)}")
            return False, None

    def test_specific_patient_retrieval(self):
        """Test GET /api/patients/{id} for specific patients"""
        print(f"\n🔍 Testing Specific Patient Retrieval...")
        
        test_patients = [
            {"id": "PS001", "name": "Priya Sharma"},
            {"id": "RK002", "name": "Rajesh Kumar"},
            {"id": "MP003", "name": "Meera Patel"}
        ]
        
        all_success = True
        
        for patient in test_patients:
            patient_id = patient["id"]
            expected_name = patient["name"]
            
            try:
                response = requests.get(f"{self.api_url}/patients/{patient_id}", timeout=10)
                print(f"\n   Testing Patient {patient_id}:")
                print(f"     Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        returned_id = data.get("PatientID", "")
                        returned_name = data.get("Name", "")
                        
                        if returned_id == patient_id and returned_name == expected_name:
                            self.log_success(f"Patient {patient_id} retrieved correctly: {returned_name}")
                        else:
                            self.log_issue(f"Patient {patient_id} data mismatch - Expected: {expected_name}, Got: {returned_name}")
                            all_success = False
                            
                    except json.JSONDecodeError:
                        self.log_issue(f"Patient {patient_id} response is not valid JSON")
                        all_success = False
                        
                elif response.status_code == 404:
                    self.log_issue(f"Patient {patient_id} not found (404)")
                    all_success = False
                else:
                    self.log_issue(f"Patient {patient_id} request failed with status {response.status_code}")
                    all_success = False
                    
            except Exception as e:
                self.log_issue(f"Patient {patient_id} request error: {str(e)}")
                all_success = False
        
        return all_success

    def test_database_integration(self):
        """Test if both static and database patients are returned"""
        print(f"\n💾 Testing Database Integration...")
        
        success, patients_data = self.test_get_patients_endpoint()
        
        if not success or not patients_data:
            self.log_issue("Cannot test database integration - GET /api/patients failed")
            return False
        
        # Check if we have both static and database patients
        static_patient_ids = ["PS001", "RK002", "MP003", "AS004", "KN005", "DG006", "ST007", "VR008", "AN009", "RM010"]
        found_static = [p for p in patients_data if p.get("PatientID") in static_patient_ids]
        found_database = [p for p in patients_data if p.get("PatientID") not in static_patient_ids]
        
        print(f"   Static patients found: {len(found_static)}")
        print(f"   Database patients found: {len(found_database)}")
        
        if len(found_static) == 10:
            self.log_success("All 10 static patients found")
        else:
            self.log_issue(f"Missing static patients: {10 - len(found_static)}")
        
        if len(found_database) > 0:
            self.log_success(f"Database integration working - {len(found_database)} database patients found")
            # Show sample database patient
            sample_db_patient = found_database[0]
            print(f"     Sample DB patient: {sample_db_patient.get('PatientID')} - {sample_db_patient.get('Name')}")
        else:
            print(f"   No database patients found (this may be normal if no patients were created)")
        
        return len(found_static) == 10

    def test_response_format_compatibility(self):
        """Test if response format matches what frontend expects"""
        print(f"\n📋 Testing Response Format Compatibility...")
        
        success, patients_data = self.test_get_patients_endpoint()
        
        if not success or not patients_data:
            self.log_issue("Cannot test response format - GET /api/patients failed")
            return False
        
        # Check expected frontend fields
        expected_frontend_fields = [
            "PatientID", "Name", "Age", "Gender", "City", 
            "Constitution", "Condition", "Allergies"
        ]
        
        sample_patient = patients_data[0]
        print(f"   Sample patient fields: {list(sample_patient.keys())}")
        
        missing_fields = [field for field in expected_frontend_fields if field not in sample_patient]
        extra_fields = [field for field in sample_patient.keys() if field not in expected_frontend_fields + ["_id"]]
        
        if missing_fields:
            self.log_issue(f"Missing fields expected by frontend: {missing_fields}")
            return False
        else:
            self.log_success("All expected frontend fields present")
        
        if extra_fields:
            print(f"   Extra fields (may be okay): {extra_fields}")
        
        # Check data types
        type_checks = [
            ("PatientID", str),
            ("Name", str),
            ("Age", int),
            ("Gender", str),
            ("City", str),
            ("Constitution", str),
            ("Condition", str),
            ("Allergies", list)
        ]
        
        for field, expected_type in type_checks:
            if field in sample_patient:
                actual_type = type(sample_patient[field])
                if actual_type != expected_type:
                    self.log_issue(f"Field {field} has wrong type: expected {expected_type.__name__}, got {actual_type.__name__}")
                    return False
        
        self.log_success("All field types match frontend expectations")
        return True

    def test_backend_errors_and_logs(self):
        """Check for backend errors that might not be visible"""
        print(f"\n🔍 Testing for Backend Errors...")
        
        # Test with various edge cases that might cause backend errors
        test_cases = [
            {"url": f"{self.api_url}/patients", "description": "Normal patients request"},
            {"url": f"{self.api_url}/patients/", "description": "Patients request with trailing slash"},
            {"url": f"{self.api_url}/patients?limit=10", "description": "Patients request with query params"},
        ]
        
        for test_case in test_cases:
            try:
                response = requests.get(test_case["url"], timeout=10)
                print(f"\n   {test_case['description']}:")
                print(f"     Status: {response.status_code}")
                print(f"     Content-Type: {response.headers.get('content-type', 'Not set')}")
                
                if response.status_code >= 500:
                    self.log_issue(f"Server error for {test_case['description']}: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"     Error details: {error_data}")
                    except:
                        print(f"     Raw error: {response.text[:200]}...")
                elif response.status_code >= 400:
                    print(f"     Client error (may be expected): {response.status_code}")
                else:
                    print(f"     Success: {response.status_code}")
                    
            except Exception as e:
                self.log_issue(f"Request failed for {test_case['description']}: {str(e)}")

    def run_comprehensive_patient_loading_test(self):
        """Run comprehensive test for patient loading functionality"""
        print(f"🧪 Comprehensive Patient Loading Test")
        print(f"=" * 60)
        print(f"Testing the 'Failed to load patients' error")
        print(f"API Base URL: {self.api_url}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all tests
        tests = [
            ("CORS and Connectivity", self.test_cors_and_connectivity),
            ("GET /api/patients Endpoint", lambda: self.test_get_patients_endpoint()[0]),
            ("Specific Patient Retrieval", self.test_specific_patient_retrieval),
            ("Database Integration", self.test_database_integration),
            ("Response Format Compatibility", self.test_response_format_compatibility),
            ("Backend Errors Check", lambda: (self.test_backend_errors_and_logs(), True)[1])
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            print(f"\n" + "="*60)
            try:
                result = test_func()
                results[test_name] = result
                if result:
                    print(f"✅ {test_name}: PASSED")
                else:
                    print(f"❌ {test_name}: FAILED")
            except Exception as e:
                print(f"❌ {test_name}: ERROR - {str(e)}")
                results[test_name] = False
        
        # Summary
        print(f"\n" + "="*60)
        print(f"📊 PATIENT LOADING TEST SUMMARY")
        print(f"="*60)
        
        passed_tests = sum(1 for result in results.values() if result)
        total_tests = len(results)
        
        print(f"Tests Passed: {passed_tests}/{total_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.issues_found:
            print(f"\n🚨 ISSUES FOUND ({len(self.issues_found)}):")
            for i, issue in enumerate(self.issues_found, 1):
                print(f"   {i}. {issue}")
        else:
            print(f"\n✅ NO ISSUES FOUND - Patient loading should work correctly")
        
        # Specific diagnosis for "Failed to load patients" error
        print(f"\n🔍 DIAGNOSIS FOR 'Failed to load patients' ERROR:")
        
        if not results.get("CORS and Connectivity", False):
            print(f"❌ LIKELY CAUSE: API connectivity or CORS issues")
            print(f"   - Check if backend is running and accessible")
            print(f"   - Verify CORS configuration allows frontend domain")
            
        elif not results.get("GET /api/patients Endpoint", False):
            print(f"❌ LIKELY CAUSE: GET /api/patients endpoint issues")
            print(f"   - Check backend logs for errors")
            print(f"   - Verify database connection")
            print(f"   - Check if patients.json file exists and is readable")
            
        elif not results.get("Response Format Compatibility", False):
            print(f"❌ LIKELY CAUSE: Response format mismatch")
            print(f"   - Frontend expects different field names or types")
            print(f"   - Check frontend PatientManagement.js for expected format")
            
        elif not results.get("Database Integration", False):
            print(f"⚠️  POSSIBLE CAUSE: Database integration issues")
            print(f"   - Static patients loading but database patients may have issues")
            print(f"   - Check MongoDB connection and patient_diet_charts collection")
            
        else:
            print(f"✅ API appears to be working correctly")
            print(f"   - The issue may be in frontend code or network connectivity")
            print(f"   - Check browser console for JavaScript errors")
            print(f"   - Verify frontend is using correct API URL")
        
        return results

if __name__ == "__main__":
    tester = PatientLoadingTester()
    results = tester.run_comprehensive_patient_loading_test()
    
    # Exit with error code if any critical tests failed
    critical_tests = ["CORS and Connectivity", "GET /api/patients Endpoint"]
    critical_failures = [test for test in critical_tests if not results.get(test, False)]
    
    if critical_failures:
        print(f"\n❌ CRITICAL TEST FAILURES: {critical_failures}")
        sys.exit(1)
    else:
        print(f"\n✅ CRITICAL TESTS PASSED")
        sys.exit(0)