import { ExtendedClientApi, Plugin } from './client';
import { BugsnagEvent } from './event';

export const redactKeys = (keys: Array<string>): Plugin => ({
  name: 'redactKeys',
  load(client: ExtendedClientApi) {
    client.addOnError(function redact(event: BugsnagEvent) {
      event.request = doRedactKeys(event.request, keys);

      if (event.metaData) {
        event.metaData = doRedactKeys(event.metaData, keys);
      }

      if (event.breadcrumbs) {
        event.breadcrumbs.map((breadcrumb) => ({
          ...breadcrumb,
          metaData: doRedactKeys(breadcrumb.metaData, keys),
        }));
      }
    });
  },
});

function doRedactKeys<T>(target: T, keys: Array<string>): T {
  if (Array.isArray(target)) {
    // The following cast isn't strictly correct (since by redacting we could be
    // changing the type) but it's good enough for our purposes.
    return target.map((elem) => doRedactKeys(elem, keys)) as unknown as T;
  }

  if (typeof target !== 'object' || target === null) {
    return target;
  }

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(target)) {
    if (keys.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = doRedactKeys(value, keys);
    }
  }

  return redacted as unknown as T;
}
