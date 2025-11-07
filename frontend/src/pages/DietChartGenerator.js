import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { 
  ArrowLeft,
  ArrowRight,
  Loader2, 
  Thermometer, 
  Droplets, 
  MapPin, 
  User, 
  Scale, 
  Activity, 
  Utensils, 
  Clock, 
  Target, 
  TrendingUp,
  Download,
  Share,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  PieChart,
  BarChart3,
  Zap,
  Upload,
  FileText,
  Camera,
  Lightbulb
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DietChartGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [dietChart, setDietChart] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [mealRecipes, setMealRecipes] = useState({
    breakfast: { text: '', image: null },
    lunch: { text: '', image: null },
    snack: { text: '', image: null },
    dinner: { text: '', image: null }
  });
  const [parsedIngredients, setParsedIngredients] = useState({
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: []
  });
  
  const [formData, setFormData] = useState({
    patient_id: '',
    city_name: '',
    allergies: [],
    dislikes: [],
    calorie_target: null,
    custom_preferences: '',
    activity_level: 'moderate'
  });

  // Load patients on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Auto-load patient profile if coming from patient page
  useEffect(() => {
    const state = location.state;
    if (state?.patientId) {
      const patient = patients.find(p => p.PatientID === state.patientId);
      if (patient) {
        setSelectedPatient(patient);
        setFormData(prev => ({
          ...prev,
          patient_id: patient.PatientID,
          city_name: patient.City,
          allergies: patient.Allergies || []
        }));
      }
    }
  }, [patients, location.state]);

  const loadPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  };

  const handlePatientSelect = (patientId) => {
    const patient = patients.find(p => p.PatientID === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setFormData(prev => ({
        ...prev,
        patient_id: patient.PatientID,
        city_name: patient.City,
        allergies: patient.Allergies || []
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleMealRecipeChange = (mealType, field, value) => {
    setMealRecipes(prev => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        [field]: value
      }
    }));
  };

  const handleMealRecipeUpload = (mealType, e) => {
    const file = e.target.files[0];
    if (file) {
      handleMealRecipeChange(mealType, 'image', file);
    }
  };

  const parseMealRecipe = async (mealType) => {
    const recipe = mealRecipes[mealType];
    if (!recipe.text && !recipe.image) {
      setError(`Please provide recipe text or upload an image for ${mealType}`);
      return;
    }

    try {
      const formData = new FormData();
      if (recipe.text) {
        formData.append('recipe_text', recipe.text);
      }
      if (recipe.image) {
        formData.append('recipe_image', recipe.image);
      }

      const response = await axios.post(`${API}/parse-recipe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setParsedIngredients(prev => ({
        ...prev,
        [mealType]: response.data.ingredient_details || []
      }));
    } catch (err) {
      console.error(`Error parsing ${mealType} recipe:`, err);
      setError(`Failed to parse ${mealType} recipe. Please try again.`);
    }
  };

  const generateDietChart = async () => {
    if (!selectedPatient || !formData.city_name) {
      setError('Please select a patient and enter city name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData = {
        patient_profile: {
          patient_id: selectedPatient.PatientID,
          name: selectedPatient.Name,
          age: selectedPatient.Age,
          gender: selectedPatient.Gender,
          city: selectedPatient.City,
          constitution: selectedPatient.Constitution,
          condition: selectedPatient.Condition,
          allergies: selectedPatient.Allergies || [],
          activity_level: formData.activity_level
        },
        diet_preferences: {
          allergies: formData.allergies,
          dislikes: formData.dislikes,
          calorie_target: formData.calorie_target,
          custom_preferences: formData.custom_preferences
        },
        city_name: formData.city_name,
        meal_recipes: {
          breakfast: mealRecipes.breakfast.text || mealRecipes.breakfast.image ? {
            recipe_text: mealRecipes.breakfast.text || null,
            recipe_image_base64: null // Would be processed in real app
          } : null,
          lunch: mealRecipes.lunch.text || mealRecipes.lunch.image ? {
            recipe_text: mealRecipes.lunch.text || null,
            recipe_image_base64: null
          } : null,
          snack: mealRecipes.snack.text || mealRecipes.snack.image ? {
            recipe_text: mealRecipes.snack.text || null,
            recipe_image_base64: null
          } : null,
          dinner: mealRecipes.dinner.text || mealRecipes.dinner.image ? {
            recipe_text: mealRecipes.dinner.text || null,
            recipe_image_base64: null
          } : null
        }
      };

      const response = await axios.post(`${API}/generate-enhanced-diet-chart`, requestData);
      setDietChart(response.data);
      setShowOverview(true);
    } catch (err) {
      console.error('Error generating diet chart:', err);
      setError(err.response?.data?.detail || 'Failed to generate diet chart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDietChart(null);
    setShowOverview(false);
    setSelectedPatient(null);
    setMealRecipes({
      breakfast: { text: '', image: null },
      lunch: { text: '', image: null },
      snack: { text: '', image: null },
      dinner: { text: '', image: null }
    });
    setParsedIngredients({
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: []
    });
    setFormData({
      patient_id: '',
      city_name: '',
      allergies: [],
      dislikes: [],
      calorie_target: null,
      custom_preferences: '',
      activity_level: 'moderate'
    });
    setError('');
  };

  const getRasaColor = (rasa) => {
    const colors = {
      'Sweet': 'bg-green-100 text-green-800',
      'Sour': 'bg-yellow-100 text-yellow-800',
      'Salty': 'bg-blue-100 text-blue-800',
      'Pungent': 'bg-red-100 text-red-800',
      'Bitter': 'bg-gray-100 text-gray-800',
      'Astringent': 'bg-purple-100 text-purple-800'
    };
    return colors[rasa] || 'bg-gray-100 text-gray-800';
  };

  const getDoshaEffectColor = (effect) => {
    const colors = {
      'Increase': 'text-red-600',
      'Decrease': 'text-green-600',
      'Neutral': 'text-gray-600'
    };
    return colors[effect] || 'text-gray-600';
  };

  const getImbalanceIndicator = (food, patientDosha) => {
    if (!food.dosha_effect || !patientDosha) return <CheckCircle className="h-4 w-4 text-blue-500" />;
    
    const effect = food.dosha_effect[patientDosha.split('-')[0]]; // Handle combined doshas
    if (effect === 'Increase') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (effect === 'Decrease') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-blue-500" />;
  };

  const handleDownloadPDF = () => {
    alert('PDF generation with doctor branding would be implemented here');
  };

  const handleShare = () => {
    alert('Share functionality would be implemented here');
  };

  // Enhanced Chart Overview Component
  const ChartOverview = () => {
    if (!dietChart) return null;

    const totalProtein = dietChart.meals.reduce((sum, meal) => 
      sum + meal.foods.reduce((mealSum, food) => mealSum + food.protein, 0), 0
    );
    const totalCarbs = dietChart.meals.reduce((sum, meal) => 
      sum + meal.foods.reduce((mealSum, food) => mealSum + food.carbs, 0), 0
    );
    const totalFat = dietChart.meals.reduce((sum, meal) => 
      sum + meal.foods.reduce((mealSum, food) => mealSum + food.fat, 0), 0
    );

    const macroData = [
      { name: 'Protein', value: totalProtein, color: 'from-blue-400 to-blue-600', percentage: Math.round((totalProtein * 4 / dietChart.total_daily_calories) * 100) },
      { name: 'Carbs', value: totalCarbs, color: 'from-green-400 to-green-600', percentage: Math.round((totalCarbs * 4 / dietChart.total_daily_calories) * 100) },
      { name: 'Fat', value: totalFat, color: 'from-orange-400 to-orange-600', percentage: Math.round((totalFat * 9 / dietChart.total_daily_calories) * 100) }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Enhanced Diet Chart Analysis</h1>
            <p className="text-purple-100 text-lg">Comprehensive nutritional and Ayurvedic overview with smart recommendations</p>
          </div>

          {/* Main Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{dietChart.total_daily_calories}</div>
                <div className="text-purple-600 text-sm">Total Calories</div>
              </CardContent>
            </Card>
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{dietChart.meals.length}</div>
                <div className="text-blue-600 text-sm">Meals Planned</div>
              </CardContent>
            </Card>
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{dietChart.smart_swaps_applied?.length || 0}</div>
                <div className="text-green-600 text-sm">Smart Swaps</div>
              </CardContent>
            </Card>
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{dietChart.weather_context.temperature}°C</div>
                <div className="text-orange-600 text-sm">Climate Adapted</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Features Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Macronutrient Distribution */}
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <PieChart className="h-5 w-5" />
                  Macronutrient Bars
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {macroData.map((macro, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{macro.name}</span>
                        <span className="text-sm font-bold text-slate-800">{macro.value}g ({macro.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 bg-gradient-to-r ${macro.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${macro.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Smart Swaps Applied */}
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <RefreshCw className="h-5 w-5" />
                  Smart Swaps Applied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dietChart.smart_swaps_applied?.slice(0, 5).map((swap, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded text-sm text-green-800">
                      {swap}
                    </div>
                  )) || <p className="text-slate-600 text-sm">No swaps needed</p>}
                </div>
              </CardContent>
            </Card>

            {/* Portion Adjustments */}
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Scale className="h-5 w-5" />
                  Portion Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(dietChart.portion_adjustments || {}).slice(0, 3).map(([food, adjustment], index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-blue-800">{food}</p>
                      <p className="text-xs text-blue-600">{adjustment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => setShowOverview(false)}
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg font-medium shadow-lg"
            >
              View Detailed Chart
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (showOverview && dietChart) {
    return <ChartOverview />;
  }

  if (dietChart && !showOverview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowOverview(true)}
                  className="text-slate-600 hover:text-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Overview
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Enhanced Diet Chart</h1>
                  <p className="text-slate-600">Complete nutritional analysis with smart features</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button onClick={handleDownloadPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={handleShare} variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button 
                  onClick={resetForm}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  Generate New Chart
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-6 max-w-6xl">
          {/* Patient & Weather Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-lg border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Name:</span>
                  <span className="text-slate-800">{selectedPatient?.Name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Age:</span>
                  <span className="text-slate-800">{selectedPatient?.Age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Constitution:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedPatient?.Constitution}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Activity Level:</span>
                  <Badge variant="outline" className="capitalize">
                    {formData.activity_level}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <MapPin className="h-5 w-5" />
                  Climate Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600 flex items-center gap-1">
                    <Thermometer className="h-4 w-4" />
                    Temperature:
                  </span>
                  <span className="text-slate-800">{dietChart.weather_context.temperature}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600 flex items-center gap-1">
                    <Droplets className="h-4 w-4" />
                    Humidity:
                  </span>
                  <span className="text-slate-800">{dietChart.weather_context.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Season:</span>
                  <Badge variant="outline" className="border-green-300 text-green-800">
                    {dietChart.weather_context.season}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Ayurvedic Analysis */}
          <Card className="mb-8 shadow-lg border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5" />
                Enhanced Ayurvedic Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed mb-4">{dietChart.ayurvedic_analysis}</p>
              <div className="bg-amber-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-amber-800 mb-2">Smart Recommendations:</h4>
                <ul className="space-y-1">
                  {dietChart.recommendations.map((rec, index) => (
                    <li key={index} className="text-amber-700 text-sm flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              {dietChart.smart_swaps_applied?.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Smart Swaps Applied:
                  </h4>
                  <div className="space-y-1">
                    {dietChart.smart_swaps_applied.map((swap, index) => (
                      <p key={index} className="text-green-700 text-sm">{swap}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Meal Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dietChart.meals.map((meal, index) => (
              <Card key={index} className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Utensils className="h-5 w-5" />
                    {meal.meal_type}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {meal.total_calories} calories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Nutrient Bars for Meal */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <h5 className="text-sm font-medium text-slate-700 mb-2">Nutrient Distribution:</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Protein</span>
                        <span className="text-xs font-medium">{meal.nutrient_bars?.protein || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${meal.nutrient_bars?.protein || 0}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Carbs</span>
                        <span className="text-xs font-medium">{meal.nutrient_bars?.carbs || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${meal.nutrient_bars?.carbs || 0}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Fat</span>
                        <span className="text-xs font-medium">{meal.nutrient_bars?.fat || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${meal.nutrient_bars?.fat || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {meal.foods.map((food, foodIndex) => (
                      <div key={foodIndex} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-800">{food.name}</h4>
                              {getImbalanceIndicator(food, selectedPatient?.Constitution)}
                            </div>
                            <p className="text-sm text-slate-600">{food.quantity}</p>
                            <Badge variant="outline" className="text-xs mt-1 capitalize">
                              {food.category}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-slate-600">
                            {food.calories} cal
                          </Badge>
                        </div>
                        
                        {/* Enhanced Nutritional Info */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="text-center">
                            <div className="text-xs font-medium text-slate-800 mb-1">{food.protein}g</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((food.protein / 30) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-medium text-slate-800 mb-1">{food.carbs}g</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((food.carbs / 50) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Carbs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-medium text-slate-800 mb-1">{food.fat}g</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 bg-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((food.fat / 20) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Fat</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-medium text-slate-800 mb-1">{food.fiber}g</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((food.fiber / 10) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Fiber</div>
                          </div>
                        </div>
                        
                        {/* Ayurvedic Properties */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs font-medium text-slate-600">Rasa:</span>
                            {food.rasa?.map((r, i) => (
                              <Badge key={i} className={`text-xs ${getRasaColor(r)}`}>
                                {r}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-slate-600">Virya:</span>
                            <Badge variant="outline" className="text-xs">
                              {food.virya}
                            </Badge>
                            <span className="font-medium text-slate-600">Vipaka:</span>
                            <Badge variant="outline" className="text-xs">
                              {food.vipaka}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-slate-600">Dosha Effects:</span>
                            {Object.entries(food.dosha_effect || {}).map(([dosha, effect]) => (
                              <span key={dosha} className={`${getDoshaEffectColor(effect)}`}>
                                {dosha}: {effect}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Smart Swaps */}
                        {food.smart_swaps?.length > 0 && (
                          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-blue-800">Smart Alternatives:</p>
                                <p className="text-xs text-blue-600">{food.smart_swaps.join(', ')}</p>
                              </div>
                              <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Swap
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Portion Info */}
                        {food.portion_info?.age_adjusted && (
                          <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                            Portion adjusted for {selectedPatient?.Age}yr {selectedPatient?.Gender} with {food.portion_info.activity_level} activity
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Evidence Panel */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 text-sm mb-1 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Evidence & Rationale:
                    </h5>
                    <p className="text-blue-700 text-sm">{meal.ayurvedic_rationale}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Enhanced Diet Chart Generator</h1>
                <p className="text-slate-600">Intelligent Ayurvedic nutrition planning with smart features</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-6xl">
        {/* Main Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-slate-800">Enhanced Diet Chart Generator</CardTitle>
            <CardDescription className="text-slate-600">
              AI-powered Ayurvedic nutrition with climate adaptation, smart swaps, and portion optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Patient Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                1. Auto-Load Patient Profile
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Select Patient</Label>
                  <Select value={formData.patient_id} onValueChange={handlePatientSelect}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500">
                      <SelectValue placeholder="Choose patient from database" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.PatientID} value={patient.PatientID}>
                          {patient.Name} - {patient.Age}yr {patient.Gender} ({patient.Constitution})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPatient && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Patient Profile Loaded</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600">Name:</span>
                          <p className="font-medium text-blue-800">{selectedPatient.Name}</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Age:</span>
                          <p className="font-medium text-blue-800">{selectedPatient.Age} years</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Constitution:</span>
                          <p className="font-medium text-blue-800">{selectedPatient.Constitution}</p>
                        </div>
                        <div>
                          <span className="text-blue-600">City:</span>
                          <p className="font-medium text-blue-800">{selectedPatient.City}</p>
                        </div>
                      </div>
                      {selectedPatient.Allergies?.length > 0 && (
                        <div className="mt-3">
                          <span className="text-blue-600 text-sm">Known Allergies:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPatient.Allergies.map((allergy, index) => (
                              <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Geo-Ayurvedic Engine */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                2. Geo-Ayurvedic Engine
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-slate-700 font-medium">City Name *</Label>
                  <Input
                    id="city"
                    placeholder="Enter city name for weather data"
                    value={formData.city_name}
                    onChange={(e) => handleInputChange('city_name', e.target.value)}
                    className="border-slate-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500">Climate data will auto-adapt meal recommendations</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Activity Level</Label>
                  <Select value={formData.activity_level} onValueChange={(value) => handleInputChange('activity_level', value)}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Sedentary lifestyle</SelectItem>
                      <SelectItem value="moderate">Moderate - Regular exercise</SelectItem>
                      <SelectItem value="high">High - Very active/athlete</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Affects portion sizing calculations</p>
                </div>
              </div>
            </div>

            {/* Meal-Specific Recipe Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                3. Meal-Specific Recipe Analysis (Optional)
              </h3>
              <p className="text-slate-600 text-sm">Enter what you want to eat for each meal. Leave empty for AI-suggested meals based on your constitution and climate.</p>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {['breakfast', 'lunch', 'snack', 'dinner'].map((mealType) => (
                  <Card key={mealType} className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg capitalize text-slate-800 flex items-center gap-2">
                        <Utensils className="h-5 w-5" />
                        {mealType}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Recipe Text</Label>
                        <textarea
                          value={mealRecipes[mealType].text}
                          onChange={(e) => handleMealRecipeChange(mealType, 'text', e.target.value)}
                          placeholder={`Enter ${mealType} recipe... (e.g., "Sambar rice with curd")`}
                          className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none text-sm"
                        />
                      </div>
                      
                      <div className="text-center text-slate-400 text-xs">OR</div>
                      
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Upload Recipe Image</Label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleMealRecipeUpload(mealType, e)}
                            className="hidden"
                            id={`recipe-upload-${mealType}`}
                          />
                          <label htmlFor={`recipe-upload-${mealType}`} className="cursor-pointer">
                            <Camera className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs text-slate-600">
                              {mealRecipes[mealType].image ? `Selected: ${mealRecipes[mealType].image.name}` : 'Upload image (OCR)'}
                            </p>
                          </label>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => parseMealRecipe(mealType)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={!mealRecipes[mealType].text && !mealRecipes[mealType].image}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Parse {mealType} Recipe
                      </Button>
                      
                      {/* Parsed Ingredients Display */}
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium text-xs">Parsed Ingredients</Label>
                        <div className="max-h-32 border border-slate-200 rounded-lg p-2 overflow-y-auto bg-slate-50">
                          {parsedIngredients[mealType].length > 0 ? (
                            <div className="space-y-1">
                              {parsedIngredients[mealType].map((ingredient, index) => (
                                <div key={index} className="flex items-center justify-between p-1 bg-white rounded text-xs">
                                  <span className="font-medium text-slate-800">{ingredient.name}</span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {ingredient.category}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500 text-xs text-center">
                              No ingredients parsed yet
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                4. Diet Preferences & Smart Swaps
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-700 font-medium mb-2 block">Additional Allergies</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Gluten', 'Nuts', 'Soy', 'Eggs', 'Seafood'].map(allergy => (
                        <Button
                          key={allergy}
                          type="button"
                          variant={formData.allergies.includes(allergy) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleArrayField('allergies', allergy)}
                          className={formData.allergies.includes(allergy) 
                            ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200" 
                            : "hover:bg-red-50"
                          }
                        >
                          {allergy}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Smart swaps will be suggested automatically</p>
                  </div>

                  <div>
                    <Label className="text-slate-700 font-medium mb-2 block">Food Dislikes</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Spicy', 'Sweet', 'Bitter', 'Sour'].map(dislike => (
                        <Button
                          key={dislike}
                          type="button"
                          variant={formData.dislikes.includes(dislike) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleArrayField('dislikes', dislike)}
                          className={formData.dislikes.includes(dislike) 
                            ? "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200" 
                            : "hover:bg-orange-50"
                          }
                        >
                          {dislike}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories" className="text-slate-700 font-medium">Calorie Target (Optional)</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="e.g., 2000"
                      value={formData.calorie_target || ''}
                      onChange={(e) => handleInputChange('calorie_target', e.target.value ? parseInt(e.target.value) : null)}
                      className="border-slate-300 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500">Leave empty for auto-calculation</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferences" className="text-slate-700 font-medium">Custom Preferences</Label>
                    <textarea
                      id="preferences"
                      placeholder="Any specific dietary preferences or notes..."
                      value={formData.custom_preferences}
                      onChange={(e) => handleInputChange('custom_preferences', e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-6">
              <Button
                onClick={generateDietChart}
                disabled={loading || !selectedPatient}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-4 text-lg font-medium shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Enhanced Diet Chart...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Generate Enhanced Diet Chart with Smart Features
                  </div>
                )}
              </Button>
              {!selectedPatient && (
                <p className="text-center text-red-600 text-sm mt-2">Please select a patient first</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DietChartGenerator;