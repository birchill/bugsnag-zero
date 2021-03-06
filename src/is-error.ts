// Based heavily on: https://github.com/mk-pmb/is-error-js
//
// which has the following license:
//
// Copyright (c) 2015 is-error.
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
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const objectToString = Object.prototype.toString;
const getPrototypeOf = Object.getPrototypeOf;
const ERROR_TYPE = '[object Error]';

export function isError(a: unknown): a is Error {
  if (a instanceof Error) {
    return true;
  }

  let err = a;
  while (err) {
    if (objectToString.call(err) === ERROR_TYPE) {
      return true;
    }
    err = getPrototypeOf(err);
  }

  return false;
}
