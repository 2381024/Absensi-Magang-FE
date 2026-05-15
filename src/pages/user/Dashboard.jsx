import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import useGeolocation from '../../hooks/useGeolocation';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import {
  Play,
  Square,
  Clock,
  MapPin,
  Plus,
  Send,
  Calendar,
  Timer,
  Coffee,
  CheckCircle,
  FileText,
} from 'lucide-react';
import {
  formatTime,
  formatDate,
  formatMinutesToHours,
  getElapsedMinutes,
  getStatusLabel,
  getMonthName,
} from '../../utils/formatters';
import './Dashboard.css';

export default function UserDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const geo = useGeolocation();
  const [todayLog, setTodayLog] = useState(undefined); // undefined = loading
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [entryContent, setEntryContent] = useState('');
  const [description, setDescription] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fetchToday = useCallback(async () => {
    try {
      const { data } = await api.get('/logs/today');
      setTodayLog(data.data);
      if (data.data?.status === 'active') {
        // Fetch entries
        const entriesRes = await api.get(`/logs/${data.data.id}/entries`);
        setEntries(entriesRes.data.data);
      }
    } catch {
      setTodayLog(null);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/logs/summary', {
        params: { month: currentMonth, year: currentYear },
      });
      setSummary(data.data);
    } catch {
      // ignore
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchToday(), fetchSummary()]);
      setLoading(false);
    };
    init();
  }, [fetchToday, fetchSummary]);

  // Elapsed timer
  useEffect(() => {
    if (todayLog?.status === 'active') {
      setElapsed(getElapsedMinutes(todayLog.start_time));
      const interval = setInterval(() => {
        setElapsed(getElapsedMinutes(todayLog.start_time));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [todayLog]);

  const handleStartShift = async () => {
    setActionLoading(true);
    try {
      let body = {};
      // Try to get location
      try {
        const pos = await geo.getCurrentPosition();
        body = { latitude: pos.latitude, longitude: pos.longitude };
      } catch {
        // Location might not be required if no geofence is active — send empty body
      }

      await api.post('/logs/start', body);
      toast.success('Shift berhasil dimulai!');
      await fetchToday();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Gagal memulai shift';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!todayLog) return;
    setActionLoading(true);
    try {
      let body = { description };
      if (todayLog.geofence_passed) {
        try {
          const pos = await geo.getCurrentPosition();
          body.end_latitude = pos.latitude;
          body.end_longitude = pos.longitude;
        } catch {
          toast.error('Gagal mendapatkan lokasi untuk mengakhiri shift');
          setActionLoading(false);
          return;
        }
      }

      await api.put(`/logs/${todayLog.id}/finish`, body);
      toast.success('Shift selesai!');
      setDescription('');
      await Promise.all([fetchToday(), fetchSummary()]);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Gagal mengakhiri shift';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!entryContent.trim() || !todayLog) return;
    try {
      const { data } = await api.post(`/logs/${todayLog.id}/entries`, { content: entryContent.trim() });
      setEntries((prev) => [...prev, data.data]);
      setEntryContent('');
      toast.success('Catatan ditambahkan');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menambahkan catatan');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Selamat datang, {user?.full_name}!</p>
      </div>

      {/* Shift Card */}
      <Card className="shift-card mb-lg">
        {todayLog === null ? (
          /* Not started */
          <div className="shift-not-started">
            <div className="shift-icon-circle">
              <Play size={32} />
            </div>
            <h2>Belum Memulai Shift</h2>
            <p className="text-muted">Klik tombol di bawah untuk memulai shift hari ini</p>
            <Button
              variant="success"
              size="lg"
              icon={Play}
              loading={actionLoading || geo.loading}
              onClick={handleStartShift}
            >
              {geo.loading ? 'Mendapatkan Lokasi...' : 'Mulai Shift'}
            </Button>
            {geo.error && <p className="text-danger mt-sm" style={{ fontSize: '0.8rem' }}>{geo.error}</p>}
          </div>
        ) : todayLog.status === 'active' ? (
          /* Active */
          <div className="shift-active">
            <div className="shift-active-header">
              <Badge variant="success" dot size="md">Shift Aktif</Badge>
              <span className="shift-start-time">
                <Clock size={14} /> Mulai: {formatTime(todayLog.start_time)}
              </span>
            </div>

            <div className="shift-timer">
              <Timer size={20} />
              <span className="shift-timer-value">{formatMinutesToHours(elapsed)}</span>
              <span className="text-muted">berlangsung</span>
            </div>

            {/* Entries section */}
            <div className="shift-entries">
              <h4><FileText size={16} /> Catatan Pekerjaan</h4>
              <div className="entries-list">
                {entries.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.8rem', padding: '8px 0' }}>
                    Belum ada catatan
                  </p>
                ) : (
                  entries.map((entry) => (
                    <div key={entry.id} className="entry-item">
                      <span className="entry-time">{formatTime(entry.timestamp)}</span>
                      <span className="entry-content">{entry.content}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="entry-input-row">
                <Input
                  id="entry-content"
                  placeholder="Tulis catatan pekerjaan..."
                  value={entryContent}
                  onChange={(e) => setEntryContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()}
                />
                <Button icon={Plus} variant="secondary" onClick={handleAddEntry} disabled={!entryContent.trim()}>
                  Tambah
                </Button>
              </div>
            </div>

            {/* End shift section */}
            <div className="shift-end-section">
              <Input
                id="shift-description"
                type="textarea"
                label="Deskripsi Pekerjaan Hari Ini"
                placeholder="Tuliskan ringkasan pekerjaan hari ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button
                variant="danger"
                size="lg"
                icon={Square}
                loading={actionLoading}
                onClick={handleEndShift}
                fullWidth
              >
                {geo.loading ? 'Mendapatkan Lokasi...' : 'Akhiri Shift'}
              </Button>
            </div>
          </div>
        ) : (
          /* Completed */
          <div className="shift-completed">
            <div className="shift-completed-icon">
              <CheckCircle size={40} />
            </div>
            <h2>Shift Selesai</h2>
            <div className="shift-completed-grid">
              <div className="shift-stat">
                <Calendar size={16} />
                <span className="text-muted">Tanggal</span>
                <strong>{formatDate(todayLog.date)}</strong>
              </div>
              <div className="shift-stat">
                <Clock size={16} />
                <span className="text-muted">Waktu</span>
                <strong>{formatTime(todayLog.start_time)} — {formatTime(todayLog.end_time)}</strong>
              </div>
              <div className="shift-stat">
                <Coffee size={16} />
                <span className="text-muted">Istirahat</span>
                <strong>{todayLog.break_minutes} menit</strong>
              </div>
              <div className="shift-stat">
                <Timer size={16} />
                <span className="text-muted">Total Kerja</span>
                <strong>{formatMinutesToHours(todayLog.total_work_minutes)}</strong>
              </div>
            </div>
            {todayLog.geofence_passed !== null && (
              <div className="mt-sm">
                <Badge variant={todayLog.geofence_passed ? 'success' : 'danger'} dot>
                  <MapPin size={12} /> Geofence: {todayLog.geofence_passed ? 'Lolos' : 'Tidak Lolos'}
                </Badge>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Monthly summary */}
      {summary && (
        <Card className="animate-fade-in-up">
          <h3 className="mb-md">Ringkasan {getMonthName(currentMonth)} {currentYear}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-value">{summary.total_days}</span>
              <span className="summary-label">Hari Kerja</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{summary.total_work_hours}</span>
              <span className="summary-label">Total Jam</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{summary.average_hours_per_day}</span>
              <span className="summary-label">Rata-rata/Hari</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
