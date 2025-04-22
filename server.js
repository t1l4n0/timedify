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

// Start OAuth process
app.get("/", (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).send("Missing ?shop parameter");

  const authUrl = buildAuthUrl(shop, SHOPIFY_API_KEY, SCOPES, REDIRECT_URI);
  res.redirect(authUrl);
});

// OAuth callback handler
app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;

  try {
    const accessToken = await getAccessToken(shop, code, SHOPIFY_API_KEY, SHOPIFY_API_SECRET);
    const theme = await getActiveTheme(shop, accessToken);

    if (!theme) {
      return res.status(404).send("Could not find the main theme.");
    }

    // Build admin.shopify.com-style redirect URL
    const storeName = shop.replace(".myshopify.com", "");
    const redirectUrl = `https://admin.shopify.com/store/${storeName}/themes/${theme.id}/editor?context=apps&activateAppId=${APP_EXTENSION_ID}`;

    // Debug output
    console.log("🔎 Shop:", shop);
    console.log("🎨 Active Theme ID:", theme.id);
    console.log("➡️ Redirecting to:", redirectUrl);

    // Send link for manual testing, and auto-redirect
    res.send(`
      <h2>Redirecting you to your Theme Editor...</h2>
      <p>If you're not redirected automatically, <a href="${redirectUrl}" target="_blank">click here</a>.</p>
      <script>window.location.href = "${redirectUrl}"</script>
    `);
  } catch (error) {
    console.error("❌ Error during OAuth callback:", error.response?.data || error.message);
    res.status(500).send("There was a problem during authentication.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Shopify app is running at http://localhost:${PORT}`);
});
