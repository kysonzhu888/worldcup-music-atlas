const CONVERSION_ENDPOINT = "/api/conversions";
const SAFE_VALUE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const CAMPAIGN_FIELDS = [
  ["utm_source", "utmSource", 40],
  ["utm_medium", "utmMedium", 40],
  ["utm_campaign", "utmCampaign", 80],
  ["utm_content", "utmContent", 120],
];

export function parseCampaign(search) {
  const params = new URLSearchParams(search || "");
  const campaign = {};

  for (const [queryKey, payloadKey, maxLength] of CAMPAIGN_FIELDS) {
    const rawValue = params.get(queryKey);
    if (!rawValue) {
      if (queryKey === "utm_content") {
        campaign[payloadKey] = "";
        continue;
      }
      return null;
    }

    const value = rawValue.trim();
    if (value.length > maxLength || !SAFE_VALUE_PATTERN.test(value)) return null;
    campaign[payloadKey] = value;
  }

  return campaign;
}

export function appendCampaignToHref(href, pageUrl, campaign) {
  if (!campaign) return href;

  const base = new URL(pageUrl);
  const destination = new URL(href, base);
  if (destination.origin !== base.origin) return href;

  destination.search = "";
  for (const [queryKey, payloadKey] of CAMPAIGN_FIELDS) {
    const value = campaign[payloadKey];
    if (value) destination.searchParams.set(queryKey, value);
  }
  return destination.toString();
}

export function classifyConversionLink(link, pageUrl) {
  if (!link?.href) return null;

  let destination;
  let page;
  try {
    page = new URL(pageUrl);
    destination = new URL(link.href, page);
  } catch {
    return null;
  }

  if (link.conversion === "related_page") {
    const targetKey = normalizeKey(link.targetKey, 80);
    if (destination.origin !== page.origin || !targetKey) return null;
    return { destinationType: "related_page", targetKey };
  }

  const hostname = destination.hostname.toLowerCase();
  if (["open.spotify.com", "www.spotify.com", "spotify.com"].includes(hostname)) {
    return {
      destinationType: "spotify",
      targetKey: platformTarget(destination.pathname, "spotify"),
    };
  }

  if (
    ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"].includes(
      hostname
    )
  ) {
    return {
      destinationType: "youtube",
      targetKey: platformTarget(destination.pathname, "youtube"),
    };
  }

  return null;
}

export function buildConversionPayload({ eventName, sourcePath, target, campaign }) {
  return {
    eventName,
    sourcePath: normalizeSourcePath(sourcePath),
    destinationType: target?.destinationType || "",
    targetKey: target?.targetKey || "",
    utmSource: campaign?.utmSource || "",
    utmMedium: campaign?.utmMedium || "",
    utmCampaign: campaign?.utmCampaign || "",
    utmContent: campaign?.utmContent || "",
  };
}

export function initConversionTracking({ windowRef = window, documentRef = document } = {}) {
  const pageUrl = new URL(windowRef.location.href);
  const campaign = parseCampaign(pageUrl.search);

  if (campaign) {
    transmit(
      buildConversionPayload({
        eventName: "campaign_landing_viewed",
        sourcePath: pageUrl.pathname,
        campaign,
      }),
      windowRef
    );
  }

  documentRef.addEventListener("click", (event) => {
    const anchor = event.target?.closest?.("a[href]");
    if (!anchor) return;

    const link = {
      href: anchor.getAttribute("href"),
      conversion: anchor.dataset.conversion,
      targetKey: anchor.dataset.targetKey,
    };
    const target = classifyConversionLink(link, pageUrl.href);
    if (!target) return;

    if (target.destinationType === "related_page" && campaign) {
      anchor.href = appendCampaignToHref(link.href, pageUrl.href, campaign);
    }

    transmit(
      buildConversionPayload({
        eventName: "conversion_clicked",
        sourcePath: pageUrl.pathname,
        target,
        campaign,
      }),
      windowRef
    );
  });
}

function transmit(payload, windowRef) {
  const body = JSON.stringify(payload);
  try {
    const blob = new windowRef.Blob([body], { type: "application/json" });
    if (windowRef.navigator?.sendBeacon?.(CONVERSION_ENDPOINT, blob)) return;
  } catch {
    // Keep navigation independent from measurement failures.
  }

  windowRef
    .fetch(CONVERSION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    })
    .catch(() => {});
}

function normalizeSourcePath(value) {
  const path = String(value || "").split(/[?#]/, 1)[0];
  if (!path.startsWith("/") || path.length > 160) return "/";
  return path;
}

function normalizeKey(value, maxLength) {
  const key = String(value || "").trim();
  if (!key || key.length > maxLength || !SAFE_VALUE_PATTERN.test(key)) return "";
  return key;
}

function platformTarget(pathname, platform) {
  if (/\/playlist(?:\/|$)/.test(pathname)) return "playlist";
  if (platform === "spotify" && /\/search(?:\/|$)/.test(pathname)) return "search";
  if (platform === "spotify" && /\/track(?:\/|$)/.test(pathname)) return "track";
  if (platform === "youtube") return "video";
  return "platform_link";
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initConversionTracking();
}
