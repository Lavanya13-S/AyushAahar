# AyushAahar - AI-Powered Nutrition Management System

AyushAahar is a comprehensive healthcare application that combines artificial intelligence with nutrition science to provide personalized diet plans, allergy management, and patient monitoring for healthcare providers.

## 🌟 Features

- **Smart Diet Planning**: AI-powered personalized diet recommendations
- **Allergy Management**: Comprehensive allergy tracking and safe food alternatives
- **Patient Dashboard**: Complete patient profile and health monitoring
- **Progress Tracking**: Detailed analytics and progress reports
- **Multi-role Access**: Support for doctors, patients, and administrators
- **Real-time Updates**: Live data synchronization across all platforms

## 🏗️ Architecture

```
AyushAahar/
├── backend/              # Python Flask API
│   ├── datasets/         # JSON data files
│   ├── server.py         # Main Flask application
│   └── requirements.txt  # Python dependencies
├── frontend/             # React.js application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
│   └── package.json      # Node.js dependencies
└── tests/                # Test files
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the Flask server:
```bash
python server.py
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## 📊 API Endpoints

### Patient Management
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID

### Food & Nutrition
- `GET /api/foods` - Get food database
- `GET /api/allergies` - Get allergy mappings

### Diet Planning
- `POST /api/diet-plan` - Generate personalized diet plan

### System
- `GET /api/health` - Health check endpoint

## 🧪 Testing

### Backend Tests
```bash
cd tests
python -m pytest backend_test.py
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Patient Data Tests
```bash
cd tests
python patient_loading_test.py
```

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Data**: JSON-based datasets
- **CORS**: Flask-CORS for cross-origin requests
- **Testing**: pytest

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 Key Components

### Pages
- **Landing Page**: Application introduction and navigation
- **Login/Signup**: User authentication
- **Doctor Dashboard**: Main healthcare provider interface
- **Patient Management**: Patient list and management tools
- **Diet Chart Generator**: AI-powered diet plan creation
- **Reports**: Analytics and progress tracking

### Data Models
- **Patients**: Demographics, allergies, medical conditions
- **Foods**: Nutritional information and allergen data
- **Allergies**: Allergen mappings and safe alternatives

## 🔧 Configuration

### Environment Variables

Backend (`.env`):
```
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///ayushaahar.db
```

Frontend (`.env`):
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VERSION=1.0.0
```

## 🚦 Development Workflow

1. **Start Backend**: Run Flask server on port 5000
2. **Start Frontend**: Run React dev server on port 3000
3. **API Communication**: Frontend communicates with backend via REST API
4. **Data Flow**: React → Axios → Flask → JSON datasets

## 📈 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Machine learning model integration
- [ ] Real-time notifications
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with wearable devices
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

**AyushAahar** - Transforming healthcare through intelligent nutrition management.