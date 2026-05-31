/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Receives the contact form submission and emails it to you via Resend.
 *
 * Required environment variables (set in the Cloudflare Pages dashboard:
 *   Settings -> Environment variables, or via `wrangler pages secret put`):
 *
 *   RESEND_API_KEY   Your Resend API key (starts with "re_").
 *   CONTACT_TO       Where submissions are delivered, e.g. hello@velorithmsystems.com
 *   CONTACT_FROM     A verified Resend sender, e.g. "Velorithm Website <noreply@velorithmsystems.com>"
 *                    (the domain must be verified in your Resend account)
 *
 * Notes:
 *  - This endpoint only handles POST. Other methods get 405.
 *  - A hidden "website" honeypot field is used for basic spam filtering.
 *  - No secrets are ever exposed to the browser; the API key stays server-side.
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function onRequestPost({ request, env }) {
  // ---- Parse body (accept JSON or form-encoded) ----
  let data = {};
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  // ---- Honeypot: silently accept bot submissions without sending ----
  if (data.website && String(data.website).trim() !== "") {
    return json({ ok: true });
  }

  // ---- Validate ----
  const name = (data.name || "").toString().trim();
  const email = (data.email || "").toString().trim();
  const company = (data.company || "").toString().trim();
  const service = (data.service || "").toString().trim();
  const message = (data.message || "").toString().trim();

  if (!name || !email || !message) {
    return json({ error: "Please provide your name, email, and a message." }, 422);
  }
  if (!isEmail(email)) {
    return json({ error: "Please provide a valid email address." }, 422);
  }
  if (message.length > 5000) {
    return json({ error: "Message is too long." }, 422);
  }

  // ---- Config check ----
  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return json(
      { error: "The contact form is not fully configured yet. Please email us directly." },
      500
    );
  }

  // ---- Build email ----
  const subject = `New enquiry — ${name}${company ? " (" + company + ")" : ""}`;
  const html = `
    <h2 style="font-family:sans-serif;margin:0 0 12px">New website enquiry</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#666"><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666"><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666"><strong>Company</strong></td><td>${escapeHtml(company) || "—"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666"><strong>Service</strong></td><td>${escapeHtml(service) || "—"}</td></tr>
    </table>
    <p style="font-family:sans-serif;font-size:14px;margin:16px 0 4px;color:#666"><strong>Message</strong></p>
    <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;line-height:1.6">${escapeHtml(message)}</p>
  `;
  const text =
    `New website enquiry\n\n` +
    `Name: ${name}\nEmail: ${email}\nCompany: ${company || "—"}\nService: ${service || "—"}\n\nMessage:\n${message}\n`;

  // ---- Send via Resend ----
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("Resend error:", resp.status, detail);
      return json({ error: "We couldn't send your message right now. Please try again shortly." }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Contact handler error:", err);
    return json({ error: "Unexpected error sending your message." }, 500);
  }
}

// Cloudflare Pages automatically returns 405 for any method without a
// matching handler, so only POST is defined here.
