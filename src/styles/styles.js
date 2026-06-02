export const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  /* Hard reset — cut off ALL Google Voice CSS inheritance */
  #vcrm-panel, #vcrm-panel * {
    all: revert;
    box-sizing: border-box !important;
    font-family: Inter, system-ui, -apple-system, sans-serif !important;
    -webkit-font-smoothing: antialiased !important;
  }
  /* Scrollbars */
  #vcrm-panel ::-webkit-scrollbar { width: 5px !important; height: 5px !important; }
  #vcrm-panel ::-webkit-scrollbar-thumb { background: #cbd5e1 !important; border-radius: 3px !important; }
  #vcrm-panel ::-webkit-scrollbar-track { background: transparent !important; }
  /* Table needs display reset after all:revert */
  #vcrm-panel table { display: table !important; }
  #vcrm-panel thead { display: table-header-group !important; }
  #vcrm-panel tbody { display: table-row-group !important; }
  #vcrm-panel tr    { display: table-row !important; }
  #vcrm-panel th, #vcrm-panel td { display: table-cell !important; }
  #vcrm-panel colgroup { display: table-column-group !important; }
  #vcrm-panel col { display: table-column !important; }

  /* Modal overlay reset */
  .vcrm-overlay, .vcrm-overlay * {
    box-sizing: border-box !important;
    font-family: Inter, system-ui, -apple-system, sans-serif !important;
  }
  .vcrm-overlay button { cursor: pointer !important; }

  /* ── AI Glow widget border ── */
  @keyframes vcrm-pulse-shadow {
    0%   { box-shadow: 0 0 0 2px rgba(139,92,246,0.7), 0 0 24px 6px rgba(139,92,246,0.25), 0 16px 40px -8px rgba(15,23,42,0.14); }
    33%  { box-shadow: 0 0 0 2px rgba(236,72,153,0.7), 0 0 24px 6px rgba(236,72,153,0.22), 0 16px 40px -8px rgba(15,23,42,0.14); }
    66%  { box-shadow: 0 0 0 2px rgba(59,130,246,0.7),  0 0 24px 6px rgba(59,130,246,0.22),  0 16px 40px -8px rgba(15,23,42,0.14); }
    100% { box-shadow: 0 0 0 2px rgba(139,92,246,0.7), 0 0 24px 6px rgba(139,92,246,0.25), 0 16px 40px -8px rgba(15,23,42,0.14); }
  }

  @keyframes vcrm-sync-pulse {
    0%   { opacity: 0.45; }
    50%  { opacity: 1; }
    100% { opacity: 0.45; }
  }

  .vcrm-widget,
  #vcrm-open-btn,
  #vcrm-panel {
    animation: vcrm-pulse-shadow 4s ease-in-out infinite !important;
  }
`;

export const C = {
  bg: '#f1f5f9', surf: '#fff', surf2: '#f8fafc',
  bdr: '#e2e8f0', bdr2: '#cbd5e1',
  txt: '#0f172a', txt2: '#334155', mut: '#64748b', sub: '#94a3b8',
  acc: '#4f46e5', acclt: '#eef2ff',
  red: '#ef4444', redlt: '#fef2f2',
};
