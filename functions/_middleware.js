import { classifyRequestPath } from "./path-policy.js";

const SEARCH_CONSOLE_VERIFICATION_PATH = "/google1089c0cca1aa4f0a.html";
const SEARCH_CONSOLE_VERIFICATION_BODY =
  "google-site-verification: google1089c0cca1aa4f0a.html\n";

export async function onRequest(context) {
  const requestURL = new URL(context.request.url);
  const servesVerificationFile =
    (context.request.method === "GET" || context.request.method === "HEAD") &&
    requestURL.pathname === SEARCH_CONSOLE_VERIFICATION_PATH;
  if (servesVerificationFile) {
    return new Response(
      context.request.method === "HEAD" ? null : SEARCH_CONSOLE_VERIFICATION_BODY,
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=14400, must-revalidate",
          "Content-Type": "text/plain; charset=UTF-8",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }

  const { action } = classifyRequestPath(context.request.url);
  if (action === "continue") {
    return context.next();
  }

  return new Response(notFoundHtml(), {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "text/html; charset=UTF-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function notFoundHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Page not found | World Cup Music Atlas</title>
  </head>
  <body>
    <main>
      <h1>Page not found</h1>
      <p>This path is not part of the atlas.</p>
      <p><a href="/">Return to World Cup Music Atlas</a></p>
    </main>
  </body>
</html>`;
}
