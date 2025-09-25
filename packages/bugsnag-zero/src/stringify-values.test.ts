import { describe, expect, it } from 'vitest';

import type { BugsnagEvent } from './event';
import type { ExtendedClientApi, OnErrorCallback } from './client';
import { stringifyValues } from './stringify-values';

describe('stringifyValues', () => {
  it('should stringify values', () => {
    const callbacks: Array<OnErrorCallback> = [];
    const mockClient = {
      addOnError: (callback: OnErrorCallback) => {
        callbacks.push(callback);
      },
    };
    stringifyValues.load(mockClient as ExtendedClientApi);

    expect(callbacks.length).toBe(1);

    const event = {
      exceptions: [],
      breadcrumbs: [
        {
          timestamp: 'timestamp',
          name: 'Breadcrumb',
          type: 'log',
          metaData: {
            get error() {
              throw new Error('access error');
            },
          },
        },
      ],
      metaData: {
        bigint: BigInt(1),
        map: new Map([
          ['key', 'value'],
          ['key2', 'value2'],
        ]),
      },
      originalError: new Error('test'),
    } satisfies BugsnagEvent;

    callbacks[0](event);

    expect(event).toEqual({
      exceptions: [],
      breadcrumbs: [
        {
          metaData: {
            error: '[Error]',
          },
          name: 'Breadcrumb',
          timestamp: 'timestamp',
          type: 'log',
        },
      ],
      metaData: {
        bigint: '1',
        map: {
          type: 'Map',
          value: [
            ['key', 'value'],
            ['key2', 'value2'],
          ],
        },
      },
      originalError: new Error('test'),
    });
  });
});
