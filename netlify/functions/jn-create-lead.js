// netlify/functions/jn-create-lead.js
// Creates a JobNimbus contact from your website form.
// Reads secrets from Netlify env vars: JN_API_KEY, JN_CONTACT_ENDPOINT

const allowedOrigin = "*"; // (optional) replace with your domain later for stricter CORS

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

    const JN_API_KEY = process.env.JN_API_KEY;
    const JN_CONTACT_ENDPOINT = process.env.JN_CONTACT_ENDPOINT; // e.g. https://app.jobnimbus.com/api1/contacts
    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
        body: JSON.stringify({ error: "Missing environment variables on server" })
      };
    }

    // Normalize inputs
    const first = (data.first_name || "").trim();
    const last  = (data.last_name  || "").trim();
    const email = (data.email      || "").trim();
    const phone = (data.phone      || "").trim();

    // Build payload expected by JobNimbus API
    const payload = {
      // ✅ Required by API (they don't auto-generate on API calls)
      display_name: [first, last].filter(Boolean).join(" ").trim() || email || phone || "Website Lead",

      // Common fields (these names are accepted by JN)
      firstName: first,
      lastName:  last,
      email,
      phone,
      address: `${data.street_address || ""}, ${data.city || ""}, ${data.state || ""} ${data.zip || ""}`.trim(),
      description: data.description || "",

      // Example custom fields bucket (adjust keys if your JN account uses different custom field names)
      customFields: {
        serviceType:    data.service_type    || "",
        referralSource: data.referral_source || ""
      }
    };

    // Send to JobNimbus
    const res = await fetch(JN_CONTACT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${JN_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const body = await res.text(); // keep raw for easier debugging
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
