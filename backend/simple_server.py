from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Get the directory of the current script
ROOT_DIR = Path(__file__).parent

# Load datasets
def load_json_data(filename):
    try:
        with open(ROOT_DIR / 'datasets' / filename, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

FOOD_DATABASE = load_json_data('food_dataset.json')
PATIENT_DATABASE = load_json_data('patients.json')
ALLERGY_MAP = load_json_data('allergy_map.json')

@app.route('/')
def home():
    return jsonify({
        "message": "AyushAahar Backend API",
        "status": "running",
        "endpoints": [
            "/patients",
            "/food-items", 
            "/allergies",
            "/health"
        ]
    })

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "service": "AyushAahar Backend"})

@app.route('/patients', methods=['GET'])
def get_patients():
    return jsonify(PATIENT_DATABASE)

@app.route('/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    if isinstance(PATIENT_DATABASE, list):
        patient = next((p for p in PATIENT_DATABASE if p.get('PatientID') == patient_id), None)
    else:
        patients = PATIENT_DATABASE.get('patients', [])
        patient = next((p for p in patients if p.get('PatientID') == patient_id), None)
    
    if patient:
        return jsonify(patient)
    return jsonify({"error": "Patient not found"}), 404

@app.route('/food-items', methods=['GET'])
def get_food_items():
    return jsonify(FOOD_DATABASE)

@app.route('/food-items/search', methods=['GET'])
def search_food_items():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify(FOOD_DATABASE)
    
    # Simple search through food items
    results = {}
    for category, items in FOOD_DATABASE.items():
        if isinstance(items, list):
            filtered_items = [item for item in items if query in str(item).lower()]
            if filtered_items:
                results[category] = filtered_items
        elif isinstance(items, dict):
            filtered_items = {k: v for k, v in items.items() if query in k.lower()}
            if filtered_items:
                results[category] = filtered_items
    
    return jsonify(results)

@app.route('/allergies', methods=['GET'])
def get_allergies():
    return jsonify(ALLERGY_MAP)

@app.route('/allergies/<allergy_type>', methods=['GET'])
def get_allergy_foods(allergy_type):
    allergy_data = ALLERGY_MAP.get(allergy_type)
    if allergy_data:
        return jsonify(allergy_data)
    return jsonify({"error": "Allergy type not found"}), 404

@app.route('/nutrition/<food_item>', methods=['GET'])
def get_nutrition_info(food_item):
    # Search for nutrition info in the food database
    for category, items in FOOD_DATABASE.items():
        if isinstance(items, dict):
            for item_name, item_data in items.items():
                if item_name.lower() == food_item.lower():
                    return jsonify(item_data)
                if isinstance(item_data, dict) and item_data.get('name', '').lower() == food_item.lower():
                    return jsonify(item_data)
    
    return jsonify({"error": "Food item not found"}), 404

if __name__ == '__main__':
    print("Starting AyushAahar Backend Server...")
    print(f"Loading data from: {ROOT_DIR / 'datasets'}")
    print(f"Food items loaded: {len(FOOD_DATABASE)} categories")
    
    if isinstance(PATIENT_DATABASE, list):
        print(f"Patients loaded: {len(PATIENT_DATABASE)} patients")
    else:
        print(f"Patients loaded: {len(PATIENT_DATABASE.get('patients', []))} patients")
    
    print(f"Allergy types loaded: {len(ALLERGY_MAP)} types")
    
    app.run(debug=True, host='0.0.0.0', port=5000)