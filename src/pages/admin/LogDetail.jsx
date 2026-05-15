import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { ArrowLeft, Edit2, Coffee, Clock, Calendar, Timer, MapPin, FileText, Save } from 'lucide-react';
import { formatDate, formatTime, formatMinutesToHours, getStatusLabel } from '../../utils/formatters';
import '../user/LogDetail.css';

export default function AdminLogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [breakModal, setBreakModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [breakMinutes, setBreakMinutes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLog = async () => {
    try {
      const { data } = await api.get(`/logs/${id}`);
      setLog(data.data);
    } catch { setLog(null); }
    setLoading(false);
  };

  useEffect(() => { fetchLog(); }, [id]);

  const openEdit = () => {
    setEditForm({
      description: log.description || '',
      start_time: log.start_time ? log.start_time.slice(0, 16) : '',
      end_time: log.end_time ? log.end_time.slice(0, 16) : '',
    });
    setEditModal(true);
  };

  const openBreak = () => {
    setBreakMinutes(log.break_minutes || 30);
    setBreakModal(true);
  };

  const handleEditSubmit = async () => {
    setSaving(true);
    try {
      const body = {};
      if (editForm.description !== (log.description || '')) body.description = editForm.description;
      if (editForm.start_time) body.start_time = new Date(editForm.start_time).toISOString();
      if (editForm.end_time) body.end_time = new Date(editForm.end_time).toISOString();
      await api.put(`/logs/${id}`, body);
      toast.success('Log berhasil diperbarui');
      setEditModal(false);
      fetchLog();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal memperbarui log');
    }
    setSaving(false);
  };

  const handleBreakSubmit = async () => {
    setSaving(true);
    try {
      await api.patch(`/logs/${id}/break`, { break_minutes: Number(breakMinutes) });
      toast.success('Durasi istirahat berhasil diubah');
      setBreakModal(false);
      fetchLog();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal mengubah istirahat');
    }
    setSaving(false);
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
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)} className="mb-md">Kembali</Button>

      <Card className="log-detail-card">
        <div className="log-detail-header">
          <div>
            <h2>Detail Log Kerja</h2>
            {log.user && <p className="text-muted">{log.user.full_name}</p>}
          </div>
          <div className="flex-gap-sm">
            <Badge variant={log.status === 'active' ? 'success' : 'default'} dot size="md">
              {getStatusLabel(log.status)}
            </Badge>
            <Button variant="secondary" size="sm" icon={Edit2} onClick={openEdit}>Edit</Button>
            <Button variant="secondary" size="sm" icon={Coffee} onClick={openBreak}>Istirahat</Button>
          </div>
        </div>

        <div className="log-detail-grid">
          <div className="log-detail-item"><Calendar size={16} /><span className="text-muted">Tanggal</span><strong>{formatDate(log.date)}</strong></div>
          <div className="log-detail-item"><Clock size={16} /><span className="text-muted">Mulai</span><strong>{formatTime(log.start_time)}</strong></div>
          <div className="log-detail-item"><Clock size={16} /><span className="text-muted">Selesai</span><strong>{formatTime(log.end_time)}</strong></div>
          <div className="log-detail-item"><Coffee size={16} /><span className="text-muted">Istirahat</span><strong>{log.break_minutes} menit</strong></div>
          <div className="log-detail-item"><Timer size={16} /><span className="text-muted">Total</span><strong>{formatMinutesToHours(log.total_work_minutes)}</strong></div>
          {log.geofence_passed !== null && (
            <div className="log-detail-item"><MapPin size={16} /><span className="text-muted">Geofence</span><strong>{log.geofence_passed ? 'Lolos' : 'Tidak'}</strong></div>
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

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Log"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal(false)}>Batal</Button>
            <Button icon={Save} loading={saving} onClick={handleEditSubmit}>Simpan</Button>
          </>
        }>
        <div className="modal-form">
          <Input id="edit-start" label="Waktu Mulai" type="datetime-local"
            value={editForm.start_time} onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} />
          <Input id="edit-end" label="Waktu Selesai" type="datetime-local"
            value={editForm.end_time} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} />
          <Input id="edit-desc" label="Deskripsi" type="textarea"
            value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
      </Modal>

      {/* Break Modal */}
      <Modal isOpen={breakModal} onClose={() => setBreakModal(false)} title="Ubah Durasi Istirahat" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBreakModal(false)}>Batal</Button>
            <Button icon={Save} loading={saving} onClick={handleBreakSubmit}>Simpan</Button>
          </>
        }>
        <div className="modal-form">
          <Input id="break-min" label="Durasi Istirahat (menit)" type="number" min="0"
            value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
