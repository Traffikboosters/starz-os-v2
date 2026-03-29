import { withCors, json } from "../_shared/http.ts";
import { log } from "../_shared/logger.ts";

Deno.serve(
  withCors(async (req: Request) => {
    const url = new URL(req.url);
    const path = url.searchParams.get("path");

    log("CORE ENGINE HIT", { path });

    if (path === "core/health") {
      return json({
        success: true,
        message: "Core automation engine is alive",
      });
    }

    return new Response("Not Found", { status: 404 });
  })
);