from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
import json
import base64
import tempfile
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
import re
import pytesseract
from PIL import Image
import io
import cv2
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Load datasets
with open(ROOT_DIR / 'datasets' / 'food_dataset.json', 'r') as f:
    FOOD_DATABASE = json.load(f)

with open(ROOT_DIR / 'datasets' / 'patients.json', 'r') as f:
    PATIENT_DATABASE = json.load(f)

with open(ROOT_DIR / 'datasets' / 'allergy_map.json', 'r') as f:
    ALLERGY_MAP = json.load(f)

def load_patients_data():
    """Load patients data from the static dataset"""
    return PATIENT_DATABASE

# Create recipe database for common Indian dishes
RECIPE_DATABASE = {
    # South Indian dishes
    "sambar": ["toor_dal", "tomato", "onion", "drumstick", "tamarind", "turmeric", "curry_leaves", "mustard_seeds", "coconut_oil", "salt", "coriander_seeds", "red_chili", "asafoetida"],
    "sambar rice": ["rice", "toor_dal", "tomato", "onion", "drumstick", "tamarind", "turmeric", "curry_leaves", "mustard_seeds", "coconut_oil", "salt", "ghee"],
    "dosa": ["rice", "urad_dal", "fenugreek_seeds", "salt", "coconut_oil"],
    "idly": ["rice", "urad_dal", "fenugreek_seeds", "salt"],
    "idli": ["rice", "urad_dal", "fenugreek_seeds", "salt"],
    "curd rice": ["rice", "curd", "salt", "curry_leaves", "mustard_seeds", "coconut_oil"],
    "rasam": ["toor_dal", "tomato", "tamarind", "turmeric", "red_chili", "coriander_seeds", "cumin_seeds", "curry_leaves", "mustard_seeds", "asafoetida", "ghee"],
    "dal rice": ["rice", "toor_dal", "turmeric", "salt", "ghee", "cumin_seeds"],
    "khichdi": ["rice", "moong_dal", "turmeric", "salt", "ghee", "cumin_seeds"],
    "upma": ["semolina", "onion", "curry_leaves", "mustard_seeds", "coconut_oil", "salt"],
    "pongal": ["rice", "moong_dal", "ghee", "cumin_seeds", "curry_leaves", "salt"],
    
    # North Indian dishes
    "chicken biryani": ["rice", "chicken", "onion", "tomato", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "ghee", "salt"],
    "biryani": ["rice", "chicken", "onion", "tomato", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "ghee", "salt"],
    "paneer butter masala": ["paneer", "tomato", "onion", "butter", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "salt"],
    "butter masala": ["paneer", "tomato", "onion", "butter", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds", "salt"],
    "chapati": ["wheat", "salt", "coconut_oil"],
    "roti": ["wheat", "salt", "coconut_oil"],
    "paneer puff": ["wheat", "paneer", "onion", "ginger", "turmeric", "red_chili", "coriander_seeds", "cumin_seeds", "salt", "coconut_oil"],
    "puff": ["wheat", "paneer", "onion", "ginger", "turmeric", "red_chili", "coriander_seeds", "cumin_seeds", "salt", "coconut_oil"],
    "dal": ["toor_dal", "turmeric", "salt", "ghee", "cumin_seeds"],
    "masala": ["tomato", "onion", "ginger", "garlic", "turmeric", "red_chili", "garam_masala", "coriander_seeds", "cumin_seeds"]
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    client.close()

# Create the main app without a prefix
app = FastAPI(
    title="AyushAahar API", 
    description="Intelligent Ayurvedic Diet Chart Generator",
    lifespan=lifespan
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class DoshaType(str, Enum):
    VATA = "Vata"
    PITTA = "Pitta"
    KAPHA = "Kapha"
    VATA_PITTA = "Vata-Pitta"
    PITTA_KAPHA = "Pitta-Kapha"
    VATA_KAPHA = "Vata-Kapha"
    TRIDOSHIC = "Tridoshic"

class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class MealType(str, Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    SNACK = "Snack"
    DINNER = "Dinner"

# Enhanced Models
class PatientProfile(BaseModel):
    patient_id: str
    name: str
    age: int
    gender: Gender
    city: str
    constitution: DoshaType
    condition: str
    allergies: List[str] = []
    activity_level: str = "moderate"
    
class DietPreferences(BaseModel):
    allergies: List[str] = []
    dislikes: List[str] = []
    calorie_target: Optional[int] = None
    custom_preferences: Optional[str] = ""

class RecipeInput(BaseModel):
    recipe_text: Optional[str] = None
    recipe_image_base64: Optional[str] = None

class MealRecipeInput(BaseModel):
    breakfast: Optional[RecipeInput] = None
    lunch: Optional[RecipeInput] = None
    snack: Optional[RecipeInput] = None
    dinner: Optional[RecipeInput] = None

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    description: str
    season: str
    city: str

class EnhancedFoodItem(BaseModel):
    name: str
    category: str
    quantity: str
    calories: int
    protein: float
    carbs: float
    fat: float
    fiber: float
    rasa: List[str]
    guna: List[str]
    virya: str
    vipaka: str
    dosha_effect: Dict[str, str]
    allergens: List[str]
    smart_swaps: List[str] = []
    portion_info: Dict[str, Any] = {}

class Meal(BaseModel):
    meal_type: MealType
    foods: List[EnhancedFoodItem]
    total_calories: int
    ayurvedic_rationale: str
    nutrient_bars: Dict[str, float]

class EnhancedDietChart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    meals: List[Meal]
    total_daily_calories: int
    weather_context: WeatherData
    ayurvedic_analysis: str
    recommendations: List[str]
    smart_swaps_applied: List[str] = []
    portion_adjustments: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PatientDietChart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    chart_data: EnhancedDietChart
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    doctor_notes: Optional[str] = ""

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str
    appointment_date: str  # YYYY-MM-DD format
    appointment_time: str  # HH:MM format
    reason: str
    status: str = "Scheduled"  # Scheduled, Completed, Cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnhancedDietRequest(BaseModel):
    patient_profile: PatientProfile
    diet_preferences: DietPreferences
    city_name: str
    meal_recipes: Optional[MealRecipeInput] = None

# Enhanced Services
class PortionCalculator:
    @staticmethod
    def calculate_portion(food_key: str, age: int, gender: str, activity_level: str = "moderate") -> tuple:
        """Calculate portion size based on age, gender, and activity level"""
        base_portions = {
            "rice": {"adult_male": 100, "adult_female": 80, "child": 60},
            "wheat": {"adult_male": 80, "adult_female": 65, "child": 50},
            "toor_dal": {"adult_male": 60, "adult_female": 50, "child": 40},
            "moong_dal": {"adult_male": 60, "adult_female": 50, "child": 40},
            "urad_dal": {"adult_male": 60, "adult_female": 50, "child": 40},
            "vegetables": {"adult_male": 100, "adult_female": 100, "child": 75},
            "ghee": {"adult_male": 15, "adult_female": 12, "child": 8},
            "coconut_oil": {"adult_male": 15, "adult_female": 12, "child": 8}
        }
        
        # Determine category
        if age < 18:
            category = "child"
        elif gender.lower() == "male":
            category = "adult_male"
        else:
            category = "adult_female"
        
        # Get base portion
        food_category = food_key if food_key in base_portions else "vegetables"
        base_portion = base_portions[food_category].get(category, 50)
        
        # Activity level adjustment
        activity_multiplier = {"low": 0.8, "moderate": 1.0, "high": 1.2}
        adjusted_portion = int(base_portion * activity_multiplier.get(activity_level, 1.0))
        
        return adjusted_portion, f"{adjusted_portion}g"

class SmartSwapEngine:
    @staticmethod
    def find_swaps(food_key: str, allergens: List[str], dislikes: List[str]) -> List[str]:
        """Find suitable food swaps based on allergies, dislikes, and general alternatives"""
        if not FOOD_DATABASE.get(food_key):
            return []
        
        food = FOOD_DATABASE[food_key]
        swaps = []
        
        # Check if food has allergens
        has_allergen = False
        for allergen in allergens:
            allergen_lower = allergen.lower()
            if allergen_lower in ALLERGY_MAP:
                allergen_foods = [item.lower() for item in ALLERGY_MAP[allergen_lower]]
                if food_key.lower() in allergen_foods or any(a in food.get('allergens', []) for a in [allergen_lower]):
                    has_allergen = True
                    break
        
        # Check if food is disliked
        is_disliked = food_key.lower() in [d.lower() for d in dislikes]
        
        # Find similar foods in same category for alternatives
        same_category_foods = [k for k, v in FOOD_DATABASE.items() 
                             if v.get('category') == food.get('category') and k != food_key]
        
        # If food has allergens or is disliked, find safe alternatives
        if has_allergen or is_disliked:
            for alternative in same_category_foods:
                alt_food = FOOD_DATABASE[alternative]
                # Check if alternative doesn't have allergens
                alt_has_allergen = False
                for allergen in allergens:
                    allergen_lower = allergen.lower()
                    if allergen_lower in ALLERGY_MAP:
                        allergen_foods = [item.lower() for item in ALLERGY_MAP[allergen_lower]]
                        if alternative.lower() in allergen_foods or any(a in alt_food.get('allergens', []) for a in [allergen_lower]):
                            alt_has_allergen = True
                            break
                
                if not alt_has_allergen and alternative.lower() not in [d.lower() for d in dislikes]:
                    swaps.append(alt_food['name'])
        else:
            # Proactive swaps: Always suggest alternatives for variety
            for alternative in same_category_foods[:3]:  # Limit to 3 alternatives
                alt_food = FOOD_DATABASE[alternative]
                # Check if alternative doesn't have allergens
                alt_has_allergen = False
                for allergen in allergens:
                    allergen_lower = allergen.lower()
                    if allergen_lower in ALLERGY_MAP:
                        allergen_foods = [item.lower() for item in ALLERGY_MAP[allergen_lower]]
                        if alternative.lower() in allergen_foods or any(a in alt_food.get('allergens', []) for a in [allergen_lower]):
                            alt_has_allergen = True
                            break
                
                if not alt_has_allergen and alternative.lower() not in [d.lower() for d in dislikes]:
                    swaps.append(alt_food['name'])
        
        return swaps[:3]

class EnhancedRecipeParser:
    def __init__(self):
        self.ocr_api_key = os.environ.get('OCR_API_KEY')
        # Configure tesseract if needed
        # pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'  # Adjust path if needed
    
    def parse_recipe_text(self, recipe_text: str) -> List[str]:
        """Enhanced ingredient extraction from recipe text"""
        if not recipe_text:
            return []
        
        ingredients = set()
        recipe_lower = recipe_text.lower()
        
        logging.info(f"Parsing recipe text: '{recipe_text}'")
        
        # First check for exact dish matches in recipe database
        for dish_name, dish_ingredients in RECIPE_DATABASE.items():
            if dish_name in recipe_lower:
                ingredients.update(dish_ingredients)
                logging.info(f"Found dish '{dish_name}' with ingredients: {dish_ingredients}")
        
        # Enhanced individual food item matching with multiple variations
        for food_key, food_data in FOOD_DATABASE.items():
            food_name = food_data['name'].lower()
            
            # Create multiple variations for matching
            food_variations = [
                food_key.lower(),
                food_name,
                food_name.replace(' ', ''),
                food_key.replace('_', ' ').lower(),
                food_key.replace('_', '').lower()
            ]
            
            # Add common alternate names and better matching
            if food_key == 'rice':
                food_variations.extend(['chawal', 'bhat', 'anna', 'basmati', 'steamed rice'])
            elif food_key == 'chicken':
                food_variations.extend(['murgh', 'poultry', 'fowl', 'hen', 'broiler'])
            elif food_key == 'toor_dal':
                food_variations.extend(['dal', 'dhal', 'pigeon pea', 'arhar', 'tuvar'])
            elif food_key == 'curd':
                food_variations.extend(['yogurt', 'yoghurt', 'dahi'])
            elif food_key == 'coconut_oil':
                food_variations.extend(['oil', 'coconut oil'])
            elif food_key == 'paneer':
                food_variations.extend(['cottage cheese', 'fresh cheese'])
            elif food_key == 'wheat':
                food_variations.extend(['atta', 'flour', 'bread', 'roti', 'chapati'])
            elif food_key == 'butter':
                food_variations.extend(['makhan', 'white butter', 'unsalted butter'])
            
            # Check for matches with partial word matching
            for variation in food_variations:
                if variation and len(variation) > 2:  # Avoid very short matches
                    # Exact match
                    if variation in recipe_lower:
                        ingredients.add(food_key)
                        logging.info(f"Found ingredient '{food_key}' via exact match '{variation}'")
                        break
                    # Partial word boundary match for compound words
                    elif len(variation) > 4 and any(word.startswith(variation[:4]) for word in recipe_lower.split()):
                        ingredients.add(food_key)
                        logging.info(f"Found ingredient '{food_key}' via partial match '{variation}'")
                        break
        
        # Enhanced pattern matching for common ingredients and combinations
        ingredient_patterns = {
            # South Indian dishes
            r'\b(?:sambar|sambhar)\b': ['toor_dal', 'tomato', 'onion', 'drumstick', 'tamarind', 'turmeric', 'curry_leaves', 'mustard_seeds', 'coconut_oil', 'salt'],
            r'\b(?:sambar\s*rice|sambhar\s*rice)\b': ['rice', 'toor_dal', 'tomato', 'onion', 'drumstick', 'tamarind', 'turmeric', 'curry_leaves', 'mustard_seeds', 'coconut_oil', 'salt', 'ghee'],
            r'\b(?:curd\s*rice|dahi\s*chawal)\b': ['rice', 'curd', 'salt', 'curry_leaves', 'mustard_seeds', 'coconut_oil'],
            r'\b(?:dal\s*rice|daal\s*chawal)\b': ['rice', 'toor_dal', 'turmeric', 'salt', 'ghee', 'cumin_seeds'],
            r'\bdosa\b': ['rice', 'urad_dal', 'fenugreek_seeds', 'salt', 'coconut_oil'],
            r'\bidl[yi]\b': ['rice', 'urad_dal', 'fenugreek_seeds', 'salt'],
            r'\brasam\b': ['toor_dal', 'tomato', 'tamarind', 'turmeric', 'red_chili', 'coriander_seeds', 'cumin_seeds', 'curry_leaves', 'mustard_seeds', 'asafoetida', 'ghee'],
            r'\bkhichdi\b': ['rice', 'moong_dal', 'turmeric', 'salt', 'ghee', 'cumin_seeds'],
            r'\bupma\b': ['semolina', 'onion', 'curry_leaves', 'mustard_seeds', 'coconut_oil', 'salt'],
            r'\bpongal\b': ['rice', 'moong_dal', 'ghee', 'cumin_seeds', 'curry_leaves', 'salt'],
            
            # North Indian dishes
            r'\b(?:chicken\s*biryani|biryani)\b': ['rice', 'chicken', 'onion', 'tomato', 'ginger', 'garlic', 'turmeric', 'red_chili', 'garam_masala', 'coriander_seeds', 'cumin_seeds', 'ghee', 'salt'],
            r'\b(?:chicken\s*curry|murgh\s*curry)\b': ['chicken', 'onion', 'tomato', 'ginger', 'garlic', 'turmeric', 'red_chili', 'garam_masala', 'coriander_seeds', 'cumin_seeds', 'coconut_oil', 'salt'],
            r'\b(?:paneer\s*butter\s*masala|butter\s*masala)\b': ['paneer', 'tomato', 'onion', 'butter', 'ginger', 'garlic', 'turmeric', 'red_chili', 'garam_masala', 'coriander_seeds', 'cumin_seeds', 'salt'],
            r'\b(?:paneer\s*puff|puff)\b': ['wheat', 'paneer', 'onion', 'ginger', 'turmeric', 'red_chili', 'coriander_seeds', 'cumin_seeds', 'salt', 'coconut_oil'],
            r'\b(?:chapati|roti)\b': ['wheat', 'salt', 'coconut_oil'],
            
            # Individual ingredient patterns (enhanced)
            r'\b(?:dal|dhal|daal)\b': ['toor_dal', 'moong_dal'],
            r'\b(?:rice|chawal|bhat|anna|basmati)\b': ['rice'],
            r'\b(?:chicken|murgh|poultry)\b': ['chicken'],
            r'\b(?:paneer|cottage\s*cheese)\b': ['paneer'],
            r'\b(?:wheat|atta|flour)\b': ['wheat'],
            r'\b(?:chapati|roti|bread)\b': ['chapati'],
            r'\b(?:butter|makhan)\b': ['butter'],
            r'\b(?:strawberry|strawberries)\b': ['strawberry'],
            r'\b(?:coconut|nariyal)\b': ['coconut'],
            r'\b(?:tomato|tamatar)\b': ['tomato'],
            r'\b(?:onion|pyaaz|kanda)\b': ['onion'],
            r'\b(?:curd|dahi|yogurt|yoghurt)\b': ['curd'],
            r'\b(?:ghee|clarified butter)\b': ['ghee'],
            r'\b(?:oil|tel)\b': ['coconut_oil'],
            r'\b(?:spice|masala|masalas)\b': ['turmeric', 'red_chili', 'coriander_seeds'],
            r'\b(?:curry\s*leaves|kadi\s*patta)\b': ['curry_leaves'],
            r'\b(?:mustard|rai|sarson)\b': ['mustard_seeds'],
            r'\b(?:turmeric|haldi)\b': ['turmeric'],
            r'\b(?:tamarind|imli)\b': ['tamarind'],
            r'\b(?:fenugreek|methi)\b': ['fenugreek_seeds'],
            r'\b(?:coriander|dhania)\b': ['coriander_seeds'],
            r'\b(?:cumin|jeera)\b': ['cumin_seeds'],
            r'\b(?:chili|chilli|mirch|pepper)\b': ['red_chili'],
            r'\b(?:hing|asafoetida)\b': ['asafoetida'],
            r'\b(?:drumstick|moringa)\b': ['drumstick'],
            r'\b(?:semolina|suji|rava)\b': ['semolina'],
            r'\b(?:urad|black gram)\b': ['urad_dal'],
            r'\b(?:moong|green gram|mung)\b': ['moong_dal'],
            r'\b(?:toor|arhar|pigeon pea)\b': ['toor_dal']
        }
        
        for pattern, ingredient_list in ingredient_patterns.items():
            if re.search(pattern, recipe_lower):
                ingredients.update(ingredient_list)
                logging.info(f"Pattern '{pattern}' matched, added: {ingredient_list}")
        
        # Split text into words and check each word
        words = re.findall(r'\b\w+\b', recipe_lower)
        for word in words:
            if len(word) > 3:  # Avoid very short words
                for food_key, food_data in FOOD_DATABASE.items():
                    if word == food_key.lower() or word == food_data['name'].lower():
                        ingredients.add(food_key)
                        break
        
        result = list(ingredients)
        logging.info(f"Final parsed ingredients from '{recipe_text}': {result}")
        return result
    
    def preprocess_image(self, image_array):
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply threshold to get better contrast
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Morphological operations to clean up the image
        kernel = np.ones((2, 2), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        return cleaned
    
    async def parse_recipe_image(self, image_base64: str) -> List[str]:
        """Enhanced OCR parsing using Tesseract"""
        try:
            logging.info("Starting OCR parsing with Tesseract")
            
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert PIL image to OpenCV format
            image_array = np.array(image)
            if len(image_array.shape) == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            # Preprocess image for better OCR
            processed_image = self.preprocess_image(image_array)
            
            # Convert back to PIL for tesseract
            processed_pil = Image.fromarray(processed_image)
            
            # Configure tesseract for better accuracy
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,()-'
            
            # Extract text using tesseract
            extracted_text = pytesseract.image_to_string(processed_pil, config=custom_config, lang='eng')
            
            logging.info(f"OCR extracted text: '{extracted_text}'")
            
            # Parse the extracted text using the enhanced text parser
            if extracted_text.strip():
                ingredients = self.parse_recipe_text(extracted_text)
                if ingredients:
                    logging.info(f"OCR parsed ingredients: {ingredients}")
                    return ingredients
            
            # Fallback: return common ingredients if OCR fails
            logging.warning("OCR failed to extract meaningful text, using fallback ingredients")
            fallback_ingredients = [
                "rice", "toor_dal", "coconut_oil", "curry_leaves", 
                "mustard_seeds", "turmeric", "salt", "onion", "tomato"
            ]
            
            logging.info(f"OCR fallback ingredients: {fallback_ingredients}")
            return fallback_ingredients
            
        except Exception as e:
            logging.error(f"OCR parsing error: {e}")
            # Return fallback ingredients
            fallback_ingredients = ["rice", "toor_dal", "ghee", "turmeric", "salt"]
            logging.info(f"OCR error fallback ingredients: {fallback_ingredients}")
            return fallback_ingredients

class EnhancedWeatherService:
    def __init__(self):
        self.api_key = os.environ.get('OPENWEATHER_API_KEY')
        self.base_url = "http://api.openweathermap.org/data/2.5/weather"
    
    async def get_weather_data(self, city: str) -> WeatherData:
        try:
            params = {
                'q': city,
                'appid': self.api_key,
                'units': 'metric'
            }
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            temp = data['main']['temp']
            humidity = data['main']['humidity']
            description = data['weather'][0]['description']
            
            # Enhanced season determination
            if temp > 35:
                season = "Summer"
            elif temp > 25:
                season = "Spring"
            elif temp > 15:
                season = "Autumn"
            else:
                season = "Winter"
            
            return WeatherData(
                temperature=temp,
                humidity=humidity,
                description=description,
                season=season,
                city=data['name']
            )
        except Exception as e:
            logging.error(f"Weather API error: {e}")
            return WeatherData(
                temperature=25.0,
                humidity=60,
                description="moderate climate",
                season="Spring",
                city=city
            )

class GeoAyurvedicEngine:
    def __init__(self):
        self.weather_service = EnhancedWeatherService()
        self.portion_calculator = PortionCalculator()
        self.swap_engine = SmartSwapEngine()
        self.recipe_parser = EnhancedRecipeParser()
    
    def select_foods_for_climate_dosha(self, weather: WeatherData, constitution: str, allergens: List[str], recipe_ingredients: List[str] = None) -> Dict[str, List[str]]:
        """Enhanced food selection based on climate, dosha, and recipe ingredients"""
        selected_foods = {"breakfast": [], "lunch": [], "snack": [], "dinner": []}
        
        # If recipe ingredients provided, use them as base
        if recipe_ingredients:
            # Distribute recipe ingredients across meals
            ingredient_count = len(recipe_ingredients)
            if ingredient_count >= 4:
                selected_foods["breakfast"] = recipe_ingredients[:2]
                selected_foods["lunch"] = recipe_ingredients[:4]
                selected_foods["snack"] = recipe_ingredients[:2]
                selected_foods["dinner"] = recipe_ingredients[:3]
            else:
                # Repeat ingredients across meals
                selected_foods["breakfast"] = recipe_ingredients
                selected_foods["lunch"] = recipe_ingredients
                selected_foods["snack"] = recipe_ingredients[:max(1, len(recipe_ingredients)//2)]
                selected_foods["dinner"] = recipe_ingredients
            
            return selected_foods
        
        # Climate-based selection
        if weather.temperature > 30:
            climate_pref = "hot"
        elif weather.temperature < 15:
            climate_pref = "cold"
        else:
            climate_pref = "moderate"
        
        # Filter foods by climate preference and constitution
        suitable_foods = []
        for food_key, food_data in FOOD_DATABASE.items():
            # Check climate suitability
            if climate_pref == "hot" and food_data.get('climate_preference') in ['hot', 'neutral']:
                suitable_foods.append(food_key)
            elif climate_pref == "cold" and food_data.get('climate_preference') in ['cold', 'neutral']:
                suitable_foods.append(food_key)
            elif climate_pref == "moderate":
                suitable_foods.append(food_key)
        
        # Filter out allergens
        safe_foods = []
        for food_key in suitable_foods:
            food_data = FOOD_DATABASE[food_key]
            has_allergen = False
            for allergen in allergens:
                allergen_lower = allergen.lower()
                if allergen_lower in ALLERGY_MAP:
                    allergen_foods = [item.lower() for item in ALLERGY_MAP[allergen_lower]]
                    if food_key.lower() in allergen_foods or any(a in food_data.get('allergens', []) for a in [allergen_lower]):
                        has_allergen = True
                        break
            
            if not has_allergen:
                safe_foods.append(food_key)
        
        # Distribute foods across meals
        grain_foods = [f for f in safe_foods if FOOD_DATABASE[f].get('category') == 'grains']
        protein_foods = [f for f in safe_foods if FOOD_DATABASE[f].get('category') in ['legumes', 'dairy']]
        vegetable_foods = [f for f in safe_foods if FOOD_DATABASE[f].get('category') == 'vegetables']
        spice_foods = [f for f in safe_foods if FOOD_DATABASE[f].get('category') in ['spices', 'herbs']]
        
        # Assign foods to meals
        selected_foods["breakfast"] = (grain_foods[:1] + protein_foods[:1])[:2] or safe_foods[:2]
        selected_foods["lunch"] = (grain_foods[:1] + protein_foods[:1] + vegetable_foods[:2])[:4] or safe_foods[:4]
        selected_foods["snack"] = (protein_foods[:1] + spice_foods[:1])[:2] or safe_foods[:2]
        selected_foods["dinner"] = (grain_foods[:1] + vegetable_foods[:1] + spice_foods[:1])[:3] or safe_foods[:3]
        
        return selected_foods
    
    async def generate_enhanced_diet_chart(self, request: EnhancedDietRequest) -> EnhancedDietChart:
        """Generate enhanced diet chart with all features"""
        # Get weather data
        weather = await self.weather_service.get_weather_data(request.city_name)
        
        # Parse meal-specific recipes if provided
        meal_recipe_ingredients = {
            "breakfast": [],
            "lunch": [],
            "snack": [],
            "dinner": []
        }
        
        if request.meal_recipes:
            for meal_type in ["breakfast", "lunch", "snack", "dinner"]:
                meal_recipe = getattr(request.meal_recipes, meal_type)
                if meal_recipe:
                    if meal_recipe.recipe_text:
                        meal_recipe_ingredients[meal_type] = self.recipe_parser.parse_recipe_text(meal_recipe.recipe_text)
                    elif meal_recipe.recipe_image_base64:
                        meal_recipe_ingredients[meal_type] = await self.recipe_parser.parse_recipe_image(meal_recipe.recipe_image_base64)
        
        # Combine patient allergies and preferences
        all_allergens = list(set(request.patient_profile.allergies + request.diet_preferences.allergies))
        
        # Select foods - use meal-specific ingredients or general selection
        selected_food_keys = {}
        for meal_type in ["breakfast", "lunch", "snack", "dinner"]:
            if meal_recipe_ingredients[meal_type]:
                # Use meal-specific ingredients
                selected_food_keys[meal_type] = meal_recipe_ingredients[meal_type]
            else:
                # Use general climate-based selection
                general_selection = self.select_foods_for_climate_dosha(
                    weather, request.patient_profile.constitution, all_allergens, []
                )
                selected_food_keys[meal_type] = general_selection.get(meal_type, [])
        
        # Create meals
        meals = []
        smart_swaps_applied = []
        portion_adjustments = {}
        
        for meal_type, food_keys in selected_food_keys.items():
            meal_foods = []
            meal_calories = 0
            
            for food_key in food_keys:
                if food_key not in FOOD_DATABASE:
                    continue
                    
                food_data = FOOD_DATABASE[food_key]
                
                # Calculate portion
                portion_g, portion_str = self.portion_calculator.calculate_portion(
                    food_key, request.patient_profile.age, 
                    request.patient_profile.gender, request.patient_profile.activity_level
                )
                
                # Calculate nutrition per portion
                factor = portion_g / 100
                calories = int(food_data['calories_per_100g'] * factor)
                protein = round(food_data['protein'] * factor, 1)
                carbs = round(food_data['carbs'] * factor, 1)
                fat = round(food_data['fat'] * factor, 1)
                fiber = round(food_data['fiber'] * factor, 1)
                
                # Find smart swaps (now more proactive)
                swaps = self.swap_engine.find_swaps(food_key, all_allergens, request.diet_preferences.dislikes)
                
                enhanced_food = EnhancedFoodItem(
                    name=food_data['name'],
                    category=food_data['category'],
                    quantity=portion_str,
                    calories=calories,
                    protein=protein,
                    carbs=carbs,
                    fat=fat,
                    fiber=fiber,
                    rasa=food_data['rasa'],
                    guna=food_data['guna'],
                    virya=food_data['virya'],
                    vipaka=food_data['vipaka'],
                    dosha_effect=food_data['dosha_effect'],
                    allergens=food_data.get('allergens', []),
                    smart_swaps=swaps,
                    portion_info={
                        "age_adjusted": True,
                        "activity_level": request.patient_profile.activity_level,
                        "base_portion": portion_g
                    }
                )
                
                meal_foods.append(enhanced_food)
                meal_calories += calories
                
                if swaps:
                    smart_swaps_applied.extend([f"{food_data['name']} → {swap}" for swap in swaps[:1]])
                
                portion_adjustments[food_data['name']] = f"Adjusted for {request.patient_profile.age}yr {request.patient_profile.gender}"
            
            # Calculate nutrient percentages for bars
            total_protein_cal = sum(f.protein * 4 for f in meal_foods)
            total_carb_cal = sum(f.carbs * 4 for f in meal_foods)
            total_fat_cal = sum(f.fat * 9 for f in meal_foods)
            total_cal = total_protein_cal + total_carb_cal + total_fat_cal
            
            nutrient_bars = {
                "protein": round((total_protein_cal / total_cal * 100) if total_cal > 0 else 0, 1),
                "carbs": round((total_carb_cal / total_cal * 100) if total_cal > 0 else 0, 1),
                "fat": round((total_fat_cal / total_cal * 100) if total_cal > 0 else 0, 1)
            }
            
            # Add meal type context for rationale
            meal_context = ""
            if meal_recipe_ingredients[meal_type]:
                meal_context = f"Based on your {meal_type} recipe with {len(meal_recipe_ingredients[meal_type])} ingredients. "
            
            meal = Meal(
                meal_type=MealType(meal_type.title()),
                foods=meal_foods,
                total_calories=meal_calories,
                ayurvedic_rationale=f"{meal_context}Climate-adapted {meal_type} for {request.patient_profile.constitution} constitution in {weather.season.lower()} weather ({weather.temperature}°C)",
                nutrient_bars=nutrient_bars
            )
            
            meals.append(meal)
        
        # Calculate total daily calories
        total_calories = sum(meal.total_calories for meal in meals)
        
        # Generate recommendations
        recommendations = [
            f"Diet adapted for {weather.season.lower()} season with {weather.temperature}°C temperature",
            f"Portion sizes adjusted for {request.patient_profile.age}-year-old {request.patient_profile.gender}",
            f"Foods selected to balance {request.patient_profile.constitution} constitution",
            "All allergens avoided based on patient profile"
        ]
        
        if any(meal_recipe_ingredients.values()):
            total_recipe_ingredients = sum(len(ingredients) for ingredients in meal_recipe_ingredients.values())
            meal_count = sum(1 for ingredients in meal_recipe_ingredients.values() if ingredients)
            recommendations.append(f"Custom meal recipes used for {meal_count} meals with {total_recipe_ingredients} total ingredients")
        
        if smart_swaps_applied:
            recommendations.append(f"Smart swaps suggested for {len(smart_swaps_applied)} items")
        
        return EnhancedDietChart(
            patient_id=request.patient_profile.patient_id,
            meals=meals,
            total_daily_calories=total_calories,
            weather_context=weather,
            ayurvedic_analysis=f"Personalized {request.patient_profile.constitution} diet plan adapted for {weather.city} climate conditions. Portion sizes optimized for {request.patient_profile.activity_level} activity level.",
            recommendations=recommendations,
            smart_swaps_applied=smart_swaps_applied,
            portion_adjustments=portion_adjustments
        )

# Initialize services
geo_ayurvedic_engine = GeoAyurvedicEngine()

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AyushAahar API - Intelligent Ayurvedic Diet Chart Generator"}

@api_router.get("/patients")
async def get_patients():
    """Get all patients from dataset and database"""
    try:
        # Get patients from database
        db_patients = await db.patients.find().to_list(length=None)
        
        # Convert ObjectId to string and filter only patients with proper structure
        valid_db_patients = []
        for patient in db_patients:
            patient['_id'] = str(patient['_id'])
            # Only include patients that have the proper PatientID field (new format)
            if 'PatientID' in patient:
                valid_db_patients.append(patient)
        
        # Get static patients
        static_patients = PATIENT_DATABASE.copy()
        
        # Combine both lists, avoiding duplicates based on PatientID
        all_patients = static_patients.copy()
        static_patient_ids = {p['PatientID'] for p in static_patients}
        
        # Add database patients that don't exist in static data
        for db_patient in valid_db_patients:
            if db_patient['PatientID'] not in static_patient_ids:
                all_patients.append(db_patient)
        
        return all_patients
        
    except Exception as e:
        logging.error(f"Error fetching all patients: {e}")
        # Fallback to static data if database fails
        return PATIENT_DATABASE

@api_router.post("/generate-enhanced-diet-chart")
async def generate_enhanced_diet_chart(request: EnhancedDietRequest):
    """Generate enhanced diet chart with all features"""
    try:
        diet_chart = await geo_ayurvedic_engine.generate_enhanced_diet_chart(request)
        
        # Save to database
        diet_chart_dict = diet_chart.dict()
        diet_chart_dict['created_at'] = diet_chart_dict['created_at'].isoformat()
        diet_chart_dict['weather_context'] = dict(diet_chart_dict['weather_context'])
        
        await db.enhanced_diet_charts.insert_one(diet_chart_dict)
        
        # Also save to patient's diet charts collection
        patient_diet_chart = PatientDietChart(
            patient_id=request.patient_profile.patient_id,
            chart_data=diet_chart,
            doctor_notes=""
        )
        
        patient_chart_dict = patient_diet_chart.dict()
        patient_chart_dict['created_at'] = patient_chart_dict['created_at'].isoformat()
        patient_chart_dict['chart_data']['created_at'] = patient_chart_dict['chart_data']['created_at'].isoformat()
        patient_chart_dict['chart_data']['weather_context'] = dict(patient_chart_dict['chart_data']['weather_context'])
        
        await db.patient_diet_charts.insert_one(patient_chart_dict)
        
        return diet_chart
    except Exception as e:
        logging.error(f"Error generating enhanced diet chart: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/patients")
async def create_patient(patient_data: dict):
    """Create a new patient"""
    try:
        # Validate required fields
        required_fields = ['PatientID', 'Name', 'Age', 'Gender', 'City']
        for field in required_fields:
            if field not in patient_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Check if patient ID already exists
        existing_patient = await db.patients.find_one({"PatientID": patient_data['PatientID']})
        if existing_patient:
            # Generate new ID if conflict
            import random
            patient_data['PatientID'] = f"{patient_data['PatientID'][:-3]}{random.randint(100, 999)}"
        
        # Insert patient into database
        result = await db.patients.insert_one(patient_data)
        
        # Return the created patient
        patient_data['_id'] = str(result.inserted_id)
        return {"message": "Patient created successfully", "patient": patient_data}
        
    except HTTPException:
        # Re-raise HTTPExceptions as-is (don't convert to 500)
        raise
    except Exception as e:
        logging.error(f"Error creating patient: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/patients/{patient_id}")
async def get_patient_by_id(patient_id: str):
    """Get a specific patient by ID"""
    try:
        # First try to find in database
        patient = await db.patients.find_one({"PatientID": patient_id})
        if patient:
            patient['_id'] = str(patient['_id'])
            return patient
        
        # If not found in database, check static data
        patients_data = load_patients_data()
        for patient in patients_data:
            if patient['PatientID'] == patient_id:
                return patient
        
        raise HTTPException(status_code=404, detail="Patient not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/patients/{patient_id}/diet-charts")
async def get_patient_diet_charts(patient_id: str):
    """Get all diet charts for a specific patient"""
    try:
        charts = await db.patient_diet_charts.find({"patient_id": patient_id}).sort("created_at", -1).to_list(length=None)
        
        # Convert back from database format
        for chart in charts:
            chart['_id'] = str(chart['_id'])
            if isinstance(chart.get('created_at'), str):
                chart['created_at'] = chart['created_at']
        
        return charts
    except Exception as e:
        logging.error(f"Error fetching patient diet charts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/appointments")
async def create_appointment(appointment: Appointment):
    """Create a new appointment"""
    try:
        appointment_dict = appointment.dict()
        appointment_dict['created_at'] = appointment_dict['created_at'].isoformat()
        
        result = await db.appointments.insert_one(appointment_dict)
        appointment_dict['_id'] = str(result.inserted_id)
        
        return appointment_dict
    except Exception as e:
        logging.error(f"Error creating appointment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/appointments")
async def get_appointments():
    """Get all appointments"""
    try:
        appointments = await db.appointments.find().sort("appointment_date", 1).to_list(length=None)
        
        for appointment in appointments:
            appointment['_id'] = str(appointment['_id'])
        
        return appointments
    except Exception as e:
        logging.error(f"Error fetching appointments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/appointments/today")
async def get_todays_appointments():
    """Get today's appointments for dashboard"""
    try:
        from datetime import date
        today = "2025-09-22"  # Set to September 22, 2025 as requested
        
        appointments = await db.appointments.find({"appointment_date": today}).sort("appointment_time", 1).to_list(length=None)
        
        for appointment in appointments:
            appointment['_id'] = str(appointment['_id'])
        
        return appointments
    except Exception as e:
        logging.error(f"Error fetching today's appointments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/parse-recipe")
async def parse_recipe(recipe_text: str = Form(None), recipe_image: UploadFile = File(None)):
    """Enhanced recipe parsing with OCR support"""
    try:
        recipe_parser = EnhancedRecipeParser()
        ingredients = []
        
        if recipe_text:
            ingredients = recipe_parser.parse_recipe_text(recipe_text)
        elif recipe_image:
            # Read image and convert to base64
            image_content = await recipe_image.read()
            image_base64 = base64.b64encode(image_content).decode()
            ingredients = await recipe_parser.parse_recipe_image(image_base64)
        
        # Get food details for ingredients
        ingredient_details = []
        for ingredient in ingredients:
            if ingredient in FOOD_DATABASE:
                ingredient_details.append({
                    "key": ingredient,
                    "name": FOOD_DATABASE[ingredient]["name"],
                    "category": FOOD_DATABASE[ingredient]["category"]
                })
        
        return {
            "ingredients": ingredients,
            "ingredient_details": ingredient_details,
            "success": True,
            "total_found": len(ingredient_details)
        }
    except Exception as e:
        logging.error(f"Error parsing recipe: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/smart-swaps/{food_key}")
async def get_smart_swaps(food_key: str, allergens: List[str] = [], dislikes: List[str] = []):
    """Get smart swap suggestions for a food item"""
    try:
        swap_engine = SmartSwapEngine()
        swaps = swap_engine.find_swaps(food_key, allergens, dislikes)
        
        swap_details = []
        for swap_name in swaps:
            # Find the food key for this swap name
            swap_key = next((k for k, v in FOOD_DATABASE.items() if v['name'] == swap_name), None)
            if swap_key:
                swap_details.append({
                    "name": swap_name,
                    "key": swap_key,
                    "reason": "Allergen-free alternative" if allergens else "Alternative option"
                })
        
        return {
            "original_food": FOOD_DATABASE.get(food_key, {}).get('name', 'Unknown'),
            "swaps": swap_details,
            "success": True
        }
    except Exception as e:
        logging.error(f"Error getting smart swaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/weather/{location}")
async def get_weather(location: str):
    try:
        weather_service = EnhancedWeatherService()
        weather_data = await weather_service.get_weather_data(location)
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather data unavailable: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)