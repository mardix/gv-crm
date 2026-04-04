import { useState, useEffect } from 'preact/hooks';
import { Badge } from '../components/Badge';
import { palFor, avatarColor, ini } from '../utils/utils';

export function ContactsView({ contacts, lists, settings, search, filterStatus, filterListId, filterListStatus, filterTag, sortCol, sortDir, onSort, onEdit, selectedIds, onSelect, onOpenMessage }) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterListId, filterListStatus, filterTag, sortCol, sortDir]);

  const rows = contacts.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterTag && !(c.tags || []).includes(filterTag)) return false;
    if (filterListId) {
      const e = (c.lists || []).find(e => e.listId === filterListId);
      if (!e) return false;
      if (filterListStatus && e.status !== filterListStatus) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return ['name', 'phone', 'email', 'handle', 'city', 'state'].some(k => (c[k] || '').toLowerCase().includes(q)) || (c.tags || []).some(t => t.toLowerCase().includes(q));
    }
    return true;
  }).sort((a, b) => {
    const va = (a[sortCol] || '').toString().toLowerCase(), vb = (b[sortCol] || '').toString().toLowerCase();
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const paginatedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!contacts.length) return <Empty icon="👤" text={"No contacts yet.\nClick + Add Contact to get started."} />;
  if (!rows.length) return <Empty icon="🔍" text="No contacts match your filters." />;

  const COLS = [
    { key: '_sel', label: '' },
    { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
    { key: 'handle', label: 'Handle' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' },
    { key: 'status', label: 'Status' }, { key: '_tags', label: 'Tags' }, { key: '_lists', label: 'Lists' }, { key: 'comment', label: 'Notes' },
  ];
  const colW = ['40px', '230px', '130px', '180px', '110px', '100px', '70px', '110px', '130px', '220px', '200px'];

  const thStyle = { background: '#f8fafc', padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', fontFamily: 'Inter,sans-serif', lineHeight: '1.4' };

  const allSelected = paginatedRows.length > 0 && paginatedRows.every(r => selectedIds.includes(r.id));

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingBottom: '90px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '12.5px' }}>
        <colgroup>{colW.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr>
            {COLS.map(({ key, label }) => (
              <th key={key} style={{ ...thStyle, ...(key === sortCol ? { color: "#4f46e5" } : {}), ...(key === 'comment' ? { borderRight: 'none' } : {}), ...(key === '_sel' ? { cursor: 'default' } : {}) }}
                onClick={() => !key.startsWith('_') && onSort(key)}>
                {key === '_sel' ? (
                  <input type="checkbox" checked={allSelected} onChange={() => onSelect(allSelected ? selectedIds.filter(id => !paginatedRows.find(r => r.id === id)) : [...new Set([...selectedIds, ...paginatedRows.map(r => r.id)])])} style={{ accentColor: '#4f46e5', cursor: 'pointer' }} />
                ) : (
                  <>
                    {label}{key === sortCol ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map(c => <ContactRow key={c.id} c={c} lists={lists} settings={settings} onClick={() => onEdit(c)} selected={selectedIds.includes(c.id)} onToggle={() => onSelect(selectedIds.includes(c.id) ? selectedIds.filter(id => id !== c.id) : [...selectedIds, c.id])} onOpenMessage={onOpenMessage} />)}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderTop: '1px solid #e2e8f0', position: 'sticky', left: 0 }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
            Showing <span style={{ fontWeight: 800, color: '#0f172a' }}>{(page - 1) * PAGE_SIZE + 1}</span> to <span style={{ fontWeight: 800, color: '#0f172a' }}>{Math.min(page * PAGE_SIZE, rows.length)}</span> of <span style={{ fontWeight: 800, color: '#0f172a' }}>{rows.length}</span> contacts
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, color: page === 1 ? '#cbd5e1' : '#0f172a', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Prev
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', fontSize: '13px', fontWeight: 800, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              {page} / {totalPages}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, color: page === totalPages ? '#cbd5e1' : '#0f172a', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactRow({ c, lists, settings, onClick, selected, onToggle, onOpenMessage }) {
  const [hover, setHover] = useState(false);
  const tdStyle = { padding: '11px 14px', background: '#ffffff', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', verticalAlign: 'middle', overflow: 'hidden', color: '#334155', fontSize: '12.5px', lineHeight: '1.4' };
  const td = { ...tdStyle, background: hover ? '#f5f3ff' : '#fff' };
  const tdLast = { ...td, borderRight: 'none' };
  const textStyle = { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12.5px', color: '#334155', fontFamily: 'Inter,sans-serif', lineHeight: '1.4', margin: 0, padding: 0 };
  const wrapStyle = { ...textStyle, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' };
  const monoStyle = { ...textStyle, fontFamily: '"DM Mono",monospace', fontSize: '11.5px', color: '#334155' };
  const mutedStyle = { ...textStyle, color: '#94a3b8' };

  const [bg, fg] = c.status ? palFor(c.status, settings.contactStatuses) : ['', ''];

  return (
    <tr style={{ cursor: 'pointer', color: '#334155', background: selected ? '#f5f3ff' : '#fff' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick}>
      <td style={{ ...td, cursor: 'default' }} onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggle} style={{ cursor: 'pointer' }} />
      </td>
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {c.phone && (
            <button onClick={e => { e.stopPropagation(); onOpenMessage(c.phone); }} style={{
              border: '1px solid #e2e8f0', cursor: 'pointer', flexShrink: 0,
              background: '#ffffff', color: '#4f46e5',
              padding: '5px 8px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }} title="Open Conversation"
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
            >
              <span style={{ fontSize: '13px', lineHeight: 1 }}>💬</span>
            </button>
          )}
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', color: '#fff', background: avatarColor(c.name), fontFamily: 'Inter,sans-serif' }}>{ini(c.name)}</div>
          <span style={{ fontWeight: 600, fontSize: '12.5px', color: c.dnd ? '#ef4444' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter,sans-serif', lineHeight: '1.4' }}>{c.name || '—'} {c.dnd && <span title="Do Not Contact">🚫</span>}</span>
        </div>
      </td>
      <td style={td}><span style={monoStyle}>{c.phone || '—'}</span></td>
      <td style={td}><span style={textStyle}>{c.email || '—'}</span></td>
      <td style={td}><span style={{ ...monoStyle, color: c.handle ? "#4f46e5" : "#94a3b8" }}>{c.handle ? '@' + c.handle : '—'}</span></td>
      <td style={td}><span style={textStyle}>{c.city || '—'}</span></td>
      <td style={td}><span style={textStyle}>{c.state || '—'}</span></td>
      <td style={td}>{c.status ? <Badge text={c.status} bg={bg} fg={fg} /> : <span style={mutedStyle}>—</span>}</td>
      <td style={td}>
        {(c.tags || []).length
          ? <div style={{ display: 'flex', gap: '3px', overflow: 'hidden' }}>
            {(c.tags || []).slice(0, 3).map((t, i) => <span key={i} style={{ flexShrink: 0, padding: '2px 7px', background: '#f1f5f9', border: `1px solid #e2e8f0`, borderRadius: '99px', fontSize: '11px', color: "#64748b", whiteSpace: 'nowrap' }}>{t}</span>)}
            {(c.tags || []).length > 3 && <span style={{ flexShrink: 0, padding: '2px 7px', background: '#f1f5f9', border: `1px solid #e2e8f0`, borderRadius: '99px', fontSize: '11px', color: "#64748b" }}>+{(c.tags || []).length - 3}</span>}
          </div>
          : <span style={mutedStyle}>—</span>}
      </td>
      <td style={td}>
        {(c.lists || []).filter(e => lists.find(l => l.id === e.listId)).length
          ? <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
            {(c.lists || []).filter(e => lists.find(l => l.id === e.listId)).map((e, i) => {
              const l = lists.find(l => l.id === e.listId);
              const [ebg, efg] = palFor(e.status, settings.listStatuses);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'stretch', borderRadius: '99px', border: `1px solid #e2e8f0`, overflow: 'hidden', height: '18px', maxWidth: '100%' }}>
                  <span style={{ padding: '0 6px', background: '#f1f5f9', color: "#334155", fontWeight: 600, borderRight: `1px solid #e2e8f0`, display: 'flex', alignItems: 'center', fontSize: '10.5px', maxWidth: '86px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{l.name}</span>
                  <span style={{ padding: '0 6px', display: 'flex', alignItems: 'center', fontSize: '10.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', background: ebg, color: efg }}>{e.status || '—'}</span>
                </div>
              );
            })}
          </div>
          : <span style={mutedStyle}>—</span>}
      </td>
      <td style={tdLast}><span style={wrapStyle}>{c.comment || ''}</span></td>
    </tr>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '38px', marginBottom: '12px', opacity: .3 }}>{icon}</div>
      <div style={{ fontSize: '13.5px', lineHeight: '1.6', textAlign: 'center', color: '#64748b', fontFamily: 'Inter,sans-serif' }} dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }}></div>
    </div>
  );
}
