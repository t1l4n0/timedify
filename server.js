import express from "express";
import dotenv from "dotenv";
import { buildAuthUrl, getAccessToken, getActiveTheme } from "./utils/shopify.js";

dotenv.config();
const app = express();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  APP_EXTENSION_ID,
  SCOPES,
  REDIRECT_URI,
} = process.env;

app.get("/", (req, res) => {
  const { shop } = req.query;

  if (!shop) return res.status(400).send("Missing ?shop parameter");

  const authUrl = buildAuthUrl(shop, SHOPIFY_API_KEY, SCOPES, REDIRECT_URI);
  res.redirect(authUrl);
});

app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;

  try {
    const accessToken = await getAccessToken(shop, code, SHOPIFY_API_KEY, SHOPIFY_API_SECRET);
    const theme = await getActiveTheme(shop, accessToken);

    const redirectUrl = `https://${shop}/admin/themes/${theme.id}/editor?context=apps&activateAppId=${APP_EXTENSION_ID}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send("Fehler bei der Authentifizierung oder Theme-Ermittlung.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shopify App läuft auf http://localhost:${PORT}`);
});
