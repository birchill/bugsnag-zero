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
  consoleBreadcrumbs,
  deviceOrientation,
  errorBreadcrumbs,
  fetchBreadcrumbs,
  handledRejectionBreadcrumbs,
  interactionBreadcrumbs,
  limitEvents,
  navigationBreadcrumbs,
  notifyUnhandledExceptions,
  notifyUnhandledRejections,
  ReactPlugin,
  redactKeys,
} from '@birchill/bugsnag-zero';

const plugins = [
  appDuration,
  deviceOrientation,
  errorBreadcrumbs,
  fetchBreadcrumbs,
  handledRejectionBreadcrumbs,
  interactionBreadcrumbs,
  limitEvents(10),
  navigationBreadcrumbs,
  notifyUnhandledExceptions,
  notifyUnhandledRejections,
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
