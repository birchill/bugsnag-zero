# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.7.2](https://github.com/birchill/bugsnag-zero/compare/v0.7.1...v0.7.2) (2025-04-24)

### Bug Fixes

- fix passing of arguments in BugsnagErrorBoundaryComponent ([#179](https://github.com/birchill/bugsnag-zero/issues/179)) ([d8870ab](https://github.com/birchill/bugsnag-zero/commit/d8870abdae8a69541d8c7bf1d9a2610eb6d3c325))

### [0.7.1](https://github.com/birchill/bugsnag-zero/compare/v0.7.0...v0.7.1) (2025-02-10)

## [0.7.0](https://github.com/birchill/bugsnag-zero/compare/v0.6.9...v0.7.0) (2024-11-21)

### ⚠ BREAKING CHANGES

- If you want to continue to use `ua-parser-js` in
  `lambda-context` you will need to use `lambdaContextWithUaParser` and
  pass in your own parser function as described here:
  https://github.com/birchill/bugsnag-zero?tab=readme-ov-file#using-a-custom-user-agent-string-parser

This is because from version `ua-parser-js` version 2 onwards, users are
required to either use the AGPL version or license the library.

It's best to allow users of this package to decide how they want to
consume `ua-parser-js`.

### Features

- don't require ua-parser-js in lambda-context ([3ab253c](https://github.com/birchill/bugsnag-zero/commit/3ab253cc9c1c1a7820f780cab1383c376ae492c1))

### Bug Fixes

- **deps:** update dependency ua-parser-js to v1.0.39 ([bb79fdc](https://github.com/birchill/bugsnag-zero/commit/bb79fdc7f4ebe90d9a135d3fa618242ef2f9cb64))

### [0.6.9](https://github.com/birchill/bugsnag-zero/compare/v0.6.8...v0.6.9) (2024-06-24)

### Features

- handle Javascript error causes ([31f5b50](https://github.com/birchill/bugsnag-zero/commit/31f5b50d0df92e36520c9bf0069cec9cb9e6306d))

### Bug Fixes

- **deps:** update dependency ua-parser-js to v1.0.38 ([34bc718](https://github.com/birchill/bugsnag-zero/commit/34bc71866322ba2b7d75be60f67023428cbb0f0a))

### [0.6.8](https://github.com/birchill/bugsnag-zero/compare/v0.6.7...v0.6.8) (2024-02-22)

### Bug Fixes

- truncate node text before tidying up whitespace ([db3ee7e](https://github.com/birchill/bugsnag-zero/commit/db3ee7ee256eff5c7adb78d82fe41e473189642a)), closes [#135](https://github.com/birchill/bugsnag-zero/issues/135)

### [0.6.7](https://github.com/birchill/bugsnag-zero/compare/v0.6.6...v0.6.7) (2024-01-22)

### Bug Fixes

- handle objects with stringifiers in fetch breadcrumbs plugin ([e25f781](https://github.com/birchill/bugsnag-zero/commit/e25f7810230ba7c42cc7c0f087d01d3cfada3ad0)), closes [#132](https://github.com/birchill/bugsnag-zero/issues/132)

### [0.6.6](https://github.com/birchill/bugsnag-zero/compare/v0.6.5...v0.6.6) (2023-11-10)

### Bug Fixes

- **deps:** update dependency ua-parser-js to v1.0.37 ([8006555](https://github.com/birchill/bugsnag-zero/commit/80065558057cc61719dfc56d9f3a8529fc2b5dec))
- fix check for document ([d29e387](https://github.com/birchill/bugsnag-zero/commit/d29e387ccc1f971ade44bd180ee5f5bd966ffbdc))

### [0.6.5](https://github.com/birchill/bugsnag-zero/compare/v0.6.4...v0.6.5) (2023-10-18)

### Bug Fixes

- **deps:** update dependency ua-parser-js to v1.0.36 ([09f6a00](https://github.com/birchill/bugsnag-zero/commit/09f6a001b01e1d5e216e2ba1450ebe5dc9c32fbc))
- handle non-ErrorEvent arguments in error event handler ([3ce4ce2](https://github.com/birchill/bugsnag-zero/commit/3ce4ce252a20e653e15abf9e4c58fbc270847d4e))
- handle non-string messages in leaveBreadcrumb ([fa7a40e](https://github.com/birchill/bugsnag-zero/commit/fa7a40e13fc904761fa4415544062a0b5a8969c1))

### [0.6.4](https://github.com/birchill/bugsnag-zero/compare/v0.6.3...v0.6.4) (2023-09-01)

### Bug Fixes

- sort plugins correctly ([77b140d](https://github.com/birchill/bugsnag-zero/commit/77b140dff1f98cb8d865cfc0d23e1d57a4f4dbc2))

### [0.6.3](https://github.com/birchill/bugsnag-zero/compare/v0.6.2...v0.6.3) (2023-07-26)

### Features

- add stringifyValues pluin ([1103912](https://github.com/birchill/bugsnag-zero/commit/110391241adbb5583892d5548e00920fe4f76ca8))
- make redactKeys plugin handle cyclic object references ([29888d0](https://github.com/birchill/bugsnag-zero/commit/29888d06e154f13b95ac66e673b142881d4e4ab6))

### Bug Fixes

- pre-process payload to remove circular references ([23dedc4](https://github.com/birchill/bugsnag-zero/commit/23dedc42fce265fcedddaf1f11737931e682cf92)), closes [#110](https://github.com/birchill/bugsnag-zero/issues/110)

### [0.6.2](https://github.com/birchill/bugsnag-zero/compare/v0.6.1...v0.6.2) (2023-07-19)

### Bug Fixes

- fix path to lambda-context export ([a3d6ad9](https://github.com/birchill/bugsnag-zero/commit/a3d6ad9b3cb03c2e864855c56dbcca15591c21b2))

### [0.6.1](https://github.com/birchill/bugsnag-zero/compare/v0.6.0...v0.6.1) (2023-07-12)

### Bug Fixes

- don't try to read `arguments` from call stack function ([9ad5016](https://github.com/birchill/bugsnag-zero/commit/9ad501614bde5d664e97463c8a2b5aef4f51f9c9))

## [0.6.0](https://github.com/birchill/bugsnag-zero/compare/v0.5.1...v0.6.0) (2023-06-05)

### ⚠ BREAKING CHANGES

- The types for the react plugin have now changed to
  accomodate TypeScript 5.1's more strict checking of JSX element types.

For Preact you will need something like the following:

```ts
Bugsnag.getPlugin('react')!.createErrorBoundary<
  ComponentType,
  VNode,
  ComponentType<ErrorBoundaryProps<ComponentType<FallbackComponentProps>>>
>(React.Component, React.createElement);
```

### Bug Fixes

- **deps:** update dependency ua-parser-js to v1.0.34 ([c9f9e8a](https://github.com/birchill/bugsnag-zero/commit/c9f9e8a695bff476b2b8a79f61339d4eba0f6e09))
- **deps:** update dependency ua-parser-js to v1.0.35 ([ac857d9](https://github.com/birchill/bugsnag-zero/commit/ac857d9f0cf7402ea0bfb18f42e7795aaaf3bdfe))
- fix typing for React plugin for TypeScript 5.1 ([9017c17](https://github.com/birchill/bugsnag-zero/commit/9017c1754c9f86a06e8c9e62f05e835e83de5607))

### [0.5.1](https://github.com/birchill/bugsnag-zero/compare/v0.5.0...v0.5.1) (2022-12-06)

### Bug Fixes

- fix broken CJS setup ([5dd4175](https://github.com/birchill/bugsnag-zero/commit/5dd41750e67c2155f8a8d778199efbf53a0f9d88))

### [0.5.0](https://github.com/birchill/bugsnag-zero/compare/v0.4.18...v0.5.0) (2022-12-03)

### Features

- add `originalError` to BugsnagEvent ([879d2b0](https://github.com/birchill/bugsnag-zero/commit/879d2b0abefafb16abfb240ee080edc644404208))

### [0.4.18](https://github.com/birchill/bugsnag-zero/compare/v0.4.17...v0.4.18) (2022-09-22)

### Bug Fixes

- revert attempt to clone passed-in config ([b2e4eb4](https://github.com/birchill/bugsnag-zero/commit/b2e4eb4c515a2e350e5d5c58df71fec2d67e032b))

### [0.4.17](https://github.com/birchill/bugsnag-zero/compare/v0.4.16...v0.4.17) (2022-09-22)

### Features

- support custom endpoints ([1f5e690](https://github.com/birchill/bugsnag-zero/commit/1f5e6902fb9bf9075fdf6d7699f4ae6eca42d856))

### Bug Fixes

- clone passed-in config object ([8044d25](https://github.com/birchill/bugsnag-zero/commit/8044d25e6dd92eefb974a4bd20d8ca4ca90bb525))

### [0.4.16](https://github.com/birchill/bugsnag-zero/compare/v0.4.15...v0.4.16) (2022-06-17)

### Features

- add log URL to Lambda context ([5c1d0da](https://github.com/birchill/bugsnag-zero/commit/5c1d0da150ac9ca677b03a83efa6c69150c3ca70))

### Bug Fixes

- make the Lambda timeout handling opt-in ([d30e70c](https://github.com/birchill/bugsnag-zero/commit/d30e70cbf9703a685411e3096b990a024f4374fa))

### [0.4.15](https://github.com/birchill/bugsnag-zero/compare/v0.4.14...v0.4.15) (2022-06-16)

### Features

- generate an error if a Lambda is about to timeout ([ba0441b](https://github.com/birchill/bugsnag-zero/commit/ba0441bf92becf46f9c8040bb40d2a8d93c99ffe))

### [0.4.14](https://github.com/birchill/bugsnag-zero/compare/v0.4.13...v0.4.14) (2021-11-25)

### Features

- add user agent string parsing to browser-context ([2da25ca](https://github.com/birchill/bugsnag-zero/commit/2da25ca40f4e6d25afb8c5d9352d180758b5d4f9))

### [0.4.13](https://github.com/birchill/bugsnag-zero/compare/v0.4.12...v0.4.13) (2021-10-05)

### Bug Fixes

- Fix scheme detection to assume https:// ([e9302f0](https://github.com/birchill/bugsnag-zero/commit/e9302f0306c5324569c728f68265b8be0b452b37))

### [0.4.12](https://github.com/birchill/bugsnag-zero/compare/v0.4.11...v0.4.12) (2021-10-04)

### Features

- **lambdaContext:** try to reconstruct requst URL ([35f3640](https://github.com/birchill/bugsnag-zero/commit/35f36407dd4ec791255a22006fe7918f65740107))

### [0.4.11](https://github.com/birchill/bugsnag-zero/compare/v0.4.10...v0.4.11) (2021-08-27)

### Features

- **TypeScript:** Allow errors with type unknown to be passed to notify() ([88622b1](https://github.com/birchill/bugsnag-zero/commit/88622b1281800f7e0016a3eca82492c61a1b0a3f))

### [0.4.10](https://github.com/birchill/bugsnag-zero/compare/v0.4.9...v0.4.10) (2021-08-19)

### Bug Fixes

- Try again to make everyone happy ([54819d1](https://github.com/birchill/bugsnag-zero/commit/54819d17c2018afa02dade0c2c050d462d3f3bfd))

### [0.4.9](https://github.com/birchill/bugsnag-zero/compare/v0.4.8...v0.4.9) (2021-08-19)

### Bug Fixes

- Try to make the CJS export work somehow ([229a182](https://github.com/birchill/bugsnag-zero/commit/229a1828c70348b95989eee8cb0e268dd9649c10))

### [0.4.8](https://github.com/birchill/bugsnag-zero/compare/v0.4.6...v0.4.8) (2021-08-19)

### Bug Fixes

- Export lambda-context\* entry points at root ([ddab335](https://github.com/birchill/bugsnag-zero/commit/ddab33589a71997a86bbdf8b3c3c91dff4c95bce))

### [0.4.7](https://github.com/birchill/bugsnag-zero/compare/v0.4.6...v0.4.7) (2021-08-19)

### Bug Fixes

- Export lambda-context\* entry points at root ([83d92ed](https://github.com/birchill/bugsnag-zero/commit/83d92ed9c9de1a5b9eca409d41a50360f6df7b77))

### [0.4.6](https://github.com/birchill/bugsnag-zero/compare/v0.4.5...v0.4.6) (2021-08-18)

### Bug Fixes

- Export lambdaContext as a separate module ([1c9208c](https://github.com/birchill/bugsnag-zero/commit/1c9208c57d5ad853787fa0e9bfbe436940b5d25f))

### [0.4.5](https://github.com/birchill/bugsnag-zero/compare/v0.4.4...v0.4.5) (2021-08-18)

### Features

- Pick up metadata from Error objects ([04d81da](https://github.com/birchill/bugsnag-zero/commit/04d81da9f534d787013ac751846df2c68d3dc836))

### Bug Fixes

- Rename bugsnag singleton to make autocomplete work better ([109e343](https://github.com/birchill/bugsnag-zero/commit/109e343924d6459d7cfca1e7e198967a66316fce))

### [0.4.4](https://github.com/birchill/bugsnag-zero/compare/v0.4.3...v0.4.4) (2021-08-18)

### Bug Fixes

- Mark all external modules as such ([6cb82a0](https://github.com/birchill/bugsnag-zero/commit/6cb82a04da2188e3ff494dae93c8bf8eef09358c))

### [0.4.3](https://github.com/birchill/bugsnag-zero/compare/v0.4.2...v0.4.3) (2021-08-18)

### Features

- Add lambdaContext plugin ([38cb2b6](https://github.com/birchill/bugsnag-zero/commit/38cb2b6fb69e1a9abfdaa59c8465e98d8138f774))

### [0.4.2](https://github.com/birchill/bugsnag-zero/compare/v0.4.1...v0.4.2) (2021-08-17)

### Bug Fixes

- Make environment detection work on node ([0e612c7](https://github.com/birchill/bugsnag-zero/commit/0e612c79a76cd82602489f8c8df693e2196c05f0))

### [0.4.1](https://github.com/birchill/bugsnag-zero/compare/v0.4.0...v0.4.1) (2021-08-17)

### Features

- Expose redactEvent and redactKeys functions ([8a8c922](https://github.com/birchill/bugsnag-zero/commit/8a8c922eeddf77486eaa5a8202d7ef773259b761))

## [0.4.0](https://github.com/birchill/bugsnag-zero/compare/v0.3.0...v0.4.0) (2021-08-17)

### ⚠ BREAKING CHANGES

- Delivery.send is now Delivery.sendEvent and takes
  unserialized parameters.

### Features

- Make Delivery interface closer follow the official bugsnag client ([676a8d9](https://github.com/birchill/bugsnag-zero/commit/676a8d9f8f56e88eaaa572c9640c7c48f1657508))

## [0.3.0](https://github.com/birchill/bugsnag-zero/compare/v0.2.3...v0.3.0) (2021-08-17)

### ⚠ BREAKING CHANGES

- Various browser-specific plugins have been renamed as follows:

- notifyUnhandledExceptions -> browserNotifyUnhandledExceptions
- notifyUnhandledRejections -> browserNotifyUnhandledRejections
- handledRejectionBreadcrumbs -> browserHandledRejectionBreadcrumbs

### Features

- Add unhandled exception handler for Node ([38ac65f](https://github.com/birchill/bugsnag-zero/commit/38ac65f71cfd5d26198fb0c442aff33605e4dab1))
- Add unhandledrejection handler for node ([b731384](https://github.com/birchill/bugsnag-zero/commit/b73138495d16a46466a5012f90ed308b96d9ad43))
- Make delivery mechanism configurable ([af5e749](https://github.com/birchill/bugsnag-zero/commit/af5e749997eb371f5723289a20d54fe6a653f3e9))

### Bug Fixes

- Automatically choose browserjs or nodejs for exception types ([6dff5b2](https://github.com/birchill/bugsnag-zero/commit/6dff5b227d9732dde77779cf3a39472598dc6223))

### [0.2.3](https://github.com/birchill/bugsnag-zero/compare/v0.2.2...v0.2.3) (2021-08-16)

### Features

- Export helper methods from redactKeys plugin ([fe49942](https://github.com/birchill/bugsnag-zero/commit/fe49942dcbb14dd6132ce42904b42e93ea224fa5))

### [0.2.2](https://github.com/birchill/bugsnag-zero/compare/v0.2.1...v0.2.2) (2021-08-16)

### Bug Fixes

- Export ExtendedClientApi and Plugin types ([1eedbfc](https://github.com/birchill/bugsnag-zero/commit/1eedbfc468258bc6ed2e9555c05dda19da669567))
- Extend exception type to include nodejs as well ([b352915](https://github.com/birchill/bugsnag-zero/commit/b3529154dc95a31b813bbbbe3063e294485e6b5c))

### [0.2.1](https://github.com/birchill/bugsnag-zero/compare/v0.2.0...v0.2.1) (2021-08-16)

### Bug Fixes

- Add missing browser-context file ([16f74c5](https://github.com/birchill/bugsnag-zero/commit/16f74c5b8be63a07379511b29745fe153c6063b9))

## [0.2.0](https://github.com/birchill/bugsnag-zero/compare/v0.1.0...v0.2.0) (2021-08-16)

### ⚠ BREAKING CHANGES

- You will need to explicitly include `browserContext` in
  your plugins in order to get the typical metadata associated with a
  browser session.

### Features

- Split browser context into a separate plugin ([d3db9d5](https://github.com/birchill/bugsnag-zero/commit/d3db9d5d138d19c2e59744ea4dceddb4fa5dd064))

## 0.1.0 (2021-07-23)

Initial release.
