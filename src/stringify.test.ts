import { describe, expect, it } from 'vitest';

import { stringify } from './stringify';

describe('stringify', () => {
  it('stringifies big ints', () => {
    // @ts-ignore
    expect(stringify(9007199254740992n)).toBe('9007199254740992');
    // @ts-ignore
    expect(stringify({ hi: 9007199254740992n })).toEqual({
      hi: '9007199254740992',
    });
  });

  it('stringifies symbols', () => {
    expect(stringify(Symbol('yer'))).toBe('Symbol(yer)');
  });

  it('stringifies Maps', () => {
    expect(
      stringify(
        new Map([
          ['abc', 'def'],
          ['ghi', 'jkl'],
        ])
      )
    ).toEqual({
      type: 'Map',
      value: [
        ['abc', 'def'],
        ['ghi', 'jkl'],
      ],
    });
  });

  it('stringifies a Map whose entries() method throws', () => {
    const map = new Map();
    map.set('abc', map);
    map.entries = () => {
      throw new Error('entries() threw');
    };

    expect(stringify(map)).toEqual({ type: 'Map', value: '[Error]' });
  });

  it('stringifies Sets', () => {
    expect(stringify(new Set(['abc', 'def', 'ghi']))).toEqual({
      type: 'Set',
      value: ['abc', 'def', 'ghi'],
    });
  });

  it('stringifies functions', () => {
    expect(
      stringify(function testFunction() {
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
      })
    ).toBe('function testFunction() { for (let i = 0; i < 1...');
  });

  it('stringifies Error objects', () => {
    expect(stringify(new Error('Error!!'))).toMatchObject({
      stack: expect.any(String),
      message: 'Error!!',
    });
  });

  it('stringifies AggregateError objects', () => {
    const error = new AggregateError([
      new Error('Error 1'),
      new Error('Error 2'),
    ]);

    expect(stringify(error)).toMatchObject({
      stack: expect.any(String),
      errors: [
        expect.objectContaining({
          message: 'Error 1',
        }),
        expect.objectContaining({
          message: 'Error 2',
        }),
      ],
    });
  });

  it('stringifies Date objects', () => {
    expect(stringify(new Date('2010-10-10'))).toBe('2010-10-10T00:00:00.000Z');
  });

  it('stringifies RegExp objects', () => {
    expect(stringify(/^\s*[reg]ex$/)).toBe('/^\\s*[reg]ex$/');
  });

  it('stringifies ArrayBuffer objects', () => {
    expect(stringify(new ArrayBuffer(8))).toBe('ArrayBuffer(8)');
  });

  it('stringifies TypedArray objects', () => {
    const buffer = new ArrayBuffer(8);
    const float32Array = new Float32Array(buffer);
    expect(stringify(float32Array)).toEqual({ '0': 0, '1': 0 });
  });
});
