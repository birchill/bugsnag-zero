import { ExtendedClientApi, Plugin } from './client';
import { BugsnagEvent } from './event';

export const errorBreadcrumbs: Plugin = {
  name: 'errorBreadcrumbs',
  load(client: ExtendedClientApi) {
    client.addOnPostError((event: BugsnagEvent) => {
      client.leaveBreadcrumb(
        event.exceptions[0].errorClass,
        {
          errorClass: event.exceptions[0].errorClass,
          errorMessage: event.exceptions[0].message,
          severity: event.severity,
        },
        'error'
      );
    });
  },
};
