import './Spinner.css';

export default function Spinner({ size = 32, className = '' }) {
  return (
    <div className={`spinner-container ${className}`}>
      <div className="spinner" style={{ width: size, height: size }} />
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="page-spinner">
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p>Memuat...</p>
    </div>
  );
}
