import { isObject } from './is-object';
import { ExtendedClientApi, Plugin } from './client';

export const interactionBreadcrumbs: Plugin = {
  name: 'interactionBreadcrumbs',
  load(client: ExtendedClientApi) {
    if (!('addEventListener' in self)) {
      return;
    }

    self.addEventListener(
      'click',
      (event) => {
        let targetText, targetSelector;
        try {
          targetText = isHtmlElement(event.target)
            ? getNodeText(event.target)
            : '(Non-HTML Element)';
          targetSelector = isElement(event.target)
            ? getNodeSelector(event.target)
            : '(Non-element target)';
        } catch (e) {
          targetText = '[hidden]';
          targetSelector = '[hidden]';
        }
        client.leaveBreadcrumb(
          'UI click',
          { targetText, targetSelector },
          'user'
        );
      },
      true
    );
  },
};

function isElement(target: EventTarget | null): target is Element {
  return isObject(target) && (target as Node).nodeType === Node.ELEMENT_NODE;
}

function isHtmlElement(target: EventTarget | null): target is HTMLElement {
  return (
    isElement(target) && target.namespaceURI === 'http://www.w3.org/1999/xhtml'
  );
}

function getNodeText(elem: HTMLElement): string {
  let text = elem.textContent || elem.innerText || '';
  if (
    !text &&
    ((elem as HTMLInputElement).type === 'submit' ||
      (elem as HTMLInputElement).type === 'button')
  ) {
    text = (elem as HTMLInputElement).value;
  }
  return truncate(text.trim(), 140);
}

// Create a label from tagname, id and css class of the element
function getNodeSelector(elem: Element): string {
  // Generate an initial selector using ID + class names
  //
  // (This is particularly unsuitable for utility CSS frameworks like Tailwind
  // but oh well)
  const parts = [elem.tagName];
  if (elem.id) {
    parts.push('#' + elem.id);
  }
  if (elem.className && elem.className.length) {
    parts.push(`.${elem.className.split(' ').join('.')}`);
  }

  // We can't try out the selector in this context so just return it as-is.
  if (!self.document.querySelectorAll) {
    return parts.join('');
  }

  // See if the selector we have generated is sufficiently specific
  try {
    if (self.document.querySelectorAll(parts.join('')).length === 1) {
      return parts.join('');
    }
  } catch {
    // Sometimes the query selector can be invalid just return it as-is.
    return parts.join('');
  }

  // Try to get a more specific selector if this one matches more than one
  // element.
  if (elem.parentNode && elem.parentNode.childNodes.length > 1) {
    const index = Array.from(elem.parentNode.children).indexOf(elem) + 1;
    parts.push(`:nth-child(${index})`);
  }

  if (self.document.querySelectorAll(parts.join('')).length === 1) {
    return parts.join('');
  }

  // Try prepending the parent element selector
  if (elem.parentElement) {
    return `${getNodeSelector(elem.parentElement)} > ${parts.join('')}`;
  }

  return parts.join('');
}

function truncate(value: string, length: number): string {
  const ommision = '(...)';
  return value.length <= length
    ? value
    : value.slice(0, length - ommision.length) + ommision;
}
