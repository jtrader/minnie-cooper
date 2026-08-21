export const VENICE_BASE_URL = "https://api.venice.ai/api/v1";
export const VENICE_DEFAULT_MODEL = "zai-org-glm-5-2";

export type VeniceMessage = { role: "system" | "user" | "assistant"; content: string };

export async function veniceChatCompletion(params: {
  messages: VeniceMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ content: string; model: string }> {
  const apiKey = process.env["VENICE_API_KEY"];
  if (!apiKey) throw new Error("Missing VENICE_API_KEY");

  const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model ?? VENICE_DEFAULT_MODEL,
      messages: params.messages,
      ...(params.temperature === undefined ? {} : { temperature: params.temperature }),
      ...(params.maxTokens === undefined ? {} : { max_tokens: params.maxTokens }),
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Venice API error ${response.status}: ${text.slice(0, 500)}`);
  }

  const data = JSON.parse(text) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    model: data.model ?? (params.model ?? VENICE_DEFAULT_MODEL),
  };
}
