import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  Download,
  Filter,
  Activity,
  Target,
  Clock,
  Award,
  AlertTriangle,
  Heart,
  Zap,
  MapPin
} from 'lucide-react';

const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Mock analytics data
  const kpis = [
    {
      label: 'Charts Generated',
      value: '156',
      change: '+23%',
      trend: 'up',
      period: 'This Month',
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Avg. Compliance',
      value: '78%',
      change: '+5%',
      trend: 'up',
      period: 'Patient Average',
      icon: Target,
      color: 'green'
    },
    {
      label: 'Active Patients',
      value: '247',
      change: '+12%',
      trend: 'up',
      period: 'Currently',
      icon: Users,
      color: 'purple'
    },
    {
      label: 'Success Rate',
      value: '85%',
      change: '+8%',
      trend: 'up',
      period: 'Treatment',
      icon: Award,
      color: 'orange'
    }
  ];

  // Different chart types for unique visualizations
  const treatmentSuccessRate = [
    { category: 'Acidity Treatment', success: 92, total: 45, color: 'from-red-400 to-red-600' },
    { category: 'Weight Management', success: 78, total: 38, color: 'from-blue-400 to-blue-600' },
    { category: 'Joint Pain Relief', success: 85, total: 32, color: 'from-green-400 to-green-600' },
    { category: 'Sleep Disorders', success: 74, total: 28, color: 'from-purple-400 to-purple-600' },
    { category: 'Skin Issues', success: 89, total: 24, color: 'from-orange-400 to-orange-600' },
    { category: 'Diabetes Management', success: 96, total: 18, color: 'from-teal-400 to-teal-600' }
  ];

  const monthlyPatientFlow = [
    { month: 'Jan', newPatients: 12, returning: 35, discharged: 8 },
    { month: 'Feb', newPatients: 18, returning: 42, discharged: 5 },
    { month: 'Mar', newPatients: 22, returning: 38, discharged: 12 },
    { month: 'Apr', newPatients: 16, returning: 45, discharged: 7 },
    { month: 'May', newPatients: 20, returning: 48, discharged: 9 },
    { month: 'Jun', newPatients: 25, returning: 52, discharged: 11 }
  ];

  const ageGroupDistribution = [
    { group: '18-30', count: 68, percentage: 28, health: 'Good', color: 'from-green-400 to-green-600' },
    { group: '31-45', count: 89, percentage: 36, health: 'Moderate', color: 'from-blue-400 to-blue-600' },
    { group: '46-60', count: 72, percentage: 29, health: 'Needs Attention', color: 'from-orange-400 to-orange-600' },
    { group: '60+', count: 18, percentage: 7, health: 'High Care', color: 'from-red-400 to-red-600' }
  ];

  const climateImpactAnalysis = [
    { season: 'Summer', avgTemp: '35°C', commonIssues: 'Pitta Disorders', patientCount: 156, severity: 'High' },
    { season: 'Monsoon', avgTemp: '28°C', commonIssues: 'Kapha Imbalance', patientCount: 134, severity: 'Medium' },
    { season: 'Winter', avgTemp: '18°C', commonIssues: 'Vata Aggravation', patientCount: 142, severity: 'Medium' },
    { season: 'Spring', avgTemp: '25°C', commonIssues: 'Allergies', patientCount: 98, severity: 'Low' }
  ];

  // Animated Radial Progress Component
  const AnimatedRadialProgress = ({ percentage, color, size = 120 }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gradient-${color})`}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-2000 ease-in-out"
          />
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#8b5cf6'} />
              <stop offset="100%" stopColor={color === 'red' ? '#dc2626' : color === 'blue' ? '#2563eb' : color === 'green' ? '#059669' : '#7c3aed'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-800">{percentage}%</span>
        </div>
      </div>
    );
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

  const getSeverityColor = (severity) => {
    const colors = {
      High: 'text-red-600 bg-red-100',
      Medium: 'text-yellow-600 bg-yellow-100',
      Low: 'text-green-600 bg-green-100'
    };
    return colors[severity] || 'text-gray-600 bg-gray-100';
  };

  const exportReport = () => {
    alert('PDF report generation would be implemented here');
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
                onClick={() => navigate('/dashboard')}
                className="text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Practice Analytics</h1>
                <p className="text-slate-600">Comprehensive insights and performance metrics</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="flex space-x-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">
        {/* KPI Cards */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                      <div className="flex items-center mt-1">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {kpi.change}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{kpi.period}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-r ${getStatColor(kpi.color)} flex items-center justify-center`}>
                      <kpi.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Unique Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Treatment Success Rate - Radial Progress Charts */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Treatment Success Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {treatmentSuccessRate.map((treatment, index) => (
                  <div key={index} className="text-center">
                    <AnimatedRadialProgress 
                      percentage={treatment.success} 
                      color={treatment.category.includes('Acidity') ? 'red' : 
                             treatment.category.includes('Weight') ? 'blue' : 
                             treatment.category.includes('Joint') ? 'green' : 'purple'} 
                      size={100}
                    />
                    <h4 className="font-medium text-slate-800 text-sm mt-2">{treatment.category}</h4>
                    <p className="text-xs text-slate-600">{treatment.total} patients</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Age Group Distribution - Horizontal Bar Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patient Age Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ageGroupDistribution.map((group, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700">{group.group} years</span>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${group.health === 'Good' ? 'bg-green-100 text-green-800' : 
                                                    group.health === 'Moderate' ? 'bg-blue-100 text-blue-800' :
                                                    group.health === 'Needs Attention' ? 'bg-orange-100 text-orange-800' : 
                                                    'bg-red-100 text-red-800'}`}>
                          {group.health}
                        </Badge>
                        <span className="text-sm text-slate-600">{group.count}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 bg-gradient-to-r ${group.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${group.percentage}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-slate-500">{group.percentage}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Patient Flow - Stacked Bar Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monthly Patient Flow Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-4 h-48 mb-4">
              {monthlyPatientFlow.map((data, index) => {
                const total = data.newPatients + data.returning + data.discharged;
                const maxTotal = Math.max(...monthlyPatientFlow.map(d => d.newPatients + d.returning + d.discharged));
                const height = (total / maxTotal) * 192;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group cursor-pointer">
                    <div className="relative w-full mb-2">
                      <div 
                        className="w-full rounded-t-lg flex flex-col justify-end overflow-hidden transition-all duration-700 hover:scale-105"
                        style={{ height: `${height}px` }}
                      >
                        <div 
                          className="bg-gradient-to-t from-green-400 to-green-600"
                          style={{ height: `${(data.newPatients / total) * height}px` }}
                        />
                        <div 
                          className="bg-gradient-to-t from-blue-400 to-blue-600"
                          style={{ height: `${(data.returning / total) * height}px` }}
                        />
                        <div 
                          className="bg-gradient-to-t from-red-400 to-red-600"
                          style={{ height: `${(data.discharged / total) * height}px` }}
                        />
                      </div>
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Total: {total}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{data.month}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>New Patients</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Returning</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Discharged</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Climate Impact Analysis */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Seasonal Climate Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {climateImpactAnalysis.map((climate, index) => (
                <div key={index} className="p-4 border-2 border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="text-center mb-3">
                    <h3 className="font-semibold text-slate-800 text-lg">{climate.season}</h3>
                    <p className="text-2xl font-bold text-blue-600">{climate.avgTemp}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Patients:</span>
                      <span className="font-medium text-slate-800">{climate.patientCount}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-600">Common Issues:</span>
                      <p className="font-medium text-slate-800 mt-1">{climate.commonIssues}</p>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-slate-600 text-sm">Severity:</span>
                      <Badge className={`text-xs ${getSeverityColor(climate.severity)}`}>
                        {climate.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Summary */}
        <Card className="shadow-lg border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Generate Comprehensive Report</h3>
                <p className="text-slate-600">Export detailed analytics with all visualizations and insights for this period.</p>
              </div>
              <Button 
                onClick={exportReport}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Full Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;