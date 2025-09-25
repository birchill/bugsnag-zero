import type { ExtendedClientApi, Plugin } from './client';
import type { BugsnagEvent } from './event';
import { safeFilter } from './safe-filter';

export interface RedactKeysPluginResult {
  redactEvent(event: BugsnagEvent): BugsnagEvent;
  redactObject<T>(obj: T): T;
}

export const redactKeys = (keys: Array<string>): Plugin => ({
  name: 'redactKeys',
  load(client: ExtendedClientApi): RedactKeysPluginResult {
    client.addOnError(function redact(event: BugsnagEvent) {
      redactObject(event, keys);
    });

    return {
      redactEvent: (event: Readonly<BugsnagEvent>) => redactEvent(event, keys),
      redactObject: <T>(obj: Readonly<T>): T => redactObject(obj, keys),
    };
  },
});

export function redactEvent(
  event: BugsnagEvent,
  keys: Array<string>
): BugsnagEvent {
  event.request = redactObject(event.request, keys);

  if (event.metaData) {
    event.metaData = redactObject(event.metaData, keys);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      metaData: redactObject(breadcrumb.metaData, keys),
    }));
  }

  return event;
}

export function redactObject<T>(object: T, keys: Array<string>): T {
  // The following cast isn't strictly correct since by redacting we could be
  // changing the type but it's good enough for our purposes.
  return safeFilter(object, (key, value) => {
    return typeof key === 'string' && keys.includes(key) ? '[REDACTED]' : value;
  }) as unknown as T;
}
