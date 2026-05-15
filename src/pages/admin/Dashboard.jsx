import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { StatCard } from '../../components/ui/Card';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Users, UserCheck, Clock, CheckCircle, Timer, UserX } from 'lucide-react';
import { formatTime, getStatusLabel } from '../../utils/formatters';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-logs'),
        ]);
        setStats(statsRes.data.data);
        setRecentLogs(logsRes.data.data);
      } catch {
        // ignore
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <PageSpinner />;

  const columns = [
    { key: 'user', label: 'Nama', render: (v) => v?.full_name || '-' },
    { key: 'start_time', label: 'Mulai', render: (v) => formatTime(v) },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge variant={v === 'active' ? 'success' : 'default'} dot>
          {getStatusLabel(v)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard Admin</h1>
        <p>Ringkasan aktivitas hari ini</p>
      </div>

      <div className="stats-grid">
        <StatCard icon={Users} label="Total User" value={stats?.total_users || 0} color="primary" />
        <StatCard icon={UserCheck} label="User Aktif" value={stats?.active_users || 0} color="success" />
        <StatCard icon={Clock} label="Shift Aktif" value={stats?.active_shifts_today || 0} color="warning" />
        <StatCard icon={CheckCircle} label="Shift Selesai" value={stats?.completed_shifts_today || 0} color="info" />
        <StatCard icon={Timer} label="Total Jam Hari Ini" value={stats?.total_work_hours_today || 0} color="primary" />
        <StatCard icon={UserX} label="Tidak Hadir" value={stats?.users_on_leave_today || 0} color="danger" />
      </div>

      <Card padding="none">
        <div style={{ padding: 'var(--space-lg) var(--space-lg) 0' }}>
          <h3>Aktivitas Terbaru Hari Ini</h3>
        </div>
        <div style={{ padding: '0 var(--space-sm) var(--space-sm)' }}>
          <Table columns={columns} data={recentLogs} emptyMessage="Belum ada aktivitas hari ini" />
        </div>
      </Card>
    </div>
  );
}
