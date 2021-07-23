import { ExtendedClientApi, Plugin } from './client';
import { BugsnagEvent, DeviceOrientation } from './event';

export const deviceOrientation: Plugin = {
  name: 'deviceOrientation',
  load(client: ExtendedClientApi) {
    client.addOnError((event: BugsnagEvent) => {
      let orientation: DeviceOrientation | undefined;

      const screen = self.screen;
      if (screen && screen.orientation && screen.orientation.type) {
        orientation = screen.orientation.type;
      } else if (document.documentElement) {
        orientation =
          document.documentElement.clientWidth >
          document.documentElement.clientHeight
            ? 'landscape'
            : 'portrait';
      }

      if (orientation) {
        event.device = { ...event.device, orientation };
      }
    });
  },
};
