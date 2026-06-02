import { useState } from 'preact/hooks';
import { Modal } from './LayoutComponents';
import { Field } from './LayoutComponents';
import { Btn } from './Btn';
import { Input, Textarea, Select } from './FormComponents';
import { uid } from '../utils/utils';

export function ContactModal({ contact, lists, settings, onSave, onDelete, onClose }) {
  const isNew = !contact;
  const [data, setData] = useState(() => contact
    ? JSON.parse(JSON.stringify(contact))
    : { id: uid(), name: '', phone: '', email: '', handle: '', location: '', tags: [], status: '', leadSource: '', category: '', membershipLevel: '', comment: '', lists: [], dnd: false }
  );

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  function TagEditor() {
    const [inp, setInp] = useState('');
    const addTag = v => {
      const t = v.trim().replace(/,$/, '');
      if (t && !data.tags.includes(t)) set('tags', [...data.tags, t]);
    };
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', background: '#fff', border: `1.5px solid #e2e8f0`, borderRadius: '8px', padding: '7px 10px', minHeight: '42px', cursor: 'text' }}>
        {data.tags.map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: "#eef2ff", color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '99px', padding: '2px 6px 2px 9px', fontSize: '12px', fontWeight: 500 }}>
            {t}<button onClick={() => set('tags', data.tags.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '14px', padding: '0 1px' }}>×</button>
          </span>
        ))}
        <input value={inp} placeholder="Add tag, press Enter…"
          onInput={e => setInp(e.target.value)}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && inp.trim()) { e.preventDefault(); addTag(inp); setInp(''); } }}
          style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13px', color: "#0f172a", minWidth: '100px', flex: 1, padding: '1px 0' }}
        />
      </div>
    );
  }

  function AssignBox() {
    const addEntry = () => {
      if (!lists.length) return;
      set('lists', [...data.lists, { listId: lists[0].id, status: settings.listStatuses[0] || '' }]);
    };
    return (
      <div style={{ border: `1.5px solid #e2e8f0`, borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', background: "#f8fafc", borderBottom: `1px solid #e2e8f0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: "#64748b", textTransform: 'uppercase', letterSpacing: '.5px' }}>Lists</span>
          <button onClick={addEntry} style={{ fontSize: '12px', fontWeight: 600, color: "#4f46e5", border: 'none', background: 'none', cursor: 'pointer', padding: '2px 7px', borderRadius: '5px' }}>+ Add to list</button>
        </div>
        {!data.lists.length
          ? <div style={{ padding: '14px', textAlign: 'center', color: "#94a3b8", fontSize: '12.5px' }}>Not in any list yet.</div>
          : data.lists.map((entry, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: `1px solid #f8fafc` }}>
              <Select value={entry.listId} onChange={e => { const nl = [...data.lists]; nl[i] = { ...nl[i], listId: e.target.value }; set('lists', nl); }} style={{ flex: 1, minWidth: 0, padding: '6px 28px 6px 9px', fontSize: '12px' }}>
                <option value="">— List —</option>
                {lists.slice().sort((a,b) => (a.name||'').localeCompare(b.name||'', undefined, {numeric:true})).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
              <span style={{ color: "#94a3b8", flexShrink: 0 }}>→</span>
              <Select value={entry.status} onChange={e => { const nl = [...data.lists]; nl[i] = { ...nl[i], status: e.target.value }; set('lists', nl); }} style={{ flex: 1, minWidth: 0, padding: '6px 28px 6px 9px', fontSize: '12px' }}>
                {settings.listStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <button onClick={() => set('lists', data.lists.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: "#94a3b8", fontSize: '16px', padding: '2px 5px', borderRadius: '4px' }}>×</button>
            </div>
          ))
        }
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Field label="Full Name"><Input value={data.name} onInput={e => set('name', e.target.value)} placeholder="Jane Doe" /></Field>
        <Field label="Phone"><Input value={data.phone} onInput={e => set('phone', e.target.value)} type="tel" placeholder="+1 555 000 0000" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Field label="Email"><Input value={data.email} onInput={e => set('email', e.target.value)} type="email" placeholder="jane@example.com" /></Field>
        <Field label="Social Handle"><Input value={data.handle} onInput={e => set('handle', e.target.value.replace(/^@+/, ''))} placeholder="username (no @)" /></Field>
      </div>
      <Field label="Location"><Input value={data.location} onInput={e => set('location', e.target.value)} placeholder="e.g. New York, NY" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Field label="Contact Status">
          <Select value={data.status} onChange={e => set('status', e.target.value)}>
            <option value="">— None —</option>
            {settings.contactStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Do Not Contact (DND)">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1.5px solid #fee2e2', borderRadius: '12px', background: data.dnd ? '#fef2f2' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
            <input type="checkbox" checked={!!data.dnd} onChange={e => set('dnd', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: data.dnd ? '#b91c1c' : '#475569' }}>
              Off-limits for campaigns
            </div>
          </label>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
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
      <Field label="List Assignments"><AssignBox /></Field>
      <Field label="Notes"><Textarea value={data.comment} onInput={e => set('comment', e.target.value)} placeholder="Any notes about this contact…" /></Field>
    </Modal>
  );
}
