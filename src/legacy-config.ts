import { OnErrorCallback, Plugin } from './client';
import { Config } from './config';
import { BreadcrumbType } from './event';

// Auto-detect errors
import { browserNotifyUnhandledExceptions } from './browser-unhandled-exceptions';
import { browserNotifyUnhandledRejections } from './browser-unhandled-rejections';

// Breadcrumb plugins
import { consoleBreadcrumbs } from './console-breadcrumbs';
import { errorBreadcrumbs } from './error-breadcrumbs';
import { fetchBreadcrumbs } from './fetch-breadcrumbs';
import { interactionBreadcrumbs } from './interaction-breadcrumbs';
import { navigationBreadcrumbs } from './navigation-breadcrumbs';

// Other plugins
import { appDuration } from './app-duration';
import { browserContext } from './browser-context';
import { deviceOrientation } from './deviceorientation';
import { limitEvents } from './limit-events';
import { redactKeys } from './redact-keys';

export interface LegacyConfig {
  apiKey: string;
  appVersion?: string;
  appType?: string;
  autoDetectErrors?: boolean;
  autoTrackSessions?: false;
  // context?: string;
  collectUserIp?: false;
  enabledErrorTypes?: {
    unhandledExceptions?: boolean;
    unhandledRejections?: boolean;
  };
  enabledBreadcrumbTypes?: BreadcrumbType[] | null;
  enabledReleaseStages?: string[] | null;
  // endpoints?: { notify: string, sessions: string };
  generateAnonymousId?: false;
  // Loggers are not supported
  logger?: null;
  maxEvents?: number;
  maxBreadcrumbs?: number;
  // metadata?: { [key: string]: any };
  // onBreadcrumb?: OnBreadcrumbCallback | OnBreadcrumbCallback[];
  onError?: OnErrorCallback | OnErrorCallback[];
  // Sessions are not supported
  onSession?: [];
  plugins?: Plugin[];
  // RegExps for redacted keys are not supported
  redactedKeys?: Array<string>;
  releaseStage?: string;
  // trackInlineScripts?: boolean;
  // user?: User | null;
}

export function fromLegacyConfig(input: LegacyConfig | string): Config {
  const legacyConfig: LegacyConfig =
    typeof input === 'string' ? { apiKey: input } : input;

  const plugins: Array<Plugin> = legacyConfig.plugins || [];

  // Auto-detect errors
  const { autoDetectErrors, enabledErrorTypes } = legacyConfig;
  if (
    autoDetectErrors !== false &&
    enabledErrorTypes?.unhandledExceptions !== false
  ) {
    plugins.push(browserNotifyUnhandledExceptions);
  }

  if (
    autoDetectErrors !== false &&
    enabledErrorTypes?.unhandledRejections !== false
  ) {
    plugins.push(browserNotifyUnhandledRejections);
  }

  // Breadcrumbs
  const { enabledBreadcrumbTypes } = legacyConfig;

  const breadcrumbEnabled = (breadcrumb: BreadcrumbType) =>
    typeof enabledBreadcrumbTypes === 'undefined' ||
    (Array.isArray(enabledBreadcrumbTypes) &&
      enabledBreadcrumbTypes.includes(breadcrumb));
  if (breadcrumbEnabled('request')) {
    plugins.push(fetchBreadcrumbs);
  }

  if (breadcrumbEnabled('navigation')) {
    plugins.push(navigationBreadcrumbs);
  }

  if (breadcrumbEnabled('user')) {
    plugins.push(interactionBreadcrumbs);
  }

  const { releaseStage } = legacyConfig;
  const isDev =
    (releaseStage && releaseStage === 'dev') || releaseStage === 'development';
  if (!isDev && breadcrumbEnabled('log')) {
    plugins.push(consoleBreadcrumbs);
  }

  if (breadcrumbEnabled('error')) {
    plugins.push(errorBreadcrumbs);
  }

  // Other plugins
  plugins.push(appDuration);
  if (typeof self.navigator !== 'undefined') {
    plugins.push(browserContext);
  }
  plugins.push(deviceOrientation);
  plugins.push(limitEvents(legacyConfig.maxEvents || 10));

  const keys = legacyConfig.redactedKeys || ['password'];
  if (keys.length) {
    plugins.push(redactKeys(keys));
  }

  // We don't currently include the onHandledRejectionLogger by default because
  // it's something new to bugsnag-zero that's not in the official client and a
  // lot of applications probably don't want it.

  return {
    ...legacyConfig,
    plugins,
  };
}
