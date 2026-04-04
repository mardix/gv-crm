export function Badge({ text, bg, fg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: '99px', fontSize: '11px', fontWeight: 600,
      whiteSpace: 'nowrap', background: bg, color: fg,
      fontFamily: 'Inter,sans-serif', lineHeight: '1.4',
      border: 'none', margin: 0, textTransform: 'none', letterSpacing: 'normal',
      boxSizing: 'border-box', textDecoration: 'none',
    }}>{text}</span>
  );
}
