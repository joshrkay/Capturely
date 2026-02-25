import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function handleCorsPreflightResponse(origin: string | null): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function validateOrigin(
  origin: string | null,
  publicKey: string
): Promise<{ valid: boolean; site?: { id: string; accountId: string; domain: string } }> {
  if (!origin) {
    return { valid: false };
  }

  // In dev, allow localhost
  if (process.env.NODE_ENV === 'development') {
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        const site = await prisma.site.findUnique({
          where: { publicKey },
          select: { id: true, accountId: true, domain: true },
        });
        if (site) {
          return { valid: true, site };
        }
      }
    } catch {}
  }

  const site = await prisma.site.findUnique({
    where: { publicKey },
    select: { id: true, accountId: true, domain: true },
  });

  if (!site) {
    return { valid: false };
  }

  try {
    const originHost = new URL(origin).hostname;
    const siteDomain = site.domain.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
    if (originHost === siteDomain || originHost.endsWith('.' + siteDomain)) {
      return { valid: true, site };
    }
  } catch {}

  return { valid: false };
}
