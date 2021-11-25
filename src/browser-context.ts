import { ExtendedClientApi, Plugin } from './client';
import { BugsnagEvent } from './event';
import { parseUserAgent } from './simple-ua-parser';

export type UserAgentInfo = {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  manufacturer?: string;
  model?: string;
  modelNumber?: string;
};

export type UserAgentParserFn = (userAgent: string) => UserAgentInfo;

export const browserContextWithUaParser = (
  uaParser: UserAgentParserFn
): Plugin => {
  return {
    name: 'browserContext',
    load(client: ExtendedClientApi) {
      client.addOnError((event: BugsnagEvent) => {
        event.request = { ...event.request, url: self.location.href };
        event.context = event.context || self.location.pathname;

        event.device = {
          ...event.device,
          ...uaParser(self.navigator.userAgent),
          locale: self.navigator.language,
          userAgent: self.navigator.userAgent,
        };

        let languages: ReadonlyArray<string> = ['n/a'];
        try {
          languages = self.navigator.languages;
        } catch {
          /* Ignore */
        }

        event.metaData = {
          ...event.metaData,
          language: {
            language: self.navigator.language,
            languages,
          },
        };
      });
    },
  };
};

export const browserContext: Plugin =
  browserContextWithUaParser(parseUserAgent);
