import { describe, expect, it } from 'vitest';

import { redactEvent } from './redact-keys';
import { BugsnagEvent } from './event';

describe('redactEvent', () => {
  it('redacts keys from certain parts of the event', () => {
    expect(
      redactEvent(
        {
          exceptions: [
            {
              message: 'Failed checkout',
              errorClass: 'CheckoutError',
              stacktrace: [],
            },
          ],
          request: {
            api_key: 'supersecretapikey',
          } as BugsnagEvent['request'],
          originalError: null,
          user: {
            name: 'Kentaro Bug',
            email: 'ken@bug.jp',
          },
        },
        ['api_key']
      )
    ).toEqual({
      exceptions: [
        {
          message: 'Failed checkout',
          errorClass: 'CheckoutError',
          stacktrace: [],
        },
      ],
      request: {
        api_key: '[REDACTED]',
      },
      originalError: null,
      user: {
        name: 'Kentaro Bug',
        email: 'ken@bug.jp',
      },
    });
  });
});
