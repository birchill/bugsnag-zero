import { ExtendedClientApi, Plugin } from './client';
import { toException } from './to-exception';

export const notifyUnhandledExceptions: Plugin = {
  name: 'notifyUnhandledExceptions',
  load(client: ExtendedClientApi) {
    self.addEventListener('error', (evt: ErrorEvent) => {
      const { message, filename: file, lineno, colno, error } = evt;
      const lineNumber = Number.isSafeInteger(lineno) ? lineno : undefined;
      if (lineNumber === 0 && /Script error\.?/.test(message)) {
        console.log('Ignoring cross-domain or eval script error.');
        return;
      }

      const { exception, metadata } = toException(error, 'window onerror');

      // Augment first stacktrace if we have more info in the ErrorEvent than
      // the stack trace we got.
      const columnNumber = Number.isSafeInteger(colno) ? colno : undefined;
      const { stacktrace } = exception;
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

      client.notifyEvent({
        exceptions: [exception],
        unhandled: true,
        severity: 'error',
        severityReason: {
          type: 'unhandledException',
        },
        metadata,
      });
    });
  },
};
