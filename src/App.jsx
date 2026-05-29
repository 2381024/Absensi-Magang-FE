import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ui/Toast';
import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { PageSpinner } from './components/ui/Spinner';

// Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/Login'));
const UserDashboard = lazy(() => import('./pages/user/Dashboard'));
const History = lazy(() => import('./pages/user/History'));
const LogDetail = lazy(() => import('./pages/user/LogDetail'));
const Profile = lazy(() => import('./pages/user/Profile'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminSchedules = lazy(() => import('./pages/admin/Schedules'));
const AdminGeofence = lazy(() => import('./pages/admin/Geofence'));
const AdminLogs = lazy(() => import('./pages/admin/Logs'));
const AdminLogDetail = lazy(() => import('./pages/admin/LogDetail'));
const AdminConfig = lazy(() => import('./pages/admin/Config'));

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
}

function UserRoute({ children }) {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ToastContainer />
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected Layout */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                {/* User routes */}
                <Route path="/dashboard" element={<ProtectedRoute><UserRoute><UserDashboard /></UserRoute></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><UserRoute><History /></UserRoute></ProtectedRoute>} />
                <Route path="/logs/:id" element={<ProtectedRoute><UserRoute><LogDetail /></UserRoute></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/schedules" element={<ProtectedRoute adminOnly><AdminSchedules /></ProtectedRoute>} />
                <Route path="/admin/geofence" element={<ProtectedRoute adminOnly><AdminGeofence /></ProtectedRoute>} />
                <Route path="/admin/logs" element={<ProtectedRoute adminOnly><AdminLogs /></ProtectedRoute>} />
                <Route path="/admin/logs/:id" element={<ProtectedRoute adminOnly><AdminLogDetail /></ProtectedRoute>} />
                <Route path="/admin/config" element={<ProtectedRoute adminOnly><AdminConfig /></ProtectedRoute>} />
              </Route>

              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
