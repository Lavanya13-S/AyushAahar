import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ArrowLeft,
  MapPin,
  Calendar,
  Activity,
  FileText,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PatientManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDosha, setFilterDosha] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      console.log('Loading patients from:', `${API}/patients`);
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API}/patients`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Patients response:', response.data);
      console.log('Response status:', response.status);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array of patients');
      }
      
      if (response.data.length === 0) {
        setError('No patients found in the system');
        setPatients([]);
        return;
      }
      
      // Transform backend data to match frontend expectations
      const transformedPatients = response.data.map((patient, index) => {
        console.log(`Transforming patient ${index + 1}:`, patient);
        
        return {
          id: patient.PatientID || `UNKNOWN_${index}`,
          name: patient.Name || 'Unknown Patient',
          age: patient.Age || 0,
          gender: patient.Gender || 'Unknown',
          prakriti: patient.Constitution || 'Not assessed',
          vikriti: patient.Constitution || 'Not assessed', // Using same as prakriti for now
          location: patient.City || 'Unknown',
          phone: patient.Phone || '+91 9876543210', // Use actual phone if available
          email: patient.Email || `${(patient.Name || 'patient').toLowerCase().replace(' ', '.')}@email.com`,
          lastVisit: patient.LastVisit || '2025-09-22',
          condition: patient.Condition || 'General consultation',
          charts: patient.Charts || 0,
          compliance: typeof patient.Compliance === 'string' ? 
                     parseInt(patient.Compliance.replace('%', '')) : 
                     patient.Compliance || 0,
          status: patient.Status ? patient.Status.toLowerCase() : 'active'
        };
      });
      
      console.log('Transformed patients:', transformedPatients);
      setPatients(transformedPatients);
      setError('');
      
    } catch (err) {
      console.error('Error loading patients:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: `${API}/patients`
      });
      
      let errorMessage = 'Failed to load patients';
      if (err.response?.status === 404) {
        errorMessage = 'Patients API endpoint not found';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error while loading patients';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - please check your connection';
      } else if (err.message) {
        errorMessage = `Failed to load patients: ${err.message}`;
      }
      
      setError(errorMessage);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const conditions = ['All', 'Acidity', 'Joint Pain', 'Weight Management', 'Insomnia', 'Skin Issues', 'Diabetes'];
  const doshaTypes = ['All', 'Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'];

  // Filter patients based on search and filters
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDosha = filterDosha === 'all' || patient.prakriti === filterDosha;
    const matchesCondition = filterCondition === 'all' || patient.condition === filterCondition;
    
    return matchesSearch && matchesDosha && matchesCondition;
  });

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

  const getComplianceColor = (compliance) => {
    if (compliance >= 90) return 'text-green-600';
    if (compliance >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge variant="outline" className="text-slate-600">Inactive</Badge>;
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
                <h1 className="text-2xl font-bold text-slate-800">Patient Management</h1>
                <p className="text-slate-600">Manage your patient records and health data</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/add-patient')}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Patient
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">Loading patients...</span>
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Search & Filter Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, condition, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filterDosha} onValueChange={setFilterDosha}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Dosha" />
                    </SelectTrigger>
                    <SelectContent>
                      {doshaTypes.map(dosha => (
                        <SelectItem key={dosha} value={dosha.toLowerCase()}>
                          {dosha}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterCondition} onValueChange={setFilterCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map(condition => (
                        <SelectItem key={condition} value={condition.toLowerCase()}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Patient Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{patients.length}</div>
                  <div className="text-sm text-slate-600">Total Patients</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {patients.filter(p => p.status === 'active').length}
                  </div>
                  <div className="text-sm text-slate-600">Active Patients</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {patients.length > 0 ? Math.round(patients.reduce((sum, p) => sum + p.compliance, 0) / patients.length) : 0}%
                  </div>
                  <div className="text-sm text-slate-600">Avg. Compliance</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {patients.reduce((sum, p) => sum + p.charts, 0)}
                  </div>
                  <div className="text-sm text-slate-600">Total Charts</div>
                </CardContent>
              </Card>
            </div>

            {/* Patient List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Patients ({filteredPatients.length})
                  </div>
                  {filteredPatients.length !== patients.length && (
                    <Badge variant="outline">
                      Filtered from {patients.length} total
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {filteredPatients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/patient/${patient.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="h-12 w-12 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800">{patient.name}</h3>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span>{patient.age} years • {patient.gender}</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {patient.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-16">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Constitution</p>
                              <Badge className={`text-xs ${getDoshaColor(patient.prakriti)}`}>
                                {patient.prakriti}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Condition</p>
                              <p className="text-sm font-medium text-slate-800">{patient.condition}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Compliance</p>
                              <p className={`text-sm font-semibold ${getComplianceColor(patient.compliance)}`}>
                                {patient.compliance}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Last Visit</p>
                              <p className="text-sm text-slate-600 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(patient.lastVisit).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          {getStatusBadge(patient.status)}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <FileText className="h-4 w-4" />
                            <span>{patient.charts} charts</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Phone className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Activity className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredPatients.length === 0 && (
                  <div className="p-12 text-center">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No patients found</h3>
                    <p className="text-slate-600 mb-4">
                      {searchTerm || filterDosha !== 'all' || filterCondition !== 'all' 
                        ? 'Try adjusting your search or filter criteria.' 
                        : 'Start by adding your first patient.'}
                    </p>
                    <Button 
                      onClick={() => navigate('/add-patient')}
                      className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Patient
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientManagement;