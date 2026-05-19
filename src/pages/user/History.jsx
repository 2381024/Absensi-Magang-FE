import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { Select } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate, formatTime, formatMinutesToHours, getStatusLabel, getMonthName } from '../../utils/formatters';
import './History.css';

export default function History() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/logs/summary', { params: { month, year } });
        setSummary(data.data);
      } catch {
        setSummary(null);
      }
      setLoading(false);
    };
    fetch();
  }, [month, year]);

  const columns = [
    { key: 'date', label: 'Tanggal', render: (v) => formatDate(v) },
    { key: 'start_time', label: 'Mulai', render: (v) => formatTime(v) },
    { key: 'end_time', label: 'Selesai', render: (v) => formatTime(v) },
    { key: 'total_work_minutes', label: 'Total Kerja', render: (v) => formatMinutesToHours(v) },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge variant={v === 'active' ? 'success' : 'default'} dot>
          {getStatusLabel(v)}
        </Badge>
      ),
    },
    {
      key: 'is_late',
      label: 'Kehadiran',
      render: (v) => {
        if (v === true) return <Badge variant="danger">Terlambat</Badge>;
        if (v === false) return <Badge variant="success">Tepat Waktu</Badge>;
        return <span className="text-muted">-</span>;
      },
    },
  ];

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) years.push(y);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Riwayat Kerja</h1>
        <p>Lihat catatan kerja Anda berdasarkan bulan</p>
      </div>

      <div className="history-filters mb-lg">
        <Select id="history-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
          ))}
        </Select>
        <Select id="history-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          {summary && (
            <div className="history-summary mb-lg">
              <div className="history-summary-item">
                <span className="history-summary-value">{summary.total_days}</span>
                <span className="history-summary-label">Hari Kerja</span>
              </div>
              <div className="history-summary-item">
                <span className="history-summary-value">{summary.total_work_hours}</span>
                <span className="history-summary-label">Total Jam</span>
              </div>
              <div className="history-summary-item">
                <span className="history-summary-value">{summary.average_hours_per_day}</span>
                <span className="history-summary-label">Rata-rata/Hari</span>
              </div>
              <div className="history-summary-item">
                <span className="history-summary-value" style={{ color: 'var(--color-danger)' }}>{summary.total_late || 0}</span>
                <span className="history-summary-label">Terlambat</span>
              </div>
              <div className="history-summary-item">
                <span className="history-summary-value" style={{ color: 'var(--color-warning)' }}>{summary.total_early_leave || 0}</span>
                <span className="history-summary-label">Pulang Cepat</span>
              </div>
            </div>
          )}

          <Table
            columns={columns}
            data={summary?.logs || []}
            onRowClick={(row) => navigate(`/logs/${row.id}`)}
            emptyMessage="Tidak ada data untuk periode ini"
          />
        </>
      )}
    </div>
  );
}
