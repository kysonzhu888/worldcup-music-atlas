const MAX_REQUEST_BYTES = 2048;
const MAX_SOURCE_PATH_LENGTH = 160;
const MAX_TARGET_KEY_LENGTH = 80;
const MAX_UTM_SOURCE_LENGTH = 40;
const MAX_UTM_MEDIUM_LENGTH = 40;
const MAX_UTM_CAMPAIGN_LENGTH = 80;
const MAX_UTM_CONTENT_LENGTH = 120;

const EVENT_NAMES = new Set(["campaign_landing_viewed", "conversion_clicked"]);
const DESTINATION_TYPES = new Set(["related_page", "spotify", "youtube"]);
const SOURCE_PATH_PATTERN = /^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]*$/;
const TARGET_KEY_PATTERN = /^[a-z0-9][a-z0-9:_-]*$/;
const UTM_VALUE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

const UPSERT_DAILY_COUNT_SQL = `
  INSERT INTO conversion_daily_counts (
    event_date,
    event_name,
    source_path,
    destination_type,
    target_key,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    event_count,
    updated_at
  )
  VALUES (date('now'), ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
  ON CONFLICT (
    event_date,
    event_name,
    source_path,
    destination_type,
    target_key,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content
  )
  DO UPDATE SET
    event_count = event_count + 1,
    updated_at = datetime('now')
`;

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) {
    return errorResponse("Cross-origin conversion requests are not allowed.", 403);
  }

  if (!isJsonRequest(request)) {
    return errorResponse("Content-Type must be application/json.", 415);
  }

  const requestBody = await readRequestBody(request);
  if (requestBody.status !== "ok") {
    return errorResponse(requestBody.message, requestBody.status);
  }

  const event = validateEvent(requestBody.payload);
  if (!event) {
    return errorResponse("Invalid conversion event.", 400);
  }

  const database = env?.COMMENTS_DB;
  if (!database || typeof database.prepare !== "function") {
    return errorResponse("Conversion tracking is temporarily unavailable.", 503);
  }

  try {
    await database
      .prepare(UPSERT_DAILY_COUNT_SQL)
      .bind(
        event.eventName,
        event.sourcePath,
        event.destinationType,
        event.targetKey,
        event.utmSource,
        event.utmMedium,
        event.utmCampaign,
        event.utmContent
      )
      .run();
  } catch {
    return errorResponse("Conversion tracking is temporarily unavailable.", 503);
  }

  return new Response(null, {
    status: 204,
    headers: responseHeaders(),
  });
}

async function readRequestBody(request) {
  let body;
  try {
    body = await request.text();
  } catch {
    return { status: 400, message: "Invalid JSON body." };
  }

  if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
    return { status: 413, message: "Request body is too large." };
  }

  try {
    const payload = JSON.parse(body);
    if (!isPlainObject(payload)) {
      return { status: 400, message: "Invalid JSON body." };
    }
    return { status: "ok", payload };
  } catch {
    return { status: 400, message: "Invalid JSON body." };
  }
}

function validateEvent(payload) {
  const eventName = requiredValue(payload.eventName);
  const sourcePath = requiredValue(payload.sourcePath);
  const destinationType = optionalValue(payload.destinationType);
  const targetKey = optionalValue(payload.targetKey);
  const utmSource = optionalValue(payload.utmSource);
  const utmMedium = optionalValue(payload.utmMedium);
  const utmCampaign = optionalValue(payload.utmCampaign);
  const utmContent = optionalValue(payload.utmContent);

  if (!EVENT_NAMES.has(eventName)) return null;
  if (!isSourcePath(sourcePath)) return null;
  if (!isOptionalUTMValue(utmSource, MAX_UTM_SOURCE_LENGTH)) return null;
  if (!isOptionalUTMValue(utmMedium, MAX_UTM_MEDIUM_LENGTH)) return null;
  if (!isOptionalUTMValue(utmCampaign, MAX_UTM_CAMPAIGN_LENGTH)) return null;
  if (!isOptionalUTMValue(utmContent, MAX_UTM_CONTENT_LENGTH)) return null;

  if (eventName === "campaign_landing_viewed") {
    if (destinationType || targetKey) return null;
    if (!utmSource || !utmMedium || !utmCampaign) return null;
  } else {
    if (!DESTINATION_TYPES.has(destinationType)) return null;
    if (!isTargetKey(targetKey)) return null;
  }

  return {
    eventName,
    sourcePath,
    destinationType,
    targetKey,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
  };
}

function isSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isJsonRequest(request) {
  const contentType = request.headers.get("Content-Type") || "";
  return contentType.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredValue(value) {
  return typeof value === "string" ? value : "";
}

function optionalValue(value) {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value : "\0";
}

function isSourcePath(value) {
  return (
    value.length > 0 &&
    value.length <= MAX_SOURCE_PATH_LENGTH &&
    SOURCE_PATH_PATTERN.test(value)
  );
}

function isTargetKey(value) {
  return (
    value.length > 0 && value.length <= MAX_TARGET_KEY_LENGTH && TARGET_KEY_PATTERN.test(value)
  );
}

function isOptionalUTMValue(value, maximumLength) {
  return value === "" || (value.length <= maximumLength && UTM_VALUE_PATTERN.test(value));
}

function errorResponse(message, status) {
  return Response.json(
    { error: message },
    {
      status,
      headers: responseHeaders(),
    }
  );
}

function responseHeaders() {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}
