import { useState } from 'preact/hooks';
import { Badge } from '../components/Badge';
import { Btn } from '../components/Btn';
import { palFor, campaignPhones, CAMP_PAL } from '../utils/utils';

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


export function CampaignsView({ campaigns, contacts, lists, activeStatus, onEdit, onUpdate, onDelete, onDuplicate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [reportExpandedId, setReportExpandedId] = useState(null);

  if (!campaigns.length) return <Empty icon="📣" text={"No campaigns yet.\nClick + New Campaign to create one."} />;

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', alignContent: 'start' }}>
      {campaigns.map(camp => {
        const [sbg, sfg] = CAMP_PAL[camp.status] || CAMP_PAL.draft;
        const isLocked = !['draft', 'ready'].includes(camp.status);
        // Keep full array for draft preview; locked campaigns use snapshot
        const livePhones = campaignPhones(camp.listIds || [], contacts);
        const totalCount = isLocked && camp.totalRecipients != null ? camp.totalRecipients : livePhones.length;
        const log = camp.log || [];
        const sent = log.filter(l => l.ok).length, failed = log.filter(l => !l.ok).length;
        const pendingCount = totalCount - log.length;
        const showAsPaused = camp.status === 'paused' || (camp.status === 'done' && (failed > 0 || pendingCount > 0));
        const isExpanded = expandedId === camp.id;
        const isReportExpanded = reportExpandedId === camp.id;
        const isDraft = !isLocked;

        // Extract list names for display
        const listNames = (camp.listIds || []).map(entry => {
          const id = typeof entry === 'string' ? entry : entry.listId;
          const status = typeof entry === 'string' ? '' : entry.status;
          const l = lists.find(x => x.id === id);
          return l ? `${l.name}${status ? ` (${status})` : ''}` : null;
        }).filter(Boolean).join(', ');

        return (
          <div key={camp.id} style={{ background: '#fff', border: `1px solid #e2e8f0`, borderRadius: '20px', overflow: 'hidden', boxShadow: isExpanded ? '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {/* COMPACT HEADER */}
            <div
              style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer', background: isExpanded ? '#fbfcfe' : '#fff' }}
              onClick={() => { setExpandedId(isExpanded ? null : camp.id); if (isExpanded) setReportExpandedId(null); }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: "#0f172a", lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{camp.name}</div>
                  <Badge text={camp.status || 'draft'} bg={sbg} fg={sfg} />
                </div>
                <div style={{ fontSize: '13.5px', color: "#64748b", fontWeight: 500, display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span>{totalCount} recipients</span>
                  <span style={{ color: '#e2e8f0' }}>•</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listNames || 'Internal Selection'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1 }}>Created</div>
                <div style={{ fontSize: '14px', color: '#475569', fontWeight: 800, lineHeight: 1 }}>{new Date(camp.createdAt || Date.now()).toLocaleDateString()}</div>
              </div>

              <div style={{ fontSize: '22px', color: '#cbd5e1', marginLeft: '10px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</div>
            </div>

            {isExpanded && (
              <div style={{ borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                  {[[totalCount, 'Total'], [sent, 'Delivered'], [failed, 'Failed']].map(([n, l], i) => (
                    <div key={i} style={{ flex: 1, padding: '20px 28px', borderRight: i < 2 ? `1px solid #f1f5f9` : 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '26px', fontWeight: 900, color: "#0f172a", fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{n}</div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.8px' }}>{l}</div>
                    </div>
                  ))}
                  {camp.completedAt && (
                    <div style={{ flex: 1.5, padding: '20px 28px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 900, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1 }}>Finished At</div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: "#16a34a", lineHeight: 1 }}>{new Date(camp.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  )}
                </div>

                {camp.listIds && camp.listIds.length > 0 && (
                  <div style={{ padding: '24px 28px', borderBottom: `1px solid #f1f5f9`, background: '#fff' }}>
                    <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '14px', letterSpacing: '0.8px' }}>Targeted Lists</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {camp.listIds.map((entry, idx) => {
                        const id = typeof entry === 'string' ? entry : entry.listId;
                        const status = typeof entry === 'string' ? '' : entry.status;
                        const l = lists.find(x => x.id === id);
                        if (!l) return null;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{l.name}</div>
                            {status && <div style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '3px 8px', borderRadius: '6px' }}>{status}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {camp.message && (
                  <div style={{ padding: '24px 28px', borderBottom: `1px solid #f1f5f9`, background: '#fdfdfe' }}>
                    <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '14px', letterSpacing: '0.8px' }}>Message Configuration</span>
                    <div style={{ padding: '16px', background: '#fff', border: '1px solid #eef2f6', borderRadius: '12px', color: '#475569', fontSize: '14.5px', lineHeight: 1.6 }}>
                      "{camp.message}"
                    </div>
                    {camp.imageDataUrl && <div style={{ marginTop: '20px' }}><img src={camp.imageDataUrl} style={{ maxWidth: '160px', borderRadius: '12px', border: '1px solid #eef2f6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} /></div>}
                  </div>
                )}

                {/* LIVE HUD */}
                {activeStatus && activeStatus.campaignId === camp.id && (
                  <div style={{ padding: '28px', background: '#eef2ff', borderBottom: '1px solid #e0e7ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4f46e5', animation: 'vcrm-pulse 1.3s infinite', boxShadow: '0 0 0 5px rgba(79,70,229,0.1)' }}></div>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#4338ca' }}>
                        {activeStatus.state === 'waiting' ? `Next Dispatch in ${activeStatus.delay}s` : 'Processing Automation Task...'}
                      </span>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: '18px', padding: '18px', display: 'flex', gap: '32px', boxShadow: '0 4px 15px rgba(67, 56, 202, 0.05)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.8px' }}>Active Recipient</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeStatus.current ? (activeStatus.current.name || activeStatus.current.phone) : '—'}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.8px' }}>Queue Progress</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeStatus.next ? (activeStatus.next.name || activeStatus.next.phone) : 'Almost Complete'}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '20px', fontSize: '13px', color: '#6366f1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      ⚠️ Critical: Do not minimize or close this tab while running.
                    </div>
                  </div>
                )}

                <div
                  style={{ background: '#f8fafc', padding: '18px 28px', borderBottom: isReportExpanded ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setReportExpandedId(isReportExpanded ? null : camp.id)}
                >
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                    {isDraft ? '👁 Recipients Preview' : '📊 Execution Report'} {isReportExpanded ? '▲' : '▼'}
                  </span>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button onClick={(e) => { e.stopPropagation(); downloadReport(camp, totalCount, livePhones); }} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}>Download CSV</button>
                  </div>
                </div>

                {isReportExpanded && (() => {
                  // Draft: preview from live phones. Started: use snapshot. Fallback: log only.
                  const roster = camp.recipients && camp.recipients.length > 0
                    ? camp.recipients.map(r => {
                      const entry = log.find(l => l.phone === r.phone);
                      if (!entry) return { ...r, status: 'pending' };
                      return { ...r, name: r.name || entry.name, status: entry.ok ? 'sent' : 'failed', ts: entry.ts, error: entry.error };
                    })
                    : isDraft && livePhones.length > 0
                      ? livePhones.map(p => ({ phone: p.phone, name: p.name || '', status: 'pending' }))
                      : log.map(l => ({ phone: l.phone, name: l.name, status: l.ok ? 'sent' : 'failed', ts: l.ts, error: l.error }));

                  const pending = roster.filter(r => r.status === 'pending').length;

                  if (roster.length === 0) return (
                    <div style={{ padding: '50px 28px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', background: '#fff' }}>
                      No activity logs available for this campaign session.
                    </div>
                  );

                  return (
                    <div style={{ borderBottom: `1px solid #f1f5f9`, maxHeight: '380px', overflowY: 'auto', display: 'block', background: '#fff' }}>
                      {pending > 0 && (
                        <div style={{ padding: '10px 28px', background: '#fffbeb', borderBottom: '1px solid #fef3c7', fontSize: '12px', color: '#92400e', fontWeight: 700 }}>
                          ⏳ {pending} recipient{pending !== 1 ? 's' : ''} pending
                        </div>
                      )}
                      <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#fdfdfe', boxShadow: '0 1px 0 #e2e8f0', zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: '14px 28px', fontWeight: 800, color: '#64748b', width: '110px' }}>Time</th>
                            <th style={{ padding: '14px 28px', fontWeight: 800, color: '#64748b' }}>Recipient</th>
                            <th style={{ padding: '14px 28px', fontWeight: 800, color: '#64748b', width: '130px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roster.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f8fafc', background: r.status === 'pending' ? '#fafafa' : '#fff' }}>
                              <td style={{ padding: '14px 28px', color: '#94a3b8', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                {r.ts ? new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                              <td style={{ padding: '14px 28px', verticalAlign: 'top', minWidth: '200px' }}>
                                <div style={{ color: '#1e293b', fontWeight: 800, marginBottom: '4px', lineHeight: 1.2 }}>{r.name || 'Private Contact'}</div>
                                <div style={{ color: '#64748b', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.2px', opacity: 0.8 }}>{r.phone}</div>
                              </td>
                              <td style={{ padding: '14px 28px', verticalAlign: 'top' }}>
                                {r.status === 'sent' && (
                                  <div style={{ color: '#10b981', fontWeight: 900 }}>✓ Sent</div>
                                )}
                                {r.status === 'failed' && (
                                  <>
                                    <div style={{ color: '#ef4444', fontWeight: 900, marginBottom: '4px' }}>✕ Failed</div>
                                    {r.error && <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', lineHeight: 1.4 }}>{r.error}</div>}
                                  </>
                                )}
                                {r.status === 'pending' && (
                                  <div style={{ color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>⏳ Pending</div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div style={{ padding: '24px 28px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', background: '#fff' }}>
                  {(camp.status === 'draft' || camp.status === 'ready' || showAsPaused) && <Btn variant="sm" onClick={() => onEdit(camp)} style={{ padding: '10px 20px' }}>Edit</Btn>}
                  {(camp.status === 'draft' || camp.status === 'ready') && <Btn variant="sm" onClick={() => onUpdate(camp.id, 'start')} style={{ padding: '10px 20px', color: '#166534', borderColor: '#86efac', background: '#dcfce7', fontWeight: 800 }}>▶ Launch</Btn>}

                  {camp.status === 'running' && <Btn variant="sm" onClick={() => onUpdate(camp.id, 'pause')} style={{ padding: '10px 20px', color: "#64748b" }}>⏸ Pause</Btn>}
                  {camp.status === 'running' && <Btn variant="sm" onClick={() => onUpdate(camp.id, 'cancel')} style={{ padding: '10px 20px', color: "#ef4444" }}>✕ Cancel</Btn>}

                  {showAsPaused && <Btn variant="sm" onClick={() => onUpdate(camp.id, 'resume')} style={{ padding: '10px 20px', color: '#166534', borderColor: '#86efac', background: '#dcfce7', fontWeight: 800 }}>▶ Resume</Btn>}
                  {showAsPaused && <Btn variant="sm" onClick={() => onUpdate(camp.id, 'cancel')} style={{ padding: '10px 20px', color: "#ef4444" }}>✕ Cancel</Btn>}

                  <Btn variant="sm" onClick={() => onDuplicate(camp)} style={{ padding: '10px 20px', color: '#4f46e5', borderColor: '#c7d2fe', background: '#f5f7ff' }}>❐ Duplicate</Btn>

                  {failed > 0 && camp.status !== 'running' && (
                    <Btn variant="sm" onClick={() => onUpdate(camp.id, 'retry-failed')} style={{ padding: '10px 20px', color: '#b45309', borderColor: '#fde68a', background: '#fffbeb', fontWeight: 800 }}>↺ Retry {failed} Failed</Btn>
                  )}

                  <Btn variant="sm" onClick={() => onDelete(camp.id)} style={{ marginLeft: 'auto', color: "#94a3b8", border: 'none', background: 'none', fontSize: '12px' }}>🗑 Delete</Btn>
                </div>
                <style>{`@keyframes vcrm-pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.15); } 100% { opacity: 1; transform: scale(1); } }`}</style>
              </div>
            )}
          </div>
        );
      })}
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
