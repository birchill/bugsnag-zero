import type { NotifyResult } from './client';

export function notifyFailure(
  cause: unknown
): Extract<NotifyResult, { status: 'failed' }> {
  return {
    status: 'failed',
    error:
      cause instanceof Error
        ? cause
        : new Error(
            typeof cause === 'string' ? cause : 'Unknown error while reporting',
            { cause }
          ),
  };
}
