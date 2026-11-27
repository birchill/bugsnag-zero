import { describe, expect, it } from 'vitest';

import { toExceptions } from './to-exceptions';

describe('toExceptions', () => {
  it.each(['failure', 42, false])(
    'reports primitive thrown values: %s',
    (value) => {
      const { exceptions } = toExceptions(value, 'test');
      expect(exceptions[0].message).toBe(String(value));
      expect(exceptions[0].stacktrace).toEqual([]);
    }
  );

  it('does not report a synthetic stack for an invalid value', () => {
    const { exceptions } = toExceptions(undefined, 'test');
    expect(exceptions[0].errorClass).toBe('InvalidError');
    expect(exceptions[0].stacktrace).toEqual([]);
  });

  it('processes the cause of events', () => {
    const timeout = new Error('Timeout');
    const error = new Error('Failed to connect');
    error.cause = timeout;

    const { exceptions } = toExceptions(error, 'test');

    expect(exceptions).toHaveLength(2);
    expect(exceptions[0].message).toBe('Failed to connect');
    expect(exceptions[1].message).toBe('Timeout');
  });
});
