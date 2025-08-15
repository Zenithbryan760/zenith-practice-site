// netlify/functions/jn-create-lead.js
const allowedOrigin = "https://zenithroofingca.com";

// Enhanced phone normalization with debugging
const normalizePhone = (raw = "") => {
  const digits = (String(raw).match(/\d/g) || []).join("");
  const normalized = digits.replace(/^1(?=\d{10}$)/, "");
  console.log(`Phone normalization: raw="${raw}" → digits="${digits}" → normalized="${normalized}"`);
  return normalized;
};

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
    console.log("Incoming form data:", JSON.stringify(data, null, 2));

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
    const last = (data.last_name || "").trim();
    const email = (data.email || "").trim();

    // Comprehensive phone field handling
    const rawPhone = data.phone_number || data.phone || data.phoneNumber || "";
    const phone = normalizePhone(rawPhone);
    console.log(`Final phone: "${phone}" (from raw: "${rawPhone}")`);

    // Validate phone number
    if (!phone) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
        body: JSON.stringify({ error: "Phone number is required" })
      };
    }
    if (phone.length !== 10) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": allowedOrigin },
        body: JSON.stringify({ 
          error: "Invalid phone number format",
          details: `Expected 10 digits, got ${phone.length} (${phone})`
        })
      };
    }

    // Format phone for display (optional)
    const formattedPhone = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;

    // Build description
    const descLines = [];
    if ((data.service_type || "").trim()) {
      descLines.push(`Service Type: ${data.service_type.trim()}`);
    }
    if ((data.description || "").trim()) {
      descLines.push(`Details: ${data.description.trim()}`);
    }
    if ((data.referral_source || "").trim()) {
      descLines.push(`Heard About Us: ${data.referral_source.trim()}`);
    }
    const combinedDescription = descLines.join("\n");

    // JobNimbus payload with explicit phone fields
    const payload = {
      display_name: [first, last].filter(Boolean).join(" ").trim() || email || formattedPhone || "Website Lead",
      first_name: first,
      last_name: last,
      email: email,
      phone: phone, // numeric version
      phone_formatted: formattedPhone, // human-readable version
      address: `${data.street_address || ""}, ${data.city || ""}, ${data.state || ""} ${data.zip || ""}`.trim(),
      description: combinedDescription,
      service_type: data.service_type || "",
      referral_source: data.referral_source || "",
      _source: "website-zenithroofingca",
      _version: "jn-create-lead-2025-08-16"
    };

    console.log("JobNimbus payload:", JSON.stringify(payload, null, 2));

    // Create contact in JobNimbus
    const res = await fetch(JN_CONTACT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${JN_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const jnResponse = await res.text();
    console.log("JobNimbus response:", jnResponse);

    // ... rest of your SendGrid code remains exactly the same ...
    let mailStatus = "skipped";
    try {
      const SG_KEY = process.env.SENDGRID_API_KEY;
      const TO = process.env.LEAD_NOTIFY_TO;
      const FROM = process.env.LEAD_NOTIFY_FROM;

      if (SG_KEY && TO && FROM) {
        const subject = `New Website Lead: ${[first, last].filter(Boolean).join(" ") || formattedPhone || email}`;

        const html = `
          <h2>New Website Lead</h2>
          <table cellspacing="0" cellpadding="6" style="font-family:Arial,Helvetica,sans-serif;font-size:14px">
            <tr><td><b>Name</b></td><td>${first} ${last}</td></tr>
            <tr><td><b>Email</b></td><td>${email}</td></tr>
            <tr><td><b>Phone</b></td><td>${formattedPhone}</td></tr>
            <tr><td><b>Address</b></td><td>${data.street_address}, ${data.city}, ${data.state} ${data.zip}</td></tr>
            <tr><td><b>Description</b></td><td>${(combinedDescription || "").replace(/\n/g,"<br>")}</td></tr>
          </table>
        `;
        const text = `New website lead
Name: ${first} ${last}
Email: ${email}
Phone: ${formattedPhone}
Address: ${data.street_address}, ${data.city}, ${data.state} ${data.zip}

${combinedDescription || ""}`;

        const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SG_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: TO }], subject }],
            from: { email: FROM, name: "Zenith Roofing Website" },
            reply_to: email ? { email } : undefined,
            content: [
              { type: "text/plain", value: text },
              { type: "text/html", value: html }
            ]
          })
        });
        mailStatus = `${sgRes.status}`;
      }
    } catch (e) {
      console.error("SendGrid error:", e);
      mailStatus = "error";
    }

    let responseBody = jnResponse;
    try {
      const jnJson = JSON.parse(jnResponse);
      jnJson._mailStatus = mailStatus;
      responseBody = JSON.stringify(jnJson);
    } catch (_) { }

    return {
      statusCode: res.status,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
      body: responseBody
    };
  } catch (err) {
    console.error("Handler error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": allowedOrigin },
      body: JSON.stringify({ 
        error: "Internal server error",
        details: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
      })
    };
  }
};
