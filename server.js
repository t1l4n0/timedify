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

    const redirectUrl = `https://${shop}/admin/themes/${theme.id}/editor?context=apps&activateAppId=${APP_EXTENSION_ID}`;

    // Log the final redirect URL for debugging
    console.log("🔁 Redirecting user to Theme Editor:");
    console.log(redirectUrl);

    // Optional: Render a clickable link for manual testing
    res.send(`
      <h2>Redirect URL ready</h2>
      <p>If you're not automatically redirected, click the link below:</p>
      <a href="${redirectUrl}" target="_blank">${redirectUrl}</a>
      <script>window.location.href = "${redirectUrl}"</script>
    `);
  } catch (error) {
    console.error("❌ Error during OAuth redirect:", error.response?.data || error.message);
    res.status(500).send("There was a problem completing the authentication process.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Shopify app is running at http://localhost:${PORT}`);
});
