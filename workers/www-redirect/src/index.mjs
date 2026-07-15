const APEX_ORIGIN = 'https://worldcupmusicatlas.com';

export function buildRedirectUrl(requestUrl) {
  const source = new URL(requestUrl);
  const target = new URL(APEX_ORIGIN);

  target.pathname = source.pathname;
  target.search = source.search;

  return target.toString();
}

export function redirectStatus(method) {
  return method === 'GET' || method === 'HEAD' ? 301 : 308;
}

export function handleRequest(request) {
  return new Response(null, {
    status: redirectStatus(request.method),
    headers: {
      Location: buildRedirectUrl(request.url),
    },
  });
}

export default {
  fetch(request) {
    return handleRequest(request);
  },
};
