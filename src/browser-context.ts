import { ExtendedClientApi, Plugin } from './client';
import { BugsnagEvent } from './event';

export const browserContext: Plugin = {
  name: 'browserContext',
  load(client: ExtendedClientApi) {
    client.addOnError((event: BugsnagEvent) => {
      event.request = { ...event.request, url: self.location.href };
      event.context = event.context || self.location.pathname;

      event.device = {
        ...event.device,
        locale: self.navigator.language,
        userAgent: self.navigator.userAgent,
      };

      let languages: ReadonlyArray<string> = ['n/a'];
      try {
        languages = self.navigator.languages;
      } catch (_) {
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
