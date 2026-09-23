import type { BreadcrumbType, BugsnagEvent, User } from './event';
import type { Notifier } from './notifier';

export interface Client {
  // This deviates from the official bugsnag client in that as an alternative
  // to supplying an an onError function to modify the error, we allow setting
  // various options directly through an options argument.
  notify<ErrorType = unknown>(
    error: ErrorType,
    options?:
      | {
          metadata?: Record<string, any>;
          severity?: BugsnagEvent['severity'];
        }
      | OnErrorCallback
  ): Promise<NotifyResult>;

  /** Replace the delivery implementation, including before starting the client. */
  setDelivery(delivery: Delivery): void;

  // breadcrumbs
  leaveBreadcrumb(
    message: string,
    metadata?: { [key: string]: any },
    type?: BreadcrumbType
  ): void;

  // metadata
  /*
  public addMetadata(section: string, values: { [key: string]: any }): void;
  public addMetadata(section: string, key: string, value: any): void;
  public getMetadata(section: string, key?: string): any;
  public clearMetadata(section: string, key?: string): void;
  */

  // context
  /*
  public getContext(): string | undefined;
  public setContext(c: string): void;
  */

  // user
  getUser(): User;
  setUser(id?: string, email?: string, name?: string): void;

  // sessions
  /*
  public startSession(): Client;
  public pauseSession(): void;
  public resumeSession(): Client;
  */

  // callbacks
  addOnError(fn: OnErrorCallback): void;
  removeOnError(fn: OnErrorCallback): void;

  addOnPostError(fn: OnPostErrorCallback): void;
  removeOnPostError(fn: OnPostErrorCallback): void;

  /*
  public addOnBreadcrumb(fn: OnBreadcrumbCallback): void;
  public removeOnBreadcrumb(fn: OnBreadcrumbCallback): void;
  */

  // plugins
  getPlugin(name: string): unknown;

  // implemented on the browser notifier only
  /*
  public resetEventCount?(): void;
  */
}

// This is no longer used (we allow "unknown" to be passed to notify) but is
// provided for clients who want to type-check what they are passing to notify
// to ensure it will be reported as expected.
export type NotifiableError =
  | Error
  | { errorClass: string; errorMessage: string }
  | { name: string; message: string }
  | string;

// Unlike the official client, we don't support passing a callback argument.
export type OnErrorCallback = (
  event: BugsnagEvent
) => void | boolean | Promise<void | boolean>;

export type OnPostErrorCallback = (event: BugsnagEvent) => void;

export type Plugin = {
  name?: string;
  load(client: ExtendedClientApi): any;
};

export type EventForDelivery = Omit<BugsnagEvent, 'originalError'>;

/** The outcome of preparing and delivering a report. Reporting failures resolve. */
export type NotifyResult =
  /** Accepted by the delivery destination; not confirmation of processing. */
  | { status: 'sent' }
  /** Persisted by custom delivery. The SDK does not schedule retries. */
  | { status: 'stored' }
  /** Core reasons: not-started, disabled, callback. Custom delivery may add others. */
  | { status: 'skipped'; reason: string }
  /** Preparation or delivery failed. HTTP failures also include statusCode. */
  | { status: 'failed'; error: Error; statusCode?: number };

/**
 * A detached JSON-compatible snapshot, ready for delivery or persistence.
 * Contains the configured API key but no original Error object. Sending this
 * payload again preserves its event timestamps, app version, and breadcrumbs.
 */
export type DeliveryPayload = {
  apiKey: string;
  events: Array<EventForDelivery>;
  notifier: Notifier;
  payloadVersion: string;
};

export type Delivery = {
  /**
   * Resolve once the request has completed or persistence has succeeded.
   * `stored` does not imply that the SDK will retry delivery.
   * Custom implementations may throw; notify converts failures into results.
   */
  sendEvent(payload: DeliveryPayload): Promise<NotifyResult>;
};

// Internal API for plugins

export interface ExtendedClientApi extends Client {
  readonly endpoints: Readonly<{ notify: string }>;
  notifyEvent(
    event: PartialEvent,
    originalError: unknown
  ): Promise<NotifyResult>;
}

export type PartialEvent = {
  exceptions: BugsnagEvent['exceptions'];
  unhandled?: BugsnagEvent['unhandled'];
  severity?: BugsnagEvent['severity'];
  severityReason?: BugsnagEvent['severityReason'];
  metadata?: BugsnagEvent['metaData'];
  onError?: OnErrorCallback;
};
