import { prisma } from "@/lib/db";

export interface SpamConfig {
  rateLimitPerIp?: {
    maxSubmissions: number;
    windowMinutes: number;
  };
  emailBlocklist?: string[];
  ipBlocklist?: string[];
  recaptchaEnabled?: boolean;
  recaptchaThreshold?: number;
}

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

export function parseSpamConfig(json: string | null): SpamConfig | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as SpamConfig;
  } catch {
    return null;
  }
}

/**
 * Run spam checks against a submission. Checks are run in order:
 * 1. IP blocklist
 * 2. Email blocklist
 * 3. Rate limit by IP
 * 4. reCAPTCHA v3 (if enabled)
 */
export async function checkSpam(params: {
  config: SpamConfig;
  ip: string;
  email?: string;
  campaignId?: string;
  recaptchaToken?: string;
}): Promise<SpamCheckResult> {
  const { config, ip, email, campaignId, recaptchaToken } = params;

  // 1. IP blocklist
  if (config.ipBlocklist && config.ipBlocklist.length > 0) {
    if (config.ipBlocklist.includes(ip)) {
      return { isSpam: true, reason: "ip_blocked" };
    }
  }

  // 2. Email blocklist
  if (config.emailBlocklist && config.emailBlocklist.length > 0 && email) {
    const lowerEmail = email.toLowerCase();
    for (const pattern of config.emailBlocklist) {
      const lowerPattern = pattern.toLowerCase().trim();
      if (!lowerPattern) continue;
      // Exact match or wildcard domain match (e.g., *@spam.com)
      if (lowerPattern.startsWith("*@")) {
        const domain = lowerPattern.slice(2);
        if (lowerEmail.endsWith(`@${domain}`)) {
          return { isSpam: true, reason: "email_blocked" };
        }
      } else if (lowerEmail === lowerPattern) {
        return { isSpam: true, reason: "email_blocked" };
      }
    }
  }

  // 3. Rate limit by IP
  if (config.rateLimitPerIp && ip) {
    const { maxSubmissions, windowMinutes } = config.rateLimitPerIp;
    const windowStart = new Date(
      Date.now() - windowMinutes * 60 * 1000
    );
    const recentCount = await prisma.submission.count({
      where: {
        ipAddress: ip,
        ...(campaignId ? { campaignId } : {}),
        createdAt: { gte: windowStart },
      },
    });
    if (recentCount >= maxSubmissions) {
      return { isSpam: true, reason: "rate_limited" };
    }
  }

  // 4. reCAPTCHA v3
  if (config.recaptchaEnabled && recaptchaToken) {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (secret) {
      const threshold = config.recaptchaThreshold ?? 0.5;
      try {
        const response = await fetch(
          "https://www.google.com/recaptcha/api/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(recaptchaToken)}`,
          }
        );
        const data = (await response.json()) as {
          success: boolean;
          score?: number;
        };
        if (data.success && typeof data.score === "number" && data.score < threshold) {
          return { isSpam: true, reason: "recaptcha_low_score" };
        }
      } catch {
        // reCAPTCHA verification failed — don't block the submission
      }
    }
  }

  return { isSpam: false };
}
