// netlify/functions/jn-create-lead.js
const allowedOrigin = "*";

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const qs = event.queryStringParameters || {};

    const JN_API_KEY = process.env.JN_API_KEY;
    const JN_CONTACT_ENDPOINT = process.env.JN_CONTACT_ENDPOINT; // https://app.jobnimbus.com/api1/contacts
    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
        body: JSON.stringify({ error: "Missing environment variables on server" })
      };
    }

    const first = (data.first_name || "").trim();
    const last  = (data.last_name  || "").trim();
    const email = (data.email      || "").trim();
    const phone = (data.phone      || "").trim();

    // Build the payload for JobNimbus
    const payload = {
      // Include both snake_case and camelCase to satisfy different parsers
      display_name: [first, last].filter(Boolean).join(" ").trim() || email || phone || "Website Lead",
      displayName:  [first, last].filter(Boolean).join(" ").trim() || email || phone || "Website Lead",

      firstName: first,
      lastName:  last,
      email,
      phone,
      address: `${data.street_address || ""}, ${data.city || ""}, ${data.state || ""} ${data.zip || ""}`.trim(),
      description: data.description || "",
      customFields: {
        serviceType:    data.service_type    || "",
        referralSource: data.referral_source || ""
      },

      // tiny marker so we can confirm we’re on the newest deploy
      _version: "jn-create-lead:2025-08-11-1"
    };

    // 🔎 Debug mode: return the payload instead of calling JobNimbus
    if (qs.debug === "1") {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
        body: JSON.stringify(payload, null, 2)
      };
    }

    const res = await fetch(JN_CONTACT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${JN_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
      body
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
      body: JSON.stringify({ error: err.message })
    };
  }
};
