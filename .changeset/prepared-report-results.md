---
'@birchill/bugsnag-zero': major
---

Return explicit notification outcomes and expose prepared report payloads for custom delivery and storage.

**Breaking changes:** `notify()`, the plugin API's `notifyEvent()`, and `Delivery.sendEvent()` now return `Promise<NotifyResult>` instead of `Promise<void>`. Custom delivery implementations must return `{ status: 'sent' }`, `{ status: 'stored' }`, `{ status: 'skipped', reason }`, or `{ status: 'failed', error, statusCode? }`. Update wrappers and mocks that explicitly depend on the previous return type. Callers that ignore the result can continue doing so.

- Reporting failures, including callback and custom delivery exceptions, resolve to a `failed` result rather than rejecting. `FetchDelivery` also reports non-2xx HTTP responses as failures, with their status code.
- Export `DeliveryPayload` and `EventForDelivery`, and expose `setDelivery()` on `Client`. Custom delivery receives a detached JSON-compatible snapshot after callbacks, redaction, and payload-size checks, without `originalError`. As with network serialization, non-JSON properties are omitted and dates are converted to strings.
- Saved payloads can be passed directly to `FetchDelivery.sendEvent()` without rerunning callbacks or changing the original event details. A `stored` result acknowledges custom persistence; it does not schedule an SDK retry.
- Fix the `redactKeys` plugin to apply its redacted values to reports.

See the README for result meanings, migration guidance, and examples of saving and replaying reports.
