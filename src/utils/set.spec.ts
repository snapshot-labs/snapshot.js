import { describe, test, expect } from 'vitest';
import set from './set';

describe('set', () => {
  describe('prototype pollution', () => {
    // `lodash.set` is affected by GHSA-p6mc-m468-83gw with no patched release,
    // so these paths must never reach `Object.prototype`.
    const attacks: [string, any][] = [
      ['__proto__ as a leading key', '__proto__.polluted'],
      ['constructor.prototype chain', 'constructor.prototype.polluted'],
      ['__proto__ nested in the path', 'a.__proto__.polluted'],
      ['prototype as a leading key', 'prototype.polluted'],
      ['bracketed __proto__', 'a["__proto__"]["polluted"]'],
      ['array path', ['__proto__', 'polluted']],
      ['array path with constructor', ['a', 'constructor', 'polluted']]
    ];

    test.each(attacks)('does not pollute via %s', (_label, path) => {
      set({}, path, 'polluted-value');

      expect(({} as any).polluted).toBeUndefined();
      expect(Object.prototype).not.toHaveProperty('polluted');
    });

    test('leaves the assignment unperformed', () => {
      expect(set({}, '__proto__.polluted', 'V')).toEqual({});
      expect(set({}, 'constructor.prototype.polluted', 'V')).toEqual({});
      // containers created before the forbidden key are kept, as in lodash
      expect(set({}, 'a.__proto__.polluted', 'V')).toEqual({ a: {} });
    });

    test('does not assign a forbidden key even as the last segment', () => {
      expect(set({}, 'a.constructor', 'V')).toEqual({ a: {} });
    });
  });

  describe('assignment', () => {
    test('sets a top-level key', () => {
      expect(set({}, 'a', 'V')).toEqual({ a: 'V' });
    });

    test('sets a nested key, creating missing objects', () => {
      expect(set({}, 'a.b.c', 'V')).toEqual({ a: { b: { c: 'V' } } });
    });

    test('overwrites an existing value', () => {
      expect(set({ a: { b: 1 } }, 'a', 'V')).toEqual({ a: 'V' });
    });

    test('replaces primitives standing in for containers', () => {
      expect(set({ a: 1 }, 'a.b', 'V')).toEqual({ a: { b: 'V' } });
      expect(set({ a: null }, 'a.b', 'V')).toEqual({ a: { b: 'V' } });
    });

    test('merges into an existing structure', () => {
      const object = { a: { keep: 1 } };

      expect(set(object, 'a.added', 'V')).toEqual({
        a: { keep: 1, added: 'V' }
      });
    });

    test('returns the mutated object', () => {
      const object = {};

      expect(set(object, 'a', 'V')).toBe(object);
    });

    test('ignores non-object targets', () => {
      expect(set(null, 'a', 'V')).toBe(null);
      expect(set(42 as any, 'a', 'V')).toBe(42);
    });
  });

  describe('path parsing', () => {
    test('creates arrays for array-index keys', () => {
      const result = set({}, 'a.0', 'V');

      expect(Array.isArray(result.a)).toBe(true);
      expect(result.a[0]).toBe('V');
    });

    test('creates objects for non-index keys', () => {
      const result = set({}, 'a.00', 'V');

      expect(Array.isArray(result.a)).toBe(false);
      expect(result).toEqual({ a: { '00': 'V' } });
      expect(set({}, 'a.-1', 'V')).toEqual({ a: { '-1': 'V' } });
    });

    test('reuses existing containers rather than converting them', () => {
      const result = set({ a: {} }, 'a.0', 'V');

      expect(Array.isArray(result.a)).toBe(false);
      expect(result).toEqual({ a: { '0': 'V' } });
    });

    test('updates an existing array in place', () => {
      expect(set({ a: [1, 2, 3] }, 'a.1', 'V')).toEqual({ a: [1, 'V', 3] });
    });

    test('supports bracket notation', () => {
      expect(set({}, 'a[0].b', 'V')).toEqual({ a: [{ b: 'V' }] });
      expect(set({}, 'a.b[0]', 'V')).toEqual({ a: { b: ['V'] } });
    });

    test('supports quoted keys containing dots', () => {
      expect(set({}, 'a["x.y"]', 'V')).toEqual({ a: { 'x.y': 'V' } });
      expect(set({}, "a['x']", 'V')).toEqual({ a: { x: 'V' } });
    });

    test('supports array paths', () => {
      expect(set({}, ['a', 'b'], 'V')).toEqual({ a: { b: 'V' } });
      expect(set({}, ['a', 'x.y'], 'V')).toEqual({ a: { 'x.y': 'V' } });

      const result = set({}, ['a', '0'], 'V');
      expect(Array.isArray(result.a)).toBe(true);
      expect(result.a[0]).toBe('V');
    });

    test('supports numeric paths', () => {
      expect(set({}, 0, 'V')).toEqual({ '0': 'V' });
    });

    test('treats a dotless string as a single key', () => {
      expect(set({}, '0xAbC', 'V')).toEqual({ '0xAbC': 'V' });
      expect(set({}, '', 'V')).toEqual({ '': 'V' });
    });

    test('keeps the empty key of leading and repeated separators', () => {
      expect(set({}, '.a', 'V')).toEqual({ '': { a: 'V' } });
      expect(set({}, 'a..b', 'V')).toEqual({ a: { '': { b: 'V' } } });
    });

    test('prefers an existing literal key over deep resolution', () => {
      expect(set({ 'a.b': 1 }, 'a.b', 'V')).toEqual({ 'a.b': 'V' });
      expect(set({}, 'a.b', 'V')).toEqual({ a: { b: 'V' } });
    });
  });
});
