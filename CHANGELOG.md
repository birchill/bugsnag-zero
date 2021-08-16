# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
