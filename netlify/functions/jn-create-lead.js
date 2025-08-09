// netlify/functions/jn-create-lead.js

// --- CORS (so you can call this from any domain) ---
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

exports.handler = async (event) => {
  // Preflight for browsers
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  try {
    if (event.httpMethod !== "POST") {
      return respond(405, { error: "Method not allowed" });
    }

    const apiKey  = process.env.JN_API_KEY;
    const baseUrl = (process.env.JN_BASE_URL || "https://app.jobnimbus.com/api1/").replace(/\/+$/, "") + "/";
    const leadSource = process.env.JN_LEAD_SOURCE || "Website Free Estimate";
    if (!apiKey) return respond(500, { error: "Missing JN_API_KEY env var" });

    let data = {};
    try { data = JSON.parse(event.body || "{}"); }
    catch { return respond(400, { error: "Invalid JSON body" }); }

    // Allow hyphenated fallbacks
    data.firstName = data.firstName || data["first-name"] || "";
    data.lastName  = data.lastName  || data["last-name"]  || "";
    data.street    = data.street    || data["street"]     || "";
    data.zip       = data.zip       || data["zip"]        || "";

    const required = ["firstName", "lastName", "phone", "email"];
    const missing = required.filter(k => !String(data[k] || "").trim());
    if (missing.length) return respond(400, { error: `Missing: ${missing.join(", ")}` });

    const payload = {
      type: "person",
      first_name: data.firstName,
      last_name:  data.lastName,
      phones: data.phone ? [{ number: String(data.phone) }] : [],
      emails: data.email ? [{ email: String(data.email) }] : [],
      addresses: [{ street1: data.street || "", city: data.city || "", postal_code: data.zip || "" }],
      source: leadSource,
      description: [
        data.service ? `Service: ${data.service}` : "",
        data.date ? `Preferred Date: ${data.date}` : "",
        data.referral ? `Referral: ${data.referral}` : "",
        data.details ? `Details: ${data.details}` : "",
        data.page ? `Page: ${data.page}` : "",
      ].filter(Boolean).join("\n")
    };

    const upstream = await fetch(baseUrl + "contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return respond(502, { error: "JobNimbus error", status: upstream.status, body: text.slice(0, 1000) });
    }

    let contact; try { contact = JSON.parse(text); } catch { contact = { raw: text.slice(0, 1000) }; }
    return respond(200, { ok: true, contact });
  } catch (err) {
    return respond(500, { error: err?.message || "Server error" });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS_HEADERS
    },
    body: JSON.stringify(body)
  };
}
