import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ui/Toast';
import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import UserDashboard from './pages/user/Dashboard';
import History from './pages/user/History';
import LogDetail from './pages/user/LogDetail';
import Profile from './pages/user/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminGeofence from './pages/admin/Geofence';
import AdminLogs from './pages/admin/Logs';
import AdminLogDetail from './pages/admin/LogDetail';
import AdminConfig from './pages/admin/Config';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ToastContainer />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* User routes */}
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/logs/:id" element={<LogDetail />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/geofence" element={<ProtectedRoute adminOnly><AdminGeofence /></ProtectedRoute>} />
              <Route path="/admin/logs" element={<ProtectedRoute adminOnly><AdminLogs /></ProtectedRoute>} />
              <Route path="/admin/logs/:id" element={<ProtectedRoute adminOnly><AdminLogDetail /></ProtectedRoute>} />
              <Route path="/admin/config" element={<ProtectedRoute adminOnly><AdminConfig /></ProtectedRoute>} />
            </Route>

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
