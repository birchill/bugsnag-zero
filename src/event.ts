// A slightly abbreviated version of the definition here:
//
//   https://bugsnagerrorreportingapi.docs.apiary.io/#reference/0/notify/send-error-reports
//
export type BugsnagEvent = {
  exceptions: Array<BugsnagException>;
  breadcrumbs?: Array<Breadcrumb>;
  request?: {
    clientIp?: string;
    headers?: { [name: string]: string };
    httpMethod?: string;
    url?: string;
    referer?: string;
  };
  context?: string;
  groupingHash?: string;
  unhandled?: boolean;
  severity?: 'error' | 'warning' | 'info' | 'default';
  severityReason?: {
    type?:
      | 'unhandledException'
      | 'unhandledError'
      | 'log'
      | 'signal'
      | 'strictMode'
      | 'unhandledPromiseRejection'
      | 'userCallbackSetSeverity'
      | 'userSpecifiedSeverity'
      | 'handledException';
    attributes?: {
      errorType?: string;
      level?: string;
      signalType?: string;
      violationType?: string;
      errorClass?: string;
      framework?: string;
      exceptionClass?: string;
    };
  };
  user?: User;
  app?: {
    id?: string;
    version?: string;
    codeBundleId?: string;
    buildUUID?: string;
    releaseStage?: string;
    type?: string;
    duration?: number;
  };
  device?: {
    hostname?: string;
    id?: string;
    manufacturer?: string;
    model?: string;
    modelNumber?: string;
    osName?: string;
    osVersion?: string;
    freeMemory?: number;
    totalMemory?: number;
    freeDisk?: number;
    browserName?: string;
    browserVersion?: string;
    jailbroken?: boolean;
    orientation?: DeviceOrientation;
    time?: string; // ISO 8601 format
    runtimeVersions?: {
      node: string;
    };
    // These are not documented by bugsnag-js seems to set them
    locale?: string;
    userAgent?: string;
  };
  session?: {
    id: string;
    startedAt: string; // ISO 8601
    events: {
      handled: number;
      unhandled: number;
    };
  };
  metaData?: Record<string, any>;
};

export type BugsnagException = {
  errorClass: string; // e.g. exception name
  // The API docs say this is called 'message' but bugsnag-js seems to set
  // errorMessage instead.
  message?: string;
  stacktrace: Array<StackFrame>;
  type?: 'browserjs';
};

export type StackFrame = {
  file: string;
  // The docs say this is a required field, but in practice bugsnag-js allows
  // it to be omitted.
  lineNumber?: number;
  columnNumber?: number;
  method: string;
  inProject?: boolean;
  code?: {
    [line: number]: string;
  };
};

export type Breadcrumb = {
  timestamp: string; // ISO 8601 format
  name: string;
  type: BreadcrumbType;
  metaData?: Record<string, any>;
};

export type BreadcrumbType =
  | 'navigation'
  | 'request'
  | 'process'
  | 'log'
  | 'user'
  | 'state'
  | 'error'
  | 'manual';

export type User = {
  id?: string;
  email?: string;
  name?: string;
};

export type DeviceOrientation =
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'landscape-primary'
  | 'portrait-secondary'
  | 'landscape-secondary';
