import { ExtendedClientApi, Plugin } from './client';
import { toExceptions } from './to-exceptions';

export const nodeNotifyUnhandledExceptions: Plugin = {
  name: 'nodeNotifyUnhandledExceptions',
  load(client: ExtendedClientApi) {
    process.on('uncaughtException', (error: Error, origin: string) => {
      const { exceptions, metadata } = toExceptions(error, 'uncaughtException');

      client.notifyEvent(
        {
          exceptions,
          unhandled: true,
          severity: 'error',
          severityReason: {
            type: 'unhandledException',
          },
          metadata: { ...metadata, origin },
        },
        error
      );
    });
  },
};
