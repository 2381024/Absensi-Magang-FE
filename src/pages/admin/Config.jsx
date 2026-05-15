import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { Save, Settings, Coffee } from 'lucide-react';

export default function AdminConfig() {
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/config');
        setConfig(data.data);
        setBreakMinutes(data.data.break_minutes_default || '30');
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/config', { break_minutes_default: Number(breakMinutes) });
      setConfig(data.data);
      toast.success('Konfigurasi berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menyimpan konfigurasi');
    }
    setSaving(false);
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Konfigurasi Sistem</h1>
        <p>Atur pengaturan global sistem absensi</p>
      </div>

      <Card style={{ maxWidth: 500, padding: 'var(--space-xl)' }}>
        <div className="flex-gap-sm mb-lg" style={{ color: 'var(--accent-primary)' }}>
          <Settings size={20} />
          <h3>Pengaturan Umum</h3>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input
            id="config-break"
            label="Durasi Istirahat Default (menit)"
            icon={Coffee}
            type="number"
            min="0"
            max="120"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
          />
          <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
            Durasi istirahat ini akan otomatis diterapkan saat user memulai shift baru. Admin dapat mengubah durasi per log.
          </p>
          <Button type="submit" icon={Save} loading={saving}>Simpan Konfigurasi</Button>
        </form>
      </Card>
    </div>
  );
}
