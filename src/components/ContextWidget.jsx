import { useState, useEffect, useRef } from 'preact/hooks';
import { Badge } from './Badge';
import { Btn } from './Btn';
import { palFor } from '../utils/utils';

export function ContextWidget({ activeContact, contacts, lists, settings, onAdd, onEdit }) {
  const [collapsed, setCollapsed] = useState(false);
  const prevPhoneRef = useRef(null);

  const contact = activeContact ? contacts.find(c => {
    const p1 = (c.phone || '').replace(/\D/g, '');
    const p2 = activeContact.phoneNumber;
    return p1 && p2 && p1.endsWith(p2.slice(-10));
  }) : null;

  // When active conversation changes:
  // - Unknown contact → auto-expand so user can add them
  // - Known contact → preserve whichever state the user set
  useEffect(() => {
    if (!activeContact) return;
    const currentPhone = activeContact.phoneNumber;
    if (currentPhone !== prevPhoneRef.current) {
      prevPhoneRef.current = currentPhone;
      if (!contact) setCollapsed(false);
    }
  }, [activeContact?.phoneNumber, contact]);

  if (!activeContact) return null;

  const [bg, fg] = contact?.status
    ? palFor(contact.status, settings.contactStatuses)
    : ['#fee2e2', '#991b1b'];
  const isUnknown = !contact;

  return (
    <div className="vcrm-widget" style={{
      position: 'fixed', bottom: '24px', left: '24px',
      zIndex: 2147483646,
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '20px',
      width: '300px', fontFamily: '"Outfit", "Inter", sans-serif',
      pointerEvents: 'auto', overflow: 'hidden',
    }}>

      {/* ── Compact header (always visible) ── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0,
            background: isUnknown ? '#f59e0b' : '#10b981',
            boxShadow: isUnknown
              ? '0 0 0 3px rgba(245,158,11,0.15)'
              : '0 0 0 3px rgba(16,185,129,0.15)',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            GV-CRM: Contact
            {contact && contact.dnd && (
              <span style="  color: rgb(185, 28, 28); font-size: 10px; font-weight: 700">&nbsp;<span style="font-size: 10px;">🚫</span> DND</span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Badge text={contact ? (contact.status || 'Saved') : 'NOT SAVED'} bg={bg} fg={fg} />
          <span style={{
            fontSize: '16px', color: '#94a3b8', lineHeight: 1,
            display: 'inline-block', transition: 'transform 0.2s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}>▾</span>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {!collapsed && (
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Contact name + phone */}
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
                <div style={{ padding: '16px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🚫</span> Do Not Contact (DND)
                </div>
              )}
              {contact.comment && (
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#475569', padding: '11px 14px', background: '#f8fafc', borderLeft: '3px solid #6366f1', borderRadius: '8px' }}>
                  "{contact.comment}"
                </div>
              )}
              {contact.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(contact.tags || []).map(t => (
                    <span key={t} style={{ fontSize: '10px', fontWeight: 700, background: '#e0e7ff', color: '#4338ca', padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase' }}>#{t}</span>
                  ))}
                </div>
              )}
              {contact.lists?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(contact.lists || []).map(l => {
                    const listObj = lists?.find(x => x.id === l.listId);
                    if (!listObj) return null;
                    return (
                      <div key={l.listId} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', padding: '8px 10px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12.5px' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', flex: 1, wordBreak: 'break-word', lineHeight: 1.3 }}>{listObj.name}</span>
                        {l.status && <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '3px 6px', borderRadius: '6px', textTransform: 'uppercase', lineHeight: 1, marginTop: '2px' }}>{l.status}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              <Btn variant="primary" onClick={() => onEdit(contact)} style={{ width: '100%', height: '40px', fontWeight: 700, marginTop: '4px' }}>Open Contact</Btn>
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
  );
}
