import { ExtendedClientApi, Plugin } from './client';
import { toException } from './to-exception';

export const browserNotifyUnhandledRejections: Plugin = {
  name: 'browserNotifyUnhandledRejections',
  load(client: ExtendedClientApi) {
    self.addEventListener(
      'unhandledrejection',
      (evt: PromiseRejectionEvent) => {
        const error = evt.reason;

        const { exception, metadata } = toException(
          error,
          'unhandledrejection'
        );

        // The official bugsnag client digs into `error` and, if it has no
        // stack, but is an Error object, it pulls out the name, message, code
        // and adds them to a metadata tab called 'unhandledRejection handler'.
        //
        // I don't understand this. Surely we'll have the same information in
        // our exception object already?

        client.notifyEvent({
          exceptions: [exception],
          unhandled: true,
          severity: 'error',
          severityReason: {
            type: 'unhandledPromiseRejection',
          },
          metadata,
        });
      }
    );
  },
};
