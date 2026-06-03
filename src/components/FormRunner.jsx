import { useState } from 'preact/hooks';

export function FormRunner({ form, contact, onClose, onDone, isInline = false }) {
  const [formData, setFormData] = useState(() => {
    const seed = {};
    (form.fields || []).forEach(f => {
      if (f.value) seed[f.name] = f.value;
      if (f.autofill && contact?.[f.autofill]) seed[f.name] = contact[f.autofill];
    });
    return seed;
  });
  const [status, setStatus] = useState(null);

  function submit() {
    for (const f of form.fields) {
      if (f.required && !(formData[f.name] || '').toString().trim()) {
        setStatus({ type: 'error', msg: `"${f.label}" is required.` });
        return;
      }
    }
    setStatus({ type: 'sending' });
    const payload = {
      crm_contact_id: contact.id,
      crm_contact_name: contact.name || '',
      crm_contact_phone: contact.phone || '',
      ...formData,
    };
    chrome.runtime.sendMessage(
      { action: 'sendFormSubmission', url: form.endpointUrl, contentType: form.contentType || 'json', payload },
      (res) => {
        if (res && res.ok) {
          setStatus({ type: 'success' });
          setTimeout(onDone, 2200);
        } else {
          setStatus({ type: 'error', msg: (res && res.error) || 'Submission failed.' });
        }
      }
    );
  }

  const isSending = status?.type === 'sending';
  const isSuccess = status?.type === 'success';

  const INP = {
    width: '100%', boxSizing: 'border-box',
    fontFamily: '"Outfit","Inter",sans-serif', fontSize: '13px', color: '#0f172a',
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px',
    padding: '8px 11px', outline: 'none', transition: 'border-color .15s, box-shadow .15s',
  };
  const iFocus = e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; };
  const iBlur = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; };

  const containerStyle = isInline
    ? { display: 'flex', flexDirection: 'column', gap: '12px' }
    : {
        position: 'fixed',
        bottom: '24px',
        zIndex: 2147483646,
        left: '340px',
        width: '300px',
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '20px',
        fontFamily: '"Outfit","Inter",sans-serif',
        pointerEvents: 'auto',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 1px 4px rgba(15,23,42,0.08)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh'
      };

  return (
    <div style={containerStyle}>
      {/* Header (Only if not inline) */}
      {!isInline && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(15,23,42,0.06)', background: 'rgba(248,250,252,0.9)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', paddingBottom: '10px' }}>{form.name}</div>
              <div style={{ fontSize: '11px', color: '#64748b', paddingTop: '10px' }}>
                For <strong style={{ color: '#0f172a' }}>{contact.name || contact.phone}</strong>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} style={{ flexShrink: 0, background: '#f1f5f9', border: 'none', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            )}
          </div>
        </div>
      )}

      {/* Fields */}
      <div style={{
        flex: 1,
        overflowY: isInline ? 'visible' : 'auto',
        padding: isInline ? '0px' : '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '36px' }}>✅</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Submitted!</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Data sent successfully.</div>
          </div>
        ) : (form.fields || []).map(f => {
          if (f.type === 'hidden') return null;
          const val = formData[f.name] ?? '';
          const setVal = v => setFormData(d => ({ ...d, [f.name]: v }));
          const opts = (f.options || '').split(',').map(x => x.trim()).filter(Boolean);
          const isPrefilled = f.autofill && contact?.[f.autofill];

          return (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', paddingBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {f.label}{f.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
                </label>
                {isPrefilled && (
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>auto</span>
                )}
              </div>
              {f.type === 'textarea' ? (
                <textarea value={val} onInput={e => setVal(e.target.value)} style={{ ...INP, minHeight: '64px', resize: 'vertical' }} onFocus={iFocus} onBlur={iBlur} />
              ) : f.type === 'select' ? (
                <select value={val} onChange={e => setVal(e.target.value)} style={{ ...INP, cursor: 'pointer' }} onFocus={iFocus} onBlur={iBlur}>
                  <option value="">Select...</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={val}
                  onInput={e => setVal(e.target.value)}
                  style={{ ...INP, borderColor: isPrefilled ? '#a5b4fc' : '#e2e8f0', background: isPrefilled ? '#f8f7ff' : '#fff' }}
                  onFocus={iFocus} onBlur={iBlur}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {!isSuccess && (
        <div style={{
          padding: isInline ? '8px 0 0 0' : '12px 18px',
          borderTop: isInline ? 'none' : '1px solid rgba(15,23,42,0.06)',
          background: isInline ? 'transparent' : 'rgba(248,250,252,0.9)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {status?.type === 'error' && (
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#ef4444', textAlign: 'center', padding: '6px 10px', background: '#fff1f2', borderRadius: '7px', lineHeight: 1.4 }}>
              {status.msg}
            </div>
          )}
          <button
            onClick={submit}
            disabled={isSending}
            style={{
              width: '100%',
              padding: '10px',
              background: isSending ? '#6366f1' : '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSending ? 'default' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.2s'
            }}
          >
            {isSending ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      )}
    </div>
  );
}
