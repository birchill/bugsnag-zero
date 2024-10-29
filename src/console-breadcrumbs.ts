import { ExtendedClientApi, Plugin } from './client';

export const consoleBreadcrumbs: Plugin = {
  name: 'consoleBreadcrumbs',
  load(client: ExtendedClientApi) {
    // We need to exclude the 'Console' ctor function because it's in Node's
    // Console interface but not the DOM one.
    type nonCtorKeys = Exclude<keyof Console, 'Console'>;
    const methodsToHook = (
      ['log', 'debug', 'info', 'warn', 'error'] as Array<nonCtorKeys>
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
              } catch {
                /* Ignore */
              }

              // If it stringifies to [object Object] attempt to JSON stringify
              if (stringified === '[object Object]') {
                // But catch any stringify errors (falling back to
                // [object Object])
                try {
                  stringified = JSON.stringify(arg);
                } catch {
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
