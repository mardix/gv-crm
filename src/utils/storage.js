import { sanitizeName } from './utils';

const KEYS = ['vcrm_contacts', 'vcrm_lists', 'vcrm_campaigns', 'vcrm_forms', 'vcrm_settings'];

export function loadData(cb) {
  chrome.storage.local.get(KEYS, d => {
    // Attempt to load from localStorage as fallback/mirror
    let localBackup = null;
    try {
      const rawBackup = localStorage.getItem('vcrm_backup_state');
      if (rawBackup) {
        localBackup = JSON.parse(rawBackup);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage backup state:', e);
    }

    // Determine which state to prioritize by comparing timestamps
    const chromeTime = d.vcrm_settings?.savedAt || new Date(0).toISOString();
    const localTime = localBackup?.settings?.savedAt || new Date(0).toISOString();

    console.log('Loading state: Chrome Storage savedAt:', chromeTime, 'Local Storage savedAt:', localTime);

    // If localBackup is newer and valid, merge its values
    const useLocalBackup = localBackup && (new Date(localTime) > new Date(chromeTime));
    if (useLocalBackup) {
      console.log('Prioritizing newer localStorage backup state.');
    }

    const rawContacts = useLocalBackup ? localBackup.contacts : d.vcrm_contacts;
    const contacts = (rawContacts || [])
      .map(c => ({
        tags: [],
        lists: [],
        status: '',
        comment: '',
        handle: '',
        city: '',
        state: '',
        location: '',
        leadSource: '',
        category: '',
        membershipLevel: '',
        ...c
      }))
      .map(c => ({ ...c, name: sanitizeName(c.name) }));

    const rawLists = useLocalBackup ? localBackup.lists : d.vcrm_lists;
    const lists = (rawLists || [])
      .map(l => ({
        status: 'active',
        ...l
      }));

    const campaigns = (useLocalBackup ? localBackup.campaigns : d.vcrm_campaigns) || [];
    const forms = (useLocalBackup ? localBackup.forms : d.vcrm_forms) || [];
    const rawS = useLocalBackup ? localBackup.settings : d.vcrm_settings;

    const settings = {
      contactStatuses: ['Active', 'Inactive', 'Banned'],
      listStatuses: ['Prospect', 'Qualified', 'Unqualified'],
      membershipLevels: ['Standard', 'Plus', 'Premium', 'VIP', 'Elite'],
      leadSources: ['Google', 'Referral', 'Social Media', 'Cold Call', 'Other'],
      categories: ['Client', 'Prospect', 'Partner', 'Vendor'],
      hideRightSidebar: true,
      ...(rawS || {}),
    };

    cb({ contacts, lists, campaigns, forms, settings });
  });
}

export function saveData(state, writerId) {
  const timestamp = new Date().toISOString();
  const stateWithTime = {
    ...state,
    settings: {
      ...state.settings,
      savedAt: timestamp,
      lastWriter: writerId
    }
  };

  console.log('Saving CRM State (Dual-Storage Mirror):', {
    contactsCount: state.contacts?.length,
    listsCount: state.lists?.length,
    campaignsCount: state.campaigns?.length,
    formsCount: state.forms?.length,
    timestamp
  });

  // 1. Mirror to chrome.storage.local
  chrome.storage.local.set({
    vcrm_contacts: stateWithTime.contacts,
    vcrm_lists: stateWithTime.lists,
    vcrm_campaigns: stateWithTime.campaigns,
    vcrm_forms: stateWithTime.forms,
    vcrm_settings: stateWithTime.settings,
  });

  // 2. Mirror to localStorage
  try {
    localStorage.setItem('vcrm_backup_state', JSON.stringify({
      contacts: stateWithTime.contacts,
      lists: stateWithTime.lists,
      campaigns: stateWithTime.campaigns,
      forms: stateWithTime.forms,
      settings: stateWithTime.settings
    }));
  } catch (e) {
    console.warn('Failed to mirror CRM State to localStorage:', e);
  }
}
