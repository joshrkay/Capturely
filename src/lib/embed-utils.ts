const WIDGET_SRC = "https://cdn.capturely.io/widget.js";

export function generateGenericSnippet(publicKey: string): string {
  return `<script src="${WIDGET_SRC}" data-pk="${publicKey}"></script>`;
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
