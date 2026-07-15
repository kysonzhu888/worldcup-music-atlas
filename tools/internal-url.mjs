const INTERNAL_ATTRIBUTE = /(href|src)=(['"])((?:\.\.\/)+(?:[^'"?#]*)(?:[?#][^'"]*)?)(\2)/g;
const ROOT_SITE_ATTRIBUTE =
  /(href|src)=(['"])((?:index\.html|styles\.css|script\.js|robots\.txt|sitemap\.xml|ads\.txt|(?:data|assets|songs|artists|countries|years|timeline|listen|glossary|about|contact|privacy|world-cup-2026-final-halftime-show)\/)[^'"]*)(\2)/g;

export function absolutizeInternalUrls(html) {
  return String(html)
    .replace(INTERNAL_ATTRIBUTE, (_match, attribute, quote, relativeUrl, closingQuote) => {
      const absoluteUrl = `/${relativeUrl.replace(/^(?:\.\.\/)+/, "")}`;
      return `${attribute}=${quote}${absoluteUrl}${closingQuote}`;
    })
    .replace(
      ROOT_SITE_ATTRIBUTE,
      (_match, attribute, quote, relativeUrl, closingQuote) =>
        `${attribute}=${quote}/${relativeUrl}${closingQuote}`
    );
}
