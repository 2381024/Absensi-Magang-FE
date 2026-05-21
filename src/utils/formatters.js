import { parseISO, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { id } from 'date-fns/locale';

const TZ = 'Asia/Jakarta';

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    // If it's just a YYYY-MM-DD string, append T00:00:00 so it doesn't get shifted by browser local time
    const safeStr = dateStr.length === 10 ? `${dateStr}T00:00:00+07:00` : dateStr;
    return formatInTimeZone(safeStr, TZ, 'd MMMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return formatInTimeZone(dateStr, TZ, 'HH:mm', { locale: id });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return formatInTimeZone(dateStr, TZ, 'd MMM yyyy, HH:mm', { locale: id });
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

// Day names — Sunday (0) to Saturday (6)
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const getDayName = (dayOfWeek) => DAY_NAMES[dayOfWeek] || '';

// Day order for display: Sunday first
export const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6];

export const getAttendanceLabel = (isLate) => {
  if (isLate === true) return 'Terlambat';
  if (isLate === false) return 'Tepat Waktu';
  return '-';
};

export const getAttendanceVariant = (isLate) => {
  if (isLate === true) return 'danger';
  if (isLate === false) return 'success';
  return 'default';
};

// Format TIME string (HH:MM:SS) to HH:MM
export const formatTimeStr = (timeStr) => {
  if (!timeStr) return '-';
  return timeStr.slice(0, 5);
};
