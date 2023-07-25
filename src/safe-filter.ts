export type Replacer = (key: string | number, value: unknown) => unknown;

export const CircularReference = Symbol('Circular');
export const AccessError = Symbol('AccessError');

/**
 * Iterate through an object's properties and return a copy with the values
 * replaced by the result of the replacer function.
 *
 * Detects circular references and replaces them with the `CircularReference`
 * symbol.
 *
 * Detects errors accessing properties and replaces them with the `AccessError`
 * symbol.
 *
 * For any objects with a `toJSON` function, it will be called instead of
 * traversing the object's properties.
 */
export function safeFilter(
  input: unknown,
  replacer?: Replacer | null,
  options?: { depthLimit?: number; edgesLimit?: number }
): unknown {
  return filter({
    key: '',
    value: input,
    replacer,
    seen: [],
    depth: 0,
    depthLimit: options?.depthLimit,
    edgeIndex: 0,
    edgesLimit: options?.edgesLimit,
  });
}

function filter({
  key,
  value,
  replacer,
  seen,
  depthLimit = Infinity,
  depth,
  edgeIndex,
  edgesLimit = Infinity,
}: {
  key: string | number;
  value: unknown;
  replacer?: Replacer | null;
  seen: unknown[];
  depth: number;
  depthLimit?: number;
  edgeIndex: number;
  edgesLimit?: number;
}): unknown {
  let replacement = value;

  if (seen.includes(replacement)) {
    replacement = CircularReference;
  }

  if (replacer) {
    replacement = replacer(key, replacement);
  }

  if (hasToJson(replacement)) {
    replacement = safeAccess(() =>
      (replacement as withToJson).toJSON(String(key))
    );
  }

  // TODO: We really should re-run our cyclic dependency check at this point in
  // case the replacer or toJSON has created a new cyclic dependency.
  //
  // Surely no-one would do that though, right?

  if (replacement === null || typeof replacement !== 'object') {
    return replacement;
  }

  if (depth > depthLimit || edgeIndex + 1 > edgesLimit) {
    return '[...]';
  }

  seen.push(value);

  if (Array.isArray(replacement)) {
    const copy: unknown[] = [];
    const limit = Math.min(replacement.length, edgesLimit);

    for (let i = 0; i < limit; i++) {
      const item = safeAccess(() => (replacement as unknown[])[i]);

      copy.push(
        filter({
          key: i,
          value: item,
          replacer,
          seen,
          depth,
          depthLimit,
          edgeIndex: i,
          edgesLimit,
        })
      );
    }

    if (limit < replacement.length) {
      copy.push('[...]');
    }

    replacement = copy;
  } else {
    const copy: Record<string, unknown> = {};

    const keys = Object.keys(replacement as object);
    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i];
      const value = safeAccess(
        () => (replacement as Record<string, unknown>)[currentKey]
      );

      copy[currentKey] = filter({
        key: currentKey,
        value,
        replacer,
        seen,
        depth,
        depthLimit,
        edgeIndex: i,
        edgesLimit,
      });
    }

    replacement = copy;
  }

  seen.pop();

  return replacement;
}

export function safeAccess<T>(accessor: () => T): T | typeof AccessError {
  try {
    return accessor();
  } catch {
    return AccessError;
  }
}

type withToJson = { toJSON: (key?: string) => unknown };

function hasToJson(value: unknown): value is withToJson {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toJSON' in value &&
    typeof (value as { toJSON: unknown }).toJSON === 'function'
  );
}
