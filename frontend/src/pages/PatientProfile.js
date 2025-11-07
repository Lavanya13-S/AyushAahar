import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Calendar, 
  Clock,
  Target,
  Activity,
  FileText,
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Eye,
  CalendarPlus,
  Save,
  Loader2,
  Heart,
  CheckCircle,
  Download,
  Share
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PatientProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [patient, setPatient] = useState(null);
  const [dietCharts, setDietCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointmentData, setAppointmentData] = useState({
    date: '2025-09-22',
    time: '10:00',
    reason: 'Follow-up consultation'
  });

  useEffect(() => {
    loadPatientData();
    loadDietCharts();
  }, [id]);

  const loadPatientData = async () => {
    try {
      const response = await axios.get(`${API}/patients/${id}`);
      setPatient(response.data);
    } catch (err) {
      console.error('Error loading patient:', err);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const loadDietCharts = async () => {
    try {
      const response = await axios.get(`${API}/patients/${id}/diet-charts`);
      setDietCharts(response.data);
    } catch (err) {
      console.error('Error loading diet charts:', err);
    }
  };

  const scheduleAppointment = async () => {
    if (!patient) return;
    
    setAppointmentLoading(true);
    try {
      await axios.post(`${API}/appointments`, {
        patient_id: patient.PatientID,
        patient_name: patient.Name,
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        reason: appointmentData.reason
      });
      
      setError('');
      alert('Appointment scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling appointment:', err);
      setError('Failed to schedule appointment');
    } finally {
      setAppointmentLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!patient) {
      alert('Patient data not loaded yet. Please wait and try again.');
      return;
    }
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AYURVEDA DIET PRESCRIPTION', pageWidth / 2, 20, { align: 'center' });
      
      // Doctor info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Dr. ' + (user?.name || 'Ayurveda Practitioner'), 20, 35);
      pdf.text('AyushAahar Clinic', 20, 42);
      pdf.text('Date: September 22, 2025', 20, 49);
      
      // Patient info
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT DETAILS:', 20, 65);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${patient.Name}`, 20, 75);
      pdf.text(`Age: ${patient.Age} years`, 20, 82);
      pdf.text(`Constitution: ${patient.Constitution}`, 20, 89);
      pdf.text(`Condition: ${patient.Condition}`, 120, 75);
      pdf.text(`City: ${patient.City}`, 120, 82);
      
      // Sample diet recommendations
      pdf.line(20, 95, pageWidth - 20, 95);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DIET RECOMMENDATIONS:', 20, 105);
      
      const recommendations = [
        'Follow regular meal timings',
        'Drink warm water throughout the day',
        'Include seasonal fruits and vegetables',
        'Avoid processed and packaged foods',
        'Practice mindful eating',
        'Regular exercise as per constitution'
      ];
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPos = 115;
      recommendations.forEach((rec, index) => {
        pdf.text(`${index + 1}. ${rec}`, 25, yPos);
        yPos += 8;
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Generated by AyushAahar - Ayurvedic Diet Management System', pageWidth / 2, 280, { align: 'center' });
      
      // Download
      const fileName = `Diet_Chart_${patient.Name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      alert('PDF downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const shareViaEmail = async () => {
    if (!patient) {
      alert('Patient data not loaded yet. Please wait and try again.');
      return;
    }
    
    try {
      const emailSubject = `Diet Chart Prescription - ${patient.Name}`;
      const emailBody = `Dear ${patient.Name},

Please find your personalized Ayurvedic diet chart below:

PATIENT DETAILS:
- Name: ${patient.Name}
- Age: ${patient.Age} years
- Constitution: ${patient.Constitution}
- Condition: ${patient.Condition}
- City: ${patient.City}

DIETARY RECOMMENDATIONS:
1. Follow regular meal timings
2. Drink warm water throughout the day
3. Include seasonal fruits and vegetables
4. Avoid processed and packaged foods
5. Practice mindful eating
6. Regular exercise as per constitution

Best regards,
Dr. ${user?.name || 'Ayurveda Practitioner'}
AyushAahar Clinic

Generated on: September 22, 2025`;

      const mailtoUrl = `mailto:${patient.Name.toLowerCase().replace(' ', '.')}@email.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl);
      
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Failed to share via email. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Patient Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Mock dosha balance for demonstration
  const doshaBalance = {
    Vata: patient.Constitution.includes('Vata') ? 35 : 20,
    Pitta: patient.Constitution.includes('Pitta') ? 45 : 25,
    Kapha: patient.Constitution.includes('Kapha') ? 30 : 25
  };

  // Fixed progress data with Week 7 visible
  const progressData = {
    compliance: [
      { period: 'Week 1', value: 65 },
      { period: 'Week 2', value: 72 },
      { period: 'Week 3', value: 78 },
      { period: 'Week 4', value: 85 },
      { period: 'Week 5', value: 88 },
      { period: 'Week 6', value: 92 },
      { period: 'Week 7', value: 85 },
      { period: 'Week 8', value: 90 }
    ]
  };

  const DOSHA_COLORS = ['#8B5CF6', '#EC4899', '#F59E0B'];

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Patient Profile</h1>
                <p className="text-purple-100">Comprehensive health overview and management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-7xl">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Patient Summary Card */}
        <Card className="mb-8 shadow-2xl bg-white/95 backdrop-blur-sm border-0">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Patient Info */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {patient.Name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">{patient.Name}</h2>
                  <p className="text-slate-600 text-lg">{patient.Age} years • {patient.Gender}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">{patient.City}</span>
                  </div>
                </div>
              </div>

              {/* Constitution & Status */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Constitution (Prakriti)</label>
                  <div className="mt-1">
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 text-lg">
                      {patient.Constitution}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Current Condition</label>
                  <p className="text-slate-800 font-medium text-lg">{patient.Condition}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <Badge variant={patient.Status === 'Active' ? 'default' : 'secondary'}>
                      {patient.Status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                  <div className="text-emerald-600 text-sm font-medium">Compliance Rate</div>
                  <div className="text-2xl font-bold text-emerald-800">{patient.Compliance}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="text-blue-600 text-sm font-medium">Diet Charts</div>
                  <div className="text-2xl font-bold text-blue-800">{patient.Charts}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="text-purple-600 text-sm font-medium">Last Visit</div>
                  <div className="text-sm font-bold text-purple-800">{patient.LastVisit}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <div className="text-orange-600 text-sm font-medium">Allergies</div>
                  <div className="text-sm font-bold text-orange-800">{patient.Allergies?.length || 0}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/20 backdrop-blur-sm p-1 rounded-lg">
          {['overview', 'charts', 'appointment'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 capitalize ${
                activeTab === tab
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {tab === 'charts' ? 'Previous Charts' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dosha Wheel */}
            <Card className="shadow-xl bg-white/95 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Dosha Balance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-64 h-64 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={Object.entries(doshaBalance).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {Object.entries(doshaBalance).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DOSHA_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {Object.entries(doshaBalance).map(([dosha, percentage], index) => (
                    <div key={dosha} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: DOSHA_COLORS[index] }}
                      />
                      <span className="text-sm font-medium">{dosha}: {percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Health Progress Charts */}
            <Card className="shadow-xl bg-white/95 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Health Progress Trends (Including Week 7)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData.compliance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="period" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'charts' && (
          <Card className="shadow-xl bg-white/95 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Previous Diet Charts ({dietCharts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dietCharts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dietCharts.map((chart, index) => (
                    <div key={chart.id || index} className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-800">Diet Chart #{index + 1}</h3>
                          <p className="text-sm text-slate-600">
                            {new Date(chart.created_at || chart.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {chart.chart_data?.total_daily_calories || chart.calories || 0} cal
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={downloadPDF}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={shareViaEmail}
                          className="flex-1"
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">No Diet Charts Yet</h3>
                  <p className="text-slate-500 mb-6">Generate the first diet chart for this patient</p>
                  <Button 
                    onClick={() => navigate(`/diet-chart-generator?patientId=${patient.PatientID}`)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Diet Chart
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'appointment' && (
          <Card className="shadow-xl bg-white/95 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                Schedule Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Appointment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={appointmentData.date}
                    onChange={(e) => setAppointmentData(prev => ({...prev, date: e.target.value}))}
                    min="2025-09-22"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Appointment Time (Alarm Style)</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={appointmentData.time.split(':')[0]} 
                      onValueChange={(hour) => {
                        const currentMinute = appointmentData.time.split(':')[1] || '00';
                        setAppointmentData(prev => ({...prev, time: `${hour}:${currentMinute}`}));
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="Hr" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 12}, (_, i) => {
                          const hour = (9 + i).toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <span className="flex items-center text-lg font-medium">:</span>
                    <Select 
                      value={appointmentData.time.split(':')[1] || '00'} 
                      onValueChange={(minute) => {
                        const currentHour = appointmentData.time.split(':')[0] || '09';
                        setAppointmentData(prev => ({...prev, time: `${currentHour}:${minute}`}));
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {['00', '15', '30', '45'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-slate-500">Available: 9:00 AM - 8:00 PM</p>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Select 
                    value={appointmentData.reason} 
                    onValueChange={(value) => setAppointmentData(prev => ({...prev, reason: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Follow-up consultation">Follow-up consultation</SelectItem>
                      <SelectItem value="Diet chart review">Diet chart review</SelectItem>
                      <SelectItem value="New symptoms">New symptoms</SelectItem>
                      <SelectItem value="Progress evaluation">Progress evaluation</SelectItem>
                      <SelectItem value="Routine checkup">Routine checkup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={scheduleAppointment}
                disabled={appointmentLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              >
                {appointmentLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Schedule Appointment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button 
            onClick={() => navigate(`/diet-chart-generator?patientId=${patient.PatientID}`)}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 h-16"
          >
            <Plus className="h-5 w-5 mr-2" />
            Generate New Diet Chart
          </Button>
          
          <Button 
            variant="outline" 
            onClick={downloadPDF}
            className="border-white/20 text-white hover:bg-white/10 h-16"
          >
            <Download className="h-5 w-5 mr-2" />
            Download PDF
          </Button>
          
          <Button 
            variant="outline" 
            onClick={shareViaEmail}
            className="border-white/20 text-white hover:bg-white/10 h-16"
          >
            <Share className="h-5 w-5 mr-2" />
            Share via Email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;