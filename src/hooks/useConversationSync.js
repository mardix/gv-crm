import { useState, useEffect } from 'preact/hooks';

export function useConversationSync() {
  const [activeContact, setActiveContact] = useState(null);

  useEffect(() => {
    const getActiveContactInfo = () => {
      const header = document.querySelector('.header-content');
      if (!header) return null;

      const title = header.querySelector('.header-title')?.textContent.trim() || '';
      const secondary = header.querySelector('.secondary-text')?.textContent.trim() || '';
      const phonePattern = /\(\d{3}\)\s\d{3}-\d{4}/;

      let phoneNumber = '';
      let formattedPhone = '';
      let contactName = '';

      // Check secondary text (usually phone number if contact saved)
      const secondaryMatch = secondary.match(phonePattern);
      if (secondaryMatch) {
        formattedPhone = secondaryMatch[0];
        phoneNumber = formattedPhone.replace(/\D/g, '');
        contactName = title;
      } else {
        // Check title (usually phone number if contact NOT saved)
        const titleMatch = title.match(phonePattern);
        if (titleMatch) {
          formattedPhone = titleMatch[0];
          phoneNumber = formattedPhone.replace(/\D/g, '');
          contactName = '';
        }
      }

      // Check URL itemId fallback
      if (!phoneNumber) {
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('itemId');
        if (itemId && itemId.startsWith('t.+')) {
          phoneNumber = itemId.replace('t.+', '');
          formattedPhone = '+' + phoneNumber;
        }
      }

      if (!phoneNumber) return null;

      return { phoneNumber, formattedPhone, contactName };
    };

    const update = () => {
      const info = getActiveContactInfo();
      setActiveContact(prev => {
        if (!info && !prev) return null;
        if (info?.phoneNumber === prev?.phoneNumber) return prev;
        return info;
      });
    };

    // Google Voice is a heavy SPA, we'll monitor both URL changes and DOM changes in the main layout
    const observer = new MutationObserver(update);
    const config = { subtree: true, childList: true, characterData: true };
    
    // Watch the main conversation container
    const target = document.querySelector('gv-conversation-view') || document.body;
    observer.observe(target, config);

    // Initial check
    update();

    return () => observer.disconnect();
  }, []);

  return activeContact;
}
