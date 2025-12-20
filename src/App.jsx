import React, { useState, useEffect, useRef } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MapPin, Upload, Camera, X, Menu, ChevronDown, LogOut, User, FileText, BarChart3, Settings, Users, AlertCircle, CheckCircle, Clock, TrendingUp, Filter, Search, Download, Edit, Trash2, Eye, Calendar, Map, Home, Phone, Mail, MessageSquare, Star, ArrowUp, ArrowDown, MoreVertical, Shield, Activity, DollarSign, Target, Zap, Award, Bell, HelpCircle, LogIn, Plus, RefreshCw, Save, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Grid, List, Filter as FilterIcon, SortAsc, SortDesc, Send, Briefcase } from 'lucide-react';
import { GoogleMap, LoadScript, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 20.5937,
  lng: 78.9629
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [reports, setReports] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'infrastructure',
    location: { lat: 0, lng: 0 },
    address: '',
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    priority: 'medium',
    estimatedCost: 0,
    assignedTo: '',
    status: 'pending'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    highPriorityReports: 0,
    averageResolutionTime: 0,
    reportsByCategory: {},
    reportsByMonth: {},
    topLocations: [],
    userStats: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('grid');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showWorkerPanel, setShowWorkerPanel] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerFormData, setWorkerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'worker',
    skills: [],
    status: 'active',
    assignedReports: 0,
    completedReports: 0,
    rating: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState([]);
  const [exportData, setExportData] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [reportWorkflow, setReportWorkflow] = useState({
    pending: [],
    inProgress: [],
    resolved: [],
    rejected: []
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { start: null, end: null },
    assignedTo: '',
    reporterEmail: '',
    minCost: 0,
    maxCost: 10000
  });
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotMessages, setChatbotMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [chatbotInput, setChatbotInput] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showPublicPortal, setShowPublicPortal] = useState(false);
  const [showWorkerPortal, setShowWorkerPortal] = useState(false);
  const [showWorkerAuth, setShowWorkerAuth] = useState(false);
  const [workerLoginData, setWorkerLoginData] = useState({ name: '', workType: '', contactNumber: '' });
  const [workerRegisterData, setWorkerRegisterData] = useState({
    name: '',
    workType: '',
    contactNumber: '',
    department: '',
    skills: []
  });
  const [isWorkerRegistering, setIsWorkerRegistering] = useState(false);
  const [authenticatedWorker, setAuthenticatedWorker] = useState(null);
  const [showWorkerReportModal, setShowWorkerReportModal] = useState(false);
  const [workerReportImage, setWorkerReportImage] = useState(null);
  const [workerReportImagePreview, setWorkerReportImagePreview] = useState('');
  const [selectedWorkerReport, setSelectedWorkerReport] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });
  const [authenticatedAdmin, setAuthenticatedAdmin] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showWorkerDirectory, setShowWorkerDirectory] = useState(false);
  const [adminPasswordChange, setAdminPasswordChange] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const mapRef = useRef(null);
  const fileInputRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq0zq5hWdHYhKjqLH7hB0hBKVUQ',
    libraries
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReports();
      fetchAnalytics();
      fetchWorkers();
      fetchNotifications();
      fetchUsers();
      determineUserRole();
      initializeWorkflow();
    }
  }, [user]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const fetchReports = async () => {
    try {
      const reportsCollection = collection(db, 'reports');
      const reportsSnapshot = await getDocs(reportsCollection);
      const reportsList = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsList);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const reportsCollection = collection(db, 'reports');
      const reportsSnapshot = await getDocs(reportsCollection);
      const reportsList = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalReports = reportsList.length;
      const resolvedReports = reportsList.filter(r => r.status === 'resolved').length;
      const pendingReports = reportsList.filter(r => r.status === 'pending').length;
      const inProgressReports = reportsList.filter(r => r.status === 'in-progress').length;
      const highPriorityReports = reportsList.filter(r => r.priority === 'high').length;

      const reportsByCategory = {};
      const reportsByMonth = {};
      const topLocations = {};
      const userStats = {};

      reportsList.forEach(report => {
        reportsByCategory[report.category] = (reportsByCategory[report.category] || 0) + 1;
        
        const month = new Date(report.createdAt?.toDate()).toLocaleString('default', { month: 'short', year: 'numeric' });
        reportsByMonth[month] = (reportsByMonth[month] || 0) + 1;
        
        const locationKey = `${report.address?.substring(0, 20) || 'Unknown'}...`;
        topLocations[locationKey] = (topLocations[locationKey] || 0) + 1;
        
        if (report.userId) {
          userStats[report.userId] = (userStats[report.userId] || 0) + 1;
        }
      });

      const sortedLocations = Object.entries(topLocations)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }));

      const averageResolutionTime = reportsList
        .filter(r => r.status === 'resolved' && r.createdAt && r.resolvedAt)
        .reduce((acc, r) => {
          const days = Math.ceil((r.resolvedAt.toDate() - r.createdAt.toDate()) / (1000 * 60 * 60 * 24));
          return acc + days;
        }, 0) / resolvedReports || 0;

      setAnalytics({
        totalReports,
        resolvedReports,
        pendingReports,
        inProgressReports,
        highPriorityReports,
        averageResolutionTime: Math.round(averageResolutionTime),
        reportsByCategory,
        reportsByMonth,
        topLocations: sortedLocations,
        userStats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const workersCollection = collection(db, 'workers');
      const workersSnapshot = await getDocs(workersCollection);
      const workersList = workersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkers(workersList);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const notificationsCollection = collection(db, 'notifications');
      const notificationsSnapshot = await getDocs(notificationsCollection);
      const notificationsList = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const determineUserRole = async () => {
    if (!user) return;
    
    try {
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        setUserRole(userData.role || 'user');
      } else {
        // Create user document if doesn't exist
        await addDoc(collection(db, 'users'), {
          email: user.email,
          name: user.displayName,
          role: 'user',
          createdAt: new Date()
        });
        setUserRole('user');
      }
    } catch (error) {
      console.error('Error determining user role:', error);
      setUserRole('user');
    }
  };

  const initializeWorkflow = () => {
    const pending = reports.filter(r => r.status === 'pending');
    const inProgress = reports.filter(r => r.status === 'in-progress');
    const resolved = reports.filter(r => r.status === 'resolved');
    const rejected = reports.filter(r => r.status === 'rejected');
    
    setReportWorkflow({
      pending,
      inProgress,
      resolved,
      rejected
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Title', 'Description', 'Category', 'Status', 'Priority', 'Address', 'Reporter', 'Date'],
      ...filteredReports.map(report => [
        report.title,
        report.description,
        report.category,
        report.status,
        report.priority,
        report.address,
        report.userName,
        new Date(report.createdAt?.toDate()).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const assignReportToWorker = async (reportId, workerId) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        assignedTo: workerId,
        status: 'in-progress',
        updatedAt: new Date()
      });
      
      // Update worker's assigned reports count
      const workerRef = doc(db, 'workers', workerId);
      const workerSnapshot = await getDocs(query(collection(db, 'workers'), where('id', '==', workerId)));
      if (!workerSnapshot.empty) {
        const workerData = workerSnapshot.docs[0].data();
        await updateDoc(workerRef, {
          assignedReports: (workerData.assignedReports || 0) + 1
        });
      }
      
      fetchReports();
      fetchWorkers();
      fetchAnalytics();
    } catch (error) {
      console.error('Error assigning report:', error);
    }
  };

  const handleChatbotSubmit = () => {
    if (chatbotInput.trim()) {
      const userMessage = {
        id: chatbotMessages.length + 1,
        text: chatbotInput,
        sender: 'user',
        timestamp: new Date()
      };
      
      setChatbotMessages([...chatbotMessages, userMessage]);
      
      // Simulate AI response
      setTimeout(() => {
        const botResponse = {
          id: chatbotMessages.length + 2,
          text: getBotResponse(chatbotInput),
          sender: 'bot',
          timestamp: new Date()
        };
        setChatbotMessages(prev => [...prev, botResponse]);
      }, 1000);
      
      setChatbotInput('');
    }
  };

  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return 'Hello! How can I help you with Community Connect today?';
    } else if (input.includes('report')) {
      return 'You can submit a report by clicking the "Submit Issue" button in the Public Portal or Home section.';
    } else if (input.includes('status')) {
      return 'You can check the status of your reports in the Reports tab or Worker Portal if you\'re a worker.';
    } else if (input.includes('admin')) {
      return 'Admin features are available to users with admin or manager roles. Contact your system administrator for access.';
    } else if (input.includes('help')) {
      return 'I can help you with: submitting reports, checking status, navigating the portal, and finding information. What do you need help with?';
    } else {
      return 'I understand you need assistance. You can try asking about reports, status, admin features, or navigation. How can I help?';
    }
  };

  const handleWorkerRegister = async (e) => {
    e.preventDefault();
    
    try {
      const workerDoc = {
        name: workerRegisterData.name,
        workType: workerRegisterData.workType,
        contactNumber: workerRegisterData.contactNumber,
        department: workerRegisterData.department,
        skills: workerRegisterData.skills,
        role: 'worker',
        status: 'active',
        createdAt: new Date(),
        assignedReports: 0,
        completedReports: 0,
        rating: 0
      };
      
      await addDoc(collection(db, 'workers'), workerDoc);
      
      // Auto login after registration
      setAuthenticatedWorker(workerDoc);
      setShowWorkerAuth(false);
      setIsWorkerRegistering(false);
      
      // Reset form
      setWorkerRegisterData({
        name: '',
        workType: '',
        contactNumber: '',
        department: '',
        skills: []
      });
    } catch (error) {
      console.error('Error registering worker:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const handleWorkerLogin = async (e) => {
    e.preventDefault();
    
    try {
      const workersSnapshot = await getDocs(query(
        collection(db, 'workers'), 
        where('name', '==', workerLoginData.name),
        where('workType', '==', workerLoginData.workType),
        where('contactNumber', '==', workerLoginData.contactNumber)
      ));
      
      if (workersSnapshot.empty) {
        alert('Worker not found. Please check your details or register.');
        return;
      }
      
      const workerDoc = workersSnapshot.docs[0].data();
      setAuthenticatedWorker({ id: workersSnapshot.docs[0].id, ...workerDoc });
      setShowWorkerAuth(false);
      
      // Reset login form
      setWorkerLoginData({ name: '', workType: '', contactNumber: '' });
    } catch (error) {
      console.error('Error logging in worker:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    try {
      // For demo purposes, using hardcoded admin credentials
      // In production, this should be verified against a secure database
      if (adminLoginData.username === 'srinath' && adminLoginData.password === 'srinath') {
        setAuthenticatedAdmin({ username: adminLoginData.username, role: 'admin' });
        setShowAdminLogin(false);
        setAdminLoginData({ username: '', password: '' });
      } else {
        alert('Invalid admin credentials. Please try again.');
      }
    } catch (error) {
      console.error('Error logging in admin:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleAdminPasswordChange = async (e) => {
    e.preventDefault();
    
    if (adminPasswordChange.newPassword !== adminPasswordChange.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (adminPasswordChange.currentPassword !== 'srinath') {
      alert('Current password is incorrect');
      return;
    }
    
    // In production, this would update the admin password in a secure database
    alert('Password changed successfully! (Note: This is a demo - in production, this would be securely stored)');
    setShowPasswordChangeModal(false);
    setAdminPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDeleteWorker = async (workerId) => {
    if (!window.confirm('Are you sure you want to delete this worker profile?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'workers', workerId));
      fetchWorkers();
      alert('Worker profile deleted successfully');
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert('Failed to delete worker profile');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      fetchReports();
      fetchAnalytics();
      alert('Report deleted successfully');
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  const handleWorkerLogout = () => {
    setAuthenticatedWorker(null);
    setShowWorkerPortal(false);
  };

  const handleWorkerReportAction = async (reportId, action, completionData = null) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      const updateData = {
        status: action,
        assignedTo: authenticatedWorker.name || authenticatedWorker.contactNumber,
        updatedAt: new Date()
      };
      
      if (action === 'resolved' && completionData) {
        updateData.completionNotes = completionData.notes;
        updateData.completionImage = completionData.imageUrl;
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = authenticatedWorker.email;
      }
      
      await updateDoc(reportRef, updateData);
      
      // Update worker stats
      if (action === 'resolved') {
        const workerRef = doc(db, 'workers', authenticatedWorker.id);
        await updateDoc(workerRef, {
          completedReports: (authenticatedWorker.completedReports || 0) + 1
        });
      }
      
      fetchReports();
      fetchAnalytics();
      alert(`Report ${action} successfully!`);
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report. Please try again.');
    }
  };

  const handleWorkerImageUpload = async (file) => {
    if (!file) return null;
    
    try {
      const storageRef = ref(storage, `worker-completions/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading completion image:', error);
      return null;
    }
  };

  const sendNotification = async (userId, message, type = 'info') => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        message,
        type,
        createdAt: new Date(),
        read: false
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      let imageUrl = '';
      if (imageFile) {
        const storageRef = ref(storage, `reports/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const reportData = {
        ...formData,
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        imageUrl,
        createdAt: new Date(),
        status: 'pending',
        priority: formData.priority || 'medium'
      };

      await addDoc(collection(db, 'reports'), reportData);
      
      setFormData({
        title: '',
        description: '',
        category: 'infrastructure',
        location: { lat: 0, lng: 0 },
        address: '',
        reporterName: '',
        reporterEmail: '',
        reporterPhone: '',
        priority: 'medium',
        estimatedCost: 0,
        assignedTo: '',
        status: 'pending'
      });
      setImageFile(null);
      setImagePreview('');
      setShowReportModal(false);
      fetchReports();
      fetchAnalytics();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    if (showLocationPicker) {
      setTempLocation({ lat, lng });
      setFormData(prev => ({
        ...prev,
        location: { lat, lng }
      }));
    }
  };

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'workers'), workerFormData);
      setWorkerFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        role: 'worker',
        skills: [],
        status: 'active',
        assignedReports: 0,
        completedReports: 0,
        rating: 0
      });
      setShowWorkerModal(false);
      fetchWorkers();
    } catch (error) {
      console.error('Error adding worker:', error);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, { 
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'resolved' && { resolvedAt: new Date() })
      });
      fetchReports();
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const deleteReport = async (reportId) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      fetchReports();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const filteredReports = reports
    .filter(report => {
      const matchesSearch = report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = a.createdAt?.toDate() - b.createdAt?.toDate();
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Community Connect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Community Connect</h1>
            <p className="text-gray-600">Your voice matters. Report issues in your community.</p>
          </div>
          
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border-2 border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">Sign in with Google</span>
          </button>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Community Connect</span>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex-1">
              <nav className="flex space-x-1">
                {/* Home */}
                <button
                  onClick={() => { setActiveTab('home'); setShowPublicPortal(false); setShowWorkerPortal(false); setShowWorkerDirectory(false); }}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === 'home' && !showPublicPortal && !showWorkerPortal && !showWorkerDirectory
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Home className="h-4 w-4 inline mr-2" />
                  Home
                </button>
                
                {/* Public Portal - Always Visible */}
                <button
                  onClick={() => { setShowPublicPortal(true); setActiveTab(''); setShowWorkerPortal(false); setShowWorkerDirectory(false); }}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    showPublicPortal 
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg transform scale-105' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-2" />
                  Public Portal
                </button>
                
                {/* Worker Portal - Always Visible */}
                <button
                  onClick={() => {
                    if (!authenticatedWorker) {
                      setShowWorkerAuth(true);
                    } else {
                      setShowWorkerPortal(true);
                    }
                    setActiveTab('');
                    setShowPublicPortal(false);
                    setShowWorkerDirectory(false);
                  }}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    showWorkerPortal 
                      ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg transform scale-105' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Worker Portal
                </button>
                
                {user && (
                  <>
                    <button
                      onClick={() => { setActiveTab('analytics'); setShowPublicPortal(false); setShowWorkerPortal(false); setShowWorkerDirectory(false); }}
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeTab === 'analytics' && !showPublicPortal && !showWorkerPortal && !showWorkerDirectory
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 inline mr-2" />
                      Analytics
                    </button>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              {/* Admin Login */}
              {!authenticatedAdmin && (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Shield className="h-4 w-4 inline mr-2" />
                  Admin
                </button>
              )}
              
              {/* Admin Dashboard */}
              {authenticatedAdmin && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300 bg-gray-700/50 px-3 py-1 rounded-full">Admin: {authenticatedAdmin.username}</span>
                  <button
                    onClick={() => setShowAdminDashboard(true)}
                    className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setAuthenticatedAdmin(null);
                      setShowAdminDashboard(false);
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {/* Worker Directory */}
              <button
                onClick={() => { setShowWorkerDirectory(true); setActiveTab(''); setShowPublicPortal(false); setShowWorkerPortal(false); }}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Users className="h-4 w-4 inline mr-2" />
                Directory
              </button>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                {/* AI Chatbot */}
                <button
                  onClick={() => setShowChatbot(!showChatbot)}
                  className="relative p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                </button>
                
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt?.toDate()).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3 pl-2 border-l border-gray-700">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-300">{user.displayName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="relative">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full border-2 border-gray-600"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-gray-800 border-t border-gray-700">
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => { setActiveTab('home'); setShowMobileMenu(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'home' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Home className="h-4 w-4 inline mr-2" />
                Home
              </button>
              <button
                onClick={() => { setActiveTab('reports'); setShowMobileMenu(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'reports' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Reports
              </button>
              <button
                onClick={() => { setActiveTab('analytics'); setShowMobileMenu(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Analytics
              </button>
            </div>
          </div>
        )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Public Portal */}
        {showPublicPortal && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-4">Public Portal</h1>
              <p className="text-orange-100 mb-6">View community reports and submit issues anonymously</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors duration-200"
                >
                  <Plus className="h-5 w-5 inline mr-2" />
                  Submit Issue
                </button>
                <button
                  onClick={() => {}}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors duration-200"
                >
                  <Eye className="h-5 w-5 inline mr-2" />
                  Browse Reports
                </button>
              </div>
            </div>

            {/* Public Report Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Reports</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalReports}</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Resolved Today</p>
                    <p className="text-2xl font-bold text-green-400">{analytics.resolvedReports}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pending Issues</p>
                    <p className="text-2xl font-bold text-yellow-400">{analytics.pendingReports}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Resolution</p>
                    <p className="text-2xl font-bold text-blue-400">{analytics.averageResolutionTime}d</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Recent Public Reports */}
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Recent Community Reports</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {reports.slice(0, 10).map(report => (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          report.status === 'resolved' ? 'bg-green-500' :
                          report.status === 'in-progress' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        <div>
                          <p className="font-medium text-white">{report.title}</p>
                          <p className="text-sm text-gray-300">{report.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.priority === 'high' ? 'bg-red-100 text-red-700' :
                          report.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {report.priority}
                        </span>
                        <button
                          onClick={() => { setSelectedReport(report); setShowReportDetails(true); }}
                          className="p-1 text-gray-400 hover:text-gray-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Worker Directory */}
        {showWorkerDirectory && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-4">Worker Directory</h1>
              <p className="text-green-100 mb-6">Find skilled workers and their contact information</p>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search workers by name or work type..."
                    className="w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
                <button className="px-6 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200">
                  <Search className="h-5 w-5 inline mr-2" />
                  Search
                </button>
              </div>
            </div>

            {/* Worker Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map(worker => (
                <div key={worker.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{worker.name}</h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-200">
                            {worker.workType || worker.department}
                          </span>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        worker.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-300">
                        <Phone className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm">{worker.contactNumber || worker.phone}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <Briefcase className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm">{worker.department || 'General'}</span>
                      </div>
                      
                      {worker.skills && worker.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {worker.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                              {skill}
                            </span>
                          ))}
                          {worker.skills.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">
                              +{worker.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>Completed: {worker.completedReports || 0}</span>
                          <div className="flex items-center space-x-1">
                            <span>Rating:</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < (worker.rating || 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-600'
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-xs font-medium">{worker.rating || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Contact
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showWorkerPortal && (
          <div className="space-y-6">
            {!authenticatedWorker ? (
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-4">Worker Portal</h1>
                <p className="text-teal-100 mb-6">Please login or register to access worker features</p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setIsWorkerRegistering(false)}
                    className="bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors duration-200"
                  >
                    <LogIn className="h-5 w-5 inline mr-2" />
                    Login
                  </button>
                  <button
                    onClick={() => setIsWorkerRegistering(true)}
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5 inline mr-2" />
                    Register
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">Worker Portal</h1>
                      <p className="text-teal-100 mb-4">Welcome back, {authenticatedWorker.name}!</p>
                      <p className="text-teal-200 text-sm">Department: {authenticatedWorker.department} | Status: {authenticatedWorker.status}</p>
                    </div>
                    <button
                      onClick={handleWorkerLogout}
                      className="bg-white text-teal-600 px-4 py-2 rounded-lg font-semibold hover:bg-teal-50 transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4 inline mr-2" />
                      Logout
                    </button>
                  </div>
                </div>

                {/* Worker Task List */}
                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                  <div className="p-6 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">Available Reports</h2>
                    <p className="text-gray-400 text-sm mt-1">Click on a report to accept and start working</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reports.filter(r => r.status === 'pending' || (r.status === 'in-progress' && r.assignedTo === authenticatedWorker.email)).map(report => (
                        <div key={report.id} className="border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-white">{report.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              report.priority === 'high' ? 'bg-red-900 text-red-200' :
                              report.priority === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                              'bg-green-900 text-green-200'
                            }`}>
                              {report.priority}
                            </span>
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-3">{report.description}</p>
                          
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center text-gray-400">
                              <MapPin className="h-4 w-4 mr-2" />
                              {report.address}
                            </div>
                            <div className="flex items-center text-gray-400">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(report.createdAt?.toDate()).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-gray-400">
                              <User className="h-4 w-4 mr-2" />
                              {report.reporterName}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {report.status === 'pending' && (
                              <button 
                                onClick={() => handleWorkerReportAction(report.id, 'in-progress')}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                              >
                                Accept
                              </button>
                            )}
                            {report.status === 'in-progress' && report.assignedTo === authenticatedWorker.email && (
                              <button 
                                onClick={() => {
                                  setSelectedWorkerReport(report);
                                  setShowWorkerReportModal(true);
                                }}
                                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                              >
                                Complete
                              </button>
                            )}
                            <button className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Worker Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">My Tasks</p>
                        <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'in-progress' && r.assignedTo === authenticatedWorker.email).length}</p>
                      </div>
                      <List className="h-8 w-8 text-teal-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Completed</p>
                        <p className="text-2xl font-bold text-green-400">{authenticatedWorker.completedReports || 0}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Performance</p>
                        <p className="text-2xl font-bold text-blue-400">{authenticatedWorker.rating || 'N/A'}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-4">Welcome to Community Connect</h1>
              <p className="text-blue-100 mb-6">
                Report issues in your community and track their resolution. Your voice matters in making our neighborhood better.
              </p>
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Report an Issue</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-800">{analytics.totalReports}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.resolvedReports}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">{analytics.inProgressReports}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold text-red-600">{analytics.highPriorityReports}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Recent Reports</h2>
              </div>
              <div className="p-6">
                {reports.slice(0, 5).map(report => (
                  <div key={report.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        report.status === 'resolved' ? 'bg-green-500' :
                        report.status === 'in-progress' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{report.title}</p>
                        <p className="text-xs text-gray-500">{report.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.priority === 'high' ? 'bg-red-100 text-red-700' :
                        report.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {report.priority}
                      </span>
                      <button
                        onClick={() => { setSelectedReport(report); setShowReportDetails(true); }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map View */}
            {isLoaded && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Report Locations</h2>
                </div>
                <div className="p-6">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={12}
                    onClick={handleMapClick}
                    onLoad={map => mapRef.current = map}
                  >
                    {reports.map(report => (
                      <Marker
                        key={report.id}
                        position={report.location}
                        onClick={() => { setSelectedReport(report); setShowReportDetails(true); }}
                      />
                    ))}
                  </GoogleMap>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="sanitation">Sanitation</option>
                    <option value="lighting">Lighting</option>
                    <option value="water">Water</option>
                    <option value="traffic">Traffic</option>
                    <option value="other">Other</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { setSortBy('date'); setSortOrder('desc'); }}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      sortBy === 'date' && sortOrder === 'desc'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Latest
                  </button>
                  
                  <button
                    onClick={() => { setSortBy('priority'); setSortOrder('desc'); }}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      sortBy === 'priority' && sortOrder === 'desc'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Priority
                  </button>
                  
                  <div className="flex border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {paginatedReports.map(report => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {report.imageUrl && (
                    <div className="h-48 bg-gray-200">
                      <img
                        src={report.imageUrl}
                        alt={report.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.priority === 'high' ? 'bg-red-100 text-red-700' :
                        report.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {report.priority}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">{report.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        {report.address}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(report.createdAt?.toDate()).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="h-4 w-4 mr-2" />
                        {report.userName}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        report.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {report.status}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => { setSelectedReport(report); setShowReportDetails(true); }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {report.status !== 'resolved' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * reportsPerPage) + 1} to {Math.min(currentPage * reportsPerPage, filteredReports.length)} of {filteredReports.length} reports
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Panel */}
        {showAdminPanel && (userRole === 'admin' || userRole === 'manager') && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-4">Admin Portal</h1>
              <p className="text-purple-100 mb-6">Manage users, reports, and system settings</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowUserManagement(!showUserManagement)}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200"
                >
                  <Users className="h-5 w-5 inline mr-2" />
                  Manage Users
                </button>
                <button
                  onClick={exportToCSV}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200"
                >
                  <Download className="h-5 w-5 inline mr-2" />
                  Export Data
                </button>
              </div>
            </div>

            {/* User Management */}
            {showUserManagement && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                user.role === 'worker' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reports.filter(r => r.userEmail === user.email).length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                              <button className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* System Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Workers</p>
                    <p className="text-2xl font-bold text-gray-800">{workers.filter(w => w.status === 'active').length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Health</p>
                    <p className="text-2xl font-bold text-green-600">Good</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Worker Panel */}
        {showWorkerPanel && (userRole === 'admin' || userRole === 'manager' || userRole === 'worker') && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-4">Worker Management</h1>
              <p className="text-green-100 mb-6">Assign and track work assignments</p>
              <button
                onClick={() => setShowWorkerModal(true)}
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200"
              >
                <Plus className="h-5 w-5 inline mr-2" />
                Add Worker
              </button>
            </div>

            {/* Worker List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Workers</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workers.map(worker => (
                    <div key={worker.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                            <p className="text-sm text-gray-500">{worker.role}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          worker.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {worker.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="text-gray-800">{worker.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned:</span>
                          <span className="text-gray-800">{worker.assignedReports || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="text-gray-800">{worker.completedReports || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <span className="text-gray-800">{worker.rating || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                          Assign Work
                        </button>
                        <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workflow Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Workflow Management</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="border-2 border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Pending</h3>
                    <div className="space-y-2">
                      {reportWorkflow.pending.slice(0, 3).map(report => (
                        <div key={report.id} className="p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium text-gray-800">{report.title}</p>
                          <p className="text-gray-500">{report.category}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-2 border-yellow-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">In Progress</h3>
                    <div className="space-y-2">
                      {reportWorkflow.inProgress.slice(0, 3).map(report => (
                        <div key={report.id} className="p-2 bg-yellow-50 rounded text-sm">
                          <p className="font-medium text-gray-800">{report.title}</p>
                          <p className="text-gray-500">{report.category}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-2 border-green-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Resolved</h3>
                    <div className="space-y-2">
                      {reportWorkflow.resolved.slice(0, 3).map(report => (
                        <div key={report.id} className="p-2 bg-green-50 rounded text-sm">
                          <p className="font-medium text-gray-800">{report.title}</p>
                          <p className="text-gray-500">{report.category}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-2 border-red-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Rejected</h3>
                    <div className="space-y-2">
                      {reportWorkflow.rejected.slice(0, 3).map(report => (
                        <div key={report.id} className="p-2 bg-red-50 rounded text-sm">
                          <p className="font-medium text-gray-800">{report.title}</p>
                          <p className="text-gray-500">{report.category}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Reports</h3>
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{analytics.totalReports}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Resolution Rate</h3>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics.totalReports > 0 ? Math.round((analytics.resolvedReports / analytics.totalReports) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{analytics.resolvedReports} resolved</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Avg Resolution Time</h3>
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{analytics.averageResolutionTime} days</p>
                <p className="text-xs text-gray-500 mt-1">Average time to resolve</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">High Priority</h3>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{analytics.highPriorityReports}</p>
                <p className="text-xs text-gray-500 mt-1">Requires immediate attention</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reports by Category */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports by Category</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.reportsByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / analytics.totalReports) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-800 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Locations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Report Locations</h3>
                <div className="space-y-3">
                  {analytics.topLocations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">{location.location}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(location.count / analytics.totalReports) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-800 w-8">{location.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Report Trends</h3>
              <div className="space-y-3">
                {Object.entries(analytics.reportsByMonth).map(([month, count]) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-64 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(analytics.reportsByMonth))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-gray-600">{analytics.pendingReports}</span>
                  </div>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-yellow-600">{analytics.inProgressReports}</span>
                  </div>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-green-600">{analytics.resolvedReports}</span>
                  </div>
                  <p className="text-sm text-gray-600">Resolved</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Admin Login</h2>
                <button
                  onClick={() => setShowAdminLogin(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={adminLoginData.username}
                  onChange={(e) => setAdminLoginData({ ...adminLoginData, username: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  placeholder="Enter admin username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={adminLoginData.password}
                  onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  placeholder="Enter admin password"
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="px-6 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && authenticatedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
                <button
                  onClick={() => setShowAdminDashboard(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Admin Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowPasswordChangeModal(true)}
                  className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Settings className="h-6 w-6 mb-2" />
                  <p className="font-semibold">Change Password</p>
                </button>
                
                <button
                  onClick={() => {
                    fetchWorkers();
                    fetchReports();
                  }}
                  className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-6 w-6 mb-2" />
                  <p className="font-semibold">Refresh Data</p>
                </button>
              </div>
              
              {/* Worker Management */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Worker Management</h3>
                <div className="space-y-2">
                  {workers.map(worker => (
                    <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-300" />
                        <div>
                          <p className="text-white font-medium">{worker.name}</p>
                          <p className="text-gray-400 text-sm">{worker.workType || worker.department} | {worker.contactNumber || worker.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteWorker(worker.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Report Management */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Report Management</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-300" />
                        <div>
                          <p className="text-white font-medium">{report.title}</p>
                          <p className="text-gray-400 text-sm">{report.status} | {report.priority}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Change Admin Password</h2>
                <button
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAdminPasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  value={adminPasswordChange.currentPassword}
                  onChange={(e) => setAdminPasswordChange({ ...adminPasswordChange, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  required
                  value={adminPasswordChange.newPassword}
                  onChange={(e) => setAdminPasswordChange({ ...adminPasswordChange, newPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={adminPasswordChange.confirmPassword}
                  onChange={(e) => setAdminPasswordChange({ ...adminPasswordChange, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  placeholder="Confirm new password"
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="px-6 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Authentication Modal */}
      {showWorkerAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {isWorkerRegistering ? 'Worker Registration' : 'Worker Login'}
                </h2>
                <button
                  onClick={() => setShowWorkerAuth(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {!isWorkerRegistering ? (
              <form onSubmit={handleWorkerLogin} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={workerLoginData.name}
                    onChange={(e) => setWorkerLoginData({ ...workerLoginData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Work Type</label>
                  <select
                    required
                    value={workerLoginData.workType}
                    onChange={(e) => setWorkerLoginData({ ...workerLoginData, workType: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  >
                    <option value="">Select work type</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="sanitation">Sanitation</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="construction">Construction</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={workerLoginData.contactNumber}
                    onChange={(e) => setWorkerLoginData({ ...workerLoginData, contactNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                    placeholder="+1234567890"
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsWorkerRegistering(true)}
                    className="px-6 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Register
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleWorkerRegister} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={workerRegisterData.name}
                    onChange={(e) => setWorkerRegisterData({ ...workerRegisterData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Work Type</label>
                  <select
                    required
                    value={workerRegisterData.workType}
                    onChange={(e) => setWorkerRegisterData({ ...workerRegisterData, workType: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  >
                    <option value="">Select work type</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="sanitation">Sanitation</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="construction">Construction</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={workerRegisterData.contactNumber}
                    onChange={(e) => setWorkerRegisterData({ ...workerRegisterData, contactNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                    placeholder="+1234567890"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                  <input
                    type="text"
                    required
                    value={workerRegisterData.department}
                    onChange={(e) => setWorkerRegisterData({ ...workerRegisterData, department: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                    placeholder="Maintenance, Sanitation, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={workerRegisterData.skills.join(', ')}
                    onChange={(e) => setWorkerRegisterData({ ...workerRegisterData, skills: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                    placeholder="Plumbing, Electrical, etc."
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsWorkerRegistering(false)}
                    className="px-6 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Register
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Worker Report Completion Modal */}
      {showWorkerReportModal && selectedWorkerReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Complete Report</h2>
                <button
                  onClick={() => setShowWorkerReportModal(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const notes = formData.get('notes');
              
              let imageUrl = null;
              if (workerReportImage) {
                imageUrl = await handleWorkerImageUpload(workerReportImage);
              }
              
              await handleWorkerReportAction(selectedWorkerReport.id, 'resolved', { notes, imageUrl });
              setShowWorkerReportModal(false);
              setSelectedWorkerReport(null);
              setWorkerReportImage(null);
              setWorkerReportImagePreview('');
            }} className="p-6 space-y-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedWorkerReport.title}</h3>
                <p className="text-gray-300 text-sm mb-2">{selectedWorkerReport.description}</p>
                <p className="text-gray-400 text-xs">{selectedWorkerReport.address}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Completion Notes</label>
                <textarea
                  name="notes"
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
                  placeholder="Describe what was done to resolve this issue..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Completion Photo (Optional)</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setWorkerReportImage(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setWorkerReportImagePreview(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="worker-completion-image"
                  />
                  
                  {workerReportImagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={workerReportImagePreview}
                        alt="Completion preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setWorkerReportImage(null);
                          setWorkerReportImagePreview('');
                          document.getElementById('worker-completion-image').value = '';
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 mb-2">Click to upload completion photo</p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('worker-completion-image').click()}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        Choose Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkerReportModal(false);
                    setSelectedWorkerReport(null);
                    setWorkerReportImage(null);
                    setWorkerReportImagePreview('');
                  }}
                  className="px-6 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={() => setShowChatbot(false)}
              className="p-1 hover:bg-green-700 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatbotMessages.map(message => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatbotInput}
                onChange={(e) => setChatbotInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && chatbotInput.trim()) {
                    handleChatbotSubmit();
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleChatbotSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Report an Issue</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of the issue"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="infrastructure">Infrastructure</option>
                    <option value="sanitation">Sanitation</option>
                    <option value="lighting">Lighting</option>
                    <option value="water">Water</option>
                    <option value="traffic">Traffic</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Location address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="ml-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {showLocationPicker ? 'Hide Map' : 'Show Map'}
                  </button>
                </label>
                {showLocationPicker && isLoaded && (
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={formData.location.lat ? formData.location : center}
                      zoom={14}
                      onClick={handleMapClick}
                    >
                      {(formData.location.lat || tempLocation) && (
                        <Marker
                          position={tempLocation || formData.location}
                        />
                      )}
                    </GoogleMap>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          fileInputRef.current.value = '';
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Click to upload photo</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Choose Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Add New Worker</h2>
                <button
                  onClick={() => setShowWorkerModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleWorkerSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={workerFormData.name}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Worker name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={workerFormData.email}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    required
                    value={workerFormData.phone}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    required
                    value={workerFormData.department}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={workerFormData.role}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="worker">Worker</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={workerFormData.status}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                <input
                  type="text"
                  value={workerFormData.skills.join(', ')}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, skills: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Plumbing, Electrical, Carpentry"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showReportDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Report Details</h2>
                <button
                  onClick={() => setShowReportDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedReport.imageUrl && (
                <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={selectedReport.imageUrl}
                    alt={selectedReport.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedReport.title}</h3>
                <p className="text-gray-600">{selectedReport.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="text-gray-800 capitalize">{selectedReport.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Priority</p>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                    selectedReport.priority === 'high' ? 'bg-red-100 text-red-700' :
                    selectedReport.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedReport.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                    selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    selectedReport.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedReport.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reported By</p>
                  <p className="text-gray-800">{selectedReport.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-gray-800">{selectedReport.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="text-gray-800">
                    {new Date(selectedReport.createdAt?.toDate()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                {selectedReport.status !== 'resolved' && (
                  <button
                    onClick={() => {
                      updateReportStatus(selectedReport.id, 'resolved');
                      setShowReportDetails(false);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark as Resolved
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteReport(selectedReport.id);
                    setShowReportDetails(false);
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
