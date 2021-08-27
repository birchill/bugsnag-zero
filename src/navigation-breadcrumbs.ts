import { ExtendedClientApi, Plugin } from './client';

export const navigationBreadcrumbs: Plugin = {
  name: 'navigationBreadcrumbs',
  load(client: ExtendedClientApi) {
    if (!('addEventListener' in self)) {
      return;
    }

    const drop = (name: string) => () =>
      client.leaveBreadcrumb(name, undefined, 'navigation');

    self.addEventListener('pagehide', drop('Page hidden'), true);
    self.addEventListener('pageshow', drop('Page shown'), true);
    self.addEventListener('load', drop('Page loaded'), true);
    if (self.document) {
      self.document.addEventListener(
        'DOMContentLoaded',
        drop('DOMContentLoaded'),
        true
      );
    }

    // Some browsers like to emit popstate when the page loads, so only add the
    // popstate listener after that
    self.addEventListener('load', () =>
      self.addEventListener('popstate', drop('Navigated back'), true)
    );

    // hashchange has some metadata that we care about
    if (self.location) {
      self.addEventListener(
        'hashchange',
        (event: HashChangeEvent) => {
          const metadata = event.oldURL
            ? {
                from: relativeLocation(event.oldURL),
                to: relativeLocation(event.newURL),
                state: getCurrentState(self),
              }
            : { to: relativeLocation(self.location.href) };
          client.leaveBreadcrumb('Hash changed', metadata, 'navigation');
        },
        true
      );
    }

    // Wrap replaceState/pushState
    const leaveBreadcrumb = client.leaveBreadcrumb.bind(client);
    if (self.history && self instanceof Window) {
      if (typeof self.history.replaceState === 'function') {
        wrapHistoryFn({
          fn: 'replaceState',
          target: self.history,
          leaveBreadcrumb,
          win: self,
        });
      }
      if (typeof self.history.pushState === 'function') {
        wrapHistoryFn({
          fn: 'pushState',
          target: self.history,
          leaveBreadcrumb,
          win: self,
        });
      }
    }
  },
};

// Takes a full url like http://foo.com:1234/pages/01.html?yes=no#section-2 and
// returns just the path and hash parts, e.g. /pages/01.html?yes=no#section-2
//
// Compatibility: This uses the URL constructor which is not available in IE
// or Edge < 12.
function relativeLocation(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
  } catch (e) {
    return url;
  }
}

function getCurrentState(win: Window): any {
  try {
    return win.history.state;
  } catch (e) {
    return {};
  }
}

function wrapHistoryFn({
  fn,
  leaveBreadcrumb,
  target,
  win,
}: {
  fn: 'replaceState' | 'pushState';
  leaveBreadcrumb: ExtendedClientApi['leaveBreadcrumb'];
  target: History;
  win: Window;
}) {
  const orig = target[fn];
  target[fn] = (state: any, title: string, url?: string | null | undefined) => {
    leaveBreadcrumb(
      `History ${fn}`,
      stateChangeToMetadata({ win, state, title, url }),
      'navigation'
    );

    // TODO: If we implement maxEvents, reset that count here.

    orig.apply(target, [state, title, url]);
  };
}

function stateChangeToMetadata({
  win,
  state,
  title,
  url,
}: {
  win: Window;
  state: any;
  title: string;
  url?: string | null | undefined;
}) {
  const currentPath = relativeLocation(win.location.href);

  return {
    title,
    state,
    prevState: getCurrentState(win),
    to: url || currentPath,
    from: currentPath,
  };
}
