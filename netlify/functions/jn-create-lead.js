// netlify/functions/jn-create-lead.js
// Uses Node 18+ global fetch on Netlify; no extra packages needed.

const allowedOrigin = "*"; // Later, replace with your domain for stricter CORS.

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

    // Set these in Netlify → Site settings → Environment variables
    const JN_API_KEY = process.env.JN_API_KEY; // Your JobNimbus API key
    const JN_CONTACT_ENDPOINT = process.env.JN_CONTACT_ENDPOINT; 
    // Example: https://<YOUR_JOBNIMBUS_DOMAIN>/api1/contacts
    // Use the exact Create Contact endpoint from JobNimbus docs

    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
        body: JSON.stringify({ error: "Server not configured (missing env vars)" })
      };
    }

    // Map your form fields → JobNimbus payload
    // Adjust keys to match your JobNimbus account’s fields as needed.
    const payload = {
      firstName: data.first_name || "",
      lastName:  data.last_name  || "",
      email:     data.email      || "",
      phone:     data.phone      || "",
      address:   `${data.street_address || ""}, ${data.city || ""}, ${data.state || ""} ${data.zip || ""}`.trim(),
      description: data.description || "",
      customFields: {
        serviceType:    data.service_type    || "",
        referralSource: data.referral_source || ""
      }
    };

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

