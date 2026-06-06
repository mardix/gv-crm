import { useState } from 'preact/hooks';
import { Badge } from '../components/Badge';
import { Btn } from '../components/Btn';
import { palFor, campaignPhones, CAMP_PAL, avatarColor, ini } from '../utils/utils';

export function ListsView({ lists, contacts, settings, search, onEdit, onDelete, onFilter }) {
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
  const filtered = lists.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()));
  const activeLists = filtered.filter(l => l.status !== 'inactive').sort((a,b) => (a.name||'').localeCompare(b.name||'', undefined, {numeric:true}));
  const inactiveLists = filtered.filter(l => l.status === 'inactive').sort((a,b) => (a.name||'').localeCompare(b.name||'', undefined, {numeric:true}));

  if (!filtered.length) return <Empty icon="📋" text={"No lists yet.\nClick + Create List to get started."} />;

  const renderListCard = (list) => {
    const assigned = contacts.filter(c => (c.lists || []).some(e => e.listId === list.id));
    const bk = {};
    assigned.forEach(c => { const e = (c.lists || []).find(e => e.listId === list.id); if (e?.status) bk[e.status] = (bk[e.status] || 0) + 1; });

    return (
      <div 
        key={list.id} 
        style={{ 
          background: '#ffffff', 
          border: `1px solid #e2e8f0`, 
          borderRadius: '10px', 
          padding: '14px 20px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          transition: 'all 0.15s ease',
          cursor: 'default'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#f8fafc';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        {/* Left Content Column */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: 0 }}>
          
          {/* Title & Description Stack */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 700, color: list.status === 'inactive' ? '#64748b' : '#0f172a', fontFamily: 'Inter,sans-serif', lineHeight: '1.4' }}>{list.name}</span>
                {list.status === 'inactive' && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2 }}>Inactive</span>
                )}
              </div>
              <span style={{ 
                flexShrink: 0, 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#475569', 
                background: '#e2e8f0', 
                padding: '2px 7px', 
                borderRadius: '4px', 
                fontFamily: 'Inter,sans-serif',
                fontVariantNumeric: 'tabular-nums',
                marginTop: '2px'
              }}>
                {assigned.length} contact{assigned.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ 
              fontSize: '12.5px', 
              color: '#64748b', 
              lineHeight: '1.4', 
              wordBreak: 'break-word', 
              fontFamily: 'Inter,sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {list.description || 'No description provided.'}
            </div>
          </div>
        </div>

        {/* Middle: Status Distribution tags (horizontal) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, maxWidth: '280px', overflow: 'hidden', flexWrap: 'nowrap' }}>
          {Object.entries(bk).length > 0 ? (
            Object.entries(bk).slice(0, 3).map(([st, n]) => {
              const [bg, fg] = palFor(st, settings.listStatuses);
              return <Badge key={st} text={st + ' · ' + n} bg={bg} fg={fg} />;
            })
          ) : (
            <span style={{ fontSize: '11.5px', color: '#cbd5e1', fontStyle: 'italic' }}>No distribution</span>
          )}
          {Object.entries(bk).length > 3 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#94a3b8',
              padding: '2px'
            }}>
              +{Object.entries(bk).length - 3}
            </span>
          )}
        </div>

        {/* Right: Tactile Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button 
            onClick={() => onFilter(list.id)}
            style={{ 
              padding: '7px 14px', 
              background: '#0f172a', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '6px', 
              fontFamily: 'Inter,sans-serif', 
              fontSize: '12px', 
              fontWeight: 700, 
              cursor: 'pointer',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
          >
            View
          </button>
          
          <button 
            onClick={() => onEdit(list)}
            style={{ 
              padding: '6px 12px', 
              background: '#ffffff', 
              color: '#475569', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px', 
              fontFamily: 'Inter,sans-serif', 
              fontSize: '12px', 
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.background = '#f8fafc';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            Edit
          </button>

          <button 
            onClick={() => onDelete(list.id)}
            style={{ 
              padding: '6px 10px', 
              background: 'transparent', 
              color: '#94a3b8', 
              border: 'none', 
              borderRadius: '6px', 
              fontFamily: 'Inter,sans-serif', 
              fontSize: '12px', 
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff' }}>
      {/* Active Lists */}
      {activeLists.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {inactiveLists.length > 0 && (
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              🟢 Active Lists ({activeLists.length})
            </div>
          )}
          {activeLists.map(renderListCard)}
        </div>
      )}

      {/* Inactive Lists */}
      {inactiveLists.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: activeLists.length > 0 ? '10px' : '0px' }}>
          <div 
            onClick={() => setInactiveExpanded(prev => !prev)}
            style={{ 
              fontSize: '11px', 
              fontWeight: 800, 
              color: '#64748b', 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px', 
              marginBottom: '4px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              width: 'max-content'
            }}
          >
            ⚫ Inactive Lists ({inactiveLists.length})
            <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', color: '#94a3b8', letterSpacing: 'normal' }}>(hidden in selectors)</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'inline-block', transition: 'transform 0.15s ease', transform: inactiveExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
          </div>
          {inactiveExpanded && inactiveLists.map(renderListCard)}
        </div>
      )}
    </div>
  );
}

function downloadReport(camp, totalCount, livePhones) {
  const log = camp.log || [];

  // Build full roster: snapshot → live preview → log-only fallback
  const roster = camp.recipients && camp.recipients.length > 0
    ? camp.recipients.map(r => {
      const entry = log.find(l => l.phone === r.phone);
      if (!entry) return { ...r, status: 'PENDING', ts: null, error: '' };
      return { ...r, name: r.name || entry.name, status: entry.ok ? 'SUCCESS' : 'FAILED', ts: entry.ts, error: entry.error || '' };
    })
    : livePhones && livePhones.length > 0
      ? livePhones.map(p => ({ phone: p.phone, name: p.name || '', status: 'PENDING', ts: null, error: '' }))
      : log.map(l => ({ phone: l.phone, name: l.name, status: l.ok ? 'SUCCESS' : 'FAILED', ts: l.ts, error: l.error || '' }));

  const rows = [
    ['Campaign Name', camp.name],
    ['Status', camp.status || 'draft'],
    ['Message Template', camp.message || ''],
    ['Image URL', camp.imageDataUrl || 'None'],
    ['Total Recipients', totalCount],
    ['Sent Successfully', roster.filter(r => r.status === 'SUCCESS').length],
    ['Failed', roster.filter(r => r.status === 'FAILED').length],
    ['Pending', roster.filter(r => r.status === 'PENDING').length],
    [],
    ['Date / Time', 'Recipient Name', 'Phone', 'Status', 'Error / Log']
  ];

  roster.forEach(r => {
    rows.push([
      r.ts ? new Date(r.ts).toLocaleString() : '—',
      r.name || 'Private',
      r.phone,
      r.status,
      r.error || ''
    ]);
  });

  const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `report-${camp.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


function renderMessageWithHighlightedTokens(message) {
  if (!message) return null;
  const parts = message.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, index) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      return (
        <span
          key={index}
          style={{
            background: '#eef2ff',
            color: '#4338ca',
            border: '1.5px solid #c7d2fe',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            display: 'inline-block',
            margin: '0 2px',
            verticalAlign: 'middle'
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function CampaignCard({ camp, contacts, lists, activeStatus, isStandalone, forms, onEdit, onUpdate, onDelete, onDuplicate, isExpanded, onToggleExpanded }) {
  const [reportExpanded, setReportExpanded] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('all'); // all, sent, failed, pending
  const [visibleCount, setVisibleCount] = useState(25);

  const [sbg, sfg] = CAMP_PAL[camp.status] || CAMP_PAL.draft;
  const isLocked = !['draft', 'ready'].includes(camp.status);
  const livePhones = campaignPhones(camp.listIds || [], contacts);
  const totalCount = isLocked && camp.totalRecipients != null ? camp.totalRecipients : livePhones.length;
  const log = camp.log || [];
  const sent = log.filter(l => l.ok).length, failed = log.filter(l => !l.ok).length;
  const pendingCount = totalCount - log.length;
  const showAsPaused = camp.status === 'paused' || (camp.status === 'done' && (failed > 0 || pendingCount > 0));
  const isDraft = !isLocked;

  const listNames = (camp.listIds || []).map(entry => {
    const id = typeof entry === 'string' ? entry : entry.listId;
    const status = typeof entry === 'string' ? '' : entry.status;
    const l = lists.find(x => x.id === id);
    return l ? `${l.name}${status ? ` (${status})` : ''}` : null;
  }).filter(Boolean).join(', ');

  const rawRoster = camp.recipients && camp.recipients.length > 0
    ? camp.recipients.map(r => {
      const entry = log.find(l => l.phone === r.phone);
      if (!entry) return { ...r, status: 'pending' };
      return { ...r, name: r.name || entry.name, status: entry.ok ? 'sent' : 'failed', ts: entry.ts, error: entry.error };
    })
    : isDraft && livePhones.length > 0
      ? livePhones.map(p => ({ phone: p.phone, name: p.name || '', status: 'pending' }))
      : log.map(l => ({ phone: l.phone, name: l.name, status: l.ok ? 'sent' : 'failed', ts: l.ts, error: l.error }));

  const filteredRoster = rawRoster.filter(r => {
    if (logFilter !== 'all') {
      if (logFilter === 'sent' && r.status !== 'sent') return false;
      if (logFilter === 'failed' && r.status !== 'failed') return false;
      if (logFilter === 'pending' && r.status !== 'pending') return false;
    }
    if (logSearch) {
      const q = logSearch.toLowerCase();
      return (r.name || '').toLowerCase().includes(q) || (r.phone || '').includes(q) || (r.error || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className={`campaign-card-container ${isExpanded ? 'expanded' : ''}`}>
      {/* COMPACT HEADER */}
      <div
        style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', background: isExpanded ? '#fbfcfe' : 'transparent', transition: 'background-color 0.2s' }}
        onClick={onToggleExpanded}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: camp.type === 'form' ? '#fdf2f8' : '#eef2ff',
          border: `1.5px solid ${camp.type === 'form' ? '#fbcfe8' : '#e0e7ff'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          {camp.type === 'form' ? '📋' : '💬'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '16.5px', fontWeight: 800, color: "#0f172a", lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{camp.name}</div>
            <Badge text={camp.status || 'draft'} bg={sbg} fg={sfg} />
            <Badge text={camp.type === 'form' ? 'Form Sync' : 'SMS Broadcast'} bg={camp.type === 'form' ? '#fdf2f8' : '#eef2ff'} fg={camp.type === 'form' ? '#db2777' : '#4f46e5'} />
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
              {totalCount} recipient{totalCount !== 1 ? 's' : ''}
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
              {listNames || 'Internal Selection'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: 1 }}>Created</div>
          <div style={{ fontSize: '13px', color: '#475569', fontWeight: 800, lineHeight: 1 }}>{new Date(camp.createdAt || Date.now()).toLocaleDateString()}</div>
        </div>

        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#94a3b8',
          background: isExpanded ? '#f8fafc' : '#ffffff',
          transition: 'all 0.2s',
          transform: isExpanded ? 'rotate(180deg)' : 'none',
          cursor: 'pointer',
          marginLeft: '10px'
        }}>
          ▼
        </div>
      </div>

      {isExpanded && (
        <div style={{
          borderTop: '1.5px solid #e2e8f0',
          background: '#f8fafc',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Visual Progress Bar & Premium Statistics Card Grid */}
          {(camp.status !== 'draft' || camp.completedAt) && (
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 1px 2px rgba(15,23,42,0.02)'
            }}>
              {camp.status !== 'draft' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Execution Progress</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 850, color: '#4f46e5' }}>
                      {totalCount > 0 ? Math.round((log.length / totalCount) * 100) : 0}% ({log.length} of {totalCount} sent)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                    <div
                      className={`campaign-progress-fill ${camp.status === 'running' ? 'campaign-progress-fill-animate' : ''}`}
                      style={{
                        width: `${totalCount > 0 ? Math.round((log.length / totalCount) * 100) : 0}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                        borderRadius: '99px',
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundSize: '30px 30px',
                        backgroundImage: camp.status === 'running' ? 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' : 'none'
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '12px' }}>
                {[
                  { val: totalCount, label: 'Total Recipients', color: '#4f46e5', bg: '#f5f3ff', border: '#e0e7ff' },
                  { val: sent, label: 'Delivered', color: '#10b981', bg: '#f0fdf4', border: '#dcfce7' },
                  { val: failed, label: 'Failed', color: '#ef4444', bg: '#fef2f2', border: '#fee2e2' }
                ].map((card, idx) => (
                  <div key={idx} className="campaign-stat-card" style={{ background: card.bg, border: `1.5px solid ${card.border}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)', transition: 'all 0.2s ease' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: card.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{card.val}</div>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                  </div>
                ))}
                {camp.completedAt && (
                  <div className="campaign-stat-card" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'all 0.2s ease' }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#16a34a', lineHeight: 1.4, height: '24px', display: 'flex', alignItems: 'center' }}>
                      {new Date(camp.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Finished At</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuration Card (Targeted Lists / Form Configuration) */}
          {((camp.listIds && camp.listIds.length > 0) || camp.type === 'form') && (
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 1px 2px rgba(15,23,42,0.02)'
            }}>
              {camp.listIds && camp.listIds.length > 0 && (
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '10px', letterSpacing: '0.8px' }}>Targeted Lists</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {camp.listIds.map((entry, idx) => {
                      const id = typeof entry === 'string' ? entry : entry.listId;
                      const status = typeof entry === 'string' ? '' : entry.status;
                      const l = lists.find(x => x.id === id);
                      if (!l) return null;
                      return (
                        <span key={idx} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#f8fafc',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: '#334155'
                        }}>
                          📁 {l.name}
                          {status && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              color: '#4f46e5',
                              background: '#eef2ff',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {status}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {camp.type === 'form' && (
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '10px', letterSpacing: '0.8px' }}>Form Sync Configuration</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '10px', color: '#9d174d', fontSize: '13.5px', fontWeight: 650 }}>
                    <span>🎯 Target Form:</span>
                    <span style={{ color: '#0f172a', fontWeight: 800 }}>
                      {forms.find(x => x.id === camp.formId)?.name || 'Deleted Form'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message Content Card */}
          {camp.message && (
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 1px 2px rgba(15,23,42,0.02)'
            }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.8px' }}>
                {camp.type === 'form' ? 'Payload Message Template' : 'SMS Message Configuration'}
              </span>
              <div style={{ padding: '16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#475569', fontSize: '13.5px', lineHeight: 1.6 }}>
                {renderMessageWithHighlightedTokens(camp.message)}
              </div>
              {camp.imageDataUrl && <div style={{ marginTop: '8px' }}><img src={camp.imageDataUrl} style={{ maxWidth: '160px', borderRadius: '12px', border: '1px solid #eef2f6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} /></div>}
            </div>
          )}

          {/* Google Voice Launch Banner Card */}
          {isStandalone && (!camp.type || camp.type === 'sms') && (camp.status === 'draft' || camp.status === 'ready' || showAsPaused || (failed > 0 && camp.status !== 'running')) && (
            <div style={{
              padding: '16px 20px',
              border: '1.5px solid #fde68a',
              borderRadius: '12px',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 1px 2px rgba(15,23,42,0.02)'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 700, textAlign: 'left', lineHeight: 1.4 }}>
                  Campaigns must be launched or resumed from the Google Voice interface. Please open Google Voice to proceed.
                </div>
              </div>
              <button
                onClick={() => window.open('https://voice.google.com/u/0/messages', '_blank')}
                style={{
                  padding: '8px 16px',
                  background: '#d97706',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                  transition: 'all 0.12s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#b45309'}
                onMouseLeave={e => e.currentTarget.style.background = '#d97706'}
              >
                Go to Google Voice ↗
              </button>
            </div>
          )}

          {/* Live HUD Card */}
          {activeStatus && activeStatus.campaignId === camp.id && (
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
              border: '1.5px solid #c7d2fe',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#4f46e5',
                  animation: 'vcrm-pulse 1.5s infinite',
                  boxShadow: '0 0 0 4px rgba(79,70,229,0.2)'
                }}></div>
                <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#4338ca', letterSpacing: '0.2px' }}>
                  {activeStatus.state === 'waiting' ? `Next Dispatch in ${activeStatus.delay}s` : 'Processing automation dispatch...'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#ffffff', border: '1.5px solid #e0e7ff', borderRadius: '10px', padding: '16px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.04)' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.6px' }}>Active Target</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeStatus.current ? (activeStatus.current.name || activeStatus.current.phone) : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.6px' }}>Queue Progress</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeStatus.next ? (activeStatus.next.name || activeStatus.next.phone) : 'Wrap-up phase'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12.5px', color: '#4338ca', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span>
                <span>Keep this tab active and visible while automation is running.</span>
              </div>
            </div>
          )}

          {/* Execution Report / Preview Roster Card */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(15,23,42,0.02)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Collapse Trigger Bar */}
            <div
              style={{
                background: '#f8fafc',
                padding: '16px 20px',
                borderBottom: reportExpanded ? '1.5px solid #e2e8f0' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => setReportExpanded(!reportExpanded)}
            >
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '1.2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📊 {isDraft ? 'Recipients Preview' : 'Execution Report'}
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'inline-block', transition: 'transform 0.15s ease', transform: reportExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
              </span>
            </div>

            {reportExpanded && (
              <div>
                {/* Search & Filter Toolbar */}
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>🔍</span>
                      <input
                        type="text"
                        value={logSearch}
                        onInput={e => { setLogSearch(e.target.value); setVisibleCount(25); }}
                        placeholder="Search by name, phone, or error..."
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 34px',
                          fontSize: '13px',
                          color: '#0f172a',
                          background: '#ffffff',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '8px',
                          outline: 'none',
                          transition: 'all 0.15s ease'
                        }}
                        onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.08)'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); downloadReport(camp, totalCount, livePhones); }}
                      style={{
                        padding: '8px 14px',
                        background: '#ffffff',
                        color: '#4f46e5',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#ffffff'; }}
                    >
                      Download CSV 📥
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: `All (${rawRoster.length})` },
                      { id: 'sent', label: `Sent (${rawRoster.filter(r => r.status === 'sent').length})`, color: '#10b981', bg: '#f0fdf4' },
                      { id: 'failed', label: `Failed (${rawRoster.filter(r => r.status === 'failed').length})`, color: '#ef4444', bg: '#fef2f2' },
                      { id: 'pending', label: `Pending (${rawRoster.filter(r => r.status === 'pending').length})`, color: '#f59e0b', bg: '#fffbeb' }
                    ].map(tab => {
                      const isActive = logFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setLogFilter(tab.id); setVisibleCount(25); }}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: isActive ? `1.5px solid ${tab.color || '#4f46e5'}` : '1.5px solid #e2e8f0',
                            background: isActive ? (tab.bg || '#eef2ff') : '#ffffff',
                            color: isActive ? (tab.color || '#4f46e5') : '#64748b',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Table Container */}
                <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'block', background: '#f8fafc', padding: '0 20px 20px 20px' }}>
                  {filteredRoster.length === 0 ? (
                    <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', fontStyle: 'italic' }}>
                      No matching recipients found.
                    </div>
                  ) : (
                    <table style={{ width: '100%', fontSize: '12.5px', textAlign: 'left', borderCollapse: 'separate', borderSpacing: '0 8px', tableLayout: 'fixed' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '10px 14px', fontWeight: 800, color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #e2e8f0', width: '110px' }}>Time</th>
                          <th style={{ padding: '10px 14px', fontWeight: 800, color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #e2e8f0' }}>Recipient</th>
                          <th style={{ padding: '10px 14px', fontWeight: 800, color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #e2e8f0', width: '130px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoster.slice(0, visibleCount).map((r, i) => {
                          const cellStyle = (isFirst, isLast) => ({
                            padding: '12px 14px',
                            verticalAlign: 'middle',
                            background: '#ffffff',
                            borderTop: '1.5px solid #e2e8f0',
                            borderBottom: '1.5px solid #e2e8f0',
                            transition: 'all 0.15s ease',
                            ...(isFirst ? { borderLeft: '1.5px solid #e2e8f0', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' } : {}),
                            ...(isLast ? { borderRight: '1.5px solid #e2e8f0', borderTopRightRadius: '10px', borderBottomRightRadius: '10px' } : {})
                          });

                          return (
                            <tr key={i}>
                              <td style={cellStyle(true, false)}>
                                <span style={{ color: '#94a3b8', fontWeight: 650, fontFamily: '"DM Mono",monospace', fontSize: '11.5px' }}>
                                  {r.ts ? new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                              </td>
                              <td style={cellStyle(false, false)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#fff', background: avatarColor(r.name || r.phone), flexShrink: 0 }}>
                                    {ini(r.name || r.phone)}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name || 'Private Contact'}</div>
                                    <div style={{ color: '#64748b', fontSize: '11px', fontFamily: '"DM Mono",monospace' }}>{r.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={cellStyle(false, true)}>
                                {r.status === 'sent' && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                                    🟢 Sent
                                  </span>
                                )}
                                {r.status === 'failed' && (
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, width: 'max-content' }}>
                                      🔴 Failed
                                    </span>
                                    {r.error && <span style={{ fontSize: '10px', color: '#ef4444', fontStyle: 'italic', display: 'block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.error}>{r.error}</span>}
                                  </div>
                                )}
                                {r.status === 'pending' && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#f59e0b', background: '#fffbeb', border: '1px solid #fef3c7', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                                    ⏳ Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {filteredRoster.length > visibleCount && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 0 0' }}>
                      <button
                        onClick={() => setVisibleCount(c => c + 25)}
                        style={{
                          padding: '8px 18px',
                          background: '#ffffff',
                          color: '#4f46e5',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = '#f5f3ff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#ffffff'; }}
                      >
                        Show More (+25 Recipients)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Card */}
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 2px rgba(15,23,42,0.02)'
          }}>
            {(camp.status === 'draft' || camp.status === 'ready' || showAsPaused) && (
              <button
                onClick={() => onEdit(camp)}
                style={{
                  padding: '9px 16px',
                  background: '#ffffff',
                  color: '#4f46e5',
                  border: '1.5px solid #4f46e5',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.12s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
              >
                Edit
              </button>
            )}

            {(camp.status === 'draft' || camp.status === 'ready') && (
              (isStandalone && (!camp.type || camp.type === 'sms')) ? (
                <button
                  onClick={() => window.open('https://voice.google.com/u/0/messages', '_blank')}
                  style={{
                    padding: '9px 16px',
                    background: '#fffbeb',
                    color: '#b45309',
                    border: '1.5px solid #fde68a',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.12s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; }}
                  title="Campaigns must be launched from the Google Voice page"
                >
                  ⚠️ Open GV to Launch
                </button>
              ) : (
                <button
                  onClick={() => onUpdate(camp.id, 'start')}
                  style={{
                    padding: '9px 18px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; }}
                >
                  ▶ Launch
                </button>
              )
            )}

            {camp.status === 'running' && (
              <button
                onClick={() => onUpdate(camp.id, 'pause')}
                style={{
                  padding: '9px 16px',
                  background: '#64748b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.12s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#475569'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#64748b'; }}
              >
                ⏸ Pause
              </button>
            )}

            {camp.status === 'running' && (
              <button
                onClick={() => onUpdate(camp.id, 'cancel')}
                style={{
                  padding: '9px 16px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.12s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}
              >
                ✕ Cancel
              </button>
            )}

            {showAsPaused && (
              (isStandalone && (!camp.type || camp.type === 'sms')) ? (
                <button
                  onClick={() => window.open('https://voice.google.com/u/0/messages', '_blank')}
                  style={{
                    padding: '9px 16px',
                    background: '#fffbeb',
                    color: '#b45309',
                    border: '1.5px solid #fde68a',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.12s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; }}
                  title="Campaigns must be resumed from the Google Voice page"
                >
                  ⚠️ Open GV to Resume
                </button>
              ) : (
                <button
                  onClick={() => onUpdate(camp.id, 'resume')}
                  style={{
                    padding: '9px 18px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; }}
                >
                  ▶ Resume
                </button>
              )
            )}

            {showAsPaused && (
              <button
                onClick={() => onUpdate(camp.id, 'cancel')}
                style={{
                  padding: '9px 16px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.12s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}
              >
                ✕ Cancel
              </button>
            )}

            <button
              onClick={() => onDuplicate(camp)}
              style={{
                padding: '9px 16px',
                background: '#f5f7ff',
                color: '#4f46e5',
                border: '1.5px solid #c7d2fe',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f5f7ff'; }}
            >
              ❐ Duplicate
            </button>

            {failed > 0 && camp.status !== 'running' && (
              (isStandalone && (!camp.type || camp.type === 'sms')) ? (
                <button
                  onClick={() => window.open('https://voice.google.com/u/0/messages', '_blank')}
                  style={{
                    padding: '9px 16px',
                    background: '#fffbeb',
                    color: '#b45309',
                    border: '1.5px solid #fde68a',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.12s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; }}
                  title="Campaign retries must be launched from the Google Voice page"
                >
                  ⚠️ Open GV to Retry
                </button>
              ) : (
                <button
                  onClick={() => onUpdate(camp.id, 'retry-failed')}
                  style={{
                    padding: '9px 16px',
                    background: '#fffbeb',
                    color: '#b45309',
                    border: '1.5px solid #fde68a',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.12s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; }}
                >
                  ↺ Retry {failed} Failed
                </button>
              )
            )}

            <button
              onClick={() => onDelete(camp.id)}
              style={{
                marginLeft: 'auto',
                color: "#94a3b8",
                border: 'none',
                background: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
            >
              🗑 Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CampaignsView({ campaigns, contacts, lists, activeStatus, isStandalone, forms = [], onEdit, onUpdate, onDelete, onDuplicate }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!campaigns.length) return <Empty icon="📣" text={"No campaigns yet.\nClick + New Campaign to create one."} />;

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', alignContent: 'start', background: '#f8fafc' }}>
      {campaigns.map(camp => (
        <CampaignCard
          key={camp.id}
          camp={camp}
          contacts={contacts}
          lists={lists}
          activeStatus={activeStatus}
          isStandalone={isStandalone}
          forms={forms}
          onEdit={onEdit}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          isExpanded={expandedId === camp.id}
          onToggleExpanded={() => setExpandedId(expandedId === camp.id ? null : camp.id)}
        />
      ))}
      <style>{`
        .campaign-card-container {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .campaign-card-container:hover {
          border-color: #cbd5e1;
          transform: translateY(-2.5px);
          box-shadow: 0 12px 24px -10px rgba(15,23,42,0.08), 0 4px 12px -5px rgba(15,23,42,0.03);
        }
        .campaign-card-container.expanded {
          border-color: #cbd5e1;
          box-shadow: 0 16px 32px -12px rgba(15,23,42,0.12), 0 4px 16px -6px rgba(15,23,42,0.04);
        }
        .campaign-stat-card {
          transition: all 0.2s ease;
        }
        .campaign-stat-card:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }
        @keyframes progress-bar-shimmer {
          0% { background-position: 0 0; }
          100% { background-position: 30px 0; }
        }
        .campaign-progress-fill-animate {
          animation: progress-bar-shimmer 1s linear infinite;
        }
        @keyframes vcrm-pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '38px', marginBottom: '12px', opacity: .3 }}>{icon}</div>
      <div style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'center', color: '#64748b', fontFamily: 'Inter,sans-serif' }} dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }}></div>
    </div>
  );
}
