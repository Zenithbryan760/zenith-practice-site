// …above code unchanged…

const first = (data.first_name || "").trim();
const last  = (data.last_name  || "").trim();
const email = (data.email      || "").trim();
const phone = (data.phone      || "").trim();

const payload = {
  // match JobNimbus error naming exactly
  display_name: [first, last].filter(Boolean).join(" ").trim() || email || phone || "Website Lead",

  // use snake_case across the board
  first_name: first,
  last_name:  last,
  email,
  phone,

  // keep address simple for now; we can split if they require separate fields
  address: `${data.street_address || ""}, ${data.city || ""}, ${data.state || ""} ${data.zip || ""}`.trim(),
  description: data.description || "",

  // include custom fields at top-level with snake_case names
  service_type:    data.service_type    || "",
  referral_source: data.referral_source || "",

  _version: "jn-create-lead:snake-2025-08-11"
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
