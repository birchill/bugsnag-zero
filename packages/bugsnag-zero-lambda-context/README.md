# @birchill/bugsnag-zero-lambda-context

This package bundles the AWS Lambda context plugin from
[`@birchill/bugsnag-zero`](../bugsnag-zero) for standalone consumption.

Install alongside the main client package and register it as a Bugsnag zero
plugin:

```ts
import Bugsnag from '@birchill/bugsnag-zero';
import { lambdaContext } from '@birchill/bugsnag-zero-lambda-context';

Bugsnag.start({ plugins: [lambdaContext(/* ... */)] });
```
