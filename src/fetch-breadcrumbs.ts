import { ExtendedClientApi, Plugin } from './client';

// Unlike the official bugsnag JS client this does NOT cover XHR.
// Furthermore, it does not provide a way to be cleaned up.
export const fetchBreadcrumbs: Plugin = {
  name: 'fetchBreadcrumbs',
  load(client: ExtendedClientApi) {
    if (!('fetch' in self)) {
      return;
    }

    const oldFetch = self.fetch;
    self.fetch = function fetch(input: RequestInfo, init?: RequestInit) {
      let method: string | undefined;
      let url: string;

      if (input && typeof input === 'object') {
        url = input.url;
        if (init && 'method' in init) {
          method = init.method;
        } else if (input && 'method' in input) {
          method = input.method;
        }
      } else {
        url = input;
        if (init && 'method' in init) {
          method = init.method;
        }
      }

      if (method === undefined) {
        method = 'GET';
      }

      const leaveBreadcrumb = client.leaveBreadcrumb.bind(client);
      return new Promise((resolve, reject) => {
        oldFetch(input, init)
          .then((response) => {
            handleFetchSuccess({
              response,
              method: method!,
              url,
              leaveBreadcrumb,
            });
            resolve(response);
          })
          .catch((error) => {
            handleFetchError({ method: method!, url, leaveBreadcrumb });
            reject(error);
          });
      });
    };
  },
};

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
