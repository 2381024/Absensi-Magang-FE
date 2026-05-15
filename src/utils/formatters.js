import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'HH:mm', { locale: id });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'd MMM yyyy, HH:mm', { locale: id });
  } catch {
    return dateStr;
  }
};

export const formatMinutesToHours = (minutes) => {
  if (minutes === null || minutes === undefined) return '-';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} menit`;
  if (mins === 0) return `${hrs} jam`;
  return `${hrs} jam ${mins} menit`;
};

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: id });
  } catch {
    return dateStr;
  }
};

export const getElapsedMinutes = (startTimeStr) => {
  if (!startTimeStr) return 0;
  const start = new Date(startTimeStr);
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / 60000));
};

export const getStatusLabel = (status) => {
  const labels = {
    active: 'Aktif',
    completed: 'Selesai',
  };
  return labels[status] || status;
};

export const getRoleLabel = (role) => {
  const labels = {
    admin: 'Admin',
    user: 'User',
  };
  return labels[role] || role;
};

export const getMonthName = (month) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1] || '';
};
