import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { ArrowLeft, Clock, Calendar, Timer, Coffee, MapPin, FileText } from 'lucide-react';
import { formatDate, formatTime, formatMinutesToHours, getStatusLabel } from '../../utils/formatters';
import './LogDetail.css';

export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
          <Badge variant={log.status === 'active' ? 'success' : 'default'} dot size="md">
            {getStatusLabel(log.status)}
          </Badge>
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
          <div className="log-detail-item">
            <Coffee size={16} />
            <span className="text-muted">Istirahat</span>
            <strong>{log.break_minutes} menit</strong>
          </div>
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
              <div key={entry.id} className="entry-item">
                <span className="entry-time">{formatTime(entry.timestamp)}</span>
                <span className="entry-content">{entry.content}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
