import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu, User } from 'lucide-react';
import Badge from '../ui/Badge';
import { getRoleLabel } from '../../utils/formatters';
import './TopBar.css';

export default function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Menu">
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
        <div className="topbar-user">
          <div className="topbar-avatar">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.full_name}</span>
            <Badge variant={user?.role === 'admin' ? 'primary' : 'default'} size="sm">
              {getRoleLabel(user?.role)}
            </Badge>
          </div>
        </div>
        <button className="topbar-logout" onClick={logout} title="Keluar">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
