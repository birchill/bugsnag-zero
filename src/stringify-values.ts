import type { ExtendedClientApi, Plugin } from './client';
import type { BugsnagEvent } from './event';
import { stringify } from './stringify';

/**
 * Plugin to try to stringify various unserializable JS objects (e.g. bigints,
 * Maps, Sets, functions, Error objects, Regexps) in Bugsnag events.
 */
export const stringifyValues: Plugin = {
  name: 'stringifyValues',
  load(client: ExtendedClientApi) {
    client.addOnError(function stringifyValues(event: BugsnagEvent) {
      if (event.metaData) {
        event.metaData = stringify(event.metaData) as BugsnagEvent['metaData'];
      }

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
          ...breadcrumb,
          metaData: stringify(breadcrumb.metaData),
        })) as BugsnagEvent['breadcrumbs'];
      }
    });
  },
};
