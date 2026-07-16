const SEARCH_CONSOLE_VERIFICATION_BODY =
  "google-site-verification: google1089c0cca1aa4f0a.html\n";

export function onRequestGet() {
  return new Response(SEARCH_CONSOLE_VERIFICATION_BODY, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=14400, must-revalidate",
      "Content-Type": "text/plain; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
