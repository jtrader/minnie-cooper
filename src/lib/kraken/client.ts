import { BridgeError, type BridgeSettings, type CallToolResult, type McpTool } from "./types";

const trimUrl = (url: string) => url.replace(/\/+$/, "");

async function request(
  settings: BridgeSettings,
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<unknown> {
  const url = `${trimUrl(settings.baseUrl)}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.auth === false ? {} : { Authorization: `Bearer ${settings.token}` }),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new BridgeError(
      "network",
      `Could not reach the bridge at ${url}. The kraken-bridge only listens on localhost (or a Unix socket), so it is reachable only from a browser running on that same machine.`,
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new BridgeError(
      "unauthorized",
      "The bridge rejected your bearer token (401). Re-check the token in Settings.",
      response.status,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new BridgeError(
      "http",
      `Bridge returned HTTP ${response.status}${body ? `: ${body.slice(0, 300)}` : ""}`,
      response.status,
    );
  }

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function checkHealth(settings: BridgeSettings): Promise<string> {
  const data = (await request(settings, "/healthz", { auth: false, method: "GET" })) as {
    status?: string;
  } | null;
  return data?.status ?? "unknown";
}

export async function listTools(settings: BridgeSettings): Promise<McpTool[]> {
  const data = (await request(settings, "/tools", { method: "GET" })) as {
    tools?: McpTool[];
  } | null;
  return Array.isArray(data?.tools) ? data.tools : [];
}

export async function callTool(
  settings: BridgeSettings,
  name: string,
  args?: Record<string, unknown>,
): Promise<CallToolResult> {
  const data = (await request(settings, "/tools/call", {
    method: "POST",
    body: JSON.stringify({ name, arguments: args ?? {} }),
  })) as CallToolResult;
  if (data?.isError) {
    throw new BridgeError("tool", `Tool "${name}" returned an error: ${extractText(data)}`);
  }
  return data;
}

export function extractText(result: CallToolResult): string {
  const parts = (result?.content ?? [])
    .map((c) => (typeof c?.text === "string" ? c.text : ""))
    .filter(Boolean);
  return parts.join("\n");
}

/** Best-effort unwrap of an MCP CallToolResult into plain JSON data. */
export function extractPayload(result: CallToolResult): unknown {
  if (result?.structuredContent !== undefined && result.structuredContent !== null) {
    return result.structuredContent;
  }
  const text = extractText(result);
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}