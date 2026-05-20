import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AppLayout.css';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  const toggleMobile = () => setMobileOpen((v) => !v);

  // Handler for the sidebar's bottom arrow button:
  // on mobile it closes the sidebar, on desktop it collapses/expands.
  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileOpen(false);
    } else {
      toggleSidebar();
    }
  };

  return (
    <div className="app-layout">
      <div
        className={`sidebar-mobile-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onToggle={handleSidebarToggle}
      />
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
