import { createFileRoute } from "@tanstack/react-router";
import { veniceChatCompletion } from "@/lib/venice/venice.server";

export const Route = createFileRoute("/api/public/venice-test")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const result = await veniceChatCompletion({
            messages: [{ role: "user", content: "Reply with exactly: venice ok" }],
            maxTokens: 32,
          });
          return Response.json({ ok: true, ...result });
        } catch (error) {
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : String(error) },
            { status: 500 },
          );
        }
      },
    },
  },
});
