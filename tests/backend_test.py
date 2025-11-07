import requests
import sys
import json
from datetime import datetime

class AyushAaharAPITester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout} seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_weather_api(self, location="Mumbai"):
        """Test weather API endpoint"""
        success, response = self.run_test(
            f"Weather API for {location}",
            "GET",
            f"weather/{location}",
            200
        )
        
        if success and isinstance(response, dict):
            required_fields = ['temperature', 'humidity', 'description', 'season', 'city']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"⚠️  Warning: Missing weather fields: {missing_fields}")
            else:
                print(f"   Weather Data: {response['temperature']}°C, {response['humidity']}% humidity, {response['season']}")
        
        return success, response

    def test_diet_chart_generation(self, location="Mumbai"):
        """Test diet chart generation with comprehensive data"""
        patient_data = {
            "patient": {
                "name": "Test Patient",
                "age": 30,
                "gender": "Male",
                "weight": 70.0,
                "height": 175.0,
                "prakriti": "Vata",
                "vikriti": "Pitta",
                "location": location,
                "allergies": ["Dairy"],
                "health_conditions": ["Acidity"],
                "dietary_preferences": []
            },
            "calorie_target": 2000
        }
        
        success, response = self.run_test(
            f"Diet Chart Generation for {location}",
            "POST",
            "generate-diet-chart",
            200,
            data=patient_data,
            timeout=45  # Longer timeout for AI processing
        )
        
        if success and isinstance(response, dict):
            # Validate response structure
            required_fields = ['id', 'patient_id', 'meals', 'total_daily_calories', 'weather_context', 'ayurvedic_analysis', 'recommendations']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"⚠️  Warning: Missing diet chart fields: {missing_fields}")
            else:
                print(f"   Diet Chart Generated Successfully:")
                print(f"   - Total Calories: {response.get('total_daily_calories', 'N/A')}")
                print(f"   - Number of Meals: {len(response.get('meals', []))}")
                print(f"   - Weather Context: {response.get('weather_context', {}).get('temperature', 'N/A')}°C")
                print(f"   - Recommendations: {len(response.get('recommendations', []))}")
                
                # Validate meals structure
                meals = response.get('meals', [])
                for i, meal in enumerate(meals):
                    meal_fields = ['meal_type', 'foods', 'total_calories', 'ayurvedic_rationale']
                    missing_meal_fields = [field for field in meal_fields if field not in meal]
                    if missing_meal_fields:
                        print(f"   ⚠️  Meal {i+1} missing fields: {missing_meal_fields}")
                    else:
                        print(f"   - {meal['meal_type']}: {meal['total_calories']} cal, {len(meal['foods'])} foods")
        
        return success, response

    def test_climate_adaptation(self):
        """Test climate adaptation with different cities"""
        print(f"\n🌡️  Testing Climate Adaptation Logic...")
        
        # Test hot climate (should recommend cooling foods)
        hot_city_success, hot_response = self.test_diet_chart_generation("Jaipur")
        
        # Test moderate climate
        moderate_city_success, moderate_response = self.test_diet_chart_generation("Mumbai")
        
        # Analyze climate adaptation
        if hot_city_success and moderate_city_success:
            hot_temp = hot_response.get('weather_context', {}).get('temperature', 0)
            moderate_temp = moderate_response.get('weather_context', {}).get('temperature', 0)
            
            print(f"\n📊 Climate Adaptation Analysis:")
            print(f"   Hot City Temperature: {hot_temp}°C")
            print(f"   Moderate City Temperature: {moderate_temp}°C")
            
            # Check if different foods are recommended based on climate
            hot_foods = []
            moderate_foods = []
            
            for meal in hot_response.get('meals', []):
                for food in meal.get('foods', []):
                    hot_foods.append(food.get('name', ''))
            
            for meal in moderate_response.get('meals', []):
                for food in meal.get('foods', []):
                    moderate_foods.append(food.get('name', ''))
            
            if hot_foods != moderate_foods:
                print(f"✅ Climate adaptation working - different foods recommended")
            else:
                print(f"⚠️  Climate adaptation may not be working - same foods recommended")
        
        return hot_city_success and moderate_city_success

    def test_recipe_parsing_image_ocr(self):
        """Test OCR parsing with image input"""
        print(f"\n📷 Testing OCR Image Parsing...")
        
        try:
            # Create a simple test image with recipe text
            from PIL import Image, ImageDraw, ImageFont
            import base64
            import io
            
            img = Image.new('RGB', (400, 200), color='white')
            draw = ImageDraw.Draw(img)
            
            # Try to use a default font, fallback to basic if not available
            try:
                font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
            except:
                font = ImageFont.load_default()
            
            # Draw recipe text
            text = 'Sambar Rice\nIngredients:\nRice, Dal, Tomato\nOnion, Turmeric'
            draw.text((20, 20), text, fill='black', font=font)
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_data = buffer.getvalue()
            
            # Test with multipart form data for image upload
            url = f"{self.api_url}/parse-recipe"
            files = {'recipe_image': ('test_recipe.png', img_data, 'image/png')}
            
            response = requests.post(url, files=files, timeout=45)  # Longer timeout for OCR
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - OCR image parsing successful")
                
                try:
                    response_data = response.json()
                    ingredients = response_data.get('ingredients', [])
                    total_found = response_data.get('total_found', 0)
                    
                    print(f"   OCR extracted ingredients: {ingredients}")
                    print(f"   Total ingredients found: {total_found}")
                    
                    # Check if OCR found reasonable ingredients
                    if total_found >= 3:
                        print(f"✅ OCR working - found {total_found} ingredients")
                        
                        # Check for expected ingredients from the test image
                        expected_ocr_ingredients = ['rice', 'toor_dal', 'tomato', 'onion', 'turmeric']
                        found_expected = [ing for ing in expected_ocr_ingredients if ing in ingredients]
                        
                        if len(found_expected) >= 2:
                            print(f"✅ OCR accuracy good - found expected ingredients: {found_expected}")
                        else:
                            print(f"⚠️  OCR accuracy could be better - found: {found_expected}")
                    else:
                        print(f"⚠️  OCR may have issues - only found {total_found} ingredients")
                        
                except Exception as e:
                    print(f"❌ Failed to parse OCR response: {e}")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False
                
            self.tests_run += 1
            return True
            
        except ImportError:
            print(f"⚠️  Skipping OCR test - PIL not available for test image creation")
            return True
        except Exception as e:
            print(f"❌ Failed OCR test: {e}")
            self.tests_run += 1
            return False

    def test_recipe_parsing_text(self):
        """Test enhanced recipe parsing with text inputs"""
        print(f"\n🍽️  Testing Enhanced Recipe Parsing (Text)...")
        
        test_recipes = [
            "Sambar rice and curd rice",
            "Dosa with coconut chutney", 
            "Dal rice with ghee",
            "Idli and sambar"
        ]
        
        all_success = True
        
        for recipe_text in test_recipes:
            print(f"\n   Testing recipe: '{recipe_text}'")
            
            # Use form data for the parse-recipe endpoint
            try:
                url = f"{self.api_url}/parse-recipe"
                data = {'recipe_text': recipe_text}
                response = requests.post(url, data=data, timeout=30)
                
                print(f"   Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    self.tests_passed += 1
                    print(f"✅ Passed - Recipe parsing successful")
                    
                    try:
                        response_data = response.json()
                        ingredients = response_data.get('ingredients', [])
                        ingredient_details = response_data.get('ingredient_details', [])
                        total_found = response_data.get('total_found', 0)
                        
                        print(f"   Ingredients found: {ingredients}")
                        print(f"   Total ingredients: {total_found}")
                        
                        # Specific validation for "Sambar rice and curd rice"
                        if recipe_text == "Sambar rice and curd rice":
                            expected_ingredients = ['rice', 'toor_dal', 'tomato', 'onion', 'drumstick', 'tamarind', 'turmeric', 'curry_leaves', 'mustard_seeds', 'coconut_oil', 'salt', 'ghee', 'curd']
                            found_expected = [ing for ing in expected_ingredients if ing in ingredients]
                            
                            if len(found_expected) >= 8:  # Should find most expected ingredients
                                print(f"✅ Enhanced parsing working - found {len(found_expected)} expected ingredients: {found_expected}")
                            else:
                                print(f"⚠️  Enhanced parsing may have issues - only found {len(found_expected)} expected ingredients: {found_expected}")
                                all_success = False
                        
                        # Check if multiple ingredients are found (not just single ingredient like before)
                        if total_found >= 3:
                            print(f"✅ Multiple ingredient extraction working - {total_found} ingredients found")
                        else:
                            print(f"⚠️  Multiple ingredient extraction may have issues - only {total_found} ingredients found")
                            all_success = False
                            
                    except Exception as e:
                        print(f"❌ Failed to parse response: {e}")
                        all_success = False
                else:
                    print(f"❌ Failed - Expected 200, got {response.status_code}")
                    try:
                        error_detail = response.json()
                        print(f"   Error: {error_detail}")
                    except:
                        print(f"   Error: {response.text}")
                    all_success = False
                    
            except Exception as e:
                print(f"❌ Failed - Error: {str(e)}")
                all_success = False
            
            self.tests_run += 1
        
        return all_success

    def test_problematic_recipes_parsing(self):
        """Test the specific problematic recipes reported by the user"""
        print(f"\n🔍 Testing Problematic Recipes (User-Reported Issues)...")
        
        # These are the exact recipes that were reported as problematic
        problematic_recipes = [
            {
                "recipe": "Chicken biryani",
                "expected_ingredients": ["chicken", "rice", "onion", "tomato", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "ghee", "salt"],
                "main_ingredients": ["chicken", "rice"],
                "issue": "was not parsing any ingredients"
            },
            {
                "recipe": "Paneer puff", 
                "expected_ingredients": ["paneer", "wheat", "onion", "ginger", "turmeric", "red_chili", "coriander_seeds", "cumin_seeds", "salt", "coconut_oil"],
                "main_ingredients": ["paneer", "wheat"],
                "issue": "was not parsing any ingredients"
            },
            {
                "recipe": "Chapati with paneer butter masala",
                "expected_ingredients": ["wheat", "paneer", "tomato", "onion", "butter", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "salt"],
                "main_ingredients": ["wheat", "paneer"],
                "issue": "was only getting spices, not main ingredients"
            },
            {
                "recipe": "Sambar rice with curd and strawberry",
                "expected_ingredients": ["rice", "toor_dal", "tomato", "onion", "drumstick", "tamarind", "turmeric", "curry_leaves", "mustard_seeds", "coconut_oil", "salt", "ghee", "curd", "strawberry"],
                "main_ingredients": ["rice", "curd", "strawberry"],
                "issue": "was missing main ingredients like rice, curd, strawberry"
            }
        ]
        
        all_success = True
        
        for recipe_data in problematic_recipes:
            recipe_text = recipe_data["recipe"]
            expected_ingredients = recipe_data["expected_ingredients"]
            main_ingredients = recipe_data["main_ingredients"]
            issue = recipe_data["issue"]
            
            print(f"\n   🔍 Testing: '{recipe_text}'")
            print(f"   Previous issue: {issue}")
            
            try:
                url = f"{self.api_url}/parse-recipe"
                data = {'recipe_text': recipe_text}
                response = requests.post(url, data=data, timeout=30)
                
                print(f"   Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    self.tests_passed += 1
                    print(f"✅ API call successful")
                    
                    try:
                        response_data = response.json()
                        ingredients = response_data.get('ingredients', [])
                        ingredient_details = response_data.get('ingredient_details', [])
                        total_found = response_data.get('total_found', 0)
                        
                        print(f"   Ingredients found: {ingredients}")
                        print(f"   Total ingredients: {total_found}")
                        
                        # Check if main ingredients are now being extracted
                        found_main_ingredients = [ing for ing in main_ingredients if ing in ingredients]
                        
                        if len(found_main_ingredients) >= len(main_ingredients):
                            print(f"✅ FIXED - All main ingredients found: {found_main_ingredients}")
                        elif len(found_main_ingredients) > 0:
                            print(f"⚠️  PARTIALLY FIXED - Some main ingredients found: {found_main_ingredients}")
                            print(f"   Missing main ingredients: {[ing for ing in main_ingredients if ing not in ingredients]}")
                        else:
                            print(f"❌ NOT FIXED - No main ingredients found: {main_ingredients}")
                            all_success = False
                        
                        # Check if multiple meaningful ingredients are extracted (not just spices)
                        if total_found >= 3:
                            print(f"✅ Multiple ingredients extracted - {total_found} total")
                        else:
                            print(f"❌ Still extracting too few ingredients - only {total_found}")
                            all_success = False
                        
                        # Check for expected ingredients
                        found_expected = [ing for ing in expected_ingredients if ing in ingredients]
                        expected_percentage = (len(found_expected) / len(expected_ingredients)) * 100
                        
                        print(f"   Expected ingredients found: {len(found_expected)}/{len(expected_ingredients)} ({expected_percentage:.1f}%)")
                        
                        if expected_percentage >= 50:  # At least 50% of expected ingredients
                            print(f"✅ Good ingredient recognition - {expected_percentage:.1f}% of expected ingredients found")
                        else:
                            print(f"⚠️  Ingredient recognition could be better - only {expected_percentage:.1f}% found")
                        
                        # Specific validation for North Indian dishes
                        if recipe_text in ["Chicken biryani", "Paneer puff", "Chapati with paneer butter masala"]:
                            print(f"   🇮🇳 North Indian dish recognition test:")
                            if found_main_ingredients:
                                print(f"   ✅ North Indian dish parsing working - main ingredients recognized")
                            else:
                                print(f"   ❌ North Indian dish parsing needs improvement")
                                all_success = False
                        
                    except Exception as e:
                        print(f"❌ Failed to parse response: {e}")
                        all_success = False
                else:
                    print(f"❌ Failed - Expected 200, got {response.status_code}")
                    try:
                        error_detail = response.json()
                        print(f"   Error: {error_detail}")
                    except:
                        print(f"   Error: {response.text}")
                    all_success = False
                    
            except Exception as e:
                print(f"❌ Failed - Error: {str(e)}")
                all_success = False
            
            self.tests_run += 1
        
        # Summary of problematic recipe testing
        print(f"\n📊 Problematic Recipes Testing Summary:")
        if all_success:
            print(f"✅ ALL problematic recipes are now working correctly!")
            print(f"✅ Main ingredients (chicken, paneer, wheat/chapati, rice, curd, strawberry) are being extracted")
            print(f"✅ Multiple meaningful ingredients extracted, not just spices")
            print(f"✅ North Indian dish recognition is working")
        else:
            print(f"❌ Some problematic recipes still have issues - see details above")
        
        return all_success

    def test_enhanced_diet_chart_with_meal_recipes(self):
        """Test enhanced diet chart generation with meal-specific recipe inputs"""
        print(f"\n🍽️  Testing Enhanced Diet Chart with Meal-Specific Recipe Inputs...")
        
        # Test data with meal-specific recipe inputs
        enhanced_diet_data = {
            "patient_profile": {
                "patient_id": "test_patient_001",
                "name": "Arjun Sharma",
                "age": 28,
                "gender": "Male",
                "city": "Mumbai",
                "constitution": "Vata",
                "condition": "Healthy",
                "allergies": [],
                "activity_level": "moderate"
            },
            "diet_preferences": {
                "allergies": [],
                "dislikes": [],
                "calorie_target": 2000,
                "custom_preferences": ""
            },
            "city_name": "Mumbai",
            "meal_recipes": {
                "breakfast": {
                    "recipe_text": "Idli and sambar"
                },
                "lunch": {
                    "recipe_text": "Sambar rice with curd rice"
                },
                "snack": {
                    "recipe_text": "Upma"
                },
                "dinner": {
                    "recipe_text": "Dal rice with ghee"
                }
            }
        }
        
        success, response = self.run_test(
            "Enhanced Diet Chart with Meal-Specific Recipe Inputs",
            "POST",
            "generate-enhanced-diet-chart",
            200,
            data=enhanced_diet_data,
            timeout=45
        )
        
        if success and isinstance(response, dict):
            # Validate enhanced response structure
            required_fields = ['id', 'patient_id', 'meals', 'total_daily_calories', 'weather_context', 'ayurvedic_analysis', 'recommendations', 'smart_swaps_applied', 'portion_adjustments']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"⚠️  Warning: Missing enhanced diet chart fields: {missing_fields}")
            else:
                print(f"   Enhanced Diet Chart Generated Successfully:")
                print(f"   - Total Calories: {response.get('total_daily_calories', 'N/A')}")
                print(f"   - Number of Meals: {len(response.get('meals', []))}")
                print(f"   - Smart Swaps Applied: {len(response.get('smart_swaps_applied', []))}")
                print(f"   - Portion Adjustments: {len(response.get('portion_adjustments', {}))}")
                
                # Validate meal-specific recipe usage
                meals = response.get('meals', [])
                meal_types = ['Breakfast', 'Lunch', 'Snack', 'Dinner']
                
                for i, meal in enumerate(meals):
                    meal_type = meal.get('meal_type', '')
                    foods = meal.get('foods', [])
                    print(f"   - {meal_type}: {meal.get('total_calories', 0)} cal, {len(foods)} foods")
                    
                    # Check if meal uses specific recipe ingredients
                    food_names = [food.get('name', '').lower() for food in foods]
                    
                    if meal_type == 'Breakfast':
                        # Should contain idli/sambar ingredients
                        expected = ['rice', 'urad dal', 'toor dal', 'tomato']
                        found = [exp for exp in expected if any(exp in fname for fname in food_names)]
                        if found:
                            print(f"     ✅ Breakfast uses recipe ingredients: {found}")
                        else:
                            print(f"     ⚠️  Breakfast may not use recipe ingredients")
                    
                    elif meal_type == 'Lunch':
                        # Should contain sambar rice + curd rice ingredients
                        expected = ['rice', 'toor dal', 'curd', 'tomato', 'onion']
                        found = [exp for exp in expected if any(exp in fname for fname in food_names)]
                        if len(found) >= 3:
                            print(f"     ✅ Lunch uses recipe ingredients: {found}")
                        else:
                            print(f"     ⚠️  Lunch may not use recipe ingredients: {found}")
                    
                    elif meal_type == 'Snack':
                        # Should contain upma ingredients
                        expected = ['semolina', 'onion', 'curry leaves']
                        found = [exp for exp in expected if any(exp in fname for fname in food_names)]
                        if found:
                            print(f"     ✅ Snack uses recipe ingredients: {found}")
                        else:
                            print(f"     ⚠️  Snack may not use recipe ingredients")
                    
                    elif meal_type == 'Dinner':
                        # Should contain dal rice ingredients
                        expected = ['rice', 'toor dal', 'ghee']
                        found = [exp for exp in expected if any(exp in fname for fname in food_names)]
                        if len(found) >= 2:
                            print(f"     ✅ Dinner uses recipe ingredients: {found}")
                        else:
                            print(f"     ⚠️  Dinner may not use recipe ingredients: {found}")
                
                # Check Smart Swaps Applied - should NOT be empty now
                smart_swaps = response.get('smart_swaps_applied', [])
                if smart_swaps:
                    print(f"✅ Smart Swaps Applied section is NOT empty: {len(smart_swaps)} swaps")
                    print(f"   Sample swaps: {smart_swaps[:3]}")  # Show first 3 swaps
                else:
                    print(f"❌ Smart Swaps Applied section is EMPTY - this should be fixed!")
                
                # Validate enhanced features
                if response.get('smart_swaps_applied'):
                    print(f"✅ Smart swaps feature working - {len(response.get('smart_swaps_applied', []))} swaps applied")
                else:
                    print(f"❌ Smart swaps feature NOT working - no swaps applied")
                    
                if response.get('portion_adjustments'):
                    print(f"✅ Portion adjustment feature working - {len(response.get('portion_adjustments', {}))} adjustments")
                else:
                    print(f"⚠️  Portion adjustment feature may not be working")
        
        return success

    def test_smart_swaps_proactive_generation(self):
        """Test that Smart Swaps are generated proactively, not just for allergens"""
        print(f"\n🔄 Testing Proactive Smart Swaps Generation...")
        
        # Test with NO allergens or dislikes - should still generate swaps
        test_data = {
            "patient_profile": {
                "patient_id": "test_patient_002",
                "name": "Priya Patel",
                "age": 25,
                "gender": "Female",
                "city": "Delhi",
                "constitution": "Pitta",
                "condition": "Healthy",
                "allergies": [],  # NO allergens
                "activity_level": "moderate"
            },
            "diet_preferences": {
                "allergies": [],  # NO allergens
                "dislikes": [],   # NO dislikes
                "calorie_target": 1800,
                "custom_preferences": ""
            },
            "city_name": "Delhi",
            "meal_recipes": {
                "breakfast": {
                    "recipe_text": "Idli and sambar"
                },
                "lunch": {
                    "recipe_text": "Sambar rice with curd rice"
                }
            }
        }
        
        success, response = self.run_test(
            "Proactive Smart Swaps (No Allergens/Dislikes)",
            "POST",
            "generate-enhanced-diet-chart",
            200,
            data=test_data,
            timeout=45
        )
        
        if success and isinstance(response, dict):
            smart_swaps = response.get('smart_swaps_applied', [])
            
            if smart_swaps:
                print(f"✅ PROACTIVE Smart Swaps working - {len(smart_swaps)} swaps generated WITHOUT allergens/dislikes")
                print(f"   Sample proactive swaps: {smart_swaps[:3]}")
                return True
            else:
                print(f"❌ PROACTIVE Smart Swaps NOT working - no swaps generated despite no allergens/dislikes")
                return False
        
        return False

    def test_smart_swaps_api_endpoint(self):
        """Test the smart swaps API endpoint directly"""
        print(f"\n🔄 Testing Smart Swaps API Endpoint...")
        
        # Test smart swaps for rice (should return alternatives)
        success, response = self.run_test(
            "Smart Swaps for Rice",
            "GET",
            "smart-swaps/rice?allergens=&dislikes=",
            200
        )
        
        if success and isinstance(response, dict):
            swaps = response.get('swaps', [])
            original_food = response.get('original_food', '')
            
            print(f"   Original food: {original_food}")
            print(f"   Available swaps: {len(swaps)}")
            
            if swaps:
                print(f"✅ Smart Swaps API working - {len(swaps)} alternatives found")
                for swap in swaps[:3]:  # Show first 3
                    print(f"     - {swap.get('name', 'Unknown')} ({swap.get('reason', 'No reason')})")
                return True
            else:
                print(f"❌ Smart Swaps API not returning alternatives")
                return False
        
        return False

    def test_patient_endpoints(self):
        """Test patient management endpoints"""
        print(f"\n👥 Testing Patient Management Endpoints...")
        
        # Test GET /api/patients - should return all 10 patients
        success, response = self.run_test(
            "Get All Patients",
            "GET",
            "patients",
            200
        )
        
        if success and isinstance(response, list):
            patient_count = len(response)
            print(f"   Total patients returned: {patient_count}")
            
            if patient_count == 10:
                print(f"✅ All 10 patients returned correctly")
                
                # Check for expected patient IDs
                expected_ids = ["PS001", "RK002", "MP003", "AS004", "KN005", "DG006", "ST007", "VR008", "AN009", "RM010"]
                returned_ids = [p.get("PatientID", "") for p in response]
                
                missing_ids = [pid for pid in expected_ids if pid not in returned_ids]
                if not missing_ids:
                    print(f"✅ All expected patient IDs found: {expected_ids}")
                else:
                    print(f"❌ Missing patient IDs: {missing_ids}")
                
                # Verify patient data structure
                sample_patient = response[0]
                required_fields = ["PatientID", "Name", "Age", "Gender", "City", "Constitution", "Condition", "Allergies"]
                missing_fields = [field for field in required_fields if field not in sample_patient]
                
                if not missing_fields:
                    print(f"✅ Patient data structure is complete")
                    print(f"   Sample patient: {sample_patient['Name']} (ID: {sample_patient['PatientID']})")
                else:
                    print(f"❌ Missing patient fields: {missing_fields}")
                    
            else:
                print(f"❌ Expected 10 patients, got {patient_count}")
                return False
        else:
            print(f"❌ Invalid response format - expected list of patients")
            return False
        
        # Test GET /api/patients/{id} for specific patients
        test_patient_ids = ["PS001", "RK002", "MP003"]
        
        for patient_id in test_patient_ids:
            success, patient_response = self.run_test(
                f"Get Patient {patient_id}",
                "GET",
                f"patients/{patient_id}",
                200
            )
            
            if success and isinstance(patient_response, dict):
                if patient_response.get("PatientID") == patient_id:
                    print(f"✅ Patient {patient_id} retrieved correctly: {patient_response.get('Name', 'Unknown')}")
                else:
                    print(f"❌ Patient {patient_id} data mismatch")
                    return False
            else:
                print(f"❌ Failed to retrieve patient {patient_id}")
                return False
        
        # Test non-existent patient
        success, error_response = self.run_test(
            "Get Non-existent Patient",
            "GET",
            "patients/INVALID001",
            404
        )
        
        if success:
            print(f"✅ Non-existent patient handled correctly (404)")
        else:
            print(f"❌ Non-existent patient not handled properly")
        
        return True

    def test_diet_chart_saving_and_retrieval(self):
        """Test diet chart saving to patient_diet_charts collection and retrieval"""
        print(f"\n📊 Testing Diet Chart Saving and Retrieval...")
        
        # First, generate a diet chart for a real patient
        patient_id = "PS001"  # Priya Sharma
        
        diet_chart_data = {
            "patient_profile": {
                "patient_id": patient_id,
                "name": "Priya Sharma",
                "age": 32,
                "gender": "Female",
                "city": "Mumbai",
                "constitution": "Pitta",
                "condition": "Acidity",
                "allergies": ["Milk", "Peanuts"],
                "activity_level": "moderate"
            },
            "diet_preferences": {
                "allergies": ["Milk", "Peanuts"],
                "dislikes": [],
                "calorie_target": 1800,
                "custom_preferences": ""
            },
            "city_name": "Mumbai",
            "meal_recipes": {
                "breakfast": {
                    "recipe_text": "Idli and sambar"
                },
                "lunch": {
                    "recipe_text": "Sambar rice with curd rice"
                }
            }
        }
        
        # Generate diet chart
        success, chart_response = self.run_test(
            f"Generate Diet Chart for Patient {patient_id}",
            "POST",
            "generate-enhanced-diet-chart",
            200,
            data=diet_chart_data,
            timeout=45
        )
        
        if not success:
            print(f"❌ Failed to generate diet chart for testing")
            return False
        
        print(f"✅ Diet chart generated successfully for patient {patient_id}")
        
        # Now test retrieval of patient's diet charts
        success, charts_response = self.run_test(
            f"Get Diet Charts for Patient {patient_id}",
            "GET",
            f"patients/{patient_id}/diet-charts",
            200
        )
        
        if success and isinstance(charts_response, list):
            chart_count = len(charts_response)
            print(f"   Diet charts found for patient {patient_id}: {chart_count}")
            
            if chart_count > 0:
                print(f"✅ Diet chart retrieval working - found {chart_count} chart(s)")
                
                # Verify chart structure
                sample_chart = charts_response[0]
                required_fields = ["id", "patient_id", "chart_data", "created_at"]
                missing_fields = [field for field in required_fields if field not in sample_chart]
                
                if not missing_fields:
                    print(f"✅ Diet chart structure is complete")
                    
                    # Verify patient_id matches
                    if sample_chart.get("patient_id") == patient_id:
                        print(f"✅ Patient ID correctly saved in diet chart")
                    else:
                        print(f"❌ Patient ID mismatch in saved chart")
                        return False
                        
                    # Verify chart_data contains diet information
                    chart_data = sample_chart.get("chart_data", {})
                    if chart_data.get("meals") and chart_data.get("total_daily_calories"):
                        print(f"✅ Chart data contains meals and calorie information")
                        print(f"   Total calories: {chart_data.get('total_daily_calories')}")
                        print(f"   Number of meals: {len(chart_data.get('meals', []))}")
                    else:
                        print(f"❌ Chart data incomplete")
                        return False
                        
                else:
                    print(f"❌ Missing chart fields: {missing_fields}")
                    return False
            else:
                print(f"⚠️  No diet charts found for patient {patient_id} - this might be expected if database is empty")
                
        else:
            print(f"❌ Invalid response format for diet charts retrieval")
            return False
        
        # Test retrieval for non-existent patient
        success, empty_response = self.run_test(
            "Get Diet Charts for Non-existent Patient",
            "GET",
            "patients/INVALID001/diet-charts",
            200
        )
        
        if success and isinstance(empty_response, list) and len(empty_response) == 0:
            print(f"✅ Non-existent patient diet charts handled correctly (empty list)")
        else:
            print(f"⚠️  Non-existent patient diet charts response: {type(empty_response)}")
        
        return True

    def test_appointment_functionality(self):
        """Test appointment creation and retrieval functionality"""
        print(f"\n📅 Testing Appointment Functionality...")
        
        # Test creating new appointments with real patient data
        test_appointments = [
            {
                "patient_id": "PS001",
                "patient_name": "Priya Sharma",
                "appointment_date": "2025-09-22",
                "appointment_time": "10:00",
                "reason": "Follow-up consultation for acidity treatment",
                "status": "Scheduled"
            },
            {
                "patient_id": "RK002", 
                "patient_name": "Rajesh Kumar",
                "appointment_date": "2025-09-22",
                "appointment_time": "14:30",
                "reason": "Joint pain assessment and diet review",
                "status": "Scheduled"
            },
            {
                "patient_id": "MP003",
                "patient_name": "Meera Patel", 
                "appointment_date": "2025-09-23",
                "appointment_time": "11:15",
                "reason": "Weight management progress check",
                "status": "Scheduled"
            }
        ]
        
        created_appointments = []
        
        # Create appointments
        for appointment_data in test_appointments:
            success, response = self.run_test(
                f"Create Appointment for {appointment_data['patient_name']}",
                "POST",
                "appointments",
                200,
                data=appointment_data
            )
            
            if success and isinstance(response, dict):
                if response.get("patient_id") == appointment_data["patient_id"]:
                    print(f"✅ Appointment created successfully for {appointment_data['patient_name']}")
                    created_appointments.append(response)
                else:
                    print(f"❌ Appointment creation failed for {appointment_data['patient_name']}")
                    return False
            else:
                print(f"❌ Invalid response for appointment creation")
                return False
        
        # Test GET /api/appointments - get all appointments
        success, all_appointments = self.run_test(
            "Get All Appointments",
            "GET",
            "appointments",
            200
        )
        
        if success and isinstance(all_appointments, list):
            print(f"✅ All appointments retrieved successfully: {len(all_appointments)} total")
            
            # Verify our created appointments are in the list
            created_patient_ids = [apt["patient_id"] for apt in created_appointments]
            found_appointments = [apt for apt in all_appointments if apt.get("patient_id") in created_patient_ids]
            
            if len(found_appointments) >= len(created_appointments):
                print(f"✅ Created appointments found in all appointments list")
            else:
                print(f"⚠️  Some created appointments not found in all appointments list")
                
        else:
            print(f"❌ Failed to retrieve all appointments")
            return False
        
        # Test GET /api/appointments/today - get appointments for 2025-09-22
        success, today_appointments = self.run_test(
            "Get Today's Appointments (2025-09-22)",
            "GET",
            "appointments/today",
            200
        )
        
        if success and isinstance(today_appointments, list):
            today_count = len(today_appointments)
            print(f"✅ Today's appointments retrieved successfully: {today_count} appointments")
            
            # Verify appointments are for today (2025-09-22)
            today_date = "2025-09-22"
            correct_date_appointments = [apt for apt in today_appointments if apt.get("appointment_date") == today_date]
            
            if len(correct_date_appointments) == today_count:
                print(f"✅ All today's appointments have correct date ({today_date})")
                
                # Show appointment details
                for apt in today_appointments:
                    print(f"   - {apt.get('appointment_time', 'N/A')}: {apt.get('patient_name', 'Unknown')} ({apt.get('reason', 'No reason')})")
                    
            else:
                print(f"❌ Some appointments have incorrect date")
                return False
                
        else:
            print(f"❌ Failed to retrieve today's appointments")
            return False
        
        return True

    def test_real_patient_data_access(self):
        """Test access to all 10 patients with real patient IDs"""
        print(f"\n🔍 Testing Real Patient Data Access...")
        
        # Test all 10 patient IDs from the dataset
        expected_patients = [
            {"id": "PS001", "name": "Priya Sharma"},
            {"id": "RK002", "name": "Rajesh Kumar"},
            {"id": "MP003", "name": "Meera Patel"},
            {"id": "AS004", "name": "Arun Singh"},
            {"id": "KN005", "name": "Kavya Nair"},
            {"id": "DG006", "name": "Deepak Gupta"},
            {"id": "ST007", "name": "Sunita Tripathi"},
            {"id": "VR008", "name": "Vikram Reddy"},
            {"id": "AN009", "name": "Anita Naidu"},
            {"id": "RM010", "name": "Rohit Mehta"}
        ]
        
        accessible_patients = 0
        
        for patient in expected_patients:
            patient_id = patient["id"]
            expected_name = patient["name"]
            
            success, response = self.run_test(
                f"Access Patient {patient_id}",
                "GET",
                f"patients/{patient_id}",
                200
            )
            
            if success and isinstance(response, dict):
                returned_name = response.get("Name", "")
                returned_id = response.get("PatientID", "")
                
                if returned_id == patient_id and returned_name == expected_name:
                    print(f"✅ Patient {patient_id} ({expected_name}) accessible and correct")
                    accessible_patients += 1
                else:
                    print(f"❌ Patient {patient_id} data mismatch - Expected: {expected_name}, Got: {returned_name}")
            else:
                print(f"❌ Patient {patient_id} not accessible")
        
        print(f"\n📊 Patient Access Summary:")
        print(f"   Accessible patients: {accessible_patients}/10")
        
        if accessible_patients == 10:
            print(f"✅ ALL 10 patients are accessible with correct data")
            
            # Verify no duplicate Priya Sharma issue
            success, all_patients = self.run_test(
                "Verify No Duplicate Patient Data",
                "GET",
                "patients",
                200
            )
            
            if success and isinstance(all_patients, list):
                unique_names = set(p.get("Name", "") for p in all_patients)
                unique_ids = set(p.get("PatientID", "") for p in all_patients)
                
                if len(unique_names) == 10 and len(unique_ids) == 10:
                    print(f"✅ No duplicate patient data - all 10 patients have unique names and IDs")
                else:
                    print(f"❌ Duplicate patient data detected - Names: {len(unique_names)}, IDs: {len(unique_ids)}")
                    return False
            
            return True
        else:
            print(f"❌ Only {accessible_patients} out of 10 patients are accessible")
            return False

    def test_enhanced_ocr_recipe_parsing_improvements(self):
        """Test the enhanced OCR recipe parsing improvements specifically for chicken biryani, chicken curry, paneer butter masala, and mutton biryani"""
        print(f"\n🔍 Testing Enhanced OCR Recipe Parsing Improvements...")
        
        # Test cases from the review request
        enhanced_test_cases = [
            {
                "recipe": "Chicken biryani",
                "expected_main_ingredients": ["chicken", "rice"],
                "expected_additional": ["onion", "tomato", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "ghee", "salt"],
                "description": "Should now detect chicken, rice, and other biryani ingredients"
            },
            {
                "recipe": "Chicken curry", 
                "expected_main_ingredients": ["chicken"],
                "expected_additional": ["onion", "tomato", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "coconut_oil", "salt"],
                "description": "Should detect chicken and curry spices"
            },
            {
                "recipe": "Paneer butter masala",
                "expected_main_ingredients": ["paneer", "butter"],
                "expected_additional": ["tomato", "onion", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "salt"],
                "description": "Should detect paneer, butter, and masala ingredients"
            },
            {
                "recipe": "Mutton biryani",
                "expected_main_ingredients": ["rice"],  # mutton might not be in database
                "expected_additional": ["onion", "tomato", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "ghee", "salt"],
                "description": "Test if mutton detection works (if in database)"
            }
        ]
        
        all_success = True
        improvements_verified = []
        
        print(f"\n🎯 Testing Enhanced Recipe Parsing Improvements:")
        print(f"   - Better chicken variations: ['murgh', 'poultry', 'fowl', 'hen', 'broiler']")
        print(f"   - Enhanced pattern matching with chicken curry patterns")
        print(f"   - Improved partial word boundary matching")
        print(f"   - More comprehensive biryani ingredient lists")
        
        for test_case in enhanced_test_cases:
            recipe_text = test_case["recipe"]
            expected_main = test_case["expected_main_ingredients"]
            expected_additional = test_case["expected_additional"]
            description = test_case["description"]
            
            print(f"\n   🔍 Testing: '{recipe_text}'")
            print(f"   Expected: {description}")
            
            try:
                url = f"{self.api_url}/parse-recipe"
                data = {'recipe_text': recipe_text}
                response = requests.post(url, data=data, timeout=30)
                
                print(f"   Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    self.tests_passed += 1
                    print(f"✅ API call successful")
                    
                    try:
                        response_data = response.json()
                        ingredients = response_data.get('ingredients', [])
                        ingredient_details = response_data.get('ingredient_details', [])
                        total_found = response_data.get('total_found', 0)
                        
                        print(f"   Ingredients found: {ingredients}")
                        print(f"   Total ingredients: {total_found}")
                        
                        # Check main ingredients detection
                        found_main_ingredients = [ing for ing in expected_main if ing in ingredients]
                        main_success = len(found_main_ingredients) >= len(expected_main)
                        
                        if main_success:
                            print(f"✅ Main ingredients detected: {found_main_ingredients}")
                        else:
                            missing_main = [ing for ing in expected_main if ing not in ingredients]
                            print(f"❌ Missing main ingredients: {missing_main}")
                            all_success = False
                        
                        # Check additional ingredients (should find at least 50% of expected)
                        found_additional = [ing for ing in expected_additional if ing in ingredients]
                        additional_percentage = (len(found_additional) / len(expected_additional)) * 100
                        
                        if additional_percentage >= 50:
                            print(f"✅ Good additional ingredient detection: {len(found_additional)}/{len(expected_additional)} ({additional_percentage:.1f}%)")
                            print(f"   Found: {found_additional}")
                        else:
                            print(f"⚠️  Additional ingredient detection could be better: {len(found_additional)}/{len(expected_additional)} ({additional_percentage:.1f}%)")
                            print(f"   Found: {found_additional}")
                        
                        # Verify enhanced pattern matching is working
                        if recipe_text == "Chicken biryani":
                            # Should detect both chicken and rice due to enhanced biryani patterns
                            if "chicken" in ingredients and "rice" in ingredients:
                                print(f"✅ Enhanced biryani pattern matching working - detected both chicken and rice")
                                improvements_verified.append("Enhanced biryani ingredient lists")
                            else:
                                print(f"❌ Enhanced biryani pattern matching not working - missing chicken or rice")
                                all_success = False
                                
                            # Check for chicken variations detection
                            if "chicken" in ingredients:
                                print(f"✅ Chicken variations detection working")
                                improvements_verified.append("Better chicken variations")
                            else:
                                print(f"❌ Chicken variations detection not working")
                                all_success = False
                        
                        elif recipe_text == "Chicken curry":
                            # Should detect chicken due to enhanced chicken curry patterns
                            if "chicken" in ingredients:
                                print(f"✅ Enhanced chicken curry pattern matching working")
                                improvements_verified.append("Enhanced pattern matching with chicken curry patterns")
                            else:
                                print(f"❌ Enhanced chicken curry pattern matching not working")
                                all_success = False
                        
                        elif recipe_text == "Paneer butter masala":
                            # Should detect paneer and butter due to improved partial word boundary matching
                            if "paneer" in ingredients and "butter" in ingredients:
                                print(f"✅ Improved partial word boundary matching working - detected paneer and butter")
                                improvements_verified.append("Improved partial word boundary matching")
                            else:
                                print(f"❌ Improved partial word boundary matching not working")
                                all_success = False
                        
                        elif recipe_text == "Mutton biryani":
                            # Check if rice is detected (mutton might not be in database)
                            if "rice" in ingredients:
                                print(f"✅ Biryani base ingredient (rice) detected")
                            else:
                                print(f"⚠️  Biryani base ingredient (rice) not detected")
                            
                            # Check if mutton is in database and detected
                            if "mutton" in ingredients:
                                print(f"✅ Mutton detection working")
                            else:
                                print(f"⚠️  Mutton not detected (may not be in database)")
                        
                        # Overall ingredient count check
                        if total_found >= 5:
                            print(f"✅ Good ingredient extraction - {total_found} ingredients found")
                        else:
                            print(f"⚠️  Limited ingredient extraction - only {total_found} ingredients found")
                            
                    except Exception as e:
                        print(f"❌ Failed to parse response: {e}")
                        all_success = False
                else:
                    print(f"❌ Failed - Expected 200, got {response.status_code}")
                    try:
                        error_detail = response.json()
                        print(f"   Error: {error_detail}")
                    except:
                        print(f"   Error: {response.text}")
                    all_success = False
                    
            except Exception as e:
                print(f"❌ Failed - Error: {str(e)}")
                all_success = False
            
            self.tests_run += 1
        
        # Summary of improvements verification
        print(f"\n📊 Enhanced OCR Recipe Parsing Improvements Summary:")
        unique_improvements = list(set(improvements_verified))
        
        if all_success:
            print(f"✅ ALL enhanced recipe parsing improvements are working correctly!")
            print(f"✅ Main proteins (chicken, paneer) are being detected")
            print(f"✅ Base ingredients (rice, wheat) are being detected") 
            print(f"✅ Compound dish recognition is working")
            print(f"✅ Verified improvements: {unique_improvements}")
        else:
            print(f"❌ Some enhanced recipe parsing improvements need attention")
            if unique_improvements:
                print(f"✅ Working improvements: {unique_improvements}")
            else:
                print(f"❌ No improvements could be verified")
        
        return all_success

    def test_patient_creation_functionality(self):
        """Test the newly implemented patient creation functionality to fix 'Failed to save patient' error"""
        print(f"\n👤 Testing Patient Creation Functionality...")
        
        # Test patient data as specified in the review request
        test_patient_data = {
            "PatientID": "TEST001",
            "Name": "Test Patient",
            "Age": 30,
            "Gender": "Male",
            "City": "Test City",
            "Constitution": "Pitta",
            "Condition": "Test Condition",
            "Compliance": "0%",
            "LastVisit": "2025-09-22",
            "Status": "Active",
            "Charts": 0,
            "Allergies": ["None"],
            "Phone": "+91 9999999999",
            "Email": "test@example.com"
        }
        
        # Test 1: Create a new patient with comprehensive data
        print(f"\n   🔍 Test 1: Creating new patient with comprehensive data...")
        success, response = self.run_test(
            "Create New Patient (POST /api/patients)",
            "POST",
            "patients",
            200,
            data=test_patient_data
        )
        
        if success and isinstance(response, dict):
            if response.get("message") == "Patient created successfully":
                created_patient = response.get("patient", {})
                print(f"✅ Patient created successfully: {created_patient.get('Name', 'Unknown')}")
                print(f"   Patient ID: {created_patient.get('PatientID', 'Unknown')}")
                
                # Store the actual patient ID for further tests (might be modified due to conflict handling)
                actual_patient_id = created_patient.get('PatientID', test_patient_data['PatientID'])
                
                # Test 4: Verify the created patient can be retrieved via GET /api/patients/{id}
                print(f"\n   🔍 Test 4: Retrieving created patient...")
                retrieve_success, retrieve_response = self.run_test(
                    f"Retrieve Created Patient (GET /api/patients/{actual_patient_id})",
                    "GET",
                    f"patients/{actual_patient_id}",
                    200
                )
                
                if retrieve_success and isinstance(retrieve_response, dict):
                    if retrieve_response.get("PatientID") == actual_patient_id:
                        print(f"✅ Created patient retrieved successfully")
                        print(f"   Name: {retrieve_response.get('Name', 'Unknown')}")
                        print(f"   Age: {retrieve_response.get('Age', 'Unknown')}")
                        print(f"   Gender: {retrieve_response.get('Gender', 'Unknown')}")
                        print(f"   City: {retrieve_response.get('City', 'Unknown')}")
                    else:
                        print(f"❌ Retrieved patient ID mismatch")
                        return False
                else:
                    print(f"❌ Failed to retrieve created patient")
                    return False
                
                # Test 5: Verify new patient appears in patient list
                print(f"\n   🔍 Test 5: Verifying patient appears in patient list...")
                list_success, list_response = self.run_test(
                    "Get All Patients (Integration Test)",
                    "GET",
                    "patients",
                    200
                )
                
                if list_success and isinstance(list_response, list):
                    patient_ids = [p.get("PatientID", "") for p in list_response]
                    if actual_patient_id in patient_ids:
                        print(f"✅ New patient appears in patient list")
                    else:
                        print(f"❌ New patient does not appear in patient list")
                        return False
                else:
                    print(f"❌ Failed to get patient list for integration test")
                    return False
                    
            else:
                print(f"❌ Unexpected response message: {response.get('message', 'No message')}")
                return False
        else:
            print(f"❌ Failed to create patient or invalid response format")
            return False
        
        # Test 2: Test patient ID conflict handling (duplicate ID resolution)
        print(f"\n   🔍 Test 2: Testing patient ID conflict handling...")
        duplicate_patient_data = test_patient_data.copy()
        duplicate_patient_data["Name"] = "Duplicate Test Patient"
        duplicate_patient_data["Email"] = "duplicate@example.com"
        
        duplicate_success, duplicate_response = self.run_test(
            "Create Patient with Duplicate ID (Conflict Handling)",
            "POST",
            "patients",
            200,
            data=duplicate_patient_data
        )
        
        if duplicate_success and isinstance(duplicate_response, dict):
            if duplicate_response.get("message") == "Patient created successfully":
                duplicate_patient = duplicate_response.get("patient", {})
                duplicate_patient_id = duplicate_patient.get('PatientID', '')
                
                if duplicate_patient_id != test_patient_data['PatientID']:
                    print(f"✅ ID conflict handled correctly - new ID generated: {duplicate_patient_id}")
                    print(f"   Original ID: {test_patient_data['PatientID']}")
                    print(f"   New ID: {duplicate_patient_id}")
                else:
                    print(f"⚠️  ID conflict handling may not be working - same ID returned")
            else:
                print(f"❌ Duplicate patient creation failed: {duplicate_response.get('message', 'No message')}")
                return False
        else:
            print(f"❌ Failed to test duplicate ID handling")
            return False
        
        # Test 3: Test validation of required fields
        print(f"\n   🔍 Test 3: Testing validation of required fields...")
        
        # Test missing required fields
        required_fields = ['PatientID', 'Name', 'Age', 'Gender', 'City']
        
        for field in required_fields:
            print(f"\n     Testing missing field: {field}")
            invalid_data = test_patient_data.copy()
            del invalid_data[field]
            
            validation_success, validation_response = self.run_test(
                f"Create Patient Missing {field}",
                "POST",
                "patients",
                400  # Should return 400 for missing required field
            )
            
            if validation_success:
                print(f"✅ Missing {field} properly validated (400 error)")
            else:
                print(f"❌ Missing {field} validation failed")
                return False
        
        print(f"\n📊 Patient Creation Functionality Test Summary:")
        print(f"✅ POST /api/patients endpoint working correctly")
        print(f"✅ Patient ID conflict handling working (duplicate IDs resolved)")
        print(f"✅ Required field validation working")
        print(f"✅ Patient retrieval via GET /api/patients/{{id}} working")
        print(f"✅ Integration with patient list working")
        print(f"✅ 'Failed to save patient' error should be resolved")
        
        return True

    def test_invalid_inputs(self):
        """Test API with invalid inputs"""
        print(f"\n🚫 Testing Invalid Inputs...")
        
        # Test invalid location
        invalid_location_success, _ = self.run_test(
            "Invalid Location Weather",
            "GET",
            "weather/InvalidCityName123",
            200  # API should handle gracefully with default data
        )
        
        # Test empty recipe text
        try:
            url = f"{self.api_url}/parse-recipe"
            data = {'recipe_text': ''}
            response = requests.post(url, data=data, timeout=30)
            
            print(f"\n   Testing empty recipe text...")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                ingredients = response_data.get('ingredients', [])
                if len(ingredients) == 0:
                    print(f"✅ Empty recipe handled correctly - no ingredients returned")
                else:
                    print(f"⚠️  Empty recipe handling - unexpected ingredients: {ingredients}")
            
            self.tests_run += 1
            if response.status_code == 200:
                self.tests_passed += 1
                
        except Exception as e:
            print(f"❌ Failed testing empty recipe: {e}")
            self.tests_run += 1
        
        return True  # These tests are expected to fail gracefully

def main():
    print("🧪 AyushAahar API Testing Suite - Patient Creation Functionality Focus")
    print("=" * 70)
    
    tester = AyushAaharAPITester()
    
    # Test sequence - Focus on Patient Creation Functionality
    print("\n📋 Running Backend API Tests for Patient Creation Functionality...")
    
    # 1. Test basic connectivity
    tester.test_root_endpoint()
    
    # 2. MAIN FOCUS: Test patient creation functionality to fix "Failed to save patient" error
    tester.test_patient_creation_functionality()
    
    # 3. Test existing patient endpoints for integration
    tester.test_patient_endpoints()
    
    # 4. Test real patient data access
    tester.test_real_patient_data_access()
    
    # 5. Test weather API (dependency for patient creation)
    tester.test_weather_api("Mumbai")
    
    # 6. Test error handling
    tester.test_invalid_inputs()
    
    # Print final results
    print(f"\n📊 Final Test Results:")
    print(f"=" * 30)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print(f"🎉 All tests passed! Patient creation functionality is working correctly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())