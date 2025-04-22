import crypto from "crypto";
import querystring from "querystring";
import axios from "axios";

export function buildAuthUrl(shop, apiKey, scopes, redirectUri) {
  const params = {
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state: crypto.randomBytes(16).toString("hex"),
    grant_options: ["per-user"],
    response_type: "code"
  };

  return `https://${shop}/admin/oauth/authorize?${querystring.stringify(params)}`;
}

export async function getAccessToken(shop, code, apiKey, apiSecret) {
  const url = `https://${shop}/admin/oauth/access_token`;
  const response = await axios.post(url, {
    client_id: apiKey,
    client_secret: apiSecret,
    code,
  });

  return response.data.access_token;
}

export async function getActiveTheme(shop, accessToken, apiVersion = "2024-04") {
  const res = await axios.get(`https://${shop}/admin/api/${apiVersion}/themes.json`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json"
    }
  });

  return res.data.themes.find(t => t.role === "main");
}
