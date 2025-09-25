import { ExtendedClientApi, Plugin } from './client';
import { toExceptions } from './to-exceptions';

export const nodeNotifyUnhandledRejections: Plugin = {
  name: 'nodeNotifyUnhandledRejections',
  load(client: ExtendedClientApi) {
    process.prependListener('unhandledRejection', (reason, promise) => {
      const { exceptions, metadata } = toExceptions(
        reason,
        'unhandledrejection'
      );

      client.notifyEvent(
        {
          exceptions,
          unhandled: true,
          severity: 'error',
          severityReason: {
            type: 'unhandledPromiseRejection',
          },
          metadata: { ...metadata, promise },
        },
        reason
      );
    });
  },
};
