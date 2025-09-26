# @birchill/bugsnag-zero-lambda-context

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
