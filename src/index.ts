import {
  Client,
  Delivery,
  EventForDelivery,
  ExtendedClientApi,
  OnErrorCallback,
  OnPostErrorCallback,
  PartialEvent,
} from './client';
import { Config } from './config';
import { Breadcrumb, BreadcrumbType, BugsnagEvent, User } from './event';
import { FetchDelivery } from './fetch-delivery';
import { Notifier } from './notifier';
import { safeFilter } from './safe-filter';
import { toException } from './to-exception';

class BugsnagStatic implements ExtendedClientApi {
  private breadcrumbs: Array<Breadcrumb> = [];
  private config: Config | undefined;
  private delivery: Delivery = new FetchDelivery(this);
  private errorCallbacks: Set<OnErrorCallback> = new Set();
  private postErrorCallbacks: Set<OnPostErrorCallback> = new Set();
  private plugins: Array<{ name: string; plugin: any }> = [];

  start(config: Config): Client {
    if (this.config) {
      console.error(
        'Bugsnag.start called multiple times. Subsequent invocations will be ignored'
      );
      return this;
    }

    this.config = config;

    let errorCallbacks: Array<OnErrorCallback> | undefined = undefined;
    if (this.config.onError) {
      errorCallbacks =
        typeof this.config.onError === 'function'
          ? [this.config.onError]
          : this.config.onError;
    }
    this.errorCallbacks = new Set(errorCallbacks);

    for (const plugin of this.config.plugins || []) {
      this.plugins.push({
        name: plugin.name || 'unknown',
        plugin: plugin.load(this),
      });
    }

    this.leaveBreadcrumb('Bugsnag loaded', {}, 'state');

    return this;
  }

  get endpoints() {
    return {
      notify: this.config?.endpoints?.notify || 'https://notify.bugsnag.com/',
    };
  }

  notify<ErrorType = unknown>(
    error: ErrorType,
    options:
      | {
          metadata?: Record<string, any>;
          severity?: BugsnagEvent['severity'];
        }
      | OnErrorCallback = {}
  ): Promise<void> {
    let { exception, metadata } = toException(error, 'notify');

    let onError: OnErrorCallback | undefined;
    let severity: BugsnagEvent['severity'] | undefined;

    if (typeof options === 'function') {
      onError = options;
    } else {
      severity = options.severity;
      if (options.metadata) {
        metadata = { ...metadata, ...options.metadata };
      }
    }

    return this.notifyEvent(
      {
        exceptions: [exception],
        metadata,
        severity,
        onError,
      },
      error
    );
  }

  leaveBreadcrumb(
    message: string,
    metadata?: Record<string, any>,
    type?: BreadcrumbType
  ): void {
    if (!this.config) {
      // The official bugsnag client will produce a console eror in this case
      // but that's annoying since often unit tests will exercise code that
      // calls notify/leaveBreadcrumb and we don't want to have to either:
      //
      // (a) wrap each call to bugsnag in an "isTest" conditional, or
      // (b) ensure the bugsnag client is initialized at the start of each
      //     test
      return;
    }

    if (!message.length) {
      return;
    }

    this.breadcrumbs.push({
      name: message,
      metaData: metadata,
      type: type || 'manual',
      timestamp: new Date().toISOString(),
    });

    const { maxBreadcrumbs = 25 } = this.config;
    if (this.breadcrumbs.length > maxBreadcrumbs) {
      this.breadcrumbs.splice(0, this.breadcrumbs.length - maxBreadcrumbs);
    }
  }

  async notifyEvent(
    {
      exceptions,
      unhandled,
      severity,
      severityReason,
      metadata,
      onError,
    }: PartialEvent,
    originalError: unknown
  ): Promise<void> {
    if (!this.config) {
      // The official bugsnag client will produce a console eror in this case
      // but that's annoying since often unit tests will exercise code that
      // calls notify/leaveBreadcrumb and we don't want to have to either:
      //
      // (a) wrap each call to bugsnag in an "isTest" conditional, or
      // (b) ensure the bugsnag client is initialized at the start of each
      //     test
      return;
    }

    // Check if the current release stage is enabled
    const releaseStage = this.config.releaseStage || 'production';
    if (
      this.config.enabledReleaseStages &&
      !this.config.enabledReleaseStages.includes(releaseStage)
    ) {
      return;
    }

    const event: BugsnagEvent = {
      exceptions,
      breadcrumbs: this.breadcrumbs.length ? this.breadcrumbs : undefined,
      originalError,
      unhandled: typeof unhandled !== 'boolean' ? false : unhandled,
      severity: severity || 'warning',
      severityReason,
      user: this.config.user || undefined,
      app: {
        releaseStage,
        version: this.config.appVersion,
        type:
          this.config.appType ||
          (typeof window === 'object' ? 'browser' : 'node'),
      },
      device: { time: new Date().toISOString() },
      metaData: metadata || {},
    };

    // Error callbacks

    const errorCallbacks = [...this.errorCallbacks];
    if (onError) {
      errorCallbacks.push(onError);
    }

    // Make sure the redact and stringifyValues callbacks come last
    const sortLast = ['stringifyValues', 'redact'];
    errorCallbacks.sort((a, b) => {
      if (sortLast.includes(a.name) && sortLast.includes(b.name)) {
        return 0;
      } else if (sortLast.includes(a.name)) {
        return 1;
      } else if (sortLast.includes(b.name)) {
        return -1;
      } else {
        return 0;
      }
    });

    for (const callback of errorCallbacks) {
      const callbackResult = await callback(event);
      if (typeof callbackResult === 'boolean' && !callbackResult) {
        return;
      }
    }

    const notifier: Notifier = {
      name: '@birchill/bugsnag-zero',
      version: '1',
      url: 'https://github.com/birchill/bugsnag-zero',
    };

    const eventForDelivery = safeFilter(
      event,
      (key, value) => {
        if (key === 'originalError') {
          return undefined;
        }
        return value;
      },
      { depthLimit: 20, edgesLimit: 500 }
    ) as EventForDelivery;

    let body: string;
    const payload = {
      apiKey: this.config.apiKey,
      payloadVersion: '5',
      notifier,
      events: [eventForDelivery],
    };

    try {
      body = JSON.stringify(payload);
    } catch {
      eventForDelivery.metaData = {
        notifier: 'Unable to serialize metadata',
      };

      body = JSON.stringify(payload);
    }

    // Check the size of the payload
    if (body.length > 10e5) {
      eventForDelivery.metaData = {
        notifier: `Payload was ${body.length / 10e5}Mb. Metadata removed.`,
      };
      body = JSON.stringify(payload);
      if (body.length > 10e5) {
        throw new Error('Payload exceeded 1Mb limit');
      }
    }

    // Although it's called "post error" we run these callbacks before we
    // actually send the event over the network since sending is async and if
    // the callback is logging the fact that an error was recorded then we want
    // that log entry to appear in the correct sequence, particularly if other
    // things take place while the fetch is still happenning.
    for (const callback of this.postErrorCallbacks) {
      callback(event);
    }

    try {
      await this.delivery.sendEvent(payload);
    } catch (e) {
      console.error('Failed to post report to Bugsnag', e);
    }
  }

  getUser(): User {
    return this.config?.user || {};
  }

  setUser(id?: string, email?: string, name?: string): void {
    if (!this.config) {
      return;
    }

    this.config.user = { id, email, name };
  }

  addOnError(fn: OnErrorCallback): void {
    this.errorCallbacks.add(fn);
  }

  removeOnError(fn: OnErrorCallback): void {
    this.errorCallbacks.delete(fn);
  }

  addOnPostError(fn: OnPostErrorCallback): void {
    this.postErrorCallbacks.add(fn);
  }

  removeOnPostError(fn: OnPostErrorCallback): void {
    this.postErrorCallbacks.delete(fn);
  }

  getPlugin(name: string): unknown {
    return this.plugins.find((plugin) => plugin.name === name)?.plugin;
  }

  setDelivery(delivery: Delivery) {
    this.delivery = delivery;
  }
}

const Bugsnag = new BugsnagStatic();

export default Bugsnag;
export {
  Client,
  Delivery,
  ExtendedClientApi,
  NotifiableError,
  Plugin,
} from './client';
export { Config } from './config';
export { fromLegacyConfig, LegacyConfig } from './legacy-config';
export { BugsnagEvent as Event } from './event';
export { Notifier } from './notifier';

// Breadcrumb loggers
export { consoleBreadcrumbs } from './console-breadcrumbs';
export { errorBreadcrumbs } from './error-breadcrumbs';
export { fetchBreadcrumbs } from './fetch-breadcrumbs';
export { interactionBreadcrumbs } from './interaction-breadcrumbs';
export { navigationBreadcrumbs } from './navigation-breadcrumbs';
export { browserHandledRejectionBreadcrumbs } from './browser-handled-rejection-breadcrumbs';

// Error notifiers
export { browserNotifyUnhandledExceptions } from './browser-unhandled-exceptions';
export { browserNotifyUnhandledRejections } from './browser-unhandled-rejections';
export { nodeNotifyUnhandledRejections } from './node-unhandled-rejections';
export { nodeNotifyUnhandledExceptions } from './node-unhandled-exceptions';

// Other plugins
export { appDuration } from './app-duration';
export {
  browserContext,
  browserContextWithUaParser,
  UserAgentParserFn,
  UserAgentInfo,
} from './browser-context';
export { deviceOrientation } from './deviceorientation';
export { limitEvents } from './limit-events';
export {
  ReactPlugin,
  ReactPluginResult,
  ErrorBoundaryProps,
  FallbackComponentProps,
} from './react';
export {
  redactEvent,
  redactKeys,
  RedactKeysPluginResult,
  redactObject,
} from './redact-keys';
export { stringifyValues } from './stringify-values';

// Delivery plugins
export { FetchDelivery } from './fetch-delivery';

interface BugsnagStatic {
  getPlugin(id: 'react'): import('./react').ReactPluginResult | undefined;
  getPlugin(
    id: 'redactKeys'
  ): import('./redact-keys').RedactKeysPluginResult | undefined;
  getPlugin(
    id: 'lambdaContext'
  ): import('./lambda-context').LambdaContextPlugin | undefined;
  getPlugin(id: string): unknown;
}
