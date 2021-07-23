import { OnErrorCallback, Plugin } from './client';
import { User } from './event';

export interface Config {
  apiKey: string;
  appVersion?: string;
  // e.g. 'browser', 'worker', 'node'.
  appType?: string;
  // context?: string;
  collectUserIp?: false;
  enabledReleaseStages?: string[] | null;
  // endpoints?: { notify: string, sessions: string };
  generateAnonymousId?: false;
  // maxEvents?: number;
  maxBreadcrumbs?: number;
  // metadata?: { [key: string]: any };
  // onBreadcrumb?: OnBreadcrumbCallback | OnBreadcrumbCallback[];
  onError?: OnErrorCallback | OnErrorCallback[];
  plugins?: Plugin[];
  releaseStage?: string;
  // trackInlineScripts?: boolean;
  user?: User | null;
}
