# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.3.0](https://github.com/birchill/bugsnag-zero/compare/v0.2.3...v0.3.0) (2021-08-17)


### ⚠ BREAKING CHANGES

* Various browser-specific plugins have been renamed as follows:

* notifyUnhandledExceptions -> browserNotifyUnhandledExceptions
* notifyUnhandledRejections -> browserNotifyUnhandledRejections
* handledRejectionBreadcrumbs -> browserHandledRejectionBreadcrumbs

### Features

* Add unhandled exception handler for Node ([38ac65f](https://github.com/birchill/bugsnag-zero/commit/38ac65f71cfd5d26198fb0c442aff33605e4dab1))
* Add unhandledrejection handler for node ([b731384](https://github.com/birchill/bugsnag-zero/commit/b73138495d16a46466a5012f90ed308b96d9ad43))
* Make delivery mechanism configurable ([af5e749](https://github.com/birchill/bugsnag-zero/commit/af5e749997eb371f5723289a20d54fe6a653f3e9))


### Bug Fixes

* Automatically choose browserjs or nodejs for exception types ([6dff5b2](https://github.com/birchill/bugsnag-zero/commit/6dff5b227d9732dde77779cf3a39472598dc6223))

### [0.2.3](https://github.com/birchill/bugsnag-zero/compare/v0.2.2...v0.2.3) (2021-08-16)


### Features

* Export helper methods from redactKeys plugin ([fe49942](https://github.com/birchill/bugsnag-zero/commit/fe49942dcbb14dd6132ce42904b42e93ea224fa5))

### [0.2.2](https://github.com/birchill/bugsnag-zero/compare/v0.2.1...v0.2.2) (2021-08-16)


### Bug Fixes

* Export ExtendedClientApi and Plugin types ([1eedbfc](https://github.com/birchill/bugsnag-zero/commit/1eedbfc468258bc6ed2e9555c05dda19da669567))
* Extend exception type to include nodejs as well ([b352915](https://github.com/birchill/bugsnag-zero/commit/b3529154dc95a31b813bbbbe3063e294485e6b5c))

### [0.2.1](https://github.com/birchill/bugsnag-zero/compare/v0.2.0...v0.2.1) (2021-08-16)


### Bug Fixes

* Add missing browser-context file ([16f74c5](https://github.com/birchill/bugsnag-zero/commit/16f74c5b8be63a07379511b29745fe153c6063b9))

## [0.2.0](https://github.com/birchill/bugsnag-zero/compare/v0.1.0...v0.2.0) (2021-08-16)


### ⚠ BREAKING CHANGES

* You will need to explicitly include `browserContext` in
your plugins in order to get the typical metadata associated with a
browser session.

### Features

* Split browser context into a separate plugin ([d3db9d5](https://github.com/birchill/bugsnag-zero/commit/d3db9d5d138d19c2e59744ea4dceddb4fa5dd064))

## 0.1.0 (2021-07-23)

Initial release.
