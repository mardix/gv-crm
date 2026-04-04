import { useState } from 'preact/hooks';

export function PresetsWidget({ activeContact, settings }) {
  const [collapsed, setCollapsed] = useState(true);

  // Normalize: old plain-string presets → { title, text }
  const presets = (settings.presets || []).map(p =>
    typeof p === 'string' ? { title: '', text: p } : p
  );

  if (!activeContact || !presets.length) return null;

  const handleFill = (template) => {
    // Evaluate tokens against active contact
    let text = template;
    const firstName = (activeContact.contactName || '').split(' ')[0] || activeContact.contactName || '';
    text = text.replace(/{{\s*name\s*}}/gi, firstName);
    text = text.replace(/{{\s*email\s*}}/gi, activeContact.email || '');
    text = text.replace(/{{\s*phone\s*}}/gi, activeContact.phoneNumber || activeContact.formattedPhone || '');
    text = text.replace(/{{\s*handle\s*}}/gi, activeContact.handle || '');

    // Inject into Google Voice message textarea — append to existing content
    const el = document.querySelector('textarea.message-input')
      || document.querySelector('textarea[aria-label="Type a message"]');
    if (el && !el.disabled) {
      const existing = el.value || '';
      const appended = existing ? existing + '\n' + text.trim() : text.trim();
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(el, appended);
      else el.value = appended;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.focus();
    }
  };

  return (
    <div className="vcrm-widget" style={{
      position: 'fixed', bottom: '65px', right: '24px',
      zIndex: 2147483646,
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '20px',
      width: '300px', fontFamily: '"Outfit", "Inter", sans-serif',
      pointerEvents: 'auto', overflow: 'hidden',
    }}>
      {/* Header */}

      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', cursor: 'pointer', gap: '12px',
          background: collapsed ? '#fff' : 'rgba(248, 250, 252, 0.9)',
          borderBottom: collapsed ? 'none' : '1px solid rgba(15, 23, 42, 0.06)',
          transition: 'background 0.2s',
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          ⚡ GV-CRM: Preset Texts
        </span>
        <span style={{
          fontSize: '16px', color: '#94a3b8', lineHeight: 1,
          display: 'inline-block', transition: 'transform 0.2s',
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        }}>▾</span>
      </div>

      {/* Preset list */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '380px', overflowY: 'auto' }}>
          {presets.map((p, i) => (
            <div
              key={i}
              onClick={() => handleFill(p.text)}
              style={{
                padding: '13px 18px',
                borderBottom: i < presets.length - 1 ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {p.title && (
                <div style={{
                  fontSize: '10px', fontWeight: 800, color: '#4f46e5',
                  textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '5px',
                }}>
                  {p.title}
                </div>
              )}
              <div style={{
                fontSize: '13px', color: '#334155', lineHeight: 1.5,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {p.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
