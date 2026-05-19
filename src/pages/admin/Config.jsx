import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { Settings } from 'lucide-react';

export default function AdminConfig() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

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
        <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
          Belum ada konfigurasi yang tersedia. Halaman ini akan digunakan untuk pengaturan sistem di masa depan.
        </p>
      </Card>
    </div>
  );
}
