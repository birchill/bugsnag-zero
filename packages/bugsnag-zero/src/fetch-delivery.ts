import type {
  Delivery,
  DeliveryPayload,
  ExtendedClientApi,
  NotifyResult,
} from './client';
import { notifyFailure } from './notify-failure';

export class FetchDelivery implements Delivery {
  constructor(private client: Pick<ExtendedClientApi, 'endpoints'>) {}

  /** Send a prepared or restored payload without running event callbacks again. */
  async sendEvent(payload: DeliveryPayload): Promise<NotifyResult> {
    try {
      const response = await fetch(this.client.endpoints.notify, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': payload.apiKey,
          'Bugsnag-Payload-Version': payload.payloadVersion,
          'Bugsnag-Sent-At': new Date().toISOString(),
        },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          status: 'failed',
          error: new Error(
            `Bugsnag request failed with status ${response.status}`
          ),
          statusCode: response.status,
        };
      }

      return { status: 'sent' };
    } catch (error) {
      return notifyFailure(error);
    }
  }
}
