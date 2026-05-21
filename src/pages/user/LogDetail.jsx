import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { ArrowLeft, Clock, Calendar, Timer, MapPin, FileText, CalendarDays, AlertTriangle, X } from 'lucide-react';
import { formatDate, formatTime, formatMinutesToHours, getStatusLabel, formatTimeStr } from '../../utils/formatters';
import './LogDetail.css';

export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/logs/${id}`);
        setLog(data.data);
      } catch {
        setLog(null);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Hapus catatan ini?')) return;
    try {
      await api.delete(`/logs/entries/${entryId}`);
      setLog((prev) => ({
        ...prev,
        entries: prev.entries.filter(e => e.id !== entryId)
      }));
      toast.success('Catatan dihapus');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menghapus catatan');
    }
  };

  if (loading) return <PageSpinner />;
  if (!log) return (
    <div className="page-container">
      <p className="text-muted">Log tidak ditemukan</p>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Kembali</Button>
    </div>
  );

  return (
    <div className="page-container">
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)} className="mb-md">
        Kembali
      </Button>

      <Card className="log-detail-card">
        <div className="log-detail-header">
          <h2>Detail Log Kerja</h2>
          <div className="flex-gap-sm">
            <Badge variant={log.status === 'active' ? 'success' : 'default'} dot size="md">
              {getStatusLabel(log.status)}
            </Badge>
            {log.scheduled_start && (
              <Badge variant={log.is_late ? 'danger' : 'success'} size="md">
                {log.is_late ? 'Terlambat' : 'Tepat Waktu'}
              </Badge>
            )}
            {log.is_early_leave && (
              <Badge variant="warning" size="md">Pulang Cepat</Badge>
            )}
          </div>
        </div>

        <div className="log-detail-grid">
          <div className="log-detail-item">
            <Calendar size={16} />
            <span className="text-muted">Tanggal</span>
            <strong>{formatDate(log.date)}</strong>
          </div>
          <div className="log-detail-item">
            <Clock size={16} />
            <span className="text-muted">Mulai</span>
            <strong>{formatTime(log.start_time)}</strong>
          </div>
          <div className="log-detail-item">
            <Clock size={16} />
            <span className="text-muted">Selesai</span>
            <strong>{formatTime(log.end_time)}</strong>
          </div>
          {log.scheduled_start && (
            <div className="log-detail-item">
              <CalendarDays size={16} />
              <span className="text-muted">Jadwal</span>
              <strong>{formatTimeStr(log.scheduled_start)} — {formatTimeStr(log.scheduled_end)}</strong>
            </div>
          )}
          <div className="log-detail-item">
            <Timer size={16} />
            <span className="text-muted">Total Kerja</span>
            <strong>{formatMinutesToHours(log.total_work_minutes)}</strong>
          </div>
          {log.geofence_passed !== null && (
            <div className="log-detail-item">
              <MapPin size={16} />
              <span className="text-muted">Geofence</span>
              <strong>{log.geofence_passed ? 'Lolos' : 'Tidak Lolos'}</strong>
            </div>
          )}
        </div>

        {log.late_reason && (
          <div style={{ padding: '10px 14px', background: 'hsla(0,70%,50%,0.1)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-md)', fontSize: '0.85rem' }}>
            <strong><AlertTriangle size={14} style={{ verticalAlign: 'middle' }} /> Alasan terlambat:</strong> {log.late_reason}
          </div>
        )}

        {log.early_leave_reason && (
          <div style={{ padding: '10px 14px', background: 'hsla(40,80%,50%,0.1)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-sm)', fontSize: '0.85rem' }}>
            <strong><AlertTriangle size={14} style={{ verticalAlign: 'middle' }} /> Alasan pulang cepat:</strong> {log.early_leave_reason}
          </div>
        )}

        {log.description && (
          <div className="log-detail-desc">
            <h4><FileText size={16} /> Deskripsi</h4>
            <p>{log.description}</p>
          </div>
        )}

        {log.entries && log.entries.length > 0 && (
          <div className="log-detail-entries">
            <h4><FileText size={16} /> Catatan Pekerjaan</h4>
            {log.entries.map((entry) => (
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
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
