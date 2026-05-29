import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { Upload, Download, Edit2, Search, Save } from 'lucide-react';
import { getDayName, DAY_ORDER } from '../../utils/formatters';
import * as XLSX from 'xlsx';
import './Schedules.css';

const EXCEL_DAY_HEADERS = [
  'Minggu Masuk', 'Minggu Keluar',
  'Senin Masuk', 'Senin Keluar',
  'Selasa Masuk', 'Selasa Keluar',
  'Rabu Masuk', 'Rabu Keluar',
  'Kamis Masuk', 'Kamis Keluar',
  'Jumat Masuk', 'Jumat Keluar',
  'Sabtu Masuk', 'Sabtu Keluar',
];

// Map header index to day_of_week: pairs of (dayOfWeek, 'in'|'out')
const HEADER_MAP = [
  [0, 'in'], [0, 'out'], // Minggu
  [1, 'in'], [1, 'out'], // Senin
  [2, 'in'], [2, 'out'], // Selasa
  [3, 'in'], [3, 'out'], // Rabu
  [4, 'in'], [4, 'out'], // Kamis
  [5, 'in'], [5, 'out'], // Jumat
  [6, 'in'], [6, 'out'], // Sabtu
];

export default function AdminSchedules() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/schedules?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setSchedules(data.data);
      setUsers(data.users);
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search]);

  // Group schedules by user_id
  const scheduleMap = {};
  schedules.forEach((s) => {
    if (!scheduleMap[s.user_id]) scheduleMap[s.user_id] = {};
    scheduleMap[s.user_id][s.day_of_week] = s;
  });

  // We rely on the backend search now, so filtered is just users
  const filtered = users;

  // Excel import
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rows.length === 0) {
        toast.error('File kosong atau format tidak sesuai');
        setImporting(false);
        return;
      }

      // Parse rows into schedule data
      const parsed = rows.map((row) => {
        const identifier = row['Nama Lengkap'] || row['Email'] || row['Full Name'] || '';
        const days = [];

        for (let i = 0; i < HEADER_MAP.length; i += 2) {
          const [dayOfWeek] = HEADER_MAP[i];
          const inHeader = EXCEL_DAY_HEADERS[i];
          const outHeader = EXCEL_DAY_HEADERS[i + 1];
          const startTime = String(row[inHeader] || '').trim();
          const endTime = String(row[outHeader] || '').trim();

          if (startTime && endTime) {
            days.push({ day_of_week: dayOfWeek, start_time: startTime, end_time: endTime });
          }
        }

        return { identifier: identifier.trim(), days };
      }).filter((entry) => entry.identifier);

      if (parsed.length === 0) {
        toast.error('Tidak ada data valid ditemukan dalam file');
        setImporting(false);
        return;
      }

      const { data: result } = await api.post('/schedules/import', { schedules: parsed });
      setImportResults(result.data);
      if (result.data.success > 0) {
        toast.success(`${result.data.success} jadwal berhasil diimport`);
      }
      if (result.data.failed > 0) {
        toast.error(`${result.data.failed} jadwal gagal diimport`);
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal mengimport jadwal');
    }

    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Download template
  const handleDownloadTemplate = () => {
    const headers = ['Nama Lengkap', ...EXCEL_DAY_HEADERS];
    const ws = XLSX.utils.aoa_to_sheet([headers, ['Contoh: John Doe', '07:00', '16:00', '07:00', '16:00', '07:00', '16:00', '07:00', '16:00', '07:00', '16:00', '07:00', '16:00', '', '']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal');
    XLSX.writeFile(wb, 'template_jadwal.xlsx');
  };

  // Edit user schedule
  const openEdit = (user) => {
    setEditUser(user);
    const userSchedule = scheduleMap[user.id] || {};
    const form = {};
    DAY_ORDER.forEach((d) => {
      const s = userSchedule[d];
      form[d] = {
        start_time: s ? s.start_time.slice(0, 5) : '',
        end_time: s ? s.end_time.slice(0, 5) : '',
      };
    });
    setEditForm(form);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      // For each day, upsert or delete
      for (const day of DAY_ORDER) {
        const { start_time, end_time } = editForm[day];
        if (start_time && end_time) {
          await api.put(`/schedules/user/${editUser.id}`, {
            day_of_week: day,
            start_time,
            end_time,
          });
        } else {
          // Delete schedule for this day (ignore 404)
          try {
            await api.delete(`/schedules/user/${editUser.id}/day/${day}`);
          } catch { /* might not exist */ }
        }
      }
      toast.success('Jadwal berhasil disimpan');
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menyimpan jadwal');
    }
    setSaving(false);
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex-between mb-lg">
        <div>
          <h1>Jadwal Mingguan</h1>
          <p className="text-muted">Kelola jadwal shift untuk setiap user</p>
        </div>
        <div className="toolbar-actions">
          <Button variant="secondary" icon={Download} onClick={handleDownloadTemplate}>
            Download Template
          </Button>
          <Button icon={Upload} onClick={() => setImportModalOpen(true)}>
            Import Excel
          </Button>
        </div>
      </div>

      <div className="mb-md" style={{ maxWidth: 300 }}>
        <Input id="schedule-search" placeholder="Cari nama atau email..." icon={Search}
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card padding="none">
        <div className="schedule-table-wrap">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Nama</th>
                {DAY_ORDER.map((d) => (
                  <th key={d}>{getDayName(d)}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={DAY_ORDER.length + 2} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                    Tidak ada user
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const userSched = scheduleMap[user.id] || {};
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name-cell">
                          <strong>{user.full_name}</strong>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </td>
                      {DAY_ORDER.map((d) => {
                        const s = userSched[d];
                        return (
                          <td key={d}>
                            {s ? (
                              <div className="schedule-cell">
                                <span className="time-in">{s.start_time.slice(0, 5)}</span>
                                <span className="time-out">{s.end_time.slice(0, 5)}</span>
                              </div>
                            ) : (
                              <span className="schedule-cell-empty">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td>
                        <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(user)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Sebelumnya
          </Button>
          <span style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }}>Halaman {page} dari {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Import Modal */}
      <Modal isOpen={importModalOpen} onClose={() => { setImportModalOpen(false); setImportResults(null); }}
        title="Import Jadwal dari Excel"
        footer={
          <Button variant="secondary" onClick={() => { setImportModalOpen(false); setImportResults(null); }}>
            Tutup
          </Button>
        }>
        <div className="import-section">
          <div className="import-info">
            <h4>Format Excel yang diharapkan:</h4>
            <p>Baris pertama harus berisi header kolom. User akan dicocokkan berdasarkan <strong>Nama Lengkap</strong> atau <strong>Email</strong>.</p>
            <code>{`Nama Lengkap | Minggu Masuk | Minggu Keluar | Senin Masuk | Senin Keluar | ... | Sabtu Masuk | Sabtu Keluar`}</code>
            <p style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Kosongkan kolom jika user tidak bekerja pada hari tersebut. Format waktu: HH:MM (contoh: 07:00, 16:00).
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button icon={Upload} loading={importing}
            onClick={() => fileRef.current?.click()}>
            Pilih File Excel
          </Button>

          {importResults && (
            <div className={`import-results ${importResults.errors?.length > 0 ? 'has-errors' : 'all-success'}`}>
              <p>✅ Berhasil: <strong>{importResults.success}</strong></p>
              <p>❌ Gagal: <strong>{importResults.failed}</strong></p>
              {importResults.errors?.length > 0 && (
                <ul className="import-errors">
                  {importResults.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}
        title={`Edit Jadwal — ${editUser?.full_name || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Batal</Button>
            <Button icon={Save} loading={saving} onClick={handleEditSubmit}>Simpan</Button>
          </>
        }>
        <div className="edit-schedule-grid">
          {DAY_ORDER.map((d) => (
            <div key={d} className="edit-day-row">
              <span className="day-label">{getDayName(d)}</span>
              <Input
                id={`sched-in-${d}`}
                type="time"
                placeholder="Masuk"
                value={editForm[d]?.start_time || ''}
                onChange={(e) => setEditForm({
                  ...editForm,
                  [d]: { ...editForm[d], start_time: e.target.value },
                })}
              />
              <Input
                id={`sched-out-${d}`}
                type="time"
                placeholder="Keluar"
                value={editForm[d]?.end_time || ''}
                onChange={(e) => setEditForm({
                  ...editForm,
                  [d]: { ...editForm[d], end_time: e.target.value },
                })}
              />
            </div>
          ))}
          <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
            Kosongkan kedua kolom untuk hari libur.
          </p>
        </div>
      </Modal>
    </div>
  );
}
