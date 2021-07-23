import { ExtendedClientApi, Plugin } from './client';
import { toException } from './to-exception';

export const handledRejectionBreadcrumbs: Plugin = {
  name: 'handledRejectionBreadcrumbs',
  load(client: ExtendedClientApi) {
    self.addEventListener('rejectionhandled', (evt: PromiseRejectionEvent) => {
      const error = evt.reason;

      const { exception } = toException(error, 'handledrejection');
      const message = `Handled Promise rejection: [${exception.errorClass}] ${exception.message}`;

      client.leaveBreadcrumb(
        message,
        { stacktrace: exception.stacktrace },
        'error'
      );
    });
  },
};
