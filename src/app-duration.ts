import { ExtendedClientApi, Plugin } from './client';
import { BugsnagEvent } from './event';

let appStart = Date.now();
const reset = () => {
  appStart = Date.now();
};

export const appDuration: Plugin = {
  name: 'appDuration',
  load(client: ExtendedClientApi) {
    client.addOnError((event: BugsnagEvent) => {
      const now = Date.now();
      event.app = event.app || {};
      event.app.duration = now - appStart;
    });

    return { reset };
  },
};
