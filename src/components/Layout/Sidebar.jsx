import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  History,
  User,
  Users,
  MapPin,
  FileText,
  Settings,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './Sidebar.css';

const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/history', icon: History, label: 'Riwayat' },
  { to: '/profile', icon: User, label: 'Profil' },
];

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Kelola Akun' },
  { to: '/admin/schedules', icon: CalendarDays, label: 'Jadwal' },
  { to: '/admin/geofence', icon: MapPin, label: 'Geofence' },
  { to: '/admin/logs', icon: FileText, label: 'Kelola Log' },
  { to: '/admin/config', icon: Settings, label: 'Konfigurasi' },
];

export default function Sidebar({ collapsed, mobileOpen, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNav : userNav;

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Clock size={20} />
          </div>
          {!collapsed && <span className="sidebar-logo-text">Absensi Magang</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && (
          <span className="sidebar-section-label">
            {isAdmin ? 'ADMIN' : 'MENU'}
          </span>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            {!collapsed && <span className="sidebar-section-label mt-lg">PERSONAL</span>}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              title={collapsed ? 'Profil' : undefined}
            >
              <User size={20} />
              {!collapsed && <span>Profil</span>}
            </NavLink>
          </>
        )}
      </nav>

      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
