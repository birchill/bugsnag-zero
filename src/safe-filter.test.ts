import { describe, expect, it } from 'vitest';

import { CircularReference, safeFilter as filter } from './safe-filter';

// Based on https://github.com/davidmarkclements/fast-safe-stringify/blob/master/test.js

describe('safeFilter', () => {
  it('accepts null', () => {
    expect(filter(null)).toBe(null);
    expect(filter({ a: null })).toEqual({ a: null });
  });

  it('replaces a circular reference to the root', () => {
    const input: any = { name: 'Hello there' };
    input.circle = input;

    expect(filter(input)).toEqual({
      name: 'Hello there',
      circle: CircularReference,
    });
  });

  it('replaces a circular getter reference to root', () => {
    const input = {
      name: 'Hello there',
      get circle() {
        return input;
      },
    };

    expect(filter(input)).toEqual({
      name: 'Hello there',
      circle: CircularReference,
    });
  });

  it('replaces a nested circular reference to root', () => {
    const input: any = { name: 'Hello there' };
    input.id = { circle: input };

    expect(filter(input)).toEqual({
      name: 'Hello there',
      id: { circle: CircularReference },
    });
  });

  it('replaces a child circular reference', () => {
    const input: any = {
      name: 'Tywin Lannister',
      child: { name: 'Tyrion Lannister' },
    };
    input.child.dinklage = input.child;

    expect(filter(input)).toEqual({
      name: 'Tywin Lannister',
      child: {
        name: 'Tyrion Lannister',
        dinklage: CircularReference,
      },
    });
  });

  it('replaces a nested child circular reference', () => {
    const input: any = {
      name: 'Tywin Lannister',
      child: { name: 'Tyrion Lannister' },
    };
    input.child.actor = { dinklage: input.child };

    expect(filter(input)).toEqual({
      name: 'Tywin Lannister',
      child: {
        name: 'Tyrion Lannister',
        actor: { dinklage: CircularReference },
      },
    });
  });

  it('replaces circular objects in an array', () => {
    const input: any = { name: 'Tywin Lannister' };
    input.hand = [input, input];

    expect(filter(input)).toEqual({
      name: 'Tywin Lannister',
      hand: [CircularReference, CircularReference],
    });
  });

  it('replaces nested circular references in an array', () => {
    const input: any = {
      name: 'Tywin Lannister',
      offspring: [{ name: 'Tyrion Lannister' }, { name: 'Cersei Lannister' }],
    };
    input.offspring[0].dinklage = input.offspring[0];
    input.offspring[1].headey = input.offspring[1];

    expect(filter(input)).toEqual({
      name: 'Tywin Lannister',
      offspring: [
        { name: 'Tyrion Lannister', dinklage: CircularReference },
        { name: 'Cersei Lannister', headey: CircularReference },
      ],
    });
  });

  it('replaces circular arrays', () => {
    const input: any[] = [];
    input.push(input, input);

    expect(filter(input)).toEqual([CircularReference, CircularReference]);
  });

  it('replaces nested circular arrays', () => {
    const input: any[] = [];
    input.push(
      { name: 'Jon Snow', bastards: input },
      { name: 'Ramsay Bolton', bastards: input }
    );

    expect(filter(input)).toEqual([
      { name: 'Jon Snow', bastards: CircularReference },
      { name: 'Ramsay Bolton', bastards: CircularReference },
    ]);
  });

  it('allows repeated non-circular references in objects', () => {
    const daenerys = { name: 'Daenerys Targaryen' };
    const input = {
      motherOfDragons: daenerys,
      queenOfMeereen: daenerys,
    };

    expect(filter(input)).toEqual(input);
  });

  it('allows repeated non-circular references in arrays', () => {
    const daenerys = { name: 'Daenerys Targaryen' };
    const input = [daenerys, daenerys];

    expect(filter(input)).toEqual(input);
  });

  it('replaces double child circular reference', () => {
    // Create circular reference
    const child: any = { name: 'Tyrion Lannister' };
    child.dinklage = child;

    // Include it twice in the input
    const input = { name: 'Tywin Lannister', childA: child, childB: child };

    expect(filter(input)).toEqual({
      name: 'Tywin Lannister',
      childA: {
        name: 'Tyrion Lannister',
        dinklage: CircularReference,
      },
      childB: {
        name: 'Tyrion Lannister',
        dinklage: CircularReference,
      },
    });
  });

  it('allows a child circular reference with toJSON', () => {
    // Create a test object that has an overridden `toJSON` property
    class TestObject {
      toJSON() {
        return { special: 'case' };
      }
    }

    // Creating a simple circular object structure
    const parentObject: any = {};
    parentObject.childObject = new TestObject();
    parentObject.childObject.parentObject = parentObject;

    // Creating a simple circular object structure
    const otherParentObject: any = new TestObject();
    otherParentObject.otherChildObject = {};
    otherParentObject.otherChildObject.otherParentObject = otherParentObject;

    expect(filter(parentObject)).toEqual({ childObject: { special: 'case' } });
    expect(filter(otherParentObject)).toEqual({ special: 'case' });
  });

  it('detects a nested child circular reference in toJSON', () => {
    const circle: any = { some: 'data' };
    circle.circle = circle;

    const a = {
      b: {
        toJSON: function () {
          (a as any).b = 2;
          return '[Redacted]';
        },
      },
      baz: {
        circle,
        toJSON: function () {
          a.baz = circle;
          return '[Redacted]';
        },
      },
    };

    const o = { a, bar: a };

    expect(filter(o)).toEqual({
      a: {
        b: '[Redacted]',
        baz: '[Redacted]',
      },
      bar: {
        b: 2,
        baz: {
          some: 'data',
          circle: CircularReference,
        },
      },
    });
  });

  it('detects a circular reference defined by a non-configurable property', () => {
    const input: any = { name: 'Tywin Lannister' };
    Object.defineProperty(input, 'circle', {
      configurable: false,
      get: function () {
        return input;
      },
      enumerable: true,
    });

    expect(filter(input)).toEqual({
      name: 'Tywin Lannister',
      circle: CircularReference,
    });
  });

  it('detects objects with getter child circular references', () => {
    const input = {
      name: 'Tywin Lannister',
      child: {
        name: 'Tyrion Lannister',
        get dinklage() {
          return input.child;
        },
      },
      get self() {
        return input;
      },
    };

    expect(filter(input)).toEqual({
      name: 'Tywin Lannister',
      child: {
        name: 'Tyrion Lannister',
        dinklage: CircularReference,
      },
      self: CircularReference,
    });
  });

  it('handles a Proxy throwing', () => {
    const input = {
      p: new Proxy(
        {},
        {
          get() {
            throw new Error('kaboom');
          },
        }
      ),
    };

    expect(filter(input)).toEqual({ p: {} });
  });

  it('replaces deep objects when a depthLimit is specified', () => {
    const input = {
      name: 'Tywin Lannister',
      child: {
        name: 'Tyrion Lannister',
      },
      get self() {
        return input;
      },
    };

    expect(filter(input, null, { depthLimit: 1, edgesLimit: 1 })).toEqual({
      name: 'Tywin Lannister',
      child: '[...]',
      self: CircularReference,
    });
  });

  it('replaces wide objects when an edgesLimit is specified', () => {
    const input = {
      object: {
        1: { test: 'test' },
        2: { test: 'test' },
        3: { test: 'test' },
        4: { test: 'test' },
      },
      array: [
        { test: 'test' },
        { test: 'test' },
        { test: 'test' },
        { test: 'test' },
      ],
      get self() {
        return input;
      },
    };

    expect(filter(input, null, { depthLimit: 3, edgesLimit: 3 })).toEqual({
      object: {
        1: { test: 'test' },
        2: { test: 'test' },
        3: { test: 'test' },
        4: '[...]',
      },
      array: [{ test: 'test' }, { test: 'test' }, { test: 'test' }, '[...]'],
      self: CircularReference,
    });
  });

  it('trims long arrays when an edgesLimit is specified', () => {
    const array = Array.from({ length: 1_000 }).fill('abc');
    expect(filter(array, null, { edgesLimit: 3 })).toEqual([
      'abc',
      'abc',
      'abc',
      '[...]',
    ]);
  });

  it('replaces values specified by the replacer function', () => {
    expect(
      filter(
        new Map([
          ['abc', 'def'],
          ['ghi', 'jkl'],
        ]),
        mapReplacer
      )
    ).toEqual({
      type: 'Map',
      value: [
        ['abc', 'def'],
        ['ghi', 'jkl'],
      ],
    });
  });

  it('applies edge limits to replaced values', () => {
    expect(
      filter(
        new Map([
          ['abc', 'def'],
          ['ghi', 'jkl'],
          ['mno', 'pqr'],
          ['tuv', 'wxy'],
        ]),
        mapReplacer,
        { edgesLimit: 2 }
      )
    ).toEqual({
      type: 'Map',
      value: [['abc', 'def'], ['ghi', 'jkl'], '[...]'],
    });
  });

  it('applied circular reference detection to replaced values', () => {
    const map = new Map();
    map.set('abc', map);

    expect(filter(map, mapReplacer)).toEqual({
      type: 'Map',
      value: [['abc', CircularReference]],
    });
  });

  it('runs the replacer on members of an object', () => {
    expect(filter({ myMap: new Map([['abc', 'def']]) }, mapReplacer)).toEqual({
      myMap: { type: 'Map', value: [['abc', 'def']] },
    });
  });
});

function mapReplacer(_key: string | number, value: unknown) {
  if (value instanceof Map) {
    return {
      type: 'Map',
      value: [...value.entries()],
    };
  }
  return value;
}
