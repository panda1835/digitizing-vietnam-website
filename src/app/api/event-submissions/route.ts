import { NextResponse } from "next/server";
import { Resend } from "resend";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// Best-effort per-instance limit; use a shared store for strict limits.
const recentHits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  for (const [key, times] of recentHits) {
    if (times.every((t) => now - t >= WINDOW_MS)) recentHits.delete(key);
  }
  const hits = (recentHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  recentHits.set(ip, [...hits, now]);

  if (Number(request.headers.get("content-length") ?? 0) > 10_000) {
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  // Hidden field that only bots fill in; pretend success and alert.
  if (typeof body?.speaker_list === "string" && body.speaker_list) {
    if (process.env.RESEND_API_KEY && process.env.BOT_DETECTION_EMAIL) {
      const preview = (key: string) =>
        escapeHtml(String(body?.[key] ?? "").slice(0, 300));
      await new Resend(process.env.RESEND_API_KEY).emails
        .send({
          from: "Digitizing Vietnam Events <event@digitizingvietnam.com>",
          to: process.env.BOT_DETECTION_EMAIL,
          subject: "Bot detected on event submission form",
          html: `<p>The hidden honeypot field was filled in.</p>
<p><strong>IP:</strong> ${escapeHtml(ip)}</p>
<p><strong>Honeypot value:</strong> ${preview("speaker_list")}</p>
<p><strong>Name:</strong> ${preview("name")}</p>
<p><strong>Email:</strong> ${preview("email")}</p>
<p><strong>Event name:</strong> ${preview("eventName")}</p>`,
        })
        .catch((err) => console.error("Bot alert failed:", err));
    }
    return NextResponse.json({ ok: true });
  }
  const field = (key: string, max: number) =>
    typeof body?.[key] === "string" ? body[key].trim().slice(0, max) : "";
  const email = field("email", 200);
  const name = field("name", 200);
  const eventName = field("eventName", 300);
  const description = field("description", 2000);
  const url = field("url", 500);

  if (
    !email ||
    !name ||
    !eventName ||
    !description ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !isHttpUrl(url)
  ) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.INFO_EMAIL) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Digitizing Vietnam Events <event@digitizingvietnam.com>",
    to: process.env.INFO_EMAIL,
    replyTo: email,
    subject: `New event submission: ${eventName.replace(/[\r\n]+/g, " ")}`,
    html: `<div style="background:#f5f5f5;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#111;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:8px;">
    <tr><td style="padding:28px 28px 0;text-align:center;">
      <img src="https://www.digitizingvietnam.com/logo-final.svg" alt="Digitizing Vietnam" width="180" style="max-width:100%;height:auto;">
    </td></tr>
    <tr><td style="padding:24px 28px 8px;">
      <h2 style="margin:0;font-size:20px;">A user is submitting a new event</h2>
    </td></tr>
    <tr><td style="padding:8px 28px 28px;">
      <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;line-height:1.5;">
        ${[
          ["Event name", escapeHtml(eventName)],
          ["Description", escapeHtml(description).replace(/\n/g, "<br>")],
          [
            "Information URL",
            `<a href="${escapeHtml(url)}" style="color:#111;">${escapeHtml(
              url
            )}</a>`,
          ],
          ["Submitted by", escapeHtml(name)],
          [
            "Email",
            `<a href="mailto:${escapeHtml(
              email
            )}" style="color:#111;">${escapeHtml(email)}</a>`,
          ],
        ]
          .map(
            ([label, value]) =>
              `<tr><td style="padding:12px 0;border-top:1px solid #e5e5e5;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#777;">${label}</div>${value}</td></tr>`
          )
          .join("")}
      </table>
    </td></tr>
  </table>
</div>`,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
