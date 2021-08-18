# Bugsnag zero

## What is this?

This is a rebuilt version of the
[bugsnag-js](https://github.com/bugsnag/bugsnag-js) client with the following
goals:

- Reduced bundle size
- Support for non-main thread contexts (e.g. Web workers)

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
- Custom endpoints
- Loggers
- RegExps for redacted keys
- Callbacks for breadcrumbs
- User IP collection (we prefer to respect user privacy)

Many of these could be added, if needed, by adding further plugins.

On the other hand, it adds a few other features:

- Post-error callbacks - called after fully preparing the error but just before
  sending it. This was mostly added as a means of supporting "error" breadcrumbs.
- A `browserHandledRejectionBreadcrumbs` plugin for logging _handled_ rejections.
- The ability to substitute in custom delivery providers (e.g. so you can send
  to an SNS topic).
- `Bugsnag.notify()` returns a Promise so you can wait on it to ensure delivery
  was successful.
- `Bugsnag.notify()` can take `metadata` and `severity` settings as a object
  rather than you having to provide an on-error callback (see below).
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
`lambdaContext` plugin for logging from AWS Lambda.

At Birchill, we use a custom `Delivery` class to post the events to an SNS topic
and have that send to Bugsnag since that's faster than having the Lambda wait on
the Bugsnag server and more flexible too (e.g. you can post your events to Slack
etc. too as needed).

The setup looks something like:

```typescript
import Bugsnag, {
  appDuration,
  errorBreadcrumbs,
  lambdaContext,
  nodeNotifyUnhandledExceptions,
  nodeNotifyUnhandledRejections,
  redactKeys,
} from '@birchill/bugsnag-zero';

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
  sendEvent: async ({ events }): Promise<void> => {
    const errorClass = events[0].exceptions[0]?.errorClass || 'Unknown';
    const context = events[0].context;
    const subject = `Error: ${errorClass} in ${context}`;

    const publishCommand = new PublishCommand({
      Subject: subject,
      TopicArn: errorTopicArn,
      Message: JSON.stringify(events),
    });

    await snsClient.send(publishCommand);
  },
});

// When a Lambda handler is called, update the lambdaContext plugin:

async function handler(event: Event, context: Context): Promise<void> {
  Bugsnag.getPlugin('lambdaContext')?.setContext(event, context);
}
```

## Development

### Building

```
yarn build
```

### Releasing

```
yarn release
git push --follow-tags
yarn publish
```
