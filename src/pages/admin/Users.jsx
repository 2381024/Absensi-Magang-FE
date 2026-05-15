import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input, { Select } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
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
          <h1>Kelola User</h1>
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
            <Button loading={saving} onClick={handleSubmit}>
              {editing ? 'Simpan' : 'Buat User'}
            </Button>
          </>
        }>
        <form onSubmit={handleSubmit} className="modal-form">
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
      </Modal>
    </div>
  );
}
