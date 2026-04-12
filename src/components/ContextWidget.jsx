import { useState, useEffect, useRef } from 'preact/hooks';
import { Badge } from './Badge';
import { Btn } from './Btn';
import { palFor } from '../utils/utils';

/* Contact widget is 300px at left:24. Form panel sits right of it: 24+300+12=336 */
const WIDGET_LEFT = '24px';
const WIDGET_W = '300px';
const FORM_LEFT = '340px'; // 24 + 300 + 16 gap
const FORM_W = '300px';
const BOTTOM = '24px';
const ZIDX = 2147483646;

const WIDGET_STYLE = {
  position: 'fixed', bottom: BOTTOM, zIndex: ZIDX,
  background: 'rgba(255,255,255,0.98)',
  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '20px',
  fontFamily: '"Outfit","Inter",sans-serif',
  pointerEvents: 'auto', overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 1px 4px rgba(15,23,42,0.08)',
};

/* ─── Main contact widget ─── */
export function ContextWidget({ activeContact, contacts, lists, forms, settings, onAdd, onEdit }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const prevPhoneRef = useRef(null);

  const contact = activeContact ? contacts.find(c => {
    const p1 = (c.phone || '').replace(/\D/g, '');
    const p2 = activeContact.phoneNumber;
    return p1 && p2 && p1.endsWith(p2.slice(-10));
  }) : null;

  useEffect(() => {
    if (!activeContact) return;
    const cur = activeContact.phoneNumber;
    if (cur !== prevPhoneRef.current) {
      prevPhoneRef.current = cur;
      setSelectedFormId('');
      setFormOpen(false);
      if (!contact) setCollapsed(false);
    }
  }, [activeContact?.phoneNumber, contact]);

  if (!activeContact) return null;

  const [bg, fg] = contact?.status
    ? palFor(contact.status, settings.contactStatuses)
    : ['#fee2e2', '#991b1b'];
  const isUnknown = !contact;
  const selectedForm = forms?.find(f => f.id === selectedFormId);

  return (
    <>
      {/* ─── Contact card ─── */}
      <div className="vcrm-widget" style={{ ...WIDGET_STYLE, left: WIDGET_LEFT, width: WIDGET_W }}>

        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', cursor: 'pointer', gap: '12px',
            background: collapsed ? '#fff' : 'rgba(248,250,252,0.9)',
            borderBottom: collapsed ? 'none' : '1px solid rgba(15,23,42,0.06)',
            transition: 'background 0.2s',
          }}
          onClick={() => setCollapsed(c => !c)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0,
              background: isUnknown ? '#f59e0b' : '#10b981',
              boxShadow: isUnknown ? '0 0 0 3px rgba(245,158,11,0.15)' : '0 0 0 3px rgba(16,185,129,0.15)',
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              GV-CRM: Contact
              {contact?.dnd && <span style={{ color: 'rgb(185,28,28)', fontSize: '10px', fontWeight: 700 }}>&nbsp;🚫 DND</span>}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Badge text={contact ? (contact.status || 'Saved') : 'NOT SAVED'} bg={bg} fg={fg} />
            <span style={{ fontSize: '16px', color: '#94a3b8', lineHeight: 1, display: 'inline-block', transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Name + phone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.2, wordBreak: 'break-word' }}>
                {contact?.name || activeContact.contactName || 'New Contact'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, fontFamily: '"DM Mono", monospace' }}>
                  {activeContact.formattedPhone}
                </span>
              </div>
            </div>

            {contact ? (
              <>
                {contact.dnd && (
                  <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🚫</span> Do Not Contact (DND)
                  </div>
                )}
                {contact.comment && (
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#475569', padding: '10px 14px', background: '#f8fafc', borderLeft: '3px solid #6366f1', borderRadius: '8px' }}>
                    "{contact.comment}"
                  </div>
                )}
                {contact.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {contact.tags.map(t => (
                      <span key={t} style={{ fontSize: '10px', fontWeight: 700, background: '#e0e7ff', color: '#4338ca', padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase' }}>#{t}</span>
                    ))}
                  </div>
                )}
                {contact.lists?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {contact.lists.map(l => {
                      const lo = lists?.find(x => x.id === l.listId);
                      if (!lo) return null;
                      return (
                        <div key={l.listId} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', padding: '8px 10px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12.5px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', flex: 1, wordBreak: 'break-word', lineHeight: 1.3 }}>{lo.name}</span>
                          {l.status && <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '3px 6px', borderRadius: '6px', textTransform: 'uppercase', lineHeight: 1, marginTop: '2px' }}>{l.status}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                <Btn variant="primary" onClick={() => onEdit(contact)} style={{ width: '100%', height: '40px', fontWeight: 700, marginTop: '4px' }}>Open Contact</Btn>

                {/* Form selection */}
                {forms?.length > 0 && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#508de3ff', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px' }}>📋 Select Form</div>
                    <select
                      value={selectedFormId}
                      onChange={e => { setSelectedFormId(e.target.value); setFormOpen(false); }}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12.5px', color: selectedFormId ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', background: '#fff' }}
                    >
                      <option value="">Select a form...</option>
                      {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    {selectedFormId && !formOpen && (
                      <button
                        onClick={() => setFormOpen(true)}
                        style={{ width: '100%', padding: '9px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Open Form →
                      </button>
                    )}
                    {selectedFormId && formOpen && (
                      <button
                        onClick={() => setFormOpen(false)}
                        style={{ width: '100%', padding: '9px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        ← Close Form
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.5' }}>
                  This contact is not in your GV-CRM. Add them to start tracking status and notes.
                </div>
                <Btn variant="primary" onClick={() => onAdd(activeContact)} style={{ width: '100%', height: '40px', fontWeight: 700 }}>+ Add New Contact</Btn>
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Form runner side panel (slides in to the right of the contact card) ─── */}
      {formOpen && selectedForm && contact && (
        <FormRunnerPanel
          form={selectedForm}
          contact={contact}
          onClose={() => setFormOpen(false)}
          onDone={() => { setFormOpen(false); setSelectedFormId(''); }}
        />
      )}
    </>
  );
}

/* ─── Form runner panel — appears as a second context widget ─── */
function FormRunnerPanel({ form, contact, onClose, onDone }) {
  const [formData, setFormData] = useState(() => {
    const seed = {};
    (form.fields || []).forEach(f => {
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
      { action: 'sendFormSubmission', url: form.endpointUrl, payload },
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

  return (
    <div style={{ ...WIDGET_STYLE, left: FORM_LEFT, width: FORM_W, display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(15,23,42,0.06)', background: 'rgba(248,250,252,0.9)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', paddingBottom: '10px' }}>{form.name}</div>
            <div style={{ fontSize: '11px', color: '#64748b', paddingTop: '10px' }}>
              For <strong style={{ color: '#0f172a' }}>{contact.name || contact.phone}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ flexShrink: 0, background: '#f1f5f9', border: 'none', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '36px' }}>✅</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Submitted!</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Data sent successfully.</div>
          </div>
        ) : (form.fields || []).map(f => {
          const val = formData[f.name] ?? '';
          const setVal = v => setFormData(d => ({ ...d, [f.name]: v }));
          const opts = (f.options || '').split(',').map(x => x.trim()).filter(Boolean);
          const isPrefilled = f.autofill && contact?.[f.autofill];

          return (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', paddingBottom: '10px' }}>
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
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(15,23,42,0.06)', background: 'rgba(248,250,252,0.9)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {status?.type === 'error' && (
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#ef4444', textAlign: 'center', padding: '6px 10px', background: '#fff1f2', borderRadius: '7px', lineHeight: 1.4 }}>
              {status.msg}
            </div>
          )}
          <button
            onClick={submit}
            disabled={isSending}
            style={{ width: '100%', padding: '10px', background: isSending ? '#6366f1' : '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: isSending ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
          >
            {isSending ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      )}
    </div>
  );
}
