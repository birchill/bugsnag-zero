# @birchill/bugsnag-zero-lambda-context

## 0.8.2

### Patch Changes

- aeb966d: Export BugsnagStatic type so external plugins can extend it
- Updated dependencies [aeb966d]
  - @birchill/bugsnag-zero@0.8.1

## 0.8.1

### Patch Changes

- 767c69a: Fixed typing for Bugsnag.getPlugin('lambdaContext')

## 0.8.0

### Minor Changes

- c171aee: Moved lambda context plugin to a separate package:
  `@birchill/bugsnag-zero-lambda-context`.

  If you are using the lambda context plugin, you will need to add the
  `@birchill/bugsnag-zero-lambda-context` package to your dependencies and update
  your import statements.

  ```diff
  -import { lambdaContext } from '@birchill/bugsnag-zero/lambda-context';
  +import { lambdaContext } from '@birchill/bugsnag-zero-lambda-context';
  ```
