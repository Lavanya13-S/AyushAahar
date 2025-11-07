import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Stethoscope, 
  Users, 
  BarChart3, 
  Shield, 
  ArrowRight,
  Thermometer,
  Leaf,
  Brain,
  Heart,
  Clock,
  Award,
  BookOpen,
  Activity,
  MapPin
} from 'lucide-react';

const ayurvedicFacts = [
  "Ayurveda recognizes 6 tastes (Rasa): Sweet, Sour, Salty, Pungent, Bitter, and Astringent.",
  "The three doshas - Vata, Pitta, and Kapha - govern all physiological functions in the body.",
  "According to Ayurveda, eating according to your climate helps maintain perfect health balance.",
  "Agni (digestive fire) is considered the cornerstone of health in Ayurvedic medicine.",
  "Ayurveda emphasizes prevention over cure through lifestyle and dietary modifications."
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentFact, setCurrentFact] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentFact((prev) => (prev + 1) % ayurvedicFacts.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Prevent any unwanted focus and cursor issues
  useEffect(() => {
    // Remove focus from any element that might have it
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    
    // Prevent any element from getting focus unless it's an input
    const preventFocus = (e) => {
      if (e.target.tagName !== 'INPUT' && 
          e.target.tagName !== 'TEXTAREA' && 
          e.target.tagName !== 'BUTTON' && 
          e.target.tagName !== 'A' &&
          !e.target.hasAttribute('contenteditable')) {
        e.target.blur();
      }
    };
    
    document.addEventListener('focusin', preventFocus);
    
    return () => {
      document.removeEventListener('focusin', preventFocus);
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AyushAahar</h1>
              <p className="text-xs text-slate-600">Intelligent Ayurvedic Solutions</p>
            </div>
          </div>
          <div className="space-x-3">
            <Button variant="outline" onClick={handleGetStarted} className="hover:bg-slate-50">
              Doctor Login
            </Button>
            <Button onClick={handleSignUp} className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
              Register Practice
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6 border-emerald-200 text-emerald-700 bg-emerald-50">
            Trusted by 500+ Ayurvedic Practitioners
          </Badge>
          
          <h1 className="text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Professional Ayurvedic
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent block">
              Diet Chart Generator
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Generate evidence-based Ayurvedic diet charts with intelligent climate adaptation. 
            Streamline your practice with automated nutritional analysis and traditional wisdom integration.
          </p>
          
          <div className="flex justify-center gap-4 mb-12">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 px-8 py-4 text-lg"
            >
              Access Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg hover:bg-slate-50"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Documentation
            </Button>
          </div>

          {/* Demo Animation */}
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 shadow-lg max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Clinical Workflow</h3>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center space-y-2">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Patient Assessment</span>
              </div>
              
              <ArrowRight className="h-6 w-6 text-slate-400" />
              
              <div className="flex flex-col items-center space-y-2">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Climate Analysis</span>
              </div>
              
              <ArrowRight className="h-6 w-6 text-slate-400" />
              
              <div className="flex flex-col items-center space-y-2">
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Personalized Chart</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Clinical-Grade Ayurvedic Practice Tools
          </h2>
          <p className="text-xl text-slate-600">
            Professional features designed for modern Ayurvedic practitioners
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Thermometer className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">Geo-Ayurvedic Engine</CardTitle>
              <CardDescription className="text-slate-600">
                Climate-adapted diet recommendations based on real-time weather data and seasonal Ayurvedic principles.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">Patient Records Management</CardTitle>
              <CardDescription className="text-slate-600">
                Complete patient profiles with dosha analysis, health tracking, and comprehensive treatment history.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">Practice Analytics</CardTitle>
              <CardDescription className="text-slate-600">
                Comprehensive practice insights, patient outcomes, and treatment effectiveness analysis.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">Rapid Chart Generation</CardTitle>
              <CardDescription className="text-slate-600">
                Generate comprehensive diet charts in under 2 minutes with detailed nutritional and Ayurvedic analysis.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">Medical Data Security</CardTitle>
              <CardDescription className="text-slate-600">
                HIPAA-compliant data handling with encrypted storage, secure authentication, and audit trails.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">Evidence-Based Protocols</CardTitle>
              <CardDescription className="text-slate-600">
                Recommendations based on classical Ayurvedic texts, modern nutritional science, and clinical outcomes.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Ayurvedic Fact of the Day */}
      <section className="container mx-auto px-6 py-16">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-50 to-blue-50 border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="h-12 w-12 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl text-slate-800">Daily Ayurvedic Insight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-center transition-all duration-300 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
              <p className="text-lg text-slate-700 italic leading-relaxed">
                "{ayurvedicFacts[currentFact]}"
              </p>
              <div className="flex justify-center mt-6 space-x-2">
                {ayurvedicFacts.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                      index === currentFact ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Professional CTA */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Enhance Your Ayurvedic Practice
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join the network of Ayurvedic practitioners modernizing patient care with intelligent tools.
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={handleSignUp}
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Register Your Practice
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Clinical Guide
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800">AyushAahar</span>
              <p className="text-xs text-slate-600">&copy; 2025 Professional Ayurvedic Solutions</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Integrating ancient wisdom with modern technology
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;