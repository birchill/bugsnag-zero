import { ExtendedClientApi, Plugin } from './client';

export const limitEvents = (limit: number): Plugin => {
  let n = 0;

  const reset = () => {
    n = 0;
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', reset);
  }

  return {
    name: 'limitEvents',
    load(client: ExtendedClientApi) {
      client.addOnError(function throttle(): boolean | void {
        if (n >= limit) {
          return false;
        }
        n++;
      });

      return { reset };
    },
  };
};
