import { ExtendedClientApi, Plugin } from './client';
import { BugsnagEvent } from './event';

export interface RedactKeysPluginResult {
  redactEvent(event: BugsnagEvent): BugsnagEvent;
  redactObject<T>(obj: T): T;
}

export const redactKeys = (keys: Array<string>): Plugin => ({
  name: 'redactKeys',
  load(client: ExtendedClientApi): RedactKeysPluginResult {
    client.addOnError(function redact(event: BugsnagEvent) {
      redactEventInPlace(event, keys);
    });

    return {
      redactEvent: (event: BugsnagEvent) => {
        const copy = JSON.parse(JSON.stringify(event));
        return redactEventInPlace(copy, keys);
      },
      redactObject: <T>(obj: T): T => {
        const copy = JSON.parse(JSON.stringify(obj));
        return redactInPlace(copy, keys);
      },
    };
  },
});

function redactEventInPlace(
  event: BugsnagEvent,
  keys: Array<string>
): BugsnagEvent {
  event.request = redactInPlace(event.request, keys);

  if (event.metaData) {
    event.metaData = redactInPlace(event.metaData, keys);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      metaData: redactInPlace(breadcrumb.metaData, keys),
    }));
  }

  return event;
}

function redactInPlace<T>(target: T, keys: Array<string>): T {
  if (Array.isArray(target)) {
    // The following cast isn't strictly correct (since by redacting we could be
    // changing the type) but it's good enough for our purposes.
    return target.map((elem) => redactInPlace(elem, keys)) as unknown as T;
  }

  if (typeof target !== 'object' || target === null) {
    return target;
  }

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(target)) {
    if (keys.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactInPlace(value, keys);
    }
  }

  return redacted as unknown as T;
}
