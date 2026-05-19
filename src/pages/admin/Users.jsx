import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input, { Select } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { Plus, Edit2, Trash2, Search, User as UserIcon, Camera } from 'lucide-react';
import { getRoleLabel } from '../../utils/formatters';
import './Users.css';

const emptyForm = {
  username: '', password: '', email: '', full_name: '',
  role: 'user', position: '', department: '', phone_number: '',
};

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      username: user.username, password: '', email: user.email,
      full_name: user.full_name, role: user.role, position: user.position || '',
      department: user.department || '', phone_number: user.phone_number || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const body = { ...form };
        if (!body.password) delete body.password;
        delete body.username;
        await api.put(`/users/${editing.id}`, body);
        toast.success('User berhasil diperbarui');
      } else {
        await api.post('/users', form);
        toast.success('User berhasil dibuat');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menyimpan user');
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    if (!editing) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      await api.post(`/users/${editing.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Foto profil berhasil diubah');
      fetchUsers();
      // Update editing state so the modal shows the new image immediately
      // Since fetchUsers is async and might take a moment, a local patch makes it snappy
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditing((prev) => ({ ...prev, avatar_url: e.target.result }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal mengubah foto profil');
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (user) => {
    if (!confirm(`Nonaktifkan user "${user.full_name}"?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User dinonaktifkan');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menonaktifkan user');
    }
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'avatar', label: '', width: '40px',
      render: (v, row) => (
        <div className="user-table-avatar">
          {row.avatar_url ? (
            <img src={`http://localhost:5000${row.avatar_url}`} alt={row.full_name} />
          ) : (
            <div className="user-table-avatar-placeholder"><UserIcon size={16} /></div>
          )}
        </div>
      ),
    },
    { key: 'full_name', label: 'Nama' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    {
      key: 'role', label: 'Role',
      render: (v) => <Badge variant={v === 'admin' ? 'primary' : 'default'}>{getRoleLabel(v)}</Badge>,
    },
    {
      key: 'is_active', label: 'Status',
      render: (v) => <Badge variant={v ? 'success' : 'danger'} dot>{v ? 'Aktif' : 'Nonaktif'}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex-gap-sm">
          <Button variant="ghost" size="sm" icon={Edit2} onClick={(e) => { e.stopPropagation(); openEdit(row); }} />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); handleDelete(row); }} />
        </div>
      ),
    },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex-between mb-lg">
        <div>
          <h1>Kelola Akun</h1>
          <p className="text-muted">{users.length} user terdaftar</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Tambah User</Button>
      </div>

      <div className="mb-md" style={{ maxWidth: 300 }}>
        <Input id="user-search" placeholder="Cari nama atau username..." icon={Search}
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Table columns={columns} data={filtered} emptyMessage="Tidak ada user" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit User' : 'Tambah User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button loading={saving} type="submit" form="user-form">
              {editing ? 'Simpan' : 'Buat User'}
            </Button>
          </>
        }>
        <div className="modal-form">
          {editing && (
            <div className="edit-avatar-section mb-md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                className={`profile-avatar-large editable ${uploadingAvatar ? 'uploading' : ''}`}
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '3px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
              >
                {editing.avatar_url ? (
                  <img src={editing.avatar_url.startsWith('data:') ? editing.avatar_url : `http://localhost:5000${editing.avatar_url}`} alt={editing.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={40} color="var(--text-secondary)" />
                )}
                {!uploadingAvatar && (
                  <div className="avatar-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                    <Camera size={24} />
                  </div>
                )}
                {uploadingAvatar && <PageSpinner size="sm" />}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg, image/png, image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Klik gambar untuk mengubah foto</span>
            </div>
          )}
          <form id="user-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {!editing && (
            <Input id="user-username" label="Username" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          )}
          <Input id="user-password" label={editing ? 'Password Baru (opsional)' : 'Password'}
            type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing} />
          <Input id="user-fullname" label="Nama Lengkap" value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <Input id="user-email" label="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Select id="user-role" label="Role" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
          <Input id="user-position" label="Posisi" value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Input id="user-dept" label="Departemen" value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input id="user-phone" label="No. Telepon" value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          </form>
        </div>
      </Modal>
    </div>
  );
}
