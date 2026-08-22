import { createFileRoute } from "@tanstack/react-router";
import { veniceChatCompletion, VENICE_DEFAULT_MODEL } from "@/lib/venice/venice.server";

export const Route = createFileRoute("/api/public/venice-test")({
  server: {
    handlers: {
      GET: async () => {
        if (!process.env["VENICE_API_KEY"]) {
          return Response.json(
            { ok: false, error: "VENICE_API_KEY is not configured" },
            { status: 503 },
          );
        }
        try {
          const result = await veniceChatCompletion({
            model: VENICE_DEFAULT_MODEL,
            messages: [{ role: "user", content: "Reply with exactly: venice ok" }],
            maxTokens: 32,
          });
          return Response.json({ ok: true, model: result.model, content: result.content });
        } catch (error) {
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 502 },
          );
        }
      },
    },
  },
});
