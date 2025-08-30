// Server-side Mixpanel tracking via HTTP API
// Docs: https://developer.mixpanel.com/reference/track-event

const MIXPANEL_TOKEN =
  process.env.MIXPANEL_TOKEN || process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

type Props = Record<string, unknown>;

function encodePayload(events: Array<{ event: string; properties: Props }>) {
  const json = JSON.stringify(events);
  return Buffer.from(json).toString("base64");
}

export async function trackServerEvent(
  eventName: string,
  distinctId?: string | number | null,
  properties: Props = {},
) {
  try {
    if (!MIXPANEL_TOKEN) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[mixpanel] Server token missing. Skipping server-side tracking.",
        );
      }
      return { ok: false, reason: "no_token" as const };
    }

    const props: Props = {
      token: MIXPANEL_TOKEN,
      time: Math.floor(Date.now() / 1000),
      distinct_id: distinctId ?? "server:webhook",
      source: "webhook",
      environment: process.env.NODE_ENV,
      ...properties,
    };

    const data = encodePayload([{ event: eventName, properties: props }]);

    const res = await fetch("https://api.mixpanel.com/track?ip=1&verbose=1", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(data)}`,
      // Avoid blocking the response for too long
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[mixpanel] HTTP error", res.status, text);
      return { ok: false, status: res.status } as const;
    }

    const json = (await res.json().catch(() => null)) as
      | { status: number; error?: string }
      | null;
    if (json && json.status !== 1) {
      console.error("[mixpanel] API error", json);
      return { ok: false, api: json } as const;
    }
    return { ok: true } as const;
  } catch (err) {
    console.error("[mixpanel] Track failed", err);
    return { ok: false, reason: "exception" as const };
  }
}
