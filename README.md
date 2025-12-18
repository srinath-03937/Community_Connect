# Community Connect AI

A futuristic hub for community issue reporting and worker management, powered by AI.

## Features

### 🏠 Public Portal (Residents)
- **GPS Geolocation**: Automatic location tracking for issue reporting
- **Issue Reporting**: Submit community issues with title, description, and GPS coordinates
- **My Reports**: Track all your submitted issues and their status
- **AI Alert Summarization**: Get concise AI-generated summaries of community alerts using Google Gemini

### 🔧 Worker Portal (Maintenance)
- **Worker Profile Management**: Create and manage your business profile
- **Google Maps Visualization**: Interactive map showing all open and in-progress issues with markers
- **Job Queue**: View and manage all active community issues
- **AI Triage & Planning**: Get AI-powered priority assessment, time estimates, and 3-step resolution plans
- **Status Management**: Update issue status (Open → In Progress → Closed)

### 📋 Directory Portal
- **Worker Directory**: Browse all registered maintenance workers
- **AI Review Generation**: Generate professional reviews using AI

### 💬 AI Chat Assistant
- **Conversational AI**: Ask questions about the app and get helpful responses
- **Context-Aware**: Understands the Community Connect AI ecosystem

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS (Dark mode with glassmorphism effects)
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore & Authentication)
- **AI**: Google Gemini API (gemini-2.0-flash-exp)
- **Maps**: Google Maps JavaScript API
- **Build Tool**: Vite

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Open `src/App.jsx` and replace the placeholder values:

#### Firebase Configuration
Replace the `__firebase_config` object with your Firebase project credentials:

```javascript
const __firebase_config = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**To get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings → General
4. Scroll to "Your apps" and click the web icon (</>)
5. Copy the configuration object

**Enable Firestore:**
1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Start in production mode or test mode
4. Choose a location

**Enable Authentication:**
1. Go to Authentication → Sign-in method
2. Enable "Anonymous" authentication

#### Google Gemini API Key
Replace `GEMINI_API_KEY`:

```javascript
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
```

**To get Gemini API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key

#### Google Maps API Key
Replace `GOOGLE_MAPS_API_KEY`:

```javascript
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
```

**To get Google Maps API key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Maps JavaScript API"
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key
6. (Recommended) Restrict the key to Maps JavaScript API

### 3. Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Firestore Database Structure

The app uses the following collections:

### `issues`
```javascript
{
  title: string,
  description: string,
  posterId: string,
  status: 'Open' | 'In Progress' | 'Closed',
  timestamp: timestamp,
  location: { lat: number, lng: number },
  aiTriage: {
    priority: string,
    estimated_man_hours: number,
    three_step_resolution_plan: string[]
  }
}
```

### `workers`
```javascript
{
  businessName: string,
  serviceType: string,
  contact: string,
  userId: string,
  createdAt: timestamp
}
```

### `reviews`
```javascript
{
  workerId: string,
  workerName: string,
  reviewText: string,
  rating: number,
  timestamp: timestamp,
  aiGenerated: boolean
}
```

## Firestore Security Rules

Add these rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /issues/{issueId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    match /workers/{workerId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == workerId;
      allow update: if request.auth != null && request.auth.uid == workerId;
      allow delete: if request.auth != null && request.auth.uid == workerId;
    }
    
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

## Features Walkthrough

### For Residents

1. **Landing Page**: Click "Enter Public Portal"
2. **Grant Location Access**: Allow browser to access your location
3. **Report Issue**: Fill in title and description, submit
4. **View Reports**: See all your submitted issues and their status
5. **AI Alerts**: Click "AI Summarize" on alerts for concise summaries

### For Workers

1. **Landing Page**: Click "Access Job Queue" or "Setup Profile"
2. **Create Profile**: Enter business name, service type, and contact info
3. **View Map**: See all issues plotted on Google Maps
4. **AI Triage**: Click "AI Triage & Plan" to get AI analysis
5. **Manage Jobs**: Update status from Open → In Progress → Closed

### Additional Features

- **Worker Directory**: Browse all registered workers and generate AI reviews
- **AI Chat**: Ask questions about the app or community issues

## Visual Theme

- **Mode**: Dark Mode with High-Tech aesthetic
- **Colors**:
  - Slate (backgrounds): `#0f172a`, `#1e293b`
  - Teal (success/accents): `#14b8a6`
  - Indigo (primary): `#6366f1`
  - Rose (alerts): `#f43f5e`
- **Effects**: Glassmorphism with backdrop blur, rounded corners, subtle borders

## Troubleshooting

### Location Not Working
- Ensure you're using HTTPS or localhost
- Check browser permissions for location access
- The app will use default coordinates if GPS is denied

### Firebase Errors
- Verify all API keys are correct
- Check Firestore security rules
- Ensure Anonymous authentication is enabled

### Google Maps Not Loading
- Verify Maps JavaScript API is enabled
- Check API key restrictions
- Ensure billing is enabled on Google Cloud project

### Gemini API Errors
- Verify API key is valid
- Check API quota limits
- Ensure you're using the correct model name

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
