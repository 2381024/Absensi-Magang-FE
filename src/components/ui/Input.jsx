import './Input.css';

export default function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  id,
  className = '',
  ...props
}) {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon">
            <Icon size={16} />
          </span>
        )}
        {type === 'textarea' ? (
          <textarea id={id} className={`input ${Icon ? 'input-with-icon' : ''}`} {...props} />
        ) : (
          <input id={id} type={type} className={`input ${Icon ? 'input-with-icon' : ''}`} {...props} />
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}

export function Select({ label, error, id, children, className = '', ...props }) {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} className="input select" {...props}>
        {children}
      </select>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
