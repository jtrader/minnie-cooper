// Shared AES-256-GCM helper lives in src/lib/secure so every broker integration
// (Kraken, MT5, …) encrypts credentials with the exact same primitive.
export { encryptSecret, decryptSecret } from "@/lib/secure/secret-crypto.server";
