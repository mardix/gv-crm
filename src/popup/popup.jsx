import { useEffect, useState } from 'preact/hooks';
import config from '../config.json';

export function Popup() {
  const [disabled, setDisabled] = useState(false);
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const [isGVPage, setIsGVPage] = useState(false);
  const [appName, setAppName] = useState('');

  useEffect(() => {
    chrome.storage.local.get(['vcrm_disabled', 'vcrm_settings'], (data) => {
      setDisabled(!!data.vcrm_disabled);
      setHideRightSidebar(!!(data.vcrm_settings?.hideRightSidebar));
      setAppName(data.vcrm_settings?.appName || '');
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes('voice.google.com')) {
        setIsGVPage(true);
      }
    });
  }, []);

  const handleOpenStandalone = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };

  const handleOpen = () => {
    chrome.tabs.query({ url: 'https://voice.google.com/*' }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
        chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        chrome.tabs.create({ url: 'https://voice.google.com' });
      }
      window.close();
    });
  };

  const handleToggleUI = () => {
    chrome.tabs.query({ url: 'https://voice.google.com/*' }, (tabs) => {
      if (tabs.length > 0) chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleUI' });
      window.close();
    });
  };

  const handleToggleSidebar = () => {
    const newState = !hideRightSidebar;
    setHideRightSidebar(newState);
    chrome.storage.local.get(['vcrm_settings'], (data) => {
      const newSettings = { ...(data.vcrm_settings || {}), hideRightSidebar: newState };
      chrome.storage.local.set({ vcrm_settings: newSettings });
      chrome.tabs.query({ url: 'https://voice.google.com/*' }, (tabs) => {
        if (tabs.length > 0) chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings', settings: newSettings });
      });
    });
  };

  const handleToggleDisable = () => {
    const newState = !disabled;
    setDisabled(newState);
    chrome.storage.local.set({ vcrm_disabled: newState });
    chrome.tabs.query({ url: 'https://voice.google.com/*' }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: newState ? 'disableUI' : 'enableUI' });
      }
    });
  };

  return (
    <>
      <div class="logo">
        <div class="logo-mark">✦</div>
        <div>
          <div class="logo-text">{config.appName}</div>
          <div class="logo-sub">v{config.version}</div>
        </div>
      </div>

      {appName && (
        <div class="workspace-card">
          <div class="workspace-label">Workspace</div>
          <div class="workspace-value">{appName}</div>
        </div>
      )}

      <div class="btn-group">
        <button class="open-btn" style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: '#fff', border: 'none', marginBottom: '4px' }} onClick={handleOpenStandalone}>Launch Standalone CRM ↗</button>
        {!isGVPage && <button class="open-btn" onClick={handleOpen}>Open Google Voice →</button>}
        {!disabled && isGVPage && (
          <>
            <button class="toggle-btn" onClick={handleToggleUI}>Toggle CRM Panel</button>
            <button class="toggle-btn" onClick={handleToggleSidebar}>
              {hideRightSidebar ? 'Show GV Right Sidebar' : 'Hide GV Right Sidebar'}
            </button>
          </>
        )}

        {isGVPage && (
          <button class={`disable-btn ${disabled ? 'is-disabled' : ''}`} onClick={handleToggleDisable}>
            {disabled ? `Enable in Google Voice` : `Disable in Google Voice`}
          </button>
        )}

      </div>

      <div class="divider"></div>
      <div class="version">©{new Date().getFullYear()} {config.appName}</div>
    </>
  );
}
