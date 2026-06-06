import { useState } from 'preact/hooks';
import { Modal } from './LayoutComponents';
import { Field } from './LayoutComponents';
import { Btn } from './Btn';
import { Input, Textarea, Select } from './FormComponents';
import { uid, avatarColor, ini, sanitizeName } from '../utils/utils';
import { FormRunner } from './FormRunner';

export function ContactModal({ contact, lists, settings, forms, onSave, onDelete, onClose }) {
  const isNew = !contact;
  const [data, setData] = useState(() => contact
    ? JSON.parse(JSON.stringify(contact))
    : { id: uid(), name: '', phone: '', email: '', handle: '', location: '', tags: [], status: '', leadSource: '', category: '', membershipLevel: '', comment: '', lists: [], dnd: false }
  );

  const [selectedFormId, setSelectedFormId] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const contactName = sanitizeName(data.name) || 'New Contact';
  const avatarBg = avatarColor(contactName);
  const initials = ini(contactName);

  function TagEditor() {
    const [inp, setInp] = useState('');
    const [tagFocus, setTagFocus] = useState(false);
    
    const addTag = v => {
      const t = v.trim().replace(/,$/, '');
      if (t && !data.tags.includes(t)) set('tags', [...data.tags, t]);
    };
    
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '6px', 
          alignItems: 'center', 
          background: '#fff', 
          border: `1.5px solid ${tagFocus ? '#4f46e5' : '#e2e8f0'}`, 
          boxShadow: tagFocus ? '0 0 0 3px rgba(79,70,229,.1)' : 'none',
          borderRadius: '8px', 
          padding: '7px 10px', 
          minHeight: '42px', 
          cursor: 'text',
          transition: 'all 0.15s ease'
        }}
      >
        {data.tags.map((t, i) => (
          <span 
            key={i} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '3px', 
              background: "#eef2ff", 
              color: '#4338ca', 
              border: '1px solid #c7d2fe', 
              borderRadius: '99px', 
              padding: '2px 6px 2px 9px', 
              fontSize: '12px', 
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            {t}
            <button 
              type="button"
              onClick={() => set('tags', data.tags.filter((_, j) => j !== i))} 
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '14px', padding: '0 2px' }}
            >
              ×
            </button>
          </span>
        ))}
        <input 
          value={inp} 
          placeholder="Add tag, press Enter…"
          onInput={e => setInp(e.target.value)}
          onFocus={() => setTagFocus(true)}
          onBlur={() => setTagFocus(false)}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && inp.trim()) { e.preventDefault(); addTag(inp); setInp(''); } }}
          style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13.5px', color: "#0f172a", minWidth: '120px', flex: 1, padding: '1px 0' }}
        />
      </div>
    );
  }

  function AssignBox() {
    const addEntry = () => {
      const activeLists = lists.filter(l => l.status !== 'inactive');
      if (!activeLists.length) return;
      set('lists', [...data.lists, { listId: activeLists[0].id, status: settings.listStatuses[0] || '' }]);
    };
    
    return (
      <div style={{ border: `1.5px solid #e2e8f0`, borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '10px 14px', background: "#f8fafc", borderBottom: `1px solid #e2e8f0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: "#64748b", textTransform: 'uppercase', letterSpacing: '.5px' }}>Assigned Lists</span>
          <button 
            type="button"
            onClick={addEntry} 
            style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: "#4f46e5", 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              padding: '2px 8px', 
              borderRadius: '5px',
              transition: 'all 0.1s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.color = '#4f46e5'}
          >
            + Add to List
          </button>
        </div>
        {!data.lists.length ? (
          <div style={{ padding: '16px', textAlign: 'center', color: "#94a3b8", fontSize: '13px', fontStyle: 'italic' }}>
            Not assigned to any list yet.
          </div>
        ) : (
          data.lists.map((entry, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 12px', 
                borderBottom: i < data.lists.length - 1 ? `1px solid #f1f5f9` : 'none',
                background: '#fff',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <Select 
                value={entry.listId} 
                onChange={e => { const nl = [...data.lists]; nl[i] = { ...nl[i], listId: e.target.value }; set('lists', nl); }} 
                style={{ flex: 1.2, minWidth: 0, padding: '7px 28px 7px 10px', fontSize: '12.5px' }}
              >
                <option value="">— Select List —</option>
                {lists.filter(l => l.status !== 'inactive' || l.id === entry.listId).slice().sort((a,b) => (a.name||'').localeCompare(b.name||'', undefined, {numeric:true})).map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name}{l.status === 'inactive' ? ' (Inactive)' : ''}
                  </option>
                ))}
              </Select>
              
              <span style={{ color: "#cbd5e1", flexShrink: 0, fontSize: '14px', fontWeight: 600 }}>→</span>
              
              <Select 
                value={entry.status} 
                onChange={e => { const nl = [...data.lists]; nl[i] = { ...nl[i], status: e.target.value }; set('lists', nl); }} 
                style={{ flex: 1, minWidth: 0, padding: '7px 28px 7px 10px', fontSize: '12.5px' }}
              >
                {settings.listStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              
              <button 
                type="button"
                onClick={() => set('lists', data.lists.filter((_, j) => j !== i))} 
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer', 
                  color: "#94a3b8", 
                  fontSize: '18px', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  transition: 'all 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  const footer = (
    <>
      {!isNew && <Btn variant="danger" onClick={() => { if (confirm('Delete this contact?')) onDelete(data.id); }}>Delete Contact</Btn>}
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="primary" onClick={() => { if (!data.name.trim()) { alert('Name is required'); return; } onSave({ ...data, lists: data.lists.filter(e => e.listId) }); }}>
        {isNew ? 'Add Contact' : 'Save Changes'}
      </Btn>
    </>
  );

  return (
    <Modal title={isNew ? 'New Contact' : 'Edit Contact'} onClose={onClose} footer={footer}>
      {/* Dynamic Header Spotlight HUD */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          padding: '16px 20px', 
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          marginBottom: '24px',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)'
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: avatarBg,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06), inset 0 -2px 0 rgba(0,0,0,0.1)',
          flexShrink: 0
        }}>
          {initials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
            {data.name || 'New Contact'}
          </div>
          {data.phone ? (
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12.5px' }}>{data.phone}</span>
            </div>
          ) : (
            <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
              No phone number assigned
            </div>
          )}
        </div>
      </div>

      {/* Structured Single View Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* PROFILE INFO SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Field label="Full Name"><Input value={data.name} onInput={e => set('name', e.target.value)} placeholder="Jane Doe" /></Field>
          <Field label="Phone"><Input value={data.phone} onInput={e => set('phone', e.target.value)} type="tel" placeholder="+1 555 000 0000" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Field label="Email"><Input value={data.email} onInput={e => set('email', e.target.value)} type="email" placeholder="jane@example.com" /></Field>
          <Field label="Social Handle"><Input value={data.handle} onInput={e => set('handle', e.target.value.replace(/^@+/, ''))} placeholder="username (no @)" /></Field>
        </div>
        <Field label="Location"><Input value={data.location} onInput={e => set('location', e.target.value)} placeholder="e.g. New York, NY" /></Field>
        
        {/* Sleek divider line separating sections */}
        <div style={{ height: '1.5px', background: 'linear-gradient(90deg, #e2e8f0 0%, rgba(226, 232, 240, 0) 100%)', margin: '6px 0' }} />

        {/* CRM CLASSIFICATION SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Field label="Contact Status">
            <Select value={data.status} onChange={e => set('status', e.target.value)}>
              <option value="">— None —</option>
              {settings.contactStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          
          <Field label="Do Not Contact (DND)">
            <label 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '0 14px', 
                border: `1.5px solid ${data.dnd ? '#fecaca' : '#e2e8f0'}`, 
                borderRadius: '9px', 
                background: data.dnd ? '#fef2f2' : '#fff', 
                cursor: 'pointer', 
                transition: 'all 0.15s ease',
                height: '42px',
                boxSizing: 'border-box'
              }}
            >
              <input 
                type="checkbox" 
                checked={!!data.dnd} 
                onChange={e => set('dnd', e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer', flexShrink: 0 }} 
              />
              <div style={{ fontSize: '13px', fontWeight: 700, color: data.dnd ? '#b91c1c' : '#475569' }}>
                Off-limits for campaigns
              </div>
            </label>
          </Field>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <Field label="Membership Level">
            <Select value={data.membershipLevel} onChange={e => set('membershipLevel', e.target.value)}>
              <option value="">— None —</option>
              {(settings.membershipLevels || []).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Lead Source">
            <Select value={data.leadSource} onChange={e => set('leadSource', e.target.value)}>
              <option value="">— None —</option>
              {(settings.leadSources || []).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={data.category} onChange={e => set('category', e.target.value)}>
              <option value="">— None —</option>
              {(settings.categories || []).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        
        <Field label="Tags"><TagEditor /></Field>
        
        {/* Sleek divider line separating sections */}
        <div style={{ height: '1.5px', background: 'linear-gradient(90deg, #e2e8f0 0%, rgba(226, 232, 240, 0) 100%)', margin: '6px 0' }} />

        {/* LISTS & NOTES SECTION */}
        <Field label="List Assignments"><AssignBox /></Field>
        <Field label="Notes"><Textarea value={data.comment} onInput={e => set('comment', e.target.value)} placeholder="Any notes about this contact…" /></Field>

        {/* EXECUTE FORMS SECTION */}
        {!isNew && forms && forms.length > 0 && (() => {
          const selectedForm = forms.find(f => f.id === selectedFormId);
          return (
            <>
              <div style={{ height: '1.5px', background: 'linear-gradient(90deg, #e2e8f0 0%, rgba(226, 232, 240, 0) 100%)', margin: '6px 0' }} />
              <Field label="Execute Form">
                <div style={{ border: `1.5px solid #e2e8f0`, borderRadius: '10px', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Select
                      value={selectedFormId}
                      onChange={e => { setSelectedFormId(e.target.value); setFormOpen(false); }}
                      style={{ flex: 1, padding: '8px 10px', fontSize: '13px' }}
                    >
                      <option value="">— Select Form to Run —</option>
                      {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </Select>
                    {selectedFormId && !formOpen && (
                      <Btn
                        variant="primary"
                        onClick={() => setFormOpen(true)}
                        style={{ padding: '8px 16px', height: '38px', fontSize: '12.5px', fontWeight: 700 }}
                      >
                        Open Form
                      </Btn>
                    )}
                    {selectedFormId && formOpen && (
                      <Btn
                        variant="ghost"
                        onClick={() => setFormOpen(false)}
                        style={{ padding: '8px 16px', height: '38px', fontSize: '12.5px', fontWeight: 700 }}
                      >
                        Close Form
                      </Btn>
                    )}
                  </div>

                  {formOpen && selectedForm && (
                    <div style={{ marginTop: '10px', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
                      <FormRunner
                        form={selectedForm}
                        contact={data}
                        isInline={true}
                        onDone={() => {
                          setFormOpen(false);
                          setSelectedFormId('');
                        }}
                      />
                    </div>
                  )}
                </div>
              </Field>
            </>
          );
        })()}
      </div>
    </Modal>
  );
}
