import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const VeniceChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(8192).optional(),
});

export const veniceChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => VeniceChatInput.parse(input))
  .handler(async ({ data }) => {
    const { veniceChatCompletion } = await import("./venice.server");
    return veniceChatCompletion(data);
  });
