import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  ArrowLeft, 
  Save,
  User,
  MapPin,
  Heart,
  Activity,
  Utensils,
  Droplets,
  Clock,
  Stethoscope,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddPatient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [patientData, setPatientData] = useState({
    // Basic Info
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    
    // Ayurvedic Info
    constitution: '',
    condition: '',
    allergies: [],
    
    // Comprehensive Health Parameters
    height: '',
    weight: '',
    bmi: '',
    bloodPressure: '',
    bloodGroup: '',
    
    // Dietary Habits
    dietType: '', // Vegetarian, Non-vegetarian, Vegan, Jain
    mealFrequency: '', // 2, 3, 4, 5, 6 times per day
    mealTimings: {
      breakfast: '08:00',
      lunch: '13:00',
      snack: '17:00',
      dinner: '20:00'
    },
    foodPreferences: '',
    foodDislikes: '',
    
    // Lifestyle & Health
    waterIntake: '', // liters per day
    bowelMovements: '', // Regular, Irregular, Constipated, Loose
    sleepHours: '',
    sleepQuality: '', // Good, Fair, Poor
    exerciseFrequency: '', // Daily, 3-4 times/week, 1-2 times/week, Rarely, Never
    stressLevel: '', // Low, Moderate, High
    smokingStatus: '', // Never, Former, Current
    alcoholConsumption: '', // Never, Occasional, Regular
    
    // Medical History
    chronicConditions: [],
    currentMedications: '',
    familyHistory: '',
    previousSurgeries: '',
    
    // Ayurvedic Assessment
    pulseType: '', // Vata, Pitta, Kapha pulse
    tongueCondition: '',
    skinType: '',
    digestiveFire: '', // Strong, Moderate, Weak
    mentalState: '', // Calm, Anxious, Irritable, Depressed
    
    // Additional Notes
    doctorNotes: '',
    emergencyContact: '',
    referredBy: ''
  });

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPatientData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setPatientData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setPatientData(prev => ({
      ...prev,
      [field]: arrayValue
    }));
  };

  const calculateBMI = () => {
    const height = parseFloat(patientData.height);
    const weight = parseFloat(patientData.weight);
    
    if (height && weight) {
      const heightInM = height / 100;
      const bmi = (weight / (heightInM * heightInM)).toFixed(1);
      setPatientData(prev => ({
        ...prev,
        bmi: bmi
      }));
    }
  };

  const generatePatientID = () => {
    const initials = patientData.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${initials}${random}`;
  };

  const savePatient = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!patientData.name || !patientData.age || !patientData.gender || !patientData.city) {
        setError('Please fill in all required fields (name, age, gender, city)');
        return;
      }

      // Generate patient ID
      const patientId = generatePatientID();

      // Prepare data for backend
      const newPatient = {
        PatientID: patientId,
        Name: patientData.name,
        Age: parseInt(patientData.age),
        Gender: patientData.gender,
        City: patientData.city,
        Constitution: patientData.constitution || 'Not assessed',
        Condition: patientData.condition || 'General consultation',
        Compliance: '0%',
        LastVisit: new Date().toISOString().split('T')[0],
        Status: 'Active',
        Charts: 0,
        Allergies: patientData.allergies,
        
        // Extended fields
        Phone: patientData.phone,
        Email: patientData.email,
        Address: patientData.address,
        Height: patientData.height,
        Weight: patientData.weight,
        BMI: patientData.bmi,
        BloodPressure: patientData.bloodPressure,
        BloodGroup: patientData.bloodGroup,
        
        // Dietary habits
        DietType: patientData.dietType,
        MealFrequency: patientData.mealFrequency,
        MealTimings: patientData.mealTimings,
        FoodPreferences: patientData.foodPreferences,
        FoodDislikes: patientData.foodDislikes,
        
        // Lifestyle
        WaterIntake: patientData.waterIntake,
        BowelMovements: patientData.bowelMovements,
        SleepHours: patientData.sleepHours,
        SleepQuality: patientData.sleepQuality,
        ExerciseFrequency: patientData.exerciseFrequency,
        StressLevel: patientData.stressLevel,
        SmokingStatus: patientData.smokingStatus,
        AlcoholConsumption: patientData.alcoholConsumption,
        
        // Medical
        ChronicConditions: patientData.chronicConditions,
        CurrentMedications: patientData.currentMedications,
        FamilyHistory: patientData.familyHistory,
        PreviousSurgeries: patientData.previousSurgeries,
        
        // Ayurvedic
        PulseType: patientData.pulseType,
        TongueCondition: patientData.tongueCondition,
        SkinType: patientData.skinType,
        DigestiveFire: patientData.digestiveFire,
        MentalState: patientData.mentalState,
        
        // Additional
        DoctorNotes: patientData.doctorNotes,
        EmergencyContact: patientData.emergencyContact,
        ReferredBy: patientData.referredBy
      };

      // Save to backend
      await axios.post(`${API}/patients`, newPatient);
      
      setSuccess(`Patient ${patientData.name} added successfully with ID: ${patientId}`);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/patient-management');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving patient:', err);
      setError('Failed to save patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/patient-management')}
                className="text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patients
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Add New Patient</h1>
                <p className="text-slate-600">Comprehensive patient registration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-4xl">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={patientData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter patient's full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={patientData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Age in years"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={patientData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={patientData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={patientData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="patient@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={patientData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city name"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={patientData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Complete address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Physical Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Physical Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={patientData.height}
                  onChange={(e) => {
                    handleInputChange('height', e.target.value);
                    setTimeout(calculateBMI, 100);
                  }}
                  placeholder="170"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={patientData.weight}
                  onChange={(e) => {
                    handleInputChange('weight', e.target.value);
                    setTimeout(calculateBMI, 100);
                  }}
                  placeholder="70"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bmi">BMI (auto-calculated)</Label>
                <Input
                  id="bmi"
                  value={patientData.bmi}
                  readOnly
                  placeholder="Calculated automatically"
                  className="bg-slate-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  value={patientData.bloodPressure}
                  onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                  placeholder="120/80"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select value={patientData.bloodGroup} onValueChange={(value) => handleInputChange('bloodGroup', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dietary Habits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Dietary Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dietType">Diet Type</Label>
                <Select value={patientData.dietType} onValueChange={(value) => handleInputChange('dietType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select diet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="Non-vegetarian">Non-vegetarian</SelectItem>
                    <SelectItem value="Vegan">Vegan</SelectItem>
                    <SelectItem value="Jain">Jain</SelectItem>
                    <SelectItem value="Eggetarian">Eggetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mealFrequency">Meal Frequency (per day)</Label>
                <Select value={patientData.mealFrequency} onValueChange={(value) => handleInputChange('mealFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 times</SelectItem>
                    <SelectItem value="3">3 times</SelectItem>
                    <SelectItem value="4">4 times</SelectItem>
                    <SelectItem value="5">5 times</SelectItem>
                    <SelectItem value="6">6 times</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Meal Timings</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="breakfast" className="text-sm">Breakfast</Label>
                    <Input
                      id="breakfast"
                      type="time"
                      value={patientData.mealTimings.breakfast}
                      onChange={(e) => handleInputChange('mealTimings.breakfast', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lunch" className="text-sm">Lunch</Label>
                    <Input
                      id="lunch"
                      type="time"
                      value={patientData.mealTimings.lunch}
                      onChange={(e) => handleInputChange('mealTimings.lunch', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="snack" className="text-sm">Snack</Label>
                    <Input
                      id="snack"
                      type="time"
                      value={patientData.mealTimings.snack}
                      onChange={(e) => handleInputChange('mealTimings.snack', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dinner" className="text-sm">Dinner</Label>
                    <Input
                      id="dinner"
                      type="time"
                      value={patientData.mealTimings.dinner}
                      onChange={(e) => handleInputChange('mealTimings.dinner', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="foodPreferences">Food Preferences</Label>
                <Textarea
                  id="foodPreferences"
                  value={patientData.foodPreferences}
                  onChange={(e) => handleInputChange('foodPreferences', e.target.value)}
                  placeholder="Preferred foods, cuisines, etc."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="foodDislikes">Food Dislikes/Allergies</Label>
                <Textarea
                  id="foodDislikes"
                  value={patientData.foodDislikes}
                  onChange={(e) => handleInputChange('foodDislikes', e.target.value)}
                  placeholder="Foods to avoid, allergies, etc."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lifestyle Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Lifestyle & Health Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="waterIntake">Water Intake (liters/day)</Label>
                <Input
                  id="waterIntake"
                  type="number"
                  step="0.5"
                  value={patientData.waterIntake}
                  onChange={(e) => handleInputChange('waterIntake', e.target.value)}
                  placeholder="2.5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bowelMovements">Bowel Movements</Label>
                <Select value={patientData.bowelMovements} onValueChange={(value) => handleInputChange('bowelMovements', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular (daily)</SelectItem>
                    <SelectItem value="Irregular">Irregular</SelectItem>
                    <SelectItem value="Constipated">Constipated</SelectItem>
                    <SelectItem value="Loose">Loose stools</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sleepHours">Sleep Hours (per night)</Label>
                <Input
                  id="sleepHours"
                  type="number"
                  value={patientData.sleepHours}
                  onChange={(e) => handleInputChange('sleepHours', e.target.value)}
                  placeholder="7"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sleepQuality">Sleep Quality</Label>
                <Select value={patientData.sleepQuality} onValueChange={(value) => handleInputChange('sleepQuality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exerciseFrequency">Exercise Frequency</Label>
                <Select value={patientData.exerciseFrequency} onValueChange={(value) => handleInputChange('exerciseFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="3-4 times/week">3-4 times/week</SelectItem>  
                    <SelectItem value="1-2 times/week">1-2 times/week</SelectItem>
                    <SelectItem value="Rarely">Rarely</SelectItem>
                    <SelectItem value="Never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stressLevel">Stress Level</Label>
                <Select value={patientData.stressLevel} onValueChange={(value) => handleInputChange('stressLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ayurvedic Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Ayurvedic Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="constitution">Constitution (Prakriti)</Label>
                <Select value={patientData.constitution} onValueChange={(value) => handleInputChange('constitution', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select constitution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vata">Vata</SelectItem>
                    <SelectItem value="Pitta">Pitta</SelectItem>
                    <SelectItem value="Kapha">Kapha</SelectItem>
                    <SelectItem value="Vata-Pitta">Vata-Pitta</SelectItem>
                    <SelectItem value="Pitta-Kapha">Pitta-Kapha</SelectItem>
                    <SelectItem value="Vata-Kapha">Vata-Kapha</SelectItem>
                    <SelectItem value="Tridoshic">Tridoshic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition">Primary Condition</Label>
                <Input
                  id="condition"
                  value={patientData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  placeholder="e.g., Acidity, Joint pain, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="digestiveFire">Digestive Fire (Agni)</Label>
                <Select value={patientData.digestiveFire} onValueChange={(value) => handleInputChange('digestiveFire', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agni type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strong">Strong (Tikshna Agni)</SelectItem>
                    <SelectItem value="Moderate">Moderate (Sama Agni)</SelectItem>
                    <SelectItem value="Weak">Weak (Manda Agni)</SelectItem>
                    <SelectItem value="Variable">Variable (Vishama Agni)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mentalState">Mental State</Label>
                <Select value={patientData.mentalState} onValueChange={(value) => handleInputChange('mentalState', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mental state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Calm">Calm (Sattvic)</SelectItem>
                    <SelectItem value="Anxious">Anxious (Rajasic)</SelectItem>
                    <SelectItem value="Irritable">Irritable (Rajasic)</SelectItem>
                    <SelectItem value="Depressed">Depressed (Tamasic)</SelectItem>
                    <SelectItem value="Balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="doctorNotes">Doctor's Notes</Label>
                <Textarea
                  id="doctorNotes"
                  value={patientData.doctorNotes}
                  onChange={(e) => handleInputChange('doctorNotes', e.target.value)}
                  placeholder="Initial assessment, observations, treatment plan..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={patientData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Name and phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referredBy">Referred By</Label>
                  <Input
                    id="referredBy"
                    value={patientData.referredBy}
                    onChange={(e) => handleInputChange('referredBy', e.target.value)}
                    placeholder="Doctor name, clinic, or self"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/patient-management')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={savePatient}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 min-w-32"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Patient
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPatient;