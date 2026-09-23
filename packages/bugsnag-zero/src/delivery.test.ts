import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BugsnagStatic,
  errorBreadcrumbs,
  FetchDelivery,
  nodeNotifyUnhandledExceptions,
  redactKeys,
} from './index';
import type { DeliveryPayload, NotifyResult } from './index';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  // A test must never submit a real report.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockRejectedValue(new Error('Unexpected fetch'))
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function setup() {
  const client = new BugsnagStatic();
  const sendEvent = vi
    .fn<(payload: DeliveryPayload) => Promise<NotifyResult>>()
    .mockResolvedValue({ status: 'sent' });
  client.setDelivery({ sendEvent });
  return { client, sendEvent };
}

describe('notification results', () => {
  it('skips notifications before start', async () => {
    const { client, sendEvent } = setup();
    await expect(client.notify('error')).resolves.toEqual({
      status: 'skipped',
      reason: 'not-started',
    });
    expect(sendEvent).not.toHaveBeenCalled();
  });

  it('skips disabled release stages', async () => {
    const { client, sendEvent } = setup();
    client.start({ apiKey: 'test-key', enabledReleaseStages: [] });
    await expect(client.notify('error')).resolves.toEqual({
      status: 'skipped',
      reason: 'disabled',
    });
    expect(sendEvent).not.toHaveBeenCalled();
  });

  it('honors asynchronous callback vetoes before custom delivery', async () => {
    const { client, sendEvent } = setup();
    client.start({ apiKey: 'test-key', onError: async () => false });
    await expect(client.notify('error')).resolves.toEqual({
      status: 'skipped',
      reason: 'callback',
    });
    expect(sendEvent).not.toHaveBeenCalled();
  });

  it.each<NotifyResult>([
    { status: 'sent' },
    { status: 'stored' },
    { status: 'skipped', reason: 'custom-policy' },
    { status: 'failed', error: new Error('Rejected'), statusCode: 429 },
  ])('returns the custom delivery result: $status', async (result) => {
    const { client, sendEvent } = setup();
    sendEvent.mockResolvedValue(result);
    const startedClient = client.start({ apiKey: 'test-key' });
    startedClient.setDelivery({ sendEvent });
    await expect(startedClient.notify('error')).resolves.toBe(result);
  });

  it('waits until custom persistence completes', async () => {
    const { client, sendEvent } = setup();
    let finishSaving!: () => void;
    const persisted = new Promise<void>((resolve) => {
      finishSaving = resolve;
    });
    sendEvent.mockImplementation(async () => {
      await persisted;
      return { status: 'stored' };
    });
    client.start({ apiKey: 'test-key' });
    const onComplete = vi.fn();
    const notification = client.notify('error').then(onComplete);
    await vi.waitFor(() => expect(sendEvent).toHaveBeenCalledOnce());
    expect(onComplete).not.toHaveBeenCalled();
    finishSaving();
    await notification;
    expect(onComplete).toHaveBeenCalledWith({ status: 'stored' });
  });

  it.each(['callback', 'post-callback', 'delivery'])(
    'resolves failures from %s without rejecting',
    async (source) => {
      const { client, sendEvent } = setup();
      const error = new Error('Failure');
      client.start({ apiKey: 'test-key' });
      if (source === 'callback') {
        client.addOnError(async () => {
          throw error;
        });
      } else if (source === 'post-callback') {
        client.addOnPostError(() => {
          throw error;
        });
      } else {
        sendEvent.mockRejectedValue(error);
      }
      await expect(client.notify('error')).resolves.toEqual({
        status: 'failed',
        error,
      });
      expect(console.error).toHaveBeenCalledOnce();
    }
  );

  it('resolves failures during error normalization', async () => {
    const { client, sendEvent } = setup();
    client.start({ apiKey: 'test-key' });
    const error = new Error('Cannot access metadata');
    const original = new Error('Original');
    Object.defineProperty(original, 'metadata', {
      get() {
        throw error;
      },
    });
    await expect(client.notify(original)).resolves.toEqual({
      status: 'failed',
      error,
    });
    expect(sendEvent).not.toHaveBeenCalled();
  });

  it.each(['failed to save', null, { code: 'STORAGE_FULL' }])(
    'normalizes non-Error delivery rejections (%j)',
    async (cause) => {
      const { client, sendEvent } = setup();
      client.start({ apiKey: 'test-key' });
      sendEvent.mockRejectedValue(cause);
      await expect(client.notify('error')).resolves.toMatchObject({
        status: 'failed',
        error: expect.any(Error),
      });
    }
  );

  it('returns a failure for an oversized report instead of rejecting', async () => {
    const { client, sendEvent } = setup();
    client.start({ apiKey: 'test-key' });
    await expect(
      client.notify(new Error('x'.repeat(1_000_001)))
    ).resolves.toMatchObject({
      status: 'failed',
      error: new Error('Payload exceeded 1Mb limit'),
    });
    expect(sendEvent).not.toHaveBeenCalled();
  });
});

describe('prepared delivery payloads', () => {
  it('runs redaction after per-report callbacks and before custom persistence', async () => {
    const { client, sendEvent } = setup();
    client.start({ apiKey: 'test-key', plugins: [redactKeys(['password'])] });
    client.leaveBreadcrumb('Login', { password: 'breadcrumb secret' });
    await client.notify(new Error('Oops'), (event) => {
      event.metaData = { nested: { password: 'metadata secret' } };
      event.request = { headers: { password: 'header secret' } };
    });
    const payload = sendEvent.mock.calls[0][0];
    expect(payload.events[0].metaData).toEqual({
      nested: { password: '[REDACTED]' },
    });
    expect(payload.events[0].request?.headers).toEqual({
      password: '[REDACTED]',
    });
    expect(payload.events[0].breadcrumbs?.at(-1)?.metaData).toEqual({
      password: '[REDACTED]',
    });
    expect(JSON.stringify(payload)).not.toContain('secret');
    expect(payload.events[0]).not.toHaveProperty('originalError');
  });

  it('detaches nested data and uses the exact JSON representation', async () => {
    const { client, sendEvent } = setup();
    const user = { name: 'Original user' };
    const nested = { value: 'original' };
    const metadata = {
      nested,
      omitted: undefined,
      fn: () => {},
      symbol: Symbol('omitted'),
      time: new Date('2025-01-01T00:00:00Z'),
      nonFinite: Infinity,
      array: [undefined, NaN],
    };
    client.start({ apiKey: 'test-key', user, plugins: [errorBreadcrumbs] });
    client.leaveBreadcrumb('Before', { nested });
    client.addOnPostError((event) => {
      event.context = 'Too late';
    });
    await client.notify(new Error('error'), { metadata });
    const payload = sendEvent.mock.calls[0][0];
    const serialized = JSON.stringify(payload);
    expect(payload).toEqual(JSON.parse(serialized));
    expect(payload.events[0].metaData).toEqual({
      nested: { value: 'original' },
      time: '2025-01-01T00:00:00.000Z',
      nonFinite: null,
      array: [null, null],
    });
    expect(payload.events[0]).not.toHaveProperty('context');
    expect(payload.events[0].breadcrumbs?.map(({ name }) => name)).toEqual([
      'Bugsnag loaded',
      'Before',
    ]);
    nested.value = 'changed';
    user.name = 'Changed user';
    client.leaveBreadcrumb('After');
    await client.notify('another error');
    expect(JSON.stringify(payload)).toBe(serialized);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('applies metadata serialization fallback before custom delivery', async () => {
    const { client, sendEvent } = setup();
    client.start({ apiKey: 'test-key' });
    await expect(
      client.notify('error', { metadata: { bigint: 1n } })
    ).resolves.toEqual({ status: 'sent' });
    expect(sendEvent.mock.calls[0][0].events[0].metaData).toEqual({
      notifier: 'Unable to serialize metadata',
    });
  });

  it('captures automatic error reports through delivery installed before start', async () => {
    const on = vi.spyOn(process, 'on').mockReturnValue(process);
    const { client, sendEvent } = setup();
    sendEvent.mockResolvedValue({ status: 'stored' });
    client.start({
      apiKey: 'test-key',
      plugins: [nodeNotifyUnhandledExceptions],
    });
    const listener = on.mock.calls.find(
      ([name]) => name === 'uncaughtException'
    )![1];
    listener(new Error('Unhandled'), 'uncaughtException');
    await vi.waitFor(() => expect(sendEvent).toHaveBeenCalledOnce());
    expect(sendEvent.mock.calls[0][0].events[0]).toMatchObject({
      unhandled: true,
      severity: 'error',
      metaData: { origin: 'uncaughtException' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('replays a JSON-restored payload without callbacks or new event details', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const { client, sendEvent } = setup();
    const onError = vi.fn();
    client.start({ apiKey: 'test-key', appVersion: '1.2.3', onError });
    sendEvent.mockResolvedValue({ status: 'stored' });
    await client.notify('Original error');
    const saved = JSON.stringify(sendEvent.mock.calls[0][0]);
    const restored: DeliveryPayload = JSON.parse(saved);
    vi.setSystemTime(new Date('2025-01-02T00:00:00Z'));
    client.leaveBreadcrumb('Later');
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 202 }));
    const delivery = new FetchDelivery(client);
    await expect(delivery.sendEvent(restored)).resolves.toEqual({
      status: 'sent',
    });
    const options = vi.mocked(fetch).mock.calls[0][1]!;
    expect(options.body).toBe(saved);
    expect(options.headers).toMatchObject({
      'Bugsnag-Sent-At': '2025-01-02T00:00:00.000Z',
    });
    expect(restored.events[0].device?.time).toBe('2025-01-01T00:00:00.000Z');
    expect(restored.events[0].app?.version).toBe('1.2.3');
    expect(onError).toHaveBeenCalledOnce();
  });
});

describe('fetch delivery', () => {
  const payload: DeliveryPayload = {
    apiKey: 'test-key',
    payloadVersion: '5',
    notifier: { name: 'test', version: '1', url: 'https://example.com' },
    events: [
      {
        exceptions: [{ errorClass: 'Error', message: 'Oops', stacktrace: [] }],
      },
    ],
  };
  const delivery = new FetchDelivery({
    endpoints: { notify: 'https://example.com/notify' },
  });

  it.each([200, 202, 204])('reports acceptance for HTTP %i', async (status) => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status }));
    await expect(delivery.sendEvent(payload)).resolves.toEqual({
      status: 'sent',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/notify',
      expect.objectContaining({
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          'Bugsnag-Api-Key': 'test-key',
          'Bugsnag-Payload-Version': '5',
        }),
      })
    );
  });

  it.each([400, 429, 500])(
    'returns HTTP %i without retrying',
    async (statusCode) => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, { status: statusCode })
      );
      await expect(delivery.sendEvent(payload)).resolves.toEqual({
        status: 'failed',
        statusCode,
        error: expect.any(Error),
      });
      expect(fetch).toHaveBeenCalledOnce();
    }
  );

  it('returns network failures without rejecting', async () => {
    const error = new TypeError('Offline');
    vi.mocked(fetch).mockRejectedValue(error);
    await expect(delivery.sendEvent(payload)).resolves.toEqual({
      status: 'failed',
      error,
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('returns serialization failures without submitting a request', async () => {
    const invalidPayload = {
      ...payload,
      events: [{ ...payload.events[0], metaData: { bigint: 1n } }],
    };
    await expect(delivery.sendEvent(invalidPayload)).resolves.toMatchObject({
      status: 'failed',
      error: expect.any(Error),
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('propagates HTTP failures through notify', async () => {
    const client = new BugsnagStatic();
    client.start({ apiKey: 'test-key' });
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 429 }));
    await expect(client.notify('error')).resolves.toMatchObject({
      status: 'failed',
      statusCode: 429,
    });
  });
});
