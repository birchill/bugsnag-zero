import { ExtendedClientApi, Plugin } from './client';
import { isObject } from './is-object';

// Unlike the official bugsnag JS client this does NOT cover XHR.
// Furthermore, it does not provide a way to be cleaned up.
export const fetchBreadcrumbs: Plugin = {
  name: 'fetchBreadcrumbs',
  load(client: ExtendedClientApi) {
    if (!('fetch' in self)) {
      return;
    }

    const oldFetch = self.fetch;
    self.fetch = function fetch(input: RequestInfo | URL, init?: RequestInit) {
      let method = 'GET';
      let url: string;

      if (isRequest(input)) {
        url = input.url;
        method = input.method;
      } else {
        url = input.toString();
      }

      // Per the fetch algorithm, the method specified in the RequestInit takes
      // precedence over the method specified in the Request.
      if (init && typeof init.method === 'string' && init.method.length) {
        method = init.method;
      }

      const leaveBreadcrumb = client.leaveBreadcrumb.bind(client);
      return new Promise((resolve, reject) => {
        oldFetch(input, init)
          .then((response) => {
            handleFetchSuccess({ response, method, url, leaveBreadcrumb });
            resolve(response);
          })
          .catch((error) => {
            handleFetchError({ method, url, leaveBreadcrumb });
            reject(error);
          });
      });
    };
  },
};

function isRequest(input: RequestInfo | URL): input is Request {
  // instanceof alone won't work for objects from different realms
  return input instanceof Request || (isObject(input) && 'url' in input);
}

function handleFetchSuccess({
  response,
  method,
  url,
  leaveBreadcrumb,
}: {
  response: Response;
  method: string;
  url: string;
  leaveBreadcrumb: ExtendedClientApi['leaveBreadcrumb'];
}) {
  // The official bugsnag client ignores bugsnag requests for XHR but not for
  // fetch. I think it means to ignore it for fetch, though.
  if (url.startsWith('https://notify.bugsnag.com')) {
    return;
  }

  const metadata = {
    status: response.status,
    request: `${method} ${url}`,
  };

  if (response.status >= 400) {
    leaveBreadcrumb('fetch() failed', metadata, 'request');
  } else {
    leaveBreadcrumb('fetch() succeeded', metadata, 'request');
  }
}

function handleFetchError({
  method,
  url,
  leaveBreadcrumb,
}: {
  method: string;
  url: string;
  leaveBreadcrumb: ExtendedClientApi['leaveBreadcrumb'];
}) {
  if (url.startsWith('https://notify.bugsnag.com')) {
    return;
  }

  leaveBreadcrumb('fetch() error', { request: `${method} ${url}` }, 'request');
}
