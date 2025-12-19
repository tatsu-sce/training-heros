import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageLoader from './components/layout/PageLoader';
import './App.css';

// Layouts and Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const EquipmentSession = lazy(() => import('./pages/EquipmentSession'));
const QrCodes = lazy(() => import('./pages/QrCodes'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Page Transition Component
const PageTransition = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only show loader if logged in (to animate avatar)
    if (user) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [location, user]);

  // Don't show loader on Login page usually, but user asked for "each page transition".
  // If we are on login, maybe we don't have avatar data.
  // Let's hide it if not user.
  if (!loading || !user) return null;

  return <PageLoader />;
};

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <PageTransition />
          <div className="app-container">
            <Suspense fallback={<div className="loading-screen">Loading UniFit...</div>}>
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/onboarding" element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                } />
                <Route path="/workout" element={
                  <ProtectedRoute>
                    <EquipmentSession />
                  </ProtectedRoute>
                } />
                <Route path="/qr-codes" element={<QrCodes />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
