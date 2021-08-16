import {
  Client,
  ExtendedClientApi,
  NotifiableError,
  OnErrorCallback,
  OnPostErrorCallback,
  PartialEvent,
} from './client';
import { Config } from './config';
import { Breadcrumb, BreadcrumbType, BugsnagEvent, User } from './event';
import { Notifier } from './notifier';
import { toException } from './to-exception';

class BugsnagStatic implements ExtendedClientApi {
  private config: Config | undefined;
  private breadcrumbs: Array<Breadcrumb> = [];
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

  notify(
    error: NotifiableError,
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

    return this.notifyEvent({
      exceptions: [exception],
      metadata,
      severity,
      onError,
    });
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

  async notifyEvent({
    exceptions,
    unhandled,
    severity,
    severityReason,
    metadata,
    onError,
  }: PartialEvent): Promise<void> {
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
    // Make sure the redact callback comes last
    errorCallbacks.sort((a, b) =>
      a.name === 'redact' ? -1 : b.name === 'redact' ? 1 : 0
    );
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

    let body = JSON.stringify({
      apiKey: this.config.apiKey,
      payloadVersion: '5',
      notifier,
      events: [event],
    });

    // Check the size of the payload
    if (body.length > 10e5) {
      const minimizedEvent = {
        ...event,
        metaData: {
          notifier: `Payload was ${body.length / 10e5}Mb. Metadata removed.`,
        },
      };
      body = JSON.stringify({
        apiKey: this.config.apiKey,
        payloadVersion: '5',
        notifier,
        events: [minimizedEvent],
      });
      if (body.length > 10e5) {
        throw new Error('Payload exceeded 1Mb limit');
      }
    }

    // Now that we have serialized the body we can call our post error callbacks
    // which may update our local breadcrumbs array.
    //
    // Although it's called "post error" we run these callbacks before we
    // actually send the event over the network since sending is async and if
    // the callback is logging the fact that an error was recorded then we want
    // that log entry to appear in the correct sequence, particularly if other
    // things take place while the fetch is still happenning.
    for (const callback of this.postErrorCallbacks) {
      callback(event);
    }

    const sentAt = new Date().toISOString();

    try {
      fetch('https://notify.bugsnag.com/', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': this.config.apiKey,
          'Bugsnag-Payload-Version': '5',
          'Bugsnag-Sent-At': sentAt,
        },
        referrerPolicy: 'no-referrer',
        body,
      });
    } catch (e) {
      console.error('Failed to post report to Bugsnag');
      console.log(e);
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
}

const bugsnagSingleton = new BugsnagStatic();

export default bugsnagSingleton;
export { Client, ExtendedClientApi, Plugin } from './client';
export { Config } from './config';
export { fromLegacyConfig, LegacyConfig } from './legacy-config';
export { BugsnagEvent as Event } from './event';

// Breadcrumb loggers
export { consoleBreadcrumbs } from './console-breadcrumbs';
export { errorBreadcrumbs } from './error-breadcrumbs';
export { fetchBreadcrumbs } from './fetch-breadcrumbs';
export { interactionBreadcrumbs } from './interaction-breadcrumbs';
export { navigationBreadcrumbs } from './navigation-breadcrumbs';
export { handledRejectionBreadcrumbs } from './handled-rejection-breadcrumbs';

// Error notifiers
export { notifyUnhandledExceptions } from './unhandled-exceptions';
export { notifyUnhandledRejections } from './unhandled-rejections';

// Other plugins
export { appDuration } from './app-duration';
export { browserContext } from './browser-context';
export { deviceOrientation } from './deviceorientation';
export { limitEvents } from './limit-events';
export {
  ReactPlugin,
  ReactPluginResult,
  FallbackComponentProps,
} from './react';
export { redactKeys, RedactKeysPluginResult } from './redact-keys';

interface BugsnagStatic {
  getPlugin(id: 'react'): import('./react').ReactPluginResult | undefined;
  getPlugin(
    id: 'redactKeys'
  ): import('./redact-keys').RedactKeysPluginResult | undefined;
  getPlugin(id: string): unknown;
}
