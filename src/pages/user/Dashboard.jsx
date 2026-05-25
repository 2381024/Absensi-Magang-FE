import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import useGeolocation from '../../hooks/useGeolocation';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
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
  CheckCircle,
  FileText,
  AlertTriangle,
  CalendarDays,
  X,
} from 'lucide-react';
import {
  formatTime,
  formatDate,
  formatMinutesToHours,
  getElapsedMinutes,
  getStatusLabel,
  getMonthName,
  formatTimeStr,
  getDayName,
} from '../../utils/formatters';
import './Dashboard.css';

export default function UserDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const geo = useGeolocation();
  const [todayLog, setTodayLog] = useState(undefined); // undefined = loading
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [schedule, setSchedule] = useState(null); // today's schedule
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [entryContent, setEntryContent] = useState('');
  const [description, setDescription] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Late / early leave modals
  const [lateModalOpen, setLateModalOpen] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [earlyModalOpen, setEarlyModalOpen] = useState(false);
  const [earlyReason, setEarlyReason] = useState('');

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

  const fetchSchedule = useCallback(async () => {
    try {
      const { data } = await api.get('/schedules/me');
      const todayDow = new Date().getDay();
      const todaySched = data.data.find((s) => s.day_of_week === todayDow);
      setSchedule(todaySched || null);
    } catch {
      setSchedule(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchToday(), fetchSummary(), fetchSchedule()]);
      setLoading(false);
    };
    init();
  }, [fetchToday, fetchSummary, fetchSchedule]);

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

  // Check if user would be late
  const isLateNow = () => {
    if (!schedule) return false;
    const schedStart = new Date();
    const parts = schedule.start_time.split(':');
    schedStart.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    return new Date() > schedStart;
  };

  // Check if user would be leaving early
  const isEarlyNow = () => {
    if (!todayLog?.scheduled_end) return false;
    const schedEnd = new Date();
    const parts = todayLog.scheduled_end.split(':');
    schedEnd.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    return new Date() < schedEnd;
  };

  const handleStartShift = async () => {
    // If late, show modal for reason
    if (isLateNow()) {
      setLateReason('');
      setLateModalOpen(true);
      return;
    }
    await doStartShift('');
  };

  const doStartShift = async (reason) => {
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

      if (reason) body.late_reason = reason;

      await api.post('/logs/start', body);
      toast.success('Shift berhasil dimulai!');
      await fetchToday();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Gagal memulai shift';
      if (!reason && msg.toLowerCase().includes('alasan terlambat wajib diisi')) {
        setLateModalOpen(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!todayLog) return;
    // If early leave, show modal for reason
    if (isEarlyNow()) {
      setEarlyReason('');
      setEarlyModalOpen(true);
      return;
    }
    await doEndShift('');
  };

  const doEndShift = async (reason) => {
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

      if (reason) body.early_leave_reason = reason;

      await api.put(`/logs/${todayLog.id}/finish`, body);
      toast.success('Shift selesai!');
      setDescription('');
      await Promise.all([fetchToday(), fetchSummary()]);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Gagal mengakhiri shift';
      if (!reason && msg.toLowerCase().includes('alasan') && msg.toLowerCase().includes('wajib')) {
        setEarlyModalOpen(true);
      } else {
        toast.error(msg);
      }
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

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Hapus catatan ini?')) return;
    try {
      await api.delete(`/logs/entries/${entryId}`);
      setEntries((prev) => prev.filter(e => e.id !== entryId));
      toast.success('Catatan dihapus');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menghapus catatan');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Selamat datang, {user?.full_name}!</p>
      </div>

      {/* Today's Schedule Info */}
      {schedule && todayLog === null && (
        <Card className="mb-md animate-fade-in-up" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
          <div className="flex-gap-sm" style={{ alignItems: 'center' }}>
            <CalendarDays size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>
              Jadwal hari ini ({getDayName(new Date().getDay())}): <strong>{formatTimeStr(schedule.start_time)} — {formatTimeStr(schedule.end_time)}</strong>
            </span>
          </div>
        </Card>
      )}

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
              <div className="flex-gap-sm">
                <Badge variant="success" dot size="md">Shift Aktif</Badge>
                {todayLog.is_late && (
                  <Badge variant="danger" size="md">
                    <AlertTriangle size={12} /> Terlambat
                  </Badge>
                )}
              </div>
              <span className="shift-start-time">
                <Clock size={14} /> Mulai: {formatTime(todayLog.start_time)}
                {todayLog.scheduled_start && (
                  <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.8rem' }}>
                    (Jadwal: {formatTimeStr(todayLog.scheduled_start)})
                  </span>
                )}
              </span>
            </div>

            {todayLog.is_late && todayLog.late_reason && (
              <div className="mt-sm" style={{ padding: '8px 12px', background: 'hsla(0,70%,50%,0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <strong>Alasan terlambat:</strong> {todayLog.late_reason}
              </div>
            )}

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
                    <div key={entry.id} className="entry-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span className="entry-time" style={{ flexShrink: 0 }}>{formatTime(entry.timestamp)}</span>
                      <span className="entry-content" style={{ flexGrow: 1 }}>{entry.content}</span>
                      <button 
                        onClick={() => handleDeleteEntry(entry.id)} 
                        title="Hapus Catatan"
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', opacity: 0.7, padding: '2px' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                      >
                        <X size={14} />
                      </button>
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

            {/* Attendance badges */}
            <div className="flex-gap-sm mb-md" style={{ justifyContent: 'center' }}>
              {todayLog.scheduled_start && (
                <Badge variant={todayLog.is_late ? 'danger' : 'success'} dot>
                  {todayLog.is_late ? 'Terlambat' : 'Tepat Waktu'}
                </Badge>
              )}
              {todayLog.is_early_leave && (
                <Badge variant="warning" dot>Pulang Cepat</Badge>
              )}
            </div>

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
              {todayLog.scheduled_start && (
                <div className="shift-stat">
                  <CalendarDays size={16} />
                  <span className="text-muted">Jadwal</span>
                  <strong>{formatTimeStr(todayLog.scheduled_start)} — {formatTimeStr(todayLog.scheduled_end)}</strong>
                </div>
              )}
              <div className="shift-stat">
                <Timer size={16} />
                <span className="text-muted">Total Kerja</span>
                <strong>{formatMinutesToHours(todayLog.total_work_minutes)}</strong>
              </div>
            </div>

            {todayLog.late_reason && (
              <div className="mt-sm" style={{ padding: '8px 12px', background: 'hsla(0,70%,50%,0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', textAlign: 'left' }}>
                <strong>Alasan terlambat:</strong> {todayLog.late_reason}
              </div>
            )}
            {todayLog.early_leave_reason && (
              <div className="mt-sm" style={{ padding: '8px 12px', background: 'hsla(40,80%,50%,0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', textAlign: 'left' }}>
                <strong>Alasan pulang cepat:</strong> {todayLog.early_leave_reason}
              </div>
            )}

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
            <div className="summary-item">
              <span className="summary-value" style={{ color: 'var(--color-danger)' }}>{summary.total_late || 0}</span>
              <span className="summary-label">Terlambat</span>
            </div>
            <div className="summary-item">
              <span className="summary-value" style={{ color: 'var(--color-warning)' }}>{summary.total_early_leave || 0}</span>
              <span className="summary-label">Pulang Cepat</span>
            </div>
          </div>
        </Card>
      )}

      {/* Late Reason Modal */}
      <Modal isOpen={lateModalOpen} onClose={() => setLateModalOpen(false)}
        title="Anda Terlambat"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLateModalOpen(false)}>Batal</Button>
            <Button loading={actionLoading} onClick={() => {
              if (!lateReason.trim()) {
                toast.error('Alasan terlambat wajib diisi');
                return;
              }
              setLateModalOpen(false);
              doStartShift(lateReason.trim());
            }}>Mulai Shift</Button>
          </>
        }>
        <div className="modal-form">
          <div className="flex-gap-sm mb-md" style={{ color: 'var(--color-danger)', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>Anda terlambat dari jadwal ({formatTimeStr(schedule?.start_time)}). Silakan masukkan alasan.</span>
          </div>
          <Input
            id="late-reason"
            type="textarea"
            label="Alasan Terlambat"
            placeholder="Tuliskan alasan keterlambatan..."
            value={lateReason}
            onChange={(e) => setLateReason(e.target.value)}
            required
          />
        </div>
      </Modal>

      {/* Early Leave Reason Modal */}
      <Modal isOpen={earlyModalOpen} onClose={() => setEarlyModalOpen(false)}
        title="Pulang Cepat"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEarlyModalOpen(false)}>Batal</Button>
            <Button loading={actionLoading} onClick={() => {
              if (!earlyReason.trim()) {
                toast.error('Alasan pulang cepat wajib diisi');
                return;
              }
              setEarlyModalOpen(false);
              doEndShift(earlyReason.trim());
            }}>Akhiri Shift</Button>
          </>
        }>
        <div className="modal-form">
          <div className="flex-gap-sm mb-md" style={{ color: 'var(--color-warning)', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>Anda akan pulang sebelum jadwal ({formatTimeStr(todayLog?.scheduled_end)}). Silakan masukkan alasan.</span>
          </div>
          <Input
            id="early-reason"
            type="textarea"
            label="Alasan Pulang Cepat"
            placeholder="Tuliskan alasan pulang cepat..."
            value={earlyReason}
            onChange={(e) => setEarlyReason(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
