import { Delivery, ExtendedClientApi } from './client';
import { BugsnagEvent } from './event';
import { Notifier } from './notifier';

export class FetchDelivery implements Delivery {
  constructor(private client: ExtendedClientApi) {}

  async sendEvent({
    apiKey,
    events,
    notifier,
    payloadVersion,
  }: {
    apiKey: string;
    events: Array<BugsnagEvent>;
    notifier: Notifier;
    payloadVersion: string;
  }): Promise<void> {
    const sentAt = new Date().toISOString();

    const body = JSON.stringify({
      apiKey,
      payloadVersion,
      notifier,
      events,
    });

    await fetch(this.client.endpoints.notify, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': apiKey,
        'Bugsnag-Payload-Version': payloadVersion,
        'Bugsnag-Sent-At': sentAt,
      },
      referrerPolicy: 'no-referrer',
      body,
    });
  }
}
