import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 60_000; // 60 seconds

function getSecret(): string {
  const secret = process.env.RUNTIME_SIGNING_SECRET;
  if (!secret) {
    throw new Error("RUNTIME_SIGNING_SECRET environment variable is not set");
  }
  return secret;
}

/** Sign a runtime token: base64(payload).base64(hmac) */
export function signToken(publicKey: string): string {
  const payload = JSON.stringify({
    pk: publicKey,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

/** Verify a runtime token. Returns the publicKey if valid, null if invalid/expired. */
export function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");

  // Timing-safe comparison
  const sigBuf = Buffer.from(sig, "base64url");
  const expectedBuf = Buffer.from(expectedSig, "base64url");

  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (!payload.pk || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload.pk as string;
  } catch {
    return null;
  }
}
