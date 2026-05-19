import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { handleUrlImport } from "./import-url.tsx";
import { handleOcrImport } from "./import-ocr.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b410369f/health", (c) => {
  return c.json({ status: "ok" });
});

// URL import endpoint
app.post("/make-server-b410369f/import-url", async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    const result = await handleUrlImport(url);

    if (result.error) {
      return c.json({ error: result.error, partial: result.partial }, 400);
    }

    return c.json(result.data);
  } catch (err) {
    console.error("URL import error:", err);
    return c.json({ error: "Failed to import recipe from URL" }, 500);
  }
});

// OCR import endpoint
app.post("/make-server-b410369f/import-ocr", async (c) => {
  try {
    const { storage_path } = await c.req.json();

    if (!storage_path) {
      return c.json({ error: "Storage path is required" }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return c.json({ error: "Server configuration error" }, 500);
    }

    const result = await handleOcrImport(storage_path, supabaseUrl, serviceRoleKey);

    if (result.error) {
      return c.json({ error: result.error, partial: result.partial }, 400);
    }

    return c.json(result.data);
  } catch (err) {
    console.error("OCR import error:", err);
    return c.json({ error: "Failed to process image" }, 500);
  }
});

Deno.serve(app.fetch);