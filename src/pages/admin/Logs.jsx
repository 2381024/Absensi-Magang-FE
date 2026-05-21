import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { Trash2 } from 'lucide-react';
import { formatDate, formatTime, formatMinutesToHours, getStatusLabel, getMonthName } from '../../utils/formatters';

export default function AdminLogs() {
  const navigate = useNavigate();
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (status) params.status = status;
      if (userId) params.user_id = userId;
      const { data } = await api.get('/logs/all', { params });
      setLogs(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchLogs(); }, [month, year, status, userId]);

  const handleDelete = async (log) => {
    if (!confirm('Hapus log ini?')) return;
    try {
      await api.delete(`/logs/${log.id}`);
      toast.success('Log dihapus');
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menghapus');
    }
  };

  const getUserName = (uid) => {
    const u = users.find((u) => u.id === uid);
    return u ? u.full_name : uid;
  };

  const columns = [
    { key: 'user_id', label: 'User', render: (v) => getUserName(v) },
    { key: 'date', label: 'Tanggal', render: (v) => formatDate(v) },
    { key: 'start_time', label: 'Mulai', render: (v) => formatTime(v) },
    { key: 'end_time', label: 'Selesai', render: (v) => formatTime(v) },
    { key: 'total_work_minutes', label: 'Total', render: (v) => formatMinutesToHours(v) },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={v === 'active' ? 'success' : 'default'} dot>{getStatusLabel(v)}</Badge>,
    },
    {
      key: 'is_late', label: 'Kehadiran',
      render: (v, row) => {
        if (v === true) return <Badge variant="danger">Terlambat</Badge>;
        if (v === false) return <Badge variant="success">Tepat Waktu</Badge>;
        return <span className="text-muted">-</span>;
      },
    },
    {
      key: 'is_early_leave', label: 'Pulang',
      render: (v) => {
        if (v === true) return <Badge variant="warning">Cepat</Badge>;
        if (v === false) return <Badge variant="success">Tepat Waktu</Badge>;
        return <span className="text-muted">-</span>;
      },
    },
    {
      key: 'actions', label: '', width: '50px',
      render: (_, row) => (
        <Button variant="ghost" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); handleDelete(row); }} />
      ),
    },
  ];

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) years.push(y);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Kelola Log Kerja</h1>
        <p>Lihat dan kelola semua log kerja</p>
      </div>

      <div className="flex-gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
        <Select id="log-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
          ))}
        </Select>
        <Select id="log-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select id="log-status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="completed">Selesai</option>
        </Select>
        <Select id="log-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Semua User</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </Select>
      </div>

      {loading ? <PageSpinner /> : (
        <Table columns={columns} data={logs}
          onRowClick={(row) => navigate(`/admin/logs/${row.id}`)}
          emptyMessage="Tidak ada log untuk filter ini" />
      )}
    </div>
  );
}
