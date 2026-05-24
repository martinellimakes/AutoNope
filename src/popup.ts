import type { Rule, StorageData } from './types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderRules(rules: Rule[]): void {
  const list = document.getElementById('rules-list')!;
  const empty = document.getElementById('empty-msg')!;

  empty.style.display = rules.length === 0 ? '' : 'none';
  list.innerHTML = '';

  rules.forEach(rule => {
    const item = document.createElement('div');
    item.className = 'rule-item';
    item.innerHTML = `
      <span class="rule-value">${escapeHtml(rule.value)}</span>
      <button class="remove-btn" data-id="${rule.id}">Remove</button>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll<HTMLButtonElement>('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset['id']);
      chrome.storage.sync.get({ rules: [] }, (data) => {
        const updated = (data as StorageData).rules.filter(r => r.id !== id);
        chrome.storage.sync.set({ rules: updated }, () => renderRules(updated));
      });
    });
  });
}

function addRule(value: string): void {
  if (!value) return;
  chrome.storage.sync.get({ rules: [] }, (data) => {
    const rules = (data as StorageData).rules;
    if (rules.some(r => r.value.toLowerCase() === value.toLowerCase())) return;
    const updated: Rule[] = [...rules, { id: Date.now(), value }];
    chrome.storage.sync.set({ rules: updated }, () => renderRules(updated));
  });
}

const addBtn = document.getElementById('add-btn')!;
const input = document.getElementById('new-rule-input') as HTMLInputElement;

addBtn.addEventListener('click', () => {
  addRule(input.value.trim());
  input.value = '';
});

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

chrome.storage.sync.get({ rules: [] }, (data) => {
  renderRules((data as StorageData).rules);
});
