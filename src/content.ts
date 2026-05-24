import type { Rule, StorageData } from './types';
import { matchesAnyRule } from './rules';

let currentRules: Rule[] = [];
let listObserver: MutationObserver | null = null;
let activeMenu: HTMLElement | null = null;

// --- Styles ---

function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .at-excl-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fff;
      border: none;
      cursor: pointer;
      padding: 0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      flex-shrink: 0;
      position: relative;
      z-index: 10;
    }
    .at-excl-btn:hover {
      background: #fff5f0;
    }
    .at-excl-btn svg {
      width: 18px;
      height: 18px;
      fill: #666;
      pointer-events: none;
    }
    .at-excl-btn:hover svg {
      fill: #e85d04;
    }
    .at-excl-menu {
      position: fixed;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      overflow: hidden;
      min-width: 160px;
    }
    .at-excl-menu-opt {
      display: block;
      width: 100%;
      text-align: left;
      padding: 8px 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      color: #1a1a1a;
      white-space: nowrap;
    }
    .at-excl-menu-opt:hover {
      background: #f5f5f5;
    }
  `;
  document.head.appendChild(style);
}

// --- Title extraction ---

function getListingTitle(li: Element): string {
  const titleEl = li.querySelector('a[data-testid="search-listing-title"]');
  return titleEl?.firstChild?.textContent?.trim() ?? '';
}

// --- Filtering ---

function applyRules(): void {
  document.querySelectorAll('li[data-advertid]').forEach(li => {
    const title = getListingTitle(li).toLowerCase();
    const hidden = matchesAnyRule(title, currentRules);
    (li as HTMLElement).style.display = hidden ? 'none' : '';
  });
}

// --- Exclude menu ---

function closeActiveMenu(): void {
  activeMenu?.remove();
  activeMenu = null;
}

function showExcludeMenu(btn: HTMLElement, make: string, fullTitle: string): void {
  closeActiveMenu();

  const menu = document.createElement('div');
  menu.className = 'at-excl-menu';

  const options: Array<{ label: string; value: string }> = [
    { label: `Exclude "${make}"`, value: make },
  ];
  if (fullTitle !== make) {
    options.push({ label: `Exclude "${fullTitle}"`, value: fullTitle });
  }

  options.forEach(({ label, value }) => {
    const opt = document.createElement('button');
    opt.className = 'at-excl-menu-opt';
    opt.textContent = label;
    opt.dataset['value'] = value;
    menu.appendChild(opt);
  });

  const rect = btn.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.left = `${rect.left}px`;
  document.body.appendChild(menu);
  activeMenu = menu;
}

// Single capture-phase listener handles all our interactions before React sees them.
// preventDefault stops <a> navigation; stopPropagation stops React's delegated onClick.
// We also drive the menu logic from here since stopPropagation would otherwise
// prevent the event from reaching individual button/option handlers.
document.addEventListener('click', (e) => {
  const target = e.target as Element;

  const btn = target.closest<HTMLElement>('.at-excl-btn');
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    const make = btn.dataset['make'] ?? '';
    const fullTitle = btn.dataset['fullTitle'] ?? '';
    activeMenu ? closeActiveMenu() : showExcludeMenu(btn, make, fullTitle);
    return;
  }

  const opt = target.closest<HTMLElement>('.at-excl-menu-opt');
  if (opt) {
    e.preventDefault();
    e.stopPropagation();
    const value = opt.dataset['value'] ?? '';
    if (value) addRule(value);
    closeActiveMenu();
    return;
  }

  if (activeMenu) closeActiveMenu();
}, true);

// --- Button injection ---

function injectButton(li: Element): void {
  if (li.querySelector('.at-excl-btn')) return;

  const saveBtn = li.querySelector('button[data-testid^="save-advert-button"]');
  if (!saveBtn) return;

  const titleEl = li.querySelector('a[data-testid="search-listing-title"]');
  const fullTitle = titleEl?.firstChild?.textContent?.trim() ?? '';
  if (!fullTitle) return;
  const make = fullTitle.split(' ')[0];

  const btn = document.createElement('button');
  btn.className = 'at-excl-btn';
  btn.title = 'Exclude this listing';
  btn.dataset['make'] = make;
  btn.dataset['fullTitle'] = fullTitle;
  btn.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>`;

  btn.style.position = 'absolute';
  btn.style.zIndex = '10';
  saveBtn.insertAdjacentElement('beforebegin', btn);

  // Position to the left of the save button once the browser has laid it out
  requestAnimationFrame(() => {
    const sbEl = saveBtn as HTMLElement;
    const parentWidth = (sbEl.offsetParent as HTMLElement | null)?.offsetWidth ?? 0;
    btn.style.top = `${sbEl.offsetTop}px`;
    btn.style.right = `${parentWidth - sbEl.offsetLeft + 4}px`;
  });
}

function injectAllButtons(): void {
  document.querySelectorAll('li[data-advertid]').forEach(injectButton);
}

// --- Storage ---

function addRule(value: string): void {
  chrome.storage.sync.get({ rules: [] }, (data) => {
    const rules = (data as StorageData).rules;
    if (rules.some(r => r.value.toLowerCase() === value.toLowerCase())) return;
    const updated: Rule[] = [...rules, { id: Date.now(), value }];
    chrome.storage.sync.set({ rules: updated });
  });
}

// --- Observer ---

function attachListObserver(list: Element): void {
  if (listObserver) return;
  listObserver = new MutationObserver(() => {
    injectAllButtons();
    applyRules();
  });
  listObserver.observe(list, { childList: true });
}

function waitForList(): void {
  const list = document.querySelector('[data-testid="desktop-search"] ul');
  if (list) { attachListObserver(list); return; }

  const bodyObserver = new MutationObserver(() => {
    const found = document.querySelector('[data-testid="desktop-search"] ul');
    if (found) {
      bodyObserver.disconnect();
      attachListObserver(found);
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
}

// --- Init ---

injectStyles();

chrome.storage.sync.get({ rules: [] }, (data) => {
  currentRules = (data as StorageData).rules;
  injectAllButtons();
  applyRules();
  waitForList();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes['rules']) {
    currentRules = (changes['rules'].newValue as Rule[]) ?? [];
    applyRules();
  }
});
