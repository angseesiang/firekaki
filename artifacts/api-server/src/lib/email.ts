// Replit Resend integration — see blueprint:resend
import { Resend } from "resend";
import { logger } from "./logger";

interface ResendCreds {
  apiKey: string;
  fromEmail: string;
}

async function getResendCredentials(): Promise<ResendCreds> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
      ? "depl " + process.env["WEB_REPL_RENEWAL"]
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Replit connector token not available");
  }

  const res = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    },
  );
  const data = (await res.json()) as {
    items?: Array<{ settings?: { api_key?: string; from_email?: string } }>;
  };
  const item = data.items?.[0];
  if (!item?.settings?.api_key) {
    throw new Error("Resend not connected");
  }
  return {
    apiKey: item.settings.api_key,
    fromEmail:
      process.env["RESEND_FROM_EMAIL"] ??
      item.settings.from_email ??
      "onboarding@resend.dev",
  };
}

export function getPublicBaseUrl(): string {
  const domains = process.env["REPLIT_DOMAINS"]?.split(",")[0]?.trim();
  if (domains) return `https://${domains}`;
  const dev = process.env["REPLIT_DEV_DOMAIN"];
  if (dev) return `https://${dev}`;
  return "http://localhost:5000";
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  role: "volunteer" | "vulnerable";
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const verifyUrl = `${getPublicBaseUrl()}/verify?token=${encodeURIComponent(
    params.token,
  )}&role=${params.role}`;

  try {
    const { apiKey, fromEmail } = await getResendCredentials();
    const client = new Resend(apiKey);
    const result = await client.emails.send({
      from: `Fire Kaki <${fromEmail}>`,
      to: params.to,
      subject: "Confirm your email for Fire Kaki",
      html: renderHtml({ name: params.name, verifyUrl, role: params.role }),
      text: renderText({ name: params.name, verifyUrl, role: params.role }),
    });
    if (result.error) {
      logger.error({ err: result.error }, "resend send failed");
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (err) {
    logger.error({ err }, "verification email failed");
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Email send failed",
    };
  }
}

function renderHtml(p: { name: string; verifyUrl: string; role: string }) {
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#faf6f1;padding:32px;color:#1c1917">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:32px">
  <div style="color:#b4290e;font-weight:700;font-size:20px;margin-bottom:24px">🔥 Fire Kaki</div>
  <h1 style="font-size:24px;margin:0 0 12px;color:#1c1917">Confirm your email, ${escapeHtml(p.name)}</h1>
  <p style="color:#57534e;line-height:1.55;margin:0 0 24px">
    Thanks for signing up to Fire Kaki as <strong>${p.role}</strong>. Please confirm your email address so we know we can reach you when it matters.
  </p>
  <p style="margin:0 0 24px">
    <a href="${p.verifyUrl}" style="display:inline-block;background:#b4290e;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">
      Verify my email
    </a>
  </p>
  <p style="color:#78716c;font-size:13px;line-height:1.5;margin:0 0 8px">
    Or paste this link into your browser:
  </p>
  <p style="color:#57534e;font-size:13px;word-break:break-all;margin:0 0 24px">
    <a href="${p.verifyUrl}" style="color:#b4290e">${p.verifyUrl}</a>
  </p>
  <p style="color:#a8a29e;font-size:12px;margin:0">This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
</div>
</body></html>`;
}

function renderText(p: { name: string; verifyUrl: string; role: string }) {
  return `Hi ${p.name},

Thanks for signing up to Fire Kaki as ${p.role}. Please confirm your email by opening this link:

${p.verifyUrl}

This link expires in 24 hours. If you didn't sign up, you can ignore this email.

— Fire Kaki`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;",
  );
}
