import { useState, useEffect, useRef } from 'preact/hooks';
import { Badge } from '../components/Badge';
import { palFor, avatarColor, ini, numericNameKey, sanitizeName } from '../utils/utils';

function sanitizeSortValue(val) {
  if (val === undefined || val === null) return '';
  const str = sanitizeName(val).toLowerCase();
  const numericKey = numericNameKey(str);
  if (numericKey) return numericKey;
  return str;
}

export function ContactsView({ contacts, lists, settings, search, filterStatus, filterListId, filterListStatus, filterTag, filterMembershipLevel, filterLeadSource, filterCategory, sortCol, sortDir, onSort, onEdit, selectedIds, onSelect, onOpenMessage, freezeCols }) {
  const [page, setPage] = useState(1);
  const containerRef = useRef(null);
  const PAGE_SIZE = 100;

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterListId, filterListStatus, filterTag, filterMembershipLevel, filterLeadSource, filterCategory, sortCol, sortDir]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [page]);

  const rows = contacts.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterTag && !(c.tags || []).includes(filterTag)) return false;
    if (filterMembershipLevel && c.membershipLevel !== filterMembershipLevel) return false;
    if (filterLeadSource && c.leadSource !== filterLeadSource) return false;
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterListId) {
      const e = (c.lists || []).find(e => String(e.listId) === String(filterListId));
      if (!e) return false;
      if (filterListStatus && e.status !== filterListStatus) return false;
    }
    if (search) {
      const q = search.trim().toLowerCase();
      if (q.startsWith('?')) {
        const getFieldValue = (c, f) => {
          if (f === 'membership') return c.membershipLevel || '';
          if (f === 'leadsource' || f === 'source') return c.leadSource || '';
          if (f === 'comment' || f === 'note') return c.comment || '';
          return c[f] || '';
        };

        const segments = q.split('?').map(s => s.trim()).filter(Boolean);
        const textQueries = [];
        for (const segment of segments) {
          let matched = false;
          if (segment.startsWith('has:') || segment.startsWith('no:')) {
            const isHas = segment.startsWith('has:');
            const field = segment.slice(isHas ? 4 : 3).trim();
            if (['name', 'email', 'phone', 'list', 'handle', 'status', 'membership', 'category', 'location', 'leadsource', 'source', 'comment', 'note', 'tag'].includes(field)) {
              matched = true;
              let filled = false;
              if (field === 'list') {
                filled = !!(c.lists && c.lists.length > 0);
              } else if (field === 'tag') {
                filled = !!(c.tags && c.tags.length > 0);
              } else {
                filled = !!getFieldValue(c, field).trim();
              }
              if (isHas ? !filled : filled) return false;
            }
          } else if (segment.includes('=')) {
            const idx = segment.indexOf('=');
            const left = segment.slice(0, idx).trim();
            const right = segment.slice(idx + 1).trim();

            let field = left;
            let operator = 'eq';
            if (left.includes(':')) {
              const parts = left.split(':');
              field = parts[0].trim();
              operator = parts[1].trim();
            }

            if (['name', 'email', 'phone', 'list', 'handle', 'membership', 'category', 'location', 'status', 'leadsource', 'source', 'comment', 'note', 'tag'].includes(field)) {
              matched = true;
              const values = right.split(',').map(v => v.trim()).filter(Boolean);

              if (field === 'list') {
                const targetListIds = lists
                  .filter(l => values.includes(String(l.id).toLowerCase()) || values.includes((l.name || '').toLowerCase()))
                  .map(l => String(l.id));

                const hasListMembership = (c.lists || []).some(m => targetListIds.includes(String(m.listId)));

                if (operator === 'nin' || operator === 'notin' || operator === 'ne') {
                  if (hasListMembership) return false;
                } else {
                  if (!hasListMembership) return false;
                }
              } else if (field === 'tag') {
                const cTags = (c.tags || []).map(t => t.toLowerCase());
                const matchedTag = values.some(v => {
                  if (operator === 'like' || operator === 'contains') {
                    return cTags.some(t => t.includes(v));
                  }
                  return cTags.includes(v);
                });
                if (operator === 'nin' || operator === 'notin' || operator === 'ne') {
                  if (matchedTag) return false;
                } else {
                  if (!matchedTag) return false;
                }
              } else if (field === 'phone') {
                const cVal = c.phone || '';
                const cDigits = cVal.replace(/\D/g, '');
                let normC = cDigits;
                if (normC.startsWith('1') && normC.length > 10) normC = normC.slice(1);

                const matchedPhone = values.some(v => {
                  const qDigits = v.replace(/\D/g, '');
                  let normQ = qDigits;
                  if (normQ.startsWith('1') && normQ.length > 10) normQ = normQ.slice(1);

                  if (operator === 'like' || operator === 'contains') {
                    return normC.includes(normQ);
                  }
                  return normC === normQ;
                });

                if (operator === 'nin' || operator === 'notin' || operator === 'ne') {
                  if (matchedPhone) return false;
                } else {
                  if (!matchedPhone) return false;
                }
              } else {
                const cVal = getFieldValue(c, field);
                const cValLower = cVal.toLowerCase();
                if (operator === 'in' || operator === 'eq') {
                  if (!values.includes(cValLower)) return false;
                } else if (operator === 'nin' || operator === 'notin' || operator === 'ne') {
                  if (values.includes(cValLower)) return false;
                } else if (operator === 'like' || operator === 'contains') {
                  const matches = values.some(v => cValLower.includes(v));
                  if (!matches) return false;
                }
              }
            }
          }
          if (!matched) {
            textQueries.push(segment);
          }
        }
        if (textQueries.length > 0) {
          const textSearch = textQueries.join(' ');
          return ['name', 'email', 'handle', 'location', 'membershipLevel', 'leadSource', 'category'].some(k => (c[k] || '').toLowerCase().includes(textSearch)) ||
            (c.tags || []).some(t => t.toLowerCase().includes(textSearch)) ||
            (() => {
              const cPhone = c.phone || '';
              if (cPhone.toLowerCase().includes(textSearch)) return true;
              const qDigits = textSearch.replace(/\D/g, '');
              if (qDigits.length >= 3) {
                const cDigits = cPhone.replace(/\D/g, '');
                let normQ = qDigits;
                if (normQ.startsWith('1') && normQ.length > 10) normQ = normQ.slice(1);
                let normC = cDigits;
                if (normC.startsWith('1') && normC.length > 10) normC = normC.slice(1);
                return normC.includes(normQ);
              }
              return false;
            })();
        }
        return true;
      } else if (q === '##') {
        return !!numericNameKey(c.name);
      } else if (q === '!#') {
        const nameTrimmed = sanitizeName(c.name);
        if (!nameTrimmed) return false;
        return !numericNameKey(nameTrimmed);
      } else if (q.startsWith('#')) {
        const searchDigits = q.slice(1).replace(/\D/g, '');
        if (searchDigits.length > 0) {
          const digits = (c.phone || '').replace(/\D/g, '');
          let strippedDigits = digits;
          if (strippedDigits.startsWith('1') && strippedDigits.length > 10) {
            strippedDigits = strippedDigits.slice(1);
          }
          return digits.startsWith(searchDigits) || strippedDigits.startsWith(searchDigits);
        } else {
          const queryText = q.slice(1).trim();
          if (queryText.length > 0) {
            return ['name', 'email', 'handle', 'status', 'location', 'membershipLevel', 'leadSource', 'category'].some(k => (c[k] || '').toLowerCase().includes(queryText)) ||
              (c.tags || []).some(t => t.toLowerCase().includes(queryText)) ||
              (() => {
                const cPhone = c.phone || '';
                if (cPhone.toLowerCase().includes(queryText)) return true;
                const qDigits = queryText.replace(/\D/g, '');
                if (qDigits.length >= 3) {
                  const cDigits = cPhone.replace(/\D/g, '');
                  let normQ = qDigits;
                  if (normQ.startsWith('1') && normQ.length > 10) normQ = normQ.slice(1);
                  let normC = cDigits;
                  if (normC.startsWith('1') && normC.length > 10) normC = normC.slice(1);
                  return normC.includes(normQ);
                }
                return false;
              })();
          }
          return true;
        }
      } else {
        return ['name', 'email', 'handle', 'location', 'membershipLevel', 'leadSource', 'category'].some(k => (c[k] || '').toLowerCase().includes(q)) ||
          (c.tags || []).some(t => t.toLowerCase().includes(q)) ||
          (() => {
            const cPhone = c.phone || '';
            if (cPhone.toLowerCase().includes(q)) return true;
            const qDigits = q.replace(/\D/g, '');
            if (qDigits.length >= 3) {
              const cDigits = cPhone.replace(/\D/g, '');
              let normQ = qDigits;
              if (normQ.startsWith('1') && normQ.length > 10) normQ = normQ.slice(1);
              let normC = cDigits;
              if (normC.startsWith('1') && normC.length > 10) normC = normC.slice(1);
              return normC.includes(normQ);
            }
            return false;
          })();
      }
    }
    return true;
  }).sort((a, b) => {
    const va = sanitizeSortValue(a[sortCol]);
    const vb = sanitizeSortValue(b[sortCol]);
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const paginatedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!contacts.length) return <Empty icon="👤" text={"No contacts yet.\nClick + Add Contact to get started."} />;
  if (!rows.length) return <Empty icon="🔍" text="No contacts match your filters." />;

  const COLS = [
    { key: '_sel', label: '' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'membershipLevel', label: 'Membership' },
    { key: 'leadSource', label: 'Source' },
    { key: 'category', label: 'Category' },
    { key: 'handle', label: 'Handle' },
    { key: 'location', label: 'Location' },
    { key: '_lists', label: 'Lists' },
    { key: 'comment', label: 'Notes' },
  ];
  const colW = [
    '40px',
    '230px',
    '120px',
    '130px',
    '130px',
    '120px',
    '120px',
    '120px',
    '150px',
    '130px',
    '250px',
    '250px'
  ];

  const thStyle = { background: '#ffffff', padding: '12px 14px', textAlign: 'left', fontSize: '10.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.8px', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', fontFamily: 'Inter,sans-serif', lineHeight: '1.4' };

  const allSelected = paginatedRows.length > 0 && paginatedRows.every(r => selectedIds.includes(r.id));

  const getThStyle = (key) => {
    const isSticky = freezeCols && ['_sel', 'name', 'phone'].includes(key);
    let leftOffset = undefined;
    if (freezeCols) {
      if (key === '_sel') leftOffset = '0px';
      else if (key === 'name') leftOffset = '40px';
      else if (key === 'phone') leftOffset = '270px';
    }
    return {
      ...thStyle,
      ...(key === sortCol ? { color: "#4f46e5", borderBottom: '2px solid #4f46e5' } : {}),
      ...(key === '_sel' ? { cursor: 'default' } : {}),
      background: '#f8fafc',
      ...(isSticky ? {
        position: 'sticky',
        left: leftOffset,
        zIndex: 12,
        boxShadow: '0 6px 0 0 #f8fafc, 0 -6px 0 0 #f8fafc',
        ...(key === 'phone' ? { borderRight: '2px solid #cbd5e1' } : {})
      } : {})
    };
  };

  return (
    <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: `0 24px ${totalPages > 1 ? '0px' : '24px'} 24px`, background: '#f8fafc' }}>
      <div style={{ height: '20px' }} />
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', marginTop: '-8px', tableLayout: 'fixed', fontSize: '12.5px' }}>
        <colgroup>{colW.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr>
            {COLS.map(({ key, label }) => (
              <th key={key} style={getThStyle(key)}
                onClick={() => !key.startsWith('_') && onSort(key)}>
                {key === '_sel' ? (
                  <input type="checkbox" checked={allSelected} onChange={() => onSelect(allSelected ? selectedIds.filter(id => !paginatedRows.find(r => r.id === id)) : [...new Set([...selectedIds, ...paginatedRows.map(r => r.id)])])} style={{ accentColor: '#4f46e5', cursor: 'pointer', width: '15px', height: '15px' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label}
                    {key === sortCol && (
                      <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold' }}>
                        {sortDir === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map(c => <ContactRow key={c.id} c={c} lists={lists} settings={settings} onClick={() => onEdit(c)} selected={selectedIds.includes(c.id)} onToggle={() => onSelect(selectedIds.includes(c.id) ? selectedIds.filter(id => id !== c.id) : [...selectedIds, c.id])} onOpenMessage={onOpenMessage} freezeCols={freezeCols} />)}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          position: 'relative',
          left: 0,
          right: 0,
          zIndex: 9,
          marginLeft: '-24px',
          marginRight: '-24px',
          marginTop: '20px',
          boxShadow: 'none'
        }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
            Showing <span style={{ fontWeight: 800, color: '#0f172a' }}>{(page - 1) * PAGE_SIZE + 1}</span> to <span style={{ fontWeight: 800, color: '#0f172a' }}>{Math.min(page * PAGE_SIZE, rows.length)}</span> of <span style={{ fontWeight: 800, color: '#0f172a' }}>{rows.length}</span> contacts
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: page === 1 ? '#94a3b8' : '#334155',
                background: page === 1 ? '#f8fafc' : '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: page === 1 ? 'none' : '0 1px 2px rgba(15,23,42,0.04)'
              }}
              onMouseEnter={e => {
                if (page !== 1) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }
              }}
              onMouseLeave={e => {
                if (page !== 1) {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              Prev
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 12px',
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#334155',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {page} / {totalPages}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: page === totalPages ? '#94a3b8' : '#334155',
                background: page === totalPages ? '#f8fafc' : '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: page === totalPages ? 'none' : '0 1px 2px rgba(15,23,42,0.04)'
              }}
              onMouseEnter={e => {
                if (page !== totalPages) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }
              }}
              onMouseLeave={e => {
                if (page !== totalPages) {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactRow({ c, lists, settings, onClick, selected, onToggle, onOpenMessage, freezeCols }) {
  const [hover, setHover] = useState(false);

  const getTdStyle = (isFirst, isLast, colKey) => {
    const baseBorderColor = selected ? '#c7d2fe' : hover ? '#cbd5e1' : '#e2e8f0';
    const isSticky = freezeCols && ['_sel', 'name', 'phone'].includes(colKey);
    let leftOffset = undefined;
    if (freezeCols) {
      if (colKey === '_sel') leftOffset = '0px';
      else if (colKey === 'name') leftOffset = '40px';
      else if (colKey === 'phone') leftOffset = '270px';
    }
    return {
      padding: '14px 14px',
      verticalAlign: 'middle',
      overflow: 'hidden',
      color: '#334155',
      fontSize: '12.5px',
      lineHeight: '1.4',
      background: selected ? '#f5f3ff' : hover ? '#f8fafc' : '#ffffff',
      borderTop: `1px solid ${baseBorderColor}`,
      borderBottom: `1px solid ${baseBorderColor}`,
      transition: 'all 0.15s ease',
      ...(isFirst ? {
        borderLeft: `1px solid ${baseBorderColor}`,
        borderTopLeftRadius: '10px',
        borderBottomLeftRadius: '10px'
      } : {}),
      ...(isLast ? {
        borderRight: `1px solid ${baseBorderColor}`,
        borderTopRightRadius: '10px',
        borderBottomRightRadius: '10px'
      } : {}),
      ...(isSticky ? {
        position: 'sticky',
        left: leftOffset,
        zIndex: 2,
        boxShadow: '0 6px 0 0 #f8fafc, 0 -6px 0 0 #f8fafc',
        ...(colKey === 'phone' ? { borderRight: '2px solid #cbd5e1' } : {})
      } : {})
    };
  };

  const textStyle = { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12.5px', color: '#334155', fontFamily: 'Inter,sans-serif', lineHeight: '1.4', margin: 0, padding: 0 };
  const wrapStyle = { ...textStyle, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', color: '#475569' };
  const monoStyle = { ...textStyle, fontFamily: '"DM Mono",monospace', fontSize: '11.5px', color: '#334155' };
  const mutedStyle = { ...textStyle, color: '#cbd5e1' };

  const [bg, fg] = c.status ? palFor(c.status, settings.contactStatuses) : ['', ''];

  return (
    <tr
      style={{
        cursor: 'pointer',
        color: '#334155',
        transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.15s ease'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <td style={{ ...getTdStyle(true, false, '_sel'), cursor: 'default' }} onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggle} style={{ cursor: 'pointer', accentColor: '#4f46e5', width: '15px', height: '15px' }} />
      </td>
      <td style={getTdStyle(false, false, 'name')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {c.phone && (window.location.host.includes('voice.google.com') || settings.showConversationIcon !== false) && (
            <button
              onClick={e => { e.stopPropagation(); onOpenMessage(c.phone); }}
              style={{
                width: '28px',
                height: '28px',
                border: '1px solid #bbf7d0',
                cursor: 'pointer',
                flexShrink: 0,
                background: '#f0fdf4',
                color: '#10b981',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 2px rgba(16, 185, 129, 0.05)',
                padding: 0
              }}
              title="Open Conversation"
              onMouseEnter={e => {
                e.currentTarget.style.background = '#10b981';
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-1.5px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f0fdf4';
                e.currentTarget.style.borderColor = '#bbf7d0';
                e.currentTarget.style.color = '#10b981';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(16, 185, 129, 0.05)';
              }}
            >
              <div style={{
                width: '12px',
                height: '9px',
                background: 'currentColor',
                borderRadius: '2px',
                position: 'relative',
                display: 'inline-block',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '3px',
                  width: '4px',
                  height: '4px',
                  background: 'currentColor',
                  transform: 'rotate(45deg)',
                  borderRadius: '1px'
                }} />
              </div>
            </button>
          )}
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', color: '#fff', background: avatarColor(c.name), fontFamily: 'Inter,sans-serif', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>{ini(c.name)}</div>
          <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter,sans-serif', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {c.name || '—'}
            {c.dnd && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#ef4444',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  padding: '1px 4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  lineHeight: 1
                }}
                title="Do Not Contact"
              >
                DND
              </span>
            )}
          </span>
        </div>
      </td>
      <td style={getTdStyle(false, false, 'phone')}><span style={monoStyle}>{c.phone || '—'}</span></td>
      <td style={getTdStyle(false, false, 'email')}><span style={textStyle}>{c.email || '—'}</span></td>
      <td style={getTdStyle(false, false, 'status')}>{c.status ? <Badge text={c.status} bg={bg} fg={fg} /> : <span style={mutedStyle}>—</span>}</td>
      <td style={getTdStyle(false, false, 'membershipLevel')}>
        {c.membershipLevel ? (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            padding: '3px 8px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            display: 'inline-block'
          }}>{c.membershipLevel}</span>
        ) : <span style={mutedStyle}>—</span>}
      </td>
      <td style={getTdStyle(false, false, 'leadSource')}>
        {c.leadSource ? (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            padding: '3px 8px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            display: 'inline-block'
          }}>{c.leadSource}</span>
        ) : <span style={mutedStyle}>—</span>}
      </td>
      <td style={getTdStyle(false, false, 'category')}>
        {c.category ? (
          <span style={{
            fontSize: '11.5px',
            fontWeight: 700,
            background: '#f5f3ff',
            color: '#5b21b6',
            border: '1px solid #ddd6fe',
            padding: '3px 8px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            display: 'inline-block'
          }}>{c.category}</span>
        ) : <span style={mutedStyle}>—</span>}
      </td>
      <td style={getTdStyle(false, false, 'handle')}>
        {c.handle ? (
          <span style={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: '11px',
            fontWeight: 600,
            color: '#4f46e5',
            background: '#eef2ff',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid #dbeafe',
            whiteSpace: 'nowrap',
            display: 'inline-block'
          }}>
            @{c.handle}
          </span>
        ) : (
          <span style={mutedStyle}>—</span>
        )}
      </td>
      <td style={getTdStyle(false, false, 'location')}><span style={textStyle}>{c.location || '—'}</span></td>
      <td style={getTdStyle(false, false, '_lists')}>
        {((c.lists || []).filter(e => (lists || []).find(l => String(l.id) === String(e.listId))).length > 0) ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '100%' }}>
            {(c.lists || []).filter(e => (lists || []).find(l => String(l.id) === String(e.listId))).map((e, i) => {
              const l = (lists || []).find(l => String(l.id) === String(e.listId));
              if (!l) return null;
              const [ebg, efg] = palFor(e.status, settings.listStatuses);
              return (
                <div key={i} style={{
                  display: 'inline-flex',
                  alignItems: 'stretch',
                  borderRadius: '6px',
                  border: `1px solid #e2e8f0`,
                  overflow: 'hidden',
                  height: '20px',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.02)'
                }}>
                  <span style={{
                    padding: '0 8px',
                    background: '#f8fafc',
                    color: "#475569",
                    fontWeight: 700,
                    borderRight: `1px solid #e2e8f0`,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '10px',
                    maxWidth: '85px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>{l.name}</span>
                  <span style={{
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    background: ebg || '#f1f5f9',
                    color: efg || '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>{e.status || '—'}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <span style={mutedStyle}>—</span>
        )}
      </td>
      <td style={getTdStyle(false, true, 'comment')}>
        {c.comment ? (
          <span style={{
            ...wrapStyle,
            color: '#64748b',
            fontSize: '12px',
            lineHeight: '1.5',
            maxHeight: '44px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }} title={c.comment}>{c.comment}</span>
        ) : (
          <span style={mutedStyle}>—</span>
        )}
      </td>
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
