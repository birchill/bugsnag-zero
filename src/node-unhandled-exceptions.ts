import { ExtendedClientApi, Plugin } from './client';
import { toException } from './to-exception';

export const nodeNotifyUnhandledExceptions: Plugin = {
  name: 'nodeNotifyUnhandledExceptions',
  load(client: ExtendedClientApi) {
    process.on('uncaughtException', (error: Error, origin: string) => {
      const { exception, metadata } = toException(error, 'uncaughtException');

      client.notifyEvent({
        exceptions: [exception],
        unhandled: true,
        severity: 'error',
        severityReason: {
          type: 'unhandledException',
        },
        metadata: { ...metadata, origin },
      });
    });
  },
};
