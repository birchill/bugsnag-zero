import type { BugsnagException, StackFrame } from './event';
import { isError } from './is-error';
import { isObject } from './is-object';
import { parseStack } from './parse-stack';
import { NonEmptyArray } from './type-helpers';

export function toExceptions(
  maybeError: unknown,
  component: string
): {
  exceptions: NonEmptyArray<BugsnagException>;
  metadata?: Record<string, any>;
} {
  const error = normalizeError(maybeError, component);

  // Add metadata for non-errors
  let metadata: Record<string, any> | undefined;
  if (error.name === 'InvalidError') {
    metadata = {
      [component]: {
        'non-error parameter': maybeError,
      },
    };
  }

  // Merge any metadata defined on the object itself
  if (
    typeof (error as any).metadata !== 'undefined' &&
    isObject((error as any).metadata)
  ) {
    metadata = { ...metadata, [error.name]: (error as any).metadata };
  }

  const exceptions: NonEmptyArray<BugsnagException> = [makeException(error)];

  // Add any causes
  exceptions.push(
    ...getCauses(error).map((cause) =>
      makeException(cause, { backtrace: false })
    )
  );

  return { exceptions, metadata };
}

function normalizeError(maybeError: unknown, component: string): Error {
  if (isError(maybeError)) {
    return maybeError;
  }

  let error = fromSimpleError(maybeError);
  if (error) {
    return error;
  }

  switch (typeof error) {
    case 'string':
    case 'number':
    case 'boolean':
      return new Error(String(maybeError));

    default: {
      error = new Error(
        `${component} received a non-error. See "${component}" tab for more detail.`
      );
      error.name = 'InvalidError';
      return error;
    }
  }
}

function fromSimpleError(error: unknown): Error | null {
  if (!isObject(error)) {
    return null;
  }

  const getStringMember = (field: string) =>
    typeof error[field] === 'string' && error[field].length
      ? error[field]
      : undefined;

  const name = getStringMember('name') || getStringMember('errorClass');
  const message = getStringMember('message') || getStringMember('errorMessage');
  if (!name || !message) {
    return null;
  }

  const newError = new Error(message);
  newError.name = name;
  return newError;
}

function makeException(
  error: Error,
  stackOptions: { backtrace: boolean } = { backtrace: false }
): BugsnagException {
  return {
    errorClass: error.name,
    message: error.message,
    stacktrace: getStacktrace(error, stackOptions),
    type:
      typeof self === 'object' && (self as Window).navigator
        ? 'browserjs'
        : 'nodejs',
  };
}

function getStacktrace(
  error: Error,
  { backtrace }: { backtrace: boolean }
): Array<StackFrame> {
  const stackString = getStackString(error);
  if (stackString) {
    return parseStack(stackString);
  } else if (backtrace) {
    // TODO: We'll probably want to trim this to remove some of our own
    // frames from it but let's wait until we actually have some examples of
    // that to work with.
    return generateBacktrace();
  } else {
    return [];
  }
}

function getStackString(error: Error): string | undefined {
  const stack = error.stack || (error as any).stacktrace;
  return typeof stack === 'string' &&
    stack.length &&
    stack !== `${error.name}: ${error.message}`
    ? stack
    : undefined;
}

const MAX_STACK_SIZE = 20;

// The following is based on
//
// https://github.com/stacktracejs/stack-generator/blob/master/stack-generator.js
//
// which is licensed to the Public Domain.
function generateBacktrace(): Array<StackFrame> {
  const stack: Array<StackFrame> = [];

  // arguments.callee cannot be accessed in strict mode.
  /* eslint @typescript-eslint/ban-types: 0 */
  let curr: Function;
  try {
    curr = arguments.callee;
  } catch (_e) {
    return [];
  }

  while (curr && stack.length < MAX_STACK_SIZE) {
    if (curr.name) {
      stack.push({ method: curr.name, file: '(unknown file)' });
    } else if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
      stack.push({ method: RegExp.$1, file: '(unknown file)' });
    }

    try {
      curr = curr.caller;
    } catch (e) {
      break;
    }
  }

  return stack;
}

function getCauses(error: Error): Array<Error> {
  if (!error.cause) {
    return [];
  }

  const cause = normalizeError(error.cause, 'cause');
  if (cause.name === 'InvalidError') {
    return [];
  }

  return [cause].concat(getCauses(cause));
}
