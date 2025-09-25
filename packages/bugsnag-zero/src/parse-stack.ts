import { StackFrame } from './event';

// The following code is based on:
//
// https://github.com/stacktracejs/error-stack-parser/blob/master/error-stack-parser.js
//
// which is released under the MIT license. Its copyright and license terms
// are as follows:
//
// Copyright (c) 2017 Eric Wendelin and other contributors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// It has been modified to match Bugsnag's stackframe format, remove unneeded
// Opera stackframe handling, and use TypeScript and more modern JavaScript.

const CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
const SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;

export function parseStack(stackString: string): Array<StackFrame> {
  const partialResult = stackString.match(CHROME_IE_STACK_REGEXP)
    ? parseV8OrIE(stackString)
    : parseFFOrSafari(stackString);

  return partialResult.reduce<StackFrame[]>((result, stack) => {
    // Drop empty stack frames
    if (JSON.stringify(stack) === '{}') {
      return result;
    }

    // If we have no file or method but we _do_ have a line number, it must be
    // global code.
    let file =
      !stack.file && !stack.method && typeof stack.lineNumber === 'number'
        ? 'global code'
        : stack.file || '(unknown file)';

    // Strip the query string / fragment from filenames
    file = file.replace(/\?.*$/, '').replace(/#.*$/, '');

    // Case normalize "global code" function names
    let method = stack.method || '(unknown function)';
    method = /^global code$/i.test(method) ? 'global code' : method;

    return result.concat([
      {
        file,
        lineNumber: stack.lineNumber,
        columnNumber: stack.columnNumber,
        method,
      },
    ]);
  }, []);
}

function parseV8OrIE(stackString: string): Array<Partial<StackFrame>> {
  const filtered = stackString
    .split('\n')
    .filter((line) => !!line.match(CHROME_IE_STACK_REGEXP));

  return filtered.map((line) => {
    // Bugsnag stack frames don't have a way of representing eval origins
    // so we just throw that information away for now.
    //
    // stacktrace.js can represent this but it still throws this information
    // away.
    if (line.indexOf('(eval ') > -1) {
      line = line
        .replace(/eval code/g, 'eval')
        .replace(/(\(eval at [^()]*)|(\),.*$)/g, '');
    }
    let sanitizedLine = line.replace(/^\s+/, '').replace(/\(eval code/g, '(');

    // Capture and preserve the parenthesized location "(/foo/my bar.js:12:87)"
    // in case it has spaces in it, as the string is split on \s+ later on.
    const location = sanitizedLine.match(/ (\((.+):(\d+):(\d+)\)$)/);

    // Remove the parenthesized location from the line, if it was matched.
    sanitizedLine = location
      ? sanitizedLine.replace(location[0], '')
      : sanitizedLine;

    const tokens = sanitizedLine.split(/\s+/).slice(1);

    // If a location was matched, pass it to extractLocation(), otherwise pop
    // the last token.
    const locationParts = extractLocation(
      location ? location[1] : tokens.pop() || '(no location)'
    );

    const method = tokens.join(' ') || undefined;
    const file =
      ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1
        ? undefined
        : locationParts[0];

    return {
      file,
      lineNumber: locationParts[1],
      columnNumber: locationParts[2],
      method,
    };
  });
}

function parseFFOrSafari(stackString: string): Array<Partial<StackFrame>> {
  const filtered = stackString
    .split('\n')
    .filter((line) => !line.match(SAFARI_NATIVE_CODE_REGEXP));

  return filtered.map((line) => {
    // Bugsnag stack frames don't have a way of representing eval origins
    // so we just throw that information away for now.
    //
    // stacktrace.js can represent this but it still throws this information
    // away.
    if (line.indexOf(' > eval') > -1) {
      line = line.replace(
        / line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,
        ':$1'
      );
    }

    if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
      // Safari eval frames only have function names and nothing else
      return {
        method: line,
      };
    } else {
      const functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
      const matches = line.match(functionNameRegex);
      const method = matches && matches[1] ? matches[1] : undefined;
      const locationParts = extractLocation(
        line.replace(functionNameRegex, '')
      );

      return {
        file: locationParts[0],
        lineNumber: locationParts[1],
        columnNumber: locationParts[2],
        method,
      };
    }
  });
}

// Separate line and column numbers from a string of the form: (URI:Line:Column)
function extractLocation(
  urlLike: string
): [uri: string, line?: number | undefined, col?: number | undefined] {
  // Fail-fast but return locations like "(native)"
  if (urlLike.indexOf(':') === -1) {
    return [urlLike];
  }

  const regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
  const parts = regExp.exec(urlLike.replace(/[()]/g, ''));
  if (!parts) {
    return [urlLike];
  }

  const line = parts[2] ? parseInt(parts[2], 10) : undefined;
  const col = parts[3] ? parseInt(parts[3], 10) : undefined;

  return [parts[1], line, col];
}
