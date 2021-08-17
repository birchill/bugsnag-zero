import { Delivery } from './client';

export class FetchDelivery implements Delivery {
  async send({
    payload,
    apiKey,
  }: {
    payload: string;
    apiKey: string;
  }): Promise<void> {
    const sentAt = new Date().toISOString();

    await fetch('https://notify.bugsnag.com/', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': apiKey,
        'Bugsnag-Payload-Version': '5',
        'Bugsnag-Sent-At': sentAt,
      },
      referrerPolicy: 'no-referrer',
      body: payload,
    });
  }
}
