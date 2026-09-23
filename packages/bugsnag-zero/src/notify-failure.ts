import type { NotifyResult } from './client';

export function notifyFailure(
  cause: unknown
): Extract<NotifyResult, { status: 'failed' }> {
  let error: Error;
  try {
    error =
      cause instanceof Error ? cause : new Error(String(cause), { cause });
  } catch {
    // Even a thrown value's string conversion can fail.
    error = new Error('Unknown error while reporting', { cause });
  }

  return { status: 'failed', error };
}
