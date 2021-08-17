import { BreadcrumbType, BugsnagEvent, User } from './event';
import { Notifier } from './notifier';

export interface Client {
  // This deviates from the official bugsnag client in that as an alternative
  // to supplying an an onError function to modify the error, we allow setting
  // various options directly through an options argument.
  notify(
    error: NotifiableError,
    options?:
      | {
          metadata?: Record<string, any>;
          severity?: BugsnagEvent['severity'];
        }
      | OnErrorCallback
  ): Promise<void>;

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

export type Delivery = {
  sendEvent(params: {
    apiKey: string;
    events: Array<BugsnagEvent>;
    notifier: Notifier;
    payloadVersion: string;
  }): Promise<void>;
};

// Internal API for plugins

export interface ExtendedClientApi extends Client {
  notifyEvent(event: PartialEvent): Promise<void>;
}

export type PartialEvent = {
  exceptions: BugsnagEvent['exceptions'];
  unhandled?: BugsnagEvent['unhandled'];
  severity?: BugsnagEvent['severity'];
  severityReason?: BugsnagEvent['severityReason'];
  metadata?: BugsnagEvent['metaData'];
  onError?: OnErrorCallback;
};
