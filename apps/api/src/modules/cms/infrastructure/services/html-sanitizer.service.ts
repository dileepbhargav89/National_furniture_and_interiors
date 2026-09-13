import sanitizeHtml from 'sanitize-html';

export interface IHtmlSanitizerService {
  sanitize(html: string): string;
}

export class HtmlSanitizerService implements IHtmlSanitizerService {
  public sanitize(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'figure', 'figcaption', 'iframe'
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        'img': ['src', 'alt', 'width', 'height', 'loading'],
        'a': ['href', 'name', 'target', 'rel'],
        'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
        '*': ['style', 'class'], // Be careful with allowing style globally in a real prod scenario
      },
      allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
      allowedStyles: {
        '*': {
          // Allow basic styles
          'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
          'text-align': [/^left$/, /^right$/, /^center$/],
          'font-size': [/^\d+(?:px|em|rem|%)$/],
        }
      }
    });
  }
}
