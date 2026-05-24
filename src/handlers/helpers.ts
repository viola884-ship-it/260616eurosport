import type { Order } from '../types';

const URL_RE = /https?:\/\/[^\s]+/g;

export function extractLinks(text: string): string[] {
  return text.match(URL_RE) ?? [];
}

export function extractSpecs(text: string, links: string[]): string | null {
  let remaining = text;
  for (const link of links) {
    remaining = remaining.replace(link, '').trim();
  }
  remaining = remaining.replace(/\s+/g, ' ').trim();
  return remaining || null;
}

export function formatOrderSummary(order: Order, links: string[], specs: string | null): string {
  const items = links.map((l, i) => `  ${i + 1}. ${l}`).join('\n');
  const duplicateNote = order.is_duplicate
    ? '\n\n\u{26A0}\uFE0F This appears to be a duplicate of a recent order.'
    : '';
  return `Order #${order.display_id} created!\nItems:\n${items}\nSpecs: ${specs ?? '(none)'}${duplicateNote}\n\nI'll notify you when the manager updates it.`;
}