// netlify/functions/jn-create-lead.js
// Uses Node 18+ global fetch on Netlify.

const allowedOrigin = "https://zenithroofingca.com"; // or "*" while testing

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
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
      body: "Method Not Allowed"
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    const JN_API_KEY = process.env.JN_API_KEY;
    const JN_CONTACT_ENDPOINT = process.env.JN_CONTACT_ENDPOINT;
    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
        body: JSON.stringify({ error: "Server not configured (missing env vars)" })
      };
    }

    const first = (data.first_name || "").trim();
    const last  = (data.last_name  || "").trim();
    const email = (data.email      || "").trim();
    const phone = (data.phone      || "").trim();

    const payload = {
      // JobNimbus needed this
      display_name: [first, last].filter(Boolean).join(" ").trim() || email || phone || "Website Lead",

      // keep snake_case for consistency
      first_name: first,
      last_name:  last,
      email,
      phone,

      address: `${data.street_address || ""}, ${data.city || ""}, ${data.state || ""} ${data.zip || ""}`.trim(),
      description: data.description || "",

      service_type:    data.service_type    || "",
      referral_source: data.referral_source || "",

      _source:  "website-zenithroofingca",
      _version: "jn-create-lead-2025-08-11"
    };

    const res = await fetch(JN_CONTACT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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
