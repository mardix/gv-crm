const KEYS = ['vcrm_contacts', 'vcrm_lists', 'vcrm_campaigns', 'vcrm_forms', 'vcrm_settings'];

export function loadData(cb) {
  chrome.storage.local.get(KEYS, d => {
    const contacts = (d.vcrm_contacts || [])
      .map(c => ({
        tags: [],
        lists: [],
        status: '',
        comment: '',
        handle: '',
        city: '',
        state: '',
        location: '',
        ...c
      }));
    const lists = d.vcrm_lists || [];
    const campaigns = d.vcrm_campaigns || [];
    const forms = d.vcrm_forms || [];
    const rawS = d.vcrm_settings;
    const settings = {
      contactStatuses: ['Lead', 'Prospect', 'Active', 'VIP', 'Inactive', 'Banned'],
      listStatuses: ['Prospect', 'Reached Out', 'Confirmed', 'Declined'],
      hideRightSidebar: false,
      ...(rawS || {}),
    };
    cb({ contacts, lists, campaigns, forms, settings });
  });
}

export function saveData(state) {
  chrome.storage.local.set({
    vcrm_contacts: state.contacts,
    vcrm_lists: state.lists,
    vcrm_campaigns: state.campaigns,
    vcrm_forms: state.forms,
    vcrm_settings: state.settings,
  });
}
