import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Camera, MapPin, LogOut, Upload, X, Menu, AlertCircle, CheckCircle, Clock, Users, MessageSquare, TrendingUp, Building2, Home, FileText, Settings } from "lucide-react";

const __firebase_config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAx6WE6LagUS84tQhBRulWlAb2sOx0gwVQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "community-connect-ai-69b9e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "community-connect-ai-69b9e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "community-connect-ai-69b9e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "277390182182",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:277390182182:web:e9dfe699d069af4846a3e7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GR6PT18ES7"
};

const __app_id = "community-connect-ai";
const __initial_auth_token = null;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAx6WE6LagUS84tQhBRulWlAb2sOx0gwVQ";

let app, auth, db, storage;
try {
  app = initializeApp(__firebase_config);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 20.5937,
  lng: 78.9629
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [reports, setReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'infrastructure',
    urgency: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Mock user data
  const user = {
    uid: 'demo-user',
    displayName: 'Demo User',
    photoURL: 'https://via.placeholder.com/40'
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const reportsRef = collection(db, "reports");
      const snapshot = await getDocs(reportsRef);
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);
    } catch (error) {
      console.error("Error loading reports:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedLocation({ lat, lng });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !selectedLocation) return;

    setSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const storageRef = ref(storage, `reports/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const reportData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        location: selectedLocation,
        imageUrl,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      await setDoc(doc(db, "reports", Date.now().toString()), reportData);
      
      setFormData({ title: '', description: '', category: 'infrastructure', urgency: 'medium' });
      setSelectedLocation(null);
      setImageFile(null);
      setImagePreview(null);
      setShowReportForm(false);
      loadReports();
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Community Connect</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'home' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'reports' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Reports
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Analytics
              </button>
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowReportForm(true)}
                className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Report Issue
              </button>
              
              <div className="flex items-center gap-3">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:block text-sm font-medium text-gray-700">{user.displayName}</span>
              </div>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-gray-500"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => { setActiveTab('home'); setShowMobileMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'home' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => { setActiveTab('reports'); setShowMobileMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'reports' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                Reports
              </button>
              <button
                onClick={() => { setActiveTab('analytics'); setShowMobileMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={() => { setShowReportForm(true); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg"
              >
                <Camera className="w-4 h-4" />
                Report Issue
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Community Connect</h2>
              <p className="text-gray-600 mb-6">Help improve your community by reporting local issues and tracking their resolution.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Report Issues</h3>
                  </div>
                  <p className="text-sm text-gray-600">Document problems with photos and location data</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Pinpoint Location</h3>
                  </div>
                  <p className="text-sm text-gray-600">Mark exact locations on interactive maps</p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Track Progress</h3>
                  </div>
                  <p className="text-sm text-gray-600">Monitor resolution status and community impact</p>
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
              <div className="space-y-4">
                {reports.slice(0, 3).map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{report.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {report.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            report.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {report.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      {report.imageUrl && (
                        <img
                          src={report.imageUrl}
                          alt={report.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Reports</h2>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                        <p className="text-gray-600 mt-2">{report.description}</p>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <span className="text-sm text-gray-500">
                            By {report.userName} • {report.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            report.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {report.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      
                      {report.imageUrl && (
                        <img
                          src={report.imageUrl}
                          alt={report.title}
                          className="w-24 h-24 object-cover rounded-lg ml-4"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Reports</p>
                      <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reports.filter(r => r.status === 'resolved').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reports.filter(r => r.status === 'in-progress').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Set(reports.map(r => r.userId)).size}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Report New Issue</h2>
                <button
                  onClick={() => setShowReportForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the issue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Detailed description of the issue"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="infrastructure">Infrastructure</option>
                    <option value="sanitation">Sanitation</option>
                    <option value="security">Security</option>
                    <option value="environment">Environment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Photo
                  </button>
                  {imagePreview && (
                    <div className="flex items-center gap-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedLocation ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm">
                        Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">Click on the map to select location</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 rounded-lg overflow-hidden">
                  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={center}
                      zoom={10}
                      onClick={handleMapClick}
                    >
                      {selectedLocation && (
                        <Marker position={selectedLocation} />
                      )}
                    </GoogleMap>
                  </LoadScript>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedLocation || submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
