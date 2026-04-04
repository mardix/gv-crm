export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: "#475569", marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.8px' }}>{label}</label>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, footer, children }) {
  return (
    <div className="vcrm-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)',
      zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: '14px', width: '600px', maxWidth: '96vw',
        maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(15,23,42,.25), 0 0 0 1px rgba(15,23,42,.08)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: `1px solid #e2e8f0`, position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
          <span style={{ fontSize: '17px', fontWeight: 800, color: "#0f172a" }}>{title}</span>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1.5px solid #e2e8f0`, background: 'none', cursor: 'pointer', color: "#94a3b8", fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '40px 48px', flex: 1 }}>{children}</div>
        {footer && <div style={{ flexShrink: 0, padding: '12px 22px 18px', display: 'flex', gap: '8px', alignItems: 'center', borderTop: `1px solid #e2e8f0`, background: '#fff', position: 'sticky', bottom: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}
