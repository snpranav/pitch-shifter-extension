// Clicking the toolbar icon toggles the in-page panel on the active YouTube tab.
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' }).catch(() => {
    // No content script on this page (e.g. not a YouTube tab) — safe to ignore.
  });
});
