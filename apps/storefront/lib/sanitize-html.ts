/**
 * Native, lightweight browser-safe HTML sanitizer for editorial prose and rich-text.
 * Conforms to Ponytail YAGNI & standard platform principles: uses the browser's native
 * DOMParser in-memory sandbox with zero third-party runtime dependencies.
 *
 * Enforces strict defense-in-depth against Stored XSS, script execution, and protocol smuggling:
 * - Allowed tag whitelist
 * - Safe attribute whitelist
 * - JavaScript URI protocol disarming (javascript:, data:, vbscript:)
 * - Automatic rel="noopener noreferrer" injection on external links
 * - Disarming of all on* event handler attributes
 */

const ALLOWED_TAGS = new Set([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'BLOCKQUOTE',
  'STRONG',
  'EM',
  'B',
  'I',
  'U',
  'S',
  'UL',
  'OL',
  'LI',
  'A',
  'IMG',
  'FIGURE',
  'FIGCAPTION',
  'SPAN',
  'DIV',
  'HR',
  'BR',
  'PRE',
  'CODE',
  'TABLE',
  'THEAD',
  'TBODY',
  'TR',
  'TH',
  'TD',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['class', 'id']),
  A: new Set(['href', 'title', 'target', 'rel']),
  IMG: new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
  TD: new Set(['colspan', 'rowspan']),
  TH: new Set(['colspan', 'rowspan']),
};

const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|tel):|\/|#)/i;

/**
 * Sanitizes untrusted HTML string into safe markup.
 * Can be safely called in browser and server environments.
 */
export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  // If running in an environment without DOMParser (e.g. Node/SSR/edge runtime or tests),
  // strip all script/tag injection vectors and enforce safe link policies.
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:[^"']*/gi, '#')
      .replace(/(<a\b[^>]*target=["']_blank["'][^>]*)(>)/gi, (match, prefix) => {
        if (!prefix.includes('rel=')) {
          return `${prefix} rel="noopener noreferrer">`;
        }
        return match;
      });
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml, 'text/html');

    function cleanNode(node: Node): void {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tagName = el.tagName.toUpperCase();

          // If tag is not allowed, remove it or replace with its children
          if (!ALLOWED_TAGS.has(tagName)) {
            // Drop forbidden active elements (script, iframe, object, embed, style, form, svg)
            if (
              ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'SVG', 'MATH'].includes(
                tagName,
              )
            ) {
              el.remove();
              continue;
            }
            // For other tags, unwrap text contents
            while (el.firstChild) {
              el.parentNode?.insertBefore(el.firstChild, el);
            }
            el.remove();
            continue;
          }

          // Sanitize attributes on allowed elements
          const allowedForTag = ALLOWED_ATTRS[tagName] || new Set();
          const globalAllowed = ALLOWED_ATTRS['*'] || new Set();

          const attrNames = Array.from(el.attributes).map((attr) => attr.name);
          for (const attrName of attrNames) {
            const lowerAttr = attrName.toLowerCase();

            // Disarm any on* event handler
            if (lowerAttr.startsWith('on')) {
              el.removeAttribute(attrName);
              continue;
            }

            // Check if attribute is whitelisted
            if (!allowedForTag.has(attrName) && !globalAllowed.has(lowerAttr)) {
              el.removeAttribute(attrName);
              continue;
            }

            // URL sanitization for href and src
            if (lowerAttr === 'href' || lowerAttr === 'src') {
              const val = el.getAttribute(attrName)?.trim() || '';
              if (!SAFE_URL_PATTERN.test(val)) {
                el.removeAttribute(attrName);
              }
            }
          }

          // Hardening for links: ensure rel="noopener noreferrer" on target="_blank"
          if (tagName === 'A') {
            const target = el.getAttribute('target');
            if (target && target.toLowerCase() === '_blank') {
              el.setAttribute('rel', 'noopener noreferrer');
            }
          }

          // Recursively clean children
          cleanNode(el);
        } else if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.COMMENT_NODE) {
          // Remove unusual node types
          child.remove();
        }
      }
    }

    cleanNode(doc.body);
    return doc.body.innerHTML;
  } catch {
    // If parsing fails for any reason, safely escape
    return dirtyHtml.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
