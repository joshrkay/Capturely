function getWidgetSrc(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${baseUrl}/widget.js`;
}

export function generateGenericSnippet(publicKey: string): string {
  return `<script src="${getWidgetSrc()}" data-public-key="${publicKey}"></script>`;
}

export function generateShopifySnippet(publicKey: string): string {
  return `<!-- Add before </head> in theme.liquid via Online Store > Themes > Edit Code -->\n${generateGenericSnippet(publicKey)}`;
}

export function generateWordPressSnippet(publicKey: string): string {
  return `add_action('wp_head', function() {\n  echo '${generateGenericSnippet(publicKey)}';\n});`;
}

export function generateGTMSnippet(publicKey: string): string {
  return `<!-- Create a new Tag > Custom HTML in GTM with trigger "All Pages" -->\n${generateGenericSnippet(publicKey)}`;
}
