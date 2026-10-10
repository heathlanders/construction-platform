// lib/password-reset.ts — password reset and invite token management
// Uses Redis for single-use tokens with 1-hour TTL.
// Same mechanism for both "Forgot password" and new user invite flows.

import { randomBytes } from 'node:crypto';
import { redis } from './redis.js';

const TOKEN_TTL_SECONDS = 3600; // 1 hour

/**
 * Generate a cryptographically random token and store it in Redis.
 * Invalidates any previous token for the same user.
 * Returns the new token string.
 */
export async function generateResetToken(userId: string, tenantId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');

  // Invalidate any existing token for this user (one active token per user)
  const existingToken = await redis.get(`pwd_reset_user:${tenantId}:${userId}`);
  if (existingToken) {
    await redis.del(`pwd_reset:${existingToken}`);
  }

  await redis.set(`pwd_reset:${token}`, `${userId}:${tenantId}`, 'EX', TOKEN_TTL_SECONDS);
  await redis.set(`pwd_reset_user:${tenantId}:${userId}`, token, 'EX', TOKEN_TTL_SECONDS);

  return token;
}

/**
 * Validate and consume a token.
 * Returns { userId, tenantId } if valid, null if invalid or expired.
 * Tokens are single-use — deleted immediately on consumption.
 */
export async function consumeResetToken(
  token: string,
): Promise<{ userId: string; tenantId: string } | null> {
  const value = await redis.get(`pwd_reset:${token}`);
  if (!value) return null;

  const separatorIdx = value.indexOf(':');
  if (separatorIdx === -1) return null;

  const userId = value.slice(0, separatorIdx);
  const tenantId = value.slice(separatorIdx + 1);
  if (!userId || !tenantId) return null;

  // Consume both keys (single-use)
  await redis.del(`pwd_reset:${token}`);
  await redis.del(`pwd_reset_user:${tenantId}:${userId}`);

  return { userId, tenantId };
}

/**
 * Send a password reset email via SendGrid.
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  tenantSlug: string,
  token: string,
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.info({ email, tenantSlug }, 'password-reset: SendGrid not configured — skipping email');
    return;
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3001';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@constructionplatform.com' },
      subject: 'Reset your ConstructionOS password',
      content: [
        {
          type: 'text/plain',
          value: [
            `Hi ${firstName},`,
            '',
            `You requested a password reset for your ConstructionOS account (${tenantSlug}).`,
            '',
            'Click the link below to set a new password. This link expires in 1 hour.',
            '',
            resetUrl,
            '',
            'If you did not request this, you can safely ignore this email.',
            '',
            'Best,',
            'The ConstructionOS Team',
          ].join('\n'),
        },
      ],
    }),
  });

  if (!res.ok) {
    console.warn({ email, status: res.status }, 'password-reset: SendGrid email failed');
  }
}

/**
 * Send a new user invite email via SendGrid.
 * The invite link reuses the password reset flow — clicking it lets the user set their password.
 */
export async function sendInviteEmail(
  email: string,
  firstName: string,
  tenantSlug: string,
  token: string,
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.info({ email, tenantSlug }, 'invite: SendGrid not configured — skipping email');
    return;
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3001';
  const inviteUrl = `${appUrl}/reset-password?token=${token}`;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@constructionplatform.com' },
      subject: "You've been invited to ConstructionOS",
      content: [
        {
          type: 'text/plain',
          value: [
            `Hi ${firstName},`,
            '',
            `You've been invited to join your team on ConstructionOS (${tenantSlug}).`,
            '',
            'Click the link below to set your password and get started. This link expires in 1 hour.',
            '',
            inviteUrl,
            '',
            'Best,',
            'The ConstructionOS Team',
          ].join('\n'),
        },
      ],
    }),
  });

  if (!res.ok) {
    console.warn({ email, status: res.status }, 'invite: SendGrid email failed');
  }
}

// ─── Homeowner portal magic link (warranty_magic: prefix, 7-day TTL) ─────────

const MAGIC_LINK_TTL_SECONDS = 604800; // 7 days

export async function generateHomeownerMagicLinkToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await redis.set(`warranty_magic:${token}`, userId, 'EX', MAGIC_LINK_TTL_SECONDS);
  return token;
}

export async function consumeHomeownerMagicLinkToken(token: string): Promise<string | null> {
  const key = `warranty_magic:${token}`;
  const userId = await redis.getdel(key); // atomic — single-use even under concurrent exchanges
  return userId || null;
}

export async function sendHomeownerMagicLinkEmail(
  email: string,
  name: string,
  token: string,
  warrantyId: string,
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.info({ email, warrantyId }, 'homeowner-magic-link: SendGrid not configured — skipping');
    return;
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3001';
  const loginUrl = `${appUrl}/homeowner/login?token=${token}`;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@constructionplatform.com' },
      subject: 'Access your Home Warranty Portal',
      content: [
        {
          type: 'text/plain',
          value: [
            `Hi ${name},`,
            '',
            'You have been invited to view your home warranty coverage and submit service requests online.',
            '',
            'Click the link below to access your warranty portal. This link is valid for 7 days.',
            '',
            loginUrl,
            '',
            'If you did not expect this email, you can safely ignore it.',
            '',
            'Best,',
            'The ConstructionOS Team',
          ].join('\n'),
        },
      ],
    }),
  });

  if (!res.ok) {
    console.warn({ email, status: res.status }, 'homeowner-magic-link: SendGrid email failed');
  }
}

// ─── Sub-portal invite magic link (sub_portal_magic: prefix, 7-day TTL) ───────
// P-04 — GC invites a subcontractor who has no account. Token → set password → active.

export async function generateSubPortalMagicLinkToken(userId: string, tenantId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  // Store userId:tenantId so accept can resolve the tenant and read/update under RLS
  // (a raw cross-tenant read on a NOBYPASSRLS pool hits the '' GUC ::uuid error).
  await redis.set(`sub_portal_magic:${token}`, `${userId}:${tenantId}`, 'EX', MAGIC_LINK_TTL_SECONDS);
  return token;
}

export async function consumeSubPortalMagicLinkToken(
  token: string
): Promise<{ userId: string; tenantId: string } | null> {
  const value = await redis.getdel(`sub_portal_magic:${token}`); // atomic — single-use
  if (!value) return null;
  const [userId, tenantId] = value.split(':');
  if (!userId || !tenantId) return null;
  return { userId, tenantId };
}

export async function sendSubPortalInviteEmail(
  email: string,
  firstName: string,
  gcCompanyName: string,
  token: string,
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.info({ email, gcCompanyName }, 'sub-portal-invite: SendGrid not configured — skipping email');
    return;
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3001';
  const acceptUrl = `${appUrl}/sub-portal/accept?token=${token}`;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@constructionplatform.com' },
      subject: `${gcCompanyName} invited you to collaborate on The Jobsite`,
      content: [
        {
          type: 'text/plain',
          value: [
            `Hi ${firstName},`,
            '',
            `${gcCompanyName} has invited you to collaborate on their construction project through The Jobsite Sub Portal — free for you.`,
            '',
            'Click the link below to set your password and get started. This link is valid for 7 days.',
            '',
            acceptUrl,
            '',
            'If you did not expect this email, you can safely ignore it.',
            '',
            'Best,',
            'The Jobsite Team',
          ].join('\n'),
        },
      ],
    }),
  });

  if (!res.ok) {
    console.warn({ email, status: res.status }, 'sub-portal-invite: SendGrid email failed');
  }
}

// ─── Design Studio client invite magic link (client_studio_magic: prefix, 7-day TTL) ──────────
// A contractor invites a client (CLIENT_PORTAL user) to describe a job. Passwordless: the link signs
// them straight in; a contractor re-sends the invite for a fresh link. The token carries the tenant so
// the exchange reads the user under RLS (same reason as sub_portal_magic).

export async function generateClientStudioMagicLinkToken(userId: string, tenantId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await redis.set(`client_studio_magic:${token}`, `${userId}:${tenantId}`, 'EX', MAGIC_LINK_TTL_SECONDS);
  return token;
}

export async function consumeClientStudioMagicLinkToken(token: string): Promise<{ userId: string; tenantId: string } | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  // Atomic read-and-delete: a separate GET + DEL lets two concurrent exchanges (mail-scanner
  // prefetch, a raced replay) both read the value and mint two JWTs from one link.
  const value = await redis.getdel(`client_studio_magic:${token}`);
  if (!value) return null;
  const [userId, tenantId] = value.split(':');
  if (!userId || !tenantId) return null;
  return { userId, tenantId };
}

export async function sendClientStudioInviteEmail(
  email: string, firstName: string, contractorName: string, token: string, lang: 'en' | 'es', tenantSlug?: string,
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.info({ email, contractorName }, 'client-studio-invite: SendGrid not configured — skipping email');
    return;
  }
  const appUrl = process.env.APP_URL ?? 'http://localhost:3001';
  // `t` (tenant slug) lets the landing page offer "email me a new link" if this one is used/expired.
  const link = `${appUrl}/portal/studio/start?token=${token}${tenantSlug ? `&t=${encodeURIComponent(tenantSlug)}` : ''}`;
  const en = [
    `Hi ${firstName},`, '',
    `${contractorName} invited you to describe your project on The Jobsite. Answer a few simple questions, add photos,`,
    'and see a picture of the finished job with a budget range.', '',
    'Open this link to start (valid for 7 days):', link, '',
    'If you did not expect this email, you can ignore it.', '', 'The Jobsite',
  ];
  const es = [
    `Hola ${firstName}:`, '',
    `${contractorName} le invitó a describir su proyecto en The Jobsite. Responda unas preguntas sencillas, agregue fotos`,
    'y vea una imagen del trabajo terminado con un rango de presupuesto.', '',
    'Abra este enlace para comenzar (válido por 7 días):', link, '',
    'Si no esperaba este correo, puede ignorarlo.', '', 'The Jobsite',
  ];
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@constructionplatform.com' },
      subject: lang === 'es' ? `${contractorName} quiere conocer su proyecto` : `${contractorName} wants to hear about your project`,
      content: [{ type: 'text/plain', value: (lang === 'es' ? es : en).join('\n') }],
    }),
  });
  if (!res.ok) console.warn({ email, status: res.status }, 'client-studio-invite: SendGrid email failed');
}
