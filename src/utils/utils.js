export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const ini = n => n ? n.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

const PAL = [
  ['#e0e7ff', '#3730a3'], ['#d1fae5', '#065f46'], ['#fef3c7', '#92400e'],
  ['#fce7f3', '#9d174d'], ['#dbeafe', '#1e40af'], ['#ede9fe', '#5b21b6'],
  ['#dcfce7', '#166534'], ['#fee2e2', '#991b1b'],
];

export function palFor(status, list) {
  if (!list || !Array.isArray(list)) return PAL[0];
  const i = list.indexOf(status);
  return PAL[(i >= 0 ? i : list.length) % PAL.length];
}

export function avatarColor(name) {
  const p = ['#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#14b8a6'];
  let h = 0;
  for (const c of (name || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

export function campaignPhones(selections, contacts) {
  const seen = new Set(), phones = [];
  (selections || []).forEach(sel => {
    const lid = (typeof sel === 'string') ? sel : sel.listId;
    const st = (typeof sel === 'string') ? null : sel.status;
    contacts
      .filter(c => !c.dnd && (c.lists || []).some(e => e.listId === lid && (!st || e.status === st)) && (c.phone || '').trim())
      .forEach(c => {
        const p = c.phone.trim();
        if (!seen.has(p)) {
          seen.add(p);
          phones.push({ phone: p, name: c.name || '', email: c.email || '', handle: c.handle || '' });
        }
      });
  });
  return phones;
}

export const CAMP_PAL = {
  draft: ['#f1f5f9', '#475569'],
  ready: ['#dbeafe', '#1e40af'],
  running: ['#dcfce7', '#166534'],
  paused: ['#fef3c7', '#92400e'],
  done: ['#ede9fe', '#5b21b6'],
  cancelled: ['#fee2e2', '#991b1b'],
};
