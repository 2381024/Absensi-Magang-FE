import './Card.css';

export default function Card({ children, className = '', variant = 'default', padding = 'md', ...props }) {
  return (
    <div className={`card card-${variant} card-pad-${padding} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, trend, color = 'primary' }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-icon">
        <Icon size={22} />
      </div>
      <div className="stat-card-content">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
      </div>
      {trend !== undefined && (
        <span className={`stat-card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  );
}
