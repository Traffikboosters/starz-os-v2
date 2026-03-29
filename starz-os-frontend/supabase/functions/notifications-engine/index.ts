// supabase/functions/notifications-engine/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { json, withCors } from "../_shared/http.ts";
import { log } from "../_shared/logger.ts";

const WEBHOOK_URL = Deno.env.get("ADMIN_ALERT_WEBHOOK");

serve(
  withCors(async (req: Request) => {
    try {
      const url = new URL(req.url);
      const path = url.searchParams.get("path");

      log("notifications-engine hit", { path });

      // ===============================
      // HEALTH CHECK
      // ===============================
      if (path === "notifications/health") {
        return json({
          ok: true,
          service: "notifications-engine",
        });
      }

      // ===============================
      // ADMIN ALERT
      // ===============================
      if (path === "notifications/admin-alert") {
        let body: any = {};

        try {
          body = await req.json();
        } catch {
          body = {};
        }

        const payload = {
          env: body.env || "prod",
          module: body.module || "unknown",
          severity: body.severity || "info",
          code: body.code || "N/A",
          message: body.message || "No message provided",
          context: body.context || {},
          timestamp: new Date().toISOString(),
        };

        log("ADMIN ALERT", payload);

        if (WEBHOOK_URL) {
          fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }).catch((err) => {
            log("Webhook failed", { error: err.message });
          });
        }

        return json({
          success: true,
          message: "Admin alert received",
          payload,
        });
      }

      // ===============================
      // DEFAULT
      // ===============================
      return new Response("Not Found", { status: 404 });

    } catch (err: any) {
      log("notifications-engine error", { error: err.message });

      return json(
        {
          success: false,
          error: err.message,
        },
        { status: 500 }
      );
    }
  })
);