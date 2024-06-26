import type { ExtendedClientApi, Plugin } from './client';
import type { BugsnagException } from './event';
import { toExceptions } from './to-exceptions';
import { NonEmptyArray } from './type-helpers';

export const browserNotifyUnhandledExceptions: Plugin = {
  name: 'browserNotifyUnhandledExceptions',
  load(client: ExtendedClientApi) {
    self.addEventListener('error', (evt: ErrorEvent | Event) => {
      let exceptions: NonEmptyArray<BugsnagException>;
      let metadata: Record<string, any> | undefined;

      if (evt instanceof ErrorEvent) {
        const { message, filename: file, lineno, colno, error } = evt;
        const lineNumber = Number.isSafeInteger(lineno) ? lineno : undefined;
        if (lineNumber === 0 && /Script error\.?/.test(message)) {
          console.log('Ignoring cross-domain or eval script error.');
          return;
        }

        ({ exceptions, metadata } = toExceptions(error, 'window onerror'));

        // Augment first stacktrace if we have more info in the ErrorEvent than
        // the stack trace we got.
        const columnNumber = Number.isSafeInteger(colno) ? colno : undefined;
        const { stacktrace } = exceptions[0];
        if (!stacktrace.length) {
          stacktrace.push({
            file,
            lineNumber,
            columnNumber,
            method: '(unknown file)',
          });
        } else {
          const firstStackFrame = stacktrace[0];
          firstStackFrame.file = firstStackFrame.file || file;
          firstStackFrame.lineNumber = firstStackFrame.lineNumber ?? lineNumber;
          firstStackFrame.columnNumber =
            firstStackFrame.columnNumber ?? columnNumber;
        }
      } else {
        ({ exceptions, metadata } = toExceptions(evt, 'window onerror'));
      }

      client.notifyEvent(
        {
          exceptions,
          unhandled: true,
          severity: 'error',
          severityReason: {
            type: 'unhandledException',
          },
          metadata,
        },
        evt
      );
    });
  },
};
