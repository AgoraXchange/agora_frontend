import { NextResponse } from "next/server";

type EventType = "debate_created" | "comment_created";

interface BasePayload {
  type: EventType;
}

interface DebateCreatedPayload extends BasePayload {
  type: "debate_created";
  topic: string;
  creator?: string | null;
  url?: string | null;
}

interface CommentCreatedPayload extends BasePayload {
  type: "comment_created";
  contractId: number;
  topic?: string | null;
  commenter?: string | null;
  content?: string | null;
  url?: string | null;
}

type TelegramPayload = DebateCreatedPayload | CommentCreatedPayload;

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      ok: false,
      error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      status: 500,
    } as const;
  }

  // Telegram Bot API endpoint
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, status: res.status, body } as const;
    }

    const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    if (!json?.ok) return { ok: false, status: 502 } as const;
    return { ok: true } as const;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) } as const;
  }
}

function truncate(input: string | null | undefined, max = 280) {
  if (!input) return "";
  return input.length > max ? `${input.slice(0, max)}…` : input;
}

function buildMessage(payload: TelegramPayload) {
  const appUrl = process.env.NEXT_PUBLIC_URL || "";

  if (payload.type === "debate_created") {
    const lines = [
      "🔥 New Debate Created",
      `Title: ${truncate(payload.topic, 140)}`,
      payload.creator ? `Creator: ${payload.creator}` : undefined,
      payload.url || appUrl ? `Open: ${payload.url || appUrl}` : undefined,
    ].filter(Boolean);
    return lines.join("\n");
  }

  if (payload.type === "comment_created") {
    const deepLink = payload.url || (appUrl ? `${appUrl}/agreement/${payload.contractId}` : "");
    const lines = [
      "💬 New Comment",
      `Debate #${payload.contractId}${payload.topic ? ` — ${truncate(payload.topic, 120)}` : ""}`,
      payload.commenter ? `By: ${payload.commenter}` : undefined,
      payload.content ? `Comment: ${truncate(payload.content, 280)}` : undefined,
      deepLink ? `Open: ${deepLink}` : undefined,
    ].filter(Boolean);
    return lines.join("\n");
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<TelegramPayload> | null;
    if (!body || !body.type) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const text = buildMessage(body as TelegramPayload);
    if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });

    const result = await sendTelegramMessage(text);
    if (!result.ok) {
      return NextResponse.json({ error: result }, { status: result.status || 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

