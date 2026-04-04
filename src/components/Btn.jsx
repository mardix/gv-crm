import { useState } from 'preact/hooks';

export function Btn({ children, onClick, variant = 'ghost', style: extraStyle = {} }) {
  const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '13px', borderRadius: '8px', cursor: 'pointer', border: 'none', lineHeight: 1, whiteSpace: 'nowrap', transition: 'all .12s' };
  const variants = {
    primary: { background: "#0f172a", color: '#fff', padding: '8px 16px' },
    ghost: { background: "#ffffff", color: "#64748b", padding: '7px 14px', border: `1.5px solid #e2e8f0` },
    danger: { background: 'none', color: "#ef4444", padding: '7px 14px', border: `1.5px solid #e2e8f0`, marginRight: 'auto' },
    sm: { background: "#f8fafc", color: "#64748b", padding: '5px 10px', border: `1px solid #e2e8f0`, fontSize: '12px', borderRadius: '6px' },
  };
  const [hover, setHover] = useState(false);
  const hoverStyles = {
    primary: { background: '#0f172a' },
    ghost: { background: "#f1f5f9", borderColor: "#cbd5e1", color: "#0f172a" },
    danger: { background: "#fef2f2", borderColor: '#fca5a5' },
    sm: { background: "#eef2ff", borderColor: '#a5b4fc', color: "#4f46e5" },
  };
  return (
    <button
      style={{ ...base, ...variants[variant], ...(hover ? hoverStyles[variant] : {}), ...extraStyle }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >{children}</button>
  );
}
