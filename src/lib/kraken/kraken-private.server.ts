import { createHash, createHmac } from "node:crypto";

const KRAKEN_API = "https://api.kraken.com";

let lastNonce = 0;
function nextNonce(): string {
  const now = Date.now() * 1000;
  lastNonce = now > lastNonce ? now : lastNonce + 1;
  return String(lastNonce);
}

function sign(path: string, body: string, nonce: string, privateKey: string): string {
  const hash = createHash("sha256").update(nonce + body).digest();
  const message = Buffer.concat([Buffer.from(path, "utf8"), hash]);
  return createHmac("sha512", Buffer.from(privateKey, "base64")).update(message).digest("base64");
}

/** Calls a private Kraken endpoint server-side. Secrets never leave this module. */
export async function callKrakenPrivate(
  endpoint: string,
  apiKey: string,
  privateKey: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const path = `/0/private/${endpoint}`;
  const nonce = nextNonce();
  const body = new URLSearchParams({ nonce, ...params }).toString();

  const response = await fetch(`${KRAKEN_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "API-Key": apiKey,
      "API-Sign": sign(path, body, nonce, privateKey),
    },
    body,
  });

  const json = (await response.json()) as { error?: string[]; result?: unknown };
  if (json.error && json.error.length > 0) {
    throw new Error(json.error.join("; "));
  }
  return json.result ?? null;
}