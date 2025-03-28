import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  Context,
} from 'aws-lambda';
import { platform as osPlatform, release as osRelease } from 'os';

import { ExtendedClientApi, Plugin } from './client';
import { BugsnagEvent } from './event';
import { parseUserAgent } from './simple-ua-parser';
import { toExceptions } from './to-exceptions';
import { UserAgentParserFn } from './user-agent-types';

export interface LambdaContextPlugin {
  setContext(
    event: Record<string, any>,
    context: Context
  ): {
    timeoutWrapper: <T>(
      handler: () => T,
      options?: { timeBeforeEndMs?: number }
    ) => Promise<Awaited<T>>;
  };
}

export const lambdaContextWithUaParser = (
  uaParser: UserAgentParserFn,
  initialEvent?: Record<string, any>,
  initialContext?: Context
): Plugin => {
  let lambdaEvent = initialEvent;
  let contextObject = initialContext;

  return {
    name: 'lambdaContext',
    load(client: ExtendedClientApi): LambdaContextPlugin {
      // According to the official Bugsnag client:
      //
      // "AWS add [sic] a default unhandledRejection listener that forcefully
      // exits the process. This breaks reporting of unhandled rejections, so we
      // have to remove all existing listeners and call them after we handle the
      // rejection."
      const isListeningForUnhandledRejections = !!client.getPlugin(
        'nodeNotifyUnhandledRejections'
      );
      if (isListeningForUnhandledRejections) {
        // This following code is nearly verbatim what the official client does.
        //
        // However, the official client seems to think that unhandledRejection
        // handlers can return a Promise but nothing I can find in the
        // documentation suggests that's true. As a result we've removed the
        // async handling from here.
        const listeners = process.listeners('unhandledRejection');
        process.removeAllListeners('unhandledRejection');

        process.on('unhandledRejection', (reason, promise) => {
          for (const listener of listeners) {
            listener.call(process, reason, promise);
          }
        });
      }

      client.addOnError(function lambdaContext(event: BugsnagEvent) {
        // ----- Request context

        // Client IP
        let clientIp: string | undefined;
        if (isGwV2Event(lambdaEvent)) {
          clientIp = lambdaEvent.requestContext.http.sourceIp;
        } else if (isGwEvent(lambdaEvent)) {
          clientIp = lambdaEvent.requestContext.identity.sourceIp;
        }

        // Headers -- Drop any headers with an undefined value
        const headers = Object.entries(lambdaEvent?.headers || {}).reduce(
          (prevHeaders: Record<string, string>, [key, value]) => {
            if (typeof value === 'string') {
              return { ...prevHeaders, [key]: value };
            }
            return prevHeaders;
          },
          {}
        );

        // HTTP method
        let httpMethod: string | undefined;
        if (isGwV2Event(lambdaEvent)) {
          httpMethod = lambdaEvent.requestContext.http.method;
        } else if (
          isGwEvent(lambdaEvent) &&
          lambdaEvent.requestContext.messageDirection
        ) {
          httpMethod = `(WS ${lambdaEvent.requestContext.messageDirection})`;
        }

        // URL
        const domain = lambdaEvent?.requestContext?.domainName;
        const path = lambdaEvent?.rawPath ?? lambdaEvent?.path;
        const queryString = lambdaEvent?.rawQueryString;
        let scheme: string | undefined;
        // I haven't figured out a good way to detect a TLS connection so we
        // just assume https:// unless it looks like a WebSocket connection
        // (in which case we assume wss://).
        if (isGwV2Event(lambdaEvent)) {
          scheme = 'https://';
        } else if (isGwEvent(lambdaEvent)) {
          if (lambdaEvent.requestContext.messageDirection) {
            scheme = 'wss://';
          } else {
            scheme = 'https://';
          }
        }
        const url =
          scheme && domain
            ? `${scheme}${domain}${path || ''}${
                queryString ? `?${queryString}` : ''
              }`
            : lambdaEvent?.requestContext?.routeKey;

        // Referer
        const referer = headers.origin;

        if (
          clientIp ||
          Object.keys(headers).length ||
          httpMethod ||
          url ||
          referer
        ) {
          event.request = {
            clientIp,
            headers: Object.keys(headers).length ? headers : undefined,
            httpMethod,
            url,
            referer,
            ...event.request,
          };
        }

        // ---- App parameters
        const appId = lambdaEvent?.requestContext?.apiId;
        const appVersion = lambdaEvent?.version;
        event.app = {
          id: appId,
          version: appVersion,
          ...event.app,
        };

        // ---- Device parameters
        const memoryUsage = process.memoryUsage();
        const totalMemory = memoryUsage.heapTotal;
        const freeMemory = memoryUsage.heapTotal - memoryUsage.heapUsed;

        let userAgent: string | undefined;
        if (isGwV2Event(lambdaEvent)) {
          userAgent = lambdaEvent.requestContext.http.userAgent;
        } else if (isGwEvent(lambdaEvent)) {
          userAgent =
            lambdaEvent.requestContext.identity.userAgent || undefined;
        }

        const browser = userAgent ? uaParser(userAgent) : undefined;
        const hostname = lambdaEvent?.requestContext?.domainName;

        let timeEpoch: number | undefined;
        if (isGwV2Event(lambdaEvent)) {
          timeEpoch = lambdaEvent.requestContext.timeEpoch;
        } else if (isGwEvent(lambdaEvent)) {
          timeEpoch = lambdaEvent.requestContext.requestTimeEpoch;
        }

        event.device = {
          hostname,
          osName: browser?.osName || osPlatform(),
          osVersion: browser?.osVersion || osRelease(),
          freeMemory,
          totalMemory,
          browserName: browser?.browserName,
          browserVersion: browser?.browserVersion,
          manufacturer: browser?.manufacturer,
          model: browser?.model,
          modelNumber: browser?.modelNumber,
          runtimeVersions: {
            node: process.version,
          },
          ...event.device,
          time: timeEpoch
            ? new Date(timeEpoch).toISOString()
            : event.device?.time || new Date().toISOString(),
        };

        if (userAgent) {
          event.metaData = { ...event.metaData, rawUserAgent: userAgent };
        }

        if (contextObject) {
          let logUrl: string | undefined;
          if (process.env.AWS_REGION) {
            const region = process.env.AWS_REGION;
            const consoleComponentEncode = (str: string) =>
              encodeURIComponent(encodeURIComponent(str)).replace(/%/g, '$');
            const logGroupName = consoleComponentEncode(
              contextObject.logGroupName
            );
            const logStreamName = consoleComponentEncode(
              contextObject.logStreamName
            );
            logUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${logGroupName}/log-events/${logStreamName}`;
          }

          event.metaData = {
            ...event.metaData,
            Lambda: {
              ...contextObject,
              remainingTimeMs: contextObject.getRemainingTimeInMillis(),
              logUrl,
            },
          };
          delete event.metaData.Lambda.getRemainingTimeInMillis;
        }
      });

      return {
        setContext(event: Record<string, any>, context: Context) {
          lambdaEvent = event;
          contextObject = context;

          const timeoutWrapper = async <T>(
            handler: () => T,
            { timeBeforeEndMs = 300 }: { timeBeforeEndMs?: number } = {}
          ): Promise<Awaited<T>> => {
            if (timeBeforeEndMs < 0) {
              throw new Error('timeBeforeEndMs must be a positive number');
            }

            let executionTimeout: ReturnType<typeof setTimeout> | undefined;
            const remainingTimeMs = context.getRemainingTimeInMillis();
            const justBeforeEnd = remainingTimeMs - timeBeforeEndMs;
            if (justBeforeEnd >= 0) {
              const originalError = new Error(
                `Less that ${timeBeforeEndMs}ms before the Lambda timeout`
              );
              originalError.name = 'LambdaTimeoutApproaching';
              executionTimeout = setTimeout(() => {
                client.notifyEvent(
                  {
                    exceptions: toExceptions(originalError, 'notify')
                      .exceptions,
                    unhandled: true,
                    severity: 'warning',
                    severityReason: { type: 'log' },
                    metadata: {
                      timeout: {
                        'Initial remaining time (ms)': remainingTimeMs,
                        'Current remaining time (ms)':
                          context.getRemainingTimeInMillis(),
                      },
                    },
                  },
                  originalError
                );
              }, justBeforeEnd);
            } else {
              console.warn(
                `Asked to warn about Lambda timeout ${timeBeforeEndMs}ms before the end, but there are only ${remainingTimeMs}ms remaining`
              );
            }

            try {
              const handlerResult = handler();
              return isPromiseLike(handlerResult)
                ? await handlerResult
                : // I have no idea why this cast is needed -- seems like
                  // something changed in the definition of Awaited or PromiseLike
                  (handlerResult as Awaited<T>);
            } finally {
              if (executionTimeout !== undefined) {
                clearTimeout(executionTimeout);
              }
            }
          };

          return { timeoutWrapper };
        },
      };
    },
  };
};

export const lambdaContext = (
  initialEvent?: Record<string, any>,
  initialContext?: Context
): Plugin => {
  return lambdaContextWithUaParser(
    parseUserAgent,
    initialEvent,
    initialContext
  );
};

function isGwV2Event(
  event: Record<string, any> | undefined
): event is APIGatewayProxyEventV2 {
  return !!event && !!(event as APIGatewayProxyEventV2).requestContext?.http;
}

function isGwEvent(
  event: Record<string, any> | undefined
): event is APIGatewayProxyEvent {
  return !!event && !!(event as APIGatewayProxyEvent).requestContext?.identity;
}

function isPromiseLike(value: unknown): value is PromiseLike<any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).then === 'function'
  );
}
