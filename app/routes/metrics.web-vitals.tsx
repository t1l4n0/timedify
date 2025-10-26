import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import prisma from '~/db.server';
import crypto from 'crypto';

const WebVital = z.object({
  name: z.enum(['INP','CLS','LCP','FCP','TTFB']),
  value: z.number(), // CLS can be < 1, others are in ms
  rating: z.enum(['good','needs-improvement','poor']),
  id: z.string(),
  navigationType: z.string().optional(),
  ts: z.number(),
  path: z.string().optional(),
});

/**
 * Resource route for receiving web vital metrics from the client.
 * Validates payload, pseudonymizes IP address, and stores in database.
 * No PII is stored - only performance metrics and hashed client identifiers.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') return json({ ok: false }, { status: 405 });
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return json({ ok: false }, { status: 415 });
  
  const body = await request.json().catch(() => null);
  const parsed = WebVital.safeParse(body);
  if (!parsed.success) return json({ ok: false }, { status: 400 });

  // Pseudonymize IP address for privacy compliance
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

  await prisma.webVitalEvent.create({
    data: {
      kind: parsed.data.name,
      value: parsed.data.value,
      rating: parsed.data.rating,
      navigationType: parsed.data.navigationType ?? null,
      path: parsed.data.path ?? null,
      clientHash: ipHash,
      ts: new Date(parsed.data.ts),
    },
  });

  return json({ ok: true });
}
