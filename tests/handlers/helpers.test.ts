import { describe, it, expect } from 'vitest';
import { extractLinks, extractSpecs, formatOrderSummary } from '../../src/handlers/helpers';
import type { Order } from '../../src/types';

const mockOrder: Order = {
  id: 1,
  display_id: '001',
  customer_id: 1,
  status: 'new',
  specs: 'quantity: 2, color: blue',
  is_duplicate: 0,
  created_at: '2026-05-24T10:00:00.000Z',
  updated_at: '2026-05-24T10:00:00.000Z',
};

describe('helpers', () => {
  describe('extractLinks', () => {
    it('extracts single https URL', () => {
      const result = extractLinks('Check out https://example.com/product/123');
      expect(result).toEqual(['https://example.com/product/123']);
    });

    it('extracts multiple URLs', () => {
      const result = extractLinks('I want https://shop.com/item1 and https://shop.com/item2');
      expect(result).toEqual(['https://shop.com/item1', 'https://shop.com/item2']);
    });

    it('extracts http and https URLs', () => {
      const result = extractLinks('Buy from http://store.com and https://secure.store.com');
      expect(result).toEqual(['http://store.com', 'https://secure.store.com']);
    });

    it('returns empty array when no URLs', () => {
      const result = extractLinks('Just some text without any links');
      expect(result).toEqual([]);
    });

    it('handles URLs with special characters', () => {
      const result = extractLinks('Look at https://example.com/product?id=1&color=blue');
      expect(result).toEqual(['https://example.com/product?id=1&color=blue']);
    });

    it('returns empty array for empty string', () => {
      const result = extractLinks('');
      expect(result).toEqual([]);
    });
  });

  describe('extractSpecs', () => {
    it('returns remaining text after links', () => {
      const links = ['https://example.com/product'];
      const result = extractSpecs('https://example.com/product quantity 2 size M', links);
      expect(result).toBe('quantity 2 size M');
    });

    it('collapses whitespace', () => {
      const links = ['https://example.com/product'];
      const result = extractSpecs('https://example.com/product   quantity    2', links);
      expect(result).toBe('quantity 2');
    });

    it('returns null when only links provided', () => {
      const links = ['https://example.com/product'];
      const result = extractSpecs('https://example.com/product', links);
      expect(result).toBeNull();
    });

    it('returns null for empty remaining text', () => {
      const links = ['https://example.com/product'];
      const result = extractSpecs('https://example.com/product   ', links);
      expect(result).toBeNull();
    });

    it('handles multiple links by removing each from text', () => {
      const links = ['https://shop.com/item1', 'https://shop.com/item2'];
      const result = extractSpecs(
        'I need https://shop.com/item1 and https://shop.com/item2 in size L',
        links,
      );
      expect(result).toBe('I need and in size L');
    });

    it('returns specs after stripping all links', () => {
      const links = ['https://store.com/shoes', 'https://store.com/shirt'];
      const result = extractSpecs(
        'https://store.com/shoes https://store.com/shirt size L',
        links,
      );
      expect(result).toBe('size L');
    });
  });

  describe('formatOrderSummary', () => {
    it('formats order with single item', () => {
      const links = ['https://example.com/product'];
      const result = formatOrderSummary(mockOrder, links, 'quantity: 2');
      expect(result).toContain('Order #001 created');
      expect(result).toContain('https://example.com/product');
      expect(result).toContain('quantity: 2');
    });

    it('formats order with multiple items', () => {
      const links = ['https://shop.com/shoes', 'https://shop.com/socks'];
      const result = formatOrderSummary(mockOrder, links, null);
      expect(result).toContain('Order #001 created');
      expect(result).toContain('1. https://shop.com/shoes');
      expect(result).toContain('2. https://shop.com/socks');
      expect(result).toContain('Specs: (none)');
    });

    it('includes duplicate warning when flagged', () => {
      const dupOrder = { ...mockOrder, is_duplicate: 1 };
      const links = ['https://example.com/product'];
      const result = formatOrderSummary(dupOrder, links, null);
      expect(result).toContain('duplicate');
    });

    it('does not include duplicate warning when not flagged', () => {
      const links = ['https://example.com/product'];
      const result = formatOrderSummary(mockOrder, links, null);
      expect(result).not.toContain('duplicate');
    });

    it('includes manager notification promise', () => {
      const result = formatOrderSummary(mockOrder, [], null);
      expect(result).toContain('notify');
      expect(result).toContain('manager');
    });
  });
});