import type { Rule } from './types';

export function matchesAnyRule(title: string, rules: Rule[]): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  return rules.some(r => lower.includes(r.value.toLowerCase()));
}
