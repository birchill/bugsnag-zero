import { afterEach, expect, it, vi } from 'vitest';

import { browserNotifyUnhandledExceptions } from './browser-unhandled-exceptions';
import type { ExtendedClientApi } from './client';

afterEach(() => vi.unstubAllGlobals());

it('reports the browser message and location when the error value is missing', () => {
  class TestErrorEvent {
    message = 'Something failed';
    filename = 'https://example.com/app.js';
    lineno = 12;
    colno = 34;
    error = undefined;
  }
  let listener: (event: TestErrorEvent) => void = () => {};
  vi.stubGlobal('ErrorEvent', TestErrorEvent);
  vi.stubGlobal('self', {
    addEventListener: (_type: string, callback: typeof listener) => {
      listener = callback;
    },
  });
  const notifyEvent = vi.fn();
  browserNotifyUnhandledExceptions.load({
    notifyEvent,
  } as unknown as ExtendedClientApi);
  listener(new TestErrorEvent());

  const report = notifyEvent.mock.calls[0][0];
  expect(report.exceptions[0].message).toBe('Something failed');
  expect(report.exceptions[0].stacktrace).toEqual([
    {
      file: 'https://example.com/app.js',
      lineNumber: 12,
      columnNumber: 34,
      method: '(unknown file)',
    },
  ]);
  expect(report.metadata['window onerror']).toMatchObject({
    message: 'Something failed',
    filename: 'https://example.com/app.js',
    lineno: 12,
    colno: 34,
  });
});
