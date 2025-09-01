import { LoaderFunctionArgs } from "@remix-run/node";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { join } from "path";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const assetPath = params["*"];
  
  if (!assetPath) {
    return new Response("Asset not found", { status: 404 });
  }

  try {
    // Pfad zum Build-Verzeichnis
    const buildPath = join(process.cwd(), "build", "client", "assets", assetPath);
    
    // Prüfe, ob die Datei existiert
    const stats = await stat(buildPath);
    
    if (!stats.isFile()) {
      return new Response("Asset not found", { status: 404 });
    }

    // Lese die Datei und sende sie
    const stream = createReadStream(buildPath);
    const response = new Response(stream as any);
    
    // Setze den korrekten Content-Type basierend auf der Dateiendung
    if (assetPath.endsWith('.js')) {
      response.headers.set('Content-Type', 'application/javascript');
    } else if (assetPath.endsWith('.css')) {
      response.headers.set('Content-Type', 'text/css');
    } else if (assetPath.endsWith('.json')) {
      response.headers.set('Content-Type', 'application/json');
    }
    
    // Cache-Header für bessere Performance
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    return response;
  } catch (error) {
    console.error("Error serving asset:", error);
    return new Response("Asset not found", { status: 404 });
  }
}
