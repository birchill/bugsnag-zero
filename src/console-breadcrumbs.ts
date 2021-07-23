import { ExtendedClientApi, Plugin } from './client';

export const consoleBreadcrumbs: Plugin = {
  name: 'consoleBreadcrumbs',
  load(client: ExtendedClientApi) {
    const methodsToHook = (
      ['log', 'debug', 'info', 'warn', 'error'] as Array<keyof Console>
    ).filter(
      (method) =>
        typeof console !== 'undefined' && typeof console[method] === 'function'
    );

    for (const method of methodsToHook) {
      const original = console[method];
      console[method] = (...args: Array<any>) => {
        client.leaveBreadcrumb(
          'Console output',
          args.reduce(
            (metadata: Record<string, any>, arg: any, i: number) => {
              // Try to stringify each argument
              let stringified = '[Unknown value]';

              // Try to use toString.
              //
              // This may fail if the input is:
              //
              // - an object whose [[Prototype]] is null (no toString), or
              // - an object with a broken toString or @@toPrimitive
              //   implementation
              try {
                stringified = String(arg);
              } catch (_e) {
                /* Ignore */
              }

              // If it stringifies to [object Object] attempt to JSON stringify
              if (stringified === '[object Object]') {
                // But catch any stringify errors (falling back to
                // [object Object])
                try {
                  stringified = JSON.stringify(arg);
                } catch (_e) {
                  /* Ignore */
                }
              }

              metadata[`[${i}]`] = stringified;
              return metadata;
            },
            {
              // The official client attempts to map console.group to 'log' here
              // but it never actually hooks console.group.
              severity: method,
            }
          ),
          'log'
        );
        original.apply(console, args);
      };
    }
  },
};
