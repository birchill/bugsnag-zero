import { describe, expect, it } from 'vitest';

import { toExceptions } from './to-exceptions';

describe('toExceptions', () => {
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
