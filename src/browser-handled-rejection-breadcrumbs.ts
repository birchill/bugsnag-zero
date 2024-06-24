import { ExtendedClientApi, Plugin } from './client';
import { toExceptions } from './to-exceptions';

export const browserHandledRejectionBreadcrumbs: Plugin = {
  name: 'browserHandledRejectionBreadcrumbs',
  load(client: ExtendedClientApi) {
    self.addEventListener('rejectionhandled', (evt: PromiseRejectionEvent) => {
      const error = evt.reason;

      const { exceptions } = toExceptions(error, 'handledrejection');
      const message = `Handled Promise rejection: [${exceptions[0].errorClass}] ${exceptions[0].message}`;

      client.leaveBreadcrumb(
        message,
        { stacktrace: exceptions[0].stacktrace },
        'error'
      );
    });
  },
};
