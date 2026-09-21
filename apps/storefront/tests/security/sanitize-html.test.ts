import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../lib/sanitize-html';

describe('sanitizeHtml Security Utility', () => {
  it('preserves benign editorial HTML markup', () => {
    const input =
      '<h2>Heritage Teak Credenza</h2><p>Hand-joined in our <strong>Bengaluru Atelier</strong>.</p>';
    const output = sanitizeHtml(input);
    expect(output).toContain('<h2>Heritage Teak Credenza</h2>');
    expect(output).toContain('<strong>Bengaluru Atelier</strong>');
  });

  it('strips malicious script tags completely', () => {
    const input = '<p>Artisan story</p><script>alert("XSS")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).not.toContain('alert("XSS")');
    expect(output).toContain('<p>Artisan story</p>');
  });

  it('strips inline on* event handlers from allowed tags', () => {
    const input =
      '<img src="/images/teak.jpg" alt="Teak" onerror="alert(1)" onload="fetch(\'/steal\')" />';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('onload');
    expect(output).toContain('src="/images/teak.jpg"');
    expect(output).toContain('alt="Teak"');
  });

  it('disarms javascript: pseudo-protocol URIs in links', () => {
    const input = '<a href="javascript:alert(document.cookie)">Explore Collection</a>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('javascript:');
    expect(output).toContain('Explore Collection');
  });

  it('automatically adds rel="noopener noreferrer" to external blank links', () => {
    const input = '<a href="https://nationalinteriors.com" target="_blank">Atelier Site</a>';
    const output = sanitizeHtml(input);
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('handles empty, null, or non-string inputs safely', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});
