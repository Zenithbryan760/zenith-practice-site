// netlify/functions/test-env.js
exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      JN_API_KEY: process.env.JN_API_KEY ? "✅ Present" : "❌ Missing",
      JN_CONTACT_ENDPOINT: process.env.JN_CONTACT_ENDPOINT || "❌ Missing"
    })
  };
};
