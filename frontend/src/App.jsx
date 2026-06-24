import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import ContactModal from './components/auth/ContactModal';
import { JobsProvider } from './context/JobsContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { AlertProvider } from './context/AlertContext';

// Pages
import LandingPage from './pages/LandingPage';
import RegisterStudent from './pages/RegisterStudent';
import RegisterClient from './pages/RegisterClient';
import FindJobs from './pages/FindJobs';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import ClientDashboard from './pages/dashboards/ClientDashboard';
import DeliveryDashboard from './pages/dashboards/DeliveryDashboard';

// Layout components
import Navbar from './components/layout/Navbar';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/jobs" element={<FindJobs />} />
      <Route path="/register/student" element={<RegisterStudent />} />
      <Route path="/register/client" element={<RegisterClient />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard/admin/*" element={
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/student/*" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/client/*" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/delivery/*" element={
        <ProtectedRoute allowedRoles={['delivery_staff']}>
          <DeliveryDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppContent = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, isRegisterModalOpen, setIsRegisterModalOpen } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <AppRoutes />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />
      <ContactModal />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AlertProvider>
        <AuthProvider>
          <JobsProvider>
            <NotificationsProvider>
              <AppContent />
            </NotificationsProvider>
          </JobsProvider>
        </AuthProvider>
      </AlertProvider>
    </Router>
  );
}

export default App;
