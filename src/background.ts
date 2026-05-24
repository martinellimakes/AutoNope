import type { Rule, StorageData } from './types';

const BADGE_COLOR = '#e85d04';

function updateBadge(rules: Rule[]): void {
  const text = rules.length > 0 ? String(rules.length) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
}

chrome.storage.sync.get({ rules: [] }, (data) => {
  updateBadge((data as StorageData).rules);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes['rules']) {
    updateBadge((changes['rules'].newValue as Rule[]) ?? []);
  }
});
