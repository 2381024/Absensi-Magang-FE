import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Lock, Clock } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import './Login.css';

export default function Login() {
  const { user, login } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userData = await login(form.username, form.password);
      navigate(userData.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login gagal, coba lagi';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Clock size={28} />
          </div>
          <h1>Absensi Magang</h1>
          <p>Masuk ke akun Anda untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <Input
            id="login-username"
            label="Username"
            icon={User}
            placeholder="Masukkan username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Masukkan password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />

          <Button type="submit" fullWidth loading={loading} size="lg">
            Masuk
          </Button>
        </form>
      </div>
    </div>
  );
}
