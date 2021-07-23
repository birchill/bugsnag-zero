import { ExtendedClientApi, OnErrorCallback, Plugin } from './client';
import { toException } from './to-exception';

// ------------------------------------------------------------------------
//
// Public interface
//
// ------------------------------------------------------------------------

// The typing in this is incredibly convoluted because we want to:
//
// 1. Avoid introducing a dependency on React
// 2. Allow users to easily substitute in Preact instead.
//
// Hence we basically have these type definitions that represent the minimal
// subset of what we need from React.
//
// This means the call site needs to define a few parameters themselves.
//
// e.g. for Preact we'd have something like:
//
//   const MyBugsnagErrorBoundary = React.useMemo(
//     () =>
//       Bugsnag.getPlugin('react')!.createErrorBoundary<
//         typeof React.Component,
//         ComponentType,
//         VNode
//       >(React.Component, React.createElement),
//     []
//   );
//
// I'm not sure about React-proper, however.

// Unlike the official client, we don't allow passing in React to the
// constructor. Instead we always require a call to createErrorBoundary.
export const ReactPlugin: Plugin = {
  name: 'react',
  load(client: ExtendedClientApi): ReactPluginResult {
    return {
      createErrorBoundary: <
        Component extends ClassComponentType,
        ComponentType,
        Element
      >(
        component: Component,
        createElement: CreateElementFunc<
          FallbackComponentProps,
          ComponentType,
          Element
        >
      ): Component => {
        return createClass(client, component, createElement);
      },
    };
  },
};

export interface ReactPluginResult {
  createErrorBoundary<
    Component extends ClassComponentType,
    ComponentType,
    Element
  >(
    component: Component,
    createElement: CreateElementFunc<
      FallbackComponentProps,
      ComponentType,
      Element
    >
  ): Component;
}

export type FallbackComponentProps = {
  error?: Error;
  info?: ErrorInfo;
  clearError: () => void;
};

// ------------------------------------------------------------------------
//
// Internals
//
// ------------------------------------------------------------------------

type CreateElementFunc<P extends Record<string, any>, ComponentType, Element> =
  (type: ComponentType, props?: P | null, ...children: any) => Element;

type ClassComponentType<P = Record<string, any>, S = Record<string, any>> =
  abstract new (...args: any[]) => ClassComponent<P, S>;

interface ClassComponent<P = Record<string, any>, S = Record<string, any>> {
  setState: <K extends keyof S>(
    state:
      | ((prevState: Readonly<S>, props: Readonly<P>) => Pick<S, K> | S | null)
      | (Pick<S, K> | S | null),
    callback?: () => void
  ) => void;
  state: Readonly<S>;
  readonly props: Readonly<P> & Readonly<{ children?: any }>;
}

interface ErrorInfo {
  componentStack: string;
}

type ErrorBoundaryProps<ComponentType> = {
  onError?: OnErrorCallback;
  FallbackComponent?: ComponentType;
};

type ErrorBoundaryState = {
  error?: Error;
  info?: ErrorInfo;
};

function createClass<
  Component extends ClassComponentType<
    ErrorBoundaryProps<ComponentType>,
    ErrorBoundaryState
  >,
  ComponentType,
  Element
>(
  client: ExtendedClientApi,
  component: Component,
  createElement: CreateElementFunc<
    FallbackComponentProps,
    ComponentType,
    Element
  >
) {
  abstract class BugsnagErrorBoundaryComponent extends component {
    constructor(...args: any[]) {
      super(args);
      this.state = {
        error: undefined,
        info: undefined,
      };
      this.handleClearError = this.handleClearError.bind(this);
    }

    handleClearError() {
      this.setState({ error: undefined, info: undefined });
    }

    componentDidCatch(error: Error, info?: ErrorInfo) {
      const { exception, metadata } = toException(error, 'notify');
      if (info && info.componentStack) {
        info.componentStack = formatComponentStack(info.componentStack);
      }
      const { onError } = this.props;
      client.notifyEvent({
        exceptions: [exception],
        unhandled: true,
        severity: 'error',
        severityReason: {
          type: 'unhandledException',
        },
        metadata: { ...metadata, react: info },
        onError,
      });
      this.setState({ error, info });
    }

    render() {
      const { error } = this.state;
      if (error) {
        const { FallbackComponent } = this.props;
        if (FallbackComponent) {
          return createElement(FallbackComponent, {
            ...this.state,
            clearError: this.handleClearError,
          });
        }
        return null;
      }

      return this.props.children;
    }
  }

  return BugsnagErrorBoundaryComponent;
}

function formatComponentStack(str: string): string {
  const lines = str.split(/\s*\n\s*/g);
  let ret = '';
  for (let line = 0, len = lines.length; line < len; line++) {
    if (lines[line].length) ret += `${ret.length ? '\n' : ''}${lines[line]}`;
  }
  return ret;
}
