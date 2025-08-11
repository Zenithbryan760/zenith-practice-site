// netlify/functions/jn-create-lead.js
// Creates a JobNimbus contact from your website form.

const allowedOrigin = "*"; // Replace with your domain later for stricter CORS

exports.handler = async (event) => {
  // Handle CORS preflight
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
    const JN_CONTACT_ENDPOINT = process.env.JN_CONTACT_ENDPOINT;

    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
        body: JSON.stringify({ error: "Missing environment variables" })
      };
    }

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
