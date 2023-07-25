import {
  AccessError,
  CircularReference,
  safeAccess,
  safeFilter,
} from './safe-filter';

export function stringify(
  input: unknown,
  options?: {
    depthLimit?: number;
    edgesLimit?: number;
  }
): unknown {
  return safeFilter(
    input,
    (_key: string | number, value: unknown) => {
      if (value === CircularReference) {
        return '[Circular]';
      }

      if (value === AccessError) {
        return '[Error]';
      }

      if (
        typeof value === 'bigint' ||
        typeof value === 'symbol' ||
        value instanceof RegExp
      ) {
        return safeAccess(() => (value as any).toString());
      }

      if (value instanceof Map) {
        return {
          type: 'Map',
          value: safeAccess(() => [...(value as Map<any, any>).entries()]),
        };
      }

      if (value instanceof Set) {
        return {
          type: 'Set',
          value: safeAccess(() => [...(value as Set<any>).values()]),
        };
      }

      if (typeof value === 'function') {
        return safeAccess(() =>
          truncateString(
            (value as Function).toString().replace(/\s+/g, ' '),
            50
          )
        );
      }

      if (value instanceof Error) {
        const replacement = {};
        for (const key of Object.getOwnPropertyNames(value)) {
          (replacement as Record<string, any>)[key] = safeAccess(
            () => (value as any)[key]
          );
        }
        return replacement;
      }

      if (value instanceof ArrayBuffer) {
        return `ArrayBuffer(${value.byteLength})`;
      }

      return value;
    },
    options
  );
}

function truncateString(input: string, maxLength: number) {
  return input.length > maxLength
    ? input.substring(0, maxLength - 3) + '...'
    : input;
}
