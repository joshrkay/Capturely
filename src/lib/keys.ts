import { randomBytes } from "crypto";

/** Generate a public key: pk_<32 hex chars> */
export function generatePublicKey(): string {
  return `pk_${randomBytes(16).toString("hex")}`;
}

/** Generate a secret key: sk_<32 hex chars> */
export function generateSecretKey(): string {
  return `sk_${randomBytes(16).toString("hex")}`;
}
