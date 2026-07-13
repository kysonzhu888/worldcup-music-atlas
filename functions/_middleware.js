import { classifyRequestPath } from "./path-policy.js";

export async function onRequest(context) {
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
