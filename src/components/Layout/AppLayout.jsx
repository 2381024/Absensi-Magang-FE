import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AppLayout.css';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  const toggleMobile = () => setMobileOpen((v) => !v);

  return (
    <div className="app-layout">
      <div
        className={`sidebar-mobile-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <div className={mobileOpen ? 'sidebar-mobile-open-wrapper' : ''}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>
      <div
        className="app-main"
        style={{
          marginLeft: sidebarCollapsed
            ? 'var(--sidebar-collapsed-width)'
            : 'var(--sidebar-width)',
        }}
      >
        <TopBar onMenuClick={toggleMobile} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
