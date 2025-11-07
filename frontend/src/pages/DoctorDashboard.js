import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Plus, 
  Bell, 
  Settings,
  LogOut,
  Calendar,
  TrendingUp,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Clock,
  Activity
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date('2025-09-22T10:00:00')); // Set to Sept 22, 2025
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    // Update time every second but keep it at Sept 22, 2025
    const timer = setInterval(() => {
      const now = new Date();
      const updatedTime = new Date('2025-09-22T' + now.toTimeString().split(' ')[0]);
      setCurrentTime(updatedTime);
    }, 1000);
    
    loadTodayAppointments();
    
    return () => clearInterval(timer);
  }, []);

  const loadTodayAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments/today`);
      setTodayAppointments(response.data);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Mock data for AI alerts and smart suggestions (can be replaced with real data later)
  const aiAlerts = [
    {
      id: 1,
      type: 'climate',
      message: 'High humidity (85%) detected in Mumbai. Consider adjusting Pitta diet plans.',
      severity: 'medium',
      timestamp: '2025-09-22T09:30:00'
    },
    {
      id: 2,
      type: 'compliance',
      message: 'Patient Arun Singh has low compliance (70%). Schedule follow-up.',
      severity: 'high',
      timestamp: '2025-09-22T08:45:00'
    }
  ];

  const smartSuggestions = [
    {
      id: 1,
      title: 'Seasonal Diet Update',
      description: 'Post-monsoon season adjustments recommended for Kapha patients',
      action: 'Review Guidelines',
      priority: 'medium'
    },
    {
      id: 2,
      title: 'Patient Follow-up',
      description: '3 patients due for progress evaluation this week',
      action: 'View Schedule',
      priority: 'high'
    }
  ];

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const stats = [
    { label: 'Total Patients', value: '247', change: '+12%', icon: Users, color: 'blue' },
    { label: 'Charts Generated', value: '89', change: '+8%', icon: FileText, color: 'green' },
    { label: 'This Month', value: '156', change: '+15%', icon: Calendar, color: 'purple' },
    { label: 'Avg. Compliance', value: '78%', change: '+5%', icon: TrendingUp, color: 'orange' }
  ];

  const getDoshaColor = (dosha) => {
    const colors = {
      'Vata': 'bg-purple-100 text-purple-800',
      'Pitta': 'bg-orange-100 text-orange-800',
      'Kapha': 'bg-green-100 text-green-800',
      'Vata-Pitta': 'bg-gradient-to-r from-purple-100 to-orange-100 text-slate-800',
      'Pitta-Kapha': 'bg-gradient-to-r from-orange-100 to-green-100 text-slate-800',
      'Vata-Kapha': 'bg-gradient-to-r from-purple-100 to-green-100 text-slate-800'
    };
    return colors[dosha] || 'bg-gray-100 text-gray-800';
  };

  const getStatColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AyushAahar Dashboard</h1>
              <p className="text-slate-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  {currentTime.toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {currentTime.toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/generate-diet')}
              className="h-24 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 flex flex-col items-center justify-center space-y-2"
            >
              <Plus className="h-6 w-6" />
              <span>Generate New Chart</span>
            </Button>
            <Button 
              onClick={() => navigate('/patients')}
              variant="outline"
              className="h-24 hover:bg-blue-50 flex flex-col items-center justify-center space-y-2"
            >
              <Users className="h-6 w-6" />
              <span>View Patients</span>
            </Button>
            <Button 
              onClick={() => navigate('/reports')}
              variant="outline"
              className="h-24 hover:bg-purple-50 flex flex-col items-center justify-center space-y-2"
            >
              <BarChart3 className="h-6 w-6" />
              <span>Reports</span>
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              variant="outline"
              className="h-24 hover:bg-orange-50 flex flex-col items-center justify-center space-y-2"
            >
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
          </div>
        </section>

        {/* Stats Overview */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Practice Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-r ${getStatColor(stat.color)} flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Alerts */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">AI Insights & Alerts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      {alert.title}
                    </CardTitle>
                    {alert.location && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {alert.location}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 mb-3">{alert.message}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={alert.severity === 'warning' ? 'destructive' : 'secondary'}>
                      {alert.severity === 'warning' ? 'Action Required' : 'Insight'}
                    </Badge>
                    {alert.trend && (
                      <span className="text-sm font-medium text-green-600">{alert.trend}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Today's Patients & Smart Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Patients */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Today's Patients</h2>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {todayAppointments.length} appointments
              </Badge>
            </div>
            <Card>
              <CardContent className="p-6">
                {!todayAppointments ? (
                  <div className="text-center py-6">
                    <p className="text-slate-500 text-sm mb-2">Loading appointments...</p>
                  </div>
                ) : todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {appointment.patient_name?.split(' ').map(n => n[0]).join('') || 'PT'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{appointment.patient_name}</h3>
                            <p className="text-sm text-slate-600">{appointment.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-800">{formatTime(appointment.appointment_time)}</p>
                          <Badge variant="outline" className="text-xs">
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">No Appointments Today</h3>
                    <p className="text-slate-500 mb-4">September 22, 2025</p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/patient-management')}
                      className="bg-blue-50 hover:bg-blue-100"
                    >
                      Schedule New Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Smart Suggestions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Smart Suggestions</h2>
              <Badge variant="outline" className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Quick Templates
              </Badge>
            </div>
            <div className="space-y-4">
              {smartSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate('/generate-diet', { state: { template: suggestion } })}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-800">{suggestion.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Used {suggestion.usage}</span>
                      <Button size="sm" variant="outline">
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;