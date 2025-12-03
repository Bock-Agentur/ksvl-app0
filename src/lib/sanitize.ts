/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows only safe tags and attributes for AI chat rendering
 */

const ALLOWED_TAGS = ['a', 'br', 'p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li'];
const ALLOWED_ATTRS: Record<string, string[]> = {
  'a': ['href', 'class', 'target', 'rel'],
};

/**
 * Simple HTML sanitizer for AI chat content
 * Only allows safe tags and sanitizes URLs
 */
export function sanitizeHtml(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Process all elements
  sanitizeNode(temp);
  
  return temp.innerHTML;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);
  
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      const tagName = element.tagName.toLowerCase();
      
      if (!ALLOWED_TAGS.includes(tagName)) {
        // Replace disallowed tags with their text content
        const text = document.createTextNode(element.textContent || '');
        node.replaceChild(text, element);
      } else {
        // Remove disallowed attributes
        const allowedAttrs = ALLOWED_ATTRS[tagName] || [];
        const attrs = Array.from(element.attributes);
        
        for (const attr of attrs) {
          if (!allowedAttrs.includes(attr.name)) {
            element.removeAttribute(attr.name);
          }
        }
        
        // Sanitize href to prevent javascript: URLs
        if (tagName === 'a') {
          const href = element.getAttribute('href');
          if (href && !isValidUrl(href)) {
            element.removeAttribute('href');
          }
          // Add security attributes for external links
          element.setAttribute('rel', 'noopener noreferrer');
        }
        
        // Recursively sanitize children
        sanitizeNode(element);
      }
    }
  }
}

function isValidUrl(url: string): boolean {
  // Only allow http, https, mailto, and relative URLs
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    !trimmed.includes(':')
  );
}

/**
 * Format AI chat content with markdown-like syntax
 * and sanitize the result
 */
export function formatChatContent(content: string): string {
  const formatted = content
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="font-medium">$1</a>')
    .replace(/\n/g, '<br/>');
  
  return sanitizeHtml(formatted);
}
