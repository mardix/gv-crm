
export const uid = (len = 16) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.random() * 36 | 0];
  return s;
};

export function sanitizeName(name) {
  return String(name || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u2028-\u202f\u205f-\u206f\u2800\u3000\ufeff\ufff9-\ufffb]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function numericNameKey(name) {
  const cleaned = sanitizeName(name);
  const stripped = cleaned.replace(/[\s()+\-.]/g, '');
  if (!stripped || !/^\d+$/.test(stripped)) return null;
  let digits = stripped;
  if (digits.startsWith('1') && digits.length > 10) {
    digits = digits.slice(1);
  }
  return digits;
}

export const ini = n => {
  const trimmed = sanitizeName(n);
  if (!trimmed) return '?';
  if (numericNameKey(trimmed)) {
    return '#';
  }
  return trimmed.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(?:1)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone.trim(); // fallback if not exactly a 10-digit NA number
}

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
  const numericKey = numericNameKey(name);
  let colorKey = numericKey ? numericKey.slice(0, 3) || '000' : sanitizeName(name);

  const p = [
    '#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#14b8a6',
    '#f97316', '#f43f5e', '#06b6d4', '#84cc16', '#d946ef', '#a855f7', '#475569', '#64748b'
  ];
  let h = 0;
  for (const c of colorKey) h = c.charCodeAt(0) + ((h << 5) - h);
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
          phones.push({
            id: c.id,
            phone: p,
            name: c.name || '',
            email: c.email || '',
            handle: c.handle || '',
            location: c.location || '',
            status: c.status || '',
            leadSource: c.leadSource || '',
            category: c.category || '',
            membershipLevel: c.membershipLevel || ''
          });
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
