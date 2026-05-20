import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { User, Mail, Phone, Briefcase, Building, Lock, Save, Camera } from 'lucide-react';
import { getRoleLabel } from '../../utils/formatters';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ new_password: '', confirm: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const serverUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/profile');
        setProfile(data.data.user);
        setForm({
          full_name: data.data.user.full_name || '',
          email: data.data.user.email || '',
          phone_number: data.data.user.phone_number || '',
        });
      } catch {
        // ignore
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/profile', form);
      setProfile(data.data.user);
      updateUser(data.data.user);
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal memperbarui profil');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error('Password baru tidak cocok');
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setSaving(true);
    try {
      await api.put('/profile', {
        new_password: pwForm.new_password,
      });
      setPwForm({ new_password: '', confirm: '' });
      toast.success('Password berhasil diubah');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal mengubah password');
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
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
      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = { ...profile, avatar_url: data.data.avatar_url };
      setProfile(updatedUser);
      updateUser(updatedUser);
      toast.success('Foto profil berhasil diubah');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal mengubah foto profil');
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Profil Saya</h1>
        <p>Kelola informasi akun Anda</p>
      </div>

      <div className="profile-grid">
        {/* Info Card */}
        <Card className="profile-info-card">
          <div className="profile-avatar-section">
            <div
              className={`profile-avatar-large editable ${uploadingAvatar ? 'uploading' : ''}`}
              onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <img src={`${serverUrl}${profile.avatar_url}`} alt={profile.full_name} />
              ) : (
                <User size={40} />
              )}
              {!uploadingAvatar && (
                <div className="avatar-overlay">
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
            <h3>{profile?.full_name}</h3>
            <p className="text-muted">@{profile?.username}</p>
            <Badge variant={profile?.role === 'admin' ? 'primary' : 'info'} size="md">
              {getRoleLabel(profile?.role)}
            </Badge>
          </div>
          <div className="profile-meta">
            {profile?.position && (
              <div className="profile-meta-item">
                <Briefcase size={14} /> {profile.position}
              </div>
            )}
            {profile?.department && (
              <div className="profile-meta-item">
                <Building size={14} /> {profile.department}
              </div>
            )}
          </div>
        </Card>

        {/* Edit Form */}
        <div className="profile-forms">
          <Card>
            <h3 className="mb-md">Edit Profil</h3>
            <form onSubmit={handleSaveProfile} className="profile-form">
              <Input id="profile-name" label="Nama Lengkap" icon={User} value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <Input id="profile-email" label="Email" icon={Mail} type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input id="profile-phone" label="No. Telepon" icon={Phone} value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
              <Button type="submit" icon={Save} loading={saving}>Simpan</Button>
            </form>
          </Card>

          {profile?.role === 'admin' && (
            <Card className="mt-lg">
              <h3 className="mb-md">Ubah Password</h3>
              <form onSubmit={handleChangePassword} className="profile-form">
                <Input id="new-pw" label="Password Baru" type="password" icon={Lock}
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
                <Input id="confirm-pw" label="Konfirmasi Password Baru" type="password" icon={Lock}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
                <Button type="submit" variant="warning" icon={Lock} loading={saving}>Ubah Password</Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
