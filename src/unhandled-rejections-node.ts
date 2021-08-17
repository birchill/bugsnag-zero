import { ExtendedClientApi, Plugin } from './client';
import { toException } from './to-exception';

export const notifyUnhandledRejectionsNode: Plugin = {
  name: 'notifyUnhandledRejectionsNode',
  load(client: ExtendedClientApi) {
    process.prependListener('unhandledRejection', (reason, promise) => {
      const { exception, metadata } = toException(reason, 'unhandledrejection');

      client.notifyEvent({
        exceptions: [exception],
        unhandled: true,
        severity: 'error',
        severityReason: {
          type: 'unhandledPromiseRejection',
        },
        metadata: { ...metadata, promise },
      });
    });
  },
};
