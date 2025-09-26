# Bugsnag zero monorepo

This repository contains the source for the published packages:

- [`@birchill/bugsnag-zero`](./packages/bugsnag-zero) – the lightweight Bugsnag
  client.
- [`@birchill/bugsnag-zero-lambda-context`](./packages/bugsnag-zero-lambda-context) -
  a plugin for enriching events with AWS Lambda request metadata.

## What is this?

A rebuilt version of the
[bugsnag-js](https://github.com/bugsnag/bugsnag-js) client with the following
goals:

- Reduced bundle size
- Support for non-main thread contexts (e.g. Web workers)
- Ergonomic improvements
- Adding some missing features like custom delivery mechanisms

For full details see the
[bugsnag-zero README](./packages/bugsnag-zero/README.md).

# Contributing

Building

```
pnpm build
```

Testing and linting

```
pnpm test
pnpm lint
```

If you're submitting a pull request, you'll also need to run `pnpm changeset` to
generate a suitable changeset file (which you should commit and include as part
of the PR).
