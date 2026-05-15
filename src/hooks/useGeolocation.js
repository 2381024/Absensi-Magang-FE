import { useState, useCallback } from 'react';

export default function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Browser tidak mendukung geolokasi';
        setError(err);
        reject(err);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (err) => {
          setLoading(false);
          let message = 'Gagal mendapatkan lokasi';
          if (err.code === 1) message = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di browser.';
          else if (err.code === 2) message = 'Lokasi tidak tersedia';
          else if (err.code === 3) message = 'Permintaan lokasi timeout';
          setError(message);
          reject(message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { getCurrentPosition, loading, error };
}
