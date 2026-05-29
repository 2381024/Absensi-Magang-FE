import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import GeofenceMap from '../../components/GeofenceMap';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import './Geofence.css';

export default function AdminGeofence() {
  const toast = useToast();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', radius_meters: 100 });
  const [position, setPosition] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLocations = async () => {
    try {
      const { data } = await api.get(`/geofence?page=${page}&limit=5`);
      setLocations(data.data);
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchLocations(); }, [page]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', radius_meters: 100 });
    setPosition(null);
    setModalOpen(true);
  };

  const openEdit = (loc) => {
    setEditing(loc);
    setForm({ name: loc.name, radius_meters: loc.radius_meters });
    setPosition({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nama lokasi wajib diisi'); return; }
    if (!position) { toast.error('Pilih lokasi pada peta'); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name, latitude: position.lat, longitude: position.lng,
        radius_meters: Number(form.radius_meters),
      };
      if (editing) {
        await api.put(`/geofence/${editing.id}`, body);
        toast.success('Lokasi berhasil diperbarui');
      } else {
        await api.post('/geofence', body);
        toast.success('Lokasi berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menyimpan lokasi');
    }
    setSaving(false);
  };

  const handleToggle = async (loc) => {
    try {
      await api.patch(`/geofence/${loc.id}/toggle`);
      toast.success(`Geofence "${loc.name}" ${loc.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (loc) => {
    if (!confirm(`Hapus geofence "${loc.name}"?`)) return;
    try {
      await api.delete(`/geofence/${loc.id}`);
      toast.success('Geofence dihapus');
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menghapus');
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex-between mb-lg">
        <div>
          <h1>Geofence</h1>
          <p className="text-muted">Kelola area lokasi kerja</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Tambah Lokasi</Button>
      </div>

      {/* Map overview */}
      <Card className="mb-lg" padding="none">
        <GeofenceMap markers={locations} height={350} zoom={12}
          center={locations.length > 0
            ? [Number(locations[0].latitude), Number(locations[0].longitude)]
            : [-6.2088, 106.8456]
          }
        />
      </Card>

      {/* Location list */}
      <div className="geofence-list">
        {locations.length === 0 ? (
          <Card className="flex-center" style={{ padding: '48px', color: 'var(--text-muted)' }}>
            Belum ada lokasi geofence
          </Card>
        ) : (
          locations.map((loc) => (
            <Card key={loc.id} className="geofence-item">
              <div className="geofence-item-info">
                <div className="geofence-item-icon">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4>{loc.name}</h4>
                  <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {Number(loc.latitude).toFixed(6)}, {Number(loc.longitude).toFixed(6)} · Radius: {loc.radius_meters}m
                  </p>
                </div>
              </div>
              <div className="geofence-item-actions">
                <Badge variant={loc.is_active ? 'success' : 'danger'} dot>
                  {loc.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <Button variant="ghost" size="sm"
                  icon={loc.is_active ? ToggleRight : ToggleLeft}
                  onClick={() => handleToggle(loc)} title="Toggle aktif" />
                <Button variant="ghost" size="sm" icon={Edit2}
                  onClick={() => openEdit(loc)} />
                <Button variant="ghost" size="sm" icon={Trash2}
                  onClick={() => handleDelete(loc)} />
              </div>
            </Card>
          ))
        )}
      </div>

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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg"
        title={editing ? 'Edit Geofence' : 'Tambah Geofence'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button loading={saving} onClick={handleSubmit}>
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }>
        <div className="modal-form">
          <Input id="geo-name" label="Nama Lokasi" placeholder="cth. Kantor Pusat"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input id="geo-radius" label="Radius (meter)" type="number" min="10"
            value={form.radius_meters}
            onChange={(e) => setForm({ ...form, radius_meters: e.target.value })} />
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
              Lokasi (klik pada peta)
            </label>
            <GeofenceMap
              interactive
              height={300}
              selectedPosition={position}
              radius={form.radius_meters}
              onPositionSelect={setPosition}
              center={position ? [position.lat, position.lng] : [-6.2088, 106.8456]}
              zoom={15}
            />
            {position && (
              <p className="text-muted mt-sm" style={{ fontSize: 'var(--font-size-xs)' }}>
                Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
