# Bugsnag zero

## What is this?

This is a rebuilt version of the
[bugsnag-js](https://github.com/bugsnag/bugsnag-js) client with the following
goals:

- Reduced bundle size
- Support for non-main thread contexts (e.g. Web workers)
- Ergonomic improvements
- Adding some missing features like custom delivery mechanisms

It does this using the following approach:

- Dropping support for older browsers including IE
- Leaning heavily on the plugin approach — every feature is a plugin. As a
  result unused features are tree-shaked and don't affect your bundle size
- Being written entirely in TypeScript - by doing more checking at build time we
  can drop some runtime checks

It doesn't include support for quite a number of features simply because we
haven't found a need for them yet. Some noteable ones include:

- Sessions
- Inline scripts (these days CSP generally makes inline scripts harder to use
  anyway)
- Loggers
- RegExps for redacted keys
- Callbacks for breadcrumbs
- User IP collection (we prefer to respect user privacy)

Many of these could be added, if needed, by adding further plugins.

On the other hand, it adds a few other features:

- The ability to substitute in custom delivery providers (e.g. so you can send
  to an SNS topic).
- `Bugsnag.notify()` returns a Promise with a result so you can wait for delivery
  and check whether it succeeded.
- `Bugsnag.notify()` can take `metadata` and `severity` settings as a object
  rather than you having to provide an on-error callback (see below).
- If an `Error` object has a `metadata` field, it will be merged into the
  reported error's metadata.
- A `browserHandledRejectionBreadcrumbs` plugin for logging _handled_
  rejections.
- Post-error callbacks - called after fully preparing the error but just before
  sending it. This was mostly added as a means of supporting "error"
  breadcrumbs.
- `redactKeys` exports its functions so you can re-use them for other logging
  etc.

So far very little effort has been spent on optimizing the code size of the
generated code. A little code golf and manual minification could likely reduce
the bundle size much further still.

## Usage

The easiest way to use this for an existing installation is to use the legacy
config helper, `fromLegacyConfig`. However, note that doing this will produce
much less significant code savings since much less code can be tree-shaken.

Better still is to manually configure the plugins one-by-one according to your
needs. For example,

```typescript
import Bugsnag, {
  appDuration,
  browserContext,
  browserHandledRejectionBreadcrumbs,
  browserNotifyUnhandledExceptions,
  browserNotifyUnhandledRejections,
  consoleBreadcrumbs,
  deviceOrientation,
  errorBreadcrumbs,
  fetchBreadcrumbs,
  interactionBreadcrumbs,
  limitEvents,
  navigationBreadcrumbs,
  ReactPlugin,
  redactKeys,
  stringifyValues,
} from '@birchill/bugsnag-zero';

const plugins = [
  appDuration,
  browserContext,
  browserHandledRejectionBreadcrumbs,
  browserNotifyUnhandledExceptions,
  browserNotifyUnhandledRejections,
  deviceOrientation,
  errorBreadcrumbs,
  fetchBreadcrumbs,
  interactionBreadcrumbs,
  limitEvents(10),
  navigationBreadcrumbs,
  ReactPlugin,
  redactKeys(['accessToken', 'password']),
  stringifyValues,
];

if (__RELEASE_STAGE__ !== 'test') {
  plugins.push(consoleBreadcrumbs);
}

Bugsnag.start({
  apiKey: '<apiKey>',
  appType: 'browser',
  collectUserIp: false,
  enabledReleaseStages: ['prod', 'beta'],
  plugins,
  releaseStage: __RELEASE_STAGE__,
});
```

There are a few API differences from the official client. Hopefully the
TypeScript interfaces make these more obvious.

For example, we've often found it useful to set the severity of an error while
notifying. The official client requires supplying a callback to do this but this
module allows specifying it as a property on the second argument to the notify
callback:

```typescript
// bugsnag-js
Bugsnag.notify(message, (event) => {
  event.severity = 'warning';
});

// @birchill/bugsnag-zero
Bugsnag.notify(message, { severity: 'warning' });
```

Similarly, it is possible to specify `metadata` directly on this second
argument.

It is, of course, still possible to pass an error callback as per the official
client's API.

### Notification results

`notify()` returns `Promise<NotifyResult>`. Awaiting it waits for report
preparation and delivery to finish; inspect the result to determine the outcome:

```typescript
const result = await Bugsnag.notify(error);
if (result.status === 'failed') {
  console.warn('Could not deliver report', result.error, result.statusCode);
}
```

| Status    | Meaning                                                                                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`    | The delivery destination accepted the request. With `FetchDelivery`, this means an HTTP 2xx response, not confirmation that Bugsnag has processed the report.                     |
| `stored`  | A custom delivery implementation successfully saved the report. The SDK does not queue reports or retry them.                                                                     |
| `skipped` | No report was delivered. `reason` is `not-started`, `disabled` (release stage), or `callback` (an `onError` callback returned `false`). Custom delivery can supply other reasons. |
| `failed`  | Preparation or delivery failed. `error` is an `Error`; `statusCode` is also supplied for an unsuccessful HTTP response from `FetchDelivery`.                                      |

Reporting failures resolve to `failed` rather than rejecting, including exceptions
from callbacks and custom delivery implementations. You can continue ignoring the
result when reporting errors without waiting, using `void Bugsnag.notify(error)`.
If a caller needs rejection, it can explicitly throw `result.error` when the status
is `failed`.

### Saving and sending prepared reports

Custom delivery receives an exported `DeliveryPayload`: a detached JSON-compatible
object containing the final report after `onError` callbacks, plugins, redaction,
and payload-size checks. It excludes `originalError` and does not share mutable
objects with the live event. The payload includes the configured API key and all
remaining event data, so your application should decide what is appropriate to
persist and for how long.

Use `setDelivery()` before `start()` to cover reports from plugins as soon as they
are installed. For example, with application-provided policy and storage functions:

```typescript
import Bugsnag, {
  FetchDelivery,
  type DeliveryPayload,
} from '@birchill/bugsnag-zero';

const network = new FetchDelivery(Bugsnag);

Bugsnag.setDelivery({
  async sendEvent(payload: DeliveryPayload) {
    if (await shouldSendAutomatically()) {
      return network.sendEvent(payload);
    }

    await saveReport(payload);
    return { status: 'stored' };
  },
});

Bugsnag.start({ apiKey: '<apiKey>' });
```

Return `stored` only after persistence succeeds. If saving throws, `notify()`
returns `failed`. A custom delivery that declines to save or send can return
`{ status: 'skipped', reason: 'your-reason' }`. Callback vetoes, disabled release
stages, and reports before `start()` bypass custom delivery entirely.

To send a saved report later, pass the restored `DeliveryPayload` directly to the
network delivery, after validating it and checking the application's sending
policy:

```typescript
const result = await network.sendEvent(savedPayload);
if (result.status === 'sent') {
  await deleteSavedReport(reportId);
}
```

This preserves the original timestamp, app version, and breadcrumbs. It does not
rerun callbacks or plugins, or check release stages; calling `notify()` again would
create a new report instead. `FetchDelivery` uses the client's current endpoint
and a fresh `Bugsnag-Sent-At` header, but the API key and event details come from the
saved payload. Storage limits, deletion, replay, and retries belong to the
application. A failed request may still have reached the server, so retrying can
produce duplicates.

#### Migrating custom delivery implementations

Previously, `notify()`, the plugin API's `notifyEvent()`, and
`Delivery.sendEvent()` returned `Promise<void>`. They now return
`Promise<NotifyResult>`. Update explicit return types and any wrappers or mocks
that depend on `Promise<void>`.

Custom delivery implementations must return an outcome, for example
`{ status: 'sent' }` after the destination accepts the request, or
`{ status: 'stored' }` after persistence completes. Their payload is now the same
JSON-compatible representation that would be sent over the network, so values
such as `undefined` or functions are removed and dates are serialized.

### React plugin

In order to allow using Preact with the React plugin and to avoid introducing a
dependency on React itself just for its types, the typings for the React plugin
are a bit convoluted.

For Preact something like the following is needed:

```typescript
const MyBugsnagErrorBoundary = React.useMemo(
  () =>
    Bugsnag.getPlugin('react')!.createErrorBoundary<
      typeof React.Component,
      ComponentType,
      VNode
    >(React.Component, React.createElement),
  []
);
```

Furthermore, unlike the official bugsnag-js client, we don't allow passing in
React to the constructor. Instead we always require a call to
`createErrorBoundary`.

### Usage with Node.js

We don't properly support Node.js at this time. In particular, there's no
delivery mechanism defined for it. It would be trivial to write, but we haven't
needed it yet.

That said, there are some plugins that should work with node including the
[`@birchill/bugsnag-zero-lambda-context` plugin](../bugsnag-zero-lambda-context)
for logging from AWS Lambda.

At Birchill, we use a custom `Delivery` class to post the events to an SNS topic
and have that send to Bugsnag since that's faster than having the Lambda wait on
the Bugsnag server and more flexible too (e.g. you can post your events to Slack
etc. too as needed).

The setup looks something like:

```typescript
import Bugsnag, {
  appDuration,
  errorBreadcrumbs,
  nodeNotifyUnhandledExceptions,
  nodeNotifyUnhandledRejections,
  redactKeys,
} from '@birchill/bugsnag-zero';
import { lambdaContext } from '@birchill/bugsnag-zero-lambda-context';

Bugsnag.start({
  apiKey: '<unused>',
  appType: 'nodejs',
  plugins: [
    appDuration,
    errorBreadcrumbs,
    lambdaContext(),
    nodeNotifyUnhandledExceptions,
    nodeNotifyUnhandledRejections,
    redactKeys(keysToRedact),
  ],
});

Bugsnag.setDelivery({
  sendEvent: async ({ events }) => {
    const errorClass = events[0].exceptions[0]?.errorClass || 'Unknown';
    const context = events[0].context;
    const subject = `Error: ${errorClass} in ${context}`;

    const publishCommand = new PublishCommand({
      Subject: subject,
      TopicArn: errorTopicArn,
      Message: JSON.stringify(events),
    });

    await snsClient.send(publishCommand);
    return { status: 'sent' };
  },
});

// When a Lambda handler is called, update the lambdaContext plugin:

async function handler(event: Event, context: Context): Promise<void> {
  Bugsnag.getPlugin('lambdaContext')?.setContext(event, context);
}
```

### Using a custom user agent string parser

Bugsnag's [v5 reporting API](https://bugsnagerrorreportingapi.docs.apiary.io/#reference/0/notify/send-error-reports)
requires passing in the browser name, browser version, OS name etc. explicitly.
In other words, it requires you to parse the user agent string on the _client_.

By comparison, the v4 API that the official client uses just passes the user
agent string to the API and lets the server parse it.

Adding a full-blown user agent string parser would bloat this library a lot so
we provide a very simple one that covers the basic cases. For example, it
doesn't handle things like bots etc. since hopefully they're probably not going
to be triggering your error reporting (and if they are, the raw user agent
string is still included so you can detect that).

However, perhaps your app already has a user agent string parser included and
you want to re-use that? You can do that by using the
`browserContextWithUaParser` plugin in place of the `browserContext` plugin and
supplying a function that takes a string and returns an object of the following
shape:

```typescript
type UserAgentInfo = {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  manufacturer?: string;
  model?: string;
  modelNumber?: string;
};
```

For an unrecognized user agent string, you would just return an empty object
(`{}`).

For example:

```typescript
import Bugsnag, { browserContextWithUaParser } from '@birchill/bugsnag-zero';

const myUaParser = new Parser();
const parseUaString = (uaString: string) => {
  const result = myUaParser.parse(uaString);
  return result
    ? {
        browserName: result.browser,
        browserVersion: `${result.major}.${result.minor}`,
      }
    : {};
};

Bugsnag.start({
  apiKey: '<unused>',
  appType: 'nodejs',
  plugins: [browserContextWithUaParser(parseUaString)],
});
```

This also gives you full control on how browsers are grouped together (e.g. do
you want Chrome on iOS to be treated the same as real Chrome? Do you want an
EdgeHTML version of Edge to be grouped together with Chromium Edge?)

Similarly, if you have no need for user agent string parsing and want to use
`browserContext` without the user agent string parsing bloating your code, the
following should hopefully mean it gets tree-shaken out:

```typescript
import Bugsnag, { browserContextWithUaParser } from '@birchill/bugsnag-zero';

Bugsnag.start({
  apiKey: '<unused>',
  appType: 'nodejs',
  plugins: [browserContextWithUaParser(() => {})],
});
```

Note that none of this is tested at all so let me know if it doesn't work.
